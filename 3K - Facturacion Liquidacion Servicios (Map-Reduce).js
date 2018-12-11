/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */

/*require.config({
    paths: {
        '3K/funcionalidadesOV': './3K - Funcionalidades OV'
    }
});*/

define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/format', 'N/runtime', 'N/http', 'N/file', 'N/encode'],
    /**
     * @param {record} record
     */
    function(search, record, email, runtime, error, format, runtime, http, file, encode) {

        function isEmpty(value) {
            if (value === '') {
                return true;
            }

            if (value === null) {
                return true;
            }

            if (value === undefined) {
                return true;
            }
            return false;
        }

        function enviarEmail(autor, destinatario, titulo, mensaje) {
            log.debug('Facturacion Liquidaciones Servicios', 'SUMMARIZE - INICIO ENVIO EMAIL - ID AUTOR : ' + autor + ' - ID DESTINATARIO : ' + destinatario + ' - TITULO : ' + titulo + ' - MENSAJE : ' + mensaje);

            if (!isEmpty(autor) && !isEmpty(destinatario) && !isEmpty(titulo) && !isEmpty(mensaje)) {
                email.send({
                    author: autor,
                    recipients: destinatario,
                    subject: titulo,
                    body: mensaje
                });
            } else {
                var detalleError = 'No se recibio la siguiente informacion necesaria para realizar el envio del Email : ';
                if (isEmpty(autor)) {
                    detalleError = detalleError + ' ID del Autor del Email / ';
                }
                if (isEmpty(destinatario)) {
                    detalleError = detalleError + ' ID del Destinatario del Email / ';
                }
                if (isEmpty(titulo)) {
                    detalleError = detalleError + ' ID del Titulo del Email / ';
                }
                if (isEmpty(mensaje)) {
                    detalleError = detalleError + ' ID del Mensaje del Email / ';
                }
                log.error('Facturacion Liquidaciones Servicios', 'SUMMARIZE - Error Envio Email - Error : ' + detalleError);
            }
            log.debug('Facturacion Liquidaciones Servicios', 'SUMMARIZE - FIN ENVIO EMAIL');
        }

        function handleErrorAndSendNotification(e, stage) {
            log.error('Estado : ' + stage + ' Error', e);

            var author = runtime.getCurrentUser().id;
            var recipients = runtime.getCurrentUser().id;
            var subject = 'Proceso de Facturacion Liquidaciones de Servicios ' + runtime.getCurrentScript().id + ' Error en Estado : ' + stage;
            var body = 'Ocurrio un error con la siguiente informacion : \n' +
                'Codigo de Error: ' + e.name + '\n' +
                'Mensaje de Error: ' + e.message;

            email.send({
                author: author,
                recipients: recipients,
                subject: subject,
                body: body
            });
        }

        function handleErrorIfAny(summary) {
            var inputSummary = summary.inputSummary;
            var mapSummary = summary.mapSummary;
            var reduceSummary = summary.reduceSummary;

            if (inputSummary.error) {
                var e = error.create({
                    name: 'INPUT_STAGE_FAILED',
                    message: inputSummary.error
                });
                handleErrorAndSendNotification(e, 'getInputData');
            }

            handleErrorInStage('map', mapSummary);
            handleErrorInStage('reduce', reduceSummary);
        }

        function handleErrorInStage(stage, summary) {
            var errorMsg = [];
            summary.errors.iterator().each(function(key, value) {
                var msg = 'Error: ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
                errorMsg.push(msg);
                return true;
            });
            if (errorMsg.length > 0) {
                var e = error.create({
                    name: 'ERROR_CUSTOM',
                    message: JSON.stringify(errorMsg)
                });
                handleErrorAndSendNotification(e, stage);
            }
        }

        function getParams() {
            try {
                var informacion = new Object();
                var currScript = runtime.getCurrentScript();
                var st = JSON.stringify(currScript);
                informacion.idRegistrosLiquidacionesProcesar = currScript.getParameter('custscript_generar_liq_id_liq');

                return informacion;
            } catch (excepcion) {
                log.error('Facturacion Liquidaciones Servicios', 'INPUT DATA - Excepcion Obteniendo Parametros - Excepcion : ' + excepcion.message.toString());
                return null;
            }
        }

        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         *
         * @typedef {Object} ObjectRef
         * @property {number} id - Internal ID of the record instance
         * @property {string} type - Record type id
         *
         * @return {Array|Object|Search|RecordRef} inputSummary
         * @since 2015.1
         */
        function getInputData() {

            try {

                log.audit('Facturacion Liquidaciones Servicios', 'INICIO GET INPUT DATA');

                var infProcesar = new Array();
                var direccionGenerica = '';
                var ciudadGenerica = '';

                // INICIO Obtener Parametros
                var informacionProcesar = getParams();
                // FIN Obtener Parametros
                var arrayRegistrosLiquidaciones = new Array();
                if (!isEmpty(informacionProcesar) && !isEmpty(informacionProcesar.idRegistrosLiquidacionesProcesar)) {
                    arrayRegistrosLiquidaciones = informacionProcesar.idRegistrosLiquidacionesProcesar.split(',');
                }

                /*var searchConfig = search.load({
                    id: 'customsearch_3k_configuracion_cupones_ss'
                });

                var resultSearch = searchConfig.run();
                var range = resultSearch.getRange({
                    start: 0,
                    end: 1
                });*/

                //var idArticuloLiquidacion = range[0].getValue({ name: 'custrecord_3k_config_liq_articulo' });
                //var idCuentaIngreso = range[0].getValue({ name: 'custrecord_3k_configcup_cc_fact_com' });
                //var idUbicacion = range[0].getValue({ name: 'custrecord_3k_config_liq_ubicacion' });

                // INICIO - Consultar Cuentas de Facturacion
                var arrayInfoCuentas = new Array();
                var searchInfoCuentas = searchSavedPro('customsearch_3k_config_ctas_cupones');

                if (!isEmpty(searchInfoCuentas) && !searchInfoCuentas.error) {
                    if (!isEmpty(searchInfoCuentas.objRsponseFunction.result) && searchInfoCuentas.objRsponseFunction.result.length > 0) {
                        var resultSet = searchInfoCuentas.objRsponseFunction.result;
                        var resultSearch = searchInfoCuentas.objRsponseFunction.search;
                        for (var q = 0; q < resultSet.length; q++) {
                            var infoCuenta = new Object({});
                            infoCuenta.moneda = resultSet[q].getValue({
                                name: resultSearch.columns[1]
                            });
                            infoCuenta.cuentaFacturacion = resultSet[q].getValue({
                                name: resultSearch.columns[7]
                            });
                            arrayInfoCuentas.push(infoCuenta);
                        }
                    } else {
                        log.error('Facturacion Liquidaciones Servicios', 'INPUT DATA - Error Cuentas de Facturacion de Comisiones');
                        log.audit('Facturacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
                        return null;
                    }
                } else {
                    log.error('Facturacion Liquidaciones Servicios', 'INPUT DATA - Error Cuentas de Facturacion de Comisiones');
                    log.audit('Facturacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
                    return null;
                }
                // FIN - Consultar Cuentas de Facturacion

                //if (!isEmpty(idCuentaIngreso)) {

                    // INICIO - Consultar Subsidiaria Facturacion Electronica
                    var subsidiaria = '';

                    var searchSubsidiaria = search.load({
                        id: 'customsearch_3k_config_sub_fact'
                    });

                    var resultSearchSub = searchSubsidiaria.run();
                    var rangeSub = resultSearchSub.getRange({
                        start: 0,
                        end: 1
                    });


                    var subsidiaria = rangeSub[0].getValue({ name: 'custrecord_3k_config_sub_fact_sub' });


                    // FIN - Consultar Subsidiaria Facturacion Electronica 


                    if (!isEmpty(subsidiaria)) {

                        // INICIO - Consultar Configuracion Facturacion Comisiones
                        /*var idCarpeta = '';

                        var searchConfFact = search.load({
                            id: 'customsearch_3k_config_fact_com'
                        });

                        var resultSearchConfFact = searchConfFact.run();
                        var rangeConfFact = resultSearchConfFact.getRange({
                            start: 0,
                            end: 1
                        });


                        idCarpeta = rangeConfFact[0].getValue({ name: 'custrecord_3k_config_fact_liq_carpeta' });


                        // FIN - Consultar Configuracion Facturacion Comisiones

                        if (!isEmpty(idCarpeta)) {*/

                        // INICIO CONSULTAR DIRECCION GENERICA
                        var searchConfDomicilio = searchSavedPro('customsearch_3k_conf_dom_fact');

                        if (!isEmpty(searchConfDomicilio) && searchConfDomicilio.error == false) {
                            if (!isEmpty(searchConfDomicilio.objRsponseFunction.result) && searchConfDomicilio.objRsponseFunction.result.length > 0) {

                                var resultSet = searchConfDomicilio.objRsponseFunction.result;
                                var resultSearch = searchConfDomicilio.objRsponseFunction.search;

                                direccionGenerica = resultSet[0].getValue({
                                    name: resultSearch.columns[1]
                                });

                                ciudadGenerica = resultSet[0].getValue({
                                    name: resultSearch.columns[2]
                                });

                                // FIN Obtener Domicilio General

                            } else {
                                log.error('Facturacion Liquidaciones Servicios', 'INPUT DATA - Error Consultando Domicilio Generico de Facturacion - Error : No se encontro la Configuracion Generica de Domicilio de Facturacion');
                                log.audit('Facturacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
                                return null;
                            }
                        } else {
                            if (isEmpty(searchConfDomicilio)) {
                                log.error('Facturacion Liquidaciones Servicios', 'INPUT DATA - Error Consultando Domicilio Generico de Facturacion - Error : No se recibio Respuesta del Proceso de Busqueda del Domicilio Generico de Facturacion');
                                log.audit('Facturacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
                                return null;
                            } else {
                                log.error('Facturacion Liquidaciones Servicios', 'INPUT DATA - Error Consultando Domicilio Generico de Facturacion - Error : ' + searchConfDomicilio.tipoError + ' - Descripcion : ' + searchConfDomicilio.descripcion);
                                log.audit('Facturacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
                                return null;
                            }
                        }
                        // FIN CONSULTAR DIRECCION GENERICA

                        if ((!isEmpty(arrayRegistrosLiquidaciones) && arrayRegistrosLiquidaciones.length > 0)) {

                            log.debug('Facturacion Liquidaciones Servicios', 'INPUT DATA - ID Liquidaciones A Procesar : ' + informacionProcesar.idRegistrosLiquidacionesProcesar);

                            if ((!isEmpty(arrayRegistrosLiquidaciones) && arrayRegistrosLiquidaciones.length > 0)) {
                                // INICIO Consultar Liquidaciones A Facturar
                                var liquidacionesPendientes = search.load({
                                    id: 'customsearch_3k_liq_pend_fact_det'
                                });

                                var filtroID = search.createFilter({
                                    name: 'internalid',
                                    operator: search.Operator.ANYOF,
                                    values: arrayRegistrosLiquidaciones
                                });

                                liquidacionesPendientes.filters.push(filtroID);

                                var resultSearch = liquidacionesPendientes.run();
                                var completeResultSet = [];
                                var resultIndex = 0;
                                var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
                                var resultado; // temporary variable used to store the result set

                                do {
                                    // fetch one result set
                                    resultado = resultSearch.getRange({
                                        start: resultIndex,
                                        end: resultIndex + resultStep
                                    });
                                    if (!isEmpty(resultado) && resultado.length > 0) {
                                        if (resultIndex == 0) completeResultSet = resultado;
                                        else completeResultSet = completeResultSet.concat(resultado);
                                    }
                                    // increase pointer
                                    resultIndex = resultIndex + resultStep;
                                    // once no records are returned we already got all of them
                                } while (!isEmpty(resultado) && resultado.length > 0)

                                for (var i = 0; !isEmpty(completeResultSet) && i < completeResultSet.length; i++) {
                                    var obj = new Object();

                                    //obj.idArticuloLiquidacion = idArticuloLiquidacion;
                                    obj.idCuentaIngreso = '';
                                    //obj.idUbicacion = idUbicacion;

                                    obj.idInternoLiquidacion = completeResultSet[i].getValue({
                                        name: resultSearch.columns[0]
                                    });
                                    obj.empresa = completeResultSet[i].getValue({
                                        name: resultSearch.columns[2]
                                    });
                                    /*obj.empresaStr = completeResultSet[i].getText({
                                        name: resultSearch.columns[2]
                                    });*/
                                    obj.moneda = completeResultSet[i].getValue({
                                        name: resultSearch.columns[3]
                                    });

                                    if(!isEmpty(obj.moneda)){
                                            //log.audit('Facturacion Liquidaciones Servicios', 'INFO CUENTAS : ' + JSON.stringify(arrayInfoCuentas));
                                            var objCuentaFacturacion = arrayInfoCuentas.filter(function(objeto) {
                                            return (objeto.moneda == obj.moneda);
                                        });

                                            //log.audit('Facturacion Liquidaciones Servicios', 'RESULT : ' + JSON.stringify(objCuentaFacturacion));

                                        if (!isEmpty(objCuentaFacturacion) && objCuentaFacturacion.length > 0) {
                                            if (!isEmpty(objCuentaFacturacion[0].cuentaFacturacion)) {
                                                obj.idCuentaIngreso = objCuentaFacturacion[0].cuentaFacturacion;
                                            }
                                        }

                                    }

                                    /*obj.monedaStr = completeResultSet[i].getText({
                                        name: resultSearch.columns[3]
                                    });*/
                                    obj.importeFacturacion = completeResultSet[i].getValue({
                                        name: resultSearch.columns[4]
                                    });
                                    obj.sitio = completeResultSet[i].getValue({
                                        name: resultSearch.columns[5]
                                    });
                                    obj.idArticuloLiquidacion = completeResultSet[i].getValue({
                                        name: resultSearch.columns[6]
                                    });

                                    obj.idArchivoLiquidacion = completeResultSet[i].getValue({
                                        name: resultSearch.columns[7]
                                    });

                                    /*obj.fechaUsoCupon = completeResultSet[i].getValue({
                                        name: resultSearch.columns[10]
                                    });

                                    obj.impLiquidacionCupon = completeResultSet[i].getValue({
                                        name: resultSearch.columns[9]
                                    });*/

                                    /*obj.impFacturacionCupon = completeResultSet[i].getValue({
                                        name: resultSearch.columns[8]
                                    });*/

                                    /*obj.impFacturacionCupon = completeResultSet[i].getValue({
                                        name: resultSearch.columns[13]
                                    });

                                    obj.numLiquidacion = completeResultSet[i].getValue({
                                        name: resultSearch.columns[11]
                                    });

                                     obj.impCupon = completeResultSet[i].getValue({
                                        name: resultSearch.columns[12]
                                    });*/

                                    obj.subsidiaria = subsidiaria;

                                    //obj.idCarpeta = idCarpeta;

                                    obj.direccionGenerica = direccionGenerica;

                                    obj.ciudadGenerica = ciudadGenerica;

                                    infProcesar.push(obj);
                                }
                                //  FIN Consultar Liquidaciones A Facturar

                            }


                            log.audit('Facturacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
                            return infProcesar;
                        } else {
                            log.error('Facturacion Liquidaciones Servicios', 'INPUT DATA - Error Obteniendo ID de Liquidaciones A Procesar');
                            log.audit('Facturacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
                            return null;
                        }

                    /*}
                    else{
                         log.error('Facturacion Liquidaciones Servicios', 'INPUT DATA - Error : No se encuentra configurada la Carpeta de Almacenamiento de los Archivos de Liquidaciones');
                        log.audit('Facturacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
                        return null;
                    }*/

                    } else {
                        log.error('Facturacion Liquidaciones Servicios', 'INPUT DATA - Error : No se encuentra configurada la Subsidiaria de Facturacion');
                        log.audit('Facturacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
                        return null;
                    }

                /*} else {
                    var mensaje = 'MAP - No se encuentra configurada la siguiente informacion requerida de la Configuracion de Liquidaciones : ';
                    /*if (!isEmpty(idArticuloLiquidacion)) {
                        mensaje = mensaje + ' Articulo A Utilizar en la Generacion de Facturas de Comisiones / ';
                    }*/
                    /*if (!isEmpty(idCuentaIngreso)) {
                        mensaje = mensaje + ' Cuenta de Liquidaciones A Facturar A Utilizar en la Generacion de Facturas de Comisiones / ';
                    }
                    /*if (!isEmpty(idUbicacion)) {
                        mensaje = mensaje + ' Ubicacion A Utilizar en la Generacion de Facturas de Comisiones / ';
                    }*/
                    /*log.error('Facturacion Liquidaciones Servicios', 'INPUT DATA - Error : ' + mensaje);
                    log.audit('Facturacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
                    return null;*/
                /*}*/

            } catch (excepcion) {
                log.error('Facturacion Liquidaciones Servicios', 'INPUT DATA - Excepcion Obteniendo ID de Liquidaciones A Procesar - Excepcion : ' + excepcion.message.toString());
                log.audit('Facturacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
                return null;
            }

        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {
            /*
             *
             */
            log.audit('Facturacion Liquidaciones Servicios', 'INICIO MAP');

            try {

                var resultado = context.value;

                if (!isEmpty(resultado)) {

                    var searchResult = JSON.parse(resultado);

                    if (!isEmpty(searchResult)) {

                        var fechaServidor = new Date();

                        var fechaLocalString = format.format({
                            value: fechaServidor,
                            type: format.Type.DATETIME,
                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                        });

                        var fechaLocal = format.parse({
                            value: fechaLocalString,
                            type: format.Type.DATETIME,
                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                        });

                        var obj = new Object();

                        obj.idArticuloLiquidacion = searchResult.idArticuloLiquidacion;
                        obj.idCuentaIngreso = searchResult.idCuentaIngreso;
                        obj.idLiquidacion = searchResult.idInternoLiquidacion;
                        obj.empresa = searchResult.empresa;
                        //obj.empresaStr = searchResult.empresaStr;
                        obj.moneda = searchResult.moneda;
                        //obj.monedaStr = searchResult.monedaStr;
                        obj.importeFacturacion = searchResult.importeFacturacion;
                        obj.sitio = searchResult.sitio;
                        obj.fecha = fechaLocal;
                        /*obj.codigoCupon = searchResult.codigoCupon;
                        obj.fechaUsoCupon = searchResult.fechaUsoCupon;
                        obj.impFacturacionCupon = searchResult.impFacturacionCupon;
                        obj.impLiquidacionCupon = searchResult.impLiquidacionCupon;
                        obj.impCupon = searchResult.impCupon;
                        obj.numLiquidacion = searchResult.numLiquidacion;*/
                        obj.subsidiaria = searchResult.subsidiaria;
                        //obj.idCarpeta = searchResult.idCarpeta;
                        obj.direccionGenerica = searchResult.direccionGenerica;
                        obj.ciudadGenerica = searchResult.ciudadGenerica;
                        obj.idArchivoLiquidacion = searchResult.idArchivoLiquidacion;

                        //var clave = obj.sitio + '-' + obj.empresa + '-' + obj.moneda;
                        var clave = obj.idLiquidacion;

                        context.write(clave, JSON.stringify(obj));

                    } else {
                        log.error('Facturacion Liquidaciones Servicios', 'MAP - Error Obteniendo Resultados de ID de Liquidaciones A Procesar');
                    }

                } else {
                    log.error('Facturacion Liquidaciones Servicios', 'MAP - Error Parseando Resultados de ID de Liquidaciones A Procesar');
                }

            } catch (excepcion) {
                log.error('Facturacion Liquidaciones Servicios', 'MAP - Excepcion Procesando ID de Liquidaciones A Procesar - Excepcion : ' + excepcion.message.toString());
            }

            log.audit('Facturacion Liquidaciones Servicios', 'FIN MAP');

        }

        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {
            log.audit('Facturacion Liquidaciones Servicios', 'INICIO REDUCE - KEY : ' + context.key);

            var idFactura = null;
            var idLiquidacion = null;
            var intFileId = null;

            var error = false;
            var mensajeError = '';

            var importeFacturacion = 0;

            var idEmpresa = '';
            var idEmpresaStr = '';
            var idMoneda = '';
            var idMonedaStr = '';
            var fecha = null;
            var idArticuloLiquidacion = '';
            var idCuentaIngreso = '';
            var idSitio = '';
            var idSubsidiaria = '';
            var numLiquidacion = '';
            var idCarpeta = '';
            var direccionGenerica = '';
            var ciudadGenerica = '';

            var RazonsocialCliente = '';

            var idArchivoLiquidacion = '';

            /*var xmlStr = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
                     xmlStr += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
                     xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
                     xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
                     xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
                     xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';
 
                     xmlStr += '<Styles>'
                             + '<Style ss:ID="s63">'
                             + '<Font x:CharSet="204" ss:Size="12" ss:Color="#000000" ss:Bold="1" ss:Underline="Single"/>'
                             + '</Style>' + '</Styles>';
 
                     xmlStr += '<Worksheet ss:Name="Liquidacion">';*/

            if (!isEmpty(context.values) && context.values.length > 0) {
                for (var i = 0; !isEmpty(context.values) && context.values.length > 0 && i < context.values.length && error == false; i++) {

                    var registro = JSON.parse(context.values[i]);

                    if (!isEmpty(registro)) {

                        if (i == 0) {
                            idArticuloLiquidacion = registro.idArticuloLiquidacion;
                            idCuentaIngreso = registro.idCuentaIngreso;
                            idEmpresa = registro.empresa;
                            //idEmpresaStr = registro.empresaStr;
                            idMoneda = registro.moneda;
                            //idMonedaStr = registro.monedaStr;
                            fecha = registro.fecha;
                            idSitio = registro.sitio;
                            idLiquidacion = registro.idLiquidacion;
                            idSubsidiaria = registro.subsidiaria;
                            //numLiquidacion = registro.numLiquidacion;
                            //idCarpeta = registro.idCarpeta;
                            direccionGenerica = registro.direccionGenerica;
                            ciudadGenerica = registro.ciudadGenerica;
                            idArchivoLiquidacion = registro.idArchivoLiquidacion;

                            if (!isEmpty(registro.importeFacturacion) && !isNaN((registro.importeFacturacion))) {
                                importeFacturacion = parseFloat(importeFacturacion, 10) + parseFloat(registro.importeFacturacion, 10);
                            } else {
                                error = true;
                                mensajeError = 'Importe de Liquidacion : ' + registro.importeLiquidacion + ' Invalido';
                            }

                            /*xmlStr += '<Table>'
                             + '<Row>'
                             + '<Cell><Data ss:Type="String"> Cupon </Data></Cell>'
                             + '<Cell><Data ss:Type="String"> Fecha Uso </Data></Cell>'
                             + '<Cell><Data ss:Type="String"> Moneda </Data></Cell>'
                             + '<Cell><Data ss:Type="String"> Importe Cupon </Data></Cell>'
                             + '<Cell><Data ss:Type="String"> Importe Liquidacion </Data></Cell>'
                             + '<Cell><Data ss:Type="String"> Neto Facturacion </Data></Cell>'
                             + '</Row>';*/
                             
                        }

                        /*var codigoCupon = registro.codigoCupon;
                        var fechaUsoCupon = registro.fechaUsoCupon;
                        var impLiquidacionCupon = registro.impLiquidacionCupon;
                        var impFacturacionCupon = registro.impFacturacionCupon;
                        var impCupon = registro.impCupon;

                        xmlStr += '<Row>'
                             + '<Cell><Data ss:Type="String">' + codigoCupon + '</Data></Cell>'
                             + '<Cell><Data ss:Type="String">' + fechaUsoCupon + '</Data></Cell>'
                             + '<Cell><Data ss:Type="String">' + idMonedaStr + '</Data></Cell>'
                             + '<Cell><Data ss:Type="String">' + impCupon + '</Data></Cell>'
                             + '<Cell><Data ss:Type="String">' + impLiquidacionCupon + '</Data></Cell>'
                             + '<Cell><Data ss:Type="String">' + impFacturacionCupon + '</Data></Cell>'
                             + '</Row>';*/

                    } else {
                        error = true;
                        mensajeError = "Error No se Recibio Informacion del registro de Liquidacion para generar la Factura";
                    }
                }

                //xmlStr += '</Table></Worksheet></Workbook>';

            } else {
                error = true;
                mensajeError = "Error No se Recibio Informacion del registro de Liquidacion para generar la FActura";
            }

            if (importeFacturacion > 0) {

                if (error == false && !isEmpty(idSubsidiaria) && !isEmpty(idEmpresa) && !isEmpty(idMoneda) && !isEmpty(idCuentaIngreso) && !isEmpty(idArticuloLiquidacion) && !isEmpty(idSitio) && !isEmpty(idLiquidacion)) {

                    // INICIO GENERAR EXCEL LIQUIDACION
                    /*if(!isEmpty(xmlStr) && !isEmpty(idCarpeta)){
                        var strXmlEncoded = encode.convert({
                             string : xmlStr,
                             inputEncoding : encode.Encoding.UTF_8,
                             outputEncoding : encode.Encoding.BASE_64
                         });
     
                         var objXlsFile = file.create({
                             name : numLiquidacion + '-' + idEmpresaStr + '-' + fecha + '.xls',
                             fileType : file.Type.EXCEL,
                             contents : strXmlEncoded
                         });
                         
                         objXlsFile.folder = idCarpeta;
                         intFileId = objXlsFile.save();
                    }*/

                    // FIN GENERAR EXCEL LIQUIDACION

                    // INICIO GENERAR FACTURA
                    var registroFactura = record.create({
                        type: 'cashsale',
                        isDynamic: true
                    });
                    
                    registroFactura.setValue({
                        fieldId: 'custbody_3k_enviar_email',
                        value: true
                    });

                    registroFactura.setValue({
                        fieldId: 'date',
                        value: fecha
                    });

                    registroFactura.setValue({
                        fieldId: 'entity',
                        value: idEmpresa
                    });

                    registroFactura.setValue({
                        fieldId: 'currency',
                        value: idMoneda
                    });

                    /*registroFactura.setValue({
                        fieldId: 'location',
                        value: idUbicacion
                    });*/

                    registroFactura.setValue({
                        fieldId: 'custbody_cseg_3k_sitio_web_o',
                        value: idSitio
                    });

                    registroFactura.setValue({
                        fieldId: 'account',
                        value: idCuentaIngreso
                    });

                    registroFactura.setValue({
                        fieldId: 'custbody_3k_fact_comision',
                        value: true
                    });

                    registroFactura.setValue({
                        fieldId: 'custbody_3k_liq_asociada',
                        value: idLiquidacion
                    });

                    if(!isEmpty(idArchivoLiquidacion)){

                        registroFactura.setValue({
                            fieldId: 'custbody_3k_arch_liq',
                            value: idArchivoLiquidacion
                        });

                    }

                    registroFactura.selectNewLine({
                        sublistId: 'item'
                    });

                    registroFactura.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: idArticuloLiquidacion
                    });

                    registroFactura.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: 1
                    });

                    registroFactura.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: parseFloat(importeFacturacion, 10).toFixed(2).toString()
                    });

                    registroFactura.commitLine({
                        sublistId: 'item'
                    });
                        
                    RazonsocialCliente = registroFactura.getValue({
                        fieldId: 'custbody_l598_razon_social_cliente'
                    });

                    var tipodocRUT = registroFactura.getValue({
                            fieldId: 'custbody_l598_es_rut'
                        });

                        var tipodocCI = registroFactura.getValue({
                            fieldId: 'custbody_l598_es_ci'
                        });

                        var tipodocDOCTransaccion = registroFactura.getValue({
                            fieldId: 'custbody_l598_tipo_documento'
                        });

                        var numeroDOCTransaccion = registroFactura.getValue({
                            fieldId: 'custbody_l598_nro_documento'
                        });

                        var razonSocialTransaccion = registroFactura.getValue({
                            fieldId: 'custbody_l598_razon_social_cliente'
                        });

                            if (tipodocRUT == true) {
                                if ((isEmpty(tipodocDOCTransaccion) || isEmpty(numeroDOCTransaccion) || isEmpty(razonSocialTransaccion))) {
                                        var mensaje = 'No se recibio la Siguiente Informacion de Facturacion del Cliente : ';
                                        if (isEmpty(tipodocDOCTransaccion)) {
                                            mensaje = mensaje + ' Tipo de Documento / ';
                                        }
                                        if (isEmpty(numeroDOCTransaccion)) {
                                            mensaje = mensaje + ' Numero de Documento / ';
                                        }
                                        if (isEmpty(razonSocialTransaccion)) {
                                            mensaje = mensaje + ' Razon Social / ';
                                        }
                                        error = true;
                                        mensajeError = mensaje + ' - Para realizar la Facturacion';

                                    }
                            }

                            if (tipodocCI == true) {
                                if ((isEmpty(tipodocDOCTransaccion) || isEmpty(numeroDOCTransaccion))) {
                                        var mensaje = 'No se recibio la Siguiente Informacion de Facturacion del Cliente : ';
                                        if (isEmpty(tipodocDOCTransaccion)) {
                                            mensaje = mensaje + ' Tipo de Documento / ';
                                        }
                                        if (isEmpty(numeroDOCTransaccion)) {
                                            mensaje = mensaje + ' Numero de Documento / ';
                                        }

                                        error = true;
                                        mensajeError = mensaje + ' - Para realizar la Facturacion';

                                    }
                            }
                        

                        if (isEmpty(tipodocRUT) || (!isEmpty(tipodocRUT) && tipodocRUT == false)) {
                            registroFactura.setValue({
                                fieldId: 'custbody_l598_trans_eticket',
                                value: true
                            });
                        }

                    try {
                        idFactura = registroFactura.save();
                    } catch (excepcionFact) {
                        error = true;
                        mensajeError = 'Excepcion Generando Factura de Comision - Excepcion : ' + excepcionFact.message.toString();
                    }
                    if (isEmpty(idFactura)) {
                        error = true;
                        mensajeError = 'Error Generando Factura de Comision - Error : No se recibio el ID Interno de la Factura Generada';
                    } else {

                        if (!isEmpty(idFactura)) {

                                var direccion = '';
                                var ciudad = '';

                                // INICIO Obtener Domicilio General

                                var filtrosFACT = new Array();

                                var filtroFactura = new Object();
                                filtroFactura.name = 'internalid';
                                filtroFactura.operator = 'IS';
                                filtroFactura.values = idFactura;
                                filtrosFACT.push(filtroFactura);

                                var searchDomicilio = searchSavedPro('customsearch_3k_direccion_fact', filtrosFACT);

                                if (!isEmpty(searchDomicilio) && searchDomicilio.error == false) {
                                    if (!isEmpty(searchDomicilio.objRsponseFunction.result) && searchDomicilio.objRsponseFunction.result.length > 0) {

                                        var resultSet = searchDomicilio.objRsponseFunction.result;
                                        var resultSearch = searchDomicilio.objRsponseFunction.search;

                                        direccion = resultSet[0].getValue({
                                            name: resultSearch.columns[1]
                                        });

                                        ciudad = resultSet[0].getValue({
                                            name: resultSearch.columns[2]
                                        });

                                    }
                                }

                                if(isEmpty(direccion) || isEmpty(ciudad)){
                                    if(isEmpty(direccion)){
                                        direccion = direccionGenerica;
                                    }
                                    if(isEmpty(ciudad)){
                                        ciudad = ciudadGenerica;
                                    }
                                }

                                var idFactActualizada = record.submitFields({
                                    type: record.Type.CASH_SALE,
                                    id: idFactura,
                                    values: {
                                        billattention: RazonsocialCliente,
                                        billaddr1: direccion,
                                        billcity: ciudad
                                    },
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields: true
                                    }
                                });

                            }

                        /*var arrayFacturas = new Array();
                        arrayFacturas.push(idFactura);
                        respuestaCAE = generarCAE(arrayFacturas,idSubsidiaria); // Generar CAE aca o dejar proceso Automatico para Servicios
                        if (respuestaCAE.error) {
                            error = true;
                            mensajeError = 'Error Generando Factura de Comision - Error : Solicitando CAE - Detalle : ' + JSON.stringify(respuestaCAE);
                        }*/
                    }

                } else {
                    if (error == false) {
                        error = true;
                        var mensaje = 'No se Recibio la Siguiente Informacion requerida del Registro de Liquidacion : ';
                        if (isEmpty(idArticuloLiquidacion)) {
                            mensaje = mensaje + ' Articulo A Utilizar para realizar la Factura de Comision / ';
                        }
                        /*if (isEmpty(idRubro)) {
                            mensaje = mensaje + ' Rubro de la Empresa A realizar la Factura de Comision / ';
                        }*/
                        if (isEmpty(idCuentaIngreso)) {
                            mensaje = mensaje + ' Cuenta de Ingresos A Utilizar para realizar la Factura de Comision / ';
                        }
                        if (isEmpty(idSubsidiaria)) {
                            mensaje = mensaje + ' Subsidiaria para realizar la Facturacion / ';
                        }
                        /*if (isEmpty(idUbicacion)) {
                            mensaje = mensaje + ' Ubicacion A Utilizar para realizar la Factura de Comision / ';
                        }*/
                        if (isEmpty(idSitio)) {
                            mensaje = mensaje + ' Sitio A Utilizar para realizar la Factura de Comision / ';
                        }
                        if (isEmpty(idLiquidacion)) {
                            mensaje = mensaje + ' ID Interno de Liquidaciones A Facturar / ';
                        }
                        if (isEmpty(idEmpresa)) {
                            mensaje = mensaje + ' Empresa / ';
                        }
                        if (isEmpty(idMoneda)) {
                            mensaje = mensaje + ' Moneda / ';
                        }
                        if (isEmpty(fecha)) {
                            mensaje = mensaje + ' Fecha / ';
                        }
                        if (isEmpty(importeFacturacion) || (!isEmpty(importeFacturacion) && importeFacturacion <= 0)) {
                            mensaje = mensaje + ' Importe de Comision';
                        }
                        mensajeError = mensaje;
                    }
                }

                if (!isEmpty(idFactura)) {
                    // INICIO ACTUALIZAR FACTURA EN LIQUIDACIONES
                    try {
                        var idRecLiquidacion = record.submitFields({
                            type: 'customrecord_3k_liquidacion_emp',
                            id: idLiquidacion,
                            values: {
                                custrecord_3k_liq_emp_fact_com: idFactura,
                                custrecord_3k_liq_facturada: true
                            },
                            options: {
                                enableSourcing: true,
                                ignoreMandatoryFields: false
                            }
                        });
                        if (isEmpty(idRecLiquidacion)) {
                            error = true;
                            mensajeError = 'Error Actualizando Liquidacion con ID Interno : ' + idLiquidacion + ' - No se recibio el ID de la Liquidacion Actualizada';
                        }
                    } catch (excepcionLiquidacion) {
                        error = true;
                        mensajeError = 'Excepcion Actualizando Liquidacion con ID Interno : ' + idLiquidacion + ' - Excepcion : ' + excepcionCupon.message.toString();
                    }
                    // FIN ACTUALIZAR FACTURA EN LIQUIDACIONES
                }

            } else {
                error = true;
                mensajeError = "No existe Importe A Facturar";
            }

            // FIN GENERAR FACTURA COMISION

            var respuesta = new Object();
            respuesta.idFactura = idFactura;
            respuesta.idSubsidiaria = idSubsidiaria;
            respuesta.idArchivoLiquidacion = intFileId;
            respuesta.idLiquidacion = idLiquidacion;
            respuesta.error = false;
            respuesta.mensaje = "";

            if (error == true) {
                log.error('Generacion Factura Liquidacion', 'REDUCE - ' + mensajeError);
                respuesta.error = true;
                respuesta.mensaje = mensajeError;
            } else {
                respuesta.mensaje = 'La Factura con ID Interno : ' + idFactura + ' Se genero correctamente Asociada a la Liquidacion : ' + idRecLiquidacion;
            }

            log.audit('Generacion Factura Liquidacion', 'FIN REDUCE - KEY : ' + context.key + ' ID FACTURA GENERADA : ' + idFactura + ' - ID LIQUIDACION GENERADA : ' + idRecLiquidacion);

            context.write(context.key, respuesta);
        }

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {

            var errorGeneral = false;
            var mensajeErrorGeneral = 'El Proceso de Facturacion de Liquidaciones Servicios Finalizo con errores';
            var mensajeOKGeneral = 'El Proceso de Facturacion de Liquidaciones Servicios Finalizo Correctamente';
            var error = false;
            var mensajeError = '';
            var idLog = null;

            var idSubsidiaria='';

            var arrayFacturas = new Array();

            log.audit('Generacion Factura Liquidacion', 'INICIO SUMMARIZE');


            try {

                // INICIO OBTENER CONFIGURACION DE LIQUIDACIONES
                var errorConfiguracionLIQ = false;
                var dominio = '';
                var idRTLog = '';
                var idEstadoFinalizado = '';
                var idEstadoError = '';
                var idEstadoCorrecto = '';

                var mySearch = search.load({
                    id: 'customsearch_3k_config_fact_com'
                });

                var resultSet = mySearch.run();
                var searchResult = resultSet.getRange({
                    start: 0,
                    end: 1
                });

                if (!isEmpty(searchResult) && searchResult.length > 0) {
                    dominio = searchResult[0].getText({
                        name: resultSet.columns[1]
                    });
                    idRTLog = searchResult[0].getValue({
                        name: resultSet.columns[2]
                    });
                    idEstadoFinalizado = searchResult[0].getValue({
                        name: resultSet.columns[3]
                    });
                    idEstadoError = searchResult[0].getValue({
                        name: resultSet.columns[4]
                    });
                    idEstadoCorrecto = searchResult[0].getValue({
                        name: resultSet.columns[5]
                    });

                } else {
                    errorConfiguracionLIQ = true;
                    log.error('Generacion Factura Liquidacion', 'SUMMARIZE - ' + 'No se encuentra realizada la configuracion de las Facturas de Comision');
                }
                // FIN OBTENER CONFIGURACION DE LIQUIDACIONES

                var fechaServidor = new Date();

                var fechaLocalString = format.format({
                    value: fechaServidor,
                    type: format.Type.DATETIME,
                    timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                });

                var fechaLocal = format.parse({
                    value: fechaLocalString,
                    type: format.Type.DATETIME,
                    timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                });


                // INICIO Generar Cabecera Log
                var registroLOG = record.create({
                    type: 'customrecord_3k_gen_fact_com_log'
                });

                registroLOG.setValue({
                    fieldId: 'custrecord_3k_gen_fact_com_log_fecha',
                    value: fechaLocal
                });
                if (!isEmpty(idEstadoFinalizado)) {
                    registroLOG.setValue({
                        fieldId: 'custrecord_3k_gen_fact_com_log_est',
                        value: idEstadoFinalizado
                    });
                }

                try {
                    idLog = registroLOG.save();
                    if (isEmpty(idLog)) {
                        error = true;
                        mensajeError = 'No se recibio el ID del LOG de Factura de Comision Generado';
                    }
                } catch (excepcionLOG) {
                    error = true;
                    mensajeError = 'Excepcion Grabando LOG de Proceso de Generacion de Facturas de Comision - Excepcion : ' + excepcionLOG.message.toString();
                }
                // FIN Generar Cabecera Log
                // INICIO Generar Detalle Log
                if (error == false) {
                    summary.output.iterator().each(function(key, value) {
                        if (error == false) {
                            if (!isEmpty(value)) {
                                var registro = JSON.parse(value);
                                log.debug('Generacion Factura Liquidacion', 'Registro : ' + JSON.stringify(registro));
                                if (!isEmpty(registro)) {
                                    var idEstado = idEstadoCorrecto;
                                    if (registro.error == true) {
                                        errorGeneral = true;
                                        idEstado = idEstadoError;
                                    }

                                    if(!isEmpty(registro.idSubsidiaria)){
                                        idSubsidiaria=registro.idSubsidiaria;
                                    }

                                    var registroDLOG = record.create({
                                        type: 'customrecord_3k_gen_fact_com_logdet'
                                    });

                                    registroDLOG.setValue({
                                        fieldId: 'custrecord_3k_gen_fact_com_logdet_fecha',
                                        value: fechaLocal
                                    });
                                    if (!isEmpty(idEstado)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_fact_com_logdet_est',
                                            value: idEstado
                                        });
                                    }
                                    if (!isEmpty(registro.mensaje)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_fact_com_logdet_desc',
                                            value: registro.mensaje
                                        });
                                    }
                                    if (!isEmpty(registro.idFactura)) {
                                        if(registro.error == false){
                                            arrayFacturas.push(registro.idFactura);
                                        }
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_fact_com_logdet_fcom',
                                            value: registro.idFactura
                                        });
                                    }
                                    if (!isEmpty(registro.idLiquidacion)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_fact_com_logdet_liq',
                                            value: registro.idLiquidacion
                                        });
                                    }
                                    if (!isEmpty(idLog)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_fact_com_logdet_log',
                                            value: idLog
                                        });
                                    }
                                    try {
                                        idDLog = registroDLOG.save();
                                        if (isEmpty(idDLog)) {
                                            error = true;
                                            mensajeError = 'No se recibio el ID del Detalle de LOG de Factura de Comision Generado';
                                        }
                                    } catch (excepcionDLOG) {
                                        error = true;
                                        mensajeError = 'Excepcion Grabando el Detalle de LOG de Proceso de Generacion de Factura de Comision - Excepcion : ' + excepcionDLOG.message.toString();
                                    }
                                } else {
                                    error = true;
                                    mensajeError = 'Error Parseando Informacion de Factura de Comision Generada';
                                }
                            } else {
                                error = true;
                                mensajeError = 'Error Obteniendo Informacion de Factura de Comision Generada';
                            }
                        }
                        return true;
                    });

                        
                        if(!isEmpty(idSubsidiaria) && !isEmpty(arrayFacturas) && arrayFacturas.length>0){
                            var respuestaCAE = generarCAE(arrayFacturas,idSubsidiaria); // Generar CAE aca o dejar proceso Automatico para Servicios
                            if (respuestaCAE.error) {
                                error = true;
                                mensajeError = 'Error Generando Factura de Comision - Error : Solicitando CAE - Detalle : ' + JSON.stringify(respuestaCAE);

                                if (!isEmpty(idLog)) {
                                    var idEstado = idEstadoCorrecto;
                                    if (registro.error == true) {
                                        errorGeneral = true;
                                        idEstado = idEstadoError;
                                    }
                                    var registroDLOG = record.create({
                                        type: 'customrecord_3k_gen_fact_com_logdet'
                                    });

                                    registroDLOG.setValue({
                                        fieldId: 'custrecord_3k_gen_fact_com_logdet_fecha',
                                        value: fechaLocal
                                    });
                                    if (!isEmpty(idEstado)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_fact_com_logdet_est',
                                            value: idEstado
                                        });
                                    }
                                    if (!isEmpty(registro.mensaje)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_fact_com_logdet_desc',
                                            value: mensajeError
                                        });
                                    }

                                    if (!isEmpty(idLog)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_fact_com_logdet_log',
                                            value: idLog
                                        });
                                    }
                                    try {
                                        idDLog = registroDLOG.save();
                                        if (isEmpty(idDLog)) {
                                            error = true;
                                            mensajeError = 'No se recibio el ID del Detalle de LOG de Factura de Comision Generado';
                                        }
                                    } catch (excepcionDLOG) {
                                        error = true;
                                        mensajeError = 'Excepcion Grabando el Detalle de LOG de Proceso de Generacion de Factura de Comision - Excepcion : ' + excepcionDLOG.message.toString();
                                    }
                                }
                            }
                        }
                }
                // FIN Generar Detalle Log

            } catch (excepcion) {

                error = true;
                mensajeError = 'Excepcion Generando LOG de Proceso de Generacion de Factura de Comision - Excepcion : ' + excepcion.message.toString();
            }

            if (error == true) {
                errorGeneral = true;
                log.error('Generacion Factura Liquidacion', 'SUMMARIZE - ' + mensajeError);
            }
            // INICIO Enviar Email Log
            var autor = runtime.getCurrentUser().id;
            var destinatario = autor;
            var mensajeMail = mensajeOKGeneral;
            if (errorGeneral == true) {
                var mensajeMail = mensajeErrorGeneral;
            }
            var link = '';

            if (!isEmpty(idLog) && !isEmpty(dominio) && !isEmpty(idRTLog)) {
                link = 'Puede Observar el Detalle del procesamiento desde el Siguiente link <br> <a href="' + dominio + '/app/common/custom/custrecordentry.nl?rectype=' + idRTLog + '&id=' + idLog + '"> Informacion Proceso </a>'
            } else {
                if (errorConfiguracionLIQ == false) {
                    var informacionFaltante = 'No se pudo generar el Link de Acceso al LOG de la Generacion de las Facturas de Comision debido a que falta la siguiente informacion : ';
                    if (isEmpty(idLog)) {
                        informacionFaltante = informacionFaltante + ' ID del Registro de LOG Generado / ';
                    }
                    if (isEmpty(dominio)) {
                        informacionFaltante = informacionFaltante + ' Configuracion del Dominio de NetSuite en el Panel de Configuracion de Facturas Comisiones / ';
                    }
                    if (isEmpty(idRTLog)) {
                        informacionFaltante = informacionFaltante + ' Configuracion del ID del RecordType de LOG en el Panel de Configuracion de Facturas Comisiones / ';
                    }
                    log.error('Generacion Factura Liquidacion', 'SUMMARIZE - ' + informacionFaltante);
                }
            }

            var titulo = 'Proceso Generacion de Facturas de Comisiones';

            var mensaje = '<html><head></head><body><br>' + mensajeMail + '<br>' + link + '</body></html>';

            enviarEmail(autor, destinatario, titulo, mensaje);
            // FIN Enviar Email Log

            log.audit('Generacion Factura Liquidacion', 'FIN SUMMARIZE');

            handleErrorIfAny(summary);
        }

        function generarCAE(arrayFacturas, subsidiaria) {
            var respuesta = new Object({});
            respuesta.error = false;
            respuesta.msj = "";
            respuesta.detalle = new Array();
            var mensaje;
            try {

                var searchConfig = search.load({
                    id: 'customsearch_3k_config_fact_electronica'
                });

                var resultSearch = searchConfig.run();
                var resultSet = resultSearch.getRange({
                    start: 0,
                    end: 1
                });

                //var array = new Array();

                if (!isEmpty(resultSet) && resultSet.length > 0) {
                    //for (var i = 0; i < resultSet.length; i++) {
                    var obj = new Object({});
                    obj.middlewareURL = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_link' });
                    obj.usuario = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_usuario' });
                    obj.passwordEncriptada = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_pasw_encriptada' });
                    obj.password = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_password' });
                    obj.URLRESTSolicitud = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_url_r_solicitud' });
                    obj.URLRESTActualizacion = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_url_r_actualizar' });
                    obj.URLRESTEmail = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_url_r_env_email' });
                    obj.URLRESTGrabarCabLog = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_url_r_cab_log' });
                    obj.URLRESTGrabarDetLog = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_url_r_det_log' });
                    obj.generarCaeAutomatico = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_generar_cae_auto' });
                    obj.rol = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_rol' });
                    obj.cuenta = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_cuenta' });
                    obj.margenError = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_margen_error_mon' });
                    obj.nombreSistemaFacturacion = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_nom_sist_fact' });
                    obj.razonSocial = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_razon_social' });
                    obj.RUTEmpresa = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_ruc_empresa' });
                    obj.tipoNegocio = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_tipo_negocio' });
                    obj.versionSistFact = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_ver_sist_fact' });
                    obj.RUCEmisor = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_ruc_emisor' });
                    obj.razonSocialEmisor = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_r_social_emisor' });
                    obj.nomComercialEmisor = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_nom_comercial' });
                    obj.giroNegocioEmisor = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_giro_negocio' });
                    obj.correoEmisor = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_correo_elec' });
                    obj.domicilioEmisor = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_domicilio_fiscal' });
                    obj.ciudadEmisor = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_ciudad' });
                    obj.departamentoEmisor = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_departamento' });
                    obj.URLGateway = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_url_gateway' });
                    obj.URLServicioFirma = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_serv_firma_comp' });
                    obj.URLServicioConfFirma = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_url_serv_c_firma' });
                    obj.telefonoEmisor = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_telefono' });
                    obj.emailUsuario = resultSet[0].getValue({ name: 'custrecord_l598_conf_fe_corr_env_email' });

                    //}
                    //
                    /*if (!isEmpty(obj.password)) {
                        var informacionDesencriptada = nlapiDecrypt(password, "aes");
                        if (!isEmpty(informacionDesencriptada)) {
                            obj.password = informacionDesencriptada;
                        } else {
                            obj.password = "";
                        }
                    }*/

                    log.error('generarCAE', 'URU - Generar CAE1');


                    if ((obj.middlewareURL.length != 0 || !isEmpty(obj.middlewareURL)) && !isEmpty(obj.usuario) && !isEmpty(obj.password) &&
                        !isEmpty(obj.URLRESTSolicitud) && !isEmpty(obj.URLRESTActualizacion) && !isEmpty(obj.URLRESTEmail) && !isEmpty(obj.URLRESTGrabarCabLog) &&
                        !isEmpty(obj.URLRESTGrabarDetLog) && !isEmpty(obj.cuenta) && !isEmpty(obj.rol) && obj.rol > 0 && !isEmpty(obj.margenError) &&
                        !isEmpty(obj.nombreSistemaFacturacion) && !isEmpty(obj.razonSocial) && !isEmpty(obj.RUTEmpresa) &&
                        !isEmpty(obj.emailUsuario) && !isEmpty(obj.URLGateway) &&
                        !isEmpty(obj.URLServicioFirma) && !isEmpty(obj.URLServicioConfFirma)) {

                        var url = obj.middlewareURL;

                        var urlSolicitudFinal = null;
                        var urlActualizarFinal = null;
                        var urlEmailFinal = null;
                        var urlLogCabeceraFinal = null;
                        var urlLogDetalleFinal = null;
                        var postStr = null;

                        urlSolicitudFinal = encodeURIComponent(obj.URLRESTSolicitud);
                        urlActualizarFinal = encodeURIComponent(obj.URLRESTActualizacion);
                        urlEmailFinal = encodeURIComponent(obj.URLRESTEmail);
                        urlLogCabeceraFinal = encodeURIComponent(obj.URLRESTGrabarCabLog);
                        urlLogDetalleFinal = encodeURIComponent(obj.URLRESTGrabarDetLog);
                        urlGatewayFinal = encodeURIComponent(obj.URLGateway);
                        urlServicioFirmaFinal = encodeURIComponent(obj.URLServicioFirma);
                        urlServicioConfFirmaFinal = encodeURIComponent(obj.URLServicioConfFirma);

                        var recId = arrayFacturas.toString();
                        recId = recId.replace(/\s+/g, '');

                        postStr = '<?xml version="1.0" encoding="utf-8"?>' +
                            '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
                            '<soap:Body>' +
                            '<URUFESolicitarCAE xmlns="http://tempuri.org/">' +
                            '<idRegistro>' + recId + '</idRegistro>' +
                            '<usuario>' + obj.usuario + '</usuario>' +
                            '<password>' + obj.password + '</password>' +
                            '<cuenta>' + obj.cuenta + '</cuenta>' +
                            '<subsidiaria>' + subsidiaria + '</subsidiaria>' +
                            '<urlSolicitud>' + urlSolicitudFinal + '</urlSolicitud>' +
                            '<urlActualizar>' + urlActualizarFinal + '</urlActualizar>' +
                            '<rol>' + obj.rol + '</rol>' +
                            '<emailUsuario>' + obj.emailUsuario + '</emailUsuario>' +
                            '<urlEmail>' + urlEmailFinal + '</urlEmail>' +
                            '<urlActualizarCabLOG>' + urlLogCabeceraFinal + '</urlActualizarCabLOG>' +
                            '<urlActualizarDetLOG>' + urlLogDetalleFinal + '</urlActualizarDetLOG>' +
                            '<margenError>' + obj.margenError + '</margenError>' +
                            '<tipoNegocio>' + obj.tipoNegocio + '</tipoNegocio>' +
                            '<nomSistFact>' + obj.nombreSistemaFacturacion + '</nomSistFact>' +
                            '<razonSocial>' + obj.razonSocial + '</razonSocial>' +
                            '<RUTEmpresa>' + obj.RUTEmpresa + '</RUTEmpresa>' +
                            '<versionSistFact>' + obj.versionSistFact + '</versionSistFact>' +
                            '<RUCEmisor>' + obj.RUCEmisor + '</RUCEmisor>' +
                            '<razonSocialEmisor>' + obj.razonSocialEmisor + '</razonSocialEmisor>' +
                            '<nomComercialEmisor>' + obj.nomComercialEmisor + '</nomComercialEmisor>' +
                            '<giroNegocioEmisor>' + obj.giroNegocioEmisor + '</giroNegocioEmisor>' +
                            '<correoEmisor>' + obj.correoEmisor + '</correoEmisor>' +
                            '<domicilioEmisor>' + obj.domicilioEmisor + '</domicilioEmisor>' +
                            '<ciudadEmisor>' + obj.ciudadEmisor + '</ciudadEmisor>' +
                            '<departamentoEmisor>' + obj.departamentoEmisor + '</departamentoEmisor>' +
                            '<telefonoEmisor>' + obj.telefonoEmisor + '</telefonoEmisor>' +
                            '<urlGateway>' + urlGatewayFinal + '</urlGateway>' +
                            '<urlServicioFirma>' + urlServicioFirmaFinal + '</urlServicioFirma>' +
                            '<urlServicioConfFirma>' + urlServicioConfFirmaFinal + '</urlServicioConfFirma>' +
                            '</URUFESolicitarCAE>' +
                            '</soap:Body>' +
                            '</soap:Envelope>';

                        var header = new Array();
                        header['Content-Type'] = 'text/xml; charset=utf-8';

                        //var response = nlapiRequestURL(url, postStr, header);

                        log.error('generarCAE', 'URU - Generar CAE2 - Info : ' + postStr);

                        var response = http.post({
                            //method: http.Method.GET,
                            url: url,
                            body: postStr,
                            headers: header
                        });

                        log.error('generarCAE', 'URU - Generar CAE3');

                        var mensajeAdicional = '';
                        var errorEnvio = true;

                        if (!isEmpty(response)) {
                            log.error('generarCAE', 'URU - Generar CAE - Codigo : ' + response.code);
                            if (response.code == 200) { // OK
                                if (response.body != '') {
                                    mensaje = response.body;
                                    log.error('generarCAE', 'URU - Generar CAE - Mensaje : ' + mensaje);
                                    if (!isEmpty(mensaje) && mensaje.length > 0) {

                                        var posicionInicialRespuesta = (mensaje.indexOf("-INICIORESPUESTAFE-"));
                                        var posicionFinalRespuesta = (mensaje.indexOf("-INICIORESPUESTAFE-"));

                                        if (!isEmpty(posicionInicialRespuesta) && !isNaN(posicionInicialRespuesta) && parseInt(posicionInicialRespuesta, 10) > 0) {
                                            if (!isEmpty(posicionFinalRespuesta) && !isNaN(posicionFinalRespuesta) && parseInt(posicionFinalRespuesta, 10) > 0 && posicionFinalRespuesta < mensaje.length) {
                                                var error = mensaje[posicionInicialRespuesta + 19];
                                                if (!isEmpty(error)) {
                                                    if (error == 'N')
                                                        errorEnvio = false;
                                                    else {
                                                        var mensajeAux = mensaje.substr((posicionInicialRespuesta + 21), (posicionFinalRespuesta - (posicionInicialRespuesta + 21)));
                                                        if (!isEmpty(mensajeAux)) {
                                                            mensajeAdicional = mensajeAux;
                                                        } else {
                                                            mensajeAdicional = "Error de Conexion Con el Middleware TAFACE";
                                                        }
                                                    }
                                                } else {
                                                    mensajeAdicional = "No se recibio informacion del estado de Conexion Con el Middleware TAFACE en la Respuesta";
                                                }

                                            } else {
                                                mensajeAdicional = "No se recibio informacion de Respuesta Final de Conexion Con el Middleware TAFACE";
                                            }
                                        } else {
                                            mensajeAdicional = "No se recibio informacion de Respuesta Inicial de Conexion Con el Middleware TAFACE";
                                        }
                                    } else {
                                        mensajeAdicional = "El cuerpo de la respuesta de Conexion Con el Middleware TAFACE recibida fue vacio";
                                    }
                                } else {
                                    mensajeAdicional = "No se recibio el cuerpo de la Respuesta de Conexion Con el Middleware TAFACE";
                                }
                            } else {
                                mensajeAdicional = "Error de Conexion Con el Middleware TAFACE - Codigo Error : " + response.getCode();
                            }
                        } else {
                            mensajeAdicional = "No se recibio Respuesta de Conexion Con el Middleware TAFACE";
                        }

                        if (errorEnvio) {

                            mensaje = 'Error Conectando con Servicio de Generacion de CAE - ';
                            mensaje = mensaje + mensajeAdicional;
                            log.error('generarCAE', 'URU - Generar CAE' + mensaje);
                            objrespuestaParcial = new Object();
                            objrespuestaParcial.codigo = 'RFAC004';
                            objrespuestaParcial.mensaje = mensaje;
                            respuesta.detalle.push(objrespuestaParcial);
                            //respuesta.msj = mensaje;
                            //respuesta.tipoError = 'RFAC004';
                            respuesta.error = true;
                            return respuesta;
                        }


                    } else {
                        //No se encuentran Configurados Campos Requeridos del Middleware de Factura Electronica
                        mensaje = 'No se encuentran Configurados los siguientes Campos Requeridos de la Configuracion del Middleware de Factura Electronica : ';

                        if ((obj.middlewareURL.length == 0 || isEmpty(obj.middlewareURL)))
                            mensaje = mensaje + "URL del Middleware de Factura Electronica / ";
                        if (isEmpty(obj.usuario))
                            mensaje = mensaje + "Usuario Para la conexion con el Middleware de Factura Electronica / ";
                        if (isEmpty(obj.password))
                            mensaje = mensaje + "Password Para la conexion con el Middleware de Factura Electronica / ";
                        if (isEmpty(obj.emailUsuario))
                            mensaje = mensaje + "Email del Usuario / ";
                        if (isEmpty(obj.URLRESTSolicitud))
                            mensaje = mensaje + "URL del RestLet utilizado para la Solicitud de las Transacciones / ";
                        if (isEmpty(obj.URLRESTActualizacion))
                            mensaje = mensaje + "URL del RestLet utilizado para la Actualizacion de las Transacciones / ";
                        if (isEmpty(obj.URLRESTEmail))
                            mensaje = mensaje + "URL del RestLet utilizado para el Envio del Email de la Finalizacion del Proceso / ";
                        if (isEmpty(obj.URLRESTGrabarCabLog))
                            mensaje = mensaje + "URL del RestLet utilizado para Grabar la Cabecera del Log / ";
                        if (isEmpty(obj.URLRESTGrabarDetLog))
                            mensaje = mensaje + "URL del RestLet utilizado para Grabar el Detalle del Log / ";
                        if (isEmpty(obj.cuenta))
                            mensaje = mensaje + "Cuenta de NetSuite / ";
                        if (obj.rol == null || obj.rol == 0)
                            mensaje = mensaje + "Rol del Usuario utilizado Para la conexion con el Middleware de Factura Electronica / ";
                        if (isEmpty(obj.margenError))
                            mensaje = mensaje + "Monto de Margen de Error Permitido para enviar la Transaccion a la DGI / ";
                        if (isEmpty(obj.nombreSistemaFacturacion))
                            mensaje = mensaje + "Nombre del Sistema de Facturacion / ";
                        if (isEmpty(obj.razonSocial))
                            mensaje = mensaje + "Razon Social de la Empresa / ";
                        if (isEmpty(obj.RUTEmpresa))
                            mensaje = mensaje + "RUT de la Empresa / ";
                        if (isEmpty(obj.URLGateway))
                            mensaje = mensaje + "Direccion URL del Gateway / ";
                        if (isEmpty(obj.URLServicioFirma))
                            mensaje = mensaje + "Direccion URL del WebService de Firma de Comprobantes / ";
                        if (isEmpty(obj.URLServicioConfFirma))
                            mensaje = mensaje + "Direccion URL del WebService de Confirmacion de Firma de Comprobantes / ";

                        log.error('generarCAE', 'URU - Generar CAE' + mensaje);
                        objrespuestaParcial = new Object();
                        objrespuestaParcial.codigo = 'RFAC005';
                        objrespuestaParcial.mensaje = mensaje;
                        respuesta.detalle.push(objrespuestaParcial);
                        //respuesta.msj = mensaje;
                        respuesta.error = true;
                        //respuesta.tipoError = 'RFAC005';
                        return respuesta;
                    }
                } else {
                    //No Se Encuentra configurado el Middleware de Factura Electronica
                    mensaje = 'No Se Encuentra configurado el Middleware de Factura Electronica';

                    log.error('generarCAE', 'URU - Generar CAE' + mensaje);
                    objrespuestaParcial = new Object();
                    objrespuestaParcial.codigo = 'RFAC006';
                    objrespuestaParcial.mensaje = mensaje;
                    respuesta.detalle.push(objrespuestaParcial);
                    //respuesta.msj = mensaje;
                    respuesta.error = true;
                    //respuesta.tipoError = 'RFAC006';
                    return respuesta;
                }

            } catch (e) {
                mensaje = "Excepcion Invocando al Middleware TA-FACE para en Envio de las Transacciones A Procesar - Excepcion : " + e.message;
                log.error('generarCAE', 'URU - Generar CAE' + mensaje);
                objrespuestaParcial = new Object();
                objrespuestaParcial.codigo = 'RFAC007';
                objrespuestaParcial.mensaje = mensaje;
                respuesta.detalle.push(objrespuestaParcial);
                //respuesta.msj = mensaje;
                respuesta.error = true;
                //respuesta.tipoError = 'RFAC007';
                return respuesta;
            }

            return respuesta;
        }

        function searchSavedPro(idSavedSearch, arrayParams) {
            var objRespuesta = new Object();
            objRespuesta.error = false;
            try {
                var savedSearch = search.load({
                    id: idSavedSearch
                });

                if (!isEmpty(arrayParams) && arrayParams.length > 0) {

                    for (var i = 0; i < arrayParams.length; i++) {
                        var nombre = arrayParams[i].name;
                        arrayParams[i].operator = operadorBusqueda(arrayParams[i].operator);
                        var join = arrayParams[i].join;
                        if (isEmpty(join)) {
                            join = null;
                        }
                        var value = arrayParams[i].values;
                        if (!Array.isArray(value)) {
                            value = [value];
                        }
                        var filtroID='';
                        if(!isEmpty(join)){
                            filtroID = search.createFilter({
                                name: nombre,
                                operator: arrayParams[i].operator,
                                join: join,
                                values: value
                            });
                        }
                        else{
                            filtroID = search.createFilter({
                                name: nombre,
                                operator: arrayParams[i].operator,
                                values: value
                            });
                        }
                        savedSearch.filters.push(filtroID);
                    }
                }
                var resultSearch = savedSearch.run();
                var completeResultSet = [];
                var resultIndex = 0;
                var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
                var resultado; // temporary variable used to store the result set

                do {
                    // fetch one result set
                    resultado = resultSearch.getRange({
                        start: resultIndex,
                        end: resultIndex + resultStep
                    });
                    if (!isEmpty(resultado) && resultado.length > 0) {
                        if (resultIndex == 0) completeResultSet = resultado;
                        else completeResultSet = completeResultSet.concat(resultado);
                    }
                    // increase pointer
                    resultIndex = resultIndex + resultStep;
                    // once no records are returned we already got all of them
                } while (!isEmpty(resultado) && resultado.length > 0)
                objRsponseFunction = new Object();
                objRsponseFunction.result = completeResultSet;
                objRsponseFunction.search = resultSearch;
                var r = armarArreglosSS(completeResultSet, resultSearch);
                objRsponseFunction.array = r.array;
                objRespuesta.objRsponseFunction = objRsponseFunction;
            } catch (e) {
                objRespuesta.error = true;
                objRespuesta.tipoError = 'RORV007';
                objRespuesta.descripcion = 'function searchSavedPro: ' + e.message;
                log.error('RORV007', 'function searchSavedPro: ' + e.message);
            }
            return objRespuesta;
        }

        function armarArreglosSS(resultSet, resultSearch) {
            var array = [];
            var respuesta = new Object({});
            respuesta.error = false;
            respuesta.msj = "";
            //log.debug('armarArreglosSS', 'resultSet: ' + JSON.stringify(resultSet));
            //log.debug('armarArreglosSS', 'resultSearch: ' + JSON.stringify(resultSearch));
            try {

                for (var i = 0; i < resultSet.length; i++) {
                    var obj = new Object({});
                    obj.indice = i;
                    for (var j = 0; j < resultSearch.columns.length; j++) {
                        var nombreColumna = resultSearch.columns[j].name;
                        //log.debug('armarArreglosSS','nombreColumna inicial: '+ nombreColumna);
                        if (nombreColumna.indexOf("formula") !== -1 || !isEmpty(resultSearch.columns[j].join)) {
                            nombreColumna = resultSearch.columns[j].label;

                            //if (nombreColumna.indexOf("Formula"))
                        }
                        //log.debug('armarArreglosSS','nombreColumna final: '+ nombreColumna);
                        if (Array.isArray(resultSet[i].getValue({ name: resultSearch.columns[j] }))) {
                            //log.debug('armarArreglosSS', 'resultSet[i].getValue({ name: nombreColumna }): ' + JSON.stringify(resultSet[i].getValue({ name: nombreColumna })));
                            var a = resultSet[i].getValue({ name: resultSearch.columns[j] });
                            //log.debug('armarArreglosSS', 'a: ' + JSON.stringify(a));
                            obj[nombreColumna] = a[0].value;
                        } else {
                            //log.debug('armarArreglosSS', 'resultSet[i].getValue({ name: nombreColumna }): ' + JSON.stringify(resultSet[i].getValue({ name: nombreColumna })));
                            obj[nombreColumna] = resultSet[i].getValue({ name: resultSearch.columns[j] });
                        }

                        /*else {

                            if (Array.isArray(resultSet[i].getValue({ name: nombreColumna }))) {
                                //log.debug('armarArreglosSS', 'resultSet[i].getValue({ name: nombreColumna }): ' + JSON.stringify(resultSet[i].getValue({ name: nombreColumna })));
                                var a = resultSet[i].getValue({ name: nombreColumna });
                                //log.debug('armarArreglosSS', 'a: ' + JSON.stringify(a));
                                obj[nombreColumna] = a[0].value;
                            } else {
                                //log.debug('armarArreglosSS', 'resultSet[i].getValue({ name: nombreColumna }): ' + JSON.stringify(resultSet[i].getValue({ name: nombreColumna })));
                                obj[nombreColumna] = resultSet[i].getValue({ name: nombreColumna });
                            }
                        }*/
                    }
                    //log.debug('armarArreglosSS', 'obj: ' + JSON.stringify(obj));
                    array.push(obj);
                }
                //log.debug('armarArreglosSS', 'arrayArmado cantidad: ' + array.length);
                respuesta.array = array;

            } catch (e) {
                respuesta.error = true;
                respuesta.tipoError = "RARR001";
                respuesta.msj = "Excepción: " + e;
                log.error('RARR001', 'armarArreglosSS Excepción: ' + e);
            }

            return respuesta;
        }

        function operadorBusqueda(operadorString) {
            var operator = '';
            switch (operadorString) {

                case 'IS':
                    operator = search.Operator.IS;
                    break;

                case 'AFTER':
                    operator = search.Operator.AFTER;
                    break;

                case 'ALLOF':
                    operator = search.Operator.ALLOF;
                    break;

                case 'ANY':
                    operator = search.Operator.ANY;
                    break;
                case 'ANYOF':
                    operator = search.Operator.ANYOF;
                    break;

                case 'BEFORE':
                    operator = search.Operator.BEFORE;
                    break;

                case 'BETWEEN':
                    operator = search.Operator.BETWEEN;
                    break;

                case 'CONTAINS':
                    operator = search.Operator.CONTAINS;
                    break;

                case 'DOESNOTCONTAIN':
                    operator = search.Operator.DOESNOTCONTAIN;
                    break;

                case 'DOESNOTSTARTWITH':
                    operator = search.Operator.DOESNOTSTARTWITH;
                    break;

                case 'EQUALTO':
                    operator = search.Operator.EQUALTO;
                    break;

                case 'GREATERTHAN':
                    operator = search.Operator.GREATERTHAN;
                    break;

                case 'GREATERTHANOREQUALTO':
                    operator = search.Operator.GREATERTHANOREQUALTO;
                    break;

                case 'HASKEYWORDS':
                    operator = search.Operator.HASKEYWORDS;
                    break;

                case 'ISEMPTY':
                    operator = search.Operator.ISEMPTY;
                    break;

                case 'ISNOT':
                    operator = search.Operator.ISNOT;
                    break;

                case 'ISNOTEMPTY':
                    operator = search.Operator.ISNOTEMPTY;
                    break;

                case 'LESSTHAN':
                    operator = search.Operator.LESSTHAN;
                    break;

                case 'LESSTHANOREQUALTO':
                    operator = search.Operator.LESSTHANOREQUALTO;
                    break;

                case 'NONEOF':
                    operator = search.Operator.NONEOF;
                    break;

                case 'NOTAFTER':
                    operator = search.Operator.NOTAFTER;
                    break;

                case 'NOTALLOF':
                    operator = search.Operator.NOTALLOF;
                    break;

                case 'NOTBEFORE':
                    operator = search.Operator.NOTBEFORE;
                    break;

                case 'NOTBETWEEN':
                    operator = search.Operator.NOTBETWEEN;
                    break;

                case 'NOTEQUALTO':
                    operator = search.Operator.NOTEQUALTO;
                    break;

                case 'NOTGREATERTHAN':
                    operator = search.Operator.NOTGREATERTHAN;
                    break;

                case 'NOTGREATERTHANOREQUALTO':
                    operator = search.Operator.NOTGREATERTHANOREQUALTO;
                    break;

                case 'NOTLESSTHAN':
                    operator = search.Operator.NOTLESSTHAN;
                    break;

                case 'NOTLESSTHANOREQUALTO':
                    operator = search.Operator.NOTLESSTHANOREQUALTO;
                    break;

                case 'NOTON':
                    operator = search.Operator.NOTON;
                    break;

                case 'NOTONORAFTER':
                    operator = search.Operator.NOTONORAFTER;
                    break;

                case 'NOTONORBEFORE':
                    operator = search.Operator.NOTONORBEFORE;
                    break;

                case 'NOTWITHIN':
                    operator = search.Operator.NOTWITHIN;
                    break;

                case 'ON':
                    operator = search.Operator.ON;
                    break;

                case 'ONORAFTER':
                    operator = search.Operator.ONORAFTER;
                    break;

                case 'ONORBEFORE':
                    operator = search.Operator.ONORBEFORE;
                    break;

                case 'STARTSWITH':
                    operator = search.Operator.STARTSWITH;
                    break;

                case 'WITHIN':
                    operator = search.Operator.WITHIN;
                    break;


            }
            return operator;
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });

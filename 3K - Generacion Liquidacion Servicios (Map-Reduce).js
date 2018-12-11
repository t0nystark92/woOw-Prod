/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */

/*require.config({
baseUrl: '/SuiteScripts',
paths: {
'3K/utilities' : '/SuiteScripts/3K - Utilities'
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
            log.debug('Generacion Liquidaciones Servicios', 'SUMMARIZE - INICIO ENVIO EMAIL - ID AUTOR : ' + autor + ' - ID DESTINATARIO : ' + destinatario + ' - TITULO : ' + titulo + ' - MENSAJE : ' + mensaje);

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
                log.error('Generacion Liquidaciones Servicios', 'SUMMARIZE - Error Envio Email - Error : ' + detalleError);
            }
            log.debug('Generacion Liquidaciones Servicios', 'SUMMARIZE - FIN ENVIO EMAIL');
        }

        function handleErrorAndSendNotification(e, stage) {
            log.error('Estado : ' + stage + ' Error', e);

            var author = runtime.getCurrentUser().id;
            var recipients = runtime.getCurrentUser().id;
            var subject = 'Proceso de Generacion Liquidaciones de Servicios ' + runtime.getCurrentScript().id + ' Error en Estado : ' + stage;
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
                informacion.idRegistrosCuponesProcesar = currScript.getParameter('custscript_generar_liq_id_cup');
                informacion.idRegistrosAjustesProcesar = currScript.getParameter('custscript_generar_liq_id_aju');
                informacion.fechaCorte = currScript.getParameter('custscript_generar_liq_fecha_corte');
                //log.error('Generacion Liquidaciones Servicios', 'INPUT DATA - Fecha Corte : ' + informacion.fechaCorte);

                return informacion;
            } catch (excepcion) {
                log.error('Generacion Liquidaciones Servicios', 'INPUT DATA - Excepcion Obteniendo Parametros - Excepcion : ' + excepcion.message.toString());
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

                var orden = 1;

                log.audit('Generacion Liquidaciones Servicios', 'INICIO GET INPUT DATA');

                var infProcesar = new Array();

                // INICIO Obtener Parametros
                var informacionProcesar = getParams();
                // FIN Obtener Parametros
                var arrayRegistrosCupones = new Array();
                if (!isEmpty(informacionProcesar) && !isEmpty(informacionProcesar.idRegistrosCuponesProcesar)) {
                    arrayRegistrosCupones = informacionProcesar.idRegistrosCuponesProcesar.split(',');
                }
                var arrayRegistrosAjustes = new Array();
                if (!isEmpty(informacionProcesar) && !isEmpty(informacionProcesar.idRegistrosAjustesProcesar)) {
                    arrayRegistrosAjustes = informacionProcesar.idRegistrosAjustesProcesar.split(',');
                }

                var fechaCorte = informacionProcesar.fechaCorte;

                // INICIO - Consultar Configuracion Facturacion Comisiones
                var idCarpeta = '';

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

                if (!isEmpty(idCarpeta)) {

                    /*var searchConfig = search.load({
                        id: 'customsearch_3k_config_liquidaciones'
                    });

                    var resultSearch = searchConfig.run();
                    var range = resultSearch.getRange({
                        start: 0,
                        end: 1
                    });

                    var idArticuloLiquidacion = range[0].getValue({ name: 'custrecord_3k_config_liq_articulo' });
                    var idCuentaIngreso = range[0].getValue({ name: 'custrecord_3k_config_liq_cuenta_ingreso' });
                    var idUbicacion = range[0].getValue({ name: 'custrecord_3k_config_liq_ubicacion' });
                    var monedaLocal = range[0].getValue({ name: 'custrecord_3k_config_liq_mon_local' });
                    var factMonedaLocal = range[0].getValue({ name: 'custrecord_3k_config_liq_fact_m_local' });*/

                    //if (!isEmpty(idArticuloLiquidacion) && !isEmpty(idCuentaIngreso) && !isEmpty(idUbicacion) && (factMonedaLocal != true || (factMonedaLocal == true && !isEmpty(monedaLocal)))) {

                    if ((!isEmpty(arrayRegistrosCupones) && arrayRegistrosCupones.length > 0) || (!isEmpty(arrayRegistrosAjustes) && arrayRegistrosAjustes.length > 0)) {

                        log.debug('Generacion Liquidaciones Servicios', 'INPUT DATA - ID Cupones A Procesar : ' + informacionProcesar.idRegistrosCuponesProcesar);

                        var rangoInicial = 0;
                        var rangoSalto = 1000;

                        var completeResultSet = [];

                        if ((!isEmpty(arrayRegistrosCupones) && arrayRegistrosCupones.length > 0)) {

                            do {
                                // fetch one result set
                                var indiceFinal = (rangoInicial + rangoSalto);
                                if (arrayRegistrosCupones.length <= indiceFinal) {
                                    indiceFinal = arrayRegistrosCupones.length;
                                }

                                log.debug('Generacion Liquidaciones Servicios', 'Indice Final : ' + indiceFinal + ' - LENGTH : ' + arrayRegistrosCupones.length);

                                var resultadoParcial = arrayRegistrosCupones.slice(rangoInicial, indiceFinal);
                                if (!isEmpty(resultadoParcial) && resultadoParcial.length > 0) {

                                    // INICIO Consultar Cupones A Liquidar
                                    var cuponesPendientes = search.load({
                                        id: 'customsearch_3k_cupones_pend_liq'
                                    });

                                    var filtroID = search.createFilter({
                                        name: 'internalid',
                                        operator: search.Operator.ANYOF,
                                        values: resultadoParcial
                                    });

                                    log.debug('Generacion Liquidaciones Servicios', 'RESULT PARCIAL : ' + JSON.stringify(resultadoParcial));

                                    cuponesPendientes.filters.push(filtroID);

                                    var resultSearch = cuponesPendientes.run();
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
                                            if (rangoInicial == 0) completeResultSet = resultado;
                                            else completeResultSet = completeResultSet.concat(resultado);
                                        }
                                        // increase pointer
                                        resultIndex = resultIndex + resultStep;
                                        // once no records are returned we already got all of them
                                    } while (!isEmpty(resultado) && resultado.length > 0)
                                    rangoInicial = rangoInicial + rangoSalto;
                                }
                            } while (!isEmpty(resultadoParcial) && resultadoParcial.length > 0 && arrayRegistrosCupones.length > indiceFinal)

                            for (var i = 0; !isEmpty(completeResultSet) && i < completeResultSet.length; i++) {
                                var obj = new Object();

                                /*obj.idArticuloLiquidacion=idArticuloLiquidacion;
                                obj.idCuentaIngreso=idCuentaIngreso;
                                obj.idUbicacion=idUbicacion;*/

                                obj.idInternoAjuste = '';
                                obj.idInternoCupon = completeResultSet[i].getValue({
                                    name: resultSearch.columns[0]
                                });
                                obj.empresa = completeResultSet[i].getValue({
                                    name: resultSearch.columns[2]
                                });
                                obj.empresaStr = completeResultSet[i].getText({
                                    name: resultSearch.columns[2]
                                });

                                obj.campanaStr = completeResultSet[i].getText({
                                    name: resultSearch.columns[18]
                                });

                                obj.simboloMonedaStr = completeResultSet[i].getValue({
                                    name: resultSearch.columns[19]
                                });

                                obj.estadoStr = completeResultSet[i].getText({
                                    name: resultSearch.columns[20]
                                });

                                obj.cupon = completeResultSet[i].getValue({
                                    name: resultSearch.columns[3]
                                });
                                /*obj.moneda = completeResultSet[i].getValue({
                                    name: resultSearch.columns[4]
                                });*/
                                obj.moneda = completeResultSet[i].getValue({
                                    name: resultSearch.columns[13]
                                });
                                obj.monedaStr = completeResultSet[i].getText({
                                    name: resultSearch.columns[13]
                                });
                                obj.tipoCambio = completeResultSet[i].getValue({
                                    name: resultSearch.columns[5]
                                });
                                /*if (factMonedaLocal == true) {
                                    obj.moneda = monedaLocal;
                                    obj.tipoCambio = 1;
                                }*/
                                obj.importeCupon = completeResultSet[i].getValue({
                                    name: resultSearch.columns[6]
                                });

                                obj.porcentajeComision = completeResultSet[i].getValue({
                                    name: resultSearch.columns[7]
                                });
                                /*obj.importeComision = completeResultSet[i].getValue({
                                    name: resultSearch.columns[8]
                                });*/
                                obj.importeComision = completeResultSet[i].getValue({
                                    name: resultSearch.columns[16]
                                });
                                obj.porcentajeLiquidacion = completeResultSet[i].getValue({
                                    name: resultSearch.columns[9]
                                });
                                obj.importeLiquidacion = completeResultSet[i].getValue({
                                    name: resultSearch.columns[10]
                                });
                                obj.sitio = completeResultSet[i].getValue({
                                    name: resultSearch.columns[11]
                                });
                                obj.codigoCupon = completeResultSet[i].getValue({
                                    name: resultSearch.columns[17]
                                });
                                obj.fechaUsoCupon = completeResultSet[i].getValue({
                                    name: resultSearch.columns[1]
                                });

                                obj.tipoOperativa = completeResultSet[i].getValue({
                                    name: resultSearch.columns[21]
                                });
                                obj.mainCategory = completeResultSet[i].getValue({
                                    name: resultSearch.columns[22]
                                });
                                obj.sistema = completeResultSet[i].getValue({
                                    name: resultSearch.columns[23]
                                });
                                obj.destino = completeResultSet[i].getValue({
                                    name: resultSearch.columns[24]
                                });
                                obj.fechaCentroCosto = completeResultSet[i].getValue({
                                    name: resultSearch.columns[25]
                                });

                                obj.idCarpeta = idCarpeta;
                                obj.fechaCorte = fechaCorte;

                                obj.orden = orden;
                                orden++;

                                infProcesar.push(obj);
                            }
                            //  FIN Consultar Cupones A Liquidar

                        }

                        log.debug('Generacion Liquidaciones Servicios', 'INPUT DATA - ID Ajustes A Procesar : ' + informacionProcesar.idRegistrosAjustesProcesar);

                        if ((!isEmpty(arrayRegistrosAjustes) && arrayRegistrosAjustes.length > 0)) {

                            // INICIO Consultar Ajustes A Liquidar
                            var ajustesPendientes = search.load({
                                id: 'customsearch_3k_ajustes_pend_liq'
                            });

                            var filtroID = search.createFilter({
                                name: 'internalid',
                                operator: search.Operator.ANYOF,
                                values: arrayRegistrosAjustes
                            });

                            ajustesPendientes.filters.push(filtroID);

                            var resultSearch = ajustesPendientes.run();
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

                                /*obj.idArticuloLiquidacion=idArticuloLiquidacion;
                                obj.idCuentaIngreso=idCuentaIngreso;
                                obj.idUbicacion=idUbicacion;*/

                                obj.idInternoAjuste = completeResultSet[i].getValue({
                                    name: resultSearch.columns[0]
                                });
                                obj.idInternoCupon = completeResultSet[i].getValue({
                                    name: resultSearch.columns[9]
                                });
                                obj.empresa = completeResultSet[i].getValue({
                                    name: resultSearch.columns[2]
                                });
                                obj.empresaStr = completeResultSet[i].getText({
                                    name: resultSearch.columns[2]
                                });

                                obj.campanaStr = completeResultSet[i].getText({
                                    name: resultSearch.columns[16]
                                });

                                obj.simboloMonedaStr = completeResultSet[i].getValue({
                                    name: resultSearch.columns[15]
                                });

                                obj.estadoStr = completeResultSet[i].getText({
                                    name: resultSearch.columns[17]
                                });

                                obj.cupon = completeResultSet[i].getValue({
                                    name: resultSearch.columns[10]
                                });
                                obj.moneda = completeResultSet[i].getValue({
                                    name: resultSearch.columns[3]
                                });
                                obj.monedaStr = completeResultSet[i].getText({
                                    name: resultSearch.columns[3]
                                });
                                obj.tipoCambio = completeResultSet[i].getValue({
                                    name: resultSearch.columns[4]
                                });
                                /*if (factMonedaLocal == true) {
                                    obj.moneda = monedaLocal;
                                    obj.tipoCambio = 1;
                                }*/
                                obj.importeCupon = completeResultSet[i].getValue({
                                    name: resultSearch.columns[11]
                                });
                                obj.porcentajeComision = 0;
                                obj.importeComision = completeResultSet[i].getValue({
                                    name: resultSearch.columns[5]
                                });
                                obj.porcentajeLiquidacion = 0;
                                obj.importeLiquidacion = completeResultSet[i].getValue({
                                    name: resultSearch.columns[6]
                                });
                                obj.sitio = completeResultSet[i].getValue({
                                    name: resultSearch.columns[7]
                                });
                                obj.codigoCupon = completeResultSet[i].getValue({
                                    name: resultSearch.columns[14]
                                });
                                obj.fechaUsoCupon = completeResultSet[i].getValue({
                                    name: resultSearch.columns[1]
                                });

                                obj.tipoOperativa = completeResultSet[i].getValue({
                                    name: resultSearch.columns[18]
                                });
                                obj.mainCategory = completeResultSet[i].getValue({
                                    name: resultSearch.columns[19]
                                });
                                obj.sistema = completeResultSet[i].getValue({
                                    name: resultSearch.columns[20]
                                });
                                obj.destino = completeResultSet[i].getValue({
                                    name: resultSearch.columns[21]
                                });
                                obj.fechaCentroCosto = completeResultSet[i].getValue({
                                    name: resultSearch.columns[22]
                                });

                                obj.idCarpeta = idCarpeta;
                                obj.fechaCorte = fechaCorte;

                                obj.orden = orden;
                                orden++;

                                infProcesar.push(obj);
                            }
                            //  FIN Consultar Ajustes A Liquidar

                        }



                        log.audit('Generacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
                        return infProcesar;
                    } else {
                        log.error('Generacion Liquidaciones Servicios', 'INPUT DATA - Error Obteniendo ID de Cupones A Procesar');
                        log.audit('Generacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
                        return null;
                    }

                } else {
                    log.error('Generacion Liquidaciones Servicios', 'INPUT DATA - Error : No se encuentra configurada la Carpeta de Almacenamiento de los Archivos de Liquidaciones');
                    log.audit('Generacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
                    return null;
                }

                /*} else {
                    var mensaje = 'MAP - No se encuentra configurada la siguiente informacion requerida de la Configuracion de Liquidaciones : ';
                    if (!isEmpty(idArticuloLiquidacion)) {
                        mensaje = mensaje + ' Articulo A Utilizar en la Generacion de Facturas de Comisiones / ';
                    }
                    if (!isEmpty(idCuentaIngreso)) {
                        mensaje = mensaje + ' Cuenta de Ingresos A Utilizar en la Generacion de Facturas de Comisiones / ';
                    }
                    if (!isEmpty(idUbicacion)) {
                        mensaje = mensaje + ' Ubicacion A Utilizar en la Generacion de Facturas de Comisiones / ';
                    }
                    if ((factMonedaLocal == true && !isEmpty(monedaLocal))) {
                        mensaje = mensaje + ' Moneda Local A Utilizar en la Generacion de Facturas de Comisiones / ';
                    }
                    log.error('Generacion Liquidaciones Servicios', 'INPUT DATA - Error : ' + mensaje);
                    log.audit('Generacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
                    return null;
                }*/

            } catch (excepcion) {
                log.error('Generacion Liquidaciones Servicios', 'INPUT DATA - Excepcion Obteniendo ID de Cupones A Procesar - Excepcion : ' + excepcion.message.toString());
                log.audit('Generacion Liquidaciones Servicios', 'FIN GET INPUT DATA');
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
            log.audit('Generacion Liquidaciones Servicios', 'INICIO MAP');

            try {

                var resultado = context.value;

                if (!isEmpty(resultado)) {

                    var searchResult = JSON.parse(resultado);

                    if (!isEmpty(searchResult)) {

                        /*var fechaServidor = new Date();

                        var fechaLocalString = format.format({
                            value: fechaServidor,
                            type: format.Type.DATETIME,
                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                        });

                        var fechaLocal = format.parse({
                            value: fechaLocalString,
                            type: format.Type.DATETIME,
                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                        });*/

                        var obj = new Object();

                        /*obj.idArticuloLiquidacion = searchResult.idArticuloLiquidacion;
                        obj.idCuentaIngreso = searchResult.idCuentaIngreso;
                        obj.idUbicacion = searchResult.idUbicacion;*/
                        obj.orden = searchResult.orden;
                        obj.idInternoCupon = searchResult.idInternoCupon;
                        obj.idInternoAjuste = searchResult.idInternoAjuste;
                        obj.empresa = searchResult.empresa;
                        obj.empresaStr = searchResult.empresaStr;
                        obj.cupon = searchResult.cupon;
                        obj.moneda = searchResult.moneda;
                        obj.monedaStr = searchResult.monedaStr;
                        obj.campanaStr = searchResult.campanaStr;
                        obj.tipoCambio = searchResult.tipoCambio;
                        obj.importeCupon = searchResult.importeCupon;
                        obj.porcentajeLiquidacion = searchResult.porcentajeLiquidacion;
                        obj.importeLiquidacion = searchResult.importeLiquidacion;
                        obj.porcentajeComision = searchResult.porcentajeComision;
                        obj.importeComision = searchResult.importeComision;
                        obj.sitio = searchResult.sitio;
                        obj.codigoCupon = searchResult.codigoCupon;
                        obj.fechaUsoCupon = searchResult.fechaUsoCupon;
                        obj.idCarpeta = searchResult.idCarpeta;
                        obj.simboloMonedaStr = searchResult.simboloMonedaStr;
                        obj.fechaCorte = searchResult.fechaCorte;
                        obj.estadoStr = searchResult.estadoStr;

                        obj.tipoOperativa = searchResult.tipoOperativa;
                        obj.mainCategory = searchResult.mainCategory;
                        obj.sistema = searchResult.sistema;
                        obj.destino = searchResult.destino;
                        obj.fechaCentroCosto = searchResult.fechaCentroCosto;

                        var clave = obj.sitio + '-' + obj.empresa + '-' + obj.moneda;

                        context.write(clave, JSON.stringify(obj));

                    } else {
                        log.error('Generacion Liquidaciones Servicios', 'MAP - Error Obteniendo Resultados de ID de Cupones A Procesar');
                    }

                } else {
                    log.error('Generacion Liquidaciones Servicios', 'MAP - Error Parseando Resultados de ID de Cupones A Procesar');
                }

            } catch (excepcion) {
                log.error('Generacion Liquidaciones Servicios', 'MAP - Excepcion Procesando ID de Cupones A Procesar - Excepcion : ' + excepcion.message.toString());
            }

            log.audit('Generacion Liquidaciones Servicios', 'FIN MAP');

        }

        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {
            log.audit('Generacion Liquidaciones Servicios', 'INICIO REDUCE - KEY : ' + context.key);

            var idFactura = null;
            var idCupones = new Array();
            var idAjustes = new Array();

            var idCarpeta = '';

            var error = false;
            var mensajeError = '';

            var idAjusteEspecialNegativo = '';

            var importePago = 0;
            var importeComision = 0;

            var idEmpresa = '';
            var idEmpresaStr = '';
            var idMoneda = '';
            var idMonedaStr = '';
            //var tipoCambio = 1;
            //var fecha = null;
            /*var idArticuloLiquidacion = '';
            var idCuentaIngreso = '';*/
            var idRecLiquidacion = '';
            //var idUbicacion = '';
            var idSitio = '';

            var fechaCorte = '';

            var importeTotalCupon = 0;
            var importeTotalLiquidacion = 0;
            var importeTotalFacturacion = 0;

            var liquidacionNegativa = false;
            var importeLiquidacionNegativa = 0.00;
            var importeFacturacionNegativa = 0.00;

            var xmlStr = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
            xmlStr += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
            xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
            xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
            xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
            xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

            xmlStr += '<Styles>' +
                '<Style ss:ID="s63">' +
                '<Font x:CharSet="204" ss:Size="12" ss:Color="#000000" ss:Bold="1" ss:Underline="Single"/>' +
                '</Style>' + '</Styles>';

            xmlStr += '<Worksheet ss:Name="Liquidacion">';

            if (!isEmpty(context.values) && context.values.length > 0) {
                context.values.sort(compare);
                for (var i = 0; !isEmpty(context.values) && context.values.length > 0 && i < context.values.length && error == false && liquidacionNegativa == false; i++) {

                    var registro = JSON.parse(context.values[i]);

                    if (!isEmpty(registro)) {

                        if (i == 0) {
                            /*idArticuloLiquidacion = registro.idArticuloLiquidacion;
                            idCuentaIngreso = registro.idCuentaIngreso;
                            idUbicacion = registro.idUbicacion;*/
                            idEmpresa = registro.empresa;
                            idEmpresaStr = registro.empresaStr;
                            idMoneda = registro.moneda;
                            //tipoCambio = registro.tipoCambio;
                            //fecha = registro.fecha;
                            idSitio = registro.sitio;
                            idCarpeta = registro.idCarpeta;

                            fechaCorte = registro.fechaCorte;

                            xmlStr += '<Table>' +
                                '<Row>' +
                                '<Cell><Data ss:Type="String"> Estado de cuenta con proveedor comisionista PP </Data></Cell>' +
                                '</Row>' +
                                '<Row>' +
                                '<Cell><Data ss:Type="String">  </Data></Cell>' +
                                '</Row>' +
                                '<Row>' +
                                '<Cell><Data ss:Type="String"> Fecha Al :  </Data></Cell>' +
                                '<Cell><Data ss:Type="String"> ' + fechaCorte + ' </Data></Cell>' +
                                '</Row>' +
                                '<Row>' +
                                '<Cell><Data ss:Type="String">  </Data></Cell>' +
                                '</Row>' +
                                '<Row>' +
                                '<Cell><Data ss:Type="String"> Orden </Data></Cell>' +
                                '<Cell><Data ss:Type="String"> Campaña </Data></Cell>' +
                                '<Cell><Data ss:Type="String"> Estado </Data></Cell>' +
                                '<Cell><Data ss:Type="String"> Fecha Uso </Data></Cell>' +
                                '<Cell><Data ss:Type="String"> Moneda </Data></Cell>' +
                                '<Cell><Data ss:Type="String"> Importe de la Orden </Data></Cell>' +
                                '<Cell><Data ss:Type="String"> Importe A Pagar </Data></Cell>' +
                                '<Cell><Data ss:Type="String"> Neto Comision </Data></Cell>' +
                                '</Row>';
                        }

                        if (!isEmpty(registro.idInternoCupon)) {
                            idCupones.push(registro.idInternoCupon);
                        }

                        if (!isEmpty(registro.idInternoAjuste)) {
                            idAjustes.push(registro.idInternoAjuste);
                        }

                        if (!isEmpty(registro.importeComision) && !isNaN((registro.importeLiquidacion))) {
                            importePago = parseFloat(importePago, 10) + parseFloat(registro.importeLiquidacion, 10);
                        } else {
                            error = true;
                            mensaje = 'Importe de Liquidacion : ' + registro.importeLiquidacion + ' Invalido';
                        }

                        if (!isEmpty(registro.importeComision) && !isNaN((registro.importeComision))) {
                            importeComision = parseFloat(importeComision, 10) + parseFloat(registro.importeComision, 10);
                        } else {
                            error = true;
                            mensaje = 'Importe de Comision : ' + registro.importeComision + ' Invalido';
                        }

                        var codigoCupon = registro.codigoCupon;
                        var fechaUsoCupon = registro.fechaUsoCupon;
                        var impLiquidacionCupon = parseFloat(registro.importeLiquidacion, 10).toFixed(2);
                        var impFacturacionCupon = parseFloat(registro.importeComision, 10).toFixed(2);
                        var impCupon = parseFloat(registro.importeCupon, 10).toFixed(2);
                        var campanaStr = registro.campanaStr;
                        var simboloMonedaStr = registro.simboloMonedaStr;
                        var estadoStr = registro.estadoStr;

                        importeTotalCupon = parseFloat(importeTotalCupon, 10) + parseFloat(impCupon, 10);
                        importeTotalLiquidacion = parseFloat(importeTotalLiquidacion, 10) + parseFloat(impLiquidacionCupon, 10);
                        importeTotalFacturacion = parseFloat(importeTotalFacturacion, 10) + parseFloat(impFacturacionCupon, 10);

                        if (importeTotalLiquidacion < 0.00 || importeTotalFacturacion < 0.00) {
                            liquidacionNegativa = true;
                            if (importeTotalLiquidacion < 0.00) {
                                impLiquidacionCupon = parseFloat(impLiquidacionCupon, 10) - parseFloat(importeTotalLiquidacion, 10);
                                importeLiquidacionNegativa = importeTotalLiquidacion;
                                importeTotalLiquidacion = 0.00;
                                importePago = 0.00;

                            }
                            if (importeTotalFacturacion < 0.00) {
                                impFacturacionCupon = parseFloat(impFacturacionCupon, 10) - parseFloat(importeTotalFacturacion, 10);
                                importeFacturacionNegativa = importeTotalFacturacion;
                                importeTotalFacturacion = 0.00;
                                importeComision = 0.00;
                            }
                            // INICIO GENERAR AJUSTE ESPECIAL
                            var respuestaAjusteEspecial = generarAjusteLiquidacion(registro, importeLiquidacionNegativa, importeFacturacionNegativa);
                            if (!isEmpty(respuestaAjusteEspecial) && (respuestaAjusteEspecial.error == true || isEmpty(respuestaAjusteEspecial.idRegAjuste))) {
                                error = true;
                                mensajeError = "Error Generando Ajuste Especial por Liquidacion Negativa";
                            } else {
                                idAjusteEspecialNegativo = respuestaAjusteEspecial.idRegAjuste;
                            }
                            // FIN GENERAR AJUSTE ESPECIAL
                        }

                        xmlStr += '<Row>' +
                            '<Cell><Data ss:Type="String">' + codigoCupon + '</Data></Cell>' +
                            '<Cell><Data ss:Type="String">' + campanaStr + '</Data></Cell>' +
                            '<Cell><Data ss:Type="String">' + estadoStr + '</Data></Cell>' +
                            '<Cell><Data ss:Type="String">' + fechaUsoCupon + '</Data></Cell>' +
                            '<Cell><Data ss:Type="String">' + simboloMonedaStr + '</Data></Cell>' +
                            '<Cell><Data ss:Type="String">' + impCupon + '</Data></Cell>' +
                            '<Cell><Data ss:Type="String">' + impLiquidacionCupon + '</Data></Cell>' +
                            '<Cell><Data ss:Type="String">' + impFacturacionCupon + '</Data></Cell>' +
                            '</Row>';



                    } else {
                        error = true;
                        mensajeError = "Error No se Recibio Informacion del registro de Cupon para generar la Liquidacion";
                    }
                }

                xmlStr += '<Row>' +
                    '<Cell><Data ss:Type="String"> TOTALES </Data></Cell>' +
                    '<Cell><Data ss:Type="String"> </Data></Cell>' +
                    '<Cell><Data ss:Type="String"> </Data></Cell>' +
                    '<Cell><Data ss:Type="String"> </Data></Cell>' +
                    '<Cell><Data ss:Type="String"> </Data></Cell>' +
                    '<Cell><Data ss:Type="String">' + parseFloat(importeTotalCupon, 10).toFixed(2) + '</Data></Cell>' +
                    '<Cell><Data ss:Type="String">' + parseFloat(importeTotalLiquidacion, 10).toFixed(2) + '</Data></Cell>' +
                    '<Cell><Data ss:Type="String">' + parseFloat(importeTotalFacturacion, 10).toFixed(2) + '</Data></Cell>' +
                    '</Row>';

                xmlStr += '</Table></Worksheet></Workbook>';

            } else {
                error = true;
                mensajeError = "Error No se Recibio Informacion del registro de Cupon para generar la Liquidacion";
            }

            //if (importePago > 0 || importeComision > 0) {

            //if (error == false && !isEmpty(idArticuloLiquidacion) && !isEmpty(idCuentaIngreso) && !isEmpty(idUbicacion) && !isEmpty(idEmpresa) && !isEmpty(idMoneda) && !isEmpty(idSitio) && !isEmpty(importeComision) && importeComision > 0) {
            if (error == false && !isEmpty(idEmpresa) && !isEmpty(idMoneda) && !isEmpty(idSitio)) {

                // INICIO GENERAR FACTURA
                /*var registroFactura = record.create({
                    type: 'cashsale',
                    isDynamic: true
                });

                registroFactura.setValue({
                    fieldId: 'custbody_3k_fact_comision',
                    value: true
                });

                /*registroFactura.setValue({
                    fieldId: 'date',
                    value: fecha
                });*/

                /*registroFactura.setValue({
                    fieldId: 'entity',
                    value: idEmpresa
                });

                registroFactura.setValue({
                    fieldId: 'currency',
                    value: idMoneda
                });

                registroFactura.setValue({
                    fieldId: 'exchangerate',
                    value: tipoCambio.toFixed(2).toString()
                });

                registroFactura.setValue({
                    fieldId: 'location',
                    value: idUbicacion
                });

                registroFactura.setValue({
                    fieldId: 'custbody_cseg_3k_sitio_web',
                    value: idSitio
                });

                registroFactura.setValue({
                    fieldId: 'account',
                    value: idCuentaIngreso
                });

                if (!isEmpty(idCupones) && idCupones.length > 0) {
                    registroFactura.setValue({
                        fieldId: 'custbody_3k_fact_cupones',
                        value: idCupones
                    });
                }

                if (!isEmpty(idAjustes) && idAjustes.length > 0) {
                    registroFactura.setValue({
                        fieldId: 'custbody_3k_fact_ajustes',
                        value: idAjustes
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
                    fieldId: 'amount',
                    value: importeComision.toFixed(2).toString()
                });

                registroFactura.commitLine({
                    sublistId: 'item'
                });

                var currScript = runtime.getCurrentScript();
                var enviarEmailCliente = currScript.getParameter('custscript_generar_fact_email');
                if (!isEmpty(enviarEmailCliente) && enviarEmailCliente == 'T') {
                    var enviarEmailCliente = registroFactura.getValue({
                        fieldId: 'email',
                    });
                    if (!isEmpty(enviarEmailCliente)) {
                        registroFactura.setValue({
                            fieldId: 'tobeemailed',
                            value: true
                        });
                    }
                }

                try {
                    idFactura = registroFactura.save();
                     log.debug('TEST', 'ID : ' + idFactura);
                } catch (excepcionFact) {
                    error = true;
                    mensajeError = 'Excepcion Generando Factura de Comision - Excepcion : ' + excepcionFact.message.toString();
                }
                if (isEmpty(idFactura)) {
                    error = true;
                    mensajeError = 'Error Generando Factura de Comision - Error : No se recibio el ID Interno de la Factura Generada';
                }*/

            } else {
                if (error == false) {
                    error = true;
                    var mensaje = 'No se Recibio la Siguiente Informacion requerida del Registro de Cupon : ';
                    /*if (isEmpty(idArticuloLiquidacion)) {
                        mensaje = mensaje + ' Articulo A Utilizar para realizar la Factura de Comision / ';
                    }
                    if (isEmpty(idCuentaIngreso)) {
                        mensaje = mensaje + ' Cuenta de Ingresos A Utilizar para realizar la Factura de Comision / ';
                    }
                    if (isEmpty(idUbicacion)) {
                        mensaje = mensaje + ' Ubicacion A Utilizar para realizar la Factura de Comision / ';
                    }*/
                    if (isEmpty(idSitio)) {
                        mensaje = mensaje + ' Sitio A Utilizar para realizar la Factura de Comision / ';
                    }
                    if (isEmpty(idCupones) || (!isEmpty(idCupones) && idCupones.length <= 0)) {
                        mensaje = mensaje + ' ID Interno de Cupones A Liquidar / ';
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
                    if (isEmpty(importePago) || (!isEmpty(importePago) && importePago <= 0)) {
                        mensaje = mensaje + ' Importe de Pago';
                    }
                    if (isEmpty(importeComision) || (!isEmpty(importeComision) && importeComision <= 0)) {
                        mensaje = mensaje + ' Importe de Comision';
                    }
                    mensajeError = mensaje;
                }
            }

            if (error == false) {

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


                // INICIO GENERAR LIQUIDACION
                var RecLiquidacion = record.create({
                    type: 'customrecord_3k_liquidacion_emp',
                    isDynamic: true
                });

                if (!isEmpty(fechaCorte)) {
                    var fechaCorteDate = format.parse({
                        value: fechaCorte,
                        type: format.Type.DATE,
                        timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                    });

                    RecLiquidacion.setValue({
                        fieldId: 'custrecord_3k_liq_emp_fecha_corte',
                        value: fechaCorteDate
                    });

                }

                // INICIO GENERAR EXCEL LIQUIDACION
                if (!isEmpty(xmlStr) && !isEmpty(idCarpeta)) {
                    var strXmlEncoded = encode.convert({
                        string: xmlStr,
                        inputEncoding: encode.Encoding.UTF_8,
                        outputEncoding: encode.Encoding.BASE_64
                    });

                    var objXlsFile = file.create({
                        name: 'Liquidacion - ' + idEmpresaStr + '-' + idMoneda + '-' + fechaCorte + '.xls',
                        fileType: file.Type.EXCEL,
                        contents: strXmlEncoded
                    });

                    objXlsFile.folder = idCarpeta;
                    intFileId = objXlsFile.save();
                }

                // FIN GENERAR EXCEL LIQUIDACION

                if (!isEmpty(intFileId)) {

                    RecLiquidacion.setValue({
                        fieldId: 'custrecord_3k_liq_emp_arch_liq',
                        value: intFileId
                    });

                }

                if (!isEmpty(idCupones) && idCupones.length > 0) {
                    RecLiquidacion.setValue({
                        fieldId: 'custrecord_3k_liq_emp_cupon',
                        value: idCupones
                    });
                }

                if (!isEmpty(idAjustes) && idAjustes.length > 0) {
                    RecLiquidacion.setValue({
                        fieldId: 'custrecord_3k_liq_emp_ajuste',
                        value: idAjustes
                    });
                }

                /*if (!isEmpty(idFactura)) {
                    RecLiquidacion.setValue({
                        fieldId: 'custrecord_3k_liq_emp_fact_com',
                        value: idFactura
                    });
                }*/

                RecLiquidacion.setValue({
                    fieldId: 'custrecord_3k_liq_emp_imp_liq',
                    value: importePago.toFixed(2).toString()
                });

                RecLiquidacion.setValue({
                    fieldId: 'custrecord_3k_liq_emp_imp_fact',
                    value: importeComision.toFixed(2).toString()
                });

                RecLiquidacion.setValue({
                    fieldId: 'custrecord_3k_liq_emp_liq',
                    value: true
                });

                RecLiquidacion.setValue({
                    fieldId: 'custrecord_3k_liq_emp_fecha',
                    value: fechaLocal
                });

                RecLiquidacion.setValue({
                    fieldId: 'custrecord_3k_liq_emp_empresa',
                    value: idEmpresa
                });

                RecLiquidacion.setValue({
                    fieldId: 'custrecord_3k_liq_emp_moneda',
                    value: idMoneda
                });

                /*RecLiquidacion.setValue({
                    fieldId: 'custrecord_3k_liq_emp_tipo_cambio',
                    value: tipoCambio.toFixed(2).toString()
                });*/

                RecLiquidacion.setValue({
                    fieldId: 'custrecord_52_cseg_3k_sitio_web_o',
                    value: idSitio
                });

                // INICIO - Nuevo Para Ajuste Especial por Liquidacion Negativa
                if (!isEmpty(idAjusteEspecialNegativo)) {
                    RecLiquidacion.setValue({
                        fieldId: 'custrecord_3k_liq_emp_ajust_esp',
                        value: idAjusteEspecialNegativo
                    });
                }
                if (!isEmpty(importeLiquidacionNegativa)) {
                    RecLiquidacion.setValue({
                        fieldId: 'custrecord_3k_liq_emp_imp_liq_neg',
                        value: importeLiquidacionNegativa.toFixed(2).toString()
                    });
                }
                if (!isEmpty(importeFacturacionNegativa)) {
                    RecLiquidacion.setValue({
                        fieldId: 'custrecord_3k_liq_emp_imp_fact_neg',
                        value: importeFacturacionNegativa.toFixed(2).toString()
                    });
                }
                // FIN - Nuevo Para Ajuste Especial por Liquidacion Negativa

                try {
                    idRecLiquidacion = RecLiquidacion.save();
                    if (isEmpty(idRecLiquidacion)) {
                        error = true;
                        mensajeError = 'Error Grabando Registro Liquidacion - Error : No se recibio ID de Respuesta de la Liquidacion Generada';
                    }
                } catch (excepcionLiquidacion) {
                    error = true;
                    mensajeError = 'Excepcion Grabando Registro Liquidacion - Excepcion: ' + excepcionLiquidacion.message.toString();
                }

                // FIN GENERAR LIQUIDACION
                if (error == false) {
                    // INICIO ACTUALIZAR CUPONES
                    if (!isEmpty(idCupones) && idCupones.length > 0) {
                        idCupones = idCupones.filter(function(elem, index, self) {
                            return index == self.indexOf(elem);
                        })
                    }
                    if (!isEmpty(idCupones) && idCupones.length > 0) {
                        for (var k = 0; !isEmpty(idCupones) && k < idCupones.length && error == false; k++) {
                            try {
                                var idCupon = record.submitFields({
                                    type: 'customrecord_3k_cupones',
                                    id: idCupones[k],
                                    values: {
                                        custrecord_3k_cupon_liquidado: true,
                                        custrecord_3k_cupon_reg_liquidacion: idRecLiquidacion
                                    },
                                    options: {
                                        enableSourcing: true,
                                        ignoreMandatoryFields: false
                                    }
                                });
                                if (isEmpty(idCupon)) {
                                    error = true;
                                    mensajeError = 'Error Actualizando Cupon con ID Interno : ' + idCupones[k] + ' - No se recibio el ID del Cupon Actualizado';
                                }
                            } catch (excepcionCupon) {
                                error = true;
                                mensajeError = 'Excepcion Actualizando Cupon con ID Interno : ' + idCupones[k] + ' - Excepcion : ' + excepcionCupon.message.toString();
                            }
                        }
                        // FIN ACTUALIZAR CUPONES
                    }
                    /*else {
                                               error = true;
                                               mensajeError = "Error No se Recibio ID Interno de los Cupones Liquidados";
                                           }*/

                    // INICIO ACTUALIZAR AJUSTES
                    if (!isEmpty(idAjustes) && idAjustes.length > 0) {
                        idAjustes = idAjustes.filter(function(elem, index, self) {
                            return index == self.indexOf(elem);
                        })
                    }
                    if (!isEmpty(idAjustes) && idAjustes.length > 0) {
                        for (var k = 0; !isEmpty(idAjustes) && k < idAjustes.length && error == false; k++) {
                            try {
                                var idCupon = record.submitFields({
                                    type: 'customrecord_3k_ajustes_liq_emp',
                                    id: idAjustes[k],
                                    values: {
                                        custrecord_3k_ajustes_liq_emp_liq: true,
                                        custrecord_3k_ajustes_liq_emp_reg_liq: idRecLiquidacion
                                    },
                                    options: {
                                        enableSourcing: true,
                                        ignoreMandatoryFields: false
                                    }
                                });
                                if (isEmpty(idCupon)) {
                                    error = true;
                                    mensajeError = 'Error Actualizando Ajuste con ID Interno : ' + idAjustes[k] + ' - No se recibio el ID del Ajuste Actualizado';
                                }
                            } catch (excepcionCupon) {
                                error = true;
                                mensajeError = 'Excepcion Actualizando Ajuste con ID Interno : ' + idAjustes[k] + ' - Excepcion : ' + excepcionCupon.message.toString();
                            }
                        }
                        // FIN ACTUALIZAR CUPONES
                    }
                    /*else {
                                               error = true;
                                               mensajeError = "Error No se Recibio ID Interno de los Ajustes Liquidados";
                                           }*/
                }
            }

            /*} else {
                error = true;
                mensajeError = "El No existe Importe de Pago o Liquidacion A Realizar";
            }*/

            // FIN GENERAR FACTURA COMISION

            var respuesta = new Object();
            respuesta.idFactura = idFactura;
            respuesta.idLiquidacion = idRecLiquidacion;
            respuesta.idCupones = idCupones;
            respuesta.idAjustes = idAjustes;
            respuesta.error = false;
            respuesta.mensaje = "";

            if (error == true) {
                log.error('Generacion Liquidaciones Servicios', 'REDUCE - ' + mensajeError);
                respuesta.error = true;
                respuesta.mensaje = mensajeError;
            } else {
                respuesta.mensaje = 'La Factura con ID Interno : ' + idFactura + ' Se genero correctamente Asociada a la Liquidacion : ' + idRecLiquidacion;
            }

            log.audit('Generacion Liquidaciones Servicios', 'FIN REDUCE - KEY : ' + context.key + ' ID FACTURA GENERADA : ' + idFactura + ' - ID LIQUIDACION GENERADA : ' + idRecLiquidacion);

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
            var mensajeErrorGeneral = 'El Proceso de Generacion Liquidaciones Servicios Finalizo con errores';
            var mensajeOKGeneral = 'El Proceso de Generacion Liquidaciones Servicios Finalizo Correctamente';
            var error = false;
            var mensajeError = '';
            var idLog = null;
            log.audit('Generacion Liquidaciones Servicios', 'INICIO SUMMARIZE');


            try {

                // INICIO OBTENER CONFIGURACION DE LIQUIDACIONES
                var errorConfiguracionLIQ = false;
                var dominio = '';
                var idRTLog = '';
                var idEstadoFinalizado = '';
                var idEstadoError = '';
                var idEstadoCorrecto = '';

                var mySearch = search.load({
                    id: 'customsearch_3k_config_liquidaciones'
                });

                var resultSet = mySearch.run();
                var searchResult = resultSet.getRange({
                    start: 0,
                    end: 1
                });

                if (!isEmpty(searchResult) && searchResult.length > 0) {
                    dominio = searchResult[0].getText({
                        name: resultSet.columns[3]
                    });
                    idRTLog = searchResult[0].getValue({
                        name: resultSet.columns[4]
                    });
                    idEstadoFinalizado = searchResult[0].getValue({
                        name: resultSet.columns[5]
                    });
                    idEstadoError = searchResult[0].getValue({
                        name: resultSet.columns[6]
                    });
                    idEstadoCorrecto = searchResult[0].getValue({
                        name: resultSet.columns[7]
                    });

                } else {
                    errorConfiguracionLIQ = true;
                    log.error('Generacion Liquidaciones Servicios', 'SUMMARIZE - ' + 'No se encuentra realizada la configuracion de las Liquidaciones');
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
                    type: 'customrecord_3k_gen_liq_log'
                });

                registroLOG.setValue({
                    fieldId: 'custrecord_3k_gen_liq_log_fecha',
                    value: fechaLocal
                });
                if (!isEmpty(idEstadoFinalizado)) {
                    registroLOG.setValue({
                        fieldId: 'custrecord_3k_gen_liq_log_est',
                        value: idEstadoFinalizado
                    });
                }

                try {
                    idLog = registroLOG.save();
                    if (isEmpty(idLog)) {
                        error = true;
                        mensajeError = 'No se recibio el ID del LOG de Liquidaciones Generado';
                    }
                } catch (excepcionLOG) {
                    error = true;
                    mensajeError = 'Excepcion Grabando LOG de Proceso de Generacion de Liquidaciones - Excepcion : ' + excepcionLOG.message.toString();
                }
                // FIN Generar Cabecera Log
                // INICIO Generar Detalle Log
                if (error == false) {
                    summary.output.iterator().each(function(key, value) {
                        if (error == false) {
                            if (!isEmpty(value)) {
                                var registro = JSON.parse(value);
                                log.debug('Generacion Liquidaciones Servicios', 'Registro : ' + JSON.stringify(registro));
                                if (!isEmpty(registro)) {
                                    var idEstado = idEstadoCorrecto;
                                    if (registro.error == true) {
                                        errorGeneral = true;
                                        idEstado = idEstadoError;
                                    }
                                    var registroDLOG = record.create({
                                        type: 'customrecord_3k_gen_liq_logdet'
                                    });

                                    registroDLOG.setValue({
                                        fieldId: 'custrecord_3k_gen_liq_logdet_fecha',
                                        value: fechaLocal
                                    });
                                    if (!isEmpty(idEstado)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_liq_logdet_est',
                                            value: idEstado
                                        });
                                    }
                                    if (!isEmpty(registro.mensaje)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_liq_logdet_desc',
                                            value: registro.mensaje
                                        });
                                    }
                                    if (!isEmpty(registro.idLiquidacion)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_liq_logdet_liq',
                                            value: registro.idLiquidacion
                                        });
                                    }
                                    if (!isEmpty(registro.idFactura)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_liq_logdet_fact',
                                            value: registro.idFactura
                                        });
                                    }
                                    if (!isEmpty(registro.idCupones) && registro.idCupones.length > 0) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_liq_logdet_cupones',
                                            value: registro.idCupones
                                        });
                                    }
                                    if (!isEmpty(registro.idAjustes) && registro.idAjustes.length > 0) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_liq_logdet_ajustes',
                                            value: registro.idAjustes
                                        });
                                    }
                                    if (!isEmpty(idLog)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_liq_logdet_log',
                                            value: idLog
                                        });
                                    }
                                    try {
                                        idDLog = registroDLOG.save();
                                        if (isEmpty(idDLog)) {
                                            error = true;
                                            mensajeError = 'No se recibio el ID del Detalle de LOG de Liquidaciones Generado';
                                        }
                                    } catch (excepcionDLOG) {
                                        error = true;
                                        mensajeError = 'Excepcion Grabando el Detalle de LOG de Proceso de Generacion de Liquidaciones - Excepcion : ' + excepcionDLOG.message.toString();
                                    }
                                } else {
                                    error = true;
                                    mensajeError = 'Error Parseando Informacion de Liquidacion Generada';
                                }
                            } else {
                                error = true;
                                mensajeError = 'Error Obteniendo Informacion de Liquidacion Generada';
                            }
                        }
                        return true;
                    });
                }
                // FIN Generar Detalle Log

            } catch (excepcion) {

                error = true;
                mensajeError = 'Excepcion Generando LOG de Proceso de Generacion de Liquidaciones - Excepcion : ' + excepcion.message.toString();
            }

            if (error == true) {
                errorGeneral = true;
                log.error('Generacion Liquidaciones Servicios', 'SUMMARIZE - ' + mensajeError);
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
                    var informacionFaltante = 'No se pudo generar el Link de Acceso al LOG de la Generacion de las Liquidaciones debido a que falta la siguiente informacion : ';
                    if (isEmpty(idLog)) {
                        informacionFaltante = informacionFaltante + ' ID del Registro de LOG Generado / ';
                    }
                    if (isEmpty(dominio)) {
                        informacionFaltante = informacionFaltante + ' Configuracion del Dominio de NetSuite en el Panel de Configuracion de Liquidaciones / ';
                    }
                    if (isEmpty(idRTLog)) {
                        informacionFaltante = informacionFaltante + ' Configuracion del ID del RecordType de LOG en el Panel de Configuracion de Liquidaciones / ';
                    }
                    log.error('Generacion Liquidaciones Servicios', 'SUMMARIZE - ' + informacionFaltante);
                }
            }

            var titulo = 'Proceso Generacion de Liquidaciones';

            var mensaje = '<html><head></head><body><br>' + mensajeMail + '<br>' + link + '</body></html>';

            enviarEmail(autor, destinatario, titulo, mensaje);
            // FIN Enviar Email Log

            log.audit('Generacion Liquidaciones Servicios', 'FIN SUMMARIZE');

            handleErrorIfAny(summary);
        }

        function compare(a, b) {
            if (a.orden < b.orden)
                return -1;
            if (a.orden > b.orden)
                return 1;
            return 0;
        }

        function generarAjusteLiquidacion(registro, importeLiquidacion, importeFacturacion) {
            log.audit('Ajuste Especial Liquidacion Negativa', 'INICIO Proceso');

            var respuesta = new Object();
            respuesta.idCupon = '';
            respuesta.idRegAjuste = '';
            respuesta.error = false;
            respuesta.detalle = new Array();

            if ((!isEmpty(importeLiquidacion) && !isNaN(importeLiquidacion)) || (!isEmpty(importeFacturacion) && !isNaN(importeFacturacion))) {


                // INICIO - Obtener informacion de Importe Liquidacion e importe de Comision del Cupon

                if (!isEmpty(registro) && !isEmpty(registro.sitio) && !isEmpty(registro.moneda) && !isEmpty(registro.tipoCambio) && !isEmpty(registro.empresa)) {
                    // INICIO - Crear Ajuste de Liquidacion
                    var rec = record.create({
                        type: 'customrecord_3k_ajustes_liq_emp',
                        isDynamic: true
                    });

                    rec.setValue({
                        fieldId: 'name',
                        value: 'Ajuste Automatico por Liquidacion Negativa'
                    });

                    if (!isEmpty(registro.sitio)) {
                        rec.setValue({
                            fieldId: 'custrecord_85_cseg_3k_sitio_web_o',
                            value: registro.sitio
                        });
                    }

                    if (!isEmpty(registro.sistema)) {
                        rec.setValue({
                            fieldId: 'custrecord_85_cseg_3k_sistema',
                            value: registro.sistema
                        });
                    }

                    if (!isEmpty(registro.mainCategory)) {
                        rec.setValue({
                            fieldId: 'custrecord_85_cseg_3k_main_cat',
                            value: registro.mainCategory
                        });
                    }

                    if (!isEmpty(registro.tipoOperativa)) {
                        rec.setValue({
                            fieldId: 'custrecord_85_cseg_3k_tipo_operat',
                            value: registro.tipoOperativa
                        });
                    }

                    if (!isEmpty(registro.destino)) {
                        rec.setValue({
                            fieldId: 'custrecord_85_cseg_3k_destino',
                            value: registro.destino
                        });
                    }

                    if (!isEmpty(registro.fechaCentroCosto)) {
                        rec.setValue({
                            fieldId: 'custrecord_85_cseg_3k_fecha',
                            value: registro.fechaCentroCosto
                        });
                    }

                    if (!isEmpty(registro.idInternoCupon)) {
                        respuesta.idCupon = registro.idInternoCupon;
                        rec.setValue({
                            fieldId: 'custrecord_3k_ajustes_liq_emp_cupon',
                            value: registro.idInternoCupon
                        });
                    }

                    if (!isEmpty(registro.moneda)) {
                        rec.setValue({
                            fieldId: 'custrecord_3k_ajustes_liq_emp_mon',
                            value: registro.moneda
                        });
                    }

                    if (!isEmpty(registro.tipoCambio)) {
                        rec.setValue({
                            fieldId: 'custrecord_3k_ajustes_liq_emp_tc',
                            value: registro.tipoCambio
                        });
                    }

                    if (!isEmpty(registro.empresa)) {
                        rec.setValue({
                            fieldId: 'custrecord_3k_ajustes_liq_emp_emp',
                            value: registro.empresa
                        });
                    }

                    if (!isEmpty(importeLiquidacion) && !isNaN(importeLiquidacion)) {
                        rec.setValue({
                            fieldId: 'custrecord_3k_ajustes_liq_emp_imp_pag',
                            value: parseFloat(importeLiquidacion, 10).toFixed(2)
                        });
                    }

                    if (!isEmpty(importeFacturacion) && !isNaN(importeFacturacion)) {
                        rec.setValue({
                            fieldId: 'custrecord_3k_ajustes_liq_emp_imp_fact',
                            value: parseFloat(importeFacturacion, 10).toFixed(2)
                        });
                    }


                    try {
                        var recId = rec.save();
                        respuesta.idRegAjuste = recId;
                    } catch (excepcionSave) {
                        log.error('Devolucion Cupon - Creacion Ajuste Liquidacion Negativa', 'Excepcion Proceso Creacion de Ajuste de Liquidacion Negativa - Excepcion : ' + excepcionSave.message.toString());
                        var error = new Object();
                        if (!isEmpty(excepcionSave.message) && excepcionSave.message.indexOf('Error') >= 0) {
                            var excepcionObj = JSON.parse(excepcionSave.message);
                            error.name = excepcionObj.name;
                            error.message = excepcionObj.message;
                        } else {
                            error.name = 'SCUP024';
                            error.message = excepcionSave.message;
                        }

                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = error.name;
                        respuestaParcial.mensaje = error.message;
                        respuesta.detalle.push(respuestaParcial);
                    }
                    // FIN - Crear Ajuste de Liquidacion Negativa

                } else {
                    respuesta.error = true;
                    var mensaje = 'No se recibio la siguiente informacion para generar el Ajuste por la Liquidacion Negativa : ';
                    if (isEmpty(registro)) {
                        mensaje = mensaje + ' Registro Ajuste / ';
                    } else {
                        if (isEmpty(registro.sitio)) {
                            mensaje = mensaje + ' Sitio Web / ';
                        }
                        if (isEmpty(registro.moneda)) {
                            mensaje = mensaje + ' Moneda / ';
                        }
                        if (isEmpty(registro.tipoCambio)) {
                            mensaje = mensaje + ' Tipo de Cambio / ';
                        }
                        if (isEmpty(registro.empresa)) {
                            mensaje = mensaje + ' Empresa / ';
                        }
                    }

                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SCUP023';
                    respuestaParcial.mensaje = mensaje;
                    respuesta.detalle.push(respuestaParcial);
                }

            }
            log.audit('Ajuste Especial Liquidacion Negativa', 'FIN Proceso');
            return respuesta;
        }


        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });
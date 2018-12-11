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
            log.debug('Pago Liquidaciones Servicios', 'SUMMARIZE - INICIO ENVIO EMAIL - ID AUTOR : ' + autor + ' - ID DESTINATARIO : ' + destinatario + ' - TITULO : ' + titulo + ' - MENSAJE : ' + mensaje);

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
                log.error('Pago Liquidaciones Servicios', 'SUMMARIZE - Error Envio Email - Error : ' + detalleError);
            }
            log.debug('Pago Liquidaciones Servicios', 'SUMMARIZE - FIN ENVIO EMAIL');
        }

        function handleErrorAndSendNotification(e, stage) {
            log.error('Estado : ' + stage + ' Error', e);

            var author = runtime.getCurrentUser().id;
            var recipients = runtime.getCurrentUser().id;
            var subject = 'Proceso de Pago Liquidaciones de Servicios ' + runtime.getCurrentScript().id + ' Error en Estado : ' + stage;
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
                informacion.idRegistrosLiquidacionesProcesar = currScript.getParameter('custscript_generar_pago_id_liq');
                informacion.formaPago = currScript.getParameter('custscript_generar_pago_forma_pago');
                informacion.fechaPago = currScript.getParameter('custscript_generar_pago_fecha_pago');
                informacion.numeroLiquidacion = currScript.getParameter('custscript_generar_pago_num_liq');
                informacion.cuentaOrigen = currScript.getParameter('custscript_generar_pago_cta_orig');
                informacion.formularioImpresion = currScript.getParameter('custscript_generar_pago_form_imp');
                informacion.fechaChequeDiferido = currScript.getParameter('custscript_generar_pago_fecha_dif');
                informacion.imprimirCheque = currScript.getParameter('custscript_generar_pago_imp_cheq');
                informacion.bancoEmisorPago = currScript.getParameter('custscript_generar_pago_banco_emisor');

                return informacion;
            } catch (excepcion) {
                log.error('Pago Liquidaciones Servicios', 'INPUT DATA - Excepcion Obteniendo Parametros - Excepcion : ' + excepcion.message.toString());
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

                log.audit('Pago Liquidaciones Servicios', 'INICIO GET INPUT DATA');

                var infProcesar = new Array();

                // INICIO Obtener Parametros
                var informacionProcesar = getParams();
                // FIN Obtener Parametros
                var arrayRegistrosLiquidaciones = new Array();
                if (!isEmpty(informacionProcesar) && !isEmpty(informacionProcesar.idRegistrosLiquidacionesProcesar)) {
                    arrayRegistrosLiquidaciones = informacionProcesar.idRegistrosLiquidacionesProcesar.split(',');
                }

                var formaPago = informacionProcesar.formaPago;
                var fechaPago = informacionProcesar.fechaPago;
                var numeroLiquidacion = informacionProcesar.numeroLiquidacion;
                var cuentaOrigen = informacionProcesar.cuentaOrigen;
                var formularioImpresion = informacionProcesar.formularioImpresion;
                var fechaChequeDiferido = informacionProcesar.fechaChequeDiferido;
                var imprimirCheque = informacionProcesar.imprimirCheque;
                var bancoEmisorPago = informacionProcesar.bancoEmisorPago;
                //log.debug('Pago Liquidaciones Servicios','BancoEmisorPago: '+bancoEmisorPago);

                // INICIO - Consultar Cuentas de Pago
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
                            infoCuenta.cuentaPago = resultSet[q].getValue({
                                name: resultSearch.columns[6]
                            });
                            arrayInfoCuentas.push(infoCuenta);
                        }
                    } else {
                        log.error('Pago Liquidaciones Servicios', 'INPUT DATA - Error Cuentas de Pago de Comisiones');
                        log.audit('Pago Liquidaciones Servicios', 'FIN GET INPUT DATA');
                        return null;
                    }
                } else {
                    log.error('Pago Liquidaciones Servicios', 'INPUT DATA - Error Cuentas de Pago de Comisiones');
                    log.audit('Pago Liquidaciones Servicios', 'FIN GET INPUT DATA');
                    return null;
                }
                // FIN - Consultar Cuentas de Pago

                // INICIO - Consultar Datos Bancarios Proveedores Comisionistas
                var arrayDatosBancarios = new Array();
                var searchDatosBancarios = searchSavedPro('customsearch_3k_datos_banc_prov_com');

                if (!isEmpty(searchDatosBancarios) && !searchDatosBancarios.error) {
                    if (!isEmpty(searchDatosBancarios.objRsponseFunction.result) && searchDatosBancarios.objRsponseFunction.result.length > 0) {
                        var resultSet = searchDatosBancarios.objRsponseFunction.result;
                        var resultSearch = searchDatosBancarios.objRsponseFunction.search;
                        for (var q = 0; q < resultSet.length; q++) {
                            var infoDatoBancario = new Object({});
                            infoDatoBancario.idInterno = resultSet[q].getValue({
                                name: resultSearch.columns[0]
                            });
                            infoDatoBancario.proveedor = resultSet[q].getValue({
                                name: resultSearch.columns[2]
                            });
                            infoDatoBancario.moneda = resultSet[q].getValue({
                                name: resultSearch.columns[3]
                            });
                            arrayDatosBancarios.push(infoDatoBancario);
                        }
                    }
                    /*else {
                                           log.error('Pago Liquidaciones Servicios', 'INPUT DATA - Error Datos Bancarios Proveedores');
                                           log.audit('Pago Liquidaciones Servicios', 'FIN GET INPUT DATA');
                                           return null;
                                       }*/
                } else {
                    log.error('Pago Liquidaciones Servicios', 'INPUT DATA - Error Datos Bancarios Proveedores');
                    log.audit('Pago Liquidaciones Servicios', 'FIN GET INPUT DATA');
                    return null;
                }
                // INICIO - Consultar Datos Bancarios Proveedores Comisionistas

                if ((!isEmpty(arrayRegistrosLiquidaciones) && arrayRegistrosLiquidaciones.length > 0)) {

                    log.debug('Pago Liquidaciones Servicios', 'INPUT DATA - ID Liquidaciones A Procesar : ' + informacionProcesar.idRegistrosLiquidacionesProcesar);

                    if ((!isEmpty(arrayRegistrosLiquidaciones) && arrayRegistrosLiquidaciones.length > 0)) {
                        // INICIO Consultar Liquidaciones A Pagar
                        var liquidacionesPendientes = search.load({
                            id: 'customsearch_3k_liq_pend_pago_det'
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

                            obj.idCuentaIngreso = '';
                            obj.idDatosBancarios = '';

                            obj.formaPago = formaPago;
                            obj.fechaPago = fechaPago;
                            obj.numeroLiquidacion = numeroLiquidacion;
                            obj.cuentaOrigen = cuentaOrigen;

                            obj.formularioImpresion = formularioImpresion;
                            obj.fechaChequeDiferido = fechaChequeDiferido;
                            obj.imprimirCheque = imprimirCheque;

                            obj.idInternoLiquidacion = completeResultSet[i].getValue({
                                name: resultSearch.columns[0]
                            });
                            obj.empresa = completeResultSet[i].getValue({
                                name: resultSearch.columns[2]
                            });

                            obj.moneda = completeResultSet[i].getValue({
                                name: resultSearch.columns[3]
                            });

                            if (!isEmpty(obj.moneda)) {

                                var objCuentaPago = arrayInfoCuentas.filter(function(objeto) {
                                    return (objeto.moneda == obj.moneda);
                                });

                                if (!isEmpty(objCuentaPago) && objCuentaPago.length > 0) {
                                    if (!isEmpty(objCuentaPago[0].cuentaPago)) {
                                        obj.idCuentaIngreso = objCuentaPago[0].cuentaPago;
                                    }
                                }

                                var objDatosBancarios = arrayDatosBancarios.filter(function(objeto) {
                                    return (objeto.proveedor == obj.empresa && objeto.moneda == obj.moneda);
                                });

                                if (!isEmpty(objDatosBancarios) && objDatosBancarios.length > 0) {
                                    if (!isEmpty(objDatosBancarios[0].idInterno)) {
                                        obj.idDatosBancarios = objDatosBancarios[0].idInterno;
                                    }
                                }

                            }

                            obj.importePago = completeResultSet[i].getValue({
                                name: resultSearch.columns[4]
                            });
                            obj.sitio = completeResultSet[i].getValue({
                                name: resultSearch.columns[5]
                            });

                            obj.idArchivoLiquidacion = completeResultSet[i].getValue({
                                name: resultSearch.columns[6]
                            });

                            obj.bancoEmisorPago = bancoEmisorPago;

                            infProcesar.push(obj);
                        }
                        //  FIN Consultar Liquidaciones A Pagar

                    }


                    log.audit('Pago Liquidaciones Servicios', 'FIN GET INPUT DATA');
                    return infProcesar;
                } else {
                    log.error('Pago Liquidaciones Servicios', 'INPUT DATA - Error Obteniendo ID de Liquidaciones A Procesar');
                    log.audit('Pago Liquidaciones Servicios', 'FIN GET INPUT DATA');
                    return null;
                }

            } catch (excepcion) {
                log.error('Pago Liquidaciones Servicios', 'INPUT DATA - Excepcion Obteniendo ID de Liquidaciones A Procesar - Excepcion : ' + excepcion.message.toString());
                log.audit('Pago Liquidaciones Servicios', 'FIN GET INPUT DATA');
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
            log.audit('Pago Liquidaciones Servicios', 'INICIO MAP');

            try {

                var resultado = context.value;

                if (!isEmpty(resultado)) {

                    var searchResult = JSON.parse(resultado);

                    if (!isEmpty(searchResult)) {

                        //var fechaServidor = new Date();

                        /*var fechaLocalString = format.format({
                            value: fechaServidor,
                            type: format.Type.DATETIME,
                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                        });*/

                        /*var fechaLocal = format.parse({
                            value: fechaLocalString,
                            type: format.Type.DATETIME,
                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                        });*/

                        var obj = new Object();

                        obj.idCuentaIngreso = searchResult.idCuentaIngreso;
                        obj.idDatosBancarios = searchResult.idDatosBancarios;
                        obj.idLiquidacion = searchResult.idInternoLiquidacion;
                        obj.empresa = searchResult.empresa;
                        obj.moneda = searchResult.moneda;
                        obj.importePago = searchResult.importePago;
                        obj.sitio = searchResult.sitio;
                        //obj.fecha = fechaLocal;
                        obj.idArchivoLiquidacion = searchResult.idArchivoLiquidacion;
                        obj.formaPago = searchResult.formaPago;
                        obj.fechaPago = searchResult.fechaPago;
                        obj.numeroLiquidacion = searchResult.numeroLiquidacion;
                        obj.cuentaOrigen = searchResult.cuentaOrigen;

                        obj.formularioImpresion = searchResult.formularioImpresion;
                        obj.fechaChequeDiferido = searchResult.fechaChequeDiferido;
                        obj.imprimirCheque = searchResult.imprimirCheque;
                        obj.bancoEmisorPago = searchResult.bancoEmisorPago;

                        //var clave = obj.sitio + '-' + obj.empresa + '-' + obj.moneda;
                        var clave = obj.idLiquidacion;

                        context.write(clave, JSON.stringify(obj));

                    } else {
                        log.error('Pago Liquidaciones Servicios', 'MAP - Error Obteniendo Resultados de ID de Liquidaciones A Procesar');
                    }

                } else {
                    log.error('Pago Liquidaciones Servicios', 'MAP - Error Parseando Resultados de ID de Liquidaciones A Procesar');
                }

            } catch (excepcion) {
                log.error('Pago Liquidaciones Servicios', 'MAP - Excepcion Procesando ID de Liquidaciones A Procesar - Excepcion : ' + excepcion.message.toString());
            }

            log.audit('Pago Liquidaciones Servicios', 'FIN MAP');

        }

        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {
            log.audit('Pago Liquidaciones Servicios', 'INICIO REDUCE - KEY : ' + context.key);

            var idPago = null;
            var idLiquidacion = null;
            var intFileId = null;

            var error = false;
            var mensajeError = '';

            var importePago = 0;

            var idEmpresa = '';
            var idEmpresaStr = '';
            var idMoneda = '';
            var idMonedaStr = '';
            //var fecha = null;
            var idCuentaIngreso = '';
            var idDatosBancarios = '';
            var idSitio = '';
            var numLiquidacion = '';

            var numeroLiquidacion = '';
            var fechaPago = '';
            var cuentaOrigen = '';

            var formularioImpresion = '';
            var fechaChequeDiferido = '';
            var imprimirCheque = false;

            var idArchivoLiquidacion = '';
            var bancoEmisorPago = null;


            if (!isEmpty(context.values) && context.values.length > 0) {
                for (var i = 0; !isEmpty(context.values) && context.values.length > 0 && i < context.values.length && error == false; i++) {

                    var registro = JSON.parse(context.values[i]);

                    if (!isEmpty(registro)) {

                        if (i == 0) {
                            idCuentaIngreso = registro.idCuentaIngreso;
                            idDatosBancarios = registro.idDatosBancarios;
                            idEmpresa = registro.empresa;
                            idMoneda = registro.moneda;
                            //fecha = registro.fecha;
                            idSitio = registro.sitio;
                            idLiquidacion = registro.idLiquidacion;
                            numeroLiquidacion = registro.numeroLiquidacion;
                            fechaPago = registro.fechaPago;
                            formaPago = registro.formaPago;
                            cuentaOrigen = registro.cuentaOrigen;

                            formularioImpresion = registro.formularioImpresion;
                            fechaChequeDiferido = registro.fechaChequeDiferido;

                            if (!isEmpty(registro.imprimirCheque) && registro.imprimirCheque == 'T') {
                                imprimirCheque = true;
                            }

                            idArchivoLiquidacion = registro.idArchivoLiquidacion;

                            if (!isEmpty(registro.importePago) && !isNaN((registro.importePago))) {
                                importePago = parseFloat(importePago, 10) + parseFloat(registro.importePago, 10);
                            } else {
                                error = true;
                                mensajeError = 'Importe de Liquidacion : ' + registro.importePago + ' Invalido';
                            }

                            bancoEmisorPago = registro.bancoEmisorPago;

                        }
                    } else {
                        error = true;
                        mensajeError = "Error No se Recibio Informacion del registro de Liquidacion para generar el Pago";
                    }
                }

            } else {
                error = true;
                mensajeError = "Error No se Recibio Informacion del registro de Liquidacion para generar el Pago";
            }

            if (importePago > 0) {

                if (error == false && !isEmpty(idEmpresa) && !isEmpty(idMoneda) && !isEmpty(cuentaOrigen) && !isEmpty(idCuentaIngreso) && !isEmpty(idSitio) && !isEmpty(idLiquidacion)) {

                    var esTransferencia = false;
                    // INICIO GENERAR PAGO
                    var registroPago = record.create({
                        type: 'check',
                        isDynamic: true
                    });

                    log.error('Pago Liquidaciones Servicios', 'REDUCE - Fecha Cheque : ' + fechaPago);

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

                    //log.error('Pago Liquidaciones Servicios', 'REDUCE - Fecha Cheque Date : ' + fechaLocal);

                    /*registroPago.setValue({
                        fieldId: 'date',
                        value: fechaLocal
                    });*/

                    registroPago.setValue({
                        fieldId: 'entity',
                        value: idEmpresa,
                        ignoreFieldChange: false
                    });

                    registroPago.setValue({
                        fieldId: 'account',
                        value: cuentaOrigen
                    });

                    registroPago.setValue({
                        fieldId: 'currency',
                        value: idMoneda,
                        ignoreFieldChange: false
                    });

                    registroPago.setValue({
                        fieldId: 'custbody_cseg_3k_sitio_web_o',
                        value: idSitio
                    });

                    registroPago.setValue({
                        fieldId: 'custbody_3k_pago_liq',
                        value: true
                    });

                    registroPago.setValue({
                        fieldId: 'custbody_3k_liq_asociada',
                        value: idLiquidacion
                    });

                    if (!isEmpty(idArchivoLiquidacion)) {

                        registroPago.setValue({
                            fieldId: 'custbody_3k_arch_liq',
                            value: idArchivoLiquidacion
                        });

                    }

                    if (!isEmpty(idDatosBancarios)) {
                        registroPago.setValue({
                            fieldId: 'custbody_3k_datos_bancarios',
                            value: idDatosBancarios,
                            ignoreFieldChange: false
                        });
                    }

                    if (!isEmpty(formaPago)) {
                        registroPago.setValue({
                            fieldId: 'custbody_3k_forma_de_pago_prov',
                            value: formaPago
                        });

                        var objFieldLookUpFormaPago = search.lookupFields({
                            type: 'customrecord_3k_forma_de_pago',
                            id: formaPago,
                            columns: [
                                'custrecord_3k_forma_de_pago_transf'
                            ]
                        });

                        if (!isEmpty(objFieldLookUpFormaPago) && objFieldLookUpFormaPago.custrecord_3k_forma_de_pago_transf == true) {
                            esTransferencia = true;
                        }
                    }

                    if (!isEmpty(fechaPago)) {
                        var fechaPagoDate = format.parse({
                            value: fechaPago,
                            type: format.Type.DATE,
                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                        });

                        log.error('Pago Liquidaciones Servicios', 'REDUCE - Fecha Pago : ' + fechaPagoDate);

                        registroPago.setValue({
                            fieldId: 'custbody_3k_fecha_pago',
                            value: fechaPagoDate
                        });

                        registroPago.setValue({
                            fieldId: 'trandate',
                            value: fechaPagoDate
                        });
                    }

                    if (!isEmpty(numeroLiquidacion)) {

                        registroPago.setValue({
                            fieldId: 'custbody_3k_nro_liquidacion',
                            value: numeroLiquidacion
                        });
                    }

                    if (!isEmpty(fechaChequeDiferido)) {
                        var fechaChequeDiferidoDate = format.parse({
                            value: fechaChequeDiferido,
                            type: format.Type.DATE,
                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                        });

                        log.error('Pago Liquidaciones Servicios', 'REDUCE - Fecha Diferida : ' + fechaChequeDiferidoDate);

                        registroPago.setValue({
                            fieldId: 'custbody_3k_fecha_diferida',
                            value: fechaChequeDiferidoDate
                        });
                    }

                    if (!isEmpty(formularioImpresion)) {

                        registroPago.setValue({
                            fieldId: 'custbody3k_formulario_de_impresion',
                            value: formularioImpresion
                        });
                    }

                    if (!isEmpty(bancoEmisorPago)) {

                        registroPago.setValue({
                            fieldId: 'custbody_3k_banco',
                            value: bancoEmisorPago
                        });
                    }

                    if (!isEmpty(imprimirCheque) && imprimirCheque == true && esTransferencia == false) {

                        registroPago.setValue({
                            fieldId: 'tobeprinted',
                            value: true
                        });
                    } else {
                        registroPago.setValue({
                            fieldId: 'tobeprinted',
                            value: false
                        });
                    }

                    if (esTransferencia == true) {
                        registroPago.setValue({
                            fieldId: 'tobeprinted',
                            value: true
                        });
                    }

                    registroPago.selectNewLine({
                        sublistId: 'expense'
                    });

                    registroPago.setCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'account',
                        value: idCuentaIngreso
                    });

                    registroPago.setCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'amount',
                        value: parseFloat(importePago, 10).toFixed(2).toString()
                    });

                    registroPago.commitLine({
                        sublistId: 'expense'
                    });


                    try {
                        idPago = registroPago.save();
                    } catch (excepcionPago) {
                        error = true;
                        mensajeError = 'Excepcion Generando Pago de Liquidacion - Excepcion : ' + excepcionPago.message.toString();
                        log.error('Pago Liquidaciones Servicios', 'REDUCE - EXcepcion : ' + mensajeError);
                    }
                    if (isEmpty(idPago)) {
                        error = true;
                        mensajeError = 'Error Generando Pago de Liquidacion - Error : No se recibio el ID Interno del Pago';
                    } else {
                        if (esTransferencia == true) {
                            try {
                                var idPagoActualizado = record.submitFields({
                                    type: 'check',
                                    id: idPago,
                                    values: {
                                        tobeprinted: false,
                                        tranid: ''
                                    },
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields: true
                                    }
                                });

                            } catch (excepcionPagoActualizar) {
                                error = true;
                                mensajeError = 'Excepcion Generando Pago de Liquidacion - Excepcion : ' + excepcionPagoActualizar.message.toString();
                            }
                        }
                    }
                } else {
                    if (error == false) {
                        error = true;
                        var mensaje = 'No se Recibio la Siguiente Informacion requerida del Registro de Liquidacion : ';
                        if (isEmpty(idCuentaIngreso)) {
                            mensaje = mensaje + ' Cuenta de Ingresos A Utilizar para realizar el Pago de la Liquidacion / ';
                        }

                        if (isEmpty(cuentaOrigen)) {
                            mensaje = mensaje + ' Cuenta de Origen A Utilizar para realizar el Pago de la Liquidacion / ';
                        }

                        if (isEmpty(idSitio)) {
                            mensaje = mensaje + ' Sitio A Utilizar para realizar el Pago de la Liquidacion / ';
                        }
                        if (isEmpty(idLiquidacion)) {
                            mensaje = mensaje + ' ID Interno de Liquidaciones A Pagar / ';
                        }
                        if (isEmpty(idEmpresa)) {
                            mensaje = mensaje + ' Empresa (Proveedor) / ';
                        }
                        if (isEmpty(idMoneda)) {
                            mensaje = mensaje + ' Moneda / ';
                        }
                        if (isEmpty(fechaPago)) {
                            mensaje = mensaje + ' Fecha / ';
                        }
                        if (isEmpty(importePago) || (!isEmpty(importePago) && importePago <= 0)) {
                            mensaje = mensaje + ' Importe de Pago';
                        }
                        mensajeError = mensaje;
                    }
                }

                if (!isEmpty(idPago)) {
                    // INICIO ACTUALIZAR PAGO EN LIQUIDACIONES
                    try {
                        var idRecLiquidacion = record.submitFields({
                            type: 'customrecord_3k_liquidacion_emp',
                            id: idLiquidacion,
                            values: {
                                custrecord_3k_liq_emp_pago_liq: idPago,
                                custrecord_3k_liq_pagada: true
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
                    // FIN ACTUALIZAR PAGO EN LIQUIDACIONES
                }

            } else {
                error = true;
                mensajeError = "No existe Importe A Pagar";
            }

            // FIN GENERAR PAGO LIQUIDACION

            var respuesta = new Object();
            respuesta.idPago = idPago;
            respuesta.idArchivoLiquidacion = intFileId;
            respuesta.idLiquidacion = idLiquidacion;
            respuesta.error = false;
            respuesta.mensaje = "";

            if (error == true) {
                log.error('Generacion Pago Liquidacion', 'REDUCE - ' + mensajeError);
                respuesta.error = true;
                respuesta.mensaje = mensajeError;
            } else {
                respuesta.mensaje = 'El Pago con ID Interno : ' + idPago + ' Se genero correctamente Asociado a la Liquidacion : ' + idRecLiquidacion;
            }

            log.audit('Generacion Pago Liquidacion', 'FIN REDUCE - KEY : ' + context.key + ' ID PAGO GENERADO : ' + idPago + ' - ID LIQUIDACION GENERADA : ' + idRecLiquidacion);

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
            var mensajeErrorGeneral = 'El Proceso de Pago de Liquidaciones Servicios Finalizo con errores';
            var mensajeOKGeneral = 'El Proceso de Pago de Liquidaciones Servicios Finalizo Correctamente';
            var error = false;
            var mensajeError = '';
            var idLog = null;
            log.audit('Generacion Pagos Liquidacion', 'INICIO SUMMARIZE');


            try {

                // INICIO OBTENER CONFIGURACION DE LIQUIDACIONES
                var errorConfiguracionLIQ = false;
                var dominio = '';
                var idRTLog = '';
                var idEstadoFinalizado = '';
                var idEstadoError = '';
                var idEstadoCorrecto = '';

                var mySearch = search.load({
                    id: 'customsearch_3k_config_pago_liq'
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
                    log.error('Generacion Pago Liquidacion', 'SUMMARIZE - ' + 'No se encuentra realizada la configuracion de los Pagos de Liquidaciones');
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
                    type: 'customrecord_3k_gen_pago_liq_log'
                });

                registroLOG.setValue({
                    fieldId: 'custrecord_3k_gen_pago_liq_log_fecha',
                    value: fechaLocal
                });
                if (!isEmpty(idEstadoFinalizado)) {
                    registroLOG.setValue({
                        fieldId: 'custrecord_3k_gen_pago_liq_log_est',
                        value: idEstadoFinalizado
                    });
                }

                try {
                    idLog = registroLOG.save();
                    if (isEmpty(idLog)) {
                        error = true;
                        mensajeError = 'No se recibio el ID del LOG de Pago de Liquidacion Generado';
                    }
                } catch (excepcionLOG) {
                    error = true;
                    mensajeError = 'Excepcion Grabando LOG de Proceso de Generacion de Pagos de Liquidaciones - Excepcion : ' + excepcionLOG.message.toString();
                }
                // FIN Generar Cabecera Log
                // INICIO Generar Detalle Log
                if (error == false) {
                    summary.output.iterator().each(function(key, value) {
                        if (error == false) {
                            if (!isEmpty(value)) {
                                var registro = JSON.parse(value);
                                log.debug('Generacion Pago Liquidacion', 'Registro : ' + JSON.stringify(registro));
                                if (!isEmpty(registro)) {
                                    var idEstado = idEstadoCorrecto;
                                    if (registro.error == true) {
                                        errorGeneral = true;
                                        idEstado = idEstadoError;
                                    }
                                    var registroDLOG = record.create({
                                        type: 'customrecord_3k_gen_pago_liq_logdet'
                                    });

                                    registroDLOG.setValue({
                                        fieldId: 'custrecord_3k_gen_pago_liq_logdet_fecha',
                                        value: fechaLocal
                                    });
                                    if (!isEmpty(idEstado)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_pago_liq_logdet_est',
                                            value: idEstado
                                        });
                                    }
                                    if (!isEmpty(registro.mensaje)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_pago_liq_logdet_desc',
                                            value: registro.mensaje
                                        });
                                    }
                                    if (!isEmpty(registro.idPago)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_pago_liq_logdet_pliq',
                                            value: registro.idPago
                                        });
                                    }
                                    if (!isEmpty(registro.idLiquidacion)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_pago_liq_logdet_liq',
                                            value: registro.idLiquidacion
                                        });
                                    }
                                    if (!isEmpty(idLog)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_pago_liq_logdet_log',
                                            value: idLog
                                        });
                                    }
                                    try {
                                        idDLog = registroDLOG.save();
                                        if (isEmpty(idDLog)) {
                                            error = true;
                                            mensajeError = 'No se recibio el ID del Detalle de LOG de Pago de Liquidacion Generado';
                                        }
                                    } catch (excepcionDLOG) {
                                        error = true;
                                        mensajeError = 'Excepcion Grabando el Detalle de LOG de Proceso de Generacion de Pago de Liquidacion - Excepcion : ' + excepcionDLOG.message.toString();
                                    }
                                } else {
                                    error = true;
                                    mensajeError = 'Error Parseando Informacion de Pago de Liquidacion Generada';
                                }
                            } else {
                                error = true;
                                mensajeError = 'Error Obteniendo Informacion de Pago de Liquidacion Generada';
                            }
                        }
                        return true;
                    });
                }
                // FIN Generar Detalle Log

            } catch (excepcion) {

                error = true;
                mensajeError = 'Excepcion Generando LOG de Proceso de Generacion de Pago de Liquidacion - Excepcion : ' + excepcion.message.toString();
            }

            if (error == true) {
                errorGeneral = true;
                log.error('Generacion Pago Liquidacion', 'SUMMARIZE - ' + mensajeError);
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
                    var informacionFaltante = 'No se pudo generar el Link de Acceso al LOG de la Generacion de los Pagos de Comisiones debido a que falta la siguiente informacion : ';
                    if (isEmpty(idLog)) {
                        informacionFaltante = informacionFaltante + ' ID del Registro de LOG Generado / ';
                    }
                    if (isEmpty(dominio)) {
                        informacionFaltante = informacionFaltante + ' Configuracion del Dominio de NetSuite en el Panel de Configuracion de Pagos Liquidaciones / ';
                    }
                    if (isEmpty(idRTLog)) {
                        informacionFaltante = informacionFaltante + ' Configuracion del ID del RecordType de LOG en el Panel de Configuracion de Pagos Liquidaciones / ';
                    }
                    log.error('Generacion Pago Liquidacion', 'SUMMARIZE - ' + informacionFaltante);
                }
            }

            var titulo = 'Proceso Generacion de Pagos de Liquidaciones';

            var mensaje = '<html><head></head><body><br>' + mensajeMail + '<br>' + link + '</body></html>';

            enviarEmail(autor, destinatario, titulo, mensaje);
            // FIN Enviar Email Log

            log.audit('Generacion Pago Liquidacion', 'FIN SUMMARIZE');

            handleErrorIfAny(summary);
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
                        var filtroID = '';
                        if (!isEmpty(join)) {
                            filtroID = search.createFilter({
                                name: nombre,
                                operator: arrayParams[i].operator,
                                join: join,
                                values: value
                            });
                        } else {
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
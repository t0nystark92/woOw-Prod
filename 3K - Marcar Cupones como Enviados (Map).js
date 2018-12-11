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

define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/format', 'N/runtime'],
    /**
     * @param {record} record
     */
    function(search, record, email, runtime, error, format, runtime) {

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
            log.debug('Funcionalidades Cupon', 'SUMMARIZE - INICIO ENVIO EMAIL - ID AUTOR : ' + autor + ' - ID DESTINATARIO : ' + destinatario + ' - TITULO : ' + titulo + ' - MENSAJE : ' + mensaje);

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
                log.error('Generar Ordenes de Compras', 'SUMMARIZE - Error Envio Email - Error : ' + detalleError);
            }
            log.debug('Funcionalidades Cupon', 'SUMMARIZE - FIN ENVIO EMAIL');
        }

        function handleErrorAndSendNotification(e, stage) {
            log.error('Estado : ' + stage + ' Error', e);

            var author = runtime.getCurrentUser().id;
            var recipients = runtime.getCurrentUser().id;
            var subject = 'Proceso Funcionalidades Cupon ' + runtime.getCurrentScript().id + ' Error en Estado : ' + stage;
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
                informacion.idRegistrosProcesar = currScript.getParameter('custscript_3k_cupon_id');
                informacion.numeroDespacho = currScript.getParameter('custscript_3k_numero_despacho');

                return informacion;
            } catch (excepcion) {
                log.error('getParams', 'INPUT DATA - Excepcion Obteniendo Parametros - Excepcion : ' + excepcion.message.toString());
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

                log.audit('Generar Cupones Envio', 'INICIO GET INPUT DATA');

                // INICIO Obtener Parametros
                var informacionProcesar = getParams();
                // FIN Obtener Parametros
                var arrayRegistros = new Array();
                log.debug('Generar Cupones Envio', 'INPUT DATA - ID Cupones A Procesar : ' + informacionProcesar.idRegistrosProcesar);
                if (!isEmpty(informacionProcesar) && !isEmpty(informacionProcesar.idRegistrosProcesar)) {

                    var arrayCupones = informacionProcesar.idRegistrosProcesar.split(',');

                    for (var i = 0; i < arrayCupones.length; i++) {
                        var objCupones = new Object({});
                        objCupones.idCupon = arrayCupones[i];
                        objCupones.numeroDespacho = informacionProcesar.numeroDespacho;

                        arrayRegistros.push(objCupones);
                    }

                }


                return arrayRegistros;


            } catch (excepcion) {
                log.error('Generar Cupones Envio', 'INPUT DATA - Excepcion Obteniendo ID de Cupones A Procesar - Excepcion : ' + excepcion.message.toString());
                log.audit('Generar Cupones Envio', 'FIN GET INPUT DATA');
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
            log.audit('Generar Cupones Envio', 'INICIO MAP');

            try {

                var resultado = context.value;

                if (!isEmpty(resultado)) {

                    var searchResult = JSON.parse(resultado);

                    if (!isEmpty(searchResult)) {

                        var obj = new Object();

                        obj.idInternoCupon = searchResult.idCupon;
                        obj.numeroDespacho = searchResult.numeroDespacho;

                        var clave = obj.idInternoCupon;

                        context.write(clave, JSON.stringify(obj));

                    } else {
                        log.error('Generar Cupones Envio', 'MAP - Error Obteniendo Resultados de ID de Cupones A Procesar');
                    }

                } else {
                    log.error('Generar Cupones Envio', 'MAP - Error Parseando Resultados de ID de Cupones A Procesar');
                }

            } catch (excepcion) {
                log.error('Generar Cupones Envio', 'MAP - Excepcion Procesando ID de Cupones A Procesar - Excepcion : ' + excepcion.message.toString());
            }

            log.audit('Generar Cupones Envio', 'FIN MAP');

        }

        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {
            log.audit('Generar Cupones Envio', 'INICIO REDUCE - KEY : ' + context.key);

            var error = false;
            var mensajeError = '';
            //var arrayCupones = [];

            if (!isEmpty(context.values) && context.values.length > 0) {
                for (var i = 0; !isEmpty(context.values) && context.values.length > 0 && i < context.values.length; i++) {
                    registro = JSON.parse(context.values[i]);

                    if (!isEmpty(registro)) {

                        var idCupon = registro.idInternoCupon;
                        //arrayCupones.push(idCupon);
                        var numeroDespacho = registro.numeroDespacho;
                        log.debug('map-reduce cupon', 'idCupon: ' + idCupon);
                        // INICIO - Generar Custom Transaction Ingreso/Deuda Confirmar
                        var objRecord = record.load({
                            type: 'customrecord_3k_cupones',
                            id: idCupon,
                            isDynamic: true,
                        });

                        /*objRecord.setValue({
                            fieldId: 'custrecord_3k_cupon_envio_ok',
                            value: true
                        });*/

                        var idRemito = objRecord.getValue({
                            fieldId: 'custrecord_3k_cupon_remito'
                        });

                        log.debug('ship', ' idRemito: '+ idRemito);

                        var objFieldLookUpRecord = search.lookupFields({
                            type: record.Type.ITEM_FULFILLMENT,
                            id: idRemito,
                            columns: ['status']
                        });

                        log.debug('ship', 'objFieldLookUpRecord: '+ JSON.stringify(objFieldLookUpRecord));

                        var statusRemito = objFieldLookUpRecord.status[0].value;

                        log.debug('ship', 'status: '+ statusRemito);

                        if (statusRemito == 'picked') {

                            var fechaJS = new Date();



                            var fechaString = format.format({
                                value: fechaJS,
                                type: format.Type.DATE,
                                timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                            });

                            var fechaNS = format.parse({
                                value: fechaString,
                                type: format.Type.DATE,
                                timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                            });

                            

                            objRecord.setValue({
                                fieldId: 'custrecord_3k_cupon_fecha_envio',
                                value: fechaNS
                            });

                            record.submitFields({
                                type: record.Type.ITEM_FULFILLMENT,
                                id: idRemito,
                                values: {
                                    shipstatus: 'C'
                                },
                                options: {
                                    enableSourcing: true,
                                    ignoreMandatoryFields: false
                                }
                            });


                        }

                        objRecord.setValue({
                            fieldId: 'custrecord_3k_cupon_nro_despacho',
                            value: numeroDespacho
                        });

                        var idRegistroCupon = '';
                        try {
                            idRegistroCupon = objRecord.save();
                            log.debug('map-reduce cupon', 'idRegistroCupon: ' + idRegistroCupon);
                        } catch (excepcionCupon) {
                            error = true;
                            mensajeError = 'Excepcion Grabando Cupon con ID Interno : ' + idCupon + ' - Excepcion : ' + excepcionCupon.message.toString();
                        }
                        if (isEmpty(idRegistroCupon) && !error) {
                            error = true;
                            mensajeError = 'Error Grabando Cupon con ID Interno : ' + idCupon + ' - Error : No se recibio el ID Interno del Cupon Actualizado';
                        }

                        // FIN - Generar Custom Transaction Ingreso/Deuda Confirmar


                        var respuesta = new Object();
                        respuesta.idCupon = idCupon;
                        respuesta.error = false;
                        respuesta.mensaje = "";

                        if (error == true) {
                            log.error('Generar Cupones Envio', 'REDUCE - ' + mensajeError);
                            respuesta.error = true;
                            respuesta.mensaje = mensajeError;
                        } else {
                            respuesta.mensaje = 'El Cuponcon ID Interno : ' + idCupon + ' Se actualizo correctamente';
                        }

                        log.audit('Generar Cupones Envio', 'FIN REDUCE - KEY : ' + context.key + ' ID CUPON ACTUALIZO : ' + idCupon);

                        context.write(context.key, respuesta);
                    }
                }
            } else {
                error = true;
                mensajeError = "Error No se Recibio Informacion del registro de Cupon para Generar Cupones Envio";
            }
        }

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {
            var errorGeneral = false;
            var mensajeErrorGeneral = 'El Proceso de Marcar Cupones Envio Finalizo con errores';
            var mensajeOKGeneral = 'El Proceso de Marcar Cupones Envio Finalizo Correctamente';
            var error = false;
            var mensajeError = '';
            var idLog = null;
            log.audit('Marcar Cupones Envio', 'INICIO SUMMARIZE');

            try {

                // INICIO OBTENER CONFIGURACION DE ORDENES DE COMPRAS
                var errorConfiguracionOC = false;
                var dominio = '';
                var idRTLog = '';
                var idEstadoFinalizado = '';
                var idEstadoError = '';
                var idEstadoCorrecto = '';

                var mySearch = search.load({
                    id: 'customsearch_3k_conf_marcar_cupones'
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
                    errorConfiguracionOC = true;
                    log.error('Marcar Cupones Envio', 'SUMMARIZE - ' + 'No se encuentra realizada la configuracion de los Cupones');
                }
                // FIN OBTENER CONFIGURACION DE ORDENES DE COMPRAS

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
                    type: 'customrecord_3k_marcar_cup_env_log'
                });

                registroLOG.setValue({
                    fieldId: 'custrecord_3k_marcar_cup_env_log_fecha',
                    value: fechaLocal
                });
                if (!isEmpty(idEstadoFinalizado)) {
                    registroLOG.setValue({
                        fieldId: 'ustrecord_3k_marcar_cup_env_log_est',
                        value: idEstadoFinalizado
                    });
                }

                try {
                    idLog = registroLOG.save();
                    if (isEmpty(idLog)) {
                        error = true;
                        mensajeError = 'No se recibio el ID del LOG de Ordenes de Compras Generado';
                    }
                } catch (excepcionLOG) {
                    error = true;
                    mensajeError = 'Excepcion Grabando LOG de Proceso de Generacion de Ordenes de Compras - Excepcion : ' + excepcionLOG.message.toString();
                }
                // FIN Generar Cabecera Log
                // INICIO Generar Detalle Log
                if (error == false) {
                    summary.output.iterator().each(function(key, value) {
                        if (error == false) {
                            if (!isEmpty(value)) {
                                var registro = JSON.parse(value);
                                if (!isEmpty(registro)) {
                                    var idEstado = idEstadoCorrecto;
                                    if (registro.error == true) {
                                        errorGeneral = true;
                                        idEstado = idEstadoError;
                                    }
                                    var registroDLOG = record.create({
                                        type: 'customrecord_3k_marcar_cup_env_logdet'
                                    });

                                    registroDLOG.setValue({
                                        fieldId: 'custrecord_3k_marcar_cup_env_logdet_fech',
                                        value: fechaLocal
                                    });
                                    if (!isEmpty(idEstado)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_marcar_cup_env_logdet_est',
                                            value: idEstado
                                        });
                                    }
                                    if (!isEmpty(registro.mensaje)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_marcar_cup_env_logdet_desc',
                                            value: registro.mensaje
                                        });
                                    }
                                    if (!isEmpty(registro.idCupon)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_marcar_cup_env_logdet_cup',
                                            value: registro.idCupon
                                        });
                                    }
                                    /*if (!isEmpty(registro.idOrdenCompra)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_oc_logdet_oc',
                                            value: registro.idOrdenCompra
                                        });
                                    }
                                    if (!isEmpty(registro.idOrdenTransferencia)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_oc_logdet_ot',
                                            value: registro.idOrdenTransferencia
                                        });
                                    }*/
                                    if (!isEmpty(idLog)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_marcar_cup_env_logdet_log',
                                            value: idLog
                                        });
                                    }
                                    try {
                                        idDLog = registroDLOG.save();
                                        if (isEmpty(idDLog)) {
                                            error = true;
                                            mensajeError = 'No se recibio el ID del Detalle de LOG de Ordenes de Compras Generado';
                                        }
                                    } catch (excepcionDLOG) {
                                        error = true;
                                        mensajeError = 'Excepcion Grabando el Detalle de LOG de Proceso de Generacion de Ordenes de Compras - Excepcion : ' + excepcionDLOG.message.toString();
                                    }
                                } else {
                                    error = true;
                                    mensajeError = 'Error Parseando Informacion de Ordenes de Compras Generadas';
                                }
                            } else {
                                error = true;
                                mensajeError = 'Error Obteniendo Informacion de Ordenes de Compras Generadas';
                            }
                        }
                        return true;
                    });
                }
                // FIN Generar Detalle Log

            } catch (excepcion) {

                error = true;
                mensajeError = 'Excepcion Generando LOG de Proceso de Generacion de Ordenes de Compras - Excepcion : ' + excepcion.message.toString();
            }

            if (error == true) {
                errorGeneral = true;
                log.error('Generar Ordenes de Compras', 'SUMMARIZE - ' + mensajeError);
            }
            // INICIO Enviar Email Log

            if (errorGeneral) {
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
                    if (errorConfiguracionOC == false) {
                        var informacionFaltante = 'No se pudo generar el Link de Acceso al LOG de la Generacion de las Ordenes de Compras debido a que falta la siguiente informacion : ';
                        if (isEmpty(idLog)) {
                            informacionFaltante = informacionFaltante + ' ID del Registro de LOG Generado / ';
                        }
                        if (isEmpty(dominio)) {
                            informacionFaltante = informacionFaltante + ' Configuracion del Dominio de NetSuite en el Panel de Configuracion de Ordenes de Compras / ';
                        }
                        if (isEmpty(idRTLog)) {
                            informacionFaltante = informacionFaltante + ' Configuracion del ID del RecordType de LOG en el Panel de Configuracion de Ordenes de Compras / ';
                        }
                        log.error('Generar Ordenes de Compras', 'SUMMARIZE - ' + informacionFaltante);
                    }
                }

                var titulo = 'Proceso Generacion de Ordenes de Compras';

                var mensaje = '<html><head></head><body><br>' + mensajeMail + '<br>' + link + '</body></html>';

                enviarEmail(autor, destinatario, titulo, mensaje);
            }
            // FIN Enviar Email Log

            log.audit('Generar Ordenes de Compras', 'FIN SUMMARIZE');

            handleErrorIfAny(summary);
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });

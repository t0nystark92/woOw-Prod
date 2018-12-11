/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */

/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities',
        '3K/funcionalidadesOV': './3K - Funcionalidades OV'
    }
});*/

define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/format', 'N/runtime', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {record} record
     */
    function(search, record, email, runtime, error, format, runtime, utilities, funcionalidades) {

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
            log.debug('Generar Facturas', 'SUMMARIZE - INICIO ENVIO EMAIL - ID AUTOR : ' + autor + ' - ID DESTINATARIO : ' + destinatario + ' - TITULO : ' + titulo + ' - MENSAJE : ' + mensaje);

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
                log.error('Generar Facturas', 'SUMMARIZE - Error Envio Email - Error : ' + detalleError);
            }
            log.debug('Generar Facturas', 'SUMMARIZE - FIN ENVIO EMAIL');
        }

        function handleErrorAndSendNotification(e, stage) {
            log.error('Estado : ' + stage + ' Error', e);

            var author = runtime.getCurrentUser().id;
            var recipients = runtime.getCurrentUser().id;
            var subject = 'Proceso de Generacion de Facturas ' + runtime.getCurrentScript().id + ' Error en Estado : ' + stage;
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

                log.audit('Generar Facturas', 'INICIO GET INPUT DATA');

                var facturasPendientes = search.load({
                    id: 'customsearch_3k_cupones_fact_dac'
                });

                log.audit('Generar Facturas', 'FIN GET INPUT DATA');
                return facturasPendientes;

            } catch (excepcion) {
                log.error('Generar Facturas', 'INPUT DATA - Excepcion Obteniendo Facturas A Procesar - Excepcion : ' + excepcion.message.toString());
                log.audit('Generar Facturas', 'FIN GET INPUT DATA');
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
            log.audit('Generar Facturas', 'INICIO MAP');

            try {
                var resultado = context.value;

                if (!isEmpty(resultado)) {

                    var searchResult = JSON.parse(resultado);

                    if (!isEmpty(searchResult)) {

                        var obj = new Object();

                        //log.debug('Generar Factura','Informacion : ' + JSON.stringify(searchResult));

                        obj.idOrdenVenta = searchResult.values.custrecord_3k_cupon_ord_venta.value;
                        obj.idOrden = searchResult.values.custrecord_3k_cupon_id_orden.value;
                        obj.idCupon = searchResult.values.internalid.value;
                        obj.fechaRemito = searchResult.values['trandate.CUSTRECORD_3K_CUPON_REMITO'];

                        var clave = obj.idOrdenVenta;

                        context.write(clave, JSON.stringify(obj));

                    } else {
                        log.error('Generar Facturas', 'MAP - Error Obteniendo Resultados de ID de Cupones A Procesar');
                    }

                } else {
                    log.error('Generar Facturas', 'MAP - Error Parseando Resultados de ID de Cupones A Procesar');
                }

            } catch (excepcion) {
                log.error('Generar Facturas', 'MAP - Excepcion Procesando ID de Cupones A Procesar - Excepcion : ' + excepcion.message.toString());
            }

            log.audit('Generar Facturas', 'FIN MAP');

        }

        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {
            log.audit('Generar Facturas', 'INICIO REDUCE - KEY : ' + context.key);

            var idOrdenVenta = null;
            var idOrden = null;
            var idCupon = null;

            var arrayRegistroFacturacion = new Array();
            var registroFacturacion = new Object({});

            var registroConsultaRemito = new Object({});
            registroConsultaRemito.comandas = new Array();

            var idUnico = 0;
            var idUnicoAnterior = 0;

            var i = 0;

            var error = false;
            var mensajeError = '';

            if (!isEmpty(context.values) && context.values.length > 0) {
                while (!isEmpty(context.values) && context.values.length > 0 && i < context.values.length && error == false) {
                    registro = JSON.parse(context.values[i]);

                    if (!isEmpty(registro)) {

                        if (i == 0) {
                            registroFacturacion.carrito = registro.idOrdenVenta;
                            registroFacturacion.facturaCompleta = 'N';
                            registroFacturacion.requiereDatoscliente = false;
                            registroFacturacion.informacionCliente = new Object({});
                            registroFacturacion.ordenes = new Array();
                            registroFacturacion.fechaRemito = '';

                            var comanda = new Object({});
                            comanda.idCarrito = registro.idOrdenVenta;
                            comanda.idRemito = '';
                            comanda.idOrdenes = new Array({});


                        }

                        idUnico = registro.idOrden;

                        comanda.idOrdenes.push(registro.idOrden);

                        registroFacturacion.fechaRemito = registro.fechaRemito;

                        var orden = new Object({});
                        orden.idOV = registro.idOrden;
                        orden.cupones = new Array();

                        do {

                            var cupon = new Object({});
                            cupon.idCupon = registro.idCupon;
                            orden.cupones.push(cupon);

                            idUnicoAnterior = idUnico;
                            i++;
                            if (i < context.values.length) {
                                registro = JSON.parse(context.values[i]);
                                if (!isEmpty(registro)) {
                                    idUnico = registro.idOrden;
                                } else {
                                    error = true;
                                    mensajeError = "Error No se Recibio Informacion del registro de Cupon para generar la Factura";
                                }
                            }
                        } while (i < context.values.length && idUnico == idUnicoAnterior && error == false);

                        registroFacturacion.ordenes.push(orden);

                        registroConsultaRemito.comandas.push(comanda);

                    } else {
                        error = true;
                        mensajeError = "Error No se Recibio Informacion del registro de Cupon para generar la Factura";
                    }
                }

            } else {
                error = true;
                mensajeError = "Error No se Recibio Informacion del registro de Cupon para generar la Factura";
            }

            log.debug('Generar Factura', 'registroFacturacion' + JSON.stringify(registroFacturacion));
            arrayRegistroFacturacion.push(registroFacturacion);
            log.debug('Generar Factura', 'arrayRegistroFacturacion' + JSON.stringify(arrayRegistroFacturacion));
            var objRespuesta = funcionalidades.generarFacturas(JSON.stringify(arrayRegistroFacturacion), true, true);

            var resultFacturas = JSON.parse(objRespuesta);

            log.debug('Generar Factura', 'reduce - resultFacturas: ' + JSON.stringify(resultFacturas));




            var respuesta = new Object({});
            respuesta.informacion = resultFacturas[0].idFactura;
            respuesta.error = false;
            respuesta.mensaje = "";

            if (resultFacturas[0].error) {
                respuesta.error = true;
                respuesta.mensaje = resultFacturas[0].detalle[0].mensaje;
            }


            if (error == true) {
                log.error('Generar Facturas', 'REDUCE - ' + error.mensajeError);
                respuesta.error = true;
                respuesta.mensaje = mensajeError;
            }



            context.write(context.key, respuesta);
        }

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {

            log.audit('Generar Facturas', 'INICIO SUMMARIZE');

            var error = false;
            var mensajeError = '';

            var facturasGenerar = new Array();
            var jsonFactura = [];
            var subsidiaria = '';

            try {

                var searchConfig = utilities.searchSaved('customsearch_3k_config_sub_fact');

                if (!utilities.isEmpty(searchConfig) && !searchConfig.error) {
                    if (!utilities.isEmpty(searchConfig.objRsponseFunction.result) && searchConfig.objRsponseFunction.result.length > 0) {
                        subsidiaria = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[1] });

                        if (utilities.isEmpty(subsidiaria)) {
                            error = true;
                            var mensajeError = 'No se encuentra configurada la siguiente informacion del panel de configuracion de Subsidiaria Facturacion : ';
                            if (utilities.isEmpty(subsidiaria)) {
                                mensajeError = mensajeError + ' Subsidiaria / ';
                            }

                        }
                    } else {
                        error = true;
                        mensajeError = 'No se encuentra realizada la configuracion de Subsidiaria Facturacion : ';

                    }
                } else {
                    error = true;
                    mensajeError = 'Error Consultando Configuracion de Subsidiaria de Facturacion - Tipo Error : ' + searchConfig.tipoError + ' - Descripcion : ' + searchConfig.descripcion;
                    //continue;
                }

                if (!error) {
                    summary.output.iterator().each(function(key, value) {
                        if (!isEmpty(value)) {
                            log.error('Generar Facturas', 'SUMMARIZE - Informacion : ' + value);
                            var respuesta = JSON.parse(value);
                            if (!isEmpty(respuesta)) {
                                if (!respuesta.error) {
                                    if (!isEmpty(respuesta.informacion)) {
                                        log.error('Generar Facturas', 'SUMMARIZE - respuesta.informacion : ' + respuesta.informacion);
                                        jsonFactura.push(respuesta.informacion);



                                    } else {
                                        error = true;
                                        mensajeError = 'No se recibio informacion de Cupones A Facturar';
                                    }
                                } else {
                                    error = true;
                                    mensajeError = respuesta.mensaje;
                                }

                            } else {
                                error = true;
                                mensajeError = 'Error Parseando Informacion de Cupones A Facturar';
                            }
                        } else {
                            error = true;
                            mensajeError = 'Error Obteniendo Informacion de Cupones A Facturar';
                        }
                        return true;
                    });
                }

                /*if (error == false) {
                    log.debug('Generar Facturas', 'SUMMARIZE - jsonFactura : ' + JSON.stringify(jsonFactura));

                     if (!error && jsonFactura.length > 0) {

                        var resultCae = funcionalidades.generarCAE(jsonFactura, subsidiaria);
                        log.debug('Generar Factura', 'SUMMARIZE - objRespuestaCAE: ' + JSON.stringify(resultCae));

                        if (resultCae.error) {
                            error = true;
                            mensajeError = resultCae.detalle[0].mensaje;

                        }
                    }

                }*/



                     if (jsonFactura.length > 0) {
                        log.debug('Generar Facturas', 'SUMMARIZE - jsonFactura : ' + JSON.stringify(jsonFactura));
                        var resultCae = funcionalidades.generarCAE(jsonFactura, subsidiaria);
                        log.debug('Generar Factura', 'SUMMARIZE - objRespuestaCAE: ' + JSON.stringify(resultCae));

                        if (resultCae.error) {
                            error = true;
                            mensajeError = resultCae.detalle[0].mensaje;

                        }
                    }

            } catch (excepcion) {

                error = true;
                mensajeError = 'Excepcion Generando Facturas - Excepcion : ' + excepcion.message.toString();
            }

            if (error == true) {
                log.error('Generar Facturas', 'SUMMARIZE - ' + mensajeError);
            }

            log.audit('Generar Facturas', 'FIN SUMMARIZE');

            handleErrorIfAny(summary);
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });

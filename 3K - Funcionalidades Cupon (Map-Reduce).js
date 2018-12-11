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
                informacion.idRegistrosProcesar = currScript.getParameter('custscript_3k_func_cupon_id');

                return informacion;
            } catch (excepcion) {
                log.error('Funcionalidades Cupon', 'INPUT DATA - Excepcion Obteniendo Parametros - Excepcion : ' + excepcion.message.toString());
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

                log.audit('Funcionalidades Cupon', 'INICIO GET INPUT DATA');

                // INICIO Obtener Parametros
                /*var informacionProcesar = getParams();
                // FIN Obtener Parametros
                var arrayRegistros = new Array();
                log.debug('Generar Ordenes de Compras', 'INPUT DATA - ID Requisiciones A Procesar : ' + informacionProcesar.idRegistrosProcesar);
                if (!isEmpty(informacionProcesar) && !isEmpty(informacionProcesar.idRegistrosProcesar)) {
                    arrayRegistros = informacionProcesar.idRegistrosProcesar.split(',');
                }

                if (!isEmpty(arrayRegistros) && arrayRegistros.length > 0) {

                    log.debug('Generar Ordenes de Compras', 'INPUT DATA - ID Requisiciones A Procesar : ' + informacionProcesar.idRegistrosProcesar);

                    var arrayRegistros = informacionProcesar.idRegistrosProcesar.split(',');

                    var requisicionesPendientes = search.load({
                        id: 'customsearch_3k_cupones_estado_new'
                    });

                    var filtroID = search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.ANYOF,
                        values: arrayRegistros
                    });

                    requisicionesPendientes.filters.push(filtroID);

                    log.audit('Funcionalidades Cupon', 'FIN GET INPUT DATA');
                    return requisicionesPendientes;
                } else {
                    log.error('Funcionalidades Cupon', 'INPUT DATA - Error Obteniendo ID de Cupones A Procesar');
                    log.audit('Funcionalidades Cupon', 'FIN GET INPUT DATA');
                    return null;
                }*/

                var cuponesPendientes = search.load({
                        id: 'customsearch_3k_cupones_para_liq'
                    });
                return cuponesPendientes;


            } catch (excepcion) {
                log.error('Funcionalidades Cupon', 'INPUT DATA - Excepcion Obteniendo ID de Cupones A Procesar - Excepcion : ' + excepcion.message.toString());
                log.audit('Funcionalidades Cupon', 'FIN GET INPUT DATA');
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
            log.audit('Funcionalidades Cupon', 'INICIO MAP');

            try {

                var resultado = context.value;

                if (!isEmpty(resultado)) {

                    var searchResult = JSON.parse(resultado);

                    if (!isEmpty(searchResult)) {

                        var obj = new Object();

                        obj.idInternoCupon = searchResult.values.internalid.value;

                        var clave = obj.idInternoCupon;

                        context.write(clave, JSON.stringify(obj));

                    } else {
                        log.error('Funcionalidades Cupon', 'MAP - Error Obteniendo Resultados de ID de Cupones A Procesar');
                    }

                } else {
                    log.error('Funcionalidades Cupon', 'MAP - Error Parseando Resultados de ID de Cupones A Procesar');
                }

            } catch (excepcion) {
                log.error('Funcionalidades Cupon', 'MAP - Excepcion Procesando ID de Cupones A Procesar - Excepcion : ' + excepcion.message.toString());
            }

            log.audit('Funcionalidades Cupon', 'FIN MAP');

        }

        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {
            log.audit('Funcionalidades Cupon', 'INICIO REDUCE - KEY : ' + context.key);

            var error = false;
            var mensajeError = '';

            if (!isEmpty(context.values) && context.values.length > 0) {
                for (var i = 0; !isEmpty(context.values) && context.values.length > 0 && i < context.values.length; i++) {
                    registro = JSON.parse(context.values[i]);

                    if (!isEmpty(registro)) {

                        var idCupon = registro.idInternoCupon;
                        log.debug('map-reduce cupon', 'idCupon: '+ idCupon);
                        // INICIO - Generar Custom Transaction Ingreso/Deuda Confirmar
                        var objRecord = record.load({
                            type: 'customrecord_3k_cupones',
                            id: idCupon,
                            isDynamic: true,
                        });
                        var idRegistroCupon = '';
                        try {
                            idRegistroCupon = objRecord.save();
                            log.debug('map-reduce cupon', 'idRegistroCupon: '+ idRegistroCupon);
                        } catch (excepcionCupon) {
                            error = true;
                            mensajeError = 'Excepcion Grabando Cupon con ID Interno : ' + idCupon + ' - Excepcion : ' + excepcionCupon.message.toString();
                        }
                        if (isEmpty(idRegistroCupon)) {
                            error = true;
                            mensajeError = 'Error Grabando Cupon con ID Interno : ' + idCupon + ' - Error : No se recibio el ID Interno del Cupon Actualizado';
                        }

                        // FIN - Generar Custom Transaction Ingreso/Deuda Confirmar


                        var respuesta = new Object();
                        respuesta.idCupon = idCupon;
                        respuesta.error = false;
                        respuesta.mensaje = "";

                        if (error == true) {
                            log.error('Funcionalidades Cupon', 'REDUCE - ' + error.mensajeError);
                            respuesta.error = true;
                            respuesta.mensaje = error.mensajeError;
                        } else {
                            respuesta.mensaje = 'El Cuponcon ID Interno : ' + idCupon + ' Se actualizo correctamente';
                        }

                        log.audit('Funcionalidades Cupon', 'FIN REDUCE - KEY : ' + context.key + ' ID CUPON ACTUALIZO : ' + idCupon);

                        context.write(context.key, respuesta);
                    }
                }
            } else {
                error = true;
                mensajeError = "Error No se Recibio Informacion del registro de Cupon para generar los Custom Transactions de Ingreso/Deuda A Confirmar";
            }
        }

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {
            handleErrorIfAny(summary);
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });

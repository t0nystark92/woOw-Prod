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

        function handleErrorAndSendNotification(e, stage) {
            log.error('Estado : ' + stage + ' Error', e);

            var author = runtime.getCurrentUser().id;
            var recipients = runtime.getCurrentUser().id;
            var subject = 'Proceso Eliminar Solicitudes Orden de Venta ' + runtime.getCurrentScript().id + ' Error en Estado : ' + stage;
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

                log.audit('Eliminar Solicitudes Orden de Venta', 'INICIO GET INPUT DATA');

                var solicitudesAEliminar = search.load({
                        id: 'customsearch_3k_sol_ov_elim'
                    });
                return solicitudesAEliminar;


            } catch (excepcion) {
                log.error('Eliminar Solicitudes Orden de Venta', 'INPUT DATA - Excepcion Obteniendo ID de Solicitudes de Orden de Venta A Eliminar - Excepcion : ' + excepcion.message.toString());
                log.audit('Eliminar Solicitudes Orden de Venta', 'FIN GET INPUT DATA');
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
            log.audit('Eliminar Solicitudes Orden de Venta', 'INICIO MAP');

            try {

                var resultado = context.value;

                if (!isEmpty(resultado)) {

                    var searchResult = JSON.parse(resultado);

                    if (!isEmpty(searchResult)) {

                        var obj = new Object();

                        obj.idInternoSolicitud = searchResult.values.internalid.value;

                        var clave = obj.idInternoSolicitud;

                        context.write(clave, JSON.stringify(obj));

                    } else {
                        log.error('Eliminar Solicitudes Orden de Venta', 'MAP - Error Obteniendo Resultados de ID de Solicitudes de Orden de Venta A Eliminar');
                    }

                } else {
                    log.error('Eliminar Solicitudes Orden de Venta', 'MAP - Error Parseando Resultados de ID de Solicitudes de Orden de Venta A Eliminar');
                }

            } catch (excepcion) {
                log.error('Eliminar Solicitudes Orden de Venta', 'MAP - Excepcion Procesando ID de Solicitudes de Orden de Venta A Eliminar - Excepcion : ' + excepcion.message.toString());
            }

            log.audit('Eliminar Solicitudes Orden de Venta', 'FIN MAP');

        }

        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {
            log.audit('Eliminar Solicitudes Orden de Venta', 'INICIO REDUCE - KEY : ' + context.key);

            var error = false;
            var mensajeError = '';

            if (!isEmpty(context.values) && context.values.length > 0) {
                for (var i = 0; !isEmpty(context.values) && context.values.length > 0 && i < context.values.length; i++) {
                    registro = JSON.parse(context.values[i]);
                    if (!isEmpty(registro)) {
                        var idSolicitud = registro.idInternoSolicitud;
                        // INICIO - Eliminar Registro de Solicitud de Orden de Venta
                        if(!isEmpty(idSolicitud)){
                            try {
                                record.delete({
                                    type: 'customrecord_3k_generacion_ov',
                                    id: idSolicitud,
                                });
                            } catch (excepcionSolicitud) {
                                error = true;
                                mensajeError = 'Excepcion Eliminando Solicitud de Orden de Venta con ID Interno : ' + idSolicitud + ' - Excepcion : ' + excepcionSolicitud.message.toString();
                            }
                        }
                        // FIN - Eliminar Registro de Solicitud de Orden de Venta

                        log.audit('Eliminar Solicitudes Orden de Venta', 'FIN REDUCE - KEY : ' + context.key + ' ID REGISTRO ELIMINADO : ' + idSolicitud);

                        context.write(context.key);
                    }
                }
            } else {
                error = true;
                mensajeError = "Error No se Recibio Informacion del registro de Solicitud de Orden de Venta A Eliminar";
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

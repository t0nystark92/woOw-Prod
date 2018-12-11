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

define(['N/search', 'N/record', 'N/error', 'N/format'],
    /**
     * @param {record} record
     */
    function(search, record, error, format) {

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
            var subject = 'Proceso de Generacion de Ordenes de Compras ' + runtime.getCurrentScript().id + ' Error en Estado : ' + stage;
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
                log.audit('Actualizar Estado Cupon', 'INICIO GET INPUT DATA');

                var cuponesPendientes = search.load({
                    id: 'customsearch_3k_est_cup_facturar'
                });

                log.audit('Actualizar Estado Cupon', 'FIN GET INPUT DATA');
                return cuponesPendientes;

            } catch (e) {
                log.error('Actualizar Estado Cupon', 'INPUT DATA - Excepcion : ' + e.message.toString());
                log.audit('Actualizar Estado Cupon', 'FIN GET INPUT DATA');
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
            log.audit('Actualizar Estado Cupon', 'INICIO MAP');

            try {

                var searchConfig = search.load({
                    id: 'customsearch_3k_config_cupones'
                });

                var resultSearch = searchConfig.run();
                var range = resultSearch.getRange({
                    start: 0,
                    end: 1
                });

                /*log.debug('map', 'range: '+ JSON.stringify(range));
                log.debug('map', 'resultSearch: '+ JSON.stringify(resultSearch));
                log.debug('map', 'resultSearch.length: '+ range.length);*/

                var resultado = context.value;
                //var fecha = new Date();




                if (!isEmpty(resultado)) {

                    var searchResult = JSON.parse(resultado);
                    log.debug('map', 'searchResult: ' + JSON.stringify(searchResult));
                    if (!isEmpty(searchResult)) {

                        var obj = new Object({});

                        obj.estadoCupon = range[0].getValue({ name: 'custrecord_3k_configcup_estado_fact' });
                        obj.idFactura = searchResult.values.internalid.value;
                        //obj.fecha = searchResult.values.datecreated;
                        obj.fecha = searchResult.values.custbody_3k_fecha_creacion;

                        var idCupones = new Array();
                        if (!Array.isArray(searchResult.values.custbody_3k_fact_cupones)) {
                            idCupones.push(searchResult.values.custbody_3k_fact_cupones.value);
                        } else {
                            idCupones = searchResult.values.custbody_3k_fact_cupones;
                        }
                        obj.idCupones = idCupones;


                        log.debug('map', 'typeof cupones : ' + typeof(searchResult.values.custbody_3k_fact_cupones));

                        var clave = obj.idFactura;

                        context.write(clave, JSON.stringify(obj));

                    } else {
                        log.error('Actualizar Estado Cupon', 'MAP - Error Obteniendo Resultados de Cupones');
                    }

                } else {
                    log.error('Actualizar Estado Cupon', 'MAP - Error Parseando Resultados de Cupones');
                }

            } catch (e) {
                log.error('Actualizar Estado Cupon', 'MAP - Excepcion : ' + e.message.toString());
            }

            log.audit('Actualizar Estado Cupon', 'FIN MAP');
        }

        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {
            log.audit('Actualizar Estado Cupon', 'INICIO REDUCE - KEY : ' + context.key);
            var obj = new Object({});
            var respuesta = new Object({});
            var arrayCuponesActualizados = new Array();
            try {
                log.debug('reduce', 'CONTEXT.VALUE: ' + JSON.stringify(context.values));
                obj = JSON.parse(context.values[0]);
                //log.debug('reduce', 'obj: '+ JSON.stringify(obj));
                /*log.debug('map', 'obj.fecha: ' + obj.fecha + ' TYPEOF: ' + typeof(obj.fecha));
                var cupones = obj.idCupones;
                var fechaNS = format.parse({
                    value: obj.fecha,
                    type: format.Type.DATE
                });*/

                //////////////////////////////////////////////////////////
                /*var fechaRemitoDate = format.parse({
                    value: fechaRemito,
                    type: format.Type.DATE,
                });*/

                /*var fechaString = format.format({
                    value: fechaNS,
                    type: format.Type.DATE,
                });*/

                //var fechaJS = new Date(obj.fecha.toString());
                ///////////////////////////////////////////////////////////

                /*var fechaFinal = new Date(obj.fecha);

                var fechaString = format.format({
                    value: fechaFinal,
                    type: format.Type.DATETIME,
                    timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                });

                var fechaTotal = format.parse({
                    value: fechaString,
                    type: format.Type.DATE
                });



                log.debug('map', 'fechaNS: ' + fechaNS + ' TYPEOF: ' + typeof(fechaNS));
                log.debug('map', 'fechaTotal: ' + fechaTotal);*/

                //log.debug('reduce', 'obj: '+ JSON.stringify(cupones));
                for (var i = 0; i < obj.idCupones.length; i++) {

                    var id = record.submitFields({
                        type: 'customrecord_3k_cupones',
                        id: obj.idCupones[i],
                        values: {
                            custrecord_3k_cupon_estado: obj.estadoCupon,
                            custrecord_3k_cupones_factura: obj.idFactura,
                            custrecord_3k_cupon_fecha_uso_str: obj.fecha

                        },
                        options: {
                            enableSourcing: true,
                            ignoreMandatoryFields: false
                        }
                    });

                    arrayCuponesActualizados.push(id);
                }


                respuesta.idFactura = obj.idFactura;
                respuesta.cupones = arrayCuponesActualizados.toString();

            } catch (e) {
                log.error('Actualizar Estado Cupon', 'REDUCE - Excepcion : ' + e.message.toString());
                //return null;
            }

            log.audit('Actualizar Estado Cupon', 'FIN REDUCE - KEY : ' + context.key + ' ID FACTURA : ' + obj.idFactura);
            context.write(context.key, respuesta);
        }

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {


        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });

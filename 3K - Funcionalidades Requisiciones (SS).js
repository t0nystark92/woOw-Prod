/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/

define(['N/error', 'N/record', 'N/search', '3K/utilities'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */

    function(error, record, search, utilities) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {
            try {
                log.audit('Inicio Grabar Requisicion', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

                var idRequisicion = scriptContext.newRecord.id;
                var tipoRegistro = scriptContext.newRecord.type;
                if (!utilities.isEmpty(idRequisicion) && !utilities.isEmpty(tipoRegistro)) {

                    var idOrdenCompra = scriptContext.newRecord.getValue({ fieldId: 'custrecord_3k_req_compra_oc' });

                    if (!utilities.isEmpty(idOrdenCompra)) {

                        // INICIO BUSCAR CUPONES SIN ORDEN DE COMPRAS POR REQUISICION
                        var cuponesReq = search.load({
                            id: 'customsearch_3k_cupones_req'
                        });

                        var filtroReq = search.createFilter({
                            name: 'internalid',
                            operator: search.Operator.ANYOF,
                            values: [idRequisicion]
                        });

                        cuponesReq.filters.push(filtroReq);

                        var resultSet = cuponesReq.run();

                        var completeResultSet = null;

                        var resultIndex = 0;
                        var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
                        var resultado; // temporary variable used to store the result set
                        do {
                            // fetch one result set
                            resultado = resultSet.getRange({
                                start: resultIndex,
                                end: resultIndex + resultStep
                            });

                            if (!utilities.isEmpty(resultado) && resultado.length > 0) {
                                if (resultIndex == 0)
                                    completeResultSet = resultado;
                                else
                                    completeResultSet = completeResultSet.concat(resultado);
                            }

                            // increase pointer
                            resultIndex = resultIndex + resultStep;

                            // once no records are returned we already got all of them
                        } while (!utilities.isEmpty(resultado) && resultado.length > 0)
                        // FIN BUSCAR ID DE ORDEN

                        if (!utilities.isEmpty(completeResultSet)) {

                            for (var j = 0; j < completeResultSet.length; j++) {

                                var idInternosCupones = completeResultSet[j].getValue({
                                    name: resultSet.columns[1]
                                });

                                if (!utilities.isEmpty(idInternosCupones)) {
                                    var arrayCupones = idInternosCupones.split(',');

                                    if (!utilities.isEmpty(arrayCupones)) {
                                        for (var i = 0; i < arrayCupones.length; i++) {
                                            if (!utilities.isEmpty(arrayCupones[i])) {
                                                var idCupon = record.submitFields({
                                                    type: 'customrecord_3k_cupones',
                                                    id: arrayCupones[i],
                                                    values: {
                                                        custrecord_3k_cupon_oc: idOrdenCompra
                                                    },
                                                    options: {
                                                        enableSourcing: true,
                                                        ignoreMandatoryFields: false
                                                    }
                                                });
                                            }
                                        }
                                    }
                                }

                            }

                        }


                        // FIN BUSCAR CUPONES SIN ORDEN DE COMPRAS POR REQUISICION
                    }
                } else {
                    // Error Obteniendo ID/ Tipo de Registro
                    var mensaje = "Error Obteniendo la siguiente Informacion del Registro : ";
                    if (utilities.isEmpty(idRequisicion)) {
                        mensaje = mensaje + " ID Interno de la Requisicion /";
                    }
                    if (utilities.isEmpty(tipoRegistro)) {
                        mensaje = mensaje + " Tipo de Registro /";
                    }
                    log.error('Grabar Requisicion', 'BeforeSubmit - Error Grando Requisicion - Error : ' + mensaje);
                    throw utilities.crearError('SREQ002', 'Error Grando Requisicion - Error : ' + mensaje);

                }
            } catch (excepcion) {
                log.error('Grabar Requisicion', 'AfterSubmit - Excepcion Grabando Requisicion - Excepcion : ' + excepcion.message);
                throw utilities.crearError('SREQ001', 'Excepcion Grabando Requisicion - Excepcion : ' + excepcion.message);
            }
            log.audit('Fin Grabar Requisicion', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

        }

        return {
            afterSubmit: afterSubmit
        };

    });

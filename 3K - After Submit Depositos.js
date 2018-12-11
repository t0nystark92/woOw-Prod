/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities',
        '3K/funcionalidadesOV': './3K - Funcionalidades OV'
    }
});*/

define(['N/error', 'N/record', 'N/search', 'N/runtime', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */

    function(error, record, search, runtime, utilities, funcionalidades) {
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
                log.audit('Inicio After Submit NetSuite', 'Tipo : Servidor - Evento : ' + scriptContext.type);
                var executionContext = runtime.executionContext;
                if ((executionContext != "RESTLET" && executionContext != "SUITELET") && (scriptContext.type == 'create' || scriptContext.type == 'edit')) {
                    var idDeposito = scriptContext.newRecord.id;
                    var idOv = scriptContext.newRecord.getValue({ fieldId: 'salesorder' });
                    var idCliente = scriptContext.newRecord.getValue({ fieldId: 'customer.internalid' });
                    var formaPago = scriptContext.newRecord.getValue({ fieldId: 'paymentmethod' });

                    var respuestaAfterDep = funcionalidades.afterSubmitDep(idDeposito, idOv, idCliente, formaPago);
                    if (respuestaAfterDep.error) {
                        log.error('After Submit NetSuite', 'Excepción respuestaAfterDep: ' + JSON.stringify(respuestaAfterDep));
                        var objRecord = record.delete({
                            type: record.Type.CUSTOMER_DEPOSIT,
                            id: idDeposito,
                        });
                        throw utilities.crearError('After Submit NetSuite', 'Excepción respuestaAfterDep: ' + JSON.stringify(respuestaAfterDep));
                    }

                    log.debug('After Submit NetSuite', 'respuestaAfterDep: ' + JSON.stringify(respuestaAfterDep))
                }

            } catch (e) {
                log.error('After Submit NetSuite', 'Excepción: ' + e.message);
                var objRecord = record.delete({
                    type: record.Type.CUSTOMER_DEPOSIT,
                    id: idDeposito,
                });
                throw utilities.crearError('After Submit NetSuite', 'Excepción: ' + e.message);
            }

            log.audit('Fin After Submit NetSuite', 'Tipo : Servidor - Evento : ' + scriptContext.type);
        }

        return {
            //beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });

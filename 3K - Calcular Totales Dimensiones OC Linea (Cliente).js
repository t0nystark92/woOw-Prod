/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/

define(['N/error', 'N/record', 'N/search', 'N/ui/dialog', 'N/ui/message', '3K/utilities'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */

    function(error, record, search, dialog, message, utilities) {
        /*function validateInsert(context) {
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            if (sublistName === 'partners')
                if (currentRecord.getCurrentSublistValue({
                        sublistId: sublistName,
                        fieldId: 'contribution'
                    }) !== '100.0%')
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistName,
                        fieldId: 'contribution',
                        value: '100.0%'
                    });
            return true;
        }*/
        function validateLine(context) {
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            if (sublistName === 'item') {

                var cantidad = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'quantity'
                });

                var peso = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custcol_3k_peso'
                });

                var tamVolumetrico = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custcol_3k_tam_volumetrico'
                });

                if (!utilities.isEmpty(cantidad) && !isNaN(cantidad) && parseFloat(cantidad, 10) > 0) {
                    if (!utilities.isEmpty(peso) && !isNaN(peso) && parseFloat(peso, 10) >= 0) {
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: 'custcol_3k_peso_total',
                            value: parseFloat((parseFloat(cantidad, 10) * parseFloat(peso, 10)), 10).toFixed(2)
                        });
                    }

                    if (!utilities.isEmpty(tamVolumetrico) && !isNaN(tamVolumetrico) && parseFloat(tamVolumetrico, 10) >= 0) {
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: 'custcol_3k_tam_vol_total',
                            value: parseFloat((parseFloat(cantidad, 10) * parseFloat(tamVolumetrico, 10)), 10).toFixed(2)
                        });
                    }
                }
            }
            return true;
        }
        return {
            validateLine: validateLine
        };
    });

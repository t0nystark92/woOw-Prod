/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/transaction', '3K/utilities'], function (record, transaction, utilities) {


    function afterSubmit(context) {

        try {

            var recNew = context.newRecord;

            var sublistPayment = recNew.getSublists();

            log.debug('sublistPayment', JSON.stringify(sublistPayment));

            var numLines = recNew.getLineCount({
                sublistId: 'deposit'
            });

            if (numLines > 0) {

                for (var i = 0; i < numLines; i++) {
                    
                    /*recNew.selectLine({
                        sublistId: 'deposit',
                        line: i
                    });*/

                    var aplicado = recNew.getSublistValue({
                        sublistId: 'deposit',
                        fieldId: 'apply',
                        line: i
                    })

                    log.debug('aplicado', aplicado)


                    if (aplicado == true){

                        var doc = recNew.getSublistValue({
                            sublistId: 'deposit',
                            fieldId: 'doc',
                            line: i
                        });

                        log.debug('doc', doc)

                        var objFieldLookUpRecord = search.lookupFields({
                            type: 'customerdeposit',
                            id: doc,
                            columns: [
                                'custbody_3k_link_reg_liq_conf'
                            ]
                        });

                        log.debug('objFieldLookUpRecord', JSON.stringify(objFieldLookUpRecord))

                        var liqConfirmar = objFieldLookUpRecord.custbody_3k_link_reg_liq_conf[0].value;

                        log.debug('liqConfirmar', liqConfirmar)

                        if (!utilities.isEmpty(liqConfirmar)){

                            transaction.void({
                                id: liqConfirmar,
                                type: customtransaction_3k_liquidacion_conf
                            })

                        }





                    }
                }

            }


        } catch (error) {
            log.error('Error Catch Voided from Cash Refund', error.message)
        }

    }

    return {
        afterSubmit: afterSubmit
    }
});
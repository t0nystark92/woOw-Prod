/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define(['N/currentRecord'],
    function (currentRecord) {
    function reembolsar() {
        var record = currentRecord.get();

        record.setValue({
            fieldId : 'custpage_accion',
            value : 'REEMBOLSAR'
        });

        document.forms['main_form'].submitter.click();
    }

    return {
        reembolsar : reembolsar
    };
});
/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define(['N/currentRecord'],
    function (currentRecord) {
    function aplicar() {
        var record = currentRecord.get();

        record.setValue({
            fieldId : 'custpage_accion',
            value : 'APLICAR'
        });

        document.forms['main_form'].submitter.click();
    }

    return {
        aplicar : aplicar
    };
});

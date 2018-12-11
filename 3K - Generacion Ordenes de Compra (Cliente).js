/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define(['N/currentRecord'],
    function (currentRecord) {
    function generarOC() {
        var record = currentRecord.get();

        record.setValue({
            fieldId : 'custpage_accion',
            value : 'GENERAROC'
        });

        document.forms['main_form'].submitter.click();
    }

    return {
        generarOC : generarOC
    };
});

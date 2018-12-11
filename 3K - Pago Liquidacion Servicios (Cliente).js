/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define(['N/currentRecord'],
    function (currentRecord) {
    function generarPagos() {
        var record = currentRecord.get();

        record.setValue({
            fieldId : 'custpage_accion',
            value : 'GENERARPAGO'
        });

        document.forms['main_form'].submitter.click();
    }

    return {
        generarPagos : generarPagos
    };
});

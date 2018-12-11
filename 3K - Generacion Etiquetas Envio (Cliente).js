/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define(['N/currentRecord'],
    function (currentRecord) {
    function generarEtiqueta() {
        var record = currentRecord.get();

        record.setValue({
            fieldId : 'custpage_accion',
            value : 'GENERARETIQUETA'
        });

        document.forms['main_form'].submitter.click();
    }

    return {
        generarEtiqueta : generarEtiqueta
    };
});

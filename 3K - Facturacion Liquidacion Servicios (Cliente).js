/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define(['N/currentRecord'],
    function (currentRecord) {
    function generarFacturacion() {
        var record = currentRecord.get();

        record.setValue({
            fieldId : 'custpage_accion',
            value : 'GENERARFACT'
        });

        document.forms['main_form'].submitter.click();
    }

    return {
        generarFacturacion : generarFacturacion
    };
});

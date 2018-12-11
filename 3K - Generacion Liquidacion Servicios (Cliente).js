/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define(['N/currentRecord'],
    function (currentRecord) {
    function generarLiquidacion() {
        var record = currentRecord.get();

        record.setValue({
            fieldId : 'custpage_accion',
            value : 'GENERARLIQ'
        });

        document.forms['main_form'].submitter.click();
    }

    return {
        generarLiquidacion : generarLiquidacion
    };
});

/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define(['N/currentRecord'],
    function (currentRecord) {
    function eliminarLiquidacion() {
        var record = currentRecord.get();

        record.setValue({
            fieldId : 'custpage_accion',
            value : 'ELIMINARLIQ'
        });

        document.forms['main_form'].submitter.click();
    }

    return {
        eliminarLiquidacion : eliminarLiquidacion
    };
});

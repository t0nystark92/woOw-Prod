/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities',
        '3K/funcionalidadesOV': './3K - Funcionalidades OV'
    }
});*/
define(['N/error', 'N/record', 'N/search', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function(error, record, search, utilities, funcionalidades) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {
            var respuesta = new Object({});
            respuesta.error = false;
            respuesta.detalle = [];
            try {

                if (scriptContext.type == 'edit' || scriptContext.type == 'create') {
                    var form = scriptContext.form;

                    form.clientScriptModulePath = './3K - Calcular Totales Dimensiones OC (Cliente).js';

                    form.addButton({
                        id: 'custpage_btgcalculo',
                        label: 'Calcular Dimensiones',
                        functionName: "calcularVolumetrico"
                    });
                }

            } catch (e) {
                respuesta.error = true;
                respuestaParcial = new Object({});
                respuestaParcial.codigo = 'CVOL001';
                respuestaParcial.mensaje = 'Excepcion agregando boton beforeLoad : ' + e.message;
                respuesta.detalle.push(respuestaParcial);
            }
        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {
            var respuesta = new Object({});
            respuesta.error = false;
            respuesta.detalle = [];
            try {

                var rec = scriptContext.newRecord;
                var result = funcionalidades.calcularVolumetrico(rec);

                if (result.error) {
                    throw utilities.crearError('After Submit NetSuite', 'Excepción respuestaAfterDep: ' + JSON.stringify(result));
                }



            } catch (e) {
                respuesta.error = true;
                respuestaParcial = new Object({});
                respuestaParcial.codigo = 'CVOL001';
                respuestaParcial.mensaje = 'Excepcion agregando boton beforeLoad : ' + e.message;
                respuesta.detalle.push(respuestaParcial);

                throw utilities.crearError('After Submit NetSuite', 'Excepción respuestaAfterDep: ' + JSON.stringify(respuesta));
            }
        }



        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
        };

    });

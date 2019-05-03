/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/

define(['N/error', 'N/record', 'N/search', 'N/runtime', '3K/utilities', 'N/format'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */

    function (error, record, search, runtime, utilities, format) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {
            var error = false;
            var codigoError = '';
            var mensajeError = '';

            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.message = "";
            objRespuesta.detalle = new Array();


            if (scriptContext.type == 'create') {

                try {

                    log.audit('Asignar Monedas Clientes (SS)', 'INICIO - afterSubmit');

                    //Consulta el SS de Monedas y las almacena en un array
                    var objResultTipoArticulo = utilities.searchSaved('customsearch_3k_moneda_ss');

                    var resultSet = objResultTipoArticulo.objRsponseFunction.result;
                    var resultSearch = objResultTipoArticulo.objRsponseFunction.search;

                    var arrayMonedas = new Array();

                    for (var i = 0; !utilities.isEmpty(resultSet) && i < resultSet.length; i++) {

                        var objMoneda = new Object();

                        objMoneda.monedaID = resultSet[i].getValue({
                            name: resultSearch.columns[0]
                        });

                        arrayMonedas.push(objMoneda);

                    }

                    log.debug('Asignar Monedas Clientes (SS)', 'arrayMonedas: ' + JSON.stringify(arrayMonedas));

                    var recId = scriptContext.newRecord.id;
                    var recType = scriptContext.newRecord.type;

                    var objCliente = record.load({
                        type: recType,
                        id: recId,
                        isDynamic: true,
                    });

                    var numLines = objCliente.getLineCount({
                        sublistId: 'currency'
                    });

                    log.debug('Asignar Monedas Clientes (SS)', 'numLines Moneda Cliente: ' + numLines);

                    var arrayMonedasCliente = new Array();

                    for (var i = 0; i < numLines; i++) {

                        var objMonedaCl = new Object();

                        objMonedaCl.monedaCliente = objCliente.getSublistValue({
                            sublistId: 'currency',
                            fieldId: 'currency',
                            line: i
                        });

                        arrayMonedasCliente.push(objMonedaCl);

                    }

                    log.debug('Asignar Monedas Clientes (SS)', 'arrayMonedasCliente: ' + JSON.stringify(arrayMonedasCliente));

                    for (var i = 0; i < arrayMonedas.length; i++) {

                        var objLineaMoneda = arrayMonedasCliente.filter(function (obj) {
                            return (obj.monedaCliente == arrayMonedas[i].monedaID);
                        });

                        if (objLineaMoneda.length == 0) {

                            log.debug('Asignar Monedas Clientes (SS)', 'No existe la moneda ' + JSON.stringify(arrayMonedas[i].monedaID) + ' configurada en el cliente. Se procede a agregar.');

                            var idMoneda = arrayMonedas[i].monedaID;

                            //log.debug('Asignar Monedas Clientes (SS)', 'idMoneda: ' + idMoneda);

                            //Inicio Agregar Moneda
                            objCliente.selectNewLine({
                                sublistId: 'currency'
                            });

                            objCliente.setCurrentSublistValue({
                                sublistId: 'currency',
                                fieldId: 'currency',
                                value: idMoneda
                            });

                            objCliente.commitLine({
                                sublistId: 'currency'
                            });

                        }


                    }

                    var idClienteSave = objCliente.save();

                    log.debug('Asignar Monedas Clientes (SS)', 'ID Cliente: ' + idClienteSave);


                } catch (excepcion) {
                    error = true;
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'UAMC001';
                    objRespuestaParcial.mensaje = excepcion;
                    objRespuesta.detalle.push(objRespuestaParcial);
                    log.error('Asignar Monedas Clientes (SS) - afterSubmit', 'UAMC001 - Excepcion Asignando Monedas Clientes - Excepcion : ' + excepcion.message);

                }

                log.audit('Asignar Monedas Clientes (SS)', 'FIN - afterSubmit');

            }
        }


        return {
            afterSubmit: afterSubmit
        };

    });


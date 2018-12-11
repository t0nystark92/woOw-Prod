/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType Restlet
 * @NModuleScope Public
 */
/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities',
        '3K/funcionalidadesOV': './3K - Funcionalidades OV'
    }
});*/
define(['N/error', 'N/record', 'N/search', 'N/format', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function(error, record, search, format, utilities, funcionalidades) {

        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPost(requestBody) {
            var respuesta = new Object({});
            respuesta.error = false;
            respuesta.detalle = [];
            //respuesta.CAE = [];
            //respuesta.tieneCAE = false;

            try {
                log.audit('Actualizar Fecha Cliente OV', 'INCIO Actualizar Fecha Cliente OV');

                if (!utilities.isEmpty(requestBody)) {

                    var body = isJSON(requestBody);
                    if (!body.error) {
                        var informacion = body.json;

                        var carrito = informacion.carrito;
                        var arrayOrdenes = informacion.idOrdenes;
                        var tipoOperacion = informacion.tipoOperacion;

                        var objRecord = record.load({
                            type: record.Type.SALES_ORDER,
                            id: carrito,
                            isDynamic: false
                        });

                        //log.debug('OV', 'Load OV Realizado');

                        var numLines = objRecord.getLineCount({
                            sublistId: 'item'
                        });

                        //log.debug('OV', 'Numero de Lineas : ' + numLines);

                        var arraySelected = [];

                        for (var i = 0; i < numLines; i++) {

                            var idDetalleOV = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_id_orden',
                                line: i
                            });

                            if (!utilities.isEmpty(idDetalleOV)) {

                                var filter = arrayOrdenes.filter(function(idOv) {
                                    return (idOv == idDetalleOV);
                                });

                                if (!utilities.isEmpty(filter) && filter.length > 0) {

                                    /*objRecord.selectLine({
                                        sublistId:'item',
                                        line: i
                                    });*/

                                    if (tipoOperacion == 'S') {

                                        objRecord.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_woow_loadable',
                                            value: true,
                                            line: i
                                        });
                                    } else {
                                        objRecord.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_woow_loadable',
                                            value: false,
                                            line: i
                                        });
                                    }

                                    arraySelected.push(idDetalleOV);

                                    /*objRecord.commitLine({
                                        sublistId: 'item'
                                    });*/
                                }
                            }

                        }

                        var carrito = objRecord.save();
                        respuesta.carrito = carrito;
                        respuesta.ordenesSelected = arraySelected;

                    } else {
                        respuesta.error = true;
                        objrespuestaParcial = new Object({});
                        objrespuestaParcial.codigo = 'RAFC003';
                        objrespuestaParcial.mensaje += 'Excepción: ' + body.excepcion;
                        respuesta.detalle.push(objrespuestaParcial);
                    }

                } else {
                    respuesta.error = true;
                    objrespuestaParcial = new Object({});
                    objrespuestaParcial.codigo = 'RAFC002';
                    objrespuestaParcial.mensaje += 'No se recibió request Body.';
                    respuesta.detalle.push(objrespuestaParcial);
                }

                log.audit('Actualizar Fecha Cliente OV', 'FIN Actualizar Fecha Cliente OV');
            } catch (e) {
                respuesta.error = true;
                objrespuestaParcial = new Object({});
                objrespuestaParcial.codigo = 'RAFC001';
                objrespuestaParcial.mensaje += 'Excepción: ' + e;
                respuesta.detalle.push(objrespuestaParcial);
            }

            return JSON.stringify(respuesta);
        }

        function isJSON(body) {
            //var isJSON = true;
            var respuesta = new Object({});

            try {
                respuesta.json = JSON.parse(body);
                //return respuesta;
            } catch (e) {
                //isJSON=false;
                respuesta.error = true;
                respuesta.excepcion = e;

            }

            return respuesta;
        }


        return {

            post: doPost
        };

    });

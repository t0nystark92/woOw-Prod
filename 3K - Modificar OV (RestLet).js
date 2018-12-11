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

            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.detalle = [];
            var respuesta = new Object({});
            try {
                if (!utilities.isEmpty(requestBody)) {
                    var informacion = JSON.parse(requestBody);
                    if (!utilities.isEmpty(informacion)) {

                        var carrito = informacion.carrito;
                        var newLines = informacion.newLines;
                        var deleteLines = informacion.deleteLines;
                        var updateLines = informacion.updateLines;

                        if (!utilities.isEmpty(carrito)) {
                            var json = new Object({});

                            if (!utilities.isEmpty(deleteLines) && deleteLines.length > 0) {

                                var recOV = record.load({
                                    type: record.Type.SALES_ORDER,
                                    id: carrito,
                                    isDynamic: true
                                });

                                respuesta.deleteLines = funcionalidades.closedLinesOV(recOV, deleteLines);
                                if (respuesta.deleteLines.error) {
                                    return JSON.stringify(respuesta.deleteLines);
                                }
                            }


                            if (!utilities.isEmpty(newLines) && newLines.length > 0) {

                                var recOV = record.load({
                                    type: record.Type.SALES_ORDER,
                                    id: carrito,
                                    isDynamic: true
                                });

                                json.ubicacion = recOV.getValue({
                                    fieldId: 'location'
                                });

                                json.sitio = recOV.getValue({
                                    fieldId: 'custbody_cseg_3k_sitio_web_o'
                                });

                                json.orden = newLines;

                                respuesta.newLines = funcionalidades.crearOrdenVenta(recOV, json, "NE");
                                if (respuesta.newLines.error) {
                                    return respuesta.newLines;
                                }
                            }

                            if (!utilities.isEmpty(updateLines) && updateLines.length > 0) {

                                var recOV = record.load({
                                    type: record.Type.SALES_ORDER,
                                    id: carrito,
                                    isDynamic: true
                                });

                                //json.orden = updateLines;

                                respuesta.updateLines = funcionalidades.updateLinesVouchers(recOV, updateLines);
                                if (respuesta.updateLines.error) {
                                    return respuesta.updateLines;
                                }
                            }



                        } else {
                            objRespuesta.error = true;
                            objrespuestaParcial = new Object({});
                            objrespuestaParcial.codigo = 'RMOV003';
                            objrespuestaParcial.mensaje = 'Campo carrito está vacío.';
                            objRespuesta.detalle.push(objrespuestaParcial);
                            //objRespuesta.tipoError = 'RORV001';
                            //objRespuesta.descripcion = 'No se puede parsear objectJSON.';
                            log.error('RMOV003', 'Campo carrito está vacío.');
                        }

                    } else {
                        objRespuesta.error = true;
                        objrespuestaParcial = new Object({});
                        objrespuestaParcial.codigo = 'RMOV001';
                        objrespuestaParcial.mensaje = 'No se puede parsear objectJSON.';
                        objRespuesta.detalle.push(objrespuestaParcial);
                        //objRespuesta.tipoError = 'RORV001';
                        //objRespuesta.descripcion = 'No se puede parsear objectJSON.';
                        log.error('RMOV001', 'No se puede parsear objectJSON');
                    }
                } else {
                    objRespuesta.error = true;
                    objrespuestaParcial = new Object({});
                    objrespuestaParcial.codigo = 'RMOV002';
                    objrespuestaParcial.mensaje = 'No se recibio parametro con informacion a realizar';
                    objRespuesta.detalle.push(objrespuestaParcial);
                    //objRespuesta.tipoError = 'RORV002';
                    //objRespuesta.descripcion = 'No se recibio parametro con informacion a realizar';
                    log.error('RMOV002', 'No se recibio parametro con informacion a realizar');
                }
            } catch (e) {
                objRespuesta.error = true;
                objrespuestaParcial = new Object({});
                objrespuestaParcial.codigo = 'RMOV004';
                objrespuestaParcial.mensaje = 'Error Modificar OV Excepción: ' + e.message;
                objRespuesta.detalle.push(objrespuestaParcial);
                //objRespuesta.tipoError = 'RORV002';
                //objRespuesta.descripcion = 'No se recibio parametro con informacion a realizar';
                log.error('RMOV004', 'Error Modificar OV Excepción: ' + e.message);
            }
            log.audit('DEBUG', 'Fin Proceso Crear Orden de Venta');
            if (!objRespuesta.error) {
                return JSON.stringify(respuesta);
            } else {
                return JSON.stringify(objRespuesta);
            }
        }





        return {
            post: doPost
        };
    });

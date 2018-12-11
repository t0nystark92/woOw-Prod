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
            log.audit('Consulta Stock Articulos', 'INICIO Consultar Stock Articulo');
            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.detalle = [];

            if (!utilities.isEmpty(requestBody)) {
                // INICIO Generar Registro OV
                var registroConsulta = record.create({
                    type: 'customrecord_3k_consulta_stock_mid'
                });

                registroConsulta.setValue({
                    fieldId: 'custrecord_3k_consulstock_informacion',
                    value: requestBody
                });

                try {
                    var idRec = registroConsulta.save();
                    if (utilities.isEmpty(idRec)) {
                        error = true;
                        mensajeError = 'No se recibio el ID del Registro de la consulta de stock';
                        objRespuesta.error = true;
                        objrespuestaParcial = new Object({});
                        objrespuestaParcial.codigo = 'RCSA001';
                        objrespuestaParcial.mensaje = mensajeError;
                        objRespuesta.detalle.push(objrespuestaParcial);
                        log.error('RCSA001', mensajeError);
                    } else {
                        // INICIO - Obtener Respuesta
                        var objFieldLookUpRecordOV = search.lookupFields({
                            type: 'customrecord_3k_consulta_stock_mid',
                            id: idRec,
                            columns: [
                                'custrecord_3k_consulstock_respuesta'
                            ]
                        });

                        var informacionRespuesta = objFieldLookUpRecordOV.custrecord_3k_consulstock_respuesta;
                        if (!utilities.isEmpty(informacionRespuesta)) {
                            objRespuesta = JSON.parse(informacionRespuesta);

                            log.debug('Consulta Stock', 'Linea 71');
                            log.debug('Consulta Stock', 'idRec: '+ idRec);


                            var objRecord = record.delete({
                                type: 'customrecord_3k_consulta_stock_mid',
                                id: idRec
                            });

                            log.debug('Consulta Stock', 'Linea 78');
                        } else {
                            // Error
                            error = true;
                            mensajeError = 'No se recibio Respuesta de Proceso de Generacion de Consulta de Stock';
                            objRespuesta.error = true;
                            objrespuestaParcial = new Object({});
                            objrespuestaParcial.codigo = 'RCSA001';
                            objrespuestaParcial.mensaje = mensajeError;
                            objRespuesta.detalle.push(objrespuestaParcial);
                            log.error('RCSA001', mensajeError);
                        }
                        // FIN - Obtener Respuesta
                    }
                } catch (excepcionRegOV) {
                    error = true;
                    mensajeError = 'Excepcion Consultando Stock - Excepcion : ' + excepcionRegOV.message.toString();
                    objRespuesta.error = true;
                    objrespuestaParcial = new Object({});
                    objrespuestaParcial.codigo = 'RCSA001';
                    objrespuestaParcial.mensaje = mensajeError;
                    objRespuesta.detalle.push(objrespuestaParcial);
                    log.error('RCSA001', mensajeError);
                }
                // FIN Generar Registro OV

            } else {
                objRespuesta.error = true;
                objrespuestaParcial = new Object({});
                objrespuestaParcial.codigo = 'RCSA001';
                objrespuestaParcial.mensaje = 'No se recibio parametro con informacion a realizar';
                objRespuesta.detalle.push(objrespuestaParcial);
                log.error('RCSA001', 'No se recibio parametro con informacion a realizar');
            }

            log.audit('Consulta Stock Articulos', 'FIN Consultar Stock Articulo');

            return JSON.stringify(objRespuesta);

        }

        return {
            post: doPost
        };
    });

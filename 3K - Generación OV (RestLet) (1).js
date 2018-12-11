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

define(['N/error', 'N/record', 'N/search', 'N/format', 'N/https', 'N/url', 'N/runtime', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function(error, record, search, format, https, url, runtime, utilities, funcionalidades) {

        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPost(requestBody) {

            log.error('Fecha INICIO : ', new Date());

            var objRespuesta = new Object();
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();

            if (!utilities.isEmpty(requestBody)) {
                // INICIO Generar Registro OV
                var registroOV = record.create({
                    type: 'customrecord_3k_generacion_ov'
                });



                registroOV.setValue({
                    fieldId: 'custrecord_3k_generacion_ov_info',
                    value: requestBody
                });

                try {
                    var idRegOV = registroOV.save();
                    if (utilities.isEmpty(idRegOV)) {
                        error = true;
                        mensajeError = 'No se recibio el ID del Registro de Orden de Venta Generado';
                        objRespuesta.error = true;
                        objrespuestaParcial = new Object();
                        objrespuestaParcial.codigo = 'RORV002';
                        objrespuestaParcial.mensaje = mensajeError;
                        objRespuesta.detalle.push(objrespuestaParcial);
                        log.error('RORV002', mensajeError);
                    } else {
                        // INICIO - Obtener Respuesta
                        var objFieldLookUpRecordOV = search.lookupFields({
                            type: 'customrecord_3k_generacion_ov',
                            id: idRegOV,
                            columns: [
                                'custrecord_3k_generacion_ov_resp'
                            ]
                        });

                        var informacionRespuesta = objFieldLookUpRecordOV.custrecord_3k_generacion_ov_resp;
                        if (!utilities.isEmpty(informacionRespuesta)) {
                            objRespuesta = JSON.parse(informacionRespuesta);
                        } else {
                            // Error
                            error = true;
                            mensajeError = 'No se recibio Respuesta de Proceso de Generacion de Ordenes de Ventas';
                            objRespuesta.error = true;
                            objrespuestaParcial = new Object();
                            objrespuestaParcial.codigo = 'RORV002';
                            objrespuestaParcial.mensaje = mensajeError;
                            objRespuesta.detalle.push(objrespuestaParcial);
                            log.error('RORV002', mensajeError);
                        }
                        // FIN - Obtener Respuesta
                    }
                } catch (excepcionRegOV) {
                    error = true;
                    mensajeError = 'Excepcion Grabando Registro de Orden de Venta - Excepcion : ' + excepcionRegOV.message.toString();
                    objRespuesta.error = true;
                    objrespuestaParcial = new Object();
                    objrespuestaParcial.codigo = 'RORV002';
                    objrespuestaParcial.mensaje = mensajeError;
                    objRespuesta.detalle.push(objrespuestaParcial);
                    log.error('RORV002', mensajeError);
                }
                // FIN Generar Registro OV

            } else {
                objRespuesta.error = true;
                objrespuestaParcial = new Object();
                objrespuestaParcial.codigo = 'RORV002';
                objrespuestaParcial.mensaje = 'No se recibio parametro con informacion a realizar';
                objRespuesta.detalle.push(objrespuestaParcial);
                //objRespuesta.tipoError = 'RORV002';
                //objRespuesta.descripcion = 'No se recibio parametro con informacion a realizar';
                log.error('RORV002', 'No se recibio parametro con informacion a realizar')
            }
            log.error('Fecha FIN : ', new Date());
            return JSON.stringify(objRespuesta);
        }



        return {
            post: doPost
        };
    });

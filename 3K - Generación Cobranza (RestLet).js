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

            var objRespuesta = new Object();
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();

            if (!utilities.isEmpty(requestBody)) {
                // INICIO Generar Registro COBRANZA
                var registroCOB = record.create({
                    type: 'customrecord_3k_generacion_cob'
                });

                registroCOB.setValue({
                    fieldId: 'custrecord_3k_generacion_cob_info',
                    value: requestBody
                });

                try {
                    var idRegCOB = registroCOB.save();
                    if (utilities.isEmpty(idRegCOB)) {
                        error = true;
                        mensajeError = 'No se recibio el ID del Registro de Cobranza Generado';
                        objRespuesta.error = true;
                        objrespuestaParcial = new Object();
                        objrespuestaParcial.codigo = 'RDEP046';
                        objrespuestaParcial.mensaje = mensajeError;
                        objRespuesta.detalle.push(objrespuestaParcial);
                        log.error('RDEP021', mensajeError);
                    } else {
                        // INICIO - Obtener Respuesta
                        var objFieldLookUpRecordCOB = search.lookupFields({
                            type: 'customrecord_3k_generacion_cob',
                            id: idRegCOB,
                            columns: [
                                'custrecord_3k_generacion_cob_resp'
                            ]
                        });

                        var informacionRespuesta = objFieldLookUpRecordCOB.custrecord_3k_generacion_cob_resp;
                        if (!utilities.isEmpty(informacionRespuesta)) {
                            objRespuesta = JSON.parse(informacionRespuesta);
                        } else {
                            // Error
                            error = true;
                            mensajeError = 'No se recibio Respuesta de Proceso de Generacion de Cobranzas';
                            objRespuesta.error = true;
                            objrespuestaParcial = new Object();
                            objrespuestaParcial.codigo = 'RDEP047';
                            objrespuestaParcial.mensaje = mensajeError;
                            objRespuesta.detalle.push(objrespuestaParcial);
                            log.error('RDEP047', mensajeError);
                        }
                        // FIN - Obtener Respuesta
                    }
                } catch (excepcionRegCOB) {
                    error = true;
                    mensajeError = 'Excepcion Grabando Registro de Cobranza - Excepcion : ' + excepcionRegCOB.message.toString();
                    objRespuesta.error = true;
                    objrespuestaParcial = new Object();
                    objrespuestaParcial.codigo = 'RDEP048';
                    objrespuestaParcial.mensaje = mensajeError;
                    objRespuesta.detalle.push(objrespuestaParcial);
                    log.error('RDEP048', mensajeError);
                }
                // FIN Generar Registro COBRANZA

            } else {
                objRespuesta.error = true;
                objrespuestaParcial = new Object();
                objrespuestaParcial.codigo = 'RDEP049';
                objrespuestaParcial.mensaje = 'No se recibio parametro con informacion a realizar';
                objRespuesta.detalle.push(objrespuestaParcial);
                //objRespuesta.tipoError = 'RDEP024';
                //objRespuesta.descripcion = 'No se recibio parametro con informacion a realizar';
                log.error('RDEP049', 'No se recibio parametro con informacion a realizar')
            }
            return JSON.stringify(objRespuesta);
        }



        return {
            post: doPost
        };
    });

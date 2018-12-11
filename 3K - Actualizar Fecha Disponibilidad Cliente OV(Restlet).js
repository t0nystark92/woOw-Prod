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
            log.audit('Actualizar Fecha Cliente', 'INICIO Actualizar Fecha Cliente');
            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.detalle = [];

            if (!utilities.isEmpty(requestBody)) {
                // INICIO Generar Registro OV
                var registroConsulta = record.create({
                    type: 'customrecord_3k_actualizar_fecha_ov'
                });

                registroConsulta.setValue({
                    fieldId: 'custrecord_3k_act_fecha_ov_informacion',
                    value: requestBody
                });

                try {
                    var idRec = registroConsulta.save();
                    if (utilities.isEmpty(idRec)) {
                        error = true;
                        mensajeError = 'No se recibio el ID del Registro de la Actualizacion de Fecha del cliente';
                        objRespuesta.error = true;
                        objrespuestaParcial = new Object({});
                        objrespuestaParcial.codigo = 'RCSA001';
                        objrespuestaParcial.mensaje = mensajeError;
                        objRespuesta.detalle.push(objrespuestaParcial);
                        log.error('RCSA001', mensajeError);
                    } else {
                        // INICIO - Obtener Respuesta
                        var objFieldLookUpRecordOV = search.lookupFields({
                            type: 'customrecord_3k_actualizar_fecha_ov',
                            id: idRec,
                            columns: [
                                'custrecord_3k_act_fecha_ov_respuesta'
                            ]
                        });

                        var informacionRespuesta = objFieldLookUpRecordOV.custrecord_3k_act_fecha_ov_respuesta;
                        if (!utilities.isEmpty(informacionRespuesta)) {
                            objRespuesta = JSON.parse(informacionRespuesta);


                            var objRecord = record.delete({
                                type: 'customrecord_3k_actualizar_fecha_ov',
                                id: idRec
                            });

                        } else {
                            // Error
                            error = true;
                            mensajeError = 'No se recibio Respuesta de Proceso de Actualizacion de Fecha de Disponibilidad del cliente';
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
                    mensajeError = 'Excepcion Actualizando Fecha de Disponibilidad de cliente - Excepcion : ' + excepcionRegOV.message.toString();
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

            log.audit('Actualizar Fecha Cliente', 'FIN Actualizar Fecha Cliente');

            return JSON.stringify(objRespuesta);
        }


        return {

            post: doPost
        };

    });

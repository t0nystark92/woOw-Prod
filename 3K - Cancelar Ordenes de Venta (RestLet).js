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
            log.audit('Cancelar Ordenes de Venta', 'INICIO Cancelar Ordenes de Venta');

            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.tipoError = '';
            objRespuesta.descripcion = '';
            objRespuesta.detalle = new Array();
            try {
                if (!utilities.isEmpty(requestBody)) {
                    var informacion = JSON.parse(requestBody);

                    if (!utilities.isEmpty(informacion) && informacion.length > 0) {

                        ordenesVentaCanceladas = [];


                        for (var i = 0; i < informacion.length; i++) {

                            var idOv = informacion[i].idOv;
                            var motivo = informacion[i].motivo;

                            try {


                                var objRecord = record.load({
                                    type: 'salesorder',
                                    id: idOv,
                                    isDynamic: false,
                                });

                                var numLines = objRecord.getLineCount({
                                    sublistId: 'item'
                                });

                                for (var j = 0; j < numLines; j++) {
                                    objRecord.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'isclosed',
                                        line: j,
                                        value: true
                                    });

                                    /*objRecord.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'grossamt',
                                        line: j,
                                        value: '0'
                                    });*/


                                }

                                objRecord.setValue({
                                    fieldId: 'custbody_3k_motivo_cancelacion',
                                    value: motivo
                                });

                                var idOvCancelada = objRecord.save();
                                ordenesVentaCanceladas.push(idOvCancelada);

                            } catch (eCancelar) {
                                log.error('RCOV004', 'Cancelar Ordenes de Venta. Excepción al cancelar Orden de Venta: ' + idOv + ' .Excepción: ' + eCancelar.message);
                                objRespuesta.error = true;
                                objRespuestaParcial = new Object();
                                objRespuestaParcial.codigo = 'RCOV004';
                                objRespuestaParcial.mensaje = 'Cancelar Ordenes de Venta. Excepción al cancelar Orden de Venta: ' + idOv + ' .Excepción: ' + eCancelar.message;
                                objRespuesta.detalle.push(objRespuestaParcial);
                                //objRespuesta.tipoError = 'RCOV004';
                                //objRespuesta.descripcion = 'Cancelar Ordenes de Venta. Excepción al cancelar Orden de Venta: ' + idOv + ' .Excepción: ' + eCancelar.message;
                            }
                        }

                    } else {
                        log.error('RCOV002', 'Cancelar Ordenes de Venta. Error parseando JSON');
                        objRespuesta.error = true;
                        objRespuestaParcial = new Object();
                        objRespuestaParcial.codigo = 'RCOV002';
                        objRespuestaParcial.mensaje = 'Cancelar Ordenes de Venta. Error parseando JSON';
                        objRespuesta.detalle.push(objRespuestaParcial);
                        //objRespuesta.tipoError = 'RCOV002';
                        //objRespuesta.descripcion = 'Cancelar Ordenes de Venta. Error parseando JSON';
                    }

                    objRespuesta.ordenesCanceladas = ordenesVentaCanceladas;
                } else {
                    log.error('RCOV001', 'Cancelar Ordenes de Venta. No se recibió la información del body de la petición');
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'RCOV001';
                    objRespuestaParcial.mensaje = 'Cancelar Ordenes de Venta. No se recibió la información del body de la petición';
                    objRespuesta.detalle.push(objRespuestaParcial);
                    //objRespuesta.tipoError = 'RCOV001';
                    //objRespuesta.descripcion = 'Cancelar Ordenes de Venta. No se recibió la información del body de la petición';
                }
            } catch (eGeneral) {
                log.error('RCOV003', 'Cancelar Ordenes de Venta. Excepción: ' + eGeneral.message);
                objRespuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'RCOV003';
                objRespuestaParcial.mensaje = 'Cancelar Ordenes de Venta. Excepción: ' + eGeneral.message;
                objRespuesta.detalle.push(objRespuestaParcial);
                //objRespuesta.tipoError = 'RCOV003';
                //objRespuesta.descripcion = 'Cancelar Ordenes de Venta. Excepción: ' + eGeneral.message;
            }
            log.audit('Cancelar Ordenes de Venta', 'FIN Cancelar Ordenes de Venta');
            return JSON.stringify(objRespuesta);
            
        }

        return {
            post: doPost
        };
    });

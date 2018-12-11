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
            if (!utilities.isEmpty(requestBody)) {
                var informacion = JSON.parse(requestBody);
                if (!utilities.isEmpty(informacion)) {
                    var objRespuesta = new Object({});
                    objRespuesta.error = false;
                    var operacion = informacion.operacion;
                    if (!utilities.isEmpty(operacion)) {
                        switch (operacion) {
                            //Alta
                            case "A":
                                objRespuesta = crearOrdenVenta(informacion);
                                break;
                                //Consulta
                            case "C":
                                break;
                                //Modificar
                            case "M":
                                break;
                            default:
                                objRespuesta.error = true;
                                objRespuesta.tipoError = 'RORV003';
                                objRespuesta.descripcion = 'Tipo de Operación no válida.';
                                log.error('RORV003', 'Tipo de Operación no válida.');
                                break;
                        }
                    } else {
                        objRespuesta.error = true;
                        objRespuesta.tipoError = 'RORV006';
                        objRespuesta.descripcion = 'Variable Operación vacía';
                    }
                } else {
                    objRespuesta.error = true;
                    objRespuesta.tipoError = 'RORV001';
                    objRespuesta.descripcion = 'No se puede parsear objectJSON.';
                    log.error('RORV001', 'No se puede parsear objectJSON');
                }
            } else {
                objRespuesta.error = true;
                objRespuesta.tipoError = 'RORV002';
                objRespuesta.descripcion = 'No se recibio parametro con informacion a realizar';
                log.error('RORV002', 'No se recibio parametro con informacion a realizar')
            }
            return JSON.stringify(objRespuesta);
        }


        function crearOrdenVenta(informacion) {
            log.audit('DEBUG', 'Inicio Proceso Crear Orden de Venta');
            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.message = "";
            //arrayOrdenes
            /*************************************************SE VALIDA QUE NO VENGA CLIENTE, MONEDA, TIPO CAMBIO Y CARRITO VACIO***************************************************/
            if (!utilities.isEmpty(informacion.cliente) && !utilities.isEmpty(informacion.moneda) && !utilities.isEmpty(informacion.tipoCambio) && !utilities.isEmpty(informacion.metodoPago) && !utilities.isEmpty(informacion.ubicacion) && !utilities.isEmpty(informacion.sitio)) {
                //log.audit('DEBUG','linea 131');
                try {
                    
                    /******************************* INICIO  DE SETEO DE DE CAMPOS DE CABECERA DE LA OV *******************************************************************/
                    var rec = record.create({
                        type: 'salesorder',
                        isDynamic: true
                    });
                    rec.setValue({
                        fieldId: 'entity',
                        value: informacion.cliente
                    });
                    rec.setValue({
                        fieldId: 'currency',
                        value: informacion.moneda
                    });
                    rec.setValue({
                        fieldId: 'exchangerate',
                        value: informacion.tipoCambio.toString()
                    });
                    rec.setValue({
                        fieldId: 'custbody_3k_forma_pago',
                        value: informacion.metodoPago
                    });
                    rec.setValue({
                        fieldId: 'location',
                        value: informacion.ubicacion
                    });

                    rec.setValue({
                        fieldId: 'custbody_cseg_3k_sitio_web',
                        value: informacion.sitio
                    });

                    /******************************* FIN  DE SETEO DE DE CAMPOS DE CABECERA DE LA OV *******************************************************************/


                    /******************************* INICIO LLAMADA A FUNCION QUE CREA LA OV *******************************************************************/

                    var respuesta = funcionalidades.crearOrdenVenta(rec,informacion, "NE");
                    if (respuesta.error){
                        return respuesta;
                    }
                    
                    /******************************* FIN LLAMADA A FUNCION QUE CREA LA OV *******************************************************************/
                    
                } catch (e) {
                    objRespuesta.error = true;
                    objRespuesta.tipoError = 'RORV004';
                    objRespuesta.descripcion = 'function crearOrdenVenta: ' + e.message;
                    log.error('RORV004', 'funtion crearOrdenVenta: ' + e.message);
                }
            } else {
                if (utilities.isEmpty(informacion.cliente)) {
                    objRespuesta.error = true;
                    objRespuesta.tipoError = 'RORV005';
                    objRespuesta.message += 'Campo Cliente vacío';
                }
                if (utilities.isEmpty(informacion.moneda)) {
                    objRespuesta.error = true;
                    objRespuesta.tipoError = 'RORV005';
                    objRespuesta.message += 'Campo Moneda vacío';
                }
                if (utilities.isEmpty(informacion.tipoCambio)) {
                    objRespuesta.error = true;
                    objRespuesta.tipoError = 'RORV005';
                    objRespuesta.message += 'Campo Tipo de Cambio vacío';
                }
                if (utilities.isEmpty(informacion.metodoPago)) {
                    objRespuesta.error = true;
                    objRespuesta.tipoError = 'RORV005';
                    objRespuesta.message += 'Campo Método de Pago vacío';
                }
                if (utilities.isEmpty(informacion.ubicacion)) {
                    objRespuesta.error = true;
                    objRespuesta.tipoError = 'RORV005';
                    objRespuesta.message += 'Campo Ubicación vacío';
                }
                if (utilities.isEmpty(informacion.sitio)) {
                    objRespuesta.error = true;
                    objRespuesta.tipoError = 'RORV005';
                    objRespuesta.message += 'Campo Sitio vacío';
                }
            }
            log.audit('DEBUG', 'Fin Proceso Crear Orden de Venta');
            if (!objRespuesta.error) {
                return respuesta;
            } else {
                return objRespuesta;
            }
        }

        
        return {
            post: doPost
        };
    });

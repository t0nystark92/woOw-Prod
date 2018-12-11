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


define(['N/error', 'N/http', 'N/https', 'N/record', 'N/search', 'N/url', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {http} http
     * @param {https} https
     * @param {record} record
     * @param {search} search
     */
    function(error, http, https, record, search, url, utilities, funcionalidades) {

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

            log.audit('Inicio Grabar Orden de Venta', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

            if (scriptContext.type == 'create') {
                var objRespuesta = new Object();
                objRespuesta.error = false;
                objRespuesta.detalle = new Array();
                try {



                    var idRegistro = scriptContext.newRecord.id;
                    var tipoRegistro = scriptContext.newRecord.type;

                    var requestBody = scriptContext.newRecord.getValue({ fieldId: 'custrecord_3k_generacion_ov_info' });

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
                                        objrespuestaParcial = new Object();
                                        objrespuestaParcial.codigo = 'RORV003';
                                        objrespuestaParcial.mensaje = 'Tipo de Operación no válida.';
                                        objRespuesta.detalle.push(objrespuestaParcial);
                                        //objRespuesta.tipoError = 'RORV003';
                                        //objRespuesta.descripcion = 'Tipo de Operación no válida.';
                                        log.error('RORV003', 'Tipo de Operación no válida.');
                                        break;
                                }
                            } else {
                                objRespuesta.error = true;
                                objrespuestaParcial = new Object();
                                objrespuestaParcial.codigo = 'RORV006';
                                objrespuestaParcial.mensaje = 'Variable Operación vacía';
                                objRespuesta.detalle.push(objrespuestaParcial);
                                //objRespuesta.tipoError = 'RORV006';
                                //objRespuesta.descripcion = 'Variable Operación vacía';
                            }
                        } else {
                            objRespuesta.error = true;
                            objrespuestaParcial = new Object();
                            objrespuestaParcial.codigo = 'RORV001';
                            objrespuestaParcial.mensaje = 'No se puede parsear objectJSON.';
                            objRespuesta.detalle.push(objrespuestaParcial);
                            //objRespuesta.tipoError = 'RORV001';
                            //objRespuesta.descripcion = 'No se puede parsear objectJSON.';
                            log.error('RORV001', 'No se puede parsear objectJSON');
                        }
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



                } catch (excepcion) {
                    log.error('Grabar Orden de Venta', 'AfterSubmit - Excepcion Grabando Orden de Venta - Excepcion : ' + excepcion.message);
                    throw utilities.crearError('RORV018', 'Excepcion Grabando Orden de Venta - Excepcion : ' + excepcion.message);
                }

                // INICIO - Actualizar Respuesta
                try {
                    var idRecord = record.submitFields({
                        type: tipoRegistro,
                        id: idRegistro,
                        values: {
                            custrecord_3k_generacion_ov_resp: JSON.stringify(objRespuesta)
                        },
                        options: {
                            enableSourcing: true,
                            ignoreMandatoryFields: false
                        }
                    });
                    if (utilities.isEmpty(idRecord)) {
                        log.error('Grabar Orden de Venta', 'AfterSubmit - Error Grabando Orden de Venta - Error : No se recibio ID de Registro de Orden de Venta Actualizdo');
                        throw utilities.crearError('RORV019', 'Error Grabando Orden de Venta - Error : No se recibio ID de Registro de Orden de Venta Actualizdo');
                    }
                } catch (exepcionSubmit) {
                    log.error('Grabar Orden de Venta', 'AfterSubmit - Excepcion Grabando Orden de Venta - Excepcion : ' + exepcionSubmit.message);
                    throw utilities.crearError('RORV020', 'Excepcion Grabando Orden de Venta - Excepcion : ' + exepcionSubmit.message);
                }
                // FIN - Actualizar Respuesta

            }

            log.audit('Fin Grabar Orden de Venta', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

        }

        function crearOrdenVenta(informacion) {
            log.audit('DEBUG', 'Inicio Proceso Crear Orden de Venta');
            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();
            //objRespuesta.message = "";
            //arrayOrdenes
            /*************************************************SE VALIDA QUE NO VENGA CLIENTE, MONEDA, TIPO CAMBIO Y CARRITO VACIO***************************************************/
            if (!utilities.isEmpty(informacion.cliente) && !utilities.isEmpty(informacion.moneda) && !utilities.isEmpty(informacion.tipoCambio) && !utilities.isEmpty(informacion.metodoPago) && !utilities.isEmpty(informacion.sitio)) {
                //log.audit('DEBUG','linea 131');

                try {

                    var arraySearchParams = [];
                    var objParam = new Object({});
                    objParam.name = 'custrecord_3k_ubicacion_sitio';
                    objParam.operator = 'IS';
                    objParam.values = [informacion.sitio];
                    arraySearchParams.push(objParam);

                    var objResultSet = utilities.searchSavedPro('customsearch_3k_ubicacion_sitio_web', arraySearchParams);
                    if (objResultSet.error) {
                        return objResultSet;
                    }

                    var resultUbicacion = objResultSet.objRsponseFunction.array;
                    var ubicacion = resultUbicacion[0].internalid;



                    if (utilities.isEmpty(informacion.ubicacion)) {
                        informacion.ubicacion = ubicacion;
                    }

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

                    /*rec.setValue({
                        fieldId: 'exchangerate',
                        value: informacion.tipoCambio.toString()
                    });*/

                    rec.setValue({
                        fieldId: 'custbody_3k_exchangerate_voucher',
                        value: informacion.tipoCambioVoucher
                    });

                    rec.setValue({
                        fieldId: 'custbody_3k_forma_pago',
                        value: informacion.metodoPago
                    });

                    rec.setValue({
                        fieldId: 'custbody_3k_id_orden_misbeneficios',
                        value: informacion.idOrdenMisBeneficios
                    });

                    rec.setValue({
                        fieldId: 'location',
                        value: informacion.ubicacion
                    });


                    rec.setValue({
                        fieldId: 'custbody_cseg_3k_sitio_web_o',
                        value: informacion.sitio
                    });

                    rec.setValue({
                        fieldId: 'custbody_3k_referencia_cliente',
                        value: informacion.referencia
                    });

                    rec.setValue({
                        fieldId: 'billcountry',
                        value: 'US'
                    });

                    if (!utilities.isEmpty(informacion.sistema)) {
                        rec.setValue({
                            fieldId: 'custbody_cseg_3k_sistema',
                            value: informacion.sistema
                        });
                    }

                    //INICIO RECIBIR DATOS FACTURACION

                    if (!utilities.isEmpty(informacion.tipoDocumento)) {
                        rec.setValue({
                            fieldId: 'custbody_l598_tipo_documento',
                            value: informacion.tipoDocumento
                        });
                    } else {
                        rec.setValue({
                            fieldId: 'custbody_l598_tipo_documento',
                            value: ''
                        });
                    }

                    if (!utilities.isEmpty(informacion.nroDocumento)) {
                        rec.setValue({
                            fieldId: 'custbody_l598_nro_documento',
                            value: informacion.nroDocumento
                        });
                    } else {
                        rec.setValue({
                            fieldId: 'custbody_l598_nro_documento',
                            value: ''
                        });
                    }

                    if (!utilities.isEmpty(informacion.razonSocial)) {
                        rec.setValue({
                            fieldId: 'custbody_l598_razon_social_cliente',
                            value: informacion.razonSocial
                        });

                    } else {
                        rec.setValue({
                            fieldId: 'custbody_l598_razon_social_cliente',
                            value: ''
                        });
                    }

                    var searchConfDomicilio = utilities.searchSavedPro('customsearch_3k_conf_dom_fact');

                    if (!utilities.isEmpty(searchConfDomicilio) && searchConfDomicilio.error == false) {
                        if (!utilities.isEmpty(searchConfDomicilio.objRsponseFunction.result) && searchConfDomicilio.objRsponseFunction.result.length > 0) {

                            var resultSet = searchConfDomicilio.objRsponseFunction.result;
                            var resultSearch = searchConfDomicilio.objRsponseFunction.search;

                            var direccionGenerica = resultSet[0].getValue({
                                name: resultSearch.columns[1]
                            });

                            if (utilities.isEmpty(informacion.direccionFactura)) {

                                informacion.direccionFactura = direccionGenerica;

                            }

                            var ciudadGenerica = resultSet[0].getValue({
                                name: resultSearch.columns[2]
                            });

                            if (utilities.isEmpty(informacion.ciudadFactura)) {

                                value: informacion.ciudadFactura = ciudadGenerica;

                            }

                            // FIN Obtener Domicilio General

                        } else {
                            objetoRespuesta.error = true;
                            objetoRespuesta.mensaje.tipo = 'RFAC025';
                            objetoRespuesta.mensaje.descripcion = 'Error Consultando Dimicilio Generico de Facturacion - Error : No se encontro la Configuracion Generica de Domicilio de Facturacion';
                            objRespuesta.detalle.push(objRespuestaParcial);
                            log.error(objetoRespuesta.mensaje.tipo, objetoRespuesta.mensaje.descripcion);
                            return JSON.stringify(objRespuesta);
                        }
                    } else {
                        if (utilities.isEmpty(searchConfDomicilio)) {
                            objetoRespuesta.error = true;
                            objetoRespuesta.mensaje.tipo = 'RFAC023';
                            objetoRespuesta.mensaje.descripcion = 'Error Consultando Domicilio Generico de Facturacion - Error : No se recibio Respuesta del Proceso de Busqueda del Domicilio Generico de Facturacion';
                            objRespuesta.detalle.push(objRespuestaParcial);
                            log.error(objetoRespuesta.mensaje.tipo, objetoRespuesta.mensaje.descripcion);
                            return JSON.stringify(objRespuesta);
                        } else {
                            objetoRespuesta.error = true;
                            objetoRespuesta.mensaje.tipo = 'RFAC024';
                            objetoRespuesta.mensaje.descripcion = 'Error Consultando Domicilio Generico de Facturacion - Error : ' + searchConfDomicilio.tipoError + ' - Descripcion : ' + searchConfDomicilio.descripcion;
                            objRespuesta.detalle.push(objRespuestaParcial);
                            log.error(objetoRespuesta.mensaje.tipo, objetoRespuesta.mensaje.descripcion);
                            return JSON.stringify(objRespuesta);
                        }
                    }





                    //FIN RECIBIR DATOS FACTURACION

                    /******************************* FIN  DE SETEO DE DE CAMPOS DE CABECERA DE LA OV *******************************************************************/


                    /******************************* INICIO LLAMADA A FUNCION QUE CREA LA OV *******************************************************************/

                    log.error('Crear Orden de Venta', 'INICIO LLAMADA FUNCION CREAR OV');

                    var respuesta = funcionalidades.crearOrdenVenta(rec, informacion, "NE");
                    if (respuesta.error) {
                        return respuesta;
                    }

                    log.error('Crear Orden de Venta', 'FIN LLAMADA FUNCION CREAR OV');

                    /******************************* FIN LLAMADA A FUNCION QUE CREA LA OV *******************************************************************/

                } catch (e) {
                    objRespuesta.error = true;
                    objrespuestaParcial = new Object();
                    objrespuestaParcial.codigo = 'RORV004';
                    objrespuestaParcial.mensaje = 'function crearOrdenVenta: ' + e.message;
                    objRespuesta.detalle.push(objrespuestaParcial);
                    //objRespuesta.tipoError = 'RORV004';
                    //objRespuesta.descripcion = 'function crearOrdenVenta: ' + e.message;
                    log.error('RORV004', 'funtion crearOrdenVenta: ' + e.message);
                }
            } else {
                if (utilities.isEmpty(informacion.cliente)) {
                    objRespuesta.error = true;
                    objrespuestaParcial = new Object();
                    objrespuestaParcial.codigo = 'RORV005';
                    objrespuestaParcial.mensaje += 'Campo Cliente vacío';
                    objRespuesta.detalle.push(objrespuestaParcial);
                    //objRespuesta.tipoError = 'RORV005';
                    //objRespuesta.message += 'Campo Cliente vacío';
                }
                if (utilities.isEmpty(informacion.moneda)) {
                    objRespuesta.error = true;
                    objrespuestaParcial = new Object({});
                    objrespuestaParcial.codigo = 'RORV005';
                    objrespuestaParcial.mensaje += 'Campo Moneda vacío';
                    objRespuesta.detalle.push(objrespuestaParcial);
                    //objRespuesta.tipoError = 'RORV005';
                    //objRespuesta.message += 'Campo Moneda vacío';
                }
                if (utilities.isEmpty(informacion.tipoCambio)) {
                    objRespuesta.error = true;
                    objrespuestaParcial = new Object({});
                    objrespuestaParcial.codigo = 'RORV005';
                    objrespuestaParcial.mensaje += 'Campo Tipo de Cambio vacío';
                    objRespuesta.detalle.push(objrespuestaParcial);
                    //objRespuesta.tipoError = 'RORV005';
                    //objRespuesta.message += 'Campo Tipo de Cambio vacío';
                }
                if (utilities.isEmpty(informacion.metodoPago)) {
                    objRespuesta.error = true;
                    objrespuestaParcial = new Object({});
                    objrespuestaParcial.codigo = 'RORV005';
                    objrespuestaParcial.mensaje += 'Campo Método de Pago vacío';
                    objRespuesta.detalle.push(objrespuestaParcial);
                    //objRespuesta.tipoError = 'RORV005';
                    //objRespuesta.message += 'Campo Método de Pago vacío';
                }
                /*if (utilities.isEmpty(informacion.ubicacion)) {
                    objRespuesta.error = true;
                    objrespuestaParcial = new Object();
                    objrespuestaParcial.codigo = 'RORV005';
                    objrespuestaParcial.mensaje += 'Campo Ubicación vacío';
                    objRespuesta.detalle.push(objrespuestaParcial);
                    //objRespuesta.tipoError = 'RORV005';
                    //objRespuesta.message += 'Campo Ubicación vacío';
                }*/
                if (utilities.isEmpty(informacion.sitio)) {
                    objRespuesta.error = true;
                    objrespuestaParcial = new Object({});
                    objrespuestaParcial.codigo = 'RORV005';
                    objrespuestaParcial.mensaje += 'Campo Sitio vacío';
                    objRespuesta.detalle.push(objrespuestaParcial);
                    //objRespuesta.tipoError = 'RORV005';
                    //objRespuesta.message += 'Campo Sitio vacío';
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
            afterSubmit: afterSubmit
        };

    });

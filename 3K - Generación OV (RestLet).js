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
    function (error, record, search, format, utilities, funcionalidades) {

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

            /*************************************************SE VALIDA QUE NO VENGA CLIENTE, MONEDA, TIPO CAMBIO Y CARRITO VACIO***************************************************/
            if (!utilities.isEmpty(informacion.cliente) && !utilities.isEmpty(informacion.moneda) && !utilities.isEmpty(informacion.tipoCambio) && !utilities.isEmpty(informacion.metodoPago) && !utilities.isEmpty(informacion.ubicacion) && !utilities.isEmpty(informacion.sitio) && !utilities.isEmpty(informacion.idExterno)) {
                //log.audit('DEBUG','linea 131');
                try {

                    var existeOV = false;
                    
                    //Consulta - Configuracion OV Travel
                    var searchConfigTravel = utilities.searchSavedPro('customsearch_3k_config_ov_travel');

                    if (!searchConfigTravel.error && !utilities.isEmpty(searchConfigTravel.objRsponseFunction.result) && searchConfigTravel.objRsponseFunction.result.length > 0) {

                        var resultSet = searchConfigTravel.objRsponseFunction.result;
                        var resultSearch = searchConfigTravel.objRsponseFunction.search;

                        var prefijoOV = resultSet[0].getValue({ name: resultSearch.columns[0] });
                        //log.debug('Crear Orden de Venta', 'prefijoOV: ' + JSON.stringify(prefijoOV));

                    } else {
                        respuesta.error = true;
                        respuesta.mensaje = "No existe una Configuracion OV Travel, para obtener el prefijo del ID Externo";
                        log.error('Crear Orden de Venta', respuesta.mensaje);
                    }

                    var externalID = prefijoOV + informacion.idExterno;

                    var arraySearchParams = [];
                    var objParam = new Object({});
                    objParam.name = 'externalid';
                    objParam.operator = 'IS';
                    objParam.values = externalID;
                    arraySearchParams.push(objParam);

                    var searchOV = utilities.searchSavedPro('customsearch_3k_ov_generadas', arraySearchParams);

                    if (!searchOV.error && !utilities.isEmpty(searchOV.objRsponseFunction.result) && searchOV.objRsponseFunction.result.length > 0) {

                        var resultSet = searchOV.objRsponseFunction.result;
                        var resultSearch = searchOV.objRsponseFunction.search;

                        var OVExistenteID = resultSet[0].getValue({ name: resultSearch.columns[1] });
                        var OVExistenteDocNumber = resultSet[0].getValue({ name: resultSearch.columns[2] });

                        log.debug('Crear Orden de Venta', 'OVExistenteID: ' + JSON.stringify(OVExistenteID) + ', OVExistenteDocNumber: ' + JSON.stringify(OVExistenteDocNumber));

                        if (!utilities.isEmpty(OVExistenteID) && !utilities.isEmpty(OVExistenteDocNumber)) {
                            existeOV = true;
                        }
                    }

                    log.debug('Crear Orden de Venta', 'existeOV: ' + JSON.stringify(existeOV));

                    if (!existeOV) {
                        
                        //Consulta - Ubicacion
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

                        log.debug('Crear Orden de Venta', 'externalID: ' + JSON.stringify(externalID));

                        rec.setValue({
                            fieldId: 'externalid',
                            value: externalID
                        });

                        rec.setValue({
                            fieldId: 'otherrefnum',
                            value: externalID
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

                        /*rec.setValue({
                            fieldId: 'custbody_3k_exchangerate_voucher',
                            value: informacion.tipoCambioVoucher
                        });*/

                        rec.setValue({
                            fieldId: 'custbody_3k_forma_pago',
                            value: informacion.metodoPago
                        });

                        rec.setValue({
                            fieldId: 'custbody_3k_id_orden_misbeneficios',
                            value: informacion.idOrdenMisBeneficios
                        }); //Verificar

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
                        }); //Verificar

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

                        //INICIO - NUEVOS CAMPOS SOLAPA FACTURACION

                        rec.setValue({
                            fieldId: 'custbody_3k_moneda_pago_ov',
                            value: informacion.monedaPago
                        });

                        rec.setValue({
                            fieldId: 'custbody_3k_tc_woow_ov',
                            value: informacion.tasaCambioWoow
                        });

                        rec.setValue({
                            fieldId: 'custbody_3k_importe_pago',
                            value: informacion.importePago
                        });

                        rec.setValue({
                            fieldId: 'custbody_3k_cant_cuotas',
                            value: informacion.cuotasPago
                        });

                        //FIN - NUEVOS CAMPOS SOLAPA FACTURACION

                        var searchConfDomicilio = utilities.searchSavedPro('customsearch_3k_conf_dom_fact');

                        if (!utilities.isEmpty(searchConfDomicilio) && searchConfDomicilio.error == false) {
                            if (!utilities.isEmpty(searchConfDomicilio.objRsponseFunction.result) && searchConfDomicilio.objRsponseFunction.result.length > 0) {

                                var resultSet = searchConfDomicilio.objRsponseFunction.result;
                                var resultSearch = searchConfDomicilio.objRsponseFunction.search;

                                var direccionGenerica = resultSet[0].getValue({
                                    name: resultSearch.columns[1]
                                });

                                //log.error('Crear Orden de Venta', 'informacion.direccionFactura: ' + informacion.direccionFactura);

                                if (utilities.isEmpty(informacion.direccionFactura)) {

                                    informacion.direccionFactura = direccionGenerica;

                                }

                                var ciudadGenerica = resultSet[0].getValue({
                                    name: resultSearch.columns[2]
                                });

                                //log.error('Crear Orden de Venta', 'informacion.ciudadFactura: ' + informacion.ciudadFactura);

                                if (utilities.isEmpty(informacion.ciudadFactura)) {

                                    informacion.ciudadFactura = ciudadGenerica;

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

                        log.debug('Crear Orden de Venta', 'INICIO LLAMADA FUNCION CREAR OV');

                        var respuesta = funcionalidades.crearOrdenVenta(rec, informacion, "NE");
                        if (respuesta.error) {
                            return respuesta;
                        }

                        log.debug('Crear Orden de Venta', 'FIN LLAMADA FUNCION CREAR OV');

                        /******************************* FIN LLAMADA A FUNCION QUE CREA LA OV *******************************************************************/

                    } else {
                        log.debug('Crear Orden de Venta', 'Ya existe OV con el ID Externo: ' + externalID + '. ID Interno: ' + OVExistenteID + ' - Nro Documento: ' + OVExistenteDocNumber);
                        log.audit('DEBUG', 'Fin Proceso Crear Orden de Venta');

                        var respuesta = new Object();
                        respuesta.error = false;
                        respuesta.detalle = [];
                        respuesta.idOV = OVExistenteID;
                        respuesta.numeroOV = OVExistenteDocNumber;
                        return respuesta;
                    }

                } catch (e) {
                    objRespuesta.error = true;
                    objRespuesta.tipoError = 'RORV004';
                    objRespuesta.descripcion = 'function crearOrdenVenta: ' + e.message;
                    log.error('RORV004', 'function crearOrdenVenta: ' + e.message);
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

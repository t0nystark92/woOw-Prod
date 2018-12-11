/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities',
        '3K/funcionalidadesURU': './3K - Funcionalidades URU',
        '3K/funcionalidadesOV': './3K - Funcionalidades OV'
    }
});*/

define(['N/error', 'N/record', 'N/search', 'N/format', '3K/utilities', '3K/funcionalidadesURU', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */

    function(error, record, search, format, utilities, funcionalidadesURU, funcionalidades) {

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
            try {
                log.audit('Inicio Grabar Voucher', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

                if (scriptContext.type == 'create' || scriptContext.type == 'edit') {

                    var idNotaCredito = '';
                    var ArticuloCredito = '';
                    var CantidadCredito = '';
                    var UbicacionVoucher = '';
                    var idVoucher = scriptContext.newRecord.id;
                    var tipoRegitroVoucher = scriptContext.newRecord.type;
                    if (!utilities.isEmpty(idVoucher) && !utilities.isEmpty(tipoRegitroVoucher)) {
                        // INICIO - Obtener Codigo de Accion de Voucher
                        var codigoAccion = scriptContext.newRecord.getValue({ fieldId: 'custrecord_3k_vouchers_cod_acc' });
                        var clienteVoucher = scriptContext.newRecord.getValue({ fieldId: 'custrecord_3k_vouchers_cliente' });
                        var importeVoucher = scriptContext.newRecord.getValue({ fieldId: 'custrecord_3k_vouchers_monto' });
                        var monedaVoucher = scriptContext.newRecord.getValue({ fieldId: 'custrecord_3k_vouchers_moneda' });
                        var sitioVoucher = scriptContext.newRecord.getValue({ fieldId: 'custrecord_34_cseg_3k_sitio_web_o' });
                        var IDOrdenAsociada = scriptContext.newRecord.getValue({ fieldId: 'custrecord_3k_vouchers_det_orden' });
                        var codigoEstadoVoucher = scriptContext.newRecord.getValue({ fieldId: 'custrecord_3k_vouchers_cod_estado' });
                        var notaCreditoVoucher = scriptContext.newRecord.getValue({ fieldId: 'custrecord_3k_vouchers_nc_asociada' });

                        log.debug('after voucher', 'sitioVoucher: ' + sitioVoucher);

                        if (utilities.isEmpty(notaCreditoVoucher)) {
                        	log.debug('after voucher', 'Linea 58');
                        	log.debug('after voucher', 'codigoAccion: '+ codigoAccion);
                        	log.debug('after voucher', 'codigoEstadoVoucher: '+ codigoEstadoVoucher);
                            if (codigoAccion == '2' && codigoEstadoVoucher == '1') {
                                // Voucher de Devolucion y Estado Activo
                                if (!utilities.isEmpty(codigoAccion) && !utilities.isEmpty(clienteVoucher) && !utilities.isEmpty(importeVoucher) && !isNaN(importeVoucher) && parseFloat(importeVoucher, 10) > 0.00 && !utilities.isEmpty(monedaVoucher) && !utilities.isEmpty(sitioVoucher) && !utilities.isEmpty(codigoEstadoVoucher)) {

                                    //INICIO BUSQUEDA DE CUPON SERVICIO
                                    var arraySearchParams = new Array();
                                    var objParam = new Object({});
                                    objParam.name = 'custrecord_3k_cupon_id_orden';
                                    objParam.operator = 'IS';
                                    objParam.values = [IDOrdenAsociada];
                                    arraySearchParams.push(objParam);

                                    var objResultSet = utilities.searchSavedPro('customsearch_3k_cupon_detalle_ov', arraySearchParams);
                                    if (objResultSet.error) {
                                        log.error('Grabar Voucher', 'AfterSubmit - Error consultando Cupones por Detalle OV para el Voucher con ID Interno : ' + idVoucher);
                                        throw utilities.crearError('SVOU009', 'Error consultando Cupones por Detalle OV para el Voucher con ID Interno : ' + idVoucher);
                                    }

                                    var resultCupones = objResultSet.objRsponseFunction.array;


                                    log.debug('AfterSubmit Voucher', 'resultCupones: ' + JSON.stringify(resultCupones));

                                    if (!utilities.isEmpty(resultCupones) && resultCupones.length > 0) {
                                        //AQUI SE HACE AJUSTE DE LIQUIDACION POR LO QUE EL VOUCHER Y EL DETALLE OV PERTENCE A UN CUPON DE SERVICIO


                                    } else {


                                        // INICIO - Obtener Configuracion Voucher
                                        var searchConfigVoucher = utilities.searchSaved('customsearch_3k_configuracion_voucher_ss');
                                        if (searchConfigVoucher.error) {
                                            log.error('Grabar Voucher', 'AftereSubmit - Error consultando Configuracion de vouchers para el Voucher con ID Interno : ' + idVoucher);
                                            throw utilities.crearError('SVOU006', 'Error consultando Configuracion de vouchers para el Voucher con ID Interno : ' + idVoucher);
                                        } else {
                                            if (!utilities.isEmpty(searchConfigVoucher.objRsponseFunction.result) && searchConfigVoucher.objRsponseFunction.result.length > 0) {

                                                ArticuloCredito = searchConfigVoucher.objRsponseFunction.result[0].getValue({
                                                    name: searchConfigVoucher.objRsponseFunction.search.columns[1]
                                                });

                                                CantidadCredito = searchConfigVoucher.objRsponseFunction.result[0].getValue({
                                                    name: searchConfigVoucher.objRsponseFunction.search.columns[2]
                                                });

                                                if (utilities.isEmpty(ArticuloCredito) || utilities.isEmpty(CantidadCredito)) {
                                                    var mensaje = "Error Obteniendo la siguiente Informacion de la Configuracion de Voucher para el Voucher con ID Interno : " + idVoucher;
                                                    if (utilities.isEmpty(ArticuloCredito)) {
                                                        mensaje = mensaje + " Articulo A Utilizar en Nota de Credito por Devolucion /";
                                                    }
                                                    if (utilities.isEmpty(CantidadCredito)) {
                                                        mensaje = mensaje + " Cantidad de Articulo A Utilizar en Nota de Credito por Devolucion /";
                                                    }
                                                    log.error('Grabar Voucher', 'AftereSubmit - Error Grabando Voucher - Error : ' + mensaje);
                                                    throw utilities.crearError('SVOU008', 'Error Grabando Voucher  - Error : ' + mensaje);
                                                }
                                            } else {
                                                log.error('Grabar Voucher', 'AftereSubmit - Error consultando Configuracion de vouchers para el Voucher con ID Interno : ' + idVoucher + ' - No se encuentra realizada la Configuracion de Vouchers');
                                                throw utilities.crearError('SVOU007', 'Error consultando Configuracion de vouchers para el Voucher con ID Interno : ' + idVoucher + ' - No se encuentra realizada la Configuracion de Vouchers');
                                            }

                                        }
                                        // FIN - Obtener Configuracion Voucher
                                        // INICIO - Obtener Ubicacion por Sitio Web
                                        var arraySearchParams = new Array();
                                        var objParam = new Object({});
                                        objParam.name = 'custrecord_3k_ubicacion_sitio';
                                        objParam.operator = 'IS';
                                        objParam.values = [sitioVoucher];
                                        arraySearchParams.push(objParam);

                                        var objResultSet = utilities.searchSavedPro('customsearch_3k_ubicacion_sitio_web', arraySearchParams);
                                        if (objResultSet.error) {
                                            log.error('Grabar Voucher', 'AftereSubmit - Error consultando Configuracion de Ubicacion por Sitio Web para el Voucher con ID Interno : ' + idVoucher);
                                            throw utilities.crearError('SVOU009', 'Error consultando Configuracion de Ubicacion por Sitio Web para el Voucher con ID Interno : ' + idVoucher);
                                        }

                                        var resultUbicacion = objResultSet.objRsponseFunction.array;
                                        UbicacionVoucher = resultUbicacion[0].internalid;

                                        var arrayParam = [];
                                        var objParam = new Object({});
                                        objParam.name = 'custcol_3k_id_orden';
                                        objParam.operator = 'IS';
                                        objParam.values = [IDOrdenAsociada];
                                        arrayParam.push(objParam);

                                        var resultOrdenes = utilities.searchSavedPro('customsearch_3k_ordenes_facturadas', arrayParam);
                                        if (resultOrdenes.error) {
                                            throw utilities.crearError('SVOU009', JSON.stringify(resultOrdenes));
                                        }
                                        var idFacturaArray = resultOrdenes.objRsponseFunction.array;

                                        log.debug('afterSubmit Funcionalidades Voucher', 'idFacturaArray: ' + JSON.stringify(idFacturaArray));


                                        if (!utilities.isEmpty(idFacturaArray) && idFacturaArray.length > 0) {

                                            if (!utilities.isEmpty(UbicacionVoucher)) {
                                                // FIN - Obtener Ubicacion por sitio Web
                                                // INICIO - Generar Nota de Credito de Devolucion
                                                // INICIO GENERAR ORDEN DE COMPRAS
                                                var registroNC = record.create({
                                                    type: 'creditmemo',
                                                    isDynamic: true
                                                });

                                                registroNC.setValue({
                                                    fieldId: 'entity',
                                                    value: clienteVoucher
                                                });

                                                // INICIO - Marcar Nota de Credito como Interna
                                                registroNC.setValue({
                                                    fieldId: 'custbody_l598_trans_interna',
                                                    value: true
                                                });
                                                // FIN - Marcar Nota de Credito como Interna

                                                registroNC.setValue({
                                                    fieldId: 'currency',
                                                    value: monedaVoucher
                                                });

                                                if (!utilities.isEmpty(sitioVoucher)) {
                                                    registroNC.setValue({
                                                        fieldId: 'custbody_cseg_3k_sitio_web_o',
                                                        value: sitioVoucher
                                                    });
                                                }

                                                if (!utilities.isEmpty(UbicacionVoucher)) {
                                                    registroNC.setValue({
                                                        fieldId: 'location',
                                                        value: UbicacionVoucher
                                                    });
                                                }

                                                registroNC.setValue({
                                                    fieldId: 'custbody_3k_nc_devolucion',
                                                    value: true
                                                });

                                                registroNC.setValue({
                                                    fieldId: 'createdfrom',
                                                    value: idFacturaArray[0].internalid
                                                });

                                                registroNC.setValue({
                                                    fieldId: 'custbody_l598_tipo_comp_ref',
                                                    value: idFacturaArray[0].custbody_l598_tipo_comprobante
                                                });

                                                registroNC.setValue({
                                                    fieldId: 'custbody_l598_serie_comp_ref',
                                                    value: idFacturaArray[0].custbody_l598_serie_comprobante
                                                });

                                                registroNC.setValue({
                                                    fieldId: 'custbody_l598_nro_comp_ref',
                                                    value: idFacturaArray[0].custbody_l598_nro_comprobante
                                                });

                                                var fechaParse = format.parse({
                                                    value: idFacturaArray[0].trandate,
                                                    type: format.Type.DATE,
                                                    //timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                                                });

                                                registroNC.setValue({
                                                    fieldId: 'custbody_l598_fecha_comp_ref',
                                                    value: fechaParse
                                                });


                                                // INICIO AGREGAR ITEMS

                                                registroNC.selectNewLine({
                                                    sublistId: 'item'
                                                });

                                                registroNC.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'item',
                                                    value: ArticuloCredito
                                                });

                                                registroNC.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'quantity',
                                                    value: CantidadCredito
                                                });

                                                registroNC.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'rate',
                                                    value: parseFloat(importeVoucher, 10).toFixed(2).toString()
                                                });

                                                registroNC.commitLine({
                                                    sublistId: 'item'
                                                });

                                                // FIN AGREGAR ITEMS

                                                var respuestaBefore = funcionalidadesURU.beforeSubmit('create', registroNC);

                                                if (respuestaBefore.error) {
                                                    throw utilities.crearError('SVOU013', JSON.stringify(respuestaBefore));
                                                }

                                                try {
                                                    idNotaCredito = registroNC.save();
                                                } catch (excepcionNC) {
                                                    var mensaje = 'Excepcion Generando Nota de Credito para Voucher con ID Interno : ' + idVoucher + ' - Excepcion : ' + excepcionNC.message.toString();
                                                    log.error('Grabar Voucher', mensaje);
                                                    throw utilities.crearError('SVOU011', mensaje);
                                                }
                                                // FIN - Generar Nota de Credito de Devolucion
                                                if (!utilities.isEmpty(idNotaCredito)) {
                                                    // INICIO - Ejecutar After Submit
                                                    var respuestaAfter = funcionalidadesURU.afterSubmit('creditmemo', idNotaCredito);

                                                    if (respuestaAfter.error) {

                                                        record.delete({
                                                            type: record.Type.CREDIT_MEMO,
                                                            id: idNotaCredito,
                                                        });

                                                        throw utilities.crearError('SVOU014', JSON.stringify(respuestaAfter));
                                                    }

                                                    //INICIO CONSULTAR SUBSIDIARIA
                                                    var subsidiaria = '';

                                                    var searchConfig = utilities.searchSaved('customsearch_3k_config_sub_fact');

                                                    if (!utilities.isEmpty(searchConfig) && !searchConfig.error) {
                                                        if (!utilities.isEmpty(searchConfig.objRsponseFunction.result) && searchConfig.objRsponseFunction.result.length > 0) {
                                                            subsidiaria = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[1] });

                                                            if (utilities.isEmpty(subsidiaria)) {
                                                                objRespuesta.error = true;
                                                                var mensaje = 'No se encuentra configurada la siguiente informacion del panel de configuracion de Subsidiaria Facturacion : ';
                                                                if (utilities.isEmpty(subsidiaria)) {
                                                                    mensaje = mensaje + ' Subsidiaria / ';
                                                                }

                                                                log.error('SVOU014', mensaje);
                                                                throw utilities.crearError('SVOU014', JSON.stringify(mensaje));
                                                            }
                                                        } else {
                                                            var mensaje = 'No se encuentra realizada la configuracion de Subsidiaria Facturacion : ';
                                                            log.error('SVOU014', mensaje);
                                                            throw utilities.crearError('SVOU014', JSON.stringify(mensaje));
                                                        }
                                                    } else {
                                                        var mensaje = 'Error Consultando Configuracion de Subsidiaria de Facturacion - Tipo Error : ' + searchConfig.tipoError + ' - Descripcion : ' + searchConfig.descripcion;
                                                        log.error('SVOU014', mensaje);
                                                        throw utilities.crearError('SVOU014', JSON.stringify(mensaje));
                                                    }


                                                    arrayNC = [];
                                                    arrayNC.push(idNotaCredito);

                                                    /*var resultCae = funcionalidades.generarCAE(arrayNC, subsidiaria);
                                                    if (resultCae.error) {
                                                        throw utilities.crearError('SVOU014', JSON.stringify(resultCae));
                                                    }*/

                                                    // FIN - Ejecutar After Submit
                                                    // INICIO - Actualizar Nota de Credito en Voucher
                                                    try {
                                                        var idRecord = record.submitFields({
                                                            type: tipoRegitroVoucher,
                                                            id: idVoucher,
                                                            values: {
                                                                custrecord_3k_vouchers_nc_asociada: idNotaCredito
                                                            },
                                                            options: {
                                                                enableSourcing: true,
                                                                ignoreMandatoryFields: false
                                                            }
                                                        });
                                                        if (utilities.isEmpty(idRecord)) {
                                                            log.error('Grabar Voucher', 'AfterSubmit - Error Actualizando Nota de Credito Generada con ID Interno : ' + idNotaCredito + ' en Voucher con ID Interno : ' + idVoucher + ' - Error : No se recibio ID del Voucher Actualizado');
                                                            throw utilities.crearError('SVOU002', 'Error Actualizando Nota de Credito Generada con ID Interno : ' + idNotaCredito + ' en Voucher con ID Interno : ' + idVoucher + ' - Error : No se recibio ID del Voucher Actualizado');
                                                        }
                                                    } catch (exepcionSubmit) {
                                                        log.error('Grabar Voucher', 'AfterSubmit - Excepcion Actualizando Nota de Credito Generada con ID Interno : ' + idNotaCredito + ' en Voucher con ID Interno : ' + idVoucher + ' - Excepcion : ' + exepcionSubmit.message);
                                                        throw utilities.crearError('SVOU003', 'Excepcion Actualizando Nota de Credito Generada con ID Interno : ' + idNotaCredito + ' en Voucher con ID Interno : ' + idVoucher + ' - Excepcion : ' + exepcionSubmit.message);
                                                    }
                                                    // FIN - Actualizar Nota de Credito en Voucher
                                                } else {
                                                    var mensaje = 'Error Generando Nota de Credito para Voucher con ID Interno : ' + idVoucher + ' - Error : No se recibio el ID Interno de la Nota de Credito Generada';
                                                    log.error('Grabar Voucher', mensaje);
                                                    if (scriptContext.type == 'create') {
                                                        record.delete({
                                                            type: 'customrecord_3k_vouchers',
                                                            id: idVoucher,
                                                        });
                                                    }
                                                    throw utilities.crearError('SVOU012', mensaje);
                                                }
                                            } else {
                                                log.error('Grabar Voucher', 'AftereSubmit - Error consultando Configuracion de Ubicacion por Sitio Web para el Voucher con ID Interno : ' + idVoucher + ' - No se encuentra Configurada la Ubicacion para el Sitio Web con ID Interno : ' + sitioVoucher);
                                                if (scriptContext.type == 'create') {
                                                    record.delete({
                                                        type: 'customrecord_3k_vouchers',
                                                        id: idVoucher,
                                                    });
                                                }
                                                throw utilities.crearError('SVOU010', 'Error consultando Configuracion de Ubicacion por Sitio Web para el Voucher con ID Interno : ' + idVoucher + ' - No se encuentra Configurada la Ubicacion para el Sitio Web con ID Interno : ' + sitioVoucher);
                                            }

                                        } else { // ELSE SI NO TIENE FACTURA

                                            var objFieldLookUpRecordOV = search.lookupFields({
                                                type: 'customrecord_3k_det_linea_ov',
                                                id: IDOrdenAsociada,
                                                columns: [
                                                    'custrecord_3k_det_linea_ov_ov'
                                                ]
                                            });

                                            log.debug('afterSubmit Funcionalidades Voucher', 'depositoArray: ' + JSON.stringify(objFieldLookUpRecordOV));

                                            var idCarrito = objFieldLookUpRecordOV.custrecord_3k_det_linea_ov_ov[0].value;

                                            var arrayParam = [];
                                            var objParam = new Object({});
                                            objParam.name = 'salesorder';
                                            objParam.operator = 'IS';
                                            objParam.values = [idCarrito];
                                            arrayParam.push(objParam);

                                            var resultDepositos = utilities.searchSavedPro('customsearch_3k_ordenes_pagadas', arrayParam);
                                            if (resultDepositos.error) {
                                                throw utilities.crearError('SVOU009', JSON.stringify(resultDepositos));
                                            }
                                            var depositoArray = resultDepositos.objRsponseFunction.array;

                                            log.debug('afterSubmit Funcionalidades Voucher', 'depositoArray: ' + JSON.stringify(depositoArray));


                                            if (!utilities.isEmpty(depositoArray) && depositoArray.length > 0) {

                                            	var idDeposito = depositoArray[0].internalid;

                                                try {
                                                    var idRecord = record.submitFields({
                                                        type: tipoRegitroVoucher,
                                                        id: idVoucher,
                                                        values: {
                                                            custrecord_3k_vouchers_nc_asociada: idDeposito,
                                                            custrecord_3k_vouchers_aplicar_deposito: true
                                                        },
                                                        options: {
                                                            enableSourcing: true,
                                                            ignoreMandatoryFields: false
                                                        }
                                                    });
                                                    if (utilities.isEmpty(idRecord)) {
                                                        log.error('Grabar Voucher', 'AfterSubmit - Error Actualizando Depósito Generada con ID Interno : ' + idDeposito + ' en Voucher con ID Interno : ' + idVoucher + ' - Error : No se recibio ID del Voucher Actualizado');
                                                        throw utilities.crearError('SVOU002', 'Error Actualizando Depósito Generada con ID Interno : ' + idDeposito + ' en Voucher con ID Interno : ' + idVoucher + ' - Error : No se recibio ID del Voucher Actualizado');
                                                    }
                                                } catch (exepcionSubmit) {
                                                    log.error('Grabar Voucher', 'AfterSubmit - Excepcion Actualizando Depósito Generada con ID Interno : ' + idDeposito + ' en Voucher con ID Interno : ' + idVoucher + ' - Excepcion : ' + exepcionSubmit.message);
                                                    throw utilities.crearError('SVOU003', 'Excepcion Actualizando Depósito Generada con ID Interno : ' + idDeposito + ' en Voucher con ID Interno : ' + idVoucher + ' - Excepcion : ' + exepcionSubmit.message);
                                                }


                                            } else {

                                                log.error('Grabar Voucher', 'AftereSubmit - Error : La Orden Ingresada en el Voucher no se encuentra Facturada y no tiene Deposito - Voucher con ID Interno : ' + idVoucher);
                                                if (scriptContext.type == 'create') {
                                                    record.delete({
                                                        type: 'customrecord_3k_vouchers',
                                                        id: idVoucher,
                                                    });
                                                }
                                                throw utilities.crearError('SVOU015', 'AftereSubmit - Error : La Orden Ingresada en el Voucher no se encuentra Facturada y no tiene Deposito - Voucher con ID Interno : ' + idVoucher);
                                            }
                                        }

                                    } //END ELSE SI CUPON ES NOTA DE CREDITO Y ES UN PRODUCTO

                                } else {
                                    // No se Configuro Inforamcion Requerida del Voucher
                                    var mensaje = 'No se encuentra configurada la siguiente informacion requerida para el Voucher con  ID Interno : ' + idVoucher;
                                    if (utilities.isEmpty(codigoAccion)) {
                                        mensaje = mensaje + ' Codigo de Accion del Tipo de Voucher / ';
                                    }
                                    if (utilities.isEmpty(codigoEstadoVoucher)) {
                                        mensaje = mensaje + ' Codigo de Estado del Voucher / ';
                                    }
                                    if (utilities.isEmpty(clienteVoucher)) {
                                        mensaje = mensaje + ' Cliente Asignado al Voucher / ';
                                    }
                                    if (isNaN(importeVoucher)) {
                                        mensaje = mensaje + ' Importe de Voucher Invalido / ';
                                    }
                                    if (utilities.isEmpty(importeVoucher) || parseFloat(importeVoucher, 10) <= 0.00) {
                                        mensaje = mensaje + ' Importe de Voucher No Positivo / ';
                                    }
                                    if (utilities.isEmpty(monedaVoucher)) {
                                        mensaje = mensaje + ' Moneda de Voucher / ';
                                    }
                                    if (utilities.isEmpty(sitioVoucher)) {
                                        mensaje = mensaje + ' Sitio Web de Voucher / ';
                                    }
                                    log.error('Grabar Voucher', mensaje);
                                    if (scriptContext.type == 'create') {
                                        record.delete({
                                            type: 'customrecord_3k_vouchers',
                                            id: idVoucher,
                                        });
                                    }
                                    throw utilities.crearError('SVOU001', mensaje);
                                }
                                // FIN - Obtener Codigo de Accion de Voucher
                            }
                        }
                    } else {
                        // Error Obteniendo ID/ Tipo de Registro
                        var mensaje = "Error Obteniendo la siguiente Informacion del Voucher : ";
                        if (utilities.isEmpty(idVoucher)) {
                            mensaje = mensaje + " ID Interno del Voucher /";
                        }
                        if (utilities.isEmpty(tipoRegitroVoucher)) {
                            mensaje = mensaje + " Tipo de Registro de Voucher /";
                        }
                        log.error('Grabar Voucher', 'AftereSubmit - Error Grabando Voucher - Error : ' + mensaje);
                        throw utilities.crearError('SVOU004', 'Error Grabando Voucher  - Error : ' + mensaje);
                    }
                }
            } catch (excepcion) {
                log.error('Grabar Voucher', 'AfterSubmit - Excepcion Grabando Voucher - Excepcion : ' + excepcion.message);
                throw utilities.crearError('SVOU005', 'Excepcion Grabando Voucher - Excepcion : ' + excepcion.message);
            }
            log.audit('Fin Grabar Voucher', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

        }

        return {
            afterSubmit: afterSubmit
        };

    });
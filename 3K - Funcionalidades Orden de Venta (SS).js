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

define(['N/error', 'N/record', 'N/search', 'N/runtime', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */

    function(error, record, search, runtime, utilities, funcionalidades) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        /*function beforeSubmit(scriptContext) {
            var error = false;
            var codigoError = '';
            var mensajeError = '';
            try {
                log.audit('Inicio Grabar Orden de Venta', 'BeforeSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);
                if (!utilities.isEmpty(scriptContext.type) && !utilities.isEmpty(scriptContext.newRecord.id)) {
                    if (scriptContext.type == 'CSV') {
                        var rec = scriptContext.newRecord;
                        var arrayLinea = new Array();
                        var arrayOV = new Array();
                        var fecha = scriptContext.newRecord.getValue({ fieldId: 'trandate' });
                        var respuesta = beforeSubmitOV(rec, arrayLinea, arrayOV, fecha);
                        if (!utilities.isEmpty(respuesta)) {
                            log.debug('Generación Orden de Venta - Before Submit', 'Respuesta : ' + JSON.stringify(respuesta));

                            if (respuesta.error == true && !utilities.isEmpty(respuesta.detalle) && respuesta.detalle.length > 0) {
                                error = true;
                                codigoError = 'SBOV001';
                                mensajeError = 'Error Generando Orden de Venta con ID Interno : ' + respuesta.idOV + ' Error : ' + respuesta.detalle.toString();
                            } else {
                                error = true;
                                codigoError = 'SBOV002';
                                mensajeError = 'Error Generando Orden de Venta con ID Interno : ' + respuesta.idOV + ' Error : ' + 'No se recibio Informacion del Detalle de Error de la Funcionalidad After Submit';
                            }
                        } else {
                            error = true;
                            codigoError = 'SBOV003';
                            mensajeError = 'Error Generando Orden de Venta con ID Interno : ' + respuesta.idOV + ' Error : ' + 'No se recibio Informacion de Respuesta de la Funcionalidad After Submit';
                        }
                    }
                } else {
                    error = true;
                    codigoError = 'SBOV004';
                    mensajeError = 'Error Generando Orden de Venta - No se recibio la siguiente informacion requerida : ';
                    if (utilities.isEmpty(scriptContext.type)) {
                        mensaje = mensaje + ' Tipo de Evento de la Ejecucion / ';
                    }
                    if (utilities.isEmpty(scriptContext.newRecord.id)) {
                        mensaje = mensaje + ' ID Interno de la Orden de Venta / ';
                    }
                }
            } catch (excepcion) {
                error = true;
                codigoError = 'SBOV005';
                mensajeError = 'Excepcion Grabando Orden de Venta con ID Interno : ' + respuesta.idOV + ' Excepcion : ' + excepcion.message;
            }
            if (error == true) {
                log.error('Grabar Orden de Venta - BeforeSubmit', 'Error Grabando Orden de Venta con ID Interno : ' + respuesta.idOV + ' Codigo Error : ' + codigoError + ' Error : ' + mensajeError);
                throw utilities.crearError(codigoError, mensajeError);
            }
            log.audit('Fin Grabar Orden de Venta', 'BeforeSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);
        }*/

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
            var error = false;
            var codigoError = '';
            var mensajeError = '';
            try {
                log.audit('Inicio Grabar Orden de Venta', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);
                var idRecord = scriptContext.newRecord.id;
                var executionContext = runtime.executionContext;
                if (!utilities.isEmpty(scriptContext.type) && !utilities.isEmpty(scriptContext.newRecord.id)) {
                    if (executionContext == 'CSVIMPORT') {

                        
                        objRecord = record.load({
                            type: 'salesorder',
                            id: idRecord,
                            isDynamic: true,
                        });

                        //INICIO DE ELIMINAR LINEAS OV Y LLAMAR A LA FUNCION CREAR ORDEN VENTA
                        var arrayLinea = new Array();
                        var arrayOV = new Array();
                        var fecha = scriptContext.newRecord.getValue({ fieldId: 'trandate' });


                        var searchConfig = utilities.searchSaved('customsearch_3k_configuracion_stock_prop');
                        if (searchConfig.error) {
                            return searchConfig;
                        } else {
                            var proveedorSP = searchConfig.objRsponseFunction.result[0].getValue({
                                name: searchConfig.objRsponseFunction.search.columns[1]
                            });
                            var importeSP = searchConfig.objRsponseFunction.result[0].getValue({
                                name: searchConfig.objRsponseFunction.search.columns[2]
                            });

                        }

                        var numLines = objRecord.getLineCount({
                            sublistId: 'item'
                        });

                        var objJSON = new Object({});

                        objJSON.ubicacion = objRecord.getValue({
                            fieldId: 'location'
                        });

                        objJSON.sitio = objRecord.getValue({
                            fieldId: 'custbody_cseg_3k_sitio_web_o'
                        });

                        if (numLines > 0) {
                            for (var i = 0; i < numLines; i++) {
                                var isVoucher = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_linea_voucher',
                                    line: i
                                });

                                if (!isVoucher) {
                                    obj = new Object({});

                                    obj.articulo = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'item',
                                        line: i
                                    });

                                    obj.campana = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_campana',
                                        line: i
                                    });

                                    //arrayOV.push(JSON.parse(JSON.stringify(obj)));

                                    obj.cantidadTotalCupones = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_cant_total_cupones',
                                        line: i
                                    });

                                    obj.importe = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'rate',
                                        line: i
                                    });

                                    obj.cantidadCuotas = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_cant_cuotas',
                                        line: i
                                    });

                                    obj.moneda = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_moneda',
                                        line: i
                                    });

                                    obj.impEnvio = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_imp_envio',
                                        line: i
                                    });

                                    obj.lugarRetiro = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_lugar_retiro',
                                        line: i
                                    });

                                    obj.ciudad = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_ciudad',
                                        line: i
                                    });

                                    obj.barrio = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_barrio',
                                        line: i
                                    });

                                    obj.direccion = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_direccion',
                                        line: i
                                    });

                                    var objVoucher = new Object({});

                                    objVoucher.idVoucher = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_voucher',
                                        line: i
                                    });

                                    objVoucher.montoVoucher = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_importe_voucher',
                                        line: i
                                    });

                                    obj.voucher = objVoucher;

                                    arrayOV.push(JSON.parse(JSON.stringify(obj)));

                                }

                                objRecord.removeLine({
                                    sublistId: 'item',
                                    line: i
                                });
                                i--;
                                numLines--;
                            }
                        }

                        objJSON.orden = arrayOV;
                        var respuesta = funcionalidades.crearOrdenVenta(objRecord, objJSON, "NE");
                        //var respuesta = afterSubmitOV(scriptContext.newRecord.id);
                        if (!utilities.isEmpty(respuesta)) {
                            log.debug('Generación Orden de Venta - After Submit', 'Respuesta : ' + JSON.stringify(respuesta));

                            if (respuesta.error == true) {
                                if (!utilities.isEmpty(respuesta.detalle) && respuesta.detalle.length > 0) {
                                    error = true;
                                    codigoError = 'SBOV001';
                                    mensajeError = 'Error Generando Orden de Venta : ' + respuesta.detalle.toString();
                                } else {
                                    error = true;
                                    codigoError = 'SBOV002';
                                    mensajeError = 'Error Generando Orden de Venta : ' + 'No se recibio Informacion del Detalle de Error de la Funcionalidad After Submit';
                                }
                            } else {
                                error = false;
                            }
                        } else {
                            error = true;
                            codigoError = 'SAOV003';
                            mensajeError = 'Error Generando Orden de Venta con ID Interno : ' + respuesta.idOV + ' Error : ' + 'No se recibio Informacion de Respuesta de la Funcionalidad After Submit';
                        }
                    }
                } else {
                    error = true;
                    codigoError = 'SAOV004';
                    mensajeError = 'Error Generando Orden de Venta - No se recibio la siguiente informacion requerida : ';
                    if (utilities.isEmpty(scriptContext.type)) {
                        mensaje = mensaje + ' Tipo de Evento de la Ejecucion / ';
                    }
                    if (utilities.isEmpty(scriptContext.newRecord.id)) {
                        mensaje = mensaje + ' ID Interno de la Orden de Venta / ';
                    }

                }
            } catch (excepcion) {
                error = true;
                codigoError = 'SAOV005';
                mensajeError = 'Excepcion Grabando Orden de Venta con ID Interno : ' + respuesta.idOV + ' Excepcion : ' + excepcion.message;
            }
            if (error == true) {
                log.error('Grabar Orden de Venta - AfterSubmit', 'Error Grabando Orden de Venta con ID Interno : ' + respuesta.idOV + ' Codigo Error : ' + codigoError + ' Error : ' + mensajeError);
                var objRecord = record.delete({
                    type: record.Type.SALES_ORDER,
                    id: idRecord,
                });
                throw utilities.crearError(codigoError, mensajeError);

            }
            log.audit('Fin Grabar Orden de Venta', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);
        }

        return {
            //beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });

/**
 * @NApiVersion 2.x
 * @NAmdConfig ./configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities',
        '3K/funcionalidadesOV': './3K - Funcionalidades OV',
        '3K/funcionalidadesURU': './3K - Funcionalidades URU'
    }
});*/

define(['N/error', 'N/record', 'N/search', 'N/format', '3K/utilities', '3K/funcionalidadesOV', '3K/funcionalidadesURU'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */

    function (error, record, search, format, utilities, funcionalidades, funcionalidadesURU) {

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

            var respuesta = new Object();
            respuesta.error = false;
            respuesta.detalle = new Array();

            if (scriptContext.type == 'create') {

                try {

                    log.audit('Programa Fidelidad (SS)', 'INICIO - afterSubmit');

                    var recId = scriptContext.newRecord.id;
                    var recType = scriptContext.newRecord.type;

                    log.debug('Programa Fidelidad (SS) - afterSubmit', 'ID Orden de Venta: ' + recId);

                    var objOV = record.load({
                        type: recType,
                        id: recId,
                        isDynamic: true,
                    });

                    var fidelidadOV = objOV.getValue({
                        fieldId: 'custbody_3k_programa_fidelidad'
                    });

                    var servicioOV = objOV.getValue({
                        fieldId: 'custbody_3k_ov_servicio'
                    });

                    var travelOV = objOV.getValue({
                        fieldId: 'custbody_3k_ov_travel'
                    });

                    log.debug('Programa Fidelidad (SS) - afterSubmit', 'servicioOV: ' + servicioOV + ', fidelidadOV: ' + fidelidadOV + ', travelOV: ' + travelOV);

                    //La OV corresponde a Programa de Fidelidad
                    if (fidelidadOV == true) {
                        var fcBanco = crearFactura(recId, 'BANCO');

                        if (servicioOV == true) {
                            var fcCliente = crearFactura(recId, 'CLIENTE');
                            if (travelOV == false) {
                                var generarOC = crearOrdenCompra(objOV);
                            }
                        }

                    }

                } catch (excepcion) {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'UPFD001';
                    respuestaParcial.mensaje += excepcion;
                    respuesta.detalle.push(respuestaParcial);
                    log.error('Programa Fidelidad (SS) - afterSubmit', 'UPFD001 - Excepcion : ' + excepcion);
                }

                log.audit('Programa Fidelidad (SS)', 'FIN - afterSubmit');

            }
        }

        function crearFactura(recId, tipo) {

            var respuesta = new Object();
            respuesta.error = false;
            respuesta.detalle = new Array();
            var arrayFacturas = new Array();

            try {

                log.audit('crearFactura', 'INICIO - Crear Factura ' + tipo);

                var objRecord = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: recId,
                    toType: record.Type.INVOICE,
                    isDynamic: true
                });

                var beforeSubmit = funcionalidadesURU.beforeSubmit('create', objRecord);

                var numLines = objRecord.getLineCount({
                    sublistId: 'item'
                });

                //log.debug('crearFactura', 'Cantidad Lineas OV: ' + numLines);

                for (var i = 0; i < numLines; i++) {

                    var esFidelidad = objRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_programa_fidelidad',
                        line: i
                    });

                    var esRedondeo = objRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_es_redondeo',
                        line: i
                    });

                    if (tipo == 'CLIENTE') {
                        if (esFidelidad || esRedondeo) {
                            objRecord.removeLine({
                                sublistId: 'item',
                                line: i
                            });
                            i--;
                            numLines--;
                        }
                    } else {
                        if (!esFidelidad) {
                            objRecord.removeLine({
                                sublistId: 'item',
                                line: i
                            });
                            i--;
                            numLines--;
                        } else {
                            var clienteFidelidad = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_cl_fact_fidelidad',
                                line: i
                            });
                        }
                    }

                }

                var numLines = objRecord.getLineCount({
                    sublistId: 'item'
                });

                log.debug('crearFactura', 'Cantidad Lineas FC: ' + numLines);


                if (tipo == 'BANCO') {

                    //log.debug('crearFactura', 'clienteFidelidad: ' + clienteFidelidad);

                    objRecord.setValue({
                        fieldId: 'entity',
                        value: clienteFidelidad
                    });

                }

                var saveID = objRecord.save();
                log.debug('crearFactura', 'Registro Factura: ' + saveID);
                var afterSubmit = funcionalidadesURU.afterSubmit('invoice', saveID);

                arrayFacturas.push(saveID);

                var generarCAE = callGenerarCAE(arrayFacturas);

                log.debug('crearFactura', 'generarCAE: ' + generarCAE);

                log.audit('crearFactura', 'FIN - Crear Factura ' + tipo);

            } catch (excepcion) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'UCFC001';
                respuestaParcial.mensaje += excepcion;
                respuesta.detalle.push(respuestaParcial);
                log.error('crearFactura', 'UCFC001 - Excepcion : ' + excepcion);
            }

        }


        function callGenerarCAE(arrayFacturas) {

            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();
            objRespuesta.idFactura = '';
            objRespuesta.carrito = '';
            var arrayRespuesta = new Array();

            log.audit('callGenerarCAE', 'INICIO - Generar CAE ');

            try {

                // INICIO - Consultar Subsidiaria Facturacion Electronica
                var subsidiaria = '';

                var searchConfig = utilities.searchSaved('customsearch_3k_config_sub_fact');

                if (!utilities.isEmpty(searchConfig) && !searchConfig.error) {
                    if (!utilities.isEmpty(searchConfig.objRsponseFunction.result) && searchConfig.objRsponseFunction.result.length > 0) {
                        subsidiaria = searchConfig.objRsponseFunction.result[0].getValue({
                            name: searchConfig.objRsponseFunction.search.columns[1]
                        });

                        log.debug('callGenerarCAE', 'Subsidiaria Facturacion Electronica: ' + subsidiaria);

                        if (utilities.isEmpty(subsidiaria)) {
                            objRespuestaN.error = true;
                            var mensaje = 'No se encuentra configurada la siguiente informacion del panel de configuracion de Subsidiaria Facturacion : ';
                            if (utilities.isEmpty(subsidiaria)) {
                                mensaje = mensaje + ' Subsidiaria / ';
                            }

                            objRespuestaParcial = new Object();
                            objRespuestaParcial.codigo = 'UCGC002';
                            objRespuestaParcial.mensaje = mensaje;
                            objRespuestaN.detalle.push(objRespuestaParcial);
                            /*log.error('UCGC002', mensaje);
                            return JSON.stringify(objRespuesta);*/
                            arrayRespuesta.push(objRespuestaN);
                            //continue;
                        }
                    } else {
                        objRespuestaN.error = true;
                        var mensaje = 'No se encuentra realizada la configuracion de Subsidiaria Facturacion : ';

                        objRespuestaParcial = new Object();
                        objRespuestaParcial.codigo = 'UCGC003';
                        objRespuestaParcial.mensaje = mensaje;
                        objRespuestaN.detalle.push(objRespuestaParcial);
                        /*log.error('UCGC003', mensaje);
                        return JSON.stringify(objRespuesta);*/
                        arrayRespuesta.push(objRespuestaN);
                        //continue;
                    }
                } else {
                    objRespuestaN.error = true;
                    var mensaje = 'Error Consultando Configuracion de Subsidiaria de Facturacion - Tipo Error : ' + searchConfig.tipoError + ' - Descripcion : ' + searchConfig.descripcion;

                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'UCGC004';
                    objRespuestaParcial.mensaje = mensaje;
                    objRespuestaN.detalle.push(objRespuestaParcial);
                    /*log.error('UCGC004', mensaje);
                    return JSON.stringify(objRespuesta);*/
                    arrayRespuesta.push(objRespuestaN);
                    //continue;
                }


                objRespuesta.resultCae = funcionalidades.generarCAE(arrayFacturas, subsidiaria);

                //log.debug('callGenerarCAE', 'objRespuesta.resultCae: ' + JSON.stringify(objRespuesta.resultCae));

                if (objRespuesta.resultCae.error) {
                    //return objRespuesta.resultCae;
                    //objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = objRespuesta.resultCae.codigo;
                    objRespuestaParcial.mensaje = objRespuesta.resultCae.mensaje;
                    //objRespuesta.detalle.push(objRespuestaParcial);

                    if (arrayRespuesta.length > 0) {
                        for (var qq = 0; qq < arrayRespuesta.length; qq++) {
                            arrayRespuesta[qq].error = true;
                            arrayRespuesta[qq].detalle.push(objRespuestaParcial);
                        }
                    } else {
                        var objetoRespuestaN = new Object();
                        objetoRespuestaN.error = true;
                        objetoRespuestaN.idFactura = '';
                        objetoRespuestaN.idCarrito = '';
                        objetoRespuestaN.detalle = new Array();
                        objetoRespuestaN.detalle.push(objRespuestaParcial);
                        arrayRespuesta.push(objetoRespuestaN);
                    }
                }


            } catch (excepcion) {
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'UCGC001';
                objRespuestaParcial.mensaje = 'function doPost: ' + e.message;
                //objRespuesta.detalle.push(objRespuestaParcial);
                //objRespuesta.tipoError = 'RFAC002';
                //objRespuesta.descripcion = 'function doPost: ' + e.message;
                log.error('UCGC001', 'funtion doPost: ' + e.message + ' request:' + JSON.stringify(objOrden));

                if (arrayRespuesta.length > 0) {
                    for (var qq = 0; qq < arrayRespuesta.length; qq++) {
                        arrayRespuesta[qq].error = true;
                        arrayRespuesta[qq].detalle.push(objRespuestaParcial);
                    }
                } else {
                    var objetoRespuestaN = new Object();
                    objetoRespuestaN.error = true;
                    objetoRespuestaN.idFactura = '';
                    objetoRespuestaN.idCarrito = '';
                    objetoRespuestaN.detalle = new Array();
                    objetoRespuestaN.detalle.push(objRespuestaParcial);
                    arrayRespuesta.push(objetoRespuestaN);
                }

                //arrayRespuesta.push(objRespuesta);
                return JSON.stringify(arrayRespuesta);
            }

            log.audit('callGenerarCAE', 'FIN - Generar CAE ');

        }

        function crearOrdenCompra(objOV) {

            var respuesta = new Object();
            respuesta.error = false;
            respuesta.detalle = new Array();

            try {

                log.audit('crearOrdenCompra', 'INICIO - Crear Orden de Compra');

                //Consultar Configuracion Liquidaciones - TASA ARTICULO LIQUIDACION

                var searchConfigLiq = utilities.searchSaved('customsearch_3k_config_liquidaciones');

                if (!utilities.isEmpty(searchConfigLiq) && searchConfigLiq.error == false) {
                    if (!utilities.isEmpty(searchConfigLiq.objRsponseFunction.result) && searchConfigLiq.objRsponseFunction.result.length > 0) {

                        var resultSet = searchConfigLiq.objRsponseFunction.result;
                        var resultSearch = searchConfigLiq.objRsponseFunction.search;

                        var tasaArticuloLiq = '';

                        for (var i = 0; !utilities.isEmpty(resultSet) && i < resultSet.length; i++) {
                            tasaArticuloLiq = resultSet[i].getValue({
                                name: resultSearch.columns[15]
                            });
                        }

                        if (!utilities.isEmpty(tasaArticuloLiq)) {
                            tasaArticuloLiq = (parseFloat(tasaArticuloLiq, 10));
                        }
                    } else {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'UCOV020';
                        respuestaParcial.mensaje = 'Error Consultando Configuracion Liquidaciones.';
                        respuesta.detalle.push(respuestaParcial);
                    }
                } else {
                    if (utilities.isEmpty(searchConfigLiq)) {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'UCOV020';
                        respuestaParcial.mensaje = 'Error Consultando Configuracion Liquidaciones.';
                        respuesta.detalle.push(respuestaParcial);
                    } else {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'UCOV020';
                        respuestaParcial.mensaje = 'Error Consultando Configuracion Liquidaciones - Tipo Error : ' + searchConfigProg.tipoError + ' - Descripcion : ' + searchConfigProg.descripcion;
                        respuesta.detalle.push(respuestaParcial);
                    }
                }

                var idMoneda = objOV.getValue({
                    fieldId: 'currency'
                });

                var numLines = objOV.getLineCount({
                    sublistId: 'item'
                });

                //log.debug('crearOrdenCompra', 'Cantidad Lineas OV: ' + numLines);

                for (var i = 0; i < numLines; i++) {

                    var impTotalOC = 0;
                    var impFacturarMillas = 0;
                    var deudaPagarMillas = 0;
                    var deudaPagarServicio = 0;

                    var lineUniqueKey = objOV.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'lineuniquekey',
                        line: i
                    });

                    var desServicio = objOV.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'description',
                        line: i
                    });

                    deudaPagarServicio = objOV.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_deuda_pagar',
                        line: i
                    });

                    deudaPagarMillas = objOV.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_deuda_pagar_millas',
                        line: i
                    });

                    log.debug('crearOrdenCompra', 'deudaPagarServicio: ' + deudaPagarServicio + ', deudaPagarMillas: ' + deudaPagarMillas);

                    if (!utilities.isEmpty(deudaPagarServicio) && deudaPagarServicio > 0 && !utilities.isEmpty(deudaPagarMillas) && deudaPagarMillas > 0) {
                        impTotalOC = parseFloat(deudaPagarServicio, 10) + parseFloat(deudaPagarMillas, 10);
                    }

                    var provLiquidacion = objOV.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_proveedor_liquidacion',
                        line: i
                    });

                    var esFidelidad = objOV.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_programa_fidelidad',
                        line: i
                    });

                    var idItem = '312235';

                    if (!esFidelidad && !utilities.isEmpty(impTotalOC) && impTotalOC) {
                        // INICIO GENERAR ORDEN DE COMPRA
                        // Setear Campos Cabecera
                        var registroOC = record.create({
                            type: 'purchaseorder',
                            isDynamic: true
                        });

                        registroOC.setValue({
                            fieldId: 'custbody_3k_ulid_servicios',
                            value: lineUniqueKey
                        });

                        registroOC.setValue({
                            fieldId: 'currency',
                            value: idMoneda
                        });

                        registroOC.setValue({
                            fieldId: 'entity',
                            value: provLiquidacion
                        });

                        //Inicio Agregar Linea Item Generico
                        registroOC.selectNewLine({
                            sublistId: 'item'
                        });

                        registroOC.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: idItem
                        });

                        registroOC.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            value: desServicio
                        });

                        registroOC.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: impTotalOC
                        });

                        registroOC.commitLine({
                            sublistId: 'item'
                        });
                        //Fin Agregar Linea Item Generico

                        idOrdenCompra = registroOC.save();

                        log.debug('crearOrdenCompra', 'ID Orden de Compra: ' + idOrdenCompra);
                        // FIN GENERAR ORDEN DE COMPRA

                    }

                }

            } catch (excepcion) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'UCOC001';
                respuestaParcial.mensaje += excepcion;
                respuesta.detalle.push(respuestaParcial);
                log.error('crearOrdenCompra', 'UCOC001 - Excepcion : ' + excepcion);
            }

            log.audit('crearOrdenCompra', 'FIN - Crear Orden de Compra');
        }


        return {
            afterSubmit: afterSubmit
        };

    });


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

        function doPost(requestBody) {

            log.audit('doPost', 'INCIO CAMBIO CUPONES');
            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.msj = "";
            objRespuesta.idCuponesUpdated = [];
            objRespuesta.idDevOv = [];
            objRespuesta.detalle = new Array();
            var fechaUso = null;

            try {

                if (!utilities.isEmpty(requestBody)) {

                    informacion = JSON.parse(requestBody);

                    for (var i = 0; i < informacion.length; i++) {
                        var objJSON = new Object({});

                        objJSON = informacion[i];
                        //busqueda de todos los cupones que no tienen estado consumido
                        var arrayParam = [];
                        var objParam = new Object({});
                        objParam.name = 'internalid';
                        objParam.operator = 'IS';
                        objParam.values = [objJSON.idCupon];
                        arrayParam.push(objParam);

                        var result = utilities.searchSavedPro('customsearch_3k_cupones_no_consumidos', arrayParam);
                        if (result.error) {
                            return JSON.stringify(result);
                        }
                        var arregloBusqueda = result.objRsponseFunction.array;

                        //busqueda de la configuracion de cupones para saber que estado tomar´para devoluciones

                        /*var arrayFilter = arregloBusqueda.filter(function(ob) {
                            return (ob.internalid == objJSON.idCupon);
                        });*/

                        log.debug('doPost', 'arregloBusqueda: ' + JSON.stringify(arregloBusqueda));

                        if (!utilities.isEmpty(arregloBusqueda) && arregloBusqueda.length > 0) {

                            if (!utilities.isEmpty(objJSON.tipoOperacion)) {

                                var arrayParam = [];
                                var objParam = new Object({});
                                objParam.name = 'custrecord_3k_estado_cupon_cod_acc';
                                objParam.operator = 'IS';
                                objParam.values = [objJSON.tipoOperacion];
                                arrayParam.push(objParam);

                                var resultEstados = utilities.searchSavedPro('customsearch_3k_estado_cupon_cod_accion', arrayParam);
                                if (resultEstados.error) {
                                    return JSON.stringify(resultEstados);
                                }
                                var configSearch = resultEstados.objRsponseFunction.array;

                                //log.debug('doPost', 'configSearch: ' + JSON.stringify(configSearch));

                                switch (objJSON.tipoOperacion) {
                                    case "NE":
                                        break;

                                    case "RP":
                                        var obj = devolverCupon(objJSON, arregloBusqueda);
                                        if (obj.error)
                                            return JSON.stringify(obj);

                                        objRespuesta.idDevOv.push(obj.idDevOv);
                                        break;

                                    case "RC":
                                        var obj = devolverCupon(objJSON, arregloBusqueda);
                                        if (obj.error)
                                            return JSON.stringify(obj);

                                        objRespuesta.idDevOv.push(obj.idDevOv);
                                        break;
                                    case "UR":

                                        break;
                                    case "CC":

                                        log.debug('doPost', 'ENTRO CC');

                                        var obj = devolverCupon(objJSON, arregloBusqueda);
                                        if (obj.error)
                                            return JSON.stringify(obj);

                                        objRespuesta.idDevOv.push(obj.idDevOv);

                                        break;

                                    case "US":

                                        var fechaUso = format.parse({
                                            value: objJSON.fechaUso,
                                            type: format.Type.DATETIME,
                                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                                        });

                                        log.debug('doPost', 'fechaUso: ' + JSON.stringify(fechaUso));
                                        log.debug('doPost', 'objJSON.fechaUso: ' + JSON.stringify(objJSON.fechaUso))

                                        break;
                                    case "DE":
                                        var obj = devolverCupon(objJSON, arregloBusqueda);
                                        if (obj.error)
                                            return JSON.stringify(obj);

                                        objRespuesta.idDevOv.push(obj.idDevOv);

                                        break;
                                    case "DC":
                                        var obj = devolverCupon(objJSON, arregloBusqueda);
                                        if (obj.error)
                                            return JSON.stringify(obj);

                                        objRespuesta.idDevOv.push(obj.idDevOv);

                                        break;
                                    case "UN":

                                        break;
                                    case "ID":

                                        break;
                                    case "RS":

                                        break;
                                    case "RR":

                                        break;
                                    case "DT":
                                        var obj = devolverCupon(objJSON, arregloBusqueda);
                                        if (obj.error)
                                            return JSON.stringify(obj);

                                        objRespuesta.idDevOv.push(obj.idDevOv);
                                        break;

                                    case "RA":

                                        break;

                                    case "AC":

                                        break;

                                    default:
                                        objRespuesta.error = true;
                                        objRespuestaParcial = new Object();
                                        objRespuestaParcial.codigo = 'RCAM004';
                                        objRespuestaParcial.mensaje = 'Tipo Operación desconocida';
                                        objRespuesta.detalle.push(objRespuestaParcial);
                                        //objRespuesta.tipoError = "RCAM004";
                                        //objRespuesta.msj = "Tipo Operación desconocida";
                                        log.error('RCAM004', "Tipo Operación desconocida");
                                        break;
                                }
                            }




                            var idUpdated = record.submitFields({
                                type: 'customrecord_3k_cupones',
                                id: arregloBusqueda[0].internalid,
                                values: {
                                    custrecord_3k_cupon_estado: configSearch[0].internalid,
                                    custrecord_3k_cupon_motivo: objJSON.motivo, // objJSON[""]
                                    //custrecord_3k_cupon_tipo_devolucion: objJSON.tipoDevolucion,
                                    custrecord_3k_cupon_cod_acc: configSearch[0].custrecord_3k_estado_cupon_cod_acc,
                                    custrecord_3k_cupon_fecha_uso_str: objJSON.fechaUso
                                },
                                options: {
                                    ignoreFieldChange: false,
                                    fireSlavingSync: true,
                                    disabletriggers: true
                                }
                            });


                            objRespuesta.idCuponesUpdated.push(idUpdated);

                        } else {
                            objRespuesta.error = true;
                            objRespuestaParcial = new Object();
                            objRespuestaParcial.codigo = 'RCAM003';
                            objRespuestaParcial.mensaje = 'El cupon: ' + objJSON.idCupon + ' enviado no se encuentra disponible para realizar devolución';
                            objRespuesta.detalle.push(objRespuestaParcial);
                            //objRespuesta.tipoError = "RCAM003";
                            //objRespuesta.msj = 'El cupon: ' + objJSON.idCupon + ' enviado no se encuentra disponible para realizar devolución';
                            log.error('RCAM003', 'El cupon: ' + objJSON.idCupon + ' enviado no se encuentra disponible para realizar devolución');
                        }
                    }
                } else {
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'RCAM001';
                    objRespuestaParcial.mensaje = "Parametro JSON no tiene infromación";
                    objRespuesta.detalle.push(objRespuestaParcial);
                    //objRespuesta.tipoError = "RCAM001";
                    //objRespuesta.msj = "Parametro JSON no tiene infromación";
                    log.error('RCAM001', 'Cambio Cupones doPost: Parametro JSON no tiene información');
                }

            } catch (e) {
                objRespuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = "RCAM002";
                objRespuestaParcial.mensaje = "Excepción: " + e;
                objRespuesta.detalle.push(objRespuestaParcial);
                //objRespuesta.tipoError = "RCAM002";
                //objRespuesta.msj = "Excepción: " + e;
                log.error('RCAM002', 'Cambio Cupones doPost Excepción: ' + e);
            }
            log.audit('doPost', 'FIN CAMBIO CUPONES');
            return JSON.stringify(objRespuesta);

        }

        function devolverCupon(json, filter) {
            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.msj = "";
            objRespuesta.detalle = new Array();
            try {
                //log.debug('devolverCupon', 'filter[0].custrecord_3k_cupon_ord_venta: ' + filter[0].custrecord_3k_cupon_ord_venta);
                var objFieldLookUpRecord = search.lookupFields({
                    type: 'customrecord_3k_cupones',
                    id: json.idCupon,
                    columns: ['custrecord_3k_cupon_estado']
                });

                log.debug('devolverCupon', 'objFieldLookUpRecord ' + JSON.stringify(objFieldLookUpRecord));
                var estadoCupon = objFieldLookUpRecord.custrecord_3k_cupon_estado[0].value;

                log.debug('modificar cupones', 'estadoCupon: ' + estadoCupon);

                if (estadoCupon != '2') {

                    var objRecord = record.load({
                        type: record.Type.SALES_ORDER,
                        id: filter[0].custrecord_3k_cupon_ord_venta,
                        isDynamic: true,
                    });

                    var totalEnvio = objRecord.getValue({
                        fieldId: 'custbody_3k_total_envio'
                    });

                    var ob = modificarOV(objRecord, filter[0].custrecord_3k_cupon_id_orden);
                    if (ob.error) {
                        return ob;
                    }

                    objRecord = ob;

                    var idRec = objRecord.save();
                    objRespuesta.idDevOv = idRec;

                    var objRecord = record.load({
                        type: record.Type.SALES_ORDER,
                        id: idRec,
                        isDynamic: true,
                    });

                    var numeroLineas = objRecord.getLineCount({
                        sublistId: 'item'
                    });

                    var lineaSinCerrar = false;
                    var lineaRedondeo = false;
                    var ovCerrada = true;

                    for (var i = 0; i < numeroLineas; i++) {

                        var estaCerrada = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'isclosed',
                            line: i
                        });

                        var esRedondeo = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_es_redondeo',
                            line: i
                        });

                        if (!estaCerrada && !esRedondeo) {
                            lineaSinCerrar = true;
                        }

                        if (esRedondeo && !estaCerrada) {
                            lineaRedondeo = true;
                        }

                        if (!estaCerrada) {
                            ovCerrada = false;
                        }
                    }
                    var ajustarPorRedondeo = true;
                    if (!ovCerrada) {
                        var newTotalEnvio = objRecord.getValue({
                            fieldId: 'custbody_3k_total_envio'
                        });

                        var importeEnvioResta = parseFloat(totalEnvio, 10) - parseFloat(newTotalEnvio, 10);

                        var lineNumber = objRecord.findSublistLineWithValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_id_orden',
                            value: filter[0].custrecord_3k_cupon_id_orden
                        });

                        var importeEnvioCC = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_importe_envio_cc',
                            line: lineNumber
                        });

                        if (utilities.isEmpty(importeEnvioCC)) {
                            importeEnvioCC = 0.00;
                        }

                        var newImporteEnvioCC = parseFloat(importeEnvioCC, 10) + parseFloat(importeEnvioResta, 10);

                        objRecord.selectLine({
                            sublistId: 'item',
                            line: lineNumber
                        });

                        var isclosed = objRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'isclosed'
                        });



                        if (!isclosed) {

                            objRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_importe_envio_cc',
                                value: newImporteEnvioCC.toFixed(2).toString()
                            });

                        }

                        objRecord.commitLine({
                            sublistId: 'item'
                        });

                        if (!lineaSinCerrar && lineaRedondeo) {

                            for (var j = 0; j < numeroLineas; j++) {

                                var esRedondeo = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_es_redondeo',
                                    line: j
                                });

                                if (esRedondeo) {

                                    objRecord.selectLine({
                                        sublistId: 'item',
                                        line: j
                                    });

                                    objRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'isclosed',
                                        value: true
                                    });

                                    objRecord.commitLine({
                                        sublistId: 'item'
                                    });

                                    ajustarPorRedondeo = false;


                                }

                            }

                            //objRecord.save();
                        }


                    }


                    objRecord.save();

                    /*var objFieldLookUpRecord = search.lookupFields({
                        type: record.Type.SALES_ORDER,
                        id: idRec,
                        columns: ['status']
                    });
                    var statusOV = objFieldLookUpRecord.status[0].value;

                    log.debug('modificar cupones', 'statusOV: ' + statusOV);*/

                    //if (statusOV != 'closed' && statusOV != 'fullyBilled') {
                    if (ajustarPorRedondeo && !ovCerrada) {
                        // INICIO GENERAR AJUSTE POR REDONDEO
                        var respuestaAjusteRedondeo = funcionalidades.generarAjusteRedondeo(idRec, null);
                        // FIN GENERAR AJUSTE POR REDONDEO

                        if (respuestaAjusteRedondeo.error) {
                            return respuestaAjusteRedondeo;
                        }
                    }

                }


                //                }

            } catch (e) {
                objRespuesta.error = true;
                //objRespuesta.tipoError = "RCAM005";
                //objRespuesta.msj = 'Cambio Cupones devolverCupon Excepción: ' + e;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'RCAM005';
                objRespuestaParcial.mensaje = 'Cambio Cupones devolverCupon Excepción: ' + e;
                objRespuesta.detalle.push(objRespuestaParcial);
                log.error('RCAM005', 'Cambio Cupones devolverCupon Excepción: ' + e);
            }

            return objRespuesta;

        }

        /*function devolverCupon(json, filter) {
            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.msj = "";
            objRespuesta.detalle = new Array();
            var arrayDetalleOV = [];
            var objDetalleOV = new Object({});
            try {

                var objRecord = record.load({
                    type: record.Type.SALES_ORDER,
                    id: filter[0].custrecord_3k_cupon_ord_venta,
                    isDynamic: true,
                });

                json.ubicacion = objRecord.getValue({
                    fieldId: 'location'
                });

                json.sitio = objRecord.getValue({
                    fieldId: 'custbody_cseg_3k_sitio_web'
                });

                objDetalleOV.idDetalleOV = filter[0].custrecord_3k_cupon_id_orden;
                arrayDetalleOV.push(objDetalleOV);

                var ob = funcionalidades.closedLinesOV(objRecord, arrayDetalleOV);
                                if (ob.error) {
                                    return ob;
                                }
                objRecord = ob;

                var ob = modificarOV(objRecord, filter[0].custrecord_3k_cupon_id_orden);
                if (ob.error) {
                    return ob;
                }

                objRecord = ob;

                var respuesta = funcionalidades.crearOrdenVenta(objRecord, json, json.tipoOperacion);
                if (respuesta.error) {
                    return respuesta;
                }


            } catch (e) {
                objRespuesta.error = true;
                objRespuestaParcial = new Object({});
                objRespuestaParcial.codigo = 'RCAM006';
                objRespuestaParcial.mensaje = 'Cambio Cupones changeCupon Excepción: ' + e;
                objRespuesta.detalle.push(objRespuestaParcial);
                //objRespuesta.tipoError = "RCAM006";
                //objRespuesta.msj = 'Cambio Cupones changeCupon Excepción: ' + e;
                log.error('RCAM006', 'Cambio Cupones changeCupon Excepción: ' + e);
            }

            if (!objRespuesta.error) {
                objRespuesta.idDevOv = filter[0].custrecord_3k_cupon_ord_venta;
                return objRespuesta;
            } else {
                return objRespuesta;
            }
            return objRespuesta;
        }*/

        function modificarOV(objRecord, idOV) {

            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.msj = "";
            objRespuesta.detalle = new Array();

            try {

                /****************************INCIO MODIFICAR CANTIDAD DE LA OV ***************************************/
                //log.debug('devolverCupon', 'filter[0].custrecord_3k_cupon_id_orden: ' + filter[0].custrecord_3k_cupon_id_orden);
                var shippingCost = objRecord.getValue({
                    fieldId: 'shippingcost'
                });

                var lineNumber = objRecord.findSublistLineWithValue({
                    sublistId: 'item',
                    fieldId: 'custcol_3k_id_orden',
                    value: idOV
                });

                var cantidad = objRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: lineNumber
                });

                var importeEnvio = objRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_3k_imp_envio',
                    line: lineNumber
                });

                var importeCalculadoWoow = objRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_3k_importe_calculado_cc',
                    line: lineNumber
                });

                var importeUnitarioWoow = objRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_3k_importe_unitario_woow',
                    line: lineNumber
                });

                var voucher = objRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_3k_voucher',
                    line: lineNumber
                });

                if (!utilities.isEmpty(voucher)) {

                    var importeVoucher = objRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_importe_voucher',
                        line: lineNumber
                    });

                    var accionVoucher = objRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_cod_accion_voucher',
                        line: lineNumber
                    });

                    var importeUnitarioVoucher = (parseFloat(importeVoucher, 10) / cantidad);

                    var newImporteVoucher = (parseFloat(importeVoucher, 10) - parseFloat(importeUnitarioVoucher));

                    log.debug('CC', 'voucher: ' + voucher);
                    log.debug('CC', 'importeUnitarioVoucher: ' + importeUnitarioVoucher);
                    log.debug('CC', 'newImporteVoucher: ' + newImporteVoucher);

                }

                /*var importeTotalEnvio = objRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_3k_importe_unitario_woow',
                    line: lineNumber
                });*/



                if (utilities.isEmpty(importeCalculadoWoow) || isNaN(parseFloat(importeCalculadoWoow, 10))) {

                    importeCalculadoWoow = 0.00;
                }

                importeCalculadoWoow = parseFloat(importeCalculadoWoow, 10) + parseFloat(importeUnitarioWoow, 10);


                var proporcionalImporteEnvio = (parseFloat(importeEnvio) / cantidad);
                //log.debug('devolverCupon', 'cantidad antes de resta: ' + cantidad);
                cantidad = cantidad - 1;
                //log.debug('devolverCupon', 'cantidad despues de resta: ' + cantidad);
                var newImporteEnvio = (parseFloat(importeEnvio) - parseFloat(proporcionalImporteEnvio));

                var newShippingCost = 0;

                var lineNum = objRecord.selectLine({
                    sublistId: 'item',
                    line: lineNumber
                });

                var restarImporteVoucher = false;

                if (cantidad > 0) {

                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: cantidad,
                        ignoreFieldChange: false
                    });

                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_cantidad_ov',
                        value: cantidad,
                        ignoreFieldChange: false
                    });

                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_imp_envio',
                        value: parseFloat(newImporteEnvio, 10).toFixed(2).toString(),
                        ignoreFieldChange: false
                    });

                    newShippingCost = (parseFloat(shippingCost) - parseFloat(proporcionalImporteEnvio));

                    objRecord.setValue({
                        fieldId: 'shippingcost',
                        value: parseFloat(newShippingCost, 10).toFixed(2).toString()
                    });

                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_importe_calculado_cc',
                        value: importeCalculadoWoow.toFixed(2).toString(),
                        ignoreFieldChange: false
                    });

                    if (!utilities.isEmpty(voucher) && !utilities.isEmpty(importeVoucher)) {

                        objRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_importe_voucher',
                            value: newImporteVoucher.toFixed(2).toString(),
                            ignoreFieldChange: false
                        });

                    }

                    restarImporteVoucher = true;



                } else {

                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'isclosed',
                        value: true,
                        ignoreFieldChange: false
                    });

                    /*objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'grossamt',
                        value: '0',
                        ignoreFieldChange: false
                    });*/

                    /*newShippingCost = (parseFloat(shippingCost) - parseFloat(importeEnvio));

                    objRecord.setValue({
                        fieldId: 'shippingcost',
                        value: parseFloat(newShippingCost, 10).toFixed(2).toString()
                    });*/
                }

                objRecord.commitLine({
                    sublistId: 'item'
                });


                if (restarImporteVoucher) {

                    if (!utilities.isEmpty(voucher) && !utilities.isEmpty(importeVoucher)) {

                        log.debug('CC', 'accionVoucher: ' + accionVoucher);

                        if (!utilities.isEmpty(accionVoucher) && accionVoucher == '1') {

                            var lineasOV = objRecord.getLineCount({
                                sublistId: 'item'
                            });

                            for (var ii = 0; ii < lineasOV; ii++) {

                                var isVoucher = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_linea_voucher',
                                    line: ii
                                });

                                var IDVoucher = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_voucher',
                                    line: ii
                                });

                                /*var lineVoucher = objRecord.findSublistLineWithValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_voucher',
                                    value: voucher
                                });*/

                                if (isVoucher && IDVoucher == voucher) {

                                    log.debug('CC', 'lineVoucher: ' + ii);

                                    //if (!utilities.isEmpty(lineVoucher)) {

                                    objRecord.selectLine({
                                        sublistId: 'item',
                                        line: ii
                                    });



                                    var importeVoucherNegativo = Math.abs(newImporteVoucher) * (-1);

                                    log.debug('CC', 'importeVoucherNegativo: ' + importeVoucherNegativo);

                                    objRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_importe_voucher',
                                        value: newImporteVoucher.toFixed(2).toString()
                                    });

                                    objRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'grossamt',
                                        value: importeVoucherNegativo.toString()
                                    });

                                    var amount = objRecord.getCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'amount'
                                    });

                                    objRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'rate',
                                        value: amount.toString()
                                    });

                                    /*objRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'rate',
                                        value: newImporteVoucher.toFixed(2).toString()
                                    });*/

                                    objRecord.commitLine({
                                        sublistId: 'item'
                                    });

                                    var objFieldLookUp = search.lookupFields({
                                        type: 'customrecord_3k_vouchers',
                                        id: voucher,
                                        columns: [
                                            'custrecord_3k_vouchers_orden', 'custrecord_3k_vouchers_cosumido'
                                        ]
                                    });

                                    var arrayOrdenes = objFieldLookUp["custrecord_3k_vouchers_orden"];
                                    var stockConsumido = objFieldLookUp["custrecord_3k_vouchers_cosumido"];


                                    var stockConsumidoFinal = parseFloat(stockConsumido) - parseFloat(importeUnitarioVoucher);

                                    try {
                                        var idRecordVoucher = record.submitFields({
                                            type: 'customrecord_3k_vouchers',
                                            id: voucher,
                                            values: {
                                                custrecord_3k_vouchers_cosumido: stockConsumidoFinal
                                            },
                                            options: {
                                                enableSourcing: true,
                                                ignoreMandatoryFields: false
                                            }
                                        });
                                        if (utilities.isEmpty(idRecordVoucher)) {
                                            objRespuesta.error = true;
                                            respuestaParcial = new Object({});
                                            respuestaParcial.codigo = 'RCAM007';
                                            respuestaParcial.mensaje = 'Error Recalculando importe Voucher con ID Interno : ' + voucher + ' No se recibio ID de Respuesta de Actualizacion';
                                            objRespuesta.detalle.push(respuestaParcial);
                                        }
                                    } catch (excepcionVoucher) {
                                        objRespuesta.error = true;
                                        respuestaParcial = new Object({});
                                        respuestaParcial.codigo = 'RCAM008';
                                        respuestaParcial.mensaje = 'Excepcion Recalculando importe de Voucher con ID Interno : ' + voucher + ' - Excepcion : ' + excepcionVoucher.message.toString();
                                        objRespuesta.detalle.push(respuestaParcial);
                                    }
                                    break;

                                    //}
                                } // END IF isVoucher && voucher == IDVocuher
                            } // END FOR ii
                        } // END IF ACCION VOUCHER
                    }
                }

                /****************************FIN MODIFICAR CANTIDAD DE LA OV ***************************************/

                /****************************INCIO MODIFICAR CANTIDAD DE LA REQUISICIONES QUE NO TENGAN ORDEN DE COMPRA ***************************************/
                var numLines = objRecord.getLineCount({
                    sublistId: 'recmachcustrecord_3k_req_compra_ov'
                });

                //log.debug('devolverCupon', 'requi numlines: ' + numLines);

                for (var i = 0; i < numLines; i++) {

                    var id_OV = objRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                        fieldId: 'custrecord_3k_req_compra_id_det_orden',
                        line: i
                    });

                    var id_OC = objRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                        fieldId: 'custrecord_3k_req_compra_oc',
                        line: i
                    });

                    //log.debug('devolverCupon', 'id_OV: ' + id_OV + ' id_OC: ' + id_OC);

                    if (id_OV == idOV && utilities.isEmpty(id_OC)) {
                        var cantidadMultiplica = objRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_cantidad',
                            line: i
                        });

                        var cantidadComponente = objRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_cant_comp',
                            line: i
                        });

                        lineNum = objRecord.selectLine({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            line: i
                        });
                        //log.debug('devolverCupon', 'cantidadMultiplica: ' + cantidadMultiplica);
                        //log.debug('devolverCupon', 'cantidadComponente: ' + cantidadComponente);
                        var cantidadNueva = (parseInt(cantidadMultiplica) - parseInt(cantidadComponente));
                        //log.debug('devolverCupon', 'cantidadNueva: ' + cantidadNueva);

                        if (cantidadNueva > 0) {
                            objRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                fieldId: 'custrecord_3k_req_compra_cantidad',
                                value: cantidadNueva

                            });
                        }

                        objRecord.commitLine({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov'
                        });

                    }
                }

                return objRecord;

            } catch (e) {
                objRespuesta.error = true;
                objRespuestaParcial = new Object({});
                objRespuestaParcial.codigo = 'RCAM006';
                objRespuestaParcial.mensaje = 'Cambio Cupones modificarOV Excepción: ' + e;
                objRespuesta.detalle.push(objRespuestaParcial);
                //objRespuesta.tipoError = "RCAM006";
                //objRespuesta.msj = 'Cambio Cupones modificarOV Excepción: ' + e;
                log.error('RCAM006', 'Cambio Cupones modificarOV Excepción: ' + e);
                return objRespuesta;
            }
        }


        return {
            post: doPost
        };
    });

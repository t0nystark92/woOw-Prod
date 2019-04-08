/**
 * @NApiVersion 2.0
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NModuleScope Public
 */
/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/

define(['N/error', 'N/search', 'N/record', 'N/format', 'N/task', 'N/http', 'N/runtime', '3K/utilities'],

    function (error, search, record, format, task, http, runtime, utilities) {

        function afterSubmitOV(idOV) {

            log.audit('Generación Orden de Venta - After Submit', 'INICIO Proceso - ID Orden de Venta : ' + idOV);

            var importeTotalOrdenDeVenta = 0.00;
            var importeTotalVouchers = 0.00;
            var clienteOrdenDeVenta = '';

            var respuesta = new Object();
            respuesta.idOV = '';
            respuesta.ordenes = new Array();
            respuesta.error = false;
            respuesta.detalle = new Array();
            respuesta.cupones = new Array();

            var arrayVoucher = new Array();
            var arrayVoucherLinea = new Array();
            var arrayDetalleLineas = new Array();
            var arrayOrdenesResp = new Array();
            var arrayInformacionOV = new Array();

            var arrayDiasNoLaborables = new Array();

            /*respuesta.error = true;
            respuestaParcial = new Object();
            respuestaParcial.codigo = 'SROV018';
            respuestaParcial.mensaje = 'Error TEST';
            respuesta.detalle.push(respuestaParcial);

            return respuesta;*/

            try {

                /******************************* INICIO  DE TRANSFORMAR FECHA EN FORMATO DE URU Y FORMATO NETSUITE****************************************************/
                var fechaServidor = new Date();

                var fechaString = format.format({
                    value: fechaServidor,
                    type: format.Type.DATETIME,
                    timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                });

                var fecha = format.parse({
                    value: fechaString,
                    type: format.Type.DATE
                });

                /******************************* FIN DE TRANSFORMAR FECHA EN FORMATO DE URU Y FORMATO NETSUITE****************************************************/

                // INICIO - Obtener Array de Dias No Laborable

                var respDiasNoLab = consultarDiasNoLoborables();


                if (!utilities.isEmpty(respDiasNoLab) && respDiasNoLab.error == false && respDiasNoLab.arrayDiasNoLaborables.length > 0) {
                    arrayDiasNoLaborables = respDiasNoLab.arrayDiasNoLaborables;
                } else {
                    if (utilities.isEmpty(respDiasNoLab)) {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'SROV018';
                        respuestaParcial.mensaje = 'Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de la Consulta de Dias No Laborables';
                        respuesta.detalle.push(respuestaParcial);
                    } else {
                        if (respDiasNoLab.error == true) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SROV018';
                            respuestaParcial.mensaje = 'Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - Error : ' + respDiasNoLab.tipoError + ' - Descripcion : ' + respDiasNoLab.mensaje;
                            respuesta.detalle.push(respuestaParcial);
                        } else {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SROV018';
                            respuestaParcial.mensaje = 'Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de Array con Dias No Laborables';
                            respuesta.detalle.push(respuestaParcial);
                        }
                    }
                    return respuesta;
                }

                var objResultSet = utilities.searchSaved('customsearch_3k_calendario_dias_no_lab');
                if (objResultSet.error) {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SROV018';
                    respuestaParcial.mensaje = 'Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - Tipo Error : ' + objResultSet.tipoError + ' - Descripcion : ' + objResultSet.descripcion;
                    respuesta.detalle.push(respuestaParcial);
                    return respuesta;
                }

                var resultSet = objResultSet.objRsponseFunction.result;
                var resultSearch = objResultSet.objRsponseFunction.search;

                for (var l = 0; !utilities.isEmpty(resultSet) && l < resultSet.length; l++) {

                    var obj = new Object();
                    obj.indice = l;
                    obj.idInterno = resultSet[l].getValue({
                        name: resultSearch.columns[0]
                    });
                    obj.nombre = resultSet[l].getValue({
                        name: resultSearch.columns[1]
                    });
                    obj.fecha = resultSet[l].getValue({
                        name: resultSearch.columns[2]
                    });

                    if (!utilities.isEmpty(obj.fecha)) {
                        obj.fecha = format.parse({
                            value: obj.fecha,
                            type: format.Type.DATE,
                        });
                    }

                    arrayDiasNoLaborables.push(obj);
                }

                // FIN - Obtener Array de Dias No Laborables

                // INICIO - Obtener Dias Pedidos Proveedores
                var arrayDiasPedidoProveedor = new Array();

                var respDiasPedidosProv = obtenerInformacionProveedores();

                if (!utilities.isEmpty(respDiasPedidosProv) && respDiasPedidosProv.error == false && respDiasPedidosProv.arrayDiasPedidoProveedor.length > 0) {
                    arrayDiasPedidoProveedor = respDiasPedidosProv.arrayDiasPedidoProveedor;
                } else {
                    if (utilities.isEmpty(respDiasPedidosProv)) {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'SROV033';
                        respuestaParcial.mensaje = 'Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de la Consulta de Dias de Pedidos de Proveedores';
                        respuesta.detalle.push(respuestaParcial);
                    } else {
                        if (respDiasNoLab.error == true) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SROV033';
                            respuestaParcial.mensaje = 'Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - Error : ' + respDiasPedidosProv.tipoError + ' - Descripcion : ' + respDiasPedidosProv.mensaje;
                            respuesta.detalle.push(respuestaParcial);
                        } else {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SROV033';
                            respuestaParcial.mensaje = 'Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de Array con Dias de Pedido de Proveedores';
                            respuesta.detalle.push(respuestaParcial);
                        }
                    }
                    return respuesta;
                }
                // FIN - Obtener Dias Pedidos Proveedores

                if (!utilities.isEmpty(idOV)) {
                    respuesta.idOV = idOV;
                    var objRecord = record.load({
                        type: record.Type.SALES_ORDER,
                        id: idOV,
                        isDynamic: true,
                    });

                    // INICIO GENERAR AJUSTE POR REDONDEO
                    var respuestaAjusteRedondeo = generarAjusteRedondeo(null, objRecord);
                    // FIN GENERAR AJUSTE POR REDONDEO

                    if (respuestaAjusteRedondeo.error != true) {
                        objRecord = respuestaAjusteRedondeo.registro;

                        if (!utilities.isEmpty(objRecord)) {
                            var cantidadLineasOV = objRecord.getLineCount({
                                sublistId: 'item'
                            });
                            var cantidadLineasREQ = objRecord.getLineCount({
                                sublistId: 'recmachcustrecord_3k_req_compra_ov'
                            });
                            if (cantidadLineasOV > 0 && cantidadLineasREQ > 0) {

                                // INICIO BUSCAR ID DE ORDEN
                                var detalleLineasOV = search.load({
                                    id: 'customsearch_3k_detalle_lineas_ov'
                                });

                                var filtroOV = search.createFilter({
                                    name: 'custrecord_3k_det_linea_ov_ov',
                                    operator: search.Operator.ANYOF,
                                    values: [idOV]
                                });

                                detalleLineasOV.filters.push(filtroOV);

                                var resultSet = detalleLineasOV.run();

                                var completeResultSet = null;

                                var resultIndex = 0;
                                var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
                                var resultado; // temporary variable used to store the result set
                                do {
                                    // fetch one result set
                                    resultado = resultSet.getRange({
                                        start: resultIndex,
                                        end: resultIndex + resultStep
                                    });

                                    if (!utilities.isEmpty(resultado) && resultado.length > 0) {
                                        if (resultIndex == 0)
                                            completeResultSet = resultado;
                                        else
                                            completeResultSet = completeResultSet.concat(resultado);
                                    }

                                    // increase pointer
                                    resultIndex = resultIndex + resultStep;

                                    // once no records are returned we already got all of them
                                } while (!utilities.isEmpty(resultado) && resultado.length > 0)
                                // FIN BUSCAR ID DE ORDEN

                                if (!utilities.isEmpty(completeResultSet)) {

                                    log.debug('Generación Orden de Venta - After Submit', 'Cantidad de Detalle de ID Orden de Venta : ' + completeResultSet.length);

                                    // INICIO GENERAR ARRAY DE RESULTADOS DE DETALLE ID LINEAS OV

                                    var arrayDetalleLineas = new Array();

                                    for (var j = 0; j < completeResultSet.length; j++) {

                                        var detalleIDOV = new Object();

                                        detalleIDOV.id = completeResultSet[j].getValue({
                                            name: resultSet.columns[0]
                                        });
                                        detalleIDOV.OrdenDeVenta = completeResultSet[j].getValue({
                                            name: resultSet.columns[1]
                                        });
                                        detalleIDOV.Articulo = completeResultSet[j].getValue({
                                            name: resultSet.columns[2]
                                        });
                                        detalleIDOV.Campania = completeResultSet[j].getValue({
                                            name: resultSet.columns[3]
                                        });

                                        // INICIO NUEVO 11/07/2017

                                        detalleIDOV.indice = j;

                                        detalleIDOV.fechaEntrega = '';

                                        // FIN NUEVO 11/07/2017

                                        arrayDetalleLineas.push(detalleIDOV);
                                    }

                                    // FIN GENERAR ARRAY DE RESULTADOS DE DETALLE ID LINEAS OV

                                    // INICIO ACTUALIZAR REQUISICIONES

                                    log.audit('Generación Orden de Venta - After Submit', 'INICIO Actualizar Requisiciones');

                                    var errorREQ = false;

                                    for (var i = 0; i < cantidadLineasREQ; i++) {

                                        var lineNum = objRecord.selectLine({
                                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                            line: i
                                        });

                                        var IDDetalleOV = objRecord.getCurrentSublistValue({
                                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                            fieldId: 'custrecord_3k_req_compra_id_det_orden'
                                        });

                                        if (utilities.isEmpty(IDDetalleOV)) {

                                            var IDInterno = objRecord.getCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                                fieldId: 'internalid'
                                            });

                                            var IDArticulo = objRecord.getCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                                fieldId: 'custrecord_3k_req_compra_articulo_grupo'
                                            });

                                            var IDCampania = objRecord.getCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                                fieldId: 'custrecord_3k_req_campana'
                                            });

                                            var IDProveedor = objRecord.getCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                                fieldId: 'custrecord_3k_req_compra_proveedor'
                                            });

                                            var IDPila = objRecord.getCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                                fieldId: 'custrecord_3k_req_compra_pila'
                                            });

                                            var FechaReparto = objRecord.getCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                                fieldId: 'custrecord_3k_req_compra_fecha_reparto'
                                            });

                                            //log.debug('After Submit OV', 'ID Proveedor : ' + IDProveedor);

                                            var informacionAdicionalOV = new Object();
                                            informacionAdicionalOV.Articulo = IDArticulo;
                                            informacionAdicionalOV.Campania = IDCampania;
                                            informacionAdicionalOV.Proveedor = IDProveedor;
                                            informacionAdicionalOV.Pila = IDPila;
                                            informacionAdicionalOV.FechaReparto = FechaReparto;

                                            arrayInformacionOV.push(informacionAdicionalOV);

                                            //INICIO CALCULAR FECHA DE ENTREGA

                                            if (!utilities.isEmpty(arrayInformacionOV) && arrayInformacionOV.length > 0) {
                                                var objDetalleProv = arrayInformacionOV.filter(function (obj) {
                                                    return (obj.Articulo == IDArticulo && obj.Campania == IDCampania);
                                                });
                                            }

                                            var objFechaEntrega = new Object();
                                            var fechaEntrega = '';

                                            var arrayProveedores = new Array();
                                            var stockPropio = true;

                                            if (!utilities.isEmpty(objDetalleProv) && objDetalleProv.length > 0) {
                                                for (var k = 0; k < objDetalleProv.length; k++) {
                                                    var infoProveedor = new Object();
                                                    infoProveedor.Proveedor = objDetalleProv[k].Proveedor;
                                                    infoProveedor.FechaReparto = objDetalleProv[k].FechaReparto;
                                                    arrayProveedores.push(infoProveedor);
                                                    //arrayProveedores.push(objDetalleProv[k].Proveedor);

                                                    if (!utilities.isEmpty(objDetalleProv[k].Pila))
                                                        stockPropio = false;
                                                }
                                                log.debug('afterSubmitOV', 'objDetalleProv: ' + JSON.stringify(objDetalleProv));
                                                log.debug('afterSubmitOV', 'arrayProveedores: ' + JSON.stringify(arrayProveedores));
                                                log.debug('afterSubmitOV', 'stockPropio: ' + JSON.stringify(stockPropio));

                                                var objFechaEntrega = calcularFecha(arrayDiasNoLaborables, arrayProveedores, stockPropio, arrayDiasPedidoProveedor);
                                                if (!utilities.isEmpty(objFechaEntrega) && objFechaEntrega.error == false) {
                                                    if (!utilities.isEmpty(objFechaEntrega.fechaBaseCalculo)) {
                                                        fechaEntrega = objFechaEntrega.fechaBaseCalculo;
                                                    } else {
                                                        errorOV = true;
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'SROV022';
                                                        respuestaParcial.mensaje = 'No se recibio fecha del proceso de calculo de fecha de entrega para el Articulo con ID Interno : ' + IDArticulo + ' y Campaña con ID Interno : ' + IDCampania + ' Para configurar la Orden de Venta con ID Interno : ' + idOV;
                                                        respuesta.detalle.push(respuestaParcial);
                                                    }
                                                } else {
                                                    if (utilities.isEmpty(objFechaEntrega)) {
                                                        errorOV = true;
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'SROV020';
                                                        respuestaParcial.mensaje = 'No se recibio objeto de respuesta del proceso de calculo de fecha de entrega para el Articulo con ID Interno : ' + IDArticulo + ' y Campaña con ID Interno : ' + IDCampania + ' Para configurar la Orden de Venta con ID Interno : ' + idOV;
                                                        respuesta.detalle.push(respuestaParcial);
                                                    } else {
                                                        errorOV = true;
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'SROV021';
                                                        respuestaParcial.mensaje = 'Error calculando fecha de entrega para el Articulo con ID Interno : ' + IDArticulo + ' y Campaña con ID Interno : ' + IDCampania + ' Para configurar la Orden de Venta con ID Interno : ' + idOV + ' - Tipo Error : ' + objFechaEntrega.tipoError + ' - Descripcion : ' + objFechaEntrega.descripcion;
                                                        respuesta.detalle.push(respuestaParcial);
                                                    }
                                                }

                                            } else {
                                                errorOV = true;
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SROV001';
                                                respuestaParcial.mensaje = 'No se encontraron Proveedores para el Articulo con ID Interno : ' + IDArticulo + ' y Campaña con ID Interno : ' + IDCampania + ' Para configurar la Orden de Venta con ID Interno : ' + idOV;
                                                respuesta.detalle.push(respuestaParcial);
                                            }

                                            //FIN CALCULAR FECHA DE ENTREGA

                                            if (!utilities.isEmpty(IDArticulo) && !utilities.isEmpty(IDCampania)) {
                                                var objDetalleLineaOV = arrayDetalleLineas.filter(function (obj) {
                                                    return (obj.Articulo == IDArticulo && obj.Campania == IDCampania);
                                                });

                                                if (!utilities.isEmpty(objDetalleLineaOV) && objDetalleLineaOV.length > 0) {

                                                    if (!utilities.isEmpty(objDetalleLineaOV[objDetalleLineaOV.length - 1].id)) {
                                                        // INICIO GRABAR ID DE LINEA DE OV

                                                        objRecord.setCurrentSublistValue({
                                                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                                            fieldId: 'custrecord_3k_req_compra_id_det_orden',
                                                            value: objDetalleLineaOV[objDetalleLineaOV.length - 1].id,
                                                            ignoreFieldChange: false
                                                        });


                                                        objRecord.setCurrentSublistValue({
                                                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                                            fieldId: 'custrecord_3k_req_compra_f_entrega',
                                                            value: fechaEntrega,
                                                            ignoreFieldChange: false
                                                        });

                                                        // INICIO NUEVO 11/07/2017
                                                        // Actualizar Fecha
                                                        arrayDetalleLineas[objDetalleLineaOV[objDetalleLineaOV.length - 1].indice].fechaEntrega = fechaEntrega;

                                                        // FIN NUEVO 11/07/2017

                                                        objRecord.commitLine({
                                                            sublistId: 'recmachcustrecord_3k_req_compra_ov'
                                                        });

                                                        // FIN GRABAR ID DE LINEA DE OV
                                                    } else {
                                                        errorREQ = true;
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'SROV004';
                                                        respuestaParcial.mensaje = 'No se puede encontrar el ID Interno de la Orden para el Articulo con ID Interno : ' + IDArticulo + ' y Campaña con ID Interno : ' + IDCampania + ' Para configurar la Requisicion ID Interno : ' + IDInterno;
                                                        respuesta.detalle.push(respuestaParcial);
                                                    }
                                                } else {
                                                    errorREQ = true;
                                                    respuesta.error = true;
                                                    respuestaParcial = new Object();
                                                    respuestaParcial.codigo = 'SROV005';
                                                    respuestaParcial.mensaje = 'No se puede encontrar el ID de Orden para el Articulo con ID Interno : ' + IDArticulo + ' y Campaña con ID Interno : ' + IDCampania + ' Para configurar la Requisicion con ID Interno : ' + IDInterno;
                                                    respuesta.detalle.push(respuestaParcial);
                                                }

                                            } else {
                                                errorREQ = true;
                                                respuesta.error = true;
                                                var mensaje = 'No se pudo Obtener la siguiente información Para configurar la Requisicion con ID Interno : ' + IDInterno + ' : ';
                                                if (utilities.isEmpty(IDArticulo)) {
                                                    mensaje = mensaje + ' ID Interno del Articulo / ';
                                                }
                                                if (utilities.isEmpty(IDCampania)) {
                                                    mensaje = mensaje + ' ID Interno de la Campaña / ';
                                                }
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SROV006';
                                                respuestaParcial.mensaje = mensaje;
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                        }

                                    }

                                    log.audit('Generación Orden de Venta - After Submit', 'FIN Actualizar Requisiciones');

                                    // FIN ACTUALIZAR REQUISICIONES

                                    // INICIO ACTUALIZAR LINEAS OV

                                    var errorOV = false;
                                    var indiceVoucher = 0;

                                    log.audit('Generación Orden de Venta - After Submit', 'INICIO Actualizar Lineas OV');

                                    for (var i = 0; i < cantidadLineasOV && errorREQ == false; i++) {

                                        var infoOrden = new Object();

                                        var esVoucher = objRecord.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_3k_linea_voucher',
                                            line: i
                                        });

                                        var IDDetalleOV = objRecord.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_3k_id_orden',
                                            line: i
                                        });

                                        var esRedondeo = objRecord.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_3k_es_redondeo',
                                            line: i
                                        });

                                        if (esVoucher == false && !esRedondeo && utilities.isEmpty(IDDetalleOV)) {

                                            var lineNum = objRecord.selectLine({
                                                sublistId: 'item',
                                                line: i
                                            });

                                            var IDArticulo = objRecord.getCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'item'
                                            });

                                            var IDCampania = objRecord.getCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_3k_campana'
                                            });

                                            var IDVoucher = objRecord.getCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_3k_voucher'
                                            });

                                            var montoVoucher = objRecord.getCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_3k_importe_voucher'
                                            });

                                            if (!utilities.isEmpty(IDArticulo) && !utilities.isEmpty(IDCampania)) {
                                                var objDetalleLineaOV = arrayDetalleLineas.filter(function (obj) {
                                                    return (obj.Articulo == IDArticulo && obj.Campania == IDCampania);
                                                });

                                                if (!utilities.isEmpty(objDetalleLineaOV) && objDetalleLineaOV.length > 0) {

                                                    if (!utilities.isEmpty(objDetalleLineaOV[objDetalleLineaOV.length - 1].id)) {
                                                        // INICIO GRABAR ID DE LINEA DE OV
                                                        objRecord.setCurrentSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'custcol_3k_id_orden',
                                                            value: objDetalleLineaOV[objDetalleLineaOV.length - 1].id,
                                                            ignoreFieldChange: true
                                                        });

                                                        // INICIO NUEVO 11/07/2017

                                                        fechaEntrega = objDetalleLineaOV[objDetalleLineaOV.length - 1].fechaEntrega;

                                                        // FIN NUEVO 11/07/2017


                                                        objRecord.setCurrentSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'custcol_3k_fecha_entrega',
                                                            value: fechaEntrega,
                                                            ignoreFieldChange: true
                                                        });


                                                        objRecord.commitLine({
                                                            sublistId: 'item'
                                                        });

                                                        infoOrden.idOrden = objDetalleLineaOV[objDetalleLineaOV.length - 1].id;
                                                        infoOrden.idCampania = IDCampania;
                                                        infoOrden.idArticulo = IDArticulo;
                                                        infoOrden.fechaEntrega = fechaEntrega;

                                                        arrayOrdenesResp.push(infoOrden);

                                                        // FIN GRABAR ID DE LINEA DE OV

                                                        // INICIO - GRABAR INFORMACION DE VOUCHER

                                                        log.audit('Generación Orden de Venta - After Submit', 'ID Voucher : ' + IDVoucher + ' Monto : ' + montoVoucher);

                                                        if (!utilities.isEmpty(IDVoucher) && !utilities.isEmpty(montoVoucher) && !isNaN(montoVoucher) && montoVoucher > 0.00) {

                                                            var objVoucherLinea = new Object();
                                                            objVoucherLinea.idVoucher = IDVoucher;
                                                            objVoucherLinea.montoVoucher = parseFloat(montoVoucher);
                                                            objVoucherLinea.fecha = fecha;
                                                            objVoucherLinea.idOrden = objDetalleLineaOV[objDetalleLineaOV.length - 1].id;

                                                            arrayVoucherLinea.push(JSON.parse(JSON.stringify(objVoucherLinea)));

                                                            if (!utilities.isEmpty(arrayVoucher) && arrayVoucher.length > 0) {
                                                                var filterArray = new Array();
                                                                filterArray = arrayVoucher.filter(function (obj) {
                                                                    return (obj.idVoucher == IDVoucher);
                                                                });

                                                                if (!utilities.isEmpty(filterArray) && filterArray.length > 0) {
                                                                    //arrayVoucher[filterArray[0].id].montoVoucher = parseFloat(filterArray[0].montoVoucher) + parseFloat(montoVoucher);
                                                                    filterArray[0].montoVoucher = parseFloat(filterArray[0].montoVoucher) + parseFloat(montoVoucher);
                                                                } else {
                                                                    objVoucherLinea.id = indiceVoucher;
                                                                    indiceVoucher++;
                                                                    arrayVoucher.push(JSON.parse(JSON.stringify(objVoucherLinea)));
                                                                }

                                                            } else {
                                                                objVoucherLinea.id = indiceVoucher;
                                                                indiceVoucher++;
                                                                arrayVoucher.push(JSON.parse(JSON.stringify(objVoucherLinea)));
                                                            }

                                                        }

                                                        // FIN - GRABAR INFORMACION DE VOUCHER
                                                    } else {
                                                        errorOV = true;
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'SROV001';
                                                        respuestaParcial.mensaje = 'No se puede encontrar el ID Interno de la Orden para el Articulo con ID Interno : ' + IDArticulo + ' y Campaña con ID Interno : ' + IDCampania + ' Para configurar la Orden de Venta con ID Interno : ' + idOV;
                                                        respuesta.detalle.push(respuestaParcial);
                                                    }
                                                } else {
                                                    errorOV = true;
                                                    respuesta.error = true;
                                                    respuestaParcial = new Object();
                                                    respuestaParcial.codigo = 'SROV002';
                                                    respuestaParcial.mensaje = 'No se puede encontrar el ID de Orden para el Articulo con ID Interno : ' + IDArticulo + ' y Campaña con ID Interno : ' + IDCampania + ' Para configurar la Orden de Venta con ID Interno : ' + idOV;
                                                    respuesta.detalle.push(respuestaParcial);
                                                }
                                            } else {
                                                errorOV = true;
                                                respuesta.error = true;
                                                var mensaje = 'No se pudo Obtener la siguiente información Para configurar la Orden de Venta con ID Interno : ' + idOV + ' Numero de Linea : ' + i + 1 + ' : ';
                                                if (utilities.isEmpty(IDArticulo)) {
                                                    mensaje = mensaje + ' ID Interno del Articulo / ';
                                                }
                                                if (utilities.isEmpty(IDCampania)) {
                                                    mensaje = mensaje + ' ID Interno de la Campaña / ';
                                                }
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SROV003';
                                                respuestaParcial.mensaje = mensaje;
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                        }
                                    }

                                    log.audit('Generación Orden de Venta - After Submit', 'FIN Actualizar Lineas OV');

                                    // FIN ACTUALIZAR LINEAS OV

                                    // INICIO GRABAR OV
                                    var monedaVoucherOV = '';
                                    var tipoCambioVoucher = null;
                                    var monedaBase = null;
                                    //var exchangerateOV;
                                    if (respuesta.error == false) {
                                        // GRABAR ORDEN DE VENTA
                                        try {
                                            //exchangerateOV = objRecord.getValue({ fieldId: 'exchangerate' });
                                            monedaVoucherOV = objRecord.getValue({
                                                fieldId: 'currency'
                                            });
                                            importeTotalOrdenDeVenta = objRecord.getValue({
                                                fieldId: 'total'
                                            });
                                            importeTotalVouchers = objRecord.getValue({
                                                fieldId: 'custbody_3k_imp_voucher_dev_aplic_ov'
                                            });
                                            clienteOrdenDeVenta = objRecord.getValue({
                                                fieldId: 'entity'
                                            });

                                            tipoCambioVoucher = objRecord.getValue({
                                                fieldId: 'custbody_3k_exchangerate_voucher'
                                            });

                                            var subsidiariaOV = objRecord.getValue({
                                                fieldId: 'subsidiary'
                                            });

                                            var objFieldLookUpSubsidiariary = search.lookupFields({
                                                type: record.Type.SUBSIDIARY,
                                                id: subsidiariaOV,
                                                columns: [
                                                    'currency'
                                                ]
                                            });


                                            log.audit('objFieldLookUpSubsidiariary', JSON.stringify(objFieldLookUpSubsidiariary));

                                            monedaBase = objFieldLookUpSubsidiariary["currency"][0].value;

                                            log.audit('monedaBase', monedaBase);

                                            var recordId = objRecord.save({
                                                enableSourcing: true,
                                                ignoreMandatoryFields: false
                                            });
                                        } catch (excepcionSave) {
                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'SROV008';
                                            respuestaParcial.mensaje = 'Excepcion Actualizando Orden de Venta con ID Interno : ' + idOV + ' - Excepcion : ' + excepcionSave.message.toString();
                                            respuesta.detalle.push(respuestaParcial);
                                        }
                                        if (utilities.isEmpty(recordId)) {
                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'SROV007';
                                            respuestaParcial.mensaje = 'Error No se recibio el ID Interno de la Orden de Venta Actualizada';
                                            respuesta.detalle.push(respuestaParcial);
                                        } else {
                                            /******************************************INICIO GUARDAR VOUCHERS *************************************************************************************/
                                            log.audit('Generación Orden de Venta - After Submit', 'INICIO Actualizar Vouchers');
                                            if (!utilities.isEmpty(arrayVoucher) && arrayVoucher.length > 0) {
                                                log.audit('Generación Orden de Venta - After Submit', 'Cantidad Vouchers : ' + arrayVoucher.length);


                                                /*var arraySearchParams = [];
                                                var objParam = new Object({});
                                                objParam.name = 'transactioncurrency';
                                                objParam.operator = 'ANYOF';
                                                objParam.values = monedaVoucherOV;
                                                arraySearchParams.push(objParam);


                                                var objResultSet = utilities.searchSavedPro('customsearch_3k_tipos_cambios', arraySearchParams);
                                                if (objResultSet.error) {
                                                    return objResultSet;
                                                }

                                                log.audit('result search tipos cambio', JSON.stringify(objResultSet));

                                                var tiposCambios = objResultSet.objRsponseFunction.array;*/

                                                for (var n = 0; n < arrayVoucher.length; n++) {

                                                    var objFieldLookUp = search.lookupFields({
                                                        type: 'customrecord_3k_vouchers',
                                                        id: arrayVoucher[n].idVoucher,
                                                        columns: [
                                                            'custrecord_3k_vouchers_orden', 'custrecord_3k_vouchers_cosumido', 'custrecord_3k_vouchers_saldo', 'custrecord_3k_vouchers_moneda'
                                                        ]
                                                    });

                                                    var arrayOrdenes = objFieldLookUp["custrecord_3k_vouchers_orden"];
                                                    var stockConsumido = objFieldLookUp["custrecord_3k_vouchers_cosumido"];
                                                    var saldoRestante = objFieldLookUp["custrecord_3k_vouchers_saldo"];
                                                    var monedaVoucher = objFieldLookUp["custrecord_3k_vouchers_moneda"][0].value;

                                                    log.audit('objFieldLookUp', JSON.stringify(objFieldLookUp));
                                                    log.audit('monedaVoucher', monedaVoucher);
                                                    log.audit('monedaVoucherOV', monedaVoucherOV);

                                                    var arrayIdOrdenes = new Array();

                                                    for (var q = 0; q < arrayOrdenes.length; q++) {
                                                        arrayIdOrdenes.push(arrayOrdenes[q].value);
                                                    }

                                                    arrayIdOrdenes.push(idOV);

                                                    var stockConsumidoFinal;

                                                    if (!utilities.isEmpty(monedaVoucher)) {

                                                        if (monedaVoucher != monedaVoucherOV) {

                                                            /*var tiposCambiosFilter = tiposCambios.filter(function (obj) {
                                                                return obj.basecurrency == monedaVoucher
                                                            });*/

                                                            //log.error('tiposCambiosFilter', JSON.stringify(tiposCambiosFilter));
                                                            log.audit('tipoCambioVoucher', tipoCambioVoucher);
                                                            if (!utilities.isEmpty(tipoCambioVoucher)) {

                                                                if (monedaBase != monedaVoucherOV) {

                                                                    stockConsumidoFinal = parseFloat(stockConsumido) + (parseFloat(arrayVoucher[n].montoVoucher) * parseFloat(tipoCambioVoucher));
                                                                } else {
                                                                    stockConsumidoFinal = parseFloat(stockConsumido) + (parseFloat(arrayVoucher[n].montoVoucher) / parseFloat(tipoCambioVoucher));
                                                                }

                                                            }

                                                            log.audit('stockConsumidoFinal', stockConsumidoFinal);

                                                        } else {
                                                            stockConsumidoFinal = parseFloat(stockConsumido) + parseFloat(arrayVoucher[n].montoVoucher);
                                                        }


                                                        //var stockConsumidoFinal = parseFloat(stockConsumido) + parseFloat(arrayVoucher[n].montoVoucher);
                                                        log.debug('AfterSubmitOV', 'stockConsumidoFinal: ' + stockConsumidoFinal);

                                                        log.audit('diferencia saldos', (parseFloat(saldoRestante) - stockConsumidoFinal));
                                                        if (!utilities.isEmpty(saldoRestante) && (parseFloat(saldoRestante) - stockConsumidoFinal) >= -1) {
                                                            try {

                                                                if ((parseFloat(saldoRestante) - stockConsumidoFinal) < 0) {
                                                                    stockConsumidoFinal = saldoRestante;
                                                                }

                                                                var idRecordVoucher = record.submitFields({
                                                                    type: 'customrecord_3k_vouchers',
                                                                    id: arrayVoucher[n].idVoucher,
                                                                    values: {
                                                                        custrecord_3k_vouchers_orden: arrayIdOrdenes,
                                                                        custrecord_3k_vouchers_cosumido: stockConsumidoFinal
                                                                    },
                                                                    options: {
                                                                        enableSourcing: true,
                                                                        ignoreMandatoryFields: false
                                                                    }
                                                                });
                                                                if (utilities.isEmpty(idRecordVoucher)) {
                                                                    respuesta.error = true;
                                                                    respuestaParcial = new Object();
                                                                    respuestaParcial.codigo = 'SROV014';
                                                                    respuestaParcial.mensaje = 'Error Actualizando Registro de Voucher con ID Interno : ' + arrayVoucher[n].idVoucher + ' No se recibio ID de Respuesta de Actualizacion';
                                                                    respuesta.detalle.push(respuestaParcial);
                                                                }
                                                            } catch (excepcionVoucher) {
                                                                respuesta.error = true;
                                                                respuestaParcial = new Object();
                                                                respuestaParcial.codigo = 'SROV015';
                                                                respuestaParcial.mensaje = 'Excepcion Actualizando Registro de Voucher con ID Interno : ' + arrayVoucher[n].idVoucher + ' - Excepcion : ' + excepcionVoucher.message.toString();
                                                                respuesta.detalle.push(respuestaParcial);
                                                            }

                                                        } else {
                                                            respuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SROV020';
                                                            respuestaParcial.mensaje = 'El voucher ingresado está consumido en su totalidad';
                                                            respuesta.detalle.push(respuestaParcial);
                                                            return respuesta;
                                                        }
                                                    } else {

                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'SROV021';
                                                        respuestaParcial.mensaje = 'El voucher ingresado no tiene moneda';
                                                        respuesta.detalle.push(respuestaParcial);
                                                        return respuesta;

                                                    }

                                                }
                                            }

                                            log.audit('Generación Orden de Venta - After Submit', 'FIN Actualizar Vouchers');

                                            log.audit('Generación Orden de Venta - After Submit', 'INICIO Grabar Uso de Vouchers');

                                            if (!utilities.isEmpty(arrayVoucherLinea) && arrayVoucherLinea.length > 0) {
                                                log.audit('Generación Orden de Venta - After Submit', 'Cantidad Uso Vouchers : ' + arrayVoucherLinea.length);

                                                for (z = 0; z < arrayVoucherLinea.length; z++) {

                                                    var idRecUsoVoucher = record.create({
                                                        type: 'customrecord_3k_usos_vouchers',
                                                        isDynamic: true
                                                    });

                                                    idRecUsoVoucher.setValue({
                                                        fieldId: 'custrecord_3k_usos_vouchers_voucher',
                                                        value: arrayVoucherLinea[z].idVoucher
                                                    });

                                                    idRecUsoVoucher.setValue({
                                                        fieldId: 'custrecord_3k_usos_vouchers_consumido',
                                                        value: arrayVoucherLinea[z].montoVoucher.toString()
                                                    });

                                                    idRecUsoVoucher.setValue({
                                                        fieldId: 'custrecord_3k_usos_vouchers_orden',
                                                        value: arrayVoucherLinea[z].idOrden
                                                    });

                                                    idRecUsoVoucher.setValue({
                                                        fieldId: 'custrecord_3k_usos_vouchers_fecha',
                                                        value: fecha
                                                    });

                                                    idRecUsoVoucher.setValue({
                                                        fieldId: 'custrecord_3k_usos_vouchers_ov',
                                                        value: idOV
                                                    });

                                                    try {
                                                        idRecUsoVoucherSave = idRecUsoVoucher.save();
                                                        if (utilities.isEmpty(idRecUsoVoucherSave)) {
                                                            respuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SROV016';
                                                            respuestaParcial.mensaje = 'Error Grabando Registro de Uso Voucher - Error : No se recibio ID de Respuesta de Actualizacion';
                                                            respuesta.detalle.push(respuestaParcial);
                                                        }
                                                    } catch (excepcionUsoVoucher) {
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'SROV017';
                                                        respuestaParcial.mensaje = 'Excepcion Grabando Registro de Voucher - Excepcion : ' + excepcionUsoVoucher.message.toString();
                                                        respuesta.detalle.push(respuestaParcial);
                                                    }
                                                }
                                            }

                                            log.audit('Generación Orden de Venta - After Submit', 'FIN Grabar Uso de Vouchers');

                                        }
                                        /******************************************FIN GUARDAR VOUCHERS *************************************************************************************/
                                        log.audit('Generación Orden de Venta - After Submit', 'Importe Total OV : ' + importeTotalOrdenDeVenta + ' - Importe Total Voucher Devolucion : ' + importeTotalVouchers);

                                        if (importeTotalOrdenDeVenta <= 0.00 || importeTotalVouchers == importeTotalOrdenDeVenta) {
                                            // INICIO Generar Cupones
                                            var pago = new Object();
                                            var respuestaGeneracionCupon = generarCupones(null, idOV, clienteOrdenDeVenta, pago);

                                            if (utilities.isEmpty(respuestaGeneracionCupon)) {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SROV023';
                                                respuestaParcial.mensaje = 'Error Generando Cupones a la Orden de Venta con ID Interno : ' + idOV;
                                                respuesta.detalle.push(respuestaParcial);
                                            } else {
                                                if (respuestaGeneracionCupon.error == true) {
                                                    respuesta.error = true;
                                                    respuestaParcial = new Object();
                                                    respuestaParcial.codigo = 'SROV024';
                                                    respuestaParcial.mensaje = 'Error Generando Cupones para la Orden de Venta con ID Interno : ' + idOV + ' - Error : ' + respuestaGeneracionCupon.codigo + ' - Detalle : ' + respuestaGeneracionCupon.mensaje;
                                                    respuesta.detalle.push(respuestaParcial);
                                                }
                                            }
                                            // FIN Generar Cupones
                                            if (respuesta.error == false) {
                                                // INICIO - Obtener Requisiciones Generadas por Orden de Venta
                                                var arrayRequisiciones = new Array();
                                                var objParam = new Object();
                                                objParam.name = 'custrecord_3k_req_compra_ov';
                                                objParam.operator = 'IS';
                                                objParam.values = idOV;

                                                var searchRequisiciones = utilities.searchSaved('customsearch_3k_requisiciones_ov', objParam);
                                                if (!utilities.isEmpty(searchRequisiciones) && searchRequisiciones.error == false) {
                                                    if (!utilities.isEmpty(searchRequisiciones.objRsponseFunction.result) && searchRequisiciones.objRsponseFunction.result.length > 0) {
                                                        // Agrupar Cupones por ID de Orden
                                                        var resultSet = searchRequisiciones.objRsponseFunction.result;
                                                        var resultSearch = searchRequisiciones.objRsponseFunction.search;

                                                        var idLineaOVAnterior = '';
                                                        var idLineaOVActual = '';

                                                        for (var l = 0; !utilities.isEmpty(resultSet) && l < resultSet.length; l++) {

                                                            var obj = new Object();
                                                            obj.indice = l;
                                                            obj.idInterno = resultSet[l].getValue({
                                                                name: resultSearch.columns[0]
                                                            });
                                                            obj.idOV = resultSet[l].getValue({
                                                                name: resultSearch.columns[1]
                                                            });
                                                            obj.idLineaOV = resultSet[l].getValue({
                                                                name: resultSearch.columns[2]
                                                            });

                                                            arrayRequisiciones.push(obj);
                                                        }
                                                    } else {
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'RDEP013';
                                                        respuestaParcial.mensaje = 'Error Consultando Requisiciones por Orden de Venta para Actualizar Cupones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se encontraron Requisiciones';
                                                        respuesta.detalle.push(respuestaParcial);
                                                    }
                                                } else {
                                                    if (utilities.isEmpty(searchRequisiciones)) {
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'RDEP014';
                                                        respuestaParcial.mensaje = 'Error Consultando Requisiciones por Orden de Venta para Actualizar Cupones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Recibio Objeto de Respuesta';
                                                        respuesta.detalle.push(respuestaParcial);
                                                    } else {
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'RDEP015';
                                                        respuestaParcial.mensaje = 'Error Consultando Requisiciones por Orden de Venta para Actualizar Cupones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Tipo Error : ' + searchRequisiciones.tipoError + ' - Descripcion : ' + searchRequisiciones.descripcion;
                                                        respuesta.detalle.push(respuestaParcial);
                                                    }
                                                }
                                                // FIN - Obtener Requisiciones Generadas por Orden de Venta

                                                // INICIO - Actualizar Requisiciones
                                                if (!utilities.isEmpty(respuestaGeneracionCupon.informacionCupones)) {
                                                    respuesta.cupones = respuestaGeneracionCupon.informacionCuponesResult;
                                                    for (var s = 0; s < respuestaGeneracionCupon.informacionCupones.length && respuesta.error == false; s++) {
                                                        var objRequisicion = arrayRequisiciones.filter(function (obj) {
                                                            return (obj.idLineaOV === respuestaGeneracionCupon.informacionCupones[s].idLineaOV);
                                                        });

                                                        if (!utilities.isEmpty(objRequisicion) && objRequisicion.length > 0) {
                                                            for (var q = 0; q < objRequisicion.length && respuesta.error == false; q++) {
                                                                try {
                                                                    var idRecordRequisicion = record.submitFields({
                                                                        type: 'customrecord_3k_req_compra',
                                                                        id: objRequisicion[q].idInterno,
                                                                        values: {
                                                                            custrecord_3k_req_compra_cupon: respuestaGeneracionCupon.informacionCupones[s].idCupones
                                                                        },
                                                                        options: {
                                                                            enableSourcing: true,
                                                                            ignoreMandatoryFields: false
                                                                        }
                                                                    });
                                                                    if (utilities.isEmpty(idRecordRequisicion)) {
                                                                        respuesta.error = true;
                                                                        respuestaParcial = new Object();
                                                                        respuestaParcial.codigo = 'RDEP016';
                                                                        respuestaParcial.mensaje = 'Error Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Recibio ID de la Requisicion Actualizada';
                                                                        respuesta.detalle.push(respuestaParcial);
                                                                    }
                                                                } catch (exepcionSubmitRequisicion) {
                                                                    respuesta.error = true;
                                                                    respuestaParcial = new Object();
                                                                    respuestaParcial.codigo = 'RDEP017';
                                                                    respuestaParcial.mensaje = 'Excepcion Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Excepcion : ' + exepcionSubmitRequisicion.message.toString();
                                                                    respuesta.detalle.push(respuestaParcial);
                                                                }
                                                            }

                                                        } else {
                                                            respuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'RDEP018';
                                                            respuestaParcial.mensaje = 'Error Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Encontro la Requisicion para el ID Detalle OV : ' + informacionCupones[i].idLineaOV;
                                                            respuesta.detalle.push(respuestaParcial);
                                                        }
                                                    }
                                                } else {
                                                    respuesta.error = true;
                                                    respuestaParcial = new Object();
                                                    respuestaParcial.codigo = 'RDEP019';
                                                    respuestaParcial.mensaje = 'Error Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Recibio Informacion de Array de Cupones';
                                                    respuesta.detalle.push(respuestaParcial);
                                                }
                                                // FIN - Actualizar Requisiciones
                                            }
                                        }
                                    }

                                    // FIN GRABAR OV

                                } else {
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'SROV009';
                                    respuestaParcial.mensaje = 'Error No se Encontraron ID de Ordenes Asociados a la Orden de Venta con ID Interno : ' + idOV;
                                    respuesta.detalle.push(respuestaParcial);
                                }
                            } else {
                                var mensaje = ' No se pudo encontrar la siguiente informacion para la Orden de Venta con ID Interno : ' + idOV + ' : ';
                                if (utilities.isEmpty(cantidadLineasOV) || (!utilities.isEmpty(cantidadLineasOV) && cantidadLineasOV <= 0)) {
                                    mensaje = mensaje + ' Lineas pertenecientes a la Orden de Venta / ';
                                }
                                if (utilities.isEmpty(cantidadLineasREQ) || (!utilities.isEmpty(cantidadLineasREQ) && cantidadLineasREQ <= 0)) {
                                    mensaje = mensaje + ' Lineas pertenecientes a la Requisiciones / ';
                                }
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SROV010';
                                respuestaParcial.mensaje = mensaje;
                                respuesta.detalle.push(respuestaParcial);
                            }
                        } else {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SROV011';
                            respuestaParcial.mensaje = 'Error No se pudo cargar la Orden de Venta con ID Interno : ' + idOV;
                            respuesta.detalle.push(respuestaParcial);
                        }
                    } else {
                        /*respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'SROV025';
                        respuestaParcial.mensaje = 'Error Generando Ajuste de Redondeo';
                        respuesta.detalle.push(respuestaParcial);*/
                        respuesta = respuestaAjusteRedondeo;
                    }
                } else {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SROV012';
                    respuestaParcial.mensaje = 'Error No se recibio el ID Interno de la Orden de Venta';
                    respuesta.detalle.push(respuestaParcial);
                }
            } catch (excepcion) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'SROV013';
                respuestaParcial.mensaje = 'Excepcion Grabando Orden de Venta con ID Interno : ' + idOV + ' - Excepcion : ' + excepcion.message.toString();
                respuesta.detalle.push(respuestaParcial);
            }

            log.debug('Generación Orden de Venta - After Submit', 'Respuesta : ' + JSON.stringify(respuesta));

            if (respuesta.error == true && !utilities.isEmpty(respuesta.detalle) && respuesta.detalle.length > 0) {
                log.error('Generación Orden de Venta - After Submit', 'Error Generando Orden de Venta con ID Interno : ' + respuesta.idOV + ' Error : ' + respuesta.detalle.toString());
            } else {
                respuesta.ordenes = arrayOrdenesResp;
            }

            log.audit('Generación Orden de Venta - After Submit', 'FIN Proceso - ID Orden de Venta : ' + idOV);

            return respuesta;
        }

        function beforeSubmitOV(rec, arrayLinea, arrayOV, fecha) {
            log.audit('beforeSubmitOV', 'INICIO Before Submit OV');
            var objRespuesta = new Object();
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();
            try {

                var sitio = rec.getValue({
                    fieldId: 'custbody_cseg_3k_sitio_web_o'
                });

                log.debug('beforeSubmitOV', 'sitio: ' + sitio);

                var objParam = new Object({});
                objParam.name = 'custrecord_74_cseg_3k_sitio_web_o';
                objParam.operator = 'IS';
                objParam.values = [sitio];

                var searchConfig = utilities.searchSaved('customsearch_3k_configuracion_stock_prop', objParam);
                if (searchConfig.error) {
                    return searchConfig;
                } else {
                    var proveedorSP = searchConfig.objRsponseFunction.result[0].getValue({
                        name: searchConfig.objRsponseFunction.search.columns[1]
                    });
                    var importeSP = searchConfig.objRsponseFunction.result[0].getValue({
                        name: searchConfig.objRsponseFunction.search.columns[2]
                    });
                    var monedaSP = searchConfig.objRsponseFunction.result[0].getValue({
                        name: searchConfig.objRsponseFunction.search.columns[3]
                    });

                }
                //log.audit('beforeSubmitOV', 'proveedorSP: ' + proveedorSP);
                //log.audit('beforeSubmitOV', 'importeSP: ' + importeSP);
                //log.debug('beforeSubmitOV', 'arrayOV cantidad: ' + arrayOV.length);

                for (var j = 0; j < arrayOV.length; j++) {

                    //if (!arrayOV[j].isVoucher){
                    /****************** INICIO INSERTA A TRAVES DE RECMACH DETALLE LINEA OV*********************************************************/
                    //log.audit('beforeSubmitOV', 'entró recmach detalle');


                    /*var lineaFilter = arrayLinea.filter(function(obj){
                        return (obj.articulo == arrayLinea[i].articulo);
                    });*/

                    //if (utilities.isEmpty(lineaFilter) || lineaFilter.length<=0){
                    //objLinea.pilas = pilas;
                    rec.selectNewLine({
                        sublistId: 'recmachcustrecord_3k_det_linea_ov_ov'
                    });

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_3k_det_linea_ov_ov',
                        fieldId: 'custrecord_3k_det_linea_ov_art',
                        value: arrayOV[j].articulo
                    });

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_3k_det_linea_ov_ov',
                        fieldId: 'custrecord_3k_det_linea_ov_camp',
                        value: arrayOV[j].campana
                    });

                    rec.commitLine({
                        sublistId: 'recmachcustrecord_3k_det_linea_ov_ov'
                    });

                    //}


                    /******************FIN INSERTA A TRAVES DE RECMACH DETALLE LINEA OV*********************************************************/
                    //}
                }


                for (var i = 0; i < arrayLinea.length; i++) {
                    //log.debug('beforeSubmitOV', 'arrayLinea: '+ JSON.stringify(arrayLinea[i].toString()));



                    /******************INCIO INSERTAR A TRAVES DE RECMACH REQUISICIONES*******************************************************************/

                    rec.selectNewLine({
                        sublistId: 'recmachcustrecord_3k_req_compra_ov'
                    });

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                        fieldId: 'custrecord_3k_req_compra_articulo_grupo',
                        value: arrayLinea[i].articulo
                    });

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                        fieldId: 'custrecord_3k_req_compra_articulo',
                        value: arrayLinea[i].componente
                    });

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                        fieldId: 'custrecord_3k_req_campana',
                        value: arrayLinea[i].campana
                    });

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                        fieldId: 'custrecord_3k_req_compra_fecha',
                        value: fecha
                    });



                    if (arrayLinea[i].isStockPropio) {

                        rec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_proveedor',
                            value: proveedorSP
                        });

                        rec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_precio',
                            value: importeSP
                        });

                        rec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_moneda',
                            value: monedaSP
                        });

                        rec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_stk_propio',
                            value: true
                        });

                    } else {
                        rec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_pila',
                            value: arrayLinea[i].pila
                        });
                    }

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                        fieldId: 'custrecord_3k_req_compra_cantidad',
                        value: arrayLinea[i].cantidad.toString()
                    });

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                        fieldId: 'custrecord_3k_req_compra_cant_comp',
                        value: arrayLinea[i].cantidadComponente.toString()
                    });

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                        fieldId: 'custrecord_3k_req_compra_ubicacion',
                        value: arrayLinea[i].ubicacion
                    });

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                        fieldId: 'custrecord_46_cseg_3k_sitio_web_o',
                        value: arrayLinea[i].sitio
                    });

                    rec.commitLine({
                        sublistId: 'recmachcustrecord_3k_req_compra_ov'
                    });

                    /******************FIN INSERTAR A TRAVES DE RECMACH REQUISICIONES*******************************************************************/
                } // END FOR 

                objRespuesta.rec = rec;
            } catch (e) {
                objRespuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'CORV002';
                objRespuestaParcial.mensaje = 'function beforeSubmitOV: ' + e.message;
                objRespuesta.detalle.push(objRespuestaParcial);
                //objRespuesta.tipoError = 'CORV002';
                //objRespuesta.descripcion = 'function beforeSubmitOV: ' + e.message;
                log.error('CORV002', 'function beforeSubmitOV: ' + e.message);
            }

            return objRespuesta;
            log.audit('beforeSubmitOV', 'FIN Before Submit OV');
        }

        function obtenerInformacionProveedores() {

            var respuesta = new Object();
            respuesta.error = false;
            respuesta.arrayDiasPedidoProveedor = new Array();
            respuesta.detalle = new Array();

            var objResultSet = utilities.searchSaved('customsearch_3k_prov_dias_pedidos');

            if (objResultSet.error) {
                return objResultSet;
            }
            var resultSet = objResultSet.objRsponseFunction.result;
            var resultSearch = objResultSet.objRsponseFunction.search;

            if (!utilities.isEmpty(resultSet) && resultSet.length > 0) {

                for (var l = 0; !utilities.isEmpty(resultSet) && l < resultSet.length; l++) {

                    var obj = new Object();
                    obj.indice = l;
                    obj.proveedor = resultSet[l].getValue({
                        name: resultSearch.columns[0]
                    });
                    obj.codigoDiaJS = resultSet[l].getValue({
                        name: resultSearch.columns[2]
                    });
                    obj.demoraProveedor = resultSet[l].getValue({
                        name: resultSearch.columns[3]
                    });
                    //obj.stockDisponible = resultSet[l].getValue({name: resultSearch.columns[6]});
                    respuesta.arrayDiasPedidoProveedor.push(obj);
                }
            } else {
                var mensaje = 'Error Calculando Fecha de Entrega - Error : Error Consultando dias de Pedidos de Proveedores';
                respuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'RORV013';
                objRespuestaParcial.mensaje = mensaje;
                respuesta.detalle.push(objRespuestaParcial);
                log.error('RORV013', mensaje);
            }

            return respuesta;
        }

        function calcularFecha(arrayDiasNoLaborales, arrayProveedor, stockPropio, arrayDiasEntregaProveedor) {

            log.audit('Calcular Fecha Entrega', 'INICIO Proceso');

            var objRespuesta = new Object();
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();
            //objRespuesta.tipoError = '';
            //objRespuesta.descripcion = '';

            try {

                var arrayFechasEntregas = new Array();

                if (!utilities.isEmpty(arrayProveedor) && arrayProveedor.length > 0) {

                    if (!utilities.isEmpty(arrayDiasEntregaProveedor) && arrayDiasEntregaProveedor.length > 0) {

                        var idProveedores = new Array();
                        for (var i = 0; i < arrayProveedor.length; i++) {
                            idProveedores.push(arrayProveedor[i].Proveedor);
                        }

                        log.debug('Calcular Fecha', 'Cantidad Resultados Dias Entrega : ' + arrayDiasEntregaProveedor.length);

                        // Por cada Proveedor Calcular la Fecha de Entrega
                        var fechaMayor = '';
                        var tieneFechaFija = false;
                        for (var i = 0; i < arrayProveedor.length; i++) {

                            var fechaServidor = new Date();

                            log.error('Calcular Fecha', 'Fecha Serv : ' + fechaServidor);

                            if (!stockPropio)
                                fechaServidor.setDate(fechaServidor.getDate() + 1);

                            log.error('Calcular Fecha', 'Fecha Serv 2 : ' + fechaServidor);

                            // Si la Fecha de Reparto es Superior a la Fecha Actual => Utilizar Fecha de Reparto
                            if (!utilities.isEmpty(arrayProveedor[i].FechaReparto)) {
                                var fechaRepartoDate = format.parse({
                                    value: arrayProveedor[i].FechaReparto,
                                    type: format.Type.DATE,
                                });

                                if (fechaRepartoDate > fechaServidor) {
                                    fechaServidor = fechaRepartoDate;
                                    tieneFechaFija = true;
                                }
                            }

                            var fechaString = format.format({
                                value: fechaServidor,
                                type: format.Type.DATE,
                                timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                            });

                            var fechaActual = format.parse({
                                value: fechaString,
                                type: format.Type.DATE
                            });

                            if (!tieneFechaFija) {

                                var diaActual = fechaActual.getDay();

                                log.error('Calcular Fecha', 'Dia Actual : ' + diaActual);

                                log.debug('Calcular Fecha', 'Proveedor : ' + arrayProveedor[i].Proveedor);
                                var resultDiasEntrega = arrayDiasEntregaProveedor.filter(function (obj) {
                                    return (obj.proveedor == arrayProveedor[i].Proveedor);
                                });

                                log.debug('Calcular Fecha', 'Dias Entrega Proveedor Tam : ' + resultDiasEntrega.length);

                                //lunes es 1
                                //martes es 2
                                //miercoles es 3
                                //jueves es 4
                                //viernes es 5
                                //var primerIndice = false;
                                var splice = 0;
                                var arrayOrdenadoEntregaProveedor = new Array();

                                var arrayDiasMenor = new Array();

                                for (var j = 0; j < resultDiasEntrega.length; j++) {
                                    //var indexActual = i;
                                    //var splice=1;
                                    /*var valorActual;
                                    var valorMayor;*/

                                    if (diaActual == resultDiasEntrega[j].codigoDiaJS) {
                                        arrayOrdenadoEntregaProveedor.unshift(resultDiasEntrega[j]);
                                        //primerIndice=true;
                                        splice = splice + 1;
                                    } else {

                                        if (diaActual > resultDiasEntrega[j].codigoDiaJS) {
                                            arrayOrdenadoEntregaProveedor.push(resultDiasEntrega[j]);
                                        } else {
                                            if (splice > 0) {
                                                arrayOrdenadoEntregaProveedor.splice(splice, 0, resultDiasEntrega[j]);
                                                splice = splice + 1;
                                            } else {
                                                arrayOrdenadoEntregaProveedor.unshift(resultDiasEntrega[j]);
                                                splice = splice + 1;
                                            }
                                        }

                                    }

                                    /*if (diaActual >= resultDiasEntrega[j].codigoDiaJS) {
                                        arrayDiasMenor.push(resultDiasEntrega[j]);
                                    }
                                    else{
                                        arrayOrdenadoEntregaProveedor.push(resultDiasEntrega[j]);
                                    }*/
                                }

                                arrayOrdenadoEntregaProveedor.concat(arrayDiasMenor);

                                log.error('Calcular Fecha', 'arrayOrdenadoEntregaProveedor: ' + JSON.stringify(arrayOrdenadoEntregaProveedor));

                                for (var k = 0; k < arrayOrdenadoEntregaProveedor.length; k++) {

                                    log.error('Calcular Fecha', 'arrayOrdenadoEntregaProveedor codigoDiaJS : ' + arrayOrdenadoEntregaProveedor[k].codigoDiaJS);
                                    var diffDay = arrayOrdenadoEntregaProveedor[k].codigoDiaJS - diaActual;
                                    var fechaBaseCalculo = new Date(fechaActual.getTime());

                                    log.error('Calcular Fecha', 'diffDay : ' + diffDay + ' linea: ' + k);

                                    if (diffDay >= 0) {
                                        fechaBaseCalculo.setDate(fechaBaseCalculo.getDate() + diffDay);
                                    } else {
                                        fechaBaseCalculo.setDate((fechaBaseCalculo.getDate() + 7) + diffDay);
                                    }

                                    log.error('Calcular Fecha', 'fechaBaseCalculo despues de diffDay : ' + fechaBaseCalculo);

                                    var resultFilter = arrayDiasNoLaborales.filter(function (obj) {
                                        return (obj.fecha.getTime() == fechaBaseCalculo.getTime());
                                    });

                                    if (resultFilter.length > 0) {
                                        if (k == arrayOrdenadoEntregaProveedor.length - 1) {
                                            k = -1;
                                            fechaActual.setDate(fechaActual.getDate() + 7);
                                        }
                                        continue;
                                    } else {

                                        /*var index = 0;
                                        do {
                                            if (index > 0) {
                                                fechaBaseCalculo.setDate(fechaBaseCalculo.getDate() + 1);
                                            } else {
                                                fechaBaseCalculo.setDate(fechaBaseCalculo.getDate() + parseInt(arrayOrdenadoEntregaProveedor[k].demoraProveedor));
                                            }

                                            var resultFilterConDemora = arrayDiasNoLaborales.filter(function(obj) {
                                                return (obj.fecha.getTime() == fechaBaseCalculo.getTime());
                                            });

                                            index = index + 1;

                                            log.error('Calcular Fecha', 'fechaBaseCalculo en do while : ' + fechaBaseCalculo);

                                        } while (resultFilterConDemora.length > 0)*/

                                        var diasTotales = 0;
                                        for (var b = 1; b <= parseInt(arrayOrdenadoEntregaProveedor[k].demoraProveedor); b++) {
                                            var fechaRecorrida = new Date(fechaBaseCalculo.getTime());
                                            //fechaRecorrida.setDate(newFechaDisponibilidad.getDate());

                                            fechaRecorrida.setDate(fechaBaseCalculo.getDate() + (diasTotales + 1));

                                            var resultFilter = arrayDiasNoLaborales.filter(function (obj) {
                                                return (obj.fecha.getTime() == fechaRecorrida.getTime());
                                            });

                                            //log.debug('NIVELES FILTER', 'obj.fecha.getTime()' + obj.fecha.getTime() +' fechaRecorrida.getTime(): '+ fechaRecorrida.getTime());

                                            if (!utilities.isEmpty(resultFilter) && resultFilter.length > 0) {
                                                b--;

                                            }

                                            diasTotales++;
                                        }

                                        fechaBaseCalculo.setDate(fechaBaseCalculo.getDate() + parseInt(diasTotales, 10));

                                        //objRespuesta.fechaBaseCalculo = fechaBaseCalculo;

                                        log.error('calculo de fecha', ' fechaBaseCalculo: ' + fechaBaseCalculo);
                                        if (utilities.isEmpty(fechaMayor)) {
                                            fechaMayor = fechaBaseCalculo;
                                        } else {
                                            if (fechaBaseCalculo > fechaMayor) {
                                                fechaMayor = fechaBaseCalculo;
                                            }
                                        }
                                        break;

                                    }

                                }
                            } else {
                                fechaMayor = fechaActual;
                            }

                        }

                        if (!utilities.isEmpty(fechaMayor)) {
                            objRespuesta.fechaBaseCalculo = fechaMayor;
                        } else {
                            var mensaje = 'Error Calculando Fecha de Entrega - Error : No se calcularon Fechas de Entregas para los Proveedores';
                            objRespuesta.error = true;
                            objRespuestaParcial = new Object();
                            objRespuestaParcial.codigo = 'RORV012';
                            objRespuestaParcial.mensaje = mensaje;
                            objRespuesta.detalle.push(objRespuestaParcial);
                            //objRespuesta.tipoError = 'RORV012';
                            //objRespuesta.descripcion = mensaje;
                            log.error('RORV012', mensaje);
                        }
                    } else {
                        var mensaje = 'Error Calculando Fecha de Entrega - Error : No se recibio la informacion de los dias de Pedido de los Proveedores';
                        objRespuesta.error = true;
                        objRespuestaParcial = new Object();
                        objRespuestaParcial.codigo = 'RORV013';
                        objRespuestaParcial.mensaje = mensaje;
                        objRespuesta.detalle.push(objRespuestaParcial);
                        //objRespuesta.tipoError = 'RORV014';
                        //objRespuesta.descripcion = mensaje;
                        log.error('RORV014', mensaje);
                    }
                } else {
                    var mensaje = 'Error Calculando Fecha de Entrega - Error : No se recibieron los ID de los Proveedores A Calcular las Fechas de Entrega';
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'RORV014';
                    objRespuestaParcial.mensaje = mensaje;
                    objRespuesta.detalle.push(objRespuestaParcial);
                    //objRespuesta.tipoError = 'RORV014';
                    //objRespuesta.descripcion = mensaje;
                    log.error('RORV014', mensaje);
                }
            } catch (e) {
                objRespuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'RORV011';
                objRespuestaParcial.mensaje = 'function calcularFecha: ' + e.message;
                objRespuesta.detalle.push(objRespuestaParcial);
                //objRespuesta.tipoError = 'RORV011';
                //objRespuesta.descripcion = 'function calcularFecha: ' + e.message;
                log.error('RORV011', 'function calcularFecha: ' + e.message);
            }

            log.audit('Calcular Fecha Entrega', 'FIN Proceso');

            return objRespuesta;
        }

        function crearOrdenVenta(rec, informacion, tipoOperacion) {
            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.message = "";
            objRespuesta.detalle = new Array();
            log.debug('crearOrdenVenta', 'informacion: ' + JSON.stringify(informacion));

            try {
                /************************************INICIO SE CREA ARREGLO DE ARTICULOS DE LA ORDEN DE VENTA PARA LUEGO PASARLO A SS************************************************************/
                var arrayArticulos = [];

                for (var k = 0; k < informacion.orden.length; k++) {
                    var o = new Object({})
                    o.articuloJSON = informacion.orden[k].articulo;

                    arrayArticulos.push(informacion.orden[k].articulo);

                }

                var arraySearchParams = new Array();
                var objParam = new Object();
                objParam.name = 'internalid';
                objParam.operator = 'ANYOF';
                objParam.values = arrayArticulos;
                arraySearchParams.push(objParam);

                var objResultSet = utilities.searchSavedPro('customsearch_3k_componentes_art', arraySearchParams);
                if (objResultSet.error) {
                    return objResultSet;
                }

                var articulo = objResultSet.objRsponseFunction.array; //array que contiene los articulos que vienen en la orden de venta
                log.debug('crearOrdenVenta Func', 'articulo array: ' + JSON.stringify(articulo));

                if (articulo.length > 0) {
                    var arrayComprobacionArticulos = [];
                    for (var t = 0; t < articulo.length; t++) {
                        var idInternoArticulo = articulo[t].internalid;

                        var filterComprobacionArticulos = arrayComprobacionArticulos.filter(function (id) {
                            return (id == idInternoArticulo);
                        });

                        log.debug('crearOrdenVenta Func', 'filterComprobacionArticulos: ' + JSON.stringify(filterComprobacionArticulos));
                        if (!utilities.isEmpty(filterComprobacionArticulos) && filterComprobacionArticulos.length > 0) {
                            continue;
                        } else {
                            arrayComprobacionArticulos.push(idInternoArticulo);
                        }
                    }

                    if (arrayComprobacionArticulos.length < arrayArticulos.length) {
                        objRespuesta.error = true;
                        objRespuestaParcial = new Object();
                        objRespuestaParcial.codigo = 'RORV015';
                        objRespuestaParcial.mensaje += 'No se pudo crear Orden de Venta debido a que no se encontró un artículo enviado';
                        objRespuesta.detalle.push(objRespuestaParcial);
                        //objRespuesta.tipoError = 'RORV015';
                        //objRespuesta.message += 'No se pudo crear Orden de Venta debido a que no se encontró un artículo enviado';
                        return objRespuesta;
                    }
                } else {
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'RORV016';
                    objRespuestaParcial.mensaje += 'No se pudo crear Orden de Venta debido a que no se encontraron los artículo enviados';
                    objRespuesta.detalle.push(objRespuestaParcial);
                    //objRespuesta.tipoError = 'RORV016';
                    //objRespuesta.message += 'No se pudo crear Orden de Venta debido a que no se encontraron los artículo enviados';
                    return objRespuesta;
                }

                /************************************FIN SE CREA ARREGLO DE ARTICULOS DE LA ORDEN DE VENTA PARA LUEGO PASARLO A SS************************************************************/

                /******************************* INICIO  DE TRANSFORMAR FECHA EN FORMATO DE URU Y FORMATO NETSUITE****************************************************/
                var fechaServidor = new Date();
                var fechaString = format.format({
                    value: fechaServidor,
                    type: format.Type.DATETIME,
                    timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                });
                var fecha = format.parse({
                    value: fechaString,
                    type: format.Type.DATE
                });
                /******************************* FIN DE TRANSFORMAR FECHA EN FORMATO DE URU Y FORMATO NETSUITE****************************************************/

                /********************************INICIO DECLARACIONES ARRAYS QUE ARMAN LAS LINEAS DE LA OV******************************************************************************************/
                var arrayOV = new Array();

                /********************************FIN DECLARACIONES ARRAYS******************************************************************************************/

                /***************************INICIO SE CREA ARREGLO DE COMPONENTES PARA LUEGO PASARLO A SS DE BUSQUEDA DE STOCK TERCEROS Y STOCK PROPIO************************************************************/

                /*****************************************INCIO FOR QUE RECORRE TODOS LOS ARTICULOS ENVIADOS EN EL JSON E INSERTA LAS LINEAS EN OV ************************************************************************/
                for (var i = 0; i < informacion.orden.length; i++) {
                    if (!utilities.isEmpty(informacion.orden[i].articulo) && !utilities.isEmpty(informacion.orden[i].importe)) {

                        var arrayLinea = new Array();
                        var articuloFilter = articulo.filter(function (obj) {

                            return (obj.internalid == informacion.orden[i].articulo);
                        });

                        var diferenciaStock = 0;

                        var objLinea = new Object();
                        objLinea.articulo = informacion.orden[i].articulo;
                        objLinea.moneda = informacion.orden[i].moneda;
                        //objLinea.impEnvio = informacion.orden[i].impEnvio;
                        //costoEnvio += parseFloat(informacion.orden[i].impEnvio, 10);
                        objLinea.estado = informacion.orden[i].estado;
                        objLinea.lugarRetiro = informacion.orden[i].lugarRetiro;
                        //objLinea.ciudad = informacion.orden[i].ciudad;
                        objLinea.barrio = informacion.orden[i].barrio;
                        objLinea.direccion = informacion.orden[i].direccion;
                        objLinea.fechaUtilizacion = informacion.orden[i].fechaUtilizacion;
                        //objLinea.comison = informacion.orden[i].comision;
                        objLinea.comisionServicio = informacion.orden[i].comision;
                        objLinea.fechaCreacion = fecha;
                        //objLinea.cantidadCuotas = informacion.orden[i].cantidadCuotas.toString();
                        objLinea.importe = informacion.orden[i].importe;
                        objLinea.apartamento = informacion.orden[i].apartamento;
                        objLinea.horaInicio = informacion.orden[i].horaInicio;
                        objLinea.horaFin = informacion.orden[i].horaFin;
                        objLinea.oficinaOrigen = informacion.orden[i].oficinaOrigen;
                        objLinea.pickUp = informacion.orden[i].pickUp;
                        objLinea.codigoPostal = informacion.orden[i].codigoPostal;
                        objLinea.bis = informacion.orden[i].bis;
                        objLinea.puerta = informacion.orden[i].puerta;
                        objLinea.entrega = informacion.orden[i].entrega;
                        objLinea.calle = informacion.orden[i].calle;
                        objLinea.nombreQuienRecibe = informacion.orden[i].nombreQuienRecibe;
                        objLinea.telQuienRecibe = informacion.orden[i].telQuienRecibe;
                        objLinea.oficinaDestino = informacion.orden[i].oficinaDestino;
                        objLinea.turno = informacion.orden[i].turno;
                        objLinea.ubicacion = informacion.ubicacion;
                        objLinea.isService = false;
                        objLinea.isChange = false;
                        objLinea.sitio = informacion.sitio;
                        objLinea.fechaTravel = informacion.orden[i].fechaTravel;
                        objLinea.impBruto = informacion.orden[i].impBruto;
                        objLinea.millasUtilizadas = informacion.orden[i].millasUtilizadas;
                        objLinea.importeMillas = informacion.orden[i].importeMillas;
                        objLinea.impUnitarioMillas = informacion.orden[i].impUnitarioMillas;
                        objLinea.impBrutoMillas = informacion.orden[i].impBrutoMillas;
                        objLinea.idDetalleOrdenMisBeneficios = informacion.orden[i].idDetalleOrdenMisBeneficios;
                        objLinea.tipoServicioUES = informacion.orden[i].tipoServicioUES;
                        objLinea.cantidad = informacion.orden[i].cantidad;

                        if (tipoOperacion == "CC")
                            objLinea.isChange = true;

                        arrayLinea.push(JSON.parse(JSON.stringify(objLinea)));
                        arrayOV.push(JSON.parse(JSON.stringify(objLinea)));

                        var sumAjustes = 0;
                        /******************************************INICIO ARMAR LINEAS DE OV CON EL ARRAY DE LINEAS DE OV  ARMADO ANTERIORMENTE**********************************/
                        for (var m = 0; m < arrayLinea.length; m++) {
                            log.debug('crearOrdenVenta', 'arrayLinea[m]: ' + JSON.stringify(arrayLinea[m]));
                            //log.audit('crearOrdenVenta','arrayLinea.cantidad: '+arrayLinea[m].cantidad.toString());
                            rec.selectNewLine({
                                sublistId: 'item'
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: arrayLinea[m].articulo
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                value: arrayLinea[m].cantidad.toString()
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_cantidad_ov',
                                value: arrayLinea[m].cantidad.toString()
                            });
                            //Sustituido por comision servicio
                            /*if (!utilities.isEmpty(arrayLinea[m].comison)) {
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_porcentaje_comision',
                                    value: arrayLinea[m].comison.toString()
                                });
                            }*/
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_moneda',
                                value: arrayLinea[m].moneda
                            });
                            if (!utilities.isEmpty(arrayLinea[m].impEnvio)) {
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_imp_envio',
                                    value: arrayLinea[m].impEnvio.toString()
                                });
                            }
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_apartamento',
                                value: arrayLinea[m].apartamento
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_codigo_postal',
                                value: arrayLinea[m].codigoPostal
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_bis',
                                value: arrayLinea[m].bis
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_numero_puerta',
                                value: arrayLinea[m].puerta
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_entrega',
                                value: arrayLinea[m].entrega
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_hora_inicio',
                                value: arrayLinea[m].horaInicio
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_hora_fin',
                                value: arrayLinea[m].horaFin
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_oficina_origen',
                                value: arrayLinea[m].oficinaOrigen
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_pickup',
                                value: arrayLinea[m].pickUp
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_lugar_retiro',
                                value: arrayLinea[m].lugarRetiro
                            });
                            /*rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_ciudad',
                                value: arrayLinea[m].ciudad
                            });*/
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_oficina_destino',
                                value: arrayLinea[m].oficinaDestino
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_barrio',
                                value: arrayLinea[m].barrio
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_direccion',
                                value: arrayLinea[m].direccion
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_fecha_entrega',
                                value: arrayLinea[m].fechaEntrega
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_calle',
                                value: arrayLinea[m].calle
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_fecha_creacion',
                                value: fecha
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_fecha_modificacion',
                                value: fecha
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                value: arrayLinea[m].importe.toString()
                            });
                            /*rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_cant_cuotas',
                                value: arrayLinea[m].cantidadCuotas
                            });*/
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_nombre_quien_recibe',
                                value: arrayLinea[m].nombreQuienRecibe
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_tel_quien_recibe',
                                value: arrayLinea[m].telQuienRecibe
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_importe_bruto_woow',
                                value: arrayLinea[m].impBruto.toString()
                            });

                            if (!utilities.isEmpty(arrayLinea[m].turno)) {
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_turno_envio',
                                    value: arrayLinea[m].turno
                                });
                            }

                            if (!utilities.isEmpty(arrayLinea[m].tipoServicioUES)) {
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_tipo_servicio_ues',
                                    value: arrayLinea[m].tipoServicioUES
                                });
                            }

                            if (!utilities.isEmpty(arrayLinea[m].fechaTravel)) {
                                rec.setCurrentSublistText({
                                    sublistId: 'item',
                                    fieldId: 'custcol_cseg_3k_fecha',
                                    text: arrayLinea[m].fechaTravel.toString()
                                });
                            }

                            if (!utilities.isEmpty(arrayLinea[m].millasUtilizadas)) {
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_millas_utilizadas',
                                    value: parseFloat(arrayLinea[m].millasUtilizadas, 10).toFixed(2).toString()
                                });
                            }

                            if (!utilities.isEmpty(arrayLinea[m].importeMillas)) {
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_imp_tot_millas',
                                    value: parseFloat(arrayLinea[m].importeMillas, 10).toFixed(2).toString()
                                });
                            }

                            if (!utilities.isEmpty(arrayLinea[m].impUnitarioMillas)) {
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_importe_unitario_millas',
                                    value: parseFloat(arrayLinea[m].impUnitarioMillas, 10).toFixed(2).toString()
                                });
                            }

                            if (!utilities.isEmpty(arrayLinea[m].impBrutoMillas)) {
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_importe_bruto_millas_woow',
                                    value: parseFloat(arrayLinea[m].impBrutoMillas, 10).toFixed(2).toString()
                                });
                            }

                            if (!utilities.isEmpty(arrayLinea[m].mainCategory)) {
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_cseg_3k_main_cat',
                                    value: arrayLinea[m].mainCategory
                                });
                            }

                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_id_detalle_orden_misbe',
                                value: arrayLinea[m].idDetalleOrdenMisBeneficios
                            });

                            if (!utilities.isEmpty(arrayLinea[m].comisionServicio)) {
                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_comision',
                                    value: arrayLinea[m].comisionServicio.toString()
                                });
                            }

                            var taxcode = rec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'taxcode'
                            });


                            rec.commitLine({
                                sublistId: 'item'
                            });

                        }
                        log.audit('crearOrdenVenta', 'FIN insertar linea OV lineacod: 2083');
                        /******************************************FIN ARMAR LINEAS DE OV CON EL ARRAY DE LINEAS DE OV  ARMADO ANTERIORMENTE**********************************/
                    } else {
                        if (utilities.isEmpty(informacion.orden[i].articulo)) {
                            objRespuesta.error = true;
                            objRespuestaParcial = new Object();
                            objRespuestaParcial.codigo = 'RORV005';
                            objRespuestaParcial.mensaje += 'Campo Articulo vacío en la linea: ' + i.toString();
                            objRespuesta.detalle.push(objRespuestaParcial);
                            //objRespuesta.tipoError = 'RORV005';
                            //objRespuesta.message += 'Campo Articulo vacío en la linea: ' + i.toString();
                        }
                        if (utilities.isEmpty(informacion.orden[i].importe)) {
                            objRespuesta.error = true;
                            //objRespuesta.tipoError = 'RORV005';
                            //objRespuesta.message += 'Campo Importe vacío en la linea:' + i.toString();
                            objRespuestaParcial = new Object();
                            objRespuestaParcial.codigo = 'RORV005';
                            objRespuestaParcial.mensaje += 'Campo Importe vacío en la linea:' + i.toString();
                            objRespuesta.detalle.push(objRespuestaParcial);
                        }

                    }
                }
                /*****************************************FIN FOR QUE RECORRE TODOS LOS ARTICULOS ENVIADOS EN EL JSON E INSERTA LAS LINEAS EN OV ************************************************************************/

                /******************************************INICIO GUARDAR RECORD OV*************************************************************************************/
                if (!objRespuesta.error) {

                    objRespuesta.idRec = rec.save();

                    var respuesta = new Object();
                    respuesta.error = false;
                    respuesta.detalle = [];
                    respuesta.idOV = objRespuesta.idRec;
                    respuesta.numeroOV = '';
                    log.audit('crearOrdenVenta', 'idRec: ' + objRespuesta.idRec);

                    if (!utilities.isEmpty(objRespuesta.idRec)) {
                        var objFieldLookUpOV = search.lookupFields({
                            type: 'transaction',
                            id: objRespuesta.idRec,
                            columns: [
                                'tranid'
                            ]
                        });

                        respuesta.numeroOV = objFieldLookUpOV.tranid;

                    }

                    var razonSocialUtilizar = '';
                    var direccionUtilizar = '';
                    var ciudadUtilizar = '';

                    if (!utilities.isEmpty(informacion.razonSocial)) {
                        razonSocialUtilizar = informacion.razonSocial;
                    }
                    if (!utilities.isEmpty(informacion.direccionFactura)) {
                        direccionUtilizar = informacion.direccionFactura;
                    }
                    if (!utilities.isEmpty(informacion.ciudadFactura)) {
                        ciudadUtilizar = informacion.ciudadFactura;
                    }

                    log.audit('crearOrdenVenta', 'razonSocialUtilizar: ' + razonSocialUtilizar + ', direccionUtilizar: ' + direccionUtilizar + ', ciudadUtilizar: ' + ciudadUtilizar);

                    var idOVActualizada = record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: objRespuesta.idRec,
                        values: {
                            billattention: razonSocialUtilizar,
                            billaddr1: direccionUtilizar,
                            billcity: ciudadUtilizar
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });

                    log.audit('crearOrdenVenta', 'idOVActualizada: ' + idOVActualizada);

                }

            } catch (e) {
                objRespuesta.error = true;
                objRespuestaParcial = new Object({});
                objRespuestaParcial.codigo = 'RORV004';
                objRespuestaParcial.mensaje = 'function crearOrdenVenta: ' + e.message;
                objRespuesta.detalle.push(objRespuestaParcial);
                //objRespuesta.tipoError = 'RORV004';
                //objRespuesta.descripcion = 'function crearOrdenVenta: ' + e.message;
                log.error('RORV004', 'funtion crearOrdenVenta: ' + e.message);
            }

            log.audit('DEBUG', 'Fin Proceso Crear Orden de Venta');
            if (!objRespuesta.error) {
                return respuesta;
            } else {
                return objRespuesta;
            }
        }

        function consultarDiasNoLoborables() {
            var respuesta = new Object();
            respuesta.error = false;
            //respuesta.tipoError = '';
            //respuesta.mensaje = '';
            respuesta.arrayDiasNoLaborables = new Array();
            respuesta.detalle = new Array();

            // INICIO - Obtener Array de Dias No Laborable
            var objResultSet = utilities.searchSaved('customsearch_3k_calendario_dias_no_lab');
            if (objResultSet.error) {
                respuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'SROV018';
                objRespuestaParcial.mensaje = 'Error Obteniendo Calendario de Dias No Laborables - Tipo Error : ' + objResultSet.tipoError + ' - Descripcion : ' + objResultSet.descripcion;;
                respuesta.detalle.push(objRespuestaParcial);
                //respuesta.tipoError = 'SROV018';
                //respuesta.mensaje = 'Error Obteniendo Calendario de Dias No Laborables - Tipo Error : ' + objResultSet.tipoError + ' - Descripcion : ' + objResultSet.descripcion;;
                return respuesta;
            }

            var resultSet = objResultSet.objRsponseFunction.result;
            var resultSearch = objResultSet.objRsponseFunction.search;

            for (var l = 0; !utilities.isEmpty(resultSet) && l < resultSet.length; l++) {

                var obj = new Object();
                obj.indice = l;
                obj.idInterno = resultSet[l].getValue({
                    name: resultSearch.columns[0]
                });
                obj.nombre = resultSet[l].getValue({
                    name: resultSearch.columns[1]
                });
                obj.fecha = resultSet[l].getValue({
                    name: resultSearch.columns[2]
                });

                if (!utilities.isEmpty(obj.fecha)) {
                    obj.fecha = format.parse({
                        value: obj.fecha,
                        type: format.Type.DATE,
                    });
                }

                respuesta.arrayDiasNoLaborables.push(obj);
            }

            return respuesta;

            // FIN - Obtener Array de Dias No Laborables
        }

        function generarCAE(arrayFacturas, subsidiaria) {
            var respuesta = new Object({});
            respuesta.error = false;
            respuesta.msj = "";
            respuesta.detalle = new Array();
            var mensaje;
            try {

                var objResult = utilities.searchSavedPro('customsearch_3k_config_fact_electronica');
                if (objResult.error) {
                    return objResult;
                }

                var resultSet = objResult.objRsponseFunction.result;
                var resulSearch = objResult.objRsponseFunction.search;

                //var array = new Array();

                if (!utilities.isEmpty(resultSet) && resultSet.length > 0) {
                    //for (var i = 0; i < resultSet.length; i++) {
                    var obj = new Object({});
                    obj.middlewareURL = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_link'
                    });
                    obj.usuario = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_usuario'
                    });
                    obj.passwordEncriptada = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_pasw_encriptada'
                    });
                    obj.password = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_password'
                    });
                    obj.URLRESTSolicitud = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_url_r_solicitud'
                    });
                    obj.URLRESTActualizacion = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_url_r_actualizar'
                    });
                    obj.URLRESTEmail = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_url_r_env_email'
                    });
                    obj.URLRESTGrabarCabLog = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_url_r_cab_log'
                    });
                    obj.URLRESTGrabarDetLog = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_url_r_det_log'
                    });
                    obj.generarCaeAutomatico = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_generar_cae_auto'
                    });
                    obj.rol = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_rol'
                    });
                    obj.cuenta = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_cuenta'
                    });
                    obj.margenError = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_margen_error_mon'
                    });
                    obj.nombreSistemaFacturacion = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_nom_sist_fact'
                    });
                    obj.razonSocial = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_razon_social'
                    });
                    obj.RUTEmpresa = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_ruc_empresa'
                    });
                    obj.tipoNegocio = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_tipo_negocio'
                    });
                    obj.versionSistFact = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_ver_sist_fact'
                    });
                    obj.RUCEmisor = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_ruc_emisor'
                    });
                    obj.razonSocialEmisor = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_r_social_emisor'
                    });
                    obj.nomComercialEmisor = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_nom_comercial'
                    });
                    obj.giroNegocioEmisor = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_giro_negocio'
                    });
                    obj.correoEmisor = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_correo_elec'
                    });
                    obj.domicilioEmisor = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_domicilio_fiscal'
                    });
                    obj.ciudadEmisor = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_ciudad'
                    });
                    obj.departamentoEmisor = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_departamento'
                    });
                    obj.URLGateway = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_url_gateway'
                    });
                    obj.URLServicioFirma = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_serv_firma_comp'
                    });
                    obj.URLServicioConfFirma = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_url_serv_c_firma'
                    });
                    obj.telefonoEmisor = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_telefono'
                    });
                    obj.emailUsuario = resultSet[0].getValue({
                        name: 'custrecord_l598_conf_fe_corr_env_email'
                    });

                    //}
                    //
                    /*if (!utilities.isEmpty(obj.password)) {
                        var informacionDesencriptada = nlapiDecrypt(password, "aes");
                        if (!utilities.isEmpty(informacionDesencriptada)) {
                            obj.password = informacionDesencriptada;
                        } else {
                            obj.password = "";
                        }
                    }*/

                    log.error('generarCAE', 'URU - Generar CAE1');


                    if ((obj.middlewareURL.length != 0 || !utilities.isEmpty(obj.middlewareURL)) && !utilities.isEmpty(obj.usuario) && !utilities.isEmpty(obj.password) &&
                        !utilities.isEmpty(obj.URLRESTSolicitud) && !utilities.isEmpty(obj.URLRESTActualizacion) && !utilities.isEmpty(obj.URLRESTEmail) && !utilities.isEmpty(obj.URLRESTGrabarCabLog) &&
                        !utilities.isEmpty(obj.URLRESTGrabarDetLog) && !utilities.isEmpty(obj.cuenta) && !utilities.isEmpty(obj.rol) && obj.rol > 0 && !utilities.isEmpty(obj.margenError) &&
                        !utilities.isEmpty(obj.nombreSistemaFacturacion) && !utilities.isEmpty(obj.razonSocial) && !utilities.isEmpty(obj.RUTEmpresa) &&
                        !utilities.isEmpty(obj.emailUsuario) && !utilities.isEmpty(obj.URLGateway) &&
                        !utilities.isEmpty(obj.URLServicioFirma) && !utilities.isEmpty(obj.URLServicioConfFirma)) {

                        var url = obj.middlewareURL;

                        var urlSolicitudFinal = null;
                        var urlActualizarFinal = null;
                        var urlEmailFinal = null;
                        var urlLogCabeceraFinal = null;
                        var urlLogDetalleFinal = null;
                        var postStr = null;

                        urlSolicitudFinal = encodeURIComponent(obj.URLRESTSolicitud);
                        urlActualizarFinal = encodeURIComponent(obj.URLRESTActualizacion);
                        urlEmailFinal = encodeURIComponent(obj.URLRESTEmail);
                        urlLogCabeceraFinal = encodeURIComponent(obj.URLRESTGrabarCabLog);
                        urlLogDetalleFinal = encodeURIComponent(obj.URLRESTGrabarDetLog);
                        urlGatewayFinal = encodeURIComponent(obj.URLGateway);
                        urlServicioFirmaFinal = encodeURIComponent(obj.URLServicioFirma);
                        urlServicioConfFirmaFinal = encodeURIComponent(obj.URLServicioConfFirma);

                        var recId = arrayFacturas.toString();
                        recId = recId.replace(/\s+/g, '');

                        postStr = '<?xml version="1.0" encoding="utf-8"?>' +
                            '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
                            '<soap:Body>' +
                            '<URUFESolicitarCAE xmlns="http://tempuri.org/">' +
                            '<idRegistro>' + recId + '</idRegistro>' +
                            '<usuario>' + obj.usuario + '</usuario>' +
                            '<password>' + obj.password + '</password>' +
                            '<cuenta>' + obj.cuenta + '</cuenta>' +
                            '<subsidiaria>' + subsidiaria + '</subsidiaria>' +
                            '<urlSolicitud>' + urlSolicitudFinal + '</urlSolicitud>' +
                            '<urlActualizar>' + urlActualizarFinal + '</urlActualizar>' +
                            '<rol>' + obj.rol + '</rol>' +
                            '<emailUsuario>' + obj.emailUsuario + '</emailUsuario>' +
                            '<urlEmail>' + urlEmailFinal + '</urlEmail>' +
                            '<urlActualizarCabLOG>' + urlLogCabeceraFinal + '</urlActualizarCabLOG>' +
                            '<urlActualizarDetLOG>' + urlLogDetalleFinal + '</urlActualizarDetLOG>' +
                            '<margenError>' + obj.margenError + '</margenError>' +
                            '<tipoNegocio>' + obj.tipoNegocio + '</tipoNegocio>' +
                            '<nomSistFact>' + obj.nombreSistemaFacturacion + '</nomSistFact>' +
                            '<razonSocial>' + obj.razonSocial + '</razonSocial>' +
                            '<RUTEmpresa>' + obj.RUTEmpresa + '</RUTEmpresa>' +
                            '<versionSistFact>' + obj.versionSistFact + '</versionSistFact>' +
                            '<RUCEmisor>' + obj.RUCEmisor + '</RUCEmisor>' +
                            '<razonSocialEmisor>' + obj.razonSocialEmisor + '</razonSocialEmisor>' +
                            '<nomComercialEmisor>' + obj.nomComercialEmisor + '</nomComercialEmisor>' +
                            '<giroNegocioEmisor>' + obj.giroNegocioEmisor + '</giroNegocioEmisor>' +
                            '<correoEmisor>' + obj.correoEmisor + '</correoEmisor>' +
                            '<domicilioEmisor>' + obj.domicilioEmisor + '</domicilioEmisor>' +
                            '<ciudadEmisor>' + obj.ciudadEmisor + '</ciudadEmisor>' +
                            '<departamentoEmisor>' + obj.departamentoEmisor + '</departamentoEmisor>' +
                            '<telefonoEmisor>' + obj.telefonoEmisor + '</telefonoEmisor>' +
                            '<urlGateway>' + urlGatewayFinal + '</urlGateway>' +
                            '<urlServicioFirma>' + urlServicioFirmaFinal + '</urlServicioFirma>' +
                            '<urlServicioConfFirma>' + urlServicioConfFirmaFinal + '</urlServicioConfFirma>' +
                            '</URUFESolicitarCAE>' +
                            '</soap:Body>' +
                            '</soap:Envelope>';

                        var header = new Array();
                        header['Content-Type'] = 'text/xml; charset=utf-8';

                        //var response = nlapiRequestURL(url, postStr, header);

                        log.error('generarCAE', 'URU - Generar CAE2');

                        var response = http.post({
                            //method: http.Method.GET,
                            url: url,
                            body: postStr,
                            headers: header
                        });

                        log.error('generarCAE', 'URU - Generar CAE3');

                        var mensajeAdicional = '';
                        var errorEnvio = true;

                        if (!utilities.isEmpty(response)) {
                            log.error('generarCAE', 'URU - Generar CAE - Codigo : ' + response.code);
                            if (response.code == 200) { // OK
                                if (response.body != '') {
                                    mensaje = response.body;
                                    log.error('generarCAE', 'URU - Generar CAE - Mensaje : ' + mensaje);
                                    if (!utilities.isEmpty(mensaje) && mensaje.length > 0) {

                                        var posicionInicialRespuesta = (mensaje.indexOf("-INICIORESPUESTAFE-"));
                                        var posicionFinalRespuesta = (mensaje.indexOf("-INICIORESPUESTAFE-"));

                                        if (!utilities.isEmpty(posicionInicialRespuesta) && !isNaN(posicionInicialRespuesta) && parseInt(posicionInicialRespuesta, 10) > 0) {
                                            if (!utilities.isEmpty(posicionFinalRespuesta) && !isNaN(posicionFinalRespuesta) && parseInt(posicionFinalRespuesta, 10) > 0 && posicionFinalRespuesta < mensaje.length) {
                                                var error = mensaje[posicionInicialRespuesta + 19];
                                                if (!utilities.isEmpty(error)) {
                                                    if (error == 'N')
                                                        errorEnvio = false;
                                                    else {
                                                        var mensajeAux = mensaje.substr((posicionInicialRespuesta + 21), (posicionFinalRespuesta - (posicionInicialRespuesta + 21)));
                                                        if (!utilities.isEmpty(mensajeAux)) {
                                                            mensajeAdicional = mensajeAux;
                                                        } else {
                                                            mensajeAdicional = "Error de Conexion Con el Middleware TAFACE";
                                                        }
                                                    }
                                                } else {
                                                    mensajeAdicional = "No se recibio informacion del estado de Conexion Con el Middleware TAFACE en la Respuesta";
                                                }

                                            } else {
                                                mensajeAdicional = "No se recibio informacion de Respuesta Final de Conexion Con el Middleware TAFACE";
                                            }
                                        } else {
                                            mensajeAdicional = "No se recibio informacion de Respuesta Inicial de Conexion Con el Middleware TAFACE";
                                        }
                                    } else {
                                        mensajeAdicional = "El cuerpo de la respuesta de Conexion Con el Middleware TAFACE recibida fue vacio";
                                    }
                                } else {
                                    mensajeAdicional = "No se recibio el cuerpo de la Respuesta de Conexion Con el Middleware TAFACE";
                                }
                            } else {
                                mensajeAdicional = "Error de Conexion Con el Middleware TAFACE - Codigo Error : " + response.getCode();
                            }
                        } else {
                            mensajeAdicional = "No se recibio Respuesta de Conexion Con el Middleware TAFACE";
                        }

                        if (errorEnvio) {

                            mensaje = 'Error Conectando con Servicio de Generacion de CAE - ';
                            mensaje = mensaje + mensajeAdicional;
                            log.error('generarCAE', 'URU - Generar CAE' + mensaje);
                            objrespuestaParcial = new Object();
                            objrespuestaParcial.codigo = 'RFAC004';
                            objrespuestaParcial.mensaje = mensaje;
                            respuesta.detalle.push(objrespuestaParcial);
                            //respuesta.msj = mensaje;
                            //respuesta.tipoError = 'RFAC004';
                            respuesta.error = true;
                            return respuesta;
                        }


                    } else {
                        //No se encuentran Configurados Campos Requeridos del Middleware de Factura Electronica
                        mensaje = 'No se encuentran Configurados los siguientes Campos Requeridos de la Configuracion del Middleware de Factura Electronica : ';

                        if ((obj.middlewareURL.length == 0 || utilities.isEmpty(obj.middlewareURL)))
                            mensaje = mensaje + "URL del Middleware de Factura Electronica / ";
                        if (utilities.isEmpty(obj.usuario))
                            mensaje = mensaje + "Usuario Para la conexion con el Middleware de Factura Electronica / ";
                        if (utilities.isEmpty(obj.password))
                            mensaje = mensaje + "Password Para la conexion con el Middleware de Factura Electronica / ";
                        if (utilities.isEmpty(obj.emailUsuario))
                            mensaje = mensaje + "Email del Usuario / ";
                        if (utilities.isEmpty(obj.URLRESTSolicitud))
                            mensaje = mensaje + "URL del RestLet utilizado para la Solicitud de las Transacciones / ";
                        if (utilities.isEmpty(obj.URLRESTActualizacion))
                            mensaje = mensaje + "URL del RestLet utilizado para la Actualizacion de las Transacciones / ";
                        if (utilities.isEmpty(obj.URLRESTEmail))
                            mensaje = mensaje + "URL del RestLet utilizado para el Envio del Email de la Finalizacion del Proceso / ";
                        if (utilities.isEmpty(obj.URLRESTGrabarCabLog))
                            mensaje = mensaje + "URL del RestLet utilizado para Grabar la Cabecera del Log / ";
                        if (utilities.isEmpty(obj.URLRESTGrabarDetLog))
                            mensaje = mensaje + "URL del RestLet utilizado para Grabar el Detalle del Log / ";
                        if (utilities.isEmpty(obj.cuenta))
                            mensaje = mensaje + "Cuenta de NetSuite / ";
                        if (obj.rol == null || obj.rol == 0)
                            mensaje = mensaje + "Rol del Usuario utilizado Para la conexion con el Middleware de Factura Electronica / ";
                        if (utilities.isEmpty(obj.margenError))
                            mensaje = mensaje + "Monto de Margen de Error Permitido para enviar la Transaccion a la DGI / ";
                        if (utilities.isEmpty(obj.nombreSistemaFacturacion))
                            mensaje = mensaje + "Nombre del Sistema de Facturacion / ";
                        if (utilities.isEmpty(obj.razonSocial))
                            mensaje = mensaje + "Razon Social de la Empresa / ";
                        if (utilities.isEmpty(obj.RUTEmpresa))
                            mensaje = mensaje + "RUT de la Empresa / ";
                        if (utilities.isEmpty(obj.URLGateway))
                            mensaje = mensaje + "Direccion URL del Gateway / ";
                        if (utilities.isEmpty(obj.URLServicioFirma))
                            mensaje = mensaje + "Direccion URL del WebService de Firma de Comprobantes / ";
                        if (utilities.isEmpty(obj.URLServicioConfFirma))
                            mensaje = mensaje + "Direccion URL del WebService de Confirmacion de Firma de Comprobantes / ";

                        log.error('generarCAE', 'URU - Generar CAE' + mensaje);
                        objrespuestaParcial = new Object();
                        objrespuestaParcial.codigo = 'RFAC005';
                        objrespuestaParcial.mensaje = mensaje;
                        respuesta.detalle.push(objrespuestaParcial);
                        //respuesta.msj = mensaje;
                        respuesta.error = true;
                        //respuesta.tipoError = 'RFAC005';
                        return respuesta;
                    }
                } else {
                    //No Se Encuentra configurado el Middleware de Factura Electronica
                    mensaje = 'No Se Encuentra configurado el Middleware de Factura Electronica';

                    log.error('generarCAE', 'URU - Generar CAE' + mensaje);
                    objrespuestaParcial = new Object();
                    objrespuestaParcial.codigo = 'RFAC006';
                    objrespuestaParcial.mensaje = mensaje;
                    respuesta.detalle.push(objrespuestaParcial);
                    //respuesta.msj = mensaje;
                    respuesta.error = true;
                    //respuesta.tipoError = 'RFAC006';
                    return respuesta;
                }

            } catch (e) {
                mensaje = "Excepcion Invocando al Middleware TA-FACE para en Envio de las Transacciones A Procesar - Excepcion : " + e.message;
                log.error('generarCAE', 'URU - Generar CAE' + mensaje);
                objrespuestaParcial = new Object();
                objrespuestaParcial.codigo = 'RFAC007';
                objrespuestaParcial.mensaje = mensaje;
                respuesta.detalle.push(objrespuestaParcial);
                //respuesta.msj = mensaje;
                respuesta.error = true;
                //respuesta.tipoError = 'RFAC007';
                return respuesta;
            }

            return respuesta;
        }

        function crearDepositos(arrayOV, pago) {

            var recordId = '';
            try {
                var respuesta = new Object();
                respuesta.idOV = '';
                respuesta.idOV = arrayOV[0].idOV;
                respuesta.idCliente = arrayOV[0].idCliente;
                respuesta.error = false;
                respuesta.depositos = new Array();
                respuesta.detalle = new Array();

                arrayMediosPagoMoneda = new Array();
                arrayCuentasClearing = new Array();
                arrayMonedasSubsidiarias = new Array();
                tiposCambios = new Array();

                //respuesta.cupones = new Array();

                //respuesta.detalle = new Array();

                // INICIO - Obtener Cuenta Contable A Utilizar para la Moneda del Pago
                /*var filtrosMedioPagoMoneda = new Array();

                var fechaServidor = new Date();

                var fechaLocal = format.format({
                    value: fechaServidor,
                    type: format.Type.DATE,
                    timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                });

                var filtroFechaDesde = new Object();
                filtroFechaDesde.name = 'custrecord_3k_medios_pago_f_ini';
                filtroFechaDesde.operator = 'ONORBEFORE';
                filtroFechaDesde.values = [fechaLocal];
                filtrosMedioPagoMoneda.push(filtroFechaDesde);

                var filtroFechaHasta = new Object();
                filtroFechaHasta.name = 'custrecord_3k_medios_pago_f_fin';
                filtroFechaHasta.operator = 'ONORAFTER';
                filtroFechaHasta.values = [fechaLocal];
                filtrosMedioPagoMoneda.push(filtroFechaHasta);

                var searchMediosPagoMoneda = utilities.searchSavedPro('customsearch_3k_medios_pago_mon', filtrosMedioPagoMoneda);*/

                var searchMediosPagoMoneda = utilities.searchSavedPro('customsearch_3k_medios_pago_mon');

                if (!utilities.isEmpty(searchMediosPagoMoneda) && searchMediosPagoMoneda.error == false) {
                    if (!utilities.isEmpty(searchMediosPagoMoneda.objRsponseFunction.result) && searchMediosPagoMoneda.objRsponseFunction.result.length > 0) {
                        var resultSet = searchMediosPagoMoneda.objRsponseFunction.result;
                        var resultSearch = searchMediosPagoMoneda.objRsponseFunction.search;
                        for (var i = 0; i < resultSet.length; i++) {
                            var infoMedioPagoMon = new Object();
                            infoMedioPagoMon.sitioWeb = resultSet[i].getValue({
                                name: resultSearch.columns[3]
                            });
                            infoMedioPagoMon.formaPago = resultSet[i].getValue({
                                name: resultSearch.columns[4]
                            });
                            infoMedioPagoMon.cantidadCuotas = resultSet[i].getValue({
                                name: resultSearch.columns[5]
                            });
                            infoMedioPagoMon.moneda = resultSet[i].getValue({
                                name: resultSearch.columns[10]
                            });
                            infoMedioPagoMon.cuenta = resultSet[i].getValue({
                                name: resultSearch.columns[11]
                            });
                            infoMedioPagoMon.idInterno = resultSet[i].getValue({
                                name: resultSearch.columns[0]
                            });
                            arrayMediosPagoMoneda.push(infoMedioPagoMon);

                        }

                    } else {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'RDEP031';
                        respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : Error Consultando Medio de Pagos';
                        respuesta.detalle.push(respuestaParcial);
                    }
                } else {
                    if (utilities.isEmpty(searchMediosPagoMoneda)) {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'RDEP032';
                        respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se recibio Respuesta de la Busqueda de Medio de Pagos';
                        respuesta.detalle.push(respuestaParcial);
                    } else {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'RDEP033';
                        respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Encontraron Medios de Pagos';
                        respuesta.detalle.push(respuestaParcial);
                    }
                }

                // FIN - Obtener Cuenta Contable A Utilizar para la Moneda del Pago

                // INICIO - Obtener Cuenta Contable Clearing

                var searchCuentaClearing = utilities.searchSavedPro('customsearch_3k_configuracion_ctas_clear');

                if (!utilities.isEmpty(searchCuentaClearing) && searchCuentaClearing.error == false) {
                    if (!utilities.isEmpty(searchCuentaClearing.objRsponseFunction.result) && searchCuentaClearing.objRsponseFunction.result.length > 0) {
                        var resultSet = searchCuentaClearing.objRsponseFunction.result;
                        var resultSearch = searchCuentaClearing.objRsponseFunction.search;
                        for (var i = 0; i < resultSet.length; i++) {
                            // INICIO - Obtener Informacion Costo de Medio de Pago
                            var infoCuentaClearing = new Object();
                            infoCuentaClearing.subsidiaria = resultSet[i].getValue({
                                name: resultSearch.columns[1]
                            });
                            infoCuentaClearing.moneda = resultSet[i].getValue({
                                name: resultSearch.columns[2]
                            });
                            infoCuentaClearing.cuenta = resultSet[i].getValue({
                                name: resultSearch.columns[3]
                            });
                            arrayCuentasClearing.push(infoCuentaClearing);
                        }
                    } else {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'RDEP034';
                        respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : Error Consultando Cuentas de Clearing';
                        respuesta.detalle.push(respuestaParcial);
                    }
                } else {
                    if (utilities.isEmpty(searchCuentaClearing)) {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'RDEP035';
                        respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se recibio Respuesta de la Busqueda de Cuentas de Clearing';
                        respuesta.detalle.push(respuestaParcial);
                    } else {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'RDEP036';
                        respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Encontraron Cuentas de Clearing';
                        respuesta.detalle.push(respuestaParcial);
                    }
                }
                // FIN - Obtener Cuenta Contable Clearing

                // INICIO - Obtener Moneda Subsidiaria

                var searchMonedaSubsidiaria = utilities.searchSavedPro('customsearch_3k_monedas_base_sub');

                if (!utilities.isEmpty(searchMonedaSubsidiaria) && searchMonedaSubsidiaria.error == false) {
                    if (!utilities.isEmpty(searchMonedaSubsidiaria.objRsponseFunction.result) && searchMonedaSubsidiaria.objRsponseFunction.result.length > 0) {
                        var resultSet = searchMonedaSubsidiaria.objRsponseFunction.result;
                        var resultSearch = searchMonedaSubsidiaria.objRsponseFunction.search;
                        for (var i = 0; i < resultSet.length; i++) {
                            var infoMonedaSubsidiaria = new Object();
                            infoMonedaSubsidiaria.subsidiaria = resultSet[i].getValue({
                                name: resultSearch.columns[0]
                            });
                            infoMonedaSubsidiaria.moneda = resultSet[i].getValue({
                                name: resultSearch.columns[2]
                            });
                            arrayMonedasSubsidiarias.push(infoMonedaSubsidiaria);
                        }

                    } else {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'RDEP037';
                        respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : Error Consultando Monedas Base de las Subsidiarias';
                        respuesta.detalle.push(respuestaParcial);
                    }
                } else {
                    if (utilities.isEmpty(searchMonedaSubsidiaria)) {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'RDEP038';
                        respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se recibio Respuesta de Monedas Principales por Subsidiarias';
                        respuesta.detalle.push(respuestaParcial);
                    } else {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'RDEP039';
                        respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se encontraron Monedas Principales por Subsidiarias';
                        respuesta.detalle.push(respuestaParcial);
                    }
                }

                //INCIO OBTENER TIPOS CAMBIOS -- ANTONY AGREGADO

                var objResultSet = utilities.searchSavedPro('customsearch_3k_tipos_cambios');
                if (objResultSet.error == false) {

                    log.audit('result search tipos cambio', JSON.stringify(objResultSet));

                    tiposCambios = objResultSet.objRsponseFunction.array;

                } else {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'RDEP050';
                    respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : Consultando Busqueda de Tipos de Cambio';
                    respuesta.detalle.push(respuestaParcial);
                }

                //FIN OBTENER TIPOS CAMBIOS

                if (respuesta.error == false) {
                    // FIN - Obtener Moneda Subsidiaria


                    //respuesta.formaPago = informacion.formaPago;
                    //respuesta.importePago = informacion.importePago;
                    // INICIO Generar Deposito Cliente
                    for (var i = 0; i < pago.length; i++) {

                        log.audit('Cobranza Cliente', 'ID Orden de Venta : ' + arrayOV[0].idOV + ' - ID Cliente : ' + arrayOV[0].idCliente + ' - Forma de Pago : ' + pago[i].formaPago + ' - Importe Pago : ' + pago[i].importePago);

                        var monedaOV = '';
                        var tipoCambioOV = '';
                        var cuentaContable = '';
                        var subsidiariaPago = '';
                        var monedaPrincipalSubsidiaria = '';
                        var cuentaClearing = '';
                        var sitioWeb = '';
                        var cuentaFinal = '';

                        var formaPago = pago[i].formaPago;
                        var importePago = parseFloat(pago[i].importePago, 10);
                        var monedaPago = arrayOV[0].monedaPago;
                        var tipoCambioPago = arrayOV[0].tipoCambioPago;
                        if (!utilities.isEmpty(tipoCambioPago)) {
                            tipoCambioPago = parseFloat(tipoCambioPago, 10);
                        }
                        //var cantidadMillas = pago[i].cantidadMillas;
                        //var tipoCambioMillas = pago[i].tipoCambioMillas;
                        /*if (!utilities.isEmpty(tipoCambioMillas)) {
                            tipoCambioMillas = parseFloat(tipoCambioMillas, 10);
                        }*/
                        //var tipoCambioOficial = pago[i].tipoCambioPago;
                        /*var tipoCambioOficial = pago[i].tipoCambioOficial;
                        if (!utilities.isEmpty(tipoCambioOficial)) {
                            tipoCambioOficial = parseFloat(tipoCambioOficial, 10);
                        }*/
                        // var transactionID = pago[i].transactionID;
                        var cantidadCuotasPago = pago[i].cantidadCuotas;


                        var idMedioPagoFinal = '';

                        var objRecordDeposit = record.create({
                            type: record.Type.CUSTOMER_DEPOSIT,
                            isDynamic: true
                        });

                        objRecordDeposit.setValue({
                            fieldId: 'customer',
                            value: respuesta.idCliente,
                            ignoreFieldChange: false,
                            fireSlavingSync: true
                        });

                        objRecordDeposit.setValue({
                            fieldId: 'currency',
                            value: monedaPago
                        });

                        /*var tipoCambioOficial = objRecordDeposit.getValue({
                            fieldId: 'exchangerate'
                        });

                        if (!utilities.isEmpty(tipoCambioOficial)) {
                            tipoCambioOficial = parseFloat(tipoCambioOficial, 10);
                        }*/

                        /*var objFieldLookUpMoneda = search.lookupFields({
                            type: 'transaction',
                            id: respuesta.idOV,
                            columns: [
                                'currency', 'exchangerate'
                            ]
                        });*/

                        monedaOV = arrayOV[0].monedaOV;
                        tipoCambioOV = arrayOV[0].tipoCambioOV;


                        objRecordDeposit.setValue({
                            fieldId: 'currency',
                            value: monedaOV
                        });

                        objRecordDeposit.setValue({
                            fieldId: 'salesorder',
                            value: respuesta.idOV
                        });

                        /*if (!utilities.isEmpty(tipoCambioOV)) {
                            objRecordDeposit.setValue({
                                fieldId: 'exchangerate',
                                value: tipoCambioOV,
                                ignoreFieldChange: false,
                                fireSlavingSync: true
                            });
                        }*/

                        if (!utilities.isEmpty(tipoCambioPago)) {
                            objRecordDeposit.setValue({
                                fieldId: 'exchangerate',
                                value: parseFloat(tipoCambioPago, 10).toFixed(2),
                                ignoreFieldChange: false,
                                fireSlavingSync: true
                            });
                        }

                        objRecordDeposit.setValue({
                            fieldId: 'paymentmethod',
                            value: formaPago,
                            ignoreFieldChange: false,
                            fireSlavingSync: true
                        });

                        var currency = objRecordDeposit.getValue({
                            fieldId: 'currency'
                        });

                        monedaOV = currency;

                        subsidiariaPago = objRecordDeposit.getValue({
                            fieldId: 'subsidiary'
                        });

                        sitioWeb = objRecordDeposit.getValue({
                            fieldId: 'custbody_cseg_3k_sitio_web_o'
                        });


                        /*objRecordDeposit.setValue({
                            fieldId: 'custbody_3k_medio_pago',
                            value: formaPago,
                            ignoreFieldChange: false,
                            fireSlavingSync: true
                        });*/
                        if (!utilities.isEmpty(tipoCambioPago) && tipoCambioPago > 0) {
                            objRecordDeposit.setValue({
                                fieldId: 'custbody_3k_tipo_cambio_pago',
                                value: tipoCambioPago.toString(),
                                ignoreFieldChange: false,
                                fireSlavingSync: true
                            });
                        }

                        if (!utilities.isEmpty(monedaPago) && monedaPago > 0) {
                            objRecordDeposit.setValue({
                                fieldId: 'custbody_3k_moneda_pago',
                                value: monedaPago,
                                ignoreFieldChange: false,
                                fireSlavingSync: true
                            });
                        }

                        /*if (!utilities.isEmpty(cantidadMillas) && cantidadMillas > 0) {

                            objRecordDeposit.setValue({
                                fieldId: 'custbody_3k_millas_aplicadas',
                                value: cantidadMillas.toString(),
                                ignoreFieldChange: false,
                                fireSlavingSync: true
                            });
                        }*/

                        /*if (!utilities.isEmpty(tipoCambioMillas) && tipoCambioMillas > 0) {

                            objRecordDeposit.setValue({
                                fieldId: 'custbody_3k_tasa_conv_millas',
                                value: tipoCambioMillas.toString(),
                                ignoreFieldChange: false,
                                fireSlavingSync: true
                            });
                        }*/


                        if (!utilities.isEmpty(importePago)) {

                            objRecordDeposit.setValue({
                                fieldId: 'custbody_3k_importe_pago',
                                value: parseFloat(importePago, 10).toFixed(2),
                                ignoreFieldChange: false,
                                fireSlavingSync: true
                            });
                        }

                        /*if (!utilities.isEmpty(transactionID)) {

                            objRecordDeposit.setValue({
                                fieldId: 'custbody_3k_numero_transaccion',
                                value: transactionID,
                                ignoreFieldChange: false,
                                fireSlavingSync: true
                            });
                        }*/

                        if (!utilities.isEmpty(cantidadCuotasPago)) {
                            objRecordDeposit.setValue({
                                fieldId: 'custbody_3k_cant_cuotas',
                                value: parseInt(cantidadCuotasPago, 10),
                                ignoreFieldChange: false,
                                fireSlavingSync: true
                            });
                        }

                        /*if (utilities.isEmpty(tipoCambioOficial)) {
                            tipoCambioOficial = tipoCambioPago;
                        }*/

                        var monedaCustomTransaction = '';
                        var importeGanancia = 0;
                        var importeGananciaPpal = 0;
                        if (monedaOV != monedaPago) {
                            if (!utilities.isEmpty(tipoCambioPago)) {
                                // INICIO - Obtener Moneda de la Subsidiaria
                                if (!utilities.isEmpty(subsidiariaPago)) {
                                    var objSubsidiaria = arrayMonedasSubsidiarias.filter(function (obj) {
                                        return (obj.subsidiaria == subsidiariaPago);
                                    });

                                    if (!utilities.isEmpty(objSubsidiaria) && objSubsidiaria.length > 0) {
                                        monedaPrincipalSubsidiaria = objSubsidiaria[0].moneda;
                                        if (monedaPago != monedaPrincipalSubsidiaria) {
                                            var monedaFilter = monedaPago;
                                        } else {
                                            var monedaFilter = monedaOV;
                                        }

                                        var tiposCambiosFilter = tiposCambios.filter(function (obj) {

                                            return (obj.basecurrency == monedaPrincipalSubsidiaria && obj.transactioncurrency == monedaFilter);

                                        });

                                        var tipoCambioOficial;

                                        if (!utilities.isEmpty(tiposCambiosFilter) && tiposCambiosFilter.length > 0) {
                                            tipoCambioOficial = parseFloat(tiposCambiosFilter[0].exchangerate);
                                        }
                                        if (!utilities.isEmpty(monedaPrincipalSubsidiaria)) {
                                            if (monedaPago != monedaPrincipalSubsidiaria) {

                                                importeGanancia = (parseFloat(importePago, 10) * (Math.abs(parseFloat(tipoCambioPago, 10) - parseFloat(tipoCambioOficial, 10))));

                                                importeGananciaPpal = (parseFloat(importePago, 10) * (parseFloat(tipoCambioPago, 10) - parseFloat(tipoCambioOficial, 10)));

                                                importePago = parseFloat(importePago, 10) * parseFloat(tipoCambioPago, 10);

                                            } else {
                                                importePago = parseFloat(importePago, 10) / parseFloat(tipoCambioPago, 10);

                                                importeGanancia = (parseFloat(importePago, 10) * (Math.abs(parseFloat(tipoCambioPago, 10) - parseFloat(tipoCambioOficial, 10))));

                                                importeGananciaPpal = (parseFloat(importePago, 10) * (parseFloat(tipoCambioPago, 10) - parseFloat(tipoCambioOficial, 10)));
                                            }
                                            log.audit('Cobranza Cliente', 'tipoCambioOficial : ' + tipoCambioOficial);

                                            objRecordDeposit.setValue({
                                                fieldId: 'custbody_3k_tipo_cambio_woow',
                                                value: tipoCambioOficial.toFixed(2).toString(),
                                                ignoreFieldChange: false,
                                                fireSlavingSync: true
                                            });

                                            log.audit('Cobranza Cliente', 'importeGanancia : ' + importeGanancia + ', importeGananciaPpal : ' + importeGananciaPpal);

                                            objRecordDeposit.setValue({
                                                fieldId: 'custbody_3k_ganancia_tipo_cambio',
                                                value: importeGananciaPpal.toFixed(2).toString(),
                                                ignoreFieldChange: false,
                                                fireSlavingSync: true
                                            });
                                            // INICIO - Obtener Cuenta Clearing
                                            var objClearing = arrayCuentasClearing.filter(function (obj) {
                                                return (obj.subsidiaria == subsidiariaPago && obj.moneda == monedaOV);
                                            });

                                            if (!utilities.isEmpty(objClearing) && objClearing.length > 0) {
                                                cuentaClearing = objClearing[0].cuenta;
                                                if (!utilities.isEmpty(cuentaClearing)) {
                                                    cuentaContable = cuentaClearing;
                                                } else {
                                                    // Error Obteniendo Cuenta Clearing para SubSidiaria y Moneda
                                                    respuesta.error = true;
                                                    respuestaParcial = new Object();
                                                    respuestaParcial.codigo = 'RDEP040';
                                                    respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : Error Obteniendo Cuenta de Clearing para la Subsidiaria con ID Interno : ' + subsidiariaPago + ' - Moneda con ID Interno : ' + monedaOV;
                                                    respuesta.detalle.push(respuestaParcial);
                                                }
                                            } else {
                                                // Error Obteniendo Cuenta Clearing para SubSidiaria y Moneda
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'RDEP040';
                                                respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : Error Obteniendo Cuenta de Clearing para la Subsidiaria con ID Interno : ' + subsidiariaPago + ' - Moneda con ID Interno : ' + monedaOV;
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                            // FIN - Obtener Cuenta Clearing
                                        } else {
                                            // Error Obteniendo Moneda Principal para la Subsidiaria
                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'RDEP041';
                                            respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : Error Obteniendo Moneda Base para la Subsidiaria con ID Interno : ' + subsidiariaPago;
                                            respuesta.detalle.push(respuestaParcial);
                                        }
                                    } else {
                                        // Error Obteniendo Moneda Principal para la Subsidiaria
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'RDEP041';
                                        respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : Error Obteniendo Moneda Base para la Subsidiaria con ID Interno : ' + subsidiariaPago;
                                        respuesta.detalle.push(respuestaParcial);
                                    }
                                } else {
                                    // Error Falta Subsidiaria de Pago
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'RDEP042';
                                    respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : Error Obteniendo la Subsidiaria de la Cobranza';
                                    respuesta.detalle.push(respuestaParcial);
                                }
                                // FIN - Obtener Moneda de la Subsidiaria
                            } else {
                                //Error Falta Tipo de Cambio Pago
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'RDEP043';
                                respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : Error Obteniendo el Tipo de Cambio del Pago';
                                respuesta.detalle.push(respuestaParcial);
                            }
                        } else {
                            // INICIO - Obtener Cuenta Contable en base al Medio de Pago
                            if (!utilities.isEmpty(sitioWeb) && !utilities.isEmpty(formaPago) && !utilities.isEmpty(monedaPago) && !utilities.isEmpty(cantidadCuotasPago) && !utilities.isEmpty(tipoCambioPago) && !utilities.isEmpty(importePago) && importePago > 0) {

                                var objMedioPago = arrayMediosPagoMoneda.filter(function (obj) {
                                    return (obj.sitioWeb == sitioWeb && obj.formaPago == formaPago && obj.moneda == monedaPago && obj.cantidadCuotas == cantidadCuotasPago);
                                });

                                if (!utilities.isEmpty(objMedioPago) && objMedioPago.length > 0) {

                                    cuentaFinal = objMedioPago[0].cuenta;
                                    idMedioPagoFinal = objMedioPago[0].idInterno;

                                    if (!utilities.isEmpty(cuentaFinal)) {
                                        cuentaContable = cuentaFinal;
                                    } else {
                                        // Error Obteniendo Cuetna Contable para Sitio Web , Forma de Pago , Moneda Pago
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'RDEP044';
                                        respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : Error Obteniendo Cuenta Contable A Utilizar para el Sitio Web con ID Interno : ' + sitioWeb + ' - Forma de Pago con ID Interno : ' + formaPago + ' - Moneda con ID Interno : ' + monedaPago;
                                        respuesta.detalle.push(respuestaParcial);
                                    }
                                } else {
                                    // Error Obteniendo Cuetna Contable para Sitio Web , Forma de Pago , Moneda Pago
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'RDEP044';
                                    respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : Error Obteniendo Cuenta Contable A Utilizar para el Sitio Web con ID Interno : ' + sitioWeb + ' - Forma de Pago con ID Interno : ' + formaPago + ' - Moneda con ID Interno : ' + monedaPago;
                                    respuesta.detalle.push(respuestaParcial);
                                }
                            } else {
                                if (!utilities.isEmpty(sitioWeb) && !utilities.isEmpty(formaPago) && !utilities.isEmpty(monedaPago) && !utilities.isEmpty(tipoCambioPago) && tipoCambioPago > 0 && !utilities.isEmpty(importePago) && importePago > 0);
                                var mensaje = 'Error obteniendo la siguiente informacion de la Cobranza : ';
                                if (utilities.isEmpty(sitioWeb)) {
                                    mensaje = mensaje + " Sitio Web Origen / ";
                                }
                                if (utilities.isEmpty(formaPago)) {
                                    mensaje = mensaje + " Forma de Pago / ";
                                }
                                if (utilities.isEmpty(monedaPago)) {
                                    mensaje = mensaje + " Moneda de Pago / ";
                                }
                                if (utilities.isEmpty(tipoCambioPago)) {
                                    mensaje = mensaje + " Tipo de Cambio de Pago / ";
                                }
                                if (!utilities.isEmpty(tipoCambioPago) && tipoCambioPago <= 0) {
                                    mensaje = mensaje + " Tipo de Cambio de Pago No Valido / ";
                                }
                                if (utilities.isEmpty(importePago)) {
                                    mensaje = mensaje + " Importe Pago / ";
                                }
                                if (utilities.isEmpty(cantidadCuotasPago)) {
                                    mensaje = mensaje + " Cantidad de Cuotas del Pago / ";
                                }
                                if (!utilities.isEmpty(importePago) && importePago <= 0) {
                                    mensaje = mensaje + " Importe Pago No Valido / ";
                                }

                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'RDEP045';
                                respuestaParcial.mensaje = 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : ' + mensaje;
                                respuesta.detalle.push(respuestaParcial);
                            }
                            // FIN - Obtener Cuenta Contable en base al Medio de Pago
                        }

                        if (respuesta.error == false) {

                            objRecordDeposit.setValue({
                                fieldId: 'payment',
                                value: importePago.toFixed(2).toString(),
                                ignoreFieldChange: false,
                                fireSlavingSync: true
                            });


                            if (!utilities.isEmpty(cuentaContable)) {

                                objRecordDeposit.setValue({
                                    fieldId: 'account',
                                    value: cuentaContable,
                                    ignoreFieldChange: false,
                                    fireSlavingSync: true
                                });

                                try {

                                    recordId = objRecordDeposit.save({
                                        enableSourcing: true,
                                        ignoreMandatoryFields: false
                                    });

                                    if (utilities.isEmpty(recordId)) {
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'RDEP009';
                                        respuestaParcial.mensaje = 'Error Grabando la Cobranza del Cliente - Error : No se recibio el ID Interno de la Cobranza de Cliente Generada';
                                        respuesta.detalle.push(respuestaParcial);
                                    } else {
                                        //respuesta.idDeposito = recordId;
                                        //var respuestaAfterDep = afterSubmitDep(recordId, carrito, cliente, pago[i], idMedioPagoFinal);
                                        var respuestaAfterDep = afterSubmitDep(recordId, arrayOV, pago[i], idMedioPagoFinal);

                                        /*if (respuestaAfterDep.error) {
                                            // Inicio Eliminar Deposito
                                            var respuestaEliminacion = eliminarRegistrosDependientes(respuestaAfterDep, recordId);
                                            /*var objRecord = record.delete({
                                                type: record.Type.CUSTOMER_DEPOSIT,
                                                id: recordId,
                                            });*/
                                        // Fin Eliminar Deposito
                                        /*respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'RDEP030';
                                        respuestaParcial.mensaje = JSON.stringify(respuestaAfterDep);
                                        respuesta.detalle.push(respuestaParcial);

                                        log.error('Error Grabando la Cobranza del Cliente', JSON.stringify(respuestaAfterDep));

                                        var respuestaEliminacion = eliminarRegistrosDependientes(respuestaAfterDep, recordId);

                                        if (!utilities.isEmpty(respuestaEliminacion) && respuestaEliminacion.error == true) {
                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'RDEP030';
                                            respuestaParcial.mensaje = JSON.stringify(respuestaEliminacion);
                                            respuesta.detalle.push(respuestaParcial);
                                        }

                                        return respuesta;
                                    }*/
                                        var objRespuestaAfter = new Object({})
                                        objRespuestaAfter.idDeposito = respuestaAfterDep.idDeposito;
                                        objRespuestaAfter.formaPago = formaPago;
                                        objRespuestaAfter.importePago = importePago;
                                        //objRespuestaAfter.cupones = respuestaAfterDep.cupones;
                                        respuesta.depositos.push(objRespuestaAfter);
                                    }
                                } catch (excepcionSave) {
                                    if (!utilities.isEmpty(recordId)) {
                                        // Inicio Eliminar Deposito
                                        var objRecord = record.delete({
                                            type: record.Type.CUSTOMER_DEPOSIT,
                                            id: recordId,
                                        });
                                    }
                                    // Fin Eliminar Deposito
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'RDEP008';
                                    respuestaParcial.mensaje = 'Excepcion Grabando la Cobranza del Cliente - Excepcion : ' + excepcionSave.message.toString();
                                    respuesta.detalle.push(respuestaParcial);
                                }

                            } else {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'RDEP025';
                                respuestaParcial.mensaje = 'No se encontro la Cuenta Contable Asociada a la Cobranza';
                                respuesta.detalle.push(respuestaParcial);
                            }
                        }

                    }

                }
            } catch (excepcionGeneral) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'RDEP015';
                respuestaParcial.mensaje = 'Excepcion Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Excepcion : ' + excepcionGeneral.message.toString();
                respuesta.detalle.push(respuestaParcial);
            }

            // FIN Generar Deposito Cliente
            log.debug('Cobranza Cliente', 'Respuesta : ' + JSON.stringify(respuesta));

            if (respuesta.error == true && !utilities.isEmpty(respuesta.detalle) && respuesta.detalle.length > 0) {
                log.error('Cobranza Cliente', 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' Error : ' + JSON.stringify(respuesta));
            }

            log.audit('Cobranza Cliente', 'FIN Generacion Deposito Cliente');
            return respuesta;

            log.audit('Cobranza Cliente', 'FIN Generacion Deposito Cliente - ID Interno Deposito : ' + recordId);
        }

        function afterSubmitDep(idDep, arrayOV, pago, idMedioPagoFinal) {
            //function afterSubmitDep(idDep, idOV, idCliente, pago, idMedioPagoFinal) {

            var recordId = '';
            var arrayCuponesProcesar = new Array();
            var arrayCuponesProcesados = new Array();
            var esServicio = '';
            var isTravel = '';

            var respuesta = new Object();
            respuesta.idOV = '';
            respuesta.idDeposito = '';
            //respuesta.cupones = new Array();
            respuesta.error = false;
            respuesta.detalle = new Array();
            respuesta.idConciliacion = '';
            respuesta.idConciliacionImpacto = '';
            respuesta.idRegMedioPago = '';
            try {
                // INICIO - Consultar Configuracion


                respuesta.idDeposito = idDep;
                respuesta.idOV = arrayOV[0].idOV;
                respuesta.formaPago = pago.formaPago;
                respuesta.monedaPago = arrayOV[0].monedaPago;
                respuesta.tipoCambioPago = arrayOV[0].tipoCambioPago;
                //respuesta.cantidadMillas = pago.cantidadMillas;
                //respuesta.tipoCambioMillas = pago.tipoCambioMillas;
                respuesta.idCliente = arrayOV[0].idCliente;
                //respuesta.tipoCambioMenor = pago.tipoCambioMenor;
                respuesta.cantidadCuotasPago = pago.cantidadCuotas;


                /*log.audit('After Submit', 'INICIO Generacion Cupones - ID Interno OV : ' + respuesta.idOV + ' - ID Interno Deposito : ' + respuesta.idDeposito + ' - ID MP 1 : ' + idMedioPagoFinal);

                var respuestaGeneracionCupon = generarCupones(idDep, idOV, idCliente, pago);

                if (!utilities.isEmpty(respuestaGeneracionCupon)) {
                    respuesta.cupones = respuestaGeneracionCupon.informacionCuponesResult;
                    respuesta.error = respuestaGeneracionCupon.error;
                    respuesta.detalle = respuestaGeneracionCupon.detalle;
                    esServicio = respuestaGeneracionCupon.esServicio;
                    isTravel = respuestaGeneracionCupon.isTravel;
                }*/

                if (respuesta.error == false) {
                    // INICIO - Actualizar Requisiciones con Cupones Generados
                    // INICIO - Obtener Requisiciones Generadas por Orden de Venta
                    /*var arrayRequisiciones = new Array();
                    var objParam = new Object();
                    objParam.name = 'custrecord_3k_req_compra_ov';
                    objParam.operator = 'IS';
                    objParam.values = respuesta.idOV;

                    var searchRequisiciones = utilities.searchSaved('customsearch_3k_requisiciones_ov', objParam);
                    if (!utilities.isEmpty(searchRequisiciones) && searchRequisiciones.error == false) {
                        if (!utilities.isEmpty(searchRequisiciones.objRsponseFunction.result) && searchRequisiciones.objRsponseFunction.result.length > 0) {
                            // Agrupar Cupones por ID de Orden
                            var resultSet = searchRequisiciones.objRsponseFunction.result;
                            var resultSearch = searchRequisiciones.objRsponseFunction.search;

                            var idLineaOVAnterior = '';
                            var idLineaOVActual = '';

                            for (var l = 0; !utilities.isEmpty(resultSet) && l < resultSet.length; l++) {

                                var obj = new Object();
                                obj.indice = l;
                                obj.idInterno = resultSet[l].getValue({
                                    name: resultSearch.columns[0]
                                });
                                obj.idOV = resultSet[l].getValue({
                                    name: resultSearch.columns[1]
                                });
                                obj.idLineaOV = resultSet[l].getValue({
                                    name: resultSearch.columns[2]
                                });

                                arrayRequisiciones.push(obj);
                            }
                        } else {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'RDEP013';
                            respuestaParcial.mensaje = 'Error Consultando Requisiciones por Orden de Venta para Actualizar Cupones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se encontraron Requisiciones';
                            respuesta.detalle.push(respuestaParcial);
                        }
                    } else {
                        if (utilities.isEmpty(searchRequisiciones)) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'RDEP014';
                            respuestaParcial.mensaje = 'Error Consultando Requisiciones por Orden de Venta para Actualizar Cupones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Recibio Objeto de Respuesta';
                            respuesta.detalle.push(respuestaParcial);
                        } else {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'RDEP015';
                            respuestaParcial.mensaje = 'Error Consultando Requisiciones por Orden de Venta para Actualizar Cupones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Tipo Error : ' + searchRequisiciones.tipoError + ' - Descripcion : ' + searchRequisiciones.descripcion;
                            respuesta.detalle.push(respuestaParcial);
                        }
                    }*/
                    // FIN - Obtener Requisiciones Generadas por Orden de Venta

                    // INICIO - Actualizar Requisiciones
                    /*if (!utilities.isEmpty(respuestaGeneracionCupon.informacionCupones)) {
                        respuesta.cupones = respuestaGeneracionCupon.informacionCuponesResult;
                        for (var s = 0; s < respuestaGeneracionCupon.informacionCupones.length && respuesta.error == false; s++) {
                            var objRequisicion = arrayRequisiciones.filter(function (obj) {
                                return (obj.idLineaOV === respuestaGeneracionCupon.informacionCupones[s].idLineaOV);
                            });

                            if (!utilities.isEmpty(objRequisicion) && objRequisicion.length > 0) {
                                for (var q = 0; q < objRequisicion.length && respuesta.error == false; q++) {
                                    try {
                                        var idRecordRequisicion = record.submitFields({
                                            type: 'customrecord_3k_req_compra',
                                            id: objRequisicion[q].idInterno,
                                            values: {
                                                custrecord_3k_req_compra_cupon: respuestaGeneracionCupon.informacionCupones[s].idCupones
                                            },
                                            options: {
                                                enableSourcing: true,
                                                ignoreMandatoryFields: false
                                            }
                                        });
                                        if (utilities.isEmpty(idRecordRequisicion)) {
                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'RDEP016';
                                            respuestaParcial.mensaje = 'Error Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Recibio ID de la Requisicion Actualizada';
                                            respuesta.detalle.push(respuestaParcial);
                                        }
                                    } catch (exepcionSubmitRequisicion) {
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'RDEP017';
                                        respuestaParcial.mensaje = 'Excepcion Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Excepcion : ' + exepcionSubmitRequisicion.message.toString();
                                        respuesta.detalle.push(respuestaParcial);
                                    }
                                }

                            } else {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'RDEP018';
                                respuestaParcial.mensaje = 'Error Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Encontro la Requisicion para el ID Detalle OV : ' + informacionCupones[i].idLineaOV;
                                respuesta.detalle.push(respuestaParcial);
                            }
                        }
                    } else {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'RDEP019';
                        respuestaParcial.mensaje = 'Error Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Recibio Informacion de Array de Cupones';
                        respuesta.detalle.push(respuestaParcial);
                    }*/
                    // FIN - Actualizar Requisiciones

                    // FIN - Obtener Cupones Generados por Orden de Venta

                    // FIN - Actualizar Requisiciones con Cupones Generados 

                    if (respuesta.error == false) {

                        // INICIO - Generar Medios de Pago
                        //var respuestaMediosPago = generarMediosDePago(idDep, idMedioPagoFinal, esServicio, isTravel);
                        esServicio = arrayOV[0].esServicio;
                        isTravel = arrayOV[0].esTravel;
                        var respuestaMediosPago = generarMediosDePago(idDep, idMedioPagoFinal, esServicio, isTravel);

                        if (!utilities.isEmpty(respuestaMediosPago)) {
                            respuesta.idConciliacion = respuestaMediosPago.idConciliacion;
                            respuesta.idConciliacionImpacto = respuestaMediosPago.idConciliacionImpacto;
                            respuesta.idRegMedioPago = respuestaMediosPago.idRegMedioPago;
                            respuesta.error = respuestaMediosPago.error;
                            respuesta.detalle = respuestaMediosPago.detalle;
                        }
                        // FIN - Generar Medios de Pago


                    }
                }

                // FIN - Grabar Orden de Venta

                // INICIO - Generar Custom Transaction de Cupones

                /*if (respuesta.error == false) {
                    if (!utilities.isEmpty(arrayCuponesProcesar) && arrayCuponesProcesar.length > 0) {
                        parametros = new Object();
                        parametros.custscript_3k_func_cupon_id = arrayCuponesProcesar.toString();

                        log.debug('After Submit', 'Generacion Cupones - ID Cupones A Procesar : ' + parametros.custscript_3k_func_cupon_id);

                        log.debug('After Submit', 'Generacion Cupones - INICIO llamada Script MAP/REDUCE');

                        respuestaMap = createAndSubmitMapReduceJob('customscript_3k_func_cupon_mp', parametros);

                        if (respuestaMap.error) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SROV021';
                            respuestaParcial.mensaje = 'Error Map:  ' + JSON.stringify(respuestaMap);
                            respuesta.detalle.push(respuestaParcial);
                            return respuesta;
                        }
                        var mensajeEstado = "";
                        if (!utilities.isEmpty(respuestaMap) && !utilities.isEmpty(respuestaMap.estado)) {
                            mensajeEstado = respuestaMap.estado.status;
                        }

                        log.debug('After Submit', 'Generacion Cupones - /REDUCE - Estado : ' + mensajeEstado);
                    }
                }*/

                // FIN - Generar Custom Transaction de Cupones


                //log.audit('After Submit', 'FIN Generacion Cupones - ID Interno OV : ' + respuesta.idOV + ' - ID Interno Deposito : ' + recordId);

            } catch (excepcionGeneral) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'RDEP015';
                respuestaParcial.mensaje = 'Excepcion After Submit Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Excepcion : ' + excepcionGeneral.message.toString();
                respuesta.detalle.push(respuestaParcial);
                /*var objRecord = record.delete({
                    type: record.Type.CUSTOMER_DEPOSIT,
                    id: respuesta.idOV,
                });*/
            }

            log.debug('After Submit', 'Respuesta : ' + JSON.stringify(respuesta));

            if (respuesta.error == true && !utilities.isEmpty(respuesta.detalle) && respuesta.detalle.length > 0) {
                log.error('Cobranza Cliente', 'Error After Submit Orden de Venta con ID Interno : ' + respuesta.idOV + ' Error : ' + JSON.stringify(respuesta));

            }

            log.audit('After Submit', 'FIN After Submit Generacion Deposito Cliente');
            return respuesta;
        }

        function createAndSubmitMapReduceJob(idScript, parametros) {
            log.audit('Cobranza Cliente', 'INICIO Invocacion Script MAP/REDUCE');
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";
            respuesta.estado = "";
            respuesta.detalle = new Array();
            try {
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: idScript,
                    params: parametros
                });
                var mrTaskId = mrTask.submit();
                var taskStatus = task.checkStatus(mrTaskId);
                respuesta.estado = taskStatus;
            } catch (excepcion) {
                respuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.mensaje = "Excepcion Invocando A Script MAP/REDUCE - Excepcion : " + excepcion.message;
                respuesta.detalle.push(objRespuestaParcial);
                //respuesta.mensaje = "Excepcion Invocando A Script MAP/REDUCE - Excepcion : " + excepcion.message;
                log.error('Cobranza Cliente', 'Generacion Cupones - Excepcion Invocando A Script MAP/REDUCE - Excepcion : ' + excepcion.message);
            }
            log.audit('Cobranza Cliente', 'FIN Invocacion Script MAP/REDUCE');
            return respuesta;
        }

        function closedLinesOV(rec, json) {
            log.audit('closedLinesOV', 'Inicio cerrar lineas de OV');
            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.detalle = [];
            try {

                var arrayLines = json;
                var carrito = rec.id;

                var numOrdenesToCancel = arrayLines.length;
                var numLinesOV = rec.getLineCount({
                    sublistId: 'item'
                });

                var cancelAll = false;
                var totalLineasSinRedondeo = 0;
                var tieneRedondeo = false;

                for (var q = 0; q < numLinesOV; q++) {

                    var esRedondeo = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_es_redondeo',
                        line: q
                    });

                    if (!esRedondeo) {
                        totalLineasSinRedondeo++;
                    } else {
                        tieneRedondeo = true;
                    }
                }
                log.debug('closedLinesOV', 'totalLineasSinRedondeo: ' + totalLineasSinRedondeo);
                if (numOrdenesToCancel >= totalLineasSinRedondeo) {
                    cancelAll = true;
                }

                for (var j = 0; j < arrayLines.length; j++) {

                    var idDetalleOV = arrayLines[j].idDetalleOV;
                    log.debug('closedLinesOV', 'idDetalleOV:' + idDetalleOV);

                    //CERRAR LINEA

                    var shippingCost = rec.getValue({
                        fieldId: 'shippingcost'
                    });

                    var importeTotalEnvio = rec.getValue({
                        fieldId: 'total'
                    });



                    var lineNumber = rec.findSublistLineWithValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_id_orden',
                        value: idDetalleOV
                    });

                    var importeVoucher = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_importe_voucher',
                        line: lineNumber
                    });

                    var voucher = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_voucher',
                        line: lineNumber
                    });

                    var shippingCostLine = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_imp_envio',
                        line: lineNumber
                    });

                    var importeEnvioCC = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_importe_envio_cc',
                        line: lineNumber
                    });

                    if (utilities.isEmpty(importeEnvioCC)) {
                        importeEnvioCC = 0.00;
                    }

                    /*var importeEnvioCC = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_importe_envio_cc',
                        line: lineNumber
                    });*/



                    log.debug('closedLinesOV', 'importeVoucher: ' + importeVoucher + ' voucher: ' + voucher);

                    if (!utilities.isEmpty(lineNumber)) {

                        var lineNum = rec.selectLine({
                            sublistId: 'item',
                            line: lineNumber
                        });

                        rec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'isclosed',
                            value: true,
                            ignoreFieldChange: false
                        });


                        rec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_imp_envio',
                            value: '0.00',
                            ignoreFieldChange: false
                        });

                        rec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_importe_voucher',
                            value: '0.00',
                            ignoreFieldChange: false
                        });

                        /*rec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_importe_envio_cc',
                            value: shippingCostLine.toFixed(2).toString(),
                            ignoreFieldChange: false
                        });

                        rec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'grossamt',
                            value: '0',
                            ignoreFieldChange: false
                        });*/

                        rec.commitLine({
                            sublistId: 'item'
                        });



                    }

                    //DESCONTAR LINEA DE VOUCHER

                    log.audit('closedLinesOV', 'INICIO DESCONTAR LINEA DE VOUCHER');

                    var numLinesItem = rec.getLineCount({
                        sublistId: 'item'
                    });
                    log.debug('closedLinesOV', 'numLinesItem: ' + numLinesItem);

                    if (!utilities.isEmpty(voucher) && !utilities.isEmpty(importeVoucher)) {

                        for (var k = 0; k < numLinesItem; k++) {

                            var isVoucher = rec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_linea_voucher',
                                line: k
                            });

                            var idVoucherLinea = rec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_voucher',
                                line: k
                            });

                            if (isVoucher && idVoucherLinea == voucher) {

                                var importeVoucherLinea = rec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_importe_voucher',
                                    line: k
                                });

                                var newImporte = (parseFloat(importeVoucherLinea) - parseFloat(importeVoucher));


                                rec.selectLine({
                                    sublistId: 'item',
                                    line: k
                                });

                                log.debug('closedLinesOV', 'newImporte Voucher: ' + newImporte);

                                if (newImporte > 0) {

                                    var importeVoucherNegativo = Math.abs(newImporte) * (-1);

                                    log.debug('CC', 'importeVoucherNegativo: ' + importeVoucherNegativo);

                                    rec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_importe_voucher',
                                        value: newImporte.toFixed(2).toString()
                                    });

                                    rec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'grossamt',
                                        value: importeVoucherNegativo.toString()
                                    });

                                    var amount = rec.getCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'amount'
                                    });

                                    rec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'rate',
                                        value: amount.toString()
                                    });

                                } else {
                                    rec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'isclosed',
                                        value: true,
                                        ignoreFieldChange: false

                                    });

                                    rec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_importe_voucher',
                                        value: '0'
                                    });

                                    rec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'grossamt',
                                        value: '0'
                                    });

                                    /*var amount = rec.getCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'amount'
                                    });*/

                                    rec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'rate',
                                        value: '0'
                                    });

                                }

                                rec.commitLine({
                                    sublistId: 'item'
                                });

                                break;

                            }

                        }

                        log.audit('closedLinesOV', 'FIN DESCONTAR LINEA DE VOUCHER');

                        //CERRAR USOS VOUCHER

                        log.audit('closedLinesOV', 'INICIO CERRAR USOS VOUCHER');
                        var numLinesUsosVoucher = rec.getLineCount({
                            sublistId: 'recmachcustrecord_3k_usos_vouchers_ov'
                        });
                        log.debug('closedLinesOV', 'numLinesUsosVoucher: ' + numLinesUsosVoucher);
                        for (var l = 0; l < numLinesUsosVoucher; l++) {

                            var IDOrdenVoucher = rec.getSublistValue({
                                sublistId: 'recmachcustrecord_3k_usos_vouchers_ov',
                                fieldId: 'custrecord_3k_usos_vouchers_orden',
                                line: l
                            });

                            log.debug('closedLinesOV', 'IDOrdenVoucher: ' + IDOrdenVoucher);
                            log.debug('closedLinesOV', 'idDetalleOV: ' + idDetalleOV);

                            if (IDOrdenVoucher == idDetalleOV) {
                                log.debug('closedLinesOV', 'entro if inactivar usos vouchers');

                                rec.removeLine({
                                    sublistId: 'recmachcustrecord_3k_usos_vouchers_ov',
                                    line: l
                                });

                                break;
                            }
                        }
                        log.audit('closedLinesOV', 'FIN CERRAR USOS VOUCHER');

                        //DESCONTAR CONSUMIDO VOUCHER Y DESASOCIAR LA ORDEN DEL VOUCHER

                        log.audit('closedLinesOV', 'INICIO DESCONTAR CONSUMIDO VOUCHER Y DESASOCIAR LA ORDEN DEL VOUCHER');
                        /*var numLinesUsosVoucher = rec.getLineCount({
                            sublistId: 'recmachcustrecord_3k_usos_vouchers_ov'
                        });*/


                        var objFieldLookUp = search.lookupFields({
                            type: 'customrecord_3k_vouchers',
                            id: voucher,
                            columns: [
                                'custrecord_3k_vouchers_orden', 'custrecord_3k_vouchers_cosumido'
                            ]
                        });

                        var arrayOrdenes = objFieldLookUp["custrecord_3k_vouchers_orden"];
                        var stockConsumido = objFieldLookUp["custrecord_3k_vouchers_cosumido"];


                        var index = arrayOrdenes.indexOf(carrito);

                        if (index != -1) {
                            var newArrayOrdenes = [];
                            newArrayOrdenes = arrayOrdenes.splice(index, 1);
                        }

                        var stockConsumidoFinal = (parseFloat(stockConsumido) - parseFloat(importeVoucher));

                        try {

                            var idRecordVoucher = record.submitFields({
                                type: 'customrecord_3k_vouchers',
                                id: voucher,
                                values: {
                                    custrecord_3k_vouchers_orden: newArrayOrdenes,
                                    custrecord_3k_vouchers_cosumido: stockConsumidoFinal
                                },
                                options: {
                                    enableSourcing: true,
                                    ignoreMandatoryFields: false
                                }
                            });

                        } catch (e) {
                            objRespuesta.error = true;
                            objrespuestaParcial = new Object({});
                            objrespuestaParcial.codigo = 'MCLO002';
                            objrespuestaParcial.mensaje = 'Error submitFields Voucher Excepción: ' + e.message;
                            objRespuesta.detalle.push(objrespuestaParcial);
                            //objRespuesta.tipoError = 'RORV002';
                            //objRespuesta.descripcion = 'No se recibio parametro con informacion a realizar';
                            log.error('MCLO002', 'Error submitFields Voucher Excepción: ' + e.message);
                        }

                        log.audit('closedLinesOV', 'FIN DESCONTAR CONSUMIDO VOUCHER Y DESASOCIAR LA ORDEN DEL VOUCHER');
                    }



                    /****************************INCIO MODIFICAR CANTIDAD DE LA REQUISICIONES QUE NO TENGAN ORDEN DE COMPRA ***************************************/
                    log.audit('closedLinesOV', 'INCIO MODIFICAR CANTIDAD DE LA REQUISICIONES QUE NO TENGAN ORDEN DE COMPRA');
                    var numLines = rec.getLineCount({
                        sublistId: 'recmachcustrecord_3k_req_compra_ov'
                    });

                    //log.debug('devolverCupon', 'requi numlines: ' + numLines);

                    for (var i = 0; i < numLines; i++) {

                        var id_OV = rec.getSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_id_det_orden',
                            line: i
                        });

                        var id_OC = rec.getSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_oc',
                            line: i
                        });

                        //log.debug('devolverCupon', 'id_OV: ' + id_OV + ' id_OC: ' + id_OC);

                        if (id_OV == idDetalleOV && utilities.isEmpty(id_OC)) {

                            lineNum = rec.selectLine({
                                sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                line: i
                            });

                            rec.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                fieldId: 'custrecord_3k_req_compra_cantidad',
                                value: 0

                            });

                            rec.commitLine({
                                sublistId: 'recmachcustrecord_3k_req_compra_ov'
                            });

                        }
                    }


                    log.audit('closedLinesOV', 'FIN MODIFICAR CANTIDAD DE LA REQUISICIONES QUE NO TENGAN ORDEN DE COMPRA');

                    var newShippingCost = (parseFloat(shippingCost) - parseFloat(shippingCostLine));

                    rec.setValue({
                        fieldId: 'shippingcost',
                        value: newShippingCost.toFixed(2).toString()
                    });

                    var newImporteTotalEnvio = rec.getValue({
                        fieldId: 'total'
                    });

                    if (utilities.isEmpty(importeVoucher)) {
                        importeVoucher = parseFloat(0, 10);
                    }

                    var importeEnvioRestar = parseFloat(importeTotalEnvio, 10) - (parseFloat(newImporteTotalEnvio, 10) - parseFloat(importeVoucher, 10));

                    log.debug('closedLinesOV', 'importeTotalEnvio: ' + importeTotalEnvio);
                    log.debug('closedLinesOV', 'newImporteTotalEnvio: ' + newImporteTotalEnvio);
                    log.debug('closedLinesOV', 'importeEnvioRestar: ' + importeEnvioRestar);
                    log.debug('closedLinesOV', 'lineNumber: ' + lineNumber);

                    if (!utilities.isEmpty(lineNumber)) {

                        var lineNum = rec.selectLine({
                            sublistId: 'item',
                            line: lineNumber
                        });

                        var estaCerrada = rec.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'isclosed'
                        });

                        if (estaCerrada) {

                            var newImporteCC = parseFloat(importeEnvioCC, 10) + Math.abs(parseFloat(importeEnvioRestar, 10));
                            log.debug('closedLinesOV', 'newImporteCC: ' + newImporteCC);

                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_importe_envio_cc',
                                value: newImporteCC.toFixed(2).toString()
                            });

                            rec.commitLine({
                                sublistId: 'item'
                            });
                        }
                    }
                }




                var idRec = rec.save();
                objRespuesta.idOV = idRec;




                if (!cancelAll) {
                    // INICIO GENERAR AJUSTE POR REDONDEO
                    var respuestaAjusteRedondeo = generarAjusteRedondeo(idRec, null);
                    // FIN GENERAR AJUSTE POR REDONDEO

                    if (respuestaAjusteRedondeo.error) {
                        return respuestaAjusteRedondeo;
                    }
                } else {
                    if (tieneRedondeo) {

                        var objRecord = record.load({
                            type: record.Type.SALES_ORDER,
                            id: idRec,
                            isDynamic: true
                        });

                        for (var t = 0; t < numLinesOV; t++) {

                            var esRedondeo = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_es_redondeo',
                                line: t
                            });

                            if (esRedondeo) {
                                objRecord.selectLine({
                                    sublistId: 'item',
                                    line: t
                                });

                                objRecord.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'isclosed',
                                    value: true
                                });

                                objRecord.commitLine({
                                    sublistId: 'item'
                                });
                            }
                        }

                        objRecord.save();
                    }
                }

                log.audit('closedLinesOV', 'FIN cerrar lineas de OV');

                // INICIO - Generar Cupones
                var objRecord = record.load({
                    type: record.Type.SALES_ORDER,
                    id: idRec,
                    isDynamic: true
                });

                var importeRestantePagoOV = objRecord.getValue({
                    fieldId: 'custbody_3k_imp_rest_pago'
                });
                var ovCerrada = objRecord.getValue({
                    fieldId: 'orderstatus'
                });
                var clienteOrdenDeVenta = objRecord.getValue({
                    fieldId: 'entity'
                });

                if (!utilities.isEmpty(ovCerrada) && ovCerrada == 'B' && !utilities.isEmpty(importeRestantePagoOV) && importeRestantePagoOV <= 0.00) {
                    var pago = new Object();
                    var respuestaGeneracionCupon = generarCupones(null, idRec, clienteOrdenDeVenta, pago);

                    if (utilities.isEmpty(respuestaGeneracionCupon)) {
                        objRespuesta.error = true;
                        objrespuestaParcial = new Object();
                        objrespuestaParcial.codigo = 'SROV023';
                        objrespuestaParcial.mensaje = 'Error Generando Cupones a la Orden de Venta con ID Interno : ' + idRec;
                        objRespuesta.detalle.push(objrespuestaParcial);
                    } else {
                        if (respuestaGeneracionCupon.error == true) {
                            objRespuesta.error = true;
                            objrespuestaParcial = new Object();
                            objrespuestaParcial.codigo = 'SROV024';
                            objrespuestaParcial.mensaje = 'Error Generando Cupones para la Orden de Venta con ID Interno : ' + idRec + ' - Error : ' + respuestaGeneracionCupon.codigo + ' - Detalle : ' + respuestaGeneracionCupon.mensaje;
                            objRespuesta.detalle.push(objrespuestaParcial);
                        }
                    }

                    if (objRespuesta.error == false) {
                        // INICIO - Obtener Requisiciones Generadas por Orden de Venta
                        var arrayRequisiciones = new Array();
                        var objParam = new Object();
                        objParam.name = 'custrecord_3k_req_compra_ov';
                        objParam.operator = 'IS';
                        objParam.values = idRec;

                        var searchRequisiciones = utilities.searchSaved('customsearch_3k_requisiciones_ov', objParam);
                        if (!utilities.isEmpty(searchRequisiciones) && searchRequisiciones.error == false) {
                            if (!utilities.isEmpty(searchRequisiciones.objRsponseFunction.result) && searchRequisiciones.objRsponseFunction.result.length > 0) {
                                // Agrupar Cupones por ID de Orden
                                var resultSet = searchRequisiciones.objRsponseFunction.result;
                                var resultSearch = searchRequisiciones.objRsponseFunction.search;

                                var idLineaOVAnterior = '';
                                var idLineaOVActual = '';

                                for (var l = 0; !utilities.isEmpty(resultSet) && l < resultSet.length; l++) {

                                    var obj = new Object();
                                    obj.indice = l;
                                    obj.idInterno = resultSet[l].getValue({
                                        name: resultSearch.columns[0]
                                    });
                                    obj.idOV = resultSet[l].getValue({
                                        name: resultSearch.columns[1]
                                    });
                                    obj.idLineaOV = resultSet[l].getValue({
                                        name: resultSearch.columns[2]
                                    });

                                    arrayRequisiciones.push(obj);
                                }
                            } else {
                                objRespuesta.error = true;
                                objrespuestaParcial = new Object();
                                objrespuestaParcial.codigo = 'RDEP013';
                                objrespuestaParcial.mensaje = 'Error Consultando Requisiciones por Orden de Venta para Actualizar Cupones en Orden de Venta con ID Interno : ' + objRespuesta.idOV + ' - Error : No se encontraron Requisiciones';
                                objRespuesta.detalle.push(objrespuestaParcial);
                            }
                        } else {
                            if (utilities.isEmpty(searchRequisiciones)) {
                                objRespuesta.error = true;
                                objrespuestaParcial = new Object();
                                objrespuestaParcial.codigo = 'RDEP014';
                                objrespuestaParcial.mensaje = 'Error Consultando Requisiciones por Orden de Venta para Actualizar Cupones en Orden de Venta con ID Interno : ' + objRespuesta.idOV + ' - Error : No se Recibio Objeto de Respuesta';
                                objRespuesta.detalle.push(objrespuestaParcial);
                            } else {
                                objRespuesta.error = true;
                                objrespuestaParcial = new Object();
                                objrespuestaParcial.codigo = 'RDEP015';
                                objrespuestaParcial.mensaje = 'Error Consultando Requisiciones por Orden de Venta para Actualizar Cupones en Orden de Venta con ID Interno : ' + objRespuesta.idOV + ' - Tipo Error : ' + searchRequisiciones.tipoError + ' - Descripcion : ' + searchRequisiciones.descripcion;
                                objRespuesta.detalle.push(objrespuestaParcial);
                            }
                        }
                        // FIN - Obtener Requisiciones Generadas por Orden de Venta

                        // INICIO - Actualizar Requisiciones
                        if (!utilities.isEmpty(respuestaGeneracionCupon.informacionCupones)) {
                            objRespuesta.cupones = respuestaGeneracionCupon.informacionCuponesResult;
                            for (var s = 0; s < respuestaGeneracionCupon.informacionCupones.length && objRespuesta.error == false; s++) {
                                var objRequisicion = arrayRequisiciones.filter(function (obj) {
                                    return (obj.idLineaOV === respuestaGeneracionCupon.informacionCupones[s].idLineaOV);
                                });

                                if (!utilities.isEmpty(objRequisicion) && objRequisicion.length > 0) {
                                    for (var q = 0; q < objRequisicion.length && objRespuesta.error == false; q++) {
                                        try {
                                            var idRecordRequisicion = record.submitFields({
                                                type: 'customrecord_3k_req_compra',
                                                id: objRequisicion[q].idInterno,
                                                values: {
                                                    custrecord_3k_req_compra_cupon: respuestaGeneracionCupon.informacionCupones[s].idCupones
                                                },
                                                options: {
                                                    enableSourcing: true,
                                                    ignoreMandatoryFields: false
                                                }
                                            });
                                            if (utilities.isEmpty(idRecordRequisicion)) {
                                                objRespuesta.error = true;
                                                objrespuestaParcial = new Object();
                                                objrespuestaParcial.codigo = 'RDEP016';
                                                objrespuestaParcial.mensaje = 'Error Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + objRespuesta.idOV + ' - Error : No se Recibio ID de la Requisicion Actualizada';
                                                objRespuesta.detalle.push(objrespuestaParcial);
                                            }
                                        } catch (exepcionSubmitRequisicion) {
                                            objRespuesta.error = true;
                                            objrespuestaParcial = new Object();
                                            objrespuestaParcial.codigo = 'RDEP017';
                                            objrespuestaParcial.mensaje = 'Excepcion Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + objRespuesta.idOV + ' - Excepcion : ' + exepcionSubmitRequisicion.message.toString();
                                            objRespuesta.detalle.push(objrespuestaParcial);
                                        }
                                    }

                                } else {
                                    objRespuesta.error = true;
                                    objrespuestaParcial = new Object();
                                    objrespuestaParcial.codigo = 'RDEP018';
                                    objrespuestaParcial.mensaje = 'Error Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + objRespuesta.idOV;
                                    objRespuesta.detalle.push(objrespuestaParcial);
                                }
                            }
                        } else {
                            objRespuesta.error = true;
                            objrespuestaParcial = new Object();
                            objrespuestaParcial.codigo = 'RDEP019';
                            objrespuestaParcial.mensaje = 'Error Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + objRespuesta.idOV + ' - Error : No se Recibio Informacion de Array de Cupones';
                            objRespuesta.detalle.push(objrespuestaParcial);
                        }
                        // FIN - Actualizar Requisiciones
                    }
                }


                // FIN - Generar Cupones


            } catch (e) {
                objRespuesta.error = true;
                objrespuestaParcial = new Object({});
                objrespuestaParcial.codigo = 'MCLO001';
                objrespuestaParcial.mensaje = 'Error cerrando linea de OV Excepción: ' + e.message;
                objRespuesta.detalle.push(objrespuestaParcial);
                //objRespuesta.tipoError = 'RORV002';
                //objRespuesta.descripcion = 'No se recibio parametro con informacion a realizar';
                log.error('MCLO001', 'Error cerrando linea de OV Excepción: ' + e.message);
            }

            return objRespuesta
        }

        function generarCupones(idDep, idOV, idCliente, pago) {
            log.audit('After Submit', 'INICIO Generar Cupones');
            var scriptObj = runtime.getCurrentScript();
            log.debug("Remaining governance units: " + scriptObj.getRemainingUsage());
            var recordId = '';
            var arrayCuponesProcesar = new Array();
            var arrayCuponesProcesados = new Array();

            var cuponesGenerados = false;

            var respuesta = new Object();
            respuesta.idOV = '';
            respuesta.idDeposito = '';
            respuesta.error = false;
            respuesta.detalle = new Array();
            respuesta.informacionCupones = new Array();
            respuesta.informacionCuponesResult = new Array();

            try {
                // INICIO - Consultar Configuracion

                respuesta.idDeposito = idDep;
                respuesta.idOV = idOV;
                respuesta.formaPago = pago.formaPago;
                respuesta.monedaPago = pago.monedaPago;
                respuesta.tipoCambioPago = pago.tipoCambioPago;
                respuesta.cantidadMillas = pago.cantidadMillas;
                respuesta.tipoCambioMillas = pago.tipoCambioMillas;
                respuesta.idCliente = idCliente;
                respuesta.tipoCambioMenor = pago.tipoCambioMenor;

                var numeroInicialCupon = '';
                var estadoInicialCupon = '';
                var cantCaracteresCupon = '';
                var busquedaGuardadaCupon = '';

                var searchConfig = utilities.searchSaved('customsearch_3k_configuracion_cupones_ss');

                if (!utilities.isEmpty(searchConfig) && !searchConfig.error) {
                    if (!utilities.isEmpty(searchConfig.objRsponseFunction.result) && searchConfig.objRsponseFunction.result.length > 0) {
                        numeroInicialCupon = searchConfig.objRsponseFunction.result[0].getValue({
                            name: searchConfig.objRsponseFunction.search.columns[0]
                        });
                        estadoInicialCupon = searchConfig.objRsponseFunction.result[0].getValue({
                            name: searchConfig.objRsponseFunction.search.columns[1]
                        });
                        cantCaracteresCupon = searchConfig.objRsponseFunction.result[0].getValue({
                            name: searchConfig.objRsponseFunction.search.columns[7]
                        });
                        busquedaGuardadaCupon = searchConfig.objRsponseFunction.result[0].getValue({
                            name: searchConfig.objRsponseFunction.search.columns[8]
                        });
                        if (utilities.isEmpty(numeroInicialCupon) || utilities.isEmpty(estadoInicialCupon) || utilities.isEmpty(cantCaracteresCupon) || utilities.isEmpty(busquedaGuardadaCupon)) {
                            respuesta.error = true;
                            var mensaje = 'No se encuentra configurada la siguiente informacion del panel de configuracion de cupones : ';
                            if (utilities.isEmpty(numeroInicialCupon)) {
                                mensaje = mensaje + ' Numero Inicial de Cupon / ';
                            }
                            if (utilities.isEmpty(estadoInicialCupon)) {
                                mensaje = mensaje + ' Estado Inicial de Cupon / ';
                            }
                            if (utilities.isEmpty(cantCaracteresCupon)) {
                                mensaje = mensaje + ' Cantidad de Caracteres del Cupon / ';
                            }
                            if (utilities.isEmpty(busquedaGuardadaCupon)) {
                                mensaje = mensaje + ' Busqueda Guardada de Cupones Generados / ';
                            }
                            respuestaParcial = new Object({});
                            respuestaParcial.codigo = 'RDEP005';
                            respuestaParcial.mensaje = mensaje;
                            respuesta.detalle.push(respuestaParcial);
                        }
                    } else {
                        respuesta.error = true;
                        respuestaParcial = new Object({});
                        respuestaParcial.codigo = 'RDEP006';
                        respuestaParcial.mensaje = 'No se encuentra realizada la Configuracion de Cupones';
                        respuesta.detalle.push(respuestaParcial);
                    }
                } else {
                    respuesta.error = true;
                    respuestaParcial = new Object({});
                    respuestaParcial.codigo = 'RDEP007';
                    respuestaParcial.mensaje = 'Error Consultando Configuracion de Cupones - Tipo Error : ' + searchConfig.tipoError + ' - Descripcion : ' + searchConfig.descripcion;
                    respuesta.detalle.push(respuestaParcial);
                }

                // FIN - Consultar Configuracion

                // INICIO - Consultar Tipos Cupones
                var arrayTiposCupones = new Array();
                var searchTiposCupones = utilities.searchSaved('customsearch_3k_tipos_cupones');

                if (!utilities.isEmpty(searchTiposCupones) && !searchTiposCupones.error) {
                    if (!utilities.isEmpty(searchTiposCupones.objRsponseFunction.result) && searchTiposCupones.objRsponseFunction.result.length > 0) {
                        var resultSet = searchTiposCupones.objRsponseFunction.result;
                        var resultSearch = searchTiposCupones.objRsponseFunction.search;
                        for (var q = 0; q < resultSet.length; q++) {
                            var infoTipoCupon = new Object({});
                            infoTipoCupon.idInterno = resultSet[q].getValue({
                                name: resultSearch.columns[0]
                            });
                            infoTipoCupon.servicio = resultSet[q].getValue({
                                name: resultSearch.columns[2]
                            });
                            arrayTiposCupones.push(infoTipoCupon);
                        }
                    } else {
                        respuesta.error = true;
                        respuestaParcial = new Object({});
                        respuestaParcial.codigo = 'RDEP023';
                        respuestaParcial.mensaje = 'No se encuentra realizada la Configuracion de Tipos de Cupones';
                        respuesta.detalle.push(respuestaParcial);
                    }
                } else {
                    respuesta.error = true;
                    respuestaParcial = new Object({});
                    respuestaParcial.codigo = 'RDEP024';
                    respuestaParcial.mensaje = 'Error Consultando Configuracion de Tipos de Cupones - Tipo Error : ' + searchConfig.tipoError + ' - Descripcion : ' + searchConfig.descripcion;
                    respuesta.detalle.push(respuestaParcial);
                }
                // FIN - Consultar Tipos Cupones
                if (!respuesta.error) {
                    // INICIO - Consultar Cupones por ID Detalle OV
                    var arrayDetalleCuponesOV = new Array();
                    var objParam = new Object({});
                    objParam.name = 'custrecord_3k_det_linea_ov_ov';
                    objParam.operator = 'IS';
                    objParam.values = respuesta.idOV;

                    var searchDetalleCuponesOV = utilities.searchSaved('customsearch_3k_cupones_det_ov', objParam);
                    if (!utilities.isEmpty(searchDetalleCuponesOV) && !searchDetalleCuponesOV.error) {
                        if (!utilities.isEmpty(searchDetalleCuponesOV.objRsponseFunction.result) && searchDetalleCuponesOV.objRsponseFunction.result.length > 0) {

                            var resultSet = searchDetalleCuponesOV.objRsponseFunction.result;
                            var resultSearch = searchDetalleCuponesOV.objRsponseFunction.search;

                            var idLineaOVAnterior = '';
                            var idLineaOVActual = '';

                            for (var l = 0; !utilities.isEmpty(resultSet) && l < resultSet.length; l++) {

                                var obj = new Object({});
                                obj.indice = l;
                                obj.idInterno = resultSet[l].getValue({
                                    name: resultSearch.columns[1]
                                });
                                obj.idOV = resultSet[l].getValue({
                                    name: resultSearch.columns[0]
                                });
                                obj.idLineaOV = resultSet[l].getValue({
                                    name: resultSearch.columns[1]
                                });

                                obj.cantidadCupones = resultSet[l].getValue({
                                    name: resultSearch.columns[2]
                                });

                                log.audit('After Submit', 'INICIO Generacion Cupones - CANTIDAD CUPONES : ' + obj.cantidadCupones + ' - ID Interno Linea : ' + obj.idInterno);

                                arrayDetalleCuponesOV.push(obj);
                            }
                        } else {
                            respuesta.error = true;
                            respuestaParcial = new Object({});
                            respuestaParcial.codigo = 'RDEP026';
                            respuestaParcial.mensaje = 'Error Consultando Cantidad de Cupones por Detalle de Orden en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se encontraron Detalle de Ordenes';
                            respuesta.detalle.push(respuestaParcial);
                        }
                    } else {
                        if (utilities.isEmpty(searchRequisiciones)) {
                            respuesta.error = true;
                            respuestaParcial = new Object({});
                            respuestaParcial.codigo = 'RDEP027';
                            respuestaParcial.mensaje = 'Error Consultando Cantidad de Cupones por Detalle de Orden en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Recibio Objeto de Respuesta';
                            respuesta.detalle.push(respuestaParcial);
                        } else {
                            respuesta.error = true;
                            respuestaParcial = new Object({});
                            respuestaParcial.codigo = 'RDEP028';
                            respuestaParcial.mensaje = 'Error Cantidad de Cupones por Detalle de Orden en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Tipo Error : ' + searchRequisiciones.tipoError + ' - Descripcion : ' + searchRequisiciones.descripcion;
                            respuesta.detalle.push(respuestaParcial);
                        }
                    }
                }
                // FIN - Consultar Cupones por ID Detalle OV

                log.debug("Remaining governance units 2: " + scriptObj.getRemainingUsage());
                log.audit('After Submit', 'INICIO Generacion Cupones - ID Interno OV : ' + respuesta.idOV + ' - ID Interno Deposito : ' + respuesta.idDeposito);
                if (!respuesta.error) {
                    var objRecordOV = record.load({
                        type: record.Type.SALES_ORDER,
                        id: respuesta.idOV,
                        isDynamic: true
                    });
                    if (!utilities.isEmpty(objRecordOV)) {

                        var cantidadLineasOV = objRecordOV.getLineCount({
                            sublistId: 'item'
                        });

                        var moneda = objRecordOV.getValue({
                            fieldId: 'currency'
                        });

                        var tipoCambio = objRecordOV.getValue({
                            fieldId: 'exchangerate'
                        });

                        var sistema = objRecordOV.getValue({
                            fieldId: 'custbody_cseg_3k_sistema'
                        });

                        var sitioWebOV = objRecordOV.getValue({
                            fieldId: 'custbody_cseg_3k_sitio_web_o'
                        });

                        var facturaCliente = objRecordOV.getValue({
                            fieldId: 'custbody_3k_factura_cliente'
                        });

                        /*var SitioWeb = objRecordOV.getValue({
                            fieldId: 'custbody_cseg_3k_sistema'
                        });*/

                        for (var i = 0; i < cantidadLineasOV && respuesta.error == false; i++) {

                            var esVoucher = objRecordOV.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_linea_voucher',
                                line: i
                            });

                            var idLineaOV = objRecordOV.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_id_orden',
                                line: i
                            });

                            var esRedondeo = objRecordOV.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_es_redondeo',
                                line: i
                            });

                            var lineaCerrada = objRecordOV.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'isclosed',
                                line: i
                            });

                            var cantLineasRequi = objRecordOV.getLineCount({
                                sublistId: 'recmachcustrecord_3k_req_compra_ov'
                            });

                            for (var x = 0; x < cantLineasRequi; x++) {

                                var idDetalleOVRequi = objRecordOV.getSublistValue({
                                    sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                    fieldId: 'custrecord_3k_req_compra_id_det_orden',
                                    line: x
                                });

                                log.debug('generarCupones', 'idDetalleOVRequi: ' + idDetalleOVRequi);
                                log.debug('generarCupones', 'idLineaOV: ' + idLineaOV);

                                if (idDetalleOVRequi == idLineaOV) {
                                    var SKU_Articulo = objRecordOV.getSublistValue({
                                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                        fieldId: 'custrecord_3k_req_compra_sku',
                                        line: x
                                    });

                                    var KIT = objRecordOV.getSublistValue({
                                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                        fieldId: 'custrecord_3k_req_compra_kit',
                                        line: x
                                    });

                                    var SKU_Proveedor = objRecordOV.getSublistValue({
                                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                        fieldId: 'custrecord_3k_req_compra_sku_prov',
                                        line: x
                                    });

                                    var idInternoREQ = objRecordOV.getSublistValue({
                                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                        fieldId: 'id',
                                        line: x
                                    });

                                    break;
                                }

                            }

                            log.debug('generarCupones', 'SKU_Articulo: ' + SKU_Articulo);
                            log.debug('generarCupones', 'KIT: ' + KIT + ' typeof: ' + typeof (KIT));
                            log.debug('generarCupones', 'SKU_Proveedor: ' + SKU_Proveedor);
                            log.debug('generarCupones', 'ID INTERNO REQ: ' + idInternoREQ);

                            var SKU = '';
                            var IDREQ = '';

                            if (KIT == 'S') {
                                SKU = 'COMBO';
                            } else {
                                if (!utilities.isEmpty(SKU_Proveedor)) {
                                    SKU = SKU_Proveedor;
                                } else {
                                    if (!utilities.isEmpty(SKU_Articulo)) {
                                        SKU = SKU_Articulo;
                                    }
                                }
                            }

                            if (!utilities.isEmpty(idInternoREQ)) {
                                IDREQ = idInternoREQ;
                            }

                            log.debug('generarCupones', 'SKU: ' + SKU);

                            var generarCupon = false;

                            if (esVoucher == false && !esRedondeo && !lineaCerrada) {
                                // INICIO - Consultar si la linea no Posee Cupones Generados
                                if (!utilities.isEmpty(idLineaOV)) {
                                    var objDetalleLineaOV = arrayDetalleCuponesOV.filter(function (obj) {
                                        return (obj.idLineaOV == idLineaOV);
                                    });

                                    if (!utilities.isEmpty(objDetalleLineaOV) && objDetalleLineaOV.length > 0) {

                                        if (utilities.isEmpty(objDetalleLineaOV[0].cantidadCupones) || (!utilities.isEmpty(objDetalleLineaOV[0].cantidadCupones) && objDetalleLineaOV[0].cantidadCupones <= 0)) {
                                            generarCupon = true;
                                            cuponesGenerados = true;
                                        } else {
                                            // Si ya posee Cupon Generado - Guardo el Cupon para No Actualizar la Requisicion, ni Tampoco Actualizar el Cupon en el MAP/REDUCE
                                            arrayCuponesProcesados.push(objDetalleLineaOV[0].idInterno);
                                        }
                                    } else {
                                        respuesta.error = true;
                                        var mensaje = 'After Submit No se encontro el Detalle de Linea con ID Interno : ' + idLineaOV + ' de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' en la informacion de Cupones Generados por Detalle de OV';

                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'RDEP029';
                                        respuestaParcial.mensaje = mensaje;
                                        respuesta.detalle.push(respuestaParcial);
                                    }
                                } else {
                                    respuesta.error = true;
                                    var mensaje = ' After Submit No se encuentra configurada la siguiente informacion de la Linea de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' Requerida para la generacion de los Cupones : ';
                                    mensaje = mensaje + ' Linea de Orden de Venta / ';

                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'RDEP010';
                                    respuestaParcial.mensaje = mensaje;
                                    respuesta.detalle.push(respuestaParcial);
                                }
                                // FIN - Consultar si la linea no Posee Cupones Generados
                            }

                            log.debug("Remaining governance units 3: " + scriptObj.getRemainingUsage());
                            if (respuesta.error == false && esVoucher == false && !esRedondeo && !lineaCerrada && generarCupon == true) {

                                var idArticulo = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    line: i
                                });

                                var cantidad = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    line: i
                                });

                                var idCampania = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_campana',
                                    line: i
                                });

                                var fechaEntrega = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_fecha_entrega',
                                    line: i
                                });

                                var lugarEntrega = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_lugar_retiro',
                                    line: i
                                });

                                var ciudad = objRecordOV.getSublistText({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_ciudad',
                                    line: i
                                });

                                var barrio = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_barrio',
                                    line: i
                                });

                                var direccion = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_direccion',
                                    line: i
                                });

                                var importeEnvio = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_imp_envio',
                                    line: i
                                });

                                var cuotas = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_cant_cuotas',
                                    line: i
                                });

                                var importe = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                    line: i
                                });

                                var importeIVA = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'tax1amt',
                                    line: i
                                });

                                var esServicio = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_servicio',
                                    line: i
                                });

                                var porcentajeComision = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_porcentaje_comision',
                                    line: i
                                });

                                var bis = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_bis',
                                    line: i
                                });

                                var puerta = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_numero_puerta',
                                    line: i
                                });

                                var horaInicio = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_hora_inicio',
                                    line: i
                                });

                                var horaFin = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_hora_fin',
                                    line: i
                                });

                                var pickUp = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_pickup',
                                    line: i
                                });

                                var oficinaOrigen = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_oficina_origen',
                                    line: i
                                });

                                var apartamento = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_apartamento',
                                    line: i
                                });

                                var calle = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_calle',
                                    line: i
                                });

                                var turno = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_turno_envio',
                                    line: i
                                });

                                var entrega = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_entrega',
                                    line: i
                                });

                                var telQuienRecibe = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_tel_quien_recibe',
                                    line: i
                                });

                                var nombreQuienRecibe = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_nombre_quien_recibe',
                                    line: i
                                });

                                var oficinaDestino = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_oficina_destino',
                                    line: i
                                });

                                var fechaDisponibilidadCliente = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_fecha_disponibiliad',
                                    line: i
                                });

                                var fechaTravel = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_cseg_3k_fecha',
                                    line: i
                                });

                                var destinoTravel = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_cseg_3k_destino',
                                    line: i
                                });

                                var tipoOperativaTravel = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_cseg_3k_tipo_operat',
                                    line: i
                                });

                                var mainCategory = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_cseg_3k_main_cat',
                                    line: i
                                });

                                var tipoServicioUES = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_tipo_servicio_ues',
                                    line: i
                                });

                                var IDOrdenDetalleMisBeneficios = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_id_detalle_orden_misbe',
                                    line: i
                                });

                                var importeBrutoWoow = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_importe_bruto_woow',
                                    line: i
                                });

                                var importeCupon = 0;
                                var importeDinero = 0;
                                var importeMillas = 0;
                                var importeDescuento = 0;
                                var importeVoucherDev = 0;

                                importeCupon = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_importe_cupon',
                                    line: i
                                });

                                var importeUnitarioWoow = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_importe_unitario_woow',
                                    line: i
                                });

                                if (utilities.isEmpty(importeCupon) || (!utilities.isEmpty(importeCupon) && isNaN(parseFloat(importeCupon, 10))) || (!utilities.isEmpty(importeCupon) && !isNaN(parseFloat(importeCupon, 10)) && parseFloat(importeCupon, 10) <= 0.00)) {
                                    importeCupon = parseFloat(importeUnitarioWoow, 10);
                                }

                                var importeBrutoConMillas = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_importe_bruto_millas_woow',
                                    line: i
                                });

                                if (utilities.isEmpty(importeBrutoConMillas) || (!utilities.isEmpty(importeBrutoConMillas) && isNaN(importeBrutoConMillas))) {
                                    importeBrutoConMillas = parseFloat(0, 10);
                                }

                                var importeBrutoSinMillas = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_importe_bruto_woow',
                                    line: i
                                });

                                if (utilities.isEmpty(importeBrutoSinMillas) || (!utilities.isEmpty(importeBrutoSinMillas) && isNaN(importeBrutoSinMillas))) {
                                    importeBrutoSinMillas = parseFloat(0, 10);
                                }

                                importeMillas = (parseFloat(importeBrutoConMillas, 10) - parseFloat(importeBrutoSinMillas, 10)) / parseFloat(cantidad, 10);

                                if (importeMillas < 0) {
                                    importeMillas = parseFloat(0, 10);
                                }


                                var tipoVoucher = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_cod_accion_voucher',
                                    line: i
                                });

                                if (tipoVoucher == '1') {
                                    importeDescuento = objRecordOV.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_importe_voucher',
                                        line: i
                                    });
                                }

                                if (utilities.isEmpty(importeDescuento) || (!utilities.isEmpty(importeDescuento) && isNaN(importeDescuento))) {
                                    importeDescuento = parseFloat(0, 10);
                                }

                                importeDescuento = parseFloat(importeDescuento, 10) / parseFloat(cantidad, 10);

                                if (tipoVoucher == '2') {
                                    importeVoucherDev = objRecordOV.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_importe_voucher',
                                        line: i
                                    });
                                }

                                importeVoucherDev = parseFloat(importeVoucherDev, 10) / parseFloat(cantidad, 10);

                                if (utilities.isEmpty(importeVoucherDev) || (!utilities.isEmpty(importeVoucherDev) && isNaN(importeVoucherDev))) {
                                    importeVoucherDev = parseFloat(0, 10);
                                }

                                //importeDinero = (parseFloat(importeBrutoWoow,10)/parseFloat(cantidad,10)) - parseFloat(importeDescuento,10) - parseFloat(importeVoucherDev,10);

                                importeDinero = parseFloat(importeCupon, 10) - parseFloat(importeMillas, 10) - parseFloat(importeDescuento, 10) - parseFloat(importeVoucherDev, 10);

                                if (importeDinero < 0) {
                                    importeDinero = parseFloat(0, 10);
                                }

                                //log.audit('Cobranza Cliente', 'Importe Cupon : ' + importeCupon);

                                // INICIO - Generar Codigos de Cupones
                                var arrayCodigosCuponesGenerados = utilities.generarCodigoCupones(cantidad, null, cantCaracteresCupon, busquedaGuardadaCupon);
                                // FIN - Generar Codigos de Cupones


                                if (!utilities.isEmpty(idArticulo) && !utilities.isEmpty(cantidad) && !utilities.isEmpty(idLineaOV) && !utilities.isEmpty(idCampania) && !utilities.isEmpty(importeCupon) && !isNaN(parseFloat(importeCupon, 10)) && !utilities.isEmpty(arrayCodigosCuponesGenerados) && arrayCodigosCuponesGenerados.length == cantidad) {

                                    //log.audit('Cobranza Cliente', 'Cantidad Articulos : ' + cantidad);

                                    for (var j = 0; j < cantidad && respuesta.error == false; j++) {

                                        objRecordOV.selectNewLine({
                                            sublistId: 'recmachcustrecord_3k_cupon_ord_venta'
                                        });

                                        objRecordOV.setCurrentSublistValue({
                                            sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                            fieldId: 'custrecord_3k_cupon_id_alias',
                                            value: (idLineaOV.toString() + '-' + (parseInt(numeroInicialCupon, 10) + parseInt(j, 10)).toString())
                                        });

                                        //var codigoCuponGenerado = utilities.generarCodigoAleatorio(null, cantCaracteresCupon, busquedaGuardadaCupon);
                                        var codigoCuponGenerado = arrayCodigosCuponesGenerados[j];


                                        if (utilities.isEmpty(codigoCuponGenerado)) {
                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'SROV019';
                                            respuestaParcial.mensaje = 'After Submit No se pudo Generar el Codigo de Cupon para la Orden de Venta con ID Interno : ' + respuesta.idOV;
                                            respuesta.detalle.push(respuestaParcial);
                                        }

                                        if (respuesta.error == false) {

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_codigo',
                                                value: codigoCuponGenerado
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_estado',
                                                value: estadoInicialCupon
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_ord_venta',
                                                value: respuesta.idOV
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_articulo',
                                                value: idArticulo
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_importe',
                                                value: importeCupon
                                            });

                                            /*objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_importe',
                                                value: importe
                                            });*/

                                            /*objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_alicuota_iva',
                                                value: parseFloat((parseFloat(importeIVA,10) / parseFloat(cantidad,10)),10).toFixed(2)
                                            });*/

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_campana',
                                                value: idCampania
                                            });
                                            //log.debug('generarCupones', 'idCampania : ' + idCampania + ' - j : ' + j);                                            
                                            if (j === 0) {
                                                //log.debug('generarCupones', 'Dentro del IF - LINE 5660' + j);      
                                                var objFieldLookUpIsTravel = search.lookupFields({
                                                    type: 'customrecord_3k_campanas',
                                                    id: idCampania,
                                                    columns: [
                                                        'custrecord_3k_campanas_travel'
                                                    ]
                                                });

                                                var isTravel = objFieldLookUpIsTravel.custrecord_3k_campanas_travel;

                                                log.debug('generarCupones', 'isTravel : ' + isTravel + ' - j : ' + j);
                                            }

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_id_orden',
                                                value: idLineaOV
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_sku_proveedor',
                                                value: SKU
                                            });

                                            if (!utilities.isEmpty(IDREQ)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_req',
                                                    value: IDREQ
                                                });
                                            }

                                            /*if (!utilities.isEmpty(respuesta.monedaPago) && respuesta.monedaPago != moneda) {

                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_moneda',
                                                    value: respuesta.monedaPago
                                                });

                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_tipo_cambio',
                                                    value: respuesta.tipoCambioPago.toString()
                                                });

                                            } else {

                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_moneda',
                                                    value: moneda
                                                });

                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_tipo_cambio',
                                                    value: tipoCambio
                                                });
                                            }*/

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_moneda',
                                                value: moneda
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_tipo_cambio',
                                                value: tipoCambio
                                            });

                                            if (!utilities.isEmpty(pago.tipoCambioMenor)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_tipo_cambio_woow',
                                                    value: parseFloat(pago.tipoCambioMenor, 10).toFixed(2).toString()
                                                });
                                            }



                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_met_pago',
                                                value: respuesta.formaPago
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_cupon_imp_envio',
                                                value: importeEnvio
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_cuotas',
                                                value: cuotas
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_fecha_entrega',
                                                value: fechaEntrega
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_lugar_retiro',
                                                value: lugarEntrega
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_ciudad',
                                                value: ciudad
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_barrio',
                                                value: barrio
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_direccion',
                                                value: direccion
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_cobranza',
                                                value: respuesta.idDeposito
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_por_comision',
                                                value: porcentajeComision
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_hora_ini',
                                                value: horaInicio
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_hora_fin',
                                                value: horaFin
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_bis',
                                                value: bis
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_puerta',
                                                value: puerta
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_oficina_origen',
                                                value: oficinaOrigen
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_pickup',
                                                value: pickUp
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_apartamento',
                                                value: apartamento
                                            });

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_calle',
                                                value: calle
                                            });

                                            if (!utilities.isEmpty(entrega)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_entrega',
                                                    value: entrega
                                                });
                                            }

                                            if (!utilities.isEmpty(telQuienRecibe)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_telf_recibe',
                                                    value: telQuienRecibe
                                                });
                                            }

                                            if (!utilities.isEmpty(nombreQuienRecibe)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_nomb_recibe',
                                                    value: nombreQuienRecibe
                                                });
                                            }

                                            if (!utilities.isEmpty(oficinaDestino)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_oficina_destino',
                                                    value: oficinaDestino
                                                });
                                            }


                                            if (!utilities.isEmpty(turno)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_turno_log',
                                                    value: turno
                                                });
                                            }

                                            if (!utilities.isEmpty(tipoServicioUES)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_tipo_serv_ues',
                                                    value: tipoServicioUES
                                                });
                                            }

                                            if (!utilities.isEmpty(fechaDisponibilidadCliente)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_fecha_dis_cli_ini',
                                                    value: fechaDisponibilidadCliente
                                                });
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_fecha_dis_cliente',
                                                    value: fechaDisponibilidadCliente
                                                });
                                            }

                                            if (!utilities.isEmpty(sitioWebOV)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_69_cseg_3k_sitio_web_o',
                                                    value: sitioWebOV
                                                });
                                            }

                                            if (!utilities.isEmpty(facturaCliente)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_factura_cliente',
                                                    value: facturaCliente
                                                });
                                            } else {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_factura_cliente',
                                                    value: false
                                                });
                                            }

                                            if (!utilities.isEmpty(sistema)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_69_cseg_3k_sistema',
                                                    value: sistema
                                                });
                                            }

                                            if (!utilities.isEmpty(destinoTravel)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_69_cseg_3k_destino',
                                                    value: destinoTravel
                                                });
                                            }

                                            if (!utilities.isEmpty(tipoOperativaTravel)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_69_cseg_3k_tipo_operat',
                                                    value: tipoOperativaTravel
                                                });
                                            }

                                            if (!utilities.isEmpty(mainCategory)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_69_cseg_3k_main_cat',
                                                    value: mainCategory
                                                });
                                            }

                                            if (!utilities.isEmpty(fechaTravel)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_69_cseg_3k_fecha',
                                                    value: fechaTravel
                                                });
                                            }

                                            // INICIO - Obtener ID Tipo Cupon
                                            var objCupon = arrayTiposCupones.filter(function (obj) {
                                                return (obj.servicio === esServicio);
                                            });
                                            // FIN - Obtener ID Tipo Cupon

                                            if (!utilities.isEmpty(objCupon) && objCupon.length > 0) {

                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupones_tipo',
                                                    value: objCupon[0].idInterno
                                                });

                                            }

                                            if (!utilities.isEmpty(IDOrdenDetalleMisBeneficios)) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_orden_misbe',
                                                    value: IDOrdenDetalleMisBeneficios
                                                });
                                            }

                                            // INICIO - NUEVO - Para Liquidacion Sobre Millas,Descuentos,Vouchers
                                            if (!utilities.isEmpty(importeMillas) && !isNaN(parseFloat(importeMillas, 10))) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_importe_millas',
                                                    value: parseFloat(importeMillas, 10).toFixed(2)
                                                });
                                            }
                                            if (!utilities.isEmpty(importeDescuento) && !isNaN(parseFloat(importeDescuento, 10))) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_importe_desc',
                                                    value: parseFloat(importeDescuento, 10).toFixed(2)
                                                });
                                            }

                                            if (!utilities.isEmpty(importeVoucherDev) && !isNaN(parseFloat(importeVoucherDev, 10))) {
                                                objRecordOV.setCurrentSublistValue({
                                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                    fieldId: 'custrecord_3k_cupon_importe_dev',
                                                    value: parseFloat(importeVoucherDev, 10).toFixed(2)
                                                });
                                            }

                                            objRecordOV.setCurrentSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_importe_dinero',
                                                value: parseFloat(importeDinero, 10).toFixed(2)
                                            });
                                            // FIN - NUEVO - Para Liquidacion Sobre Millas,Descuentos,Vouchers

                                            objRecordOV.commitLine({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta'
                                            });

                                            log.debug("Remaining governance units 4: " + scriptObj.getRemainingUsage());

                                        }

                                    }


                                } else {
                                    respuesta.error = true;
                                    var mensaje = 'No se encuentra configurada la siguiente informacion de la Linea de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' Requerida para la generacion de los Cupones : ';

                                    if (utilities.isEmpty(importeCupon) || (!utilities.isEmpty(importeCupon) && isNaN(parseFloat(importeCupon, 10)))) {
                                        mensaje = mensaje + ' Importe de Cupon / ';
                                    }
                                    if (utilities.isEmpty(idCampania)) {
                                        mensaje = mensaje + ' Campaña / ';
                                    }
                                    if (utilities.isEmpty(idArticulo)) {
                                        mensaje = mensaje + ' Articulo / ';
                                    }
                                    if (utilities.isEmpty(cantidad)) {
                                        mensaje = mensaje + ' Cantidad / ';
                                    }
                                    if (utilities.isEmpty(idLineaOV)) {
                                        mensaje = mensaje + ' Linea de Orden de Venta / ';
                                    }
                                    if (utilities.isEmpty(arrayCodigosCuponesGenerados)) {
                                        mensaje = mensaje + ' Codigos de Cupones Generados / ';
                                    } else {
                                        if (arrayCodigosCuponesGenerados.length != cantidad) {
                                            mensaje = mensaje + ' Cantidad de Codigos de Cupones Generados Menor a la Cantidad de Cupones A Generar / ';
                                        }
                                    }


                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'RDEP010';
                                    respuestaParcial.mensaje = mensaje;
                                    respuesta.detalle.push(respuestaParcial);
                                }
                            }
                        }

                        if (respuesta.error == false && cuponesGenerados == true) {

                            // INICIO - Grabar Orden de Venta

                            try {
                                var recordId = objRecordOV.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: false
                                });
                            } catch (excepcionSaveOV) {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'RDEP011';
                                respuestaParcial.mensaje = 'Excepcion Actualizando Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Excepcion : ' + excepcionSaveOV.message.toString();
                                respuesta.detalle.push(respuestaParcial);
                            }
                            if (utilities.isEmpty(recordId)) {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'RDEP012';
                                respuestaParcial.mensaje = 'Error Actualizando Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se recibio el ID Interno de la Orden de Venta Actualizada';
                                respuesta.detalle.push(respuestaParcial);
                            }

                            log.debug("Remaining governance units 5: " + scriptObj.getRemainingUsage());

                            if (respuesta.error == false) {
                                var informacionCupones = new Array();
                                var informacionCuponesResult = new Array();

                                var filtrosConsultaCupones = new Array();

                                var filtroOV = new Object();
                                filtroOV.name = 'custrecord_3k_cupon_ord_venta';
                                filtroOV.operator = 'IS';
                                filtroOV.values = respuesta.idOV;
                                filtrosConsultaCupones.push(filtroOV);

                                if (!utilities.isEmpty(arrayCuponesProcesados) && arrayCuponesProcesados.length > 0) {

                                    var filtroCupones = new Object();
                                    filtroCupones.name = 'custrecord_3k_cupon_id_orden';
                                    filtroCupones.operator = 'NONEOF';
                                    filtroCupones.values = arrayCuponesProcesados;
                                    filtrosConsultaCupones.push(filtroCupones);

                                }

                                log.audit('After Submit', 'INICIO Generacion Cupones - ID Interno ORDEN DE VENTA : ' + respuesta.idOV + ' - ARRAY CUPONES PROCESADOS : ' + arrayCuponesProcesados.length);

                                var searchCupones = utilities.searchSavedPro('customsearch_3k_cupones_ov', filtrosConsultaCupones);
                                if (!utilities.isEmpty(searchCupones) && searchCupones.error == false) {
                                    if (!utilities.isEmpty(searchCupones.objRsponseFunction.result) && searchCupones.objRsponseFunction.result.length > 0) {
                                        // Agrupar Cupones por ID de Orden
                                        var resultSet = searchCupones.objRsponseFunction.result;
                                        var resultSearch = searchCupones.objRsponseFunction.search;

                                        var idLineaOVAnterior = '';
                                        var idLineaOVActual = '';
                                        var contador = 0;

                                        var l = 0;

                                        while (!utilities.isEmpty(resultSet) && resultSet.length > 0 && l < resultSet.length) {
                                            var arrayCupones = new Array();
                                            var arrayCuponesResult = new Array();
                                            var obj = new Object();
                                            obj.indice = contador;
                                            contador++;

                                            idLineaOVActual = resultSet[l].getValue({
                                                name: resultSearch.columns[2]
                                            });

                                            do {
                                                idLineaOVAnterior = idLineaOVActual;

                                                var idCupon = resultSet[l].getValue({
                                                    name: resultSearch.columns[0]
                                                });

                                                var codigoCupon = resultSet[l].getValue({
                                                    name: resultSearch.columns[3]
                                                });

                                                var aliasCupon = resultSet[l].getValue({
                                                    name: resultSearch.columns[4]
                                                });

                                                arrayCupones.push(idCupon);
                                                arrayCuponesProcesar.push(idCupon);

                                                var informacionParcialCupon = new Object();
                                                informacionParcialCupon.idInterno = idCupon;
                                                informacionParcialCupon.codigo = codigoCupon;
                                                informacionParcialCupon.alias = aliasCupon;
                                                arrayCuponesResult.push(informacionParcialCupon);


                                                l++;


                                                if (l < resultSet.length) {

                                                    idLineaOVActual = resultSet[l].getValue({
                                                        name: resultSearch.columns[2]
                                                    });

                                                }

                                            } while (l < resultSet.length && idLineaOVActual == idLineaOVAnterior)

                                            var obj = new Object();
                                            obj.idOV = respuesta.idOV;
                                            obj.idLineaOV = idLineaOVAnterior;
                                            obj.idCupones = arrayCupones;

                                            informacionCupones.push(obj);

                                            var objCupon = new Object();
                                            objCupon.idOV = respuesta.idOV;
                                            objCupon.idLineaOV = idLineaOVAnterior;
                                            objCupon.informacionCupones = arrayCuponesResult;

                                            informacionCuponesResult.push(objCupon);


                                            log.debug("Remaining governance units 6: " + scriptObj.getRemainingUsage());
                                            //INICIO RECORRIDO DE CUPONES PARA GENERAR ASIENTOS CONTABLES
                                            /*for (var x = 0; x < arrayCupones.length; x++) {

                                                 var informacionCupon = new Object({});
                                                 informacionCupon.idInterno = '';
                                                 informacionCupon.tipoTransaccion = '';
                                                 informacionCupon.registro = '';

                                                 var objRecordCupon = record.load({
                                                     type: 'customrecord_3k_cupones',
                                                     id: arrayCupones[x],
                                                     isDynamic: true,
                                                 });

                                                 if (!utilities.isEmpty(objRecordCupon)) {
                                                     informacionCupon.registro = objRecordCupon;

                                                     var accionCupon = objRecordCupon.getValue({
                                                         fieldId: 'custrecord_3k_cupon_cod_acc'
                                                     });

                                                     var cuponServicio = objRecordCupon.getValue({
                                                         fieldId: 'custrecord_3k_cupones_servicio'
                                                     });

                                                     var cuponLiquidado = objRecordCupon.getValue({
                                                         fieldId: 'custrecord_3k_cupon_liquidado'
                                                     });

                                                     log.debug('Grabar Cupon', 'Cupon de Servicio : ' + cuponServicio + ' - Codigo de Accion : ' + accionCupon + ' - Cupon Liquidado : ' + cuponLiquidado);

                                                     if (cuponServicio == true && cuponLiquidado == false) {
                                                         var cuponewRespuesta = CuponNew(informacionCupon);
                                                         log.debug("Remaining governance units 7: " + scriptObj.getRemainingUsage());
                                                     }
                                                 } else {
                                                     var mensaje = 'Error cargando Registro de Cupon';
                                                     respuesta.error = true;
                                                     respuestaParcial = new Object();
                                                     respuestaParcial.codigo = 'SCUP004';
                                                     respuestaParcial.mensaje = 'Error Actualizando Cupon con ID Interno : ' + arrayCupones[x] + ' - Error : ' + mensaje;
                                                     respuesta.detalle.push(respuestaParcial);
                                                 }
                                             }*/


                                        }

                                        respuesta.informacionCupones = informacionCupones;
                                        respuesta.informacionCuponesResult = informacionCuponesResult;
                                        respuesta.esServicio = esServicio;
                                        respuesta.isTravel = isTravel;

                                    } else {
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'RDEP020';
                                        respuestaParcial.mensaje = 'Error Consultando Cupones por Orden de Venta en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se encontraron Cupones Generados';
                                        respuesta.detalle.push(respuestaParcial);
                                    }
                                } else {
                                    if (utilities.isEmpty(searchCupones)) {
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'RDEP021';
                                        respuestaParcial.mensaje = 'Error Consultando Cupones por Orden de Venta en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Recibio Objeto de Respuesta';
                                        respuesta.detalle.push(respuestaParcial);
                                    } else {
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'RDEP022';
                                        respuestaParcial.mensaje = 'Error Consultando Cupones por Orden en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Tipo Error : ' + searchCupones.tipoError + ' - Descripcion : ' + searchCupones.descripcion;
                                        respuesta.detalle.push(respuestaParcial);
                                    }
                                }
                            }
                        }


                    } else {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'SROV013';
                        respuestaParcial.mensaje = 'After Submit No se pudo cargar la Orden de Venta con ID Interno : ' + respuesta.idOV;
                        respuesta.detalle.push(respuestaParcial);

                    }
                }

                log.audit('After Submit', 'FIN Generacion Cupones - ID Interno OV : ' + respuesta.idOV + ' - ID Interno Deposito : ' + recordId);

            } catch (excepcionGeneral) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'RDEP015';
                respuestaParcial.mensaje = 'Excepcion Generando Cupones para Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Excepcion : ' + excepcionGeneral.message.toString();
                respuesta.detalle.push(respuestaParcial);
            }

            log.audit('After Submit', 'FIN Generar Cupones');
            return respuesta;
        }

        function generarMediosDePago(idDep, idMedioPagoFinal, esServicio, isTravel) {

            //log.audit('Inicio Cobranza', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

            var idCobranza = '';
            var pagoEnDiferenteMoneda = false;
            var cuentaContableFinal = '';
            var monedaPrincipalSubsidiaria = '';

            var respuesta = new Object();
            respuesta.idConciliacion = '';
            respuesta.idConciliacionImpacto = '';
            respuesta.idCobranza = '';
            respuesta.idRegMedioPago = '';
            respuesta.error = false;
            respuesta.detalle = new Array();

            var recordIdMedioPago = '';
            var objRecordMedioPago = '';

            var estadoEnviadoCupon = '';

            var importeTotalCustomTransaction = 0;

            //if (scriptContext.type == 'create' || scriptContext.type == 'edit') {

            //log.audit('Inicio Grabar Cobranza', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

            try {
                var informacionMedioPago = new Object();
                informacionMedioPago.idInterno = '';
                informacionMedioPago.fechaInicio = '';
                informacionMedioPago.fechaFin = '';
                informacionMedioPago.cantidadCuotas = '';
                informacionMedioPago.importeCustomTransaction = 0;
                informacionMedioPago.detalle = new Array();

                /*var recordCobranza = '';
                recordCobranza = scriptContext.newRecord;*/
                /*if (scriptContext.type == 'create') {
                    recordCobranza = scriptContext.newRecord;
                }
                if (scriptContext.type == 'edit') {
                    recordCobranza = scriptContext.oldRecord;
                }*/
                //if (!utilities.isEmpty(recordCobranza)) {
                idCobranza = idDep;
                respuesta.idCobranza = idCobranza;
                var tipoTransaccion = record.Type.CUSTOMER_DEPOSIT;
                if (!utilities.isEmpty(idCobranza) && !utilities.isEmpty(tipoTransaccion)) {
                    log.debug('COBRANZA', 'ID Cobranza : ' + idCobranza);

                    objRecordCobranza = record.load({
                        type: tipoTransaccion,
                        id: idCobranza,
                        isDynamic: true,
                    });
                    if (!utilities.isEmpty(objRecordCobranza)) {

                        var subsidiaria = objRecordCobranza.getValue({
                            fieldId: 'subsidiary'
                        });

                        var cantidadCuotasPago = objRecordCobranza.getValue({
                            fieldId: 'custbody_3k_cant_cuotas'
                        });

                        var fecha = objRecordCobranza.getValue({
                            fieldId: 'trandate'
                        });

                        var sitioWeb = objRecordCobranza.getValue({
                            fieldId: 'custbody_cseg_3k_sitio_web_o'
                        });

                        var sistema = objRecordCobranza.getValue({
                            fieldId: 'custbody_cseg_3k_sistema'
                        });

                        var formaPago = objRecordCobranza.getValue({
                            fieldId: 'paymentmethod'
                        });

                        var importePago = objRecordCobranza.getValue({
                            fieldId: 'payment'
                        });

                        var importePagoClearingVs = importePago;

                        var moneda = objRecordCobranza.getValue({
                            fieldId: 'currency'
                        });

                        var monedaPagoClearingVs = moneda;

                        var monedaPago = objRecordCobranza.getValue({
                            fieldId: 'custbody_3k_moneda_pago'
                        });

                        if (moneda != monedaPago) {
                            pagoEnDiferenteMoneda = true;
                        }

                        /*if (!utilities.isEmpty(monedaPago)) {
                            if (moneda != monedaPago) {
                                pagoEnDiferenteMoneda = true;
                            }
                            moneda = monedaPago;
                        }*/

                        var tipoCambio = objRecordCobranza.getValue({
                            fieldId: 'exchangerate'
                        });

                        var tipoCambioClearingVs = tipoCambio;

                        var tipoCambioNS = objRecordCobranza.getValue({
                            fieldId: 'exchangerate'
                        });

                        var tipoCambioPago = objRecordCobranza.getValue({
                            fieldId: 'custbody_3k_tipo_cambio_pago'
                        });

                        if (!utilities.isEmpty(tipoCambioPago)) {
                            tipoCambio = tipoCambioPago;
                        }

                        var cuenta = objRecordCobranza.getValue({
                            fieldId: 'account'
                        });

                        var cuentaClearingVs = cuenta;

                        var idRegistroMedioPago = objRecordCobranza.getValue({
                            fieldId: 'custbody_3k_link_medio_pago'
                        });

                        var idRegistroConciliacion = objRecordCobranza.getValue({
                            fieldId: 'custbody_3k_link_reg_conc_pagos'
                        });

                        var idRegistroCuentaImpacto = objRecordCobranza.getValue({
                            fieldId: 'custbody_3k_link_reg_conc_imp'
                        });

                        var idRegistroClearingVs = objRecordCobranza.getValue({
                            fieldId: 'custbody_3k_link_reg_conc_clearing'
                        });

                        var importeDifCambio = objRecordCobranza.getValue({
                            fieldId: 'custbody_3k_ganancia_tipo_cambio'
                        });

                        var cantidadCuotasPago = objRecordCobranza.getValue({
                            fieldId: 'custbody_3k_cant_cuotas'
                        });

                        log.debug('COBRANZA', 'Pago en Diferente Moneda : ' + pagoEnDiferenteMoneda + ' - Moneda Cobranza : ' + moneda + ' - Moneda Pago : ' + monedaPago + ' - ID MP : ' + idMedioPagoFinal);

                        //////////////////////////
                        // INICIO - Obtener Cuenta Contable A Utilizar para la Moneda del Pago
                        var filtrosMedioPagoMoneda = new Array();

                        if (!utilities.isEmpty(idMedioPagoFinal)) {
                            var filtroIDFormaPago = new Object();
                            filtroIDFormaPago.name = 'internalid';
                            filtroIDFormaPago.operator = 'IS';
                            filtroIDFormaPago.values = idMedioPagoFinal;
                            filtrosMedioPagoMoneda.push(filtroIDFormaPago);
                        }

                        var filtroSitioWeb = new Object();
                        filtroSitioWeb.name = 'custrecord_51_cseg_3k_sitio_web_o';
                        filtroSitioWeb.operator = 'IS';
                        filtroSitioWeb.values = sitioWeb;
                        filtrosMedioPagoMoneda.push(filtroSitioWeb);

                        var filtroFormaPago = new Object();
                        filtroFormaPago.name = 'custrecord_3k_medios_pago_forma';
                        filtroFormaPago.operator = 'IS';
                        filtroFormaPago.values = formaPago;
                        filtrosMedioPagoMoneda.push(filtroFormaPago);

                        var filtroMoneda = new Object();
                        filtroMoneda.name = 'custrecord_3k_medios_pago_mon_moneda';
                        filtroMoneda.join = 'custrecord_3k_medios_pago_mon_mp';
                        filtroMoneda.operator = 'IS';
                        filtroMoneda.values = monedaPago;
                        filtrosMedioPagoMoneda.push(filtroMoneda);

                        /*var fechaServidor = new Date();

                        var fechaLocal = format.format({
                            value: fechaServidor,
                            type: format.Type.DATE,
                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                        });

                        var filtroFechaDesde = new Object();
                        filtroFechaDesde.name = 'custrecord_3k_medios_pago_f_ini';
                        filtroFechaDesde.operator = 'ONORBEFORE';
                        filtroFechaDesde.values = [fechaLocal];
                        filtrosMedioPagoMoneda.push(filtroFechaDesde);

                        var filtroFechaHasta = new Object();
                        filtroFechaHasta.name = 'custrecord_3k_medios_pago_f_fin';
                        filtroFechaHasta.operator = 'ONORAFTER';
                        filtroFechaHasta.values = [fechaLocal];
                        filtrosMedioPagoMoneda.push(filtroFechaHasta);*/

                        var filtroCuotas = new Object();
                        filtroCuotas.name = 'custrecord_3k_medios_pago_cuotas';
                        filtroCuotas.operator = 'EQUALTO';
                        filtroCuotas.values = cantidadCuotasPago;
                        filtrosMedioPagoMoneda.push(filtroCuotas);

                        var searchMediosPago = utilities.searchSavedPro('customsearch_3k_medios_pago_mon', filtrosMedioPagoMoneda);

                        if (!utilities.isEmpty(searchMediosPago) && searchMediosPago.error == false) {
                            if (!utilities.isEmpty(searchMediosPago.objRsponseFunction.result) && searchMediosPago.objRsponseFunction.result.length > 0) {
                                var resultSet = searchMediosPago.objRsponseFunction.result;
                                var resultSearch = searchMediosPago.objRsponseFunction.search;
                                for (var i = 0; i < resultSet.length; i++) {
                                    // INICIO - Obtener Informacion Costo de Medio de Pago
                                    cuentaContableFinal = resultSet[i].getValue({
                                        name: resultSearch.columns[11]
                                    });
                                    if (utilities.isEmpty(idMedioPagoFinal)) {
                                        idMedioPagoFinal = resultSet[i].getValue({
                                            name: resultSearch.columns[0]
                                        });
                                    }
                                }
                                log.debug('COBRANZA', 'Cuenta Final : ' + cuentaContableFinal);
                                // FIN - Obtener Informacion Costo de Medio de Pago
                                if (!utilities.isEmpty(cuentaContableFinal)) {
                                    if (!utilities.isEmpty(cuenta) && !utilities.isEmpty(cuentaContableFinal) && !utilities.isEmpty(moneda) && !utilities.isEmpty(tipoCambio) && !utilities.isEmpty(importePago) && parseFloat(importePago, 10) > 0.00) {
                                        // INICIO - Obtener Moneda Subsidiaria
                                        var filtrosMonedasSubsidiaria = new Array();

                                        var filtroMoneda = new Object();
                                        filtroMoneda.name = 'internalid';
                                        filtroMoneda.operator = 'IS';
                                        filtroMoneda.values = subsidiaria;
                                        filtrosMonedasSubsidiaria.push(filtroMoneda);

                                        var searchMonedaSubsidiaria = utilities.searchSavedPro('customsearch_3k_monedas_base_sub', filtrosMonedasSubsidiaria);

                                        if (!utilities.isEmpty(searchMonedaSubsidiaria) && searchMonedaSubsidiaria.error == false) {
                                            if (!utilities.isEmpty(searchMonedaSubsidiaria.objRsponseFunction.result) && searchMonedaSubsidiaria.objRsponseFunction.result.length > 0) {
                                                var resultSet = searchMonedaSubsidiaria.objRsponseFunction.result;
                                                var resultSearch = searchMonedaSubsidiaria.objRsponseFunction.search;
                                                for (var i = 0; i < resultSet.length; i++) {
                                                    // INICIO - Obtener Informacion Costo de Medio de Pago
                                                    monedaPrincipalSubsidiaria = resultSet[i].getValue({
                                                        name: resultSearch.columns[2]
                                                    });
                                                }
                                                // FIN - Obtener Informacion Costo de Medio de Pago
                                                if (utilities.isEmpty(monedaPrincipalSubsidiaria)) {
                                                    // Error
                                                    respuesta.error = true;
                                                    respuestaParcial = new Object();
                                                    respuestaParcial.codigo = 'SDEP034';
                                                    respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se encontro la Moneda Base para la Subsidiaria con ID Interno : ' + subsidiaria;
                                                    respuesta.detalle.push(respuestaParcial);
                                                }
                                                log.debug('COBRANZA', 'Moneda Base : ' + monedaPrincipalSubsidiaria);
                                            } else {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SDEP015';
                                                respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se encontro la Moneda Base para la Subsidiaria con ID Interno : ' + subsidiaria;
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                        } else {
                                            if (utilities.isEmpty(searchMonedaSubsidiaria)) {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SDEP016';
                                                respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se recibio Respuesta del Proceso de Busqueda de las Monedas Base de las Subsidiarias';
                                                respuesta.detalle.push(respuestaParcial);
                                            } else {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SDEP017';
                                                respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' Error Consultando las Monedas Base de las Subsidiarias - Error : ' + searchMonedaSubsidiaria.tipoError + ' - Descripcion : ' + searchMonedaSubsidiaria.descripcion;
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                        }
                                        // FIN - Obtener Moneda Subsidiaria
                                    } else {
                                        // Error
                                        var mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' Error Obteniendo la Siguiente Informacion : ';
                                        if (utilities.isEmpty(cuenta)) {
                                            mensaje = mensaje + ' / Cuenta Contable de la Cobranza ';
                                        }
                                        if (utilities.isEmpty(cuentaContableFinal)) {
                                            mensaje = mensaje + ' / Cuenta Contable para la Forma de Pago con ID Interno : ' + formaPago + ' ';
                                        }
                                        if (utilities.isEmpty(tipoCambio)) {
                                            mensaje = mensaje + ' / Tipo de Cambio ';
                                        }
                                        if (utilities.isEmpty(importePago)) {
                                            mensaje = mensaje + ' / Importe de Pago ';
                                        }
                                        if (parseFloat(importePago, 10) <= 0.00) {
                                            mensaje = mensaje + ' / Importe de Pago Invalido ';
                                        }

                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'SDEP019';
                                        respuestaParcial.mensaje = mensaje;
                                        respuesta.detalle.push(respuestaParcial);
                                    }
                                } else {
                                    // Error
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'SDEP020';
                                    respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' - Error Obteniendo Cuenta Contable para la Forma de Pago con ID Interno : ' + formaPago;
                                    respuesta.detalle.push(respuestaParcial);
                                }
                            } else {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SDEP021';
                                respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se encontro un Medio de Pago para el Sitio Web con ID Interno : ' + sitioWeb + ' - Forma de Pago ID Interno : ' + formaPago;
                                respuesta.detalle.push(respuestaParcial);
                            }
                        } else {
                            if (utilities.isEmpty(searchMediosPago)) {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SDEP022';
                                respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se recibio Respuesta del Proceso de Busqueda de los Medios de Pago Disponibles';
                                respuesta.detalle.push(respuestaParcial);
                            } else {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SDEP023';
                                respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' Error Consultando los Medios de Pago Disponibles - Error : ' + searchMediosPago.tipoError + ' - Descripcion : ' + searchMediosPago.descripcion;
                                respuesta.detalle.push(respuestaParcial);
                            }
                        }

                        // FIN - Obtener Cuenta Contable A Utilizar para la Moneda del Pago

                        var importeIn = '';
                        var monedaImpactoCobranza = moneda;
                        var importeImpactoCobraza = importePago;

                        if (pagoEnDiferenteMoneda == true) {

                            //Inicio - Consulta Cta Clearing Vs Clearing

                            var filtroCtaCobranza = new Array();
                            var filtroCuentaVs = new Object();
                            filtroCuentaVs.name = 'custrecord_3k_config_clearing_vs_cob';
                            filtroCuentaVs.operator = 'IS';
                            filtroCuentaVs.values = cuenta;
                            filtroCtaCobranza.push(filtroCuentaVs);

                            var searchCtaClearingVs = utilities.searchSavedPro('customsearch_3k_config_clearing_vs', filtroCtaCobranza);

                            if (!utilities.isEmpty(searchCtaClearingVs) && searchCtaClearingVs.error == false) {
                                if (!utilities.isEmpty(searchCtaClearingVs.objRsponseFunction.result) && searchCtaClearingVs.objRsponseFunction.result.length > 0) {
                                    var resultSet = searchCtaClearingVs.objRsponseFunction.result;
                                    var resultSearch = searchCtaClearingVs.objRsponseFunction.search;

                                    for (var i = 0; i < resultSet.length; i++) {
                                        var cuentaClearingImpacto = resultSet[i].getValue({
                                            name: resultSearch.columns[1]
                                        });
                                    }
                                }
                            } else {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SCUP049';
                                respuestaParcial.mensaje = 'Error searchCtaClearingVs';
                                respuesta.detalle.push(respuestaParcial);
                            }

                            //Fin - Consulta Cta Clearing Vs Clearing

                            // INICIO - Clearing VS Clearing

                            if (!utilities.isEmpty(importePagoClearingVs) && !isNaN(parseFloat(importePagoClearingVs, 10)) && parseFloat(importePagoClearingVs, 10) > 0.00) {
                                var tipoCustomTransaction = 'customtransaction_3k_conc_clearing';

                                log.debug('Cobranza', 'Moneda Pago : ' + monedaPagoClearingVs + ' - Importe Pago : ' + importePagoClearingVs + ' - Tipo Cambio : ' + tipoCambioClearingVs);

                                log.debug('Cobranza', 'Cuenta Deposito : ' + cuentaClearingVs + ' - Cuenta a Impactar : ' + cuentaClearingImpacto);

                                respuesta = generarCustomTransactionConciliacion(subsidiaria, fecha, monedaPagoClearingVs, tipoCambioClearingVs, idCobranza, idRegistroClearingVs, cuentaClearingImpacto, cuentaClearingVs, importePagoClearingVs, sitioWeb, sistema, tipoCustomTransaction);
                                log.debug('Cobranza', 'RESPUESTA CONCILIACION : ' + JSON.stringify(respuesta));
                                if (respuesta.error == false && !utilities.isEmpty(respuesta.idConciliacion)) {
                                    objRecordCobranza.setValue({
                                        fieldId: 'custbody_3k_link_reg_conc_clearing',
                                        value: respuesta.idConciliacion
                                    });
                                }
                            } else {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SDEP018';
                                respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' El importe de Pago es Invalido';
                                respuesta.detalle.push(respuestaParcial);
                            }

                            // FIN - Clearing VS Clearing

                            var importeUtilizar = '';
                            var monedaUtilizar = '';

                            var importeUtilizarMedioPago = '';

                            if (moneda != monedaPrincipalSubsidiaria) {
                                monedaUtilizar = monedaPago;
                                importeUtilizar = parseFloat(importePago, 10) * parseFloat(tipoCambio, 10);
                                importeIn = parseFloat(importePago, 10);
                                importeUtilizarMedioPago = parseFloat(importeUtilizar, 10);
                                /*monedaUtilizar = moneda;
                                importeUtilizarMedioPago = parseFloat(importePago, 10) * parseFloat(tipoCambio, 10);
                                importeIn = parseFloat(importeUtilizarMedioPago, 10);
                                importeUtilizar = parseFloat(importePago, 10);*/
                            } else {
                                monedaUtilizar = monedaPago;
                                importeUtilizar = parseFloat(importePago, 10) / parseFloat(tipoCambio, 10);
                                //importeUtilizar = parseFloat(importePago, 10);
                                importeIn = parseFloat(importePago, 10);
                                importeUtilizarMedioPago = parseFloat(importeUtilizar, 10);
                            }
                            log.debug('Cobranza', 'Moneda Pago : ' + monedaUtilizar + ' - Importe Pago : ' + importeUtilizar);

                            cuenta = cuentaClearingImpacto;

                            log.debug('Cobranza', 'Cuenta Deposito : ' + cuenta + ' - Cuenta Final : ' + cuentaContableFinal);

                            if (!utilities.isEmpty(importeUtilizar) && !isNaN(parseFloat(importeUtilizar, 10)) && parseFloat(importeUtilizar, 10) > 0.00) {
                                var tipoCustomTransaction = 'customtransaction_3k_conc_pagos';

                                //respuesta = generarCustomTransactionConciliacion(subsidiaria, fecha, monedaUtilizar, tipoCambio, idCobranza, idRegistroConciliacion, cuenta, cuentaContableFinal, importeUtilizar, sitioWeb, sistema, tipoCustomTransaction);
                                respuesta = generarCustomTransactionConciliacion(subsidiaria, fecha, monedaUtilizar, tipoCambio, idCobranza, idRegistroConciliacion, cuentaContableFinal, cuenta, importeUtilizar, sitioWeb, sistema, tipoCustomTransaction);
                                log.debug('Cobranza', 'RESPUESTA CONCILIACION : ' + JSON.stringify(respuesta));
                                if (respuesta.error == false && !utilities.isEmpty(respuesta.idConciliacion)) {
                                    objRecordCobranza.setValue({
                                        fieldId: 'custbody_3k_link_reg_conc_pagos',
                                        value: respuesta.idConciliacion
                                    });
                                }
                            } else {
                                // Error
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SDEP018';
                                respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' El importe de Pago es Invalido';
                                respuesta.detalle.push(respuestaParcial);
                            }
                            cuenta = cuentaContableFinal;
                            //moneda = monedaUtilizar;
                            moneda = monedaPago;
                            importePago = importeUtilizarMedioPago;
                            /*
                            moneda = monedaPago;
                            */

                        }


                        if (respuesta.error == false) {
                            log.debug('Cobranza', 'CONCILIACION IMPACTO - importeDifCambio : ' + JSON.stringify(importeDifCambio));
                            /////////////////////////////
                            if (!utilities.isEmpty(importeDifCambio) && importeDifCambio != 0.00 && esServicio && isTravel == false) {

                                // INICIO - Realizar Movimiento de Cuenta Estandard de NetSuite a Cuenta woOw
                                var searchConfig = search.load({
                                    id: 'customsearch_3k_config_liquidaciones'
                                });

                                var resultSearch = searchConfig.run();
                                var range = resultSearch.getRange({
                                    start: 0,
                                    end: 1
                                });


                                var idCuentaIngreso = range[0].getValue({
                                    name: 'custrecord_3k_config_liq_cuenta_ingreso'
                                });
                                var idCuentaIngresoNS = range[0].getValue({
                                    name: 'custrecord_3k_config_liq_cuenta_ing_ns'
                                });

                                var idCuentaDifTipoCambio = range[0].getValue({
                                    name: 'custrecord_3k_config_liq_cuenta_dif_tc'
                                });

                                //if (!utilities.isEmpty(idCuentaIngreso) && !utilities.isEmpty(idCuentaIngresoNS) && !utilities.isEmpty(idCuentaDifTipoCambio)) {
                                if (!utilities.isEmpty(idCuentaIngresoNS) && !utilities.isEmpty(idCuentaDifTipoCambio)) {

                                    // INICIO GENERAR CUSTOM TRANSACTION MOVIMIENTO

                                    if (monedaImpactoCobranza != monedaPrincipalSubsidiaria) {
                                        importeIn = parseFloat(importeImpactoCobraza, 10) * parseFloat(tipoCambio, 10);
                                    } else {
                                        importeIn = parseFloat(importeImpactoCobraza, 10);
                                    }

                                    var importeUtilizarImpacto = '';
                                    importeUtilizarImpacto = parseFloat(importeIn, 10);

                                    if (importeDifCambio > 0.00) {
                                        //La cuenta de ganancia va en el credito
                                        var respuesta = generarCustomTransactionCuentaImpactoCobranza(subsidiaria, fecha, monedaPrincipalSubsidiaria, tipoCambioNS, idCobranza, idRegistroCuentaImpacto, idCuentaIngresoNS, idCuentaIngreso, importeUtilizarImpacto, idCuentaDifTipoCambio, importeDifCambio, sitioWeb, sistema);
                                    } else {
                                        //La cuenta de ganancia va en el debito
                                        importeDifCambio = Math.abs(importeDifCambio);
                                        var respuesta = generarCustomTransactionCuentaImpactoCobranza(subsidiaria, fecha, monedaPrincipalSubsidiaria, tipoCambioNS, idCobranza, idRegistroCuentaImpacto, idCuentaDifTipoCambio, idCuentaIngreso, importeUtilizarImpacto, idCuentaIngresoNS, importeDifCambio, sitioWeb, sistema);
                                    }
                                    //var respuesta = generarCustomTransactionCuentaImpactoCobranza(subsidiaria, fecha, monedaPrincipalSubsidiaria, tipoCambioNS, idCobranza, idRegistroCuentaImpacto, idCuentaIngresoNS, idCuentaIngreso, importeUtilizarImpacto, idCuentaDifTipoCambio, importeDifCambio, sitioWeb, sistema);
                                    log.debug('Cobranza', 'RESPUESTA CONCILIACION IMPACTO : ' + JSON.stringify(respuesta));
                                    if (respuesta.error == false && !utilities.isEmpty(respuesta.idConciliacionImpacto)) {
                                        objRecordCobranza.setValue({
                                            fieldId: 'custbody_3k_link_reg_conc_imp',
                                            value: respuesta.idConciliacionImpacto
                                        });
                                    }
                                    // FIN GENERAR CUSTOM TRANSACTION MOVIMIENTO

                                } else {
                                    var mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' Error Obteniendo la Siguiente Informacion de la Configuracion de Liquidaciones : ';
                                    /*if (utilities.isEmpty(idCuentaIngreso)) {
                                        mensaje = mensaje + ' / Cuenta Contable de Ingresos ';
                                    }*/
                                    if (utilities.isEmpty(idCuentaIngresoNS)) {
                                        mensaje = mensaje + ' / Cuenta Contable de Ingreso de NetSuite';
                                    }
                                    if (utilities.isEmpty(idCuentaDifTipoCambio)) {
                                        mensaje = mensaje + ' / Cuenta Contable de Diferencia de Tipo de Cambio';
                                    }

                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'SDEP035';
                                    respuestaParcial.mensaje = mensaje;
                                    respuesta.detalle.push(respuestaParcial);

                                }

                            }

                            // FIN - Realizar Movimiento de Cuenta Estandard de NetSuite a Cuenta woOw

                            ////////////////////////////

                            if (respuesta.error == false) {

                                if (respuesta.error == false) {

                                    if (!utilities.isEmpty(sitioWeb) && !utilities.isEmpty(formaPago) && !utilities.isEmpty(cuenta) && !utilities.isEmpty(cantidadCuotasPago) && !utilities.isEmpty(importePago) && importePago > 0) {

                                        var filtrosMedioPago = new Array();

                                        var filtroIDFormaPago = new Object();
                                        filtroIDFormaPago.name = 'internalid';
                                        filtroIDFormaPago.operator = 'IS';
                                        filtroIDFormaPago.values = idMedioPagoFinal;
                                        filtrosMedioPago.push(filtroIDFormaPago);

                                        var filtroSitioWeb = new Object();
                                        filtroSitioWeb.name = 'custrecord_51_cseg_3k_sitio_web_o';
                                        filtroSitioWeb.operator = 'IS';
                                        filtroSitioWeb.values = sitioWeb;
                                        filtrosMedioPago.push(filtroSitioWeb);

                                        var filtroFormaPago = new Object();
                                        filtroFormaPago.name = 'custrecord_3k_medios_pago_forma';
                                        filtroFormaPago.operator = 'IS';
                                        filtroFormaPago.values = formaPago;
                                        filtrosMedioPago.push(filtroFormaPago);

                                        /*var fechaServidor = new Date();

                                        var fechaLocal = format.format({
                                            value: fechaServidor,
                                            type: format.Type.DATE,
                                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                                        });

                                        var filtroFechaDesde = new Object();
                                        filtroFechaDesde.name = 'custrecord_3k_medios_pago_f_ini';
                                        filtroFechaDesde.operator = 'ONORBEFORE';
                                        filtroFechaDesde.values = [fechaLocal];
                                        filtrosMedioPago.push(filtroFechaDesde);

                                        var filtroFechaHasta = new Object();
                                        filtroFechaHasta.name = 'custrecord_3k_medios_pago_f_fin';
                                        filtroFechaHasta.operator = 'ONORAFTER';
                                        filtroFechaHasta.values = [fechaLocal];
                                        filtrosMedioPago.push(filtroFechaHasta);*/

                                        var filtroCuotas = new Object();
                                        filtroCuotas.name = 'custrecord_3k_medios_pago_cuotas';
                                        filtroCuotas.operator = 'EQUALTO';
                                        filtroCuotas.values = cantidadCuotasPago;
                                        filtrosMedioPagoMoneda.push(filtroCuotas);

                                        var searchMediosPago = utilities.searchSavedPro('customsearch_3k_medios_pago', filtrosMedioPago);

                                        if (!utilities.isEmpty(searchMediosPago) && searchMediosPago.error == false) {
                                            if (!utilities.isEmpty(searchMediosPago.objRsponseFunction.result) && searchMediosPago.objRsponseFunction.result.length > 0) {
                                                var resultSet = searchMediosPago.objRsponseFunction.result;
                                                var resultSearch = searchMediosPago.objRsponseFunction.search;
                                                for (var i = 0; i < resultSet.length; i++) {
                                                    // INICIO - Obtener Informacion Costo de Medio de Pago

                                                    informacionMedioPago.idInterno = resultSet[i].getValue({
                                                        name: resultSearch.columns[0]
                                                    });

                                                    informacionMedioPago.fechaInicio = resultSet[i].getValue({
                                                        name: resultSearch.columns[6]
                                                    });
                                                    informacionMedioPago.fechaFin = resultSet[i].getValue({
                                                        name: resultSearch.columns[7]
                                                    });
                                                    informacionMedioPago.cantidadCuotas = resultSet[i].getValue({
                                                        name: resultSearch.columns[5]
                                                    });

                                                    var detalleInfoMP = new Object();
                                                    detalleInfoMP.porcentaje = resultSet[i].getValue({
                                                        name: resultSearch.columns[11]
                                                    });

                                                    var monedaDetMP = resultSet[i].getValue({
                                                        name: resultSearch.columns[13]
                                                    });

                                                    if (!utilities.isEmpty(monedaDetMP) && monedaDetMP == moneda) {

                                                        if (!utilities.isEmpty(detalleInfoMP.porcentaje) && parseFloat(detalleInfoMP.porcentaje, 10) > 0) {

                                                            detalleInfoMP.idInterno = resultSet[i].getValue({
                                                                name: resultSearch.columns[9]
                                                            });

                                                            detalleInfoMP.nombre = resultSet[i].getValue({
                                                                name: resultSearch.columns[10]
                                                            });

                                                            detalleInfoMP.cuenta = resultSet[i].getValue({
                                                                name: resultSearch.columns[12]
                                                            });

                                                            var importeMedioPago = parseFloat((parseFloat(importePago, 10) * parseFloat(detalleInfoMP.porcentaje, 10) / 100), 10).toFixed(2);

                                                            detalleInfoMP.importeMedioPago = parseFloat(importeMedioPago, 10);

                                                            informacionMedioPago.importeCustomTransaction = parseFloat(informacionMedioPago.importeCustomTransaction, 10) + parseFloat(importeMedioPago, 10);

                                                            informacionMedioPago.detalle.push(detalleInfoMP);

                                                        }

                                                    }
                                                }
                                                // FIN - Obtener Informacion Costo de Medio de Pago
                                            } else {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SDEP008';
                                                respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se encontro un Medio de Pago para la Fecha : ' + fechaLocal + ' - Sitio Web ID Interno : ' + sitioWeb + ' - Forma de Pago ID Interno : ' + formaPago;
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                        } else {
                                            if (utilities.isEmpty(searchMediosPago)) {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SDEP006';
                                                respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se recibio Respuesta del Proceso de Busqueda de los Medios de Pago Disponibles';
                                                respuesta.detalle.push(respuestaParcial);
                                            } else {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SDEP007';
                                                respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' Error Consultando los Medios de Pago Disponibles - Error : ' + searchMediosPago.tipoError + ' - Descripcion : ' + searchMediosPago.descripcion;
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                        }

                                        if (respuesta.error == false) {
                                            // INICIO - Generar Custom Transaction MEDIO PAGO
                                            if (!utilities.isEmpty(informacionMedioPago)) {
                                                //objRecordCobranza.setValue({ fieldId: 'custbody_3k_cant_cuotas', value: informacionMedioPago.cantidadCuotas });
                                                objRecordCobranza.setValue({
                                                    fieldId: 'custbody_3k_medio_pago',
                                                    value: informacionMedioPago.idInterno
                                                });
                                            }
                                            if (!utilities.isEmpty(informacionMedioPago) && !utilities.isEmpty(informacionMedioPago) && informacionMedioPago.detalle.length > 0) {
                                                for (var i = 0; i < informacionMedioPago.detalle.length && respuesta.error == false; i++) {
                                                    log.debug('Grabar Cobranza', 'Nombre : ' + informacionMedioPago.detalle[i].nombre + ' - Porcentaje : ' + informacionMedioPago.detalle[i].porcentaje);
                                                    if (i == 0) {
                                                        try {
                                                            if (!utilities.isEmpty(idRegistroMedioPago)) {
                                                                objRecordMedioPago = record.load({
                                                                    type: 'customtransaction_3k_medios_pago',
                                                                    id: idRegistroMedioPago,
                                                                    isDynamic: true,
                                                                });
                                                            } else {
                                                                objRecordMedioPago = record.create({
                                                                    type: 'customtransaction_3k_medios_pago',
                                                                    isDynamic: true,
                                                                });
                                                            }
                                                        } catch (excepcionCreateMedioPago) {
                                                            var mensaje = 'Excepcion Creando Registro de Medio de Pago para la Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionCreateMedioPago.message.toString();
                                                            if (scriptContext.type == 'edit') {
                                                                mensaje = 'Excepcion Editando Registro de Medio de Pago con ID Interno : ' + idRegistroMedioPago + ' para la Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionCreateMedioPago.message.toString();
                                                            }
                                                            respuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SDEP014';
                                                            respuestaParcial.mensaje = mensaje;
                                                            respuesta.detalle.push(respuestaParcial);
                                                        }
                                                        if (!utilities.isEmpty(objRecordMedioPago)) {
                                                            registroCreado = true;
                                                            objRecordMedioPago.setValue({
                                                                fieldId: 'subsidiary',
                                                                value: subsidiaria
                                                            });
                                                            objRecordMedioPago.setValue({
                                                                fieldId: 'trandate',
                                                                value: fecha
                                                            });
                                                            objRecordMedioPago.setValue({
                                                                fieldId: 'currency',
                                                                value: moneda
                                                            });
                                                            objRecordMedioPago.setValue({
                                                                fieldId: 'exchangerate',
                                                                value: tipoCambio
                                                            });
                                                            objRecordMedioPago.setValue({
                                                                fieldId: 'custbody_3k_deposito',
                                                                value: idCobranza
                                                            });
                                                            objRecordMedioPago.setValue({
                                                                fieldId: 'custbody_cseg_3k_sitio_web_o',
                                                                value: sitioWeb
                                                            });
                                                            objRecordMedioPago.setValue({
                                                                fieldId: 'custbody_cseg_3k_sistema',
                                                                value: sistema
                                                            });

                                                            var cantidadLineasMedioPago = objRecordMedioPago.getLineCount({
                                                                sublistId: 'line'
                                                            });

                                                            if (!utilities.isEmpty(cantidadLineasMedioPago) && cantidadLineasMedioPago > 0) {
                                                                for (var iMP = 0; iMP < cantidadLineasMedioPago; iMP++) {
                                                                    objRecordMedioPago.removeLine({
                                                                        sublistId: 'line',
                                                                        line: 0
                                                                    });
                                                                }
                                                            }

                                                            objRecordMedioPago.selectNewLine({
                                                                sublistId: 'line'
                                                            });
                                                            objRecordMedioPago.setCurrentSublistValue({
                                                                sublistId: 'line',
                                                                fieldId: 'account',
                                                                value: cuenta
                                                            });

                                                            objRecordMedioPago.setCurrentSublistValue({
                                                                sublistId: 'line',
                                                                fieldId: 'credit',
                                                                value: informacionMedioPago.importeCustomTransaction.toFixed(2).toString()
                                                            });

                                                            objRecordMedioPago.commitLine({
                                                                sublistId: 'line'
                                                            });
                                                        } else {
                                                            respuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SDEP009';
                                                            respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se pudo crear el Registro de Medio de Pago';
                                                            respuesta.detalle.push(respuestaParcial);
                                                        }
                                                    }
                                                    if (!utilities.isEmpty(objRecordMedioPago)) {
                                                        if (!utilities.isEmpty(informacionMedioPago.detalle[i].cuenta)) {

                                                            objRecordMedioPago.selectNewLine({
                                                                sublistId: 'line'
                                                            });
                                                            objRecordMedioPago.setCurrentSublistValue({
                                                                sublistId: 'line',
                                                                fieldId: 'account',
                                                                value: informacionMedioPago.detalle[i].cuenta
                                                            });

                                                            objRecordMedioPago.setCurrentSublistValue({
                                                                sublistId: 'line',
                                                                fieldId: 'debit',
                                                                value: informacionMedioPago.detalle[i].importeMedioPago.toFixed(2).toString()
                                                            });

                                                            objRecordMedioPago.commitLine({
                                                                sublistId: 'line'
                                                            });

                                                        } else {
                                                            respuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SDEP009';
                                                            respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se configuro la Cuenta Contable para el Detalle de Medio de Pago : ' + informacionMedioPago.detalle[i].nombre;
                                                            respuesta.detalle.push(respuestaParcial);
                                                        }
                                                    }
                                                }

                                                if (respuesta.error == false && !utilities.isEmpty(objRecordMedioPago)) {
                                                    try {
                                                        recordIdMedioPago = objRecordMedioPago.save({
                                                            enableSourcing: true,
                                                            ignoreMandatoryFields: false
                                                        });
                                                    } catch (excepcionSaveMedioPago) {
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'SDEP010';
                                                        respuestaParcial.mensaje = 'Excepcion Grabando Registro de Medio de Pago para la Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionSaveMedioPago.message.toString();
                                                        respuesta.detalle.push(respuestaParcial);
                                                    }
                                                    if (utilities.isEmpty(recordIdMedioPago)) {
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'SDEP011';
                                                        respuestaParcial.mensaje = 'Error Grabando Registro de Medio de Pago para la Cobranza con ID Interno : ' + idCobranza + ' - Error : No se recibio el ID Interno del Registro de Medio de Pago Generado';
                                                        respuesta.detalle.push(respuestaParcial);
                                                    } else {
                                                        respuesta.idRegMedioPago = recordIdMedioPago;
                                                        log.debug('Grabar Cobranza', 'Medio de Pago Generado con ID : ' + recordIdMedioPago);
                                                    }
                                                }

                                                // INICIO Actualizar Deposito
                                                if (respuesta.error == false) {
                                                    try {
                                                        /*objRecordCobranza = record.load({
                                                            type: tipoTransaccion,
                                                            id: idCobranza,
                                                            isDynamic: true,
                                                        });*/
                                                        //if (!utilities.isEmpty(objRecordCobranza)) {
                                                        objRecordCobranza.setValue({
                                                            fieldId: 'custbody_3k_link_medio_pago',
                                                            value: recordIdMedioPago
                                                        });
                                                        /*objRecordCobranza.setValue({ fieldId: 'custbody_3k_cant_cuotas', value: informacionMedioPago.cantidadCuotas });
                                                        objRecordCobranza.setValue({ fieldId: 'custbody_3k_medio_pago', value: informacionMedioPago.idInterno });*/

                                                        /*if (respuesta.error == false && !utilities.isEmpty(respuesta.idConciliacion)) {
                                                            objRecordCobranza.setValue({ fieldId: 'custbody_3k_link_reg_conc_pagos', value: respuesta.idConciliacion });
                                                        }*/

                                                        var numLines = objRecordCobranza.getLineCount({
                                                            sublistId: 'recmachcustrecord_3k_inf_medio_pago_cob'
                                                        });

                                                        for (var i = 0; i < numLines; i++) {
                                                            objRecordCobranza.removeLine({
                                                                sublistId: 'recmachcustrecord_3k_inf_medio_pago_cob',
                                                                line: 0
                                                            });
                                                        }

                                                        for (var i = 0; i < informacionMedioPago.detalle.length; i++) {
                                                            objRecordCobranza.selectNewLine({
                                                                sublistId: 'recmachcustrecord_3k_inf_medio_pago_cob'
                                                            });

                                                            objRecordCobranza.setCurrentSublistValue({
                                                                sublistId: 'recmachcustrecord_3k_inf_medio_pago_cob',
                                                                fieldId: 'custrecord_3k_inf_medio_pago_det',
                                                                value: informacionMedioPago.detalle[i].idInterno
                                                            });

                                                            objRecordCobranza.setCurrentSublistValue({
                                                                sublistId: 'recmachcustrecord_3k_inf_medio_pago_cob',
                                                                fieldId: 'custrecord_3k_inf_medio_pago_nom',
                                                                value: informacionMedioPago.detalle[i].nombre
                                                            });

                                                            objRecordCobranza.setCurrentSublistValue({
                                                                sublistId: 'recmachcustrecord_3k_inf_medio_pago_cob',
                                                                fieldId: 'custrecord_3k_inf_medio_pago_porc',
                                                                value: parseFloat(informacionMedioPago.detalle[i].porcentaje, 10)
                                                            });

                                                            objRecordCobranza.setCurrentSublistValue({
                                                                sublistId: 'recmachcustrecord_3k_inf_medio_pago_cob',
                                                                fieldId: 'custrecord_3k_inf_medio_pago_imp',
                                                                value: informacionMedioPago.detalle[i].importeMedioPago
                                                            });

                                                            objRecordCobranza.setCurrentSublistValue({
                                                                sublistId: 'recmachcustrecord_3k_inf_medio_pago_cob',
                                                                fieldId: 'custrecord_3k_inf_medio_pago_imppago',
                                                                value: importePago
                                                            });

                                                            objRecordCobranza.commitLine({
                                                                sublistId: 'recmachcustrecord_3k_inf_medio_pago_cob'
                                                            });
                                                        }

                                                        /*var idRecordCobranza = objRecordCobranza.save({
                                                            enableSourcing: true,
                                                            ignoreMandatoryFields: false
                                                        });
                                                        if (utilities.isEmpty(idRecordCobranza)) {
                                                            respuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SDEP013';
                                                            respuestaParcial.mensaje = 'Error Actualizando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se recibio el ID Interno del Registro de Cobranza Actualizada';
                                                            respuesta.detalle.push(respuestaParcial);
                                                        }*/
                                                        /*} else {
                                                            respuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SDEP013';
                                                            respuestaParcial.mensaje = 'Error Actualizando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se pudo cargar el Registro de la Cobranza';
                                                            respuesta.detalle.push(respuestaParcial);
                                                        }*/
                                                        /*if (utilities.isEmpty(idRecordCobranza)) {
                                                            respuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SDEP013';
                                                            respuestaParcial.mensaje = 'Error Actualizando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se recibio el ID Interno del Registro de Cobranza Actualizada';
                                                            respuesta.detalle.push(respuestaParcial);
                                                        }*/
                                                    } catch (exepcionSubmitCobranza) {
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'SDEP012';
                                                        respuestaParcial.mensaje = 'Excepcion Actualizando Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + exepcionSubmitCobranza.message.toString();
                                                        respuesta.detalle.push(respuestaParcial);
                                                    }
                                                }
                                                // FIN Actualizar Deposito

                                            }
                                        }
                                    } else {
                                        if (!utilities.isEmpty(sitioWeb) && !utilities.isEmpty(formaPago) && !utilities.isEmpty(cuenta) && !utilities.isEmpty(importePago) && importePago > 0);
                                        var mensaje = 'Error obteniendo la siguiente informacion de la Cobranza : ';
                                        if (utilities.isEmpty(sitioWeb)) {
                                            mensaje = mensaje + " Sitio Web Origen / ";
                                        }
                                        if (utilities.isEmpty(formaPago)) {
                                            mensaje = mensaje + " Forma de Pago / ";
                                        }
                                        if (utilities.isEmpty(cuenta)) {
                                            mensaje = mensaje + " Cuenta Contable / ";
                                        }
                                        if (utilities.isEmpty(importePago)) {
                                            mensaje = mensaje + " Importe Pago / ";
                                        }
                                        if (utilities.isEmpty(cantidadCuotasPago)) {
                                            mensaje = mensaje + " Cantidad Cuotas Pago / ";
                                        }
                                        if (!utilities.isEmpty(importePago) && importePago <= 0) {
                                            mensaje = mensaje + " Importe Pago No Valido / ";
                                        }

                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'SDEP005';
                                        respuestaParcial.mensaje = 'Error Grabando la Cobranza con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
                                        respuesta.detalle.push(respuestaParcial);
                                    }
                                }
                            }
                        }
                        if (respuesta.error == false) {
                            var idRecordCobranza = objRecordCobranza.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: false
                            });
                            if (utilities.isEmpty(idRecordCobranza)) {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SDEP013';
                                respuestaParcial.mensaje = 'Error Actualizando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se recibio el ID Interno del Registro de Cobranza Actualizada';
                                respuesta.detalle.push(respuestaParcial);
                            }
                        }
                    } else {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'SDEP013';
                        respuestaParcial.mensaje = 'Error Actualizando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se pudo cargar el Registro de la Cobranza';
                        respuesta.detalle.push(respuestaParcial);
                    }
                } else {
                    var mensaje = 'Error obteniendo la siguiente informacion de la Cobranza : ';
                    if (utilities.isEmpty(idCobranza)) {
                        mensaje = mensaje + " ID Interno de la Cobranza / ";
                    }
                    if (utilities.isEmpty(tipoTransaccion)) {
                        mensaje = mensaje + " Tipo de transaccion / ";
                    }
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SDEP004';
                    respuestaParcial.mensaje = 'Error Grabando la Cobranza con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
                    respuesta.detalle.push(respuestaParcial);
                }
                /*} else {
                    var mensaje = 'Error obteniendo Registro de Cobranza';
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SDEP003';
                    respuestaParcial.mensaje = 'Error Grabando la Cobranza con ID Interno : ' + idCobranza + ' - Error : ' + mensaje;
                    respuesta.detalle.push(respuestaParcial);
                }*/
            } catch (excepcionGeneral) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'SDEP002';
                respuestaParcial.mensaje = 'Excepcion Grabando Cobranza Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionGeneral.message.toString();
                respuesta.detalle.push(respuestaParcial);
            }

            log.debug('Grabar Cobranza', 'Respuesta : ' + JSON.stringify(respuesta));

            if (respuesta.error == true && !utilities.isEmpty(idCobranza)) {
                // Inicio Eliminar Deposito
                var objRecord = record.delete({
                    type: record.Type.CUSTOMER_DEPOSIT,
                    id: idCobranza,
                });
                // Fin Eliminar Deposito
            }

            // Comentado 31 de Mayo

            /*if (respuesta.error == true && !utilities.isEmpty(respuesta.detalle) && respuesta.detalle.length > 0) {
                log.error('Grabar Cobranza', 'Error Grabado la Cobranza con ID Interno : ' + idCobranza + ' Error : ' + JSON.stringify(respuesta));
                throw utilities.crearError('SDEP001', 'Error Grabando la Cobranza con ID Interno : ' + idCobranza + ' - Error : ' + JSON.stringify(respuesta));
            }*/

            // Comentado 31 de Mayo

            return respuesta;


            //log.audit('Fin Grabar Cobranza', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);


            //log.audit('Fin Cobranza', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

        }

        function generarCustomTransactionConciliacion(subsidiaria, fecha, monedaUtilizar, tipoCambio, idCobranza, idRegistroConciliacion, cuentaClearing, cuentaContableFinal, importe, sitioWeb, sistema, tipoCustomTransaction) {
            var respuesta = new Object();
            respuesta.idConciliacion = '';
            respuesta.idCobranza = '';
            respuesta.idRegMedioPago = '';
            respuesta.error = false;
            respuesta.detalle = new Array();

            var objRecorConciliacion = '';

            if (!utilities.isEmpty(monedaUtilizar) && !utilities.isEmpty(tipoCambio) && !utilities.isEmpty(importe) && !utilities.isEmpty(cuentaClearing) && !utilities.isEmpty(cuentaContableFinal)) {
                try {
                    if (!utilities.isEmpty(idRegistroConciliacion)) {
                        objRecorConciliacion = record.load({
                            type: tipoCustomTransaction,
                            id: idRegistroConciliacion,
                            isDynamic: true
                        });
                    } else {
                        objRecorConciliacion = record.create({
                            type: tipoCustomTransaction,
                            isDynamic: true
                        });
                    }
                } catch (excepcionCreateConciliacion) {
                    var mensaje = 'Excepcion Creando/Editando Registro de Conciliacion Pago para la Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionCreateConciliacion.message.toString();
                    /*if (scriptContext.type == 'edit') {
                        mensaje = 'Excepcion Editando Registro de Conciliacion con ID Interno : ' + idRegistroConciliacion + ' para la Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionCreateConciliacion.message.toString();
                    }*/
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SDEP029';
                    respuestaParcial.mensaje = mensaje;
                    respuesta.detalle.push(respuestaParcial);
                }
                if (!utilities.isEmpty(objRecorConciliacion)) {
                    registroCreado = true;
                    objRecorConciliacion.setValue({
                        fieldId: 'subsidiary',
                        value: subsidiaria
                    });
                    objRecorConciliacion.setValue({
                        fieldId: 'trandate',
                        value: fecha
                    });
                    objRecorConciliacion.setValue({
                        fieldId: 'currency',
                        value: monedaUtilizar
                    });
                    objRecorConciliacion.setValue({
                        fieldId: 'exchangerate',
                        value: tipoCambio
                    });
                    objRecorConciliacion.setValue({
                        fieldId: 'custbody_3k_deposito',
                        value: idCobranza
                    });
                    objRecorConciliacion.setValue({
                        fieldId: 'custbody_cseg_3k_sitio_web_o',
                        value: sitioWeb
                    });
                    objRecorConciliacion.setValue({
                        fieldId: 'custbody_cseg_3k_sistema',
                        value: sistema
                    });

                    var cantidadLineasConciliacion = objRecorConciliacion.getLineCount({
                        sublistId: 'line'
                    });

                    if (!utilities.isEmpty(cantidadLineasConciliacion) && cantidadLineasConciliacion > 0) {
                        for (var iCON = 0; iCON < cantidadLineasConciliacion; iCON++) {
                            objRecorConciliacion.removeLine({
                                sublistId: 'line',
                                line: 0
                            });
                        }
                    }

                    objRecorConciliacion.selectNewLine({
                        sublistId: 'line'
                    });
                    objRecorConciliacion.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        //value: cuentaClearing
                        value: cuentaContableFinal
                    });

                    objRecorConciliacion.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'credit',
                        value: importe.toFixed(2).toString()
                    });

                    objRecorConciliacion.commitLine({
                        sublistId: 'line'
                    });

                    objRecorConciliacion.selectNewLine({
                        sublistId: 'line'
                    });
                    objRecorConciliacion.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        //value: cuentaContableFinal
                        value: cuentaClearing
                    });

                    objRecorConciliacion.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'debit',
                        value: importe.toFixed(2).toString()
                    });

                    objRecorConciliacion.commitLine({
                        sublistId: 'line'
                    });


                    if (respuesta.error == false && !utilities.isEmpty(objRecorConciliacion)) {
                        try {
                            recordIConciliacion = objRecorConciliacion.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: false
                            });
                        } catch (excepcionSaveConciliacion) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SDEP030';
                            respuestaParcial.mensaje = 'Excepcion Grabando Registro de Conciliacion para la Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionSaveConciliacion.message.toString();
                            respuesta.detalle.push(respuestaParcial);
                        }
                        if (utilities.isEmpty(recordIConciliacion)) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SDEP031';
                            respuestaParcial.mensaje = 'Error Grabando Registro de Conciliacion para la Cobranza con ID Interno : ' + idCobranza + ' - Error : No se recibio el ID Interno del Registro de Conciliacion Generado';
                            respuesta.detalle.push(respuestaParcial);
                        } else {
                            respuesta.idConciliacion = recordIConciliacion;
                            log.debug('Grabar Cobranza', 'Conciliacion Generado con ID : ' + recordIConciliacion);
                        }
                    }


                } else {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SDEP032';
                    respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se pudo crear el Registro de Conciliacion';
                    respuesta.detalle.push(respuestaParcial);
                }
            } else {
                // Error
                var mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se recibio la siguiente informacion Requerida : ';
                if (utilities.isEmpty(monedaUtilizar)) {
                    mensaje = mensaje + ' / Moneda ';
                }
                if (utilities.isEmpty(importe)) {
                    mensaje = mensaje + ' / Importe ';
                }
                if (utilities.isEmpty(cuentaClearing)) {
                    mensaje = mensaje + ' / Cuenta Contable de Clearing ';
                }
                if (utilities.isEmpty(cuentaContableFinal)) {
                    mensaje = mensaje + ' / Cuenta Contable de Resultado ';
                }

                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'SDEP033';
                respuestaParcial.mensaje = mensaje;
                respuesta.detalle.push(respuestaParcial);
            }
            return respuesta;
        }

        function generarCustomTransactionCuentaImpactoCobranza(subsidiaria, fecha, monedaUtilizar, tipoCambio, idCobranza, idRegistroConciliacionImpacto, cuentaClearing, cuentaContableFinal, importe, idCuentaDifTipoCambio, importeDifCambio, sitioWeb, sistema) {
            var respuesta = new Object();
            respuesta.idConciliacion = '';
            respuesta.idConciliacionImpacto = '';
            respuesta.idCobranza = '';
            respuesta.idRegMedioPago = '';
            respuesta.error = false;
            respuesta.detalle = new Array();

            var objRecorConciliacion = '';

            //if (!utilities.isEmpty(monedaUtilizar) && !utilities.isEmpty(tipoCambio) && !utilities.isEmpty(importe) && !utilities.isEmpty(cuentaClearing) && !utilities.isEmpty(cuentaContableFinal)) {
            if (!utilities.isEmpty(monedaUtilizar) && !utilities.isEmpty(tipoCambio) && !utilities.isEmpty(idCuentaDifTipoCambio) && !utilities.isEmpty(importeDifCambio) && parseFloat(importeDifCambio, 10) > 0.00 && !utilities.isEmpty(cuentaClearing)) {
                try {
                    if (!utilities.isEmpty(idRegistroConciliacionImpacto)) {
                        objRecorConciliacion = record.load({
                            type: 'customtransaction_3k_conc_ing',
                            id: idRegistroConciliacionImpacto,
                            isDynamic: true
                        });
                    } else {
                        objRecorConciliacion = record.create({
                            type: 'customtransaction_3k_conc_ing',
                            isDynamic: true
                        });
                    }
                } catch (excepcionCreateConciliacion) {
                    var mensaje = 'Excepcion Creando/Editando Registro de Conciliacion Ingreso para la Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionCreateConciliacion.message.toString();
                    /*if (scriptContext.type == 'edit') {
                        mensaje = 'Excepcion Editando Registro de Conciliacion con ID Interno : ' + idRegistroConciliacion + ' para la Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionCreateConciliacion.message.toString();
                    }*/
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SDEP029';
                    respuestaParcial.mensaje = mensaje;
                    respuesta.detalle.push(respuestaParcial);
                }
                if (!utilities.isEmpty(objRecorConciliacion)) {
                    registroCreado = true;
                    objRecorConciliacion.setValue({
                        fieldId: 'subsidiary',
                        value: subsidiaria
                    });
                    objRecorConciliacion.setValue({
                        fieldId: 'trandate',
                        value: fecha
                    });
                    objRecorConciliacion.setValue({
                        fieldId: 'currency',
                        value: monedaUtilizar
                    });
                    objRecorConciliacion.setValue({
                        fieldId: 'exchangerate',
                        value: tipoCambio
                    });
                    objRecorConciliacion.setValue({
                        fieldId: 'custbody_3k_deposito',
                        value: idCobranza
                    });
                    objRecorConciliacion.setValue({
                        fieldId: 'custbody_cseg_3k_sitio_web_o',
                        value: sitioWeb
                    });
                    objRecorConciliacion.setValue({
                        fieldId: 'custbody_cseg_3k_sistema',
                        value: sistema
                    });

                    var cantidadLineasConciliacion = objRecorConciliacion.getLineCount({
                        sublistId: 'line'
                    });

                    if (!utilities.isEmpty(cantidadLineasConciliacion) && cantidadLineasConciliacion > 0) {
                        for (var iCON = 0; iCON < cantidadLineasConciliacion; iCON++) {
                            objRecorConciliacion.removeLine({
                                sublistId: 'line',
                                line: 0
                            });
                        }
                    }

                    objRecorConciliacion.selectNewLine({
                        sublistId: 'line'
                    });
                    objRecorConciliacion.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: cuentaClearing
                    });

                    objRecorConciliacion.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'debit',
                        value: importeDifCambio.toFixed(2).toString()
                    });

                    objRecorConciliacion.commitLine({
                        sublistId: 'line'
                    });

                    //var importeCuentaFinal = parseFloat(importe, 10);

                    //if (!utilities.isEmpty(idCuentaDifTipoCambio) && !utilities.isEmpty(importeDifCambio) && parseFloat(importeDifCambio, 10) > 0.00) {

                    //importeCuentaFinal = parseFloat(importe, 10) - parseFloat(importeDifCambio, 10);

                    objRecorConciliacion.selectNewLine({
                        sublistId: 'line'
                    });

                    objRecorConciliacion.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: idCuentaDifTipoCambio
                    });

                    objRecorConciliacion.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'credit',
                        value: importeDifCambio.toFixed(2).toString()
                    });

                    objRecorConciliacion.commitLine({
                        sublistId: 'line'
                    });

                    //}

                    /*objRecorConciliacion.selectNewLine({
                        sublistId: 'line'
                    });
                    objRecorConciliacion.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: cuentaContableFinal
                    });

                    objRecorConciliacion.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'credit',
                        value: importeCuentaFinal.toFixed(2).toString()
                    });

                    objRecorConciliacion.commitLine({
                        sublistId: 'line'
                    });*/


                    if (respuesta.error == false && !utilities.isEmpty(objRecorConciliacion)) {
                        try {
                            recordIConciliacion = objRecorConciliacion.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: false
                            });
                        } catch (excepcionSaveConciliacion) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SDEP030';
                            respuestaParcial.mensaje = 'Excepcion Grabando Registro de Conciliacion de Ingreso para la Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionSaveConciliacion.message.toString();
                            respuesta.detalle.push(respuestaParcial);
                        }
                        if (utilities.isEmpty(recordIConciliacion)) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SDEP031';
                            respuestaParcial.mensaje = 'Error Grabando Registro de Conciliacion de Ingreso para la Cobranza con ID Interno : ' + idCobranza + ' - Error : No se recibio el ID Interno del Registro de Conciliacion Generado';
                            respuesta.detalle.push(respuestaParcial);
                        } else {
                            respuesta.idConciliacionImpacto = recordIConciliacion;
                            log.debug('Grabar Cobranza', 'Conciliacion de Ingreso Generado con ID : ' + recordIConciliacion);
                        }
                    }


                } else {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SDEP032';
                    respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se pudo crear el Registro de Conciliacion de Ingreso ';
                    respuesta.detalle.push(respuestaParcial);
                }
            } else {
                // Error
                var mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se recibio la siguiente informacion Requerida : ';
                if (utilities.isEmpty(monedaUtilizar)) {
                    mensaje = mensaje + ' / Moneda ';
                }
                if (utilities.isEmpty(importeDifCambio) || (!utilities.isEmpty(importeDifCambio) && parseFloat(importeDifCambio, 10) <= 0)) {
                    mensaje = mensaje + ' / Importe de Diferencia de Tipo de Cambio';
                }
                if (utilities.isEmpty(cuentaClearing)) {
                    mensaje = mensaje + ' / Cuenta Contable de NetSuite ';
                }
                if (utilities.isEmpty(idCuentaDifTipoCambio)) {
                    mensaje = mensaje + ' / Cuenta Contable de Diferencia de Tipo de Cambio ';
                }

                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'SDEP033';
                respuestaParcial.mensaje = mensaje;
                respuesta.detalle.push(respuestaParcial);
            }
            return respuesta;
        }

        function updateLinesVouchers(rec, updateLines) {

            log.audit('updateLinesVouchers', 'Inicio UPDATELINES de OV');
            var respuesta = new Object({});
            respuesta.error = false;
            respuesta.detalle = [];


            var arrayVoucherLinea = [];
            var arrayVoucherLinea = [];
            var idOV = rec.id;

            try {

                log.debug('updateLinesVouchers', JSON.stringify(updateLines));

                for (var u = 0; u < updateLines.length; u++) {

                    var idDetalleOV = updateLines[u].idDetalleOV;
                    var IDVoucher = updateLines[u].idVoucher;
                    var montoVoucher = updateLines[u].importeVoucher;

                    var objResultSet = utilities.searchSavedPro('customsearch_3k_configuracion_voucher_ss');
                    if (objResultSet.error) {
                        return objResultSet;
                    }

                    var searchConfig = objResultSet.objRsponseFunction.array

                    var fechaServidor = new Date();
                    var fechaString = format.format({
                        value: fechaServidor,
                        type: format.Type.DATETIME,
                        timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                    });
                    var fecha = format.parse({
                        value: fechaString,
                        type: format.Type.DATE
                    });

                    var numlines = rec.getLineCount({
                        sublistId: 'item'
                    });

                    //for (var i = 0; i < numlines; i++) {

                    var lineNumber = rec.findSublistLineWithValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_id_orden',
                        value: idDetalleOV
                    });

                    rec.selectLine({
                        sublistId: 'item',
                        line: lineNumber
                    })

                    /*var IDDetalle = rec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_id_orden',
                        line: i
                    });*/

                    var impBrutoWoow = rec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_importe_bruto_woow',
                        line: i
                    });



                    //if (IDDetalle == idDetalleOV) {

                    if (parseFloat(impBrutoWoow) < parseFloat(montoVoucher)) {
                        montoVoucher = impBrutoWoow;
                    }

                    /*rec.selectLine({
                        sublistId: 'item',
                        line: i
                    });*/

                    rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_voucher',
                        value: IDVoucher,
                        ignoreFieldChange: false
                    });

                    rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_importe_voucher',
                        value: montoVoucher.toString(),
                        ignoreFieldChange: false
                    });

                    var accionVoucher = rec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_cod_accion_voucher'
                    });

                    rec.commitLine({
                        sublistId: 'item'
                    });
                    //}

                    log.debug('updateLines', 'accionVoucher: ' + accionVoucher);

                    /*var accionVoucher = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_cod_accion_voucher',
                        line: i
                    });*/



                    if (!utilities.isEmpty(accionVoucher) && accionVoucher == '1') {

                        var existeVoucher = false;

                        for (var j = 0; j < numlines; j++) {

                            rec.selectLine({
                                sublistId: 'item',
                                line: j
                            })

                            var isVoucher = rec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_linea_voucher',
                                line: j
                            });

                            var voucher = rec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_voucher',
                                line: j
                            });

                            log.debug('updateLines', 'voucher: ' + voucher + 'IDVoucher: ' + IDVoucher + 'isVoucher: ' + isVoucher + 'j: ' + j);

                            if (voucher == IDVoucher && !isVoucher) {

                                var taxcode = rec.getCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'taxcode',
                                    line: j
                                });

                                var taxPorcentaje = rec.getCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'taxrate1',
                                    line: j
                                });

                                log.debug('updateLines', 'taxPorcentaje: ' + taxPorcentaje);

                                rec.commitLine({
                                    sublistId: 'item'
                                });

                                break;


                            }

                            rec.commitLine({
                                sublistId: 'item'
                            });

                        }

                        var totalOVAfterVoucher = rec.getValue({
                            fieldId: 'total'
                        });

                        if (!utilities.isEmpty(existeVoucher) && existeVoucher == false) {

                            if (parseFloat(totalOVAfterVoucher) != parseFloat(montoVoucher)) {

                                for (var ii = 0; ii < numlines; ii++) {

                                    var esRedondeo = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_es_redondeo',
                                        line: ii
                                    });


                                    if (esRedondeo == true) {


                                        rec.selectLine({
                                            sublistId: 'item',
                                            line: ii
                                        });

                                        rec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'rate',
                                            value: '0'
                                        });

                                        rec.commitLine({
                                            sublistId: 'item'
                                        });
                                    }
                                }
                            }

                            log.debug('updateLinesVouchers', 'ENTRO NO EXISTE VOUCHER LINEA 5532');

                            if (searchConfig.length > 0) {
                                var articuloDescuento = searchConfig[0].custrecord_3k_configvou_articulo;
                            }

                            var importeDescuento = Math.abs(montoVoucher) * (-1);
                            rec.selectNewLine({
                                sublistId: 'item'
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: articuloDescuento
                            });

                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_voucher',
                                value: IDVoucher
                            });

                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_importe_voucher',
                                value: montoVoucher.toString()
                            });


                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'taxcode',
                                value: taxcode
                            });

                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'grossamt',
                                value: importeDescuento.toString()
                            });

                            log.debug('updateLines', 'importeDescuento voucher: ' + importeDescuento);

                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_fecha_creacion',
                                value: fecha
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_fecha_modificacion',
                                value: fecha
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_linea_voucher',
                                value: true
                            });

                            var amount = rec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount'
                            });

                            log.debug('updateLines', 'amount voucher: ' + amount);

                            if (utilities.isEmpty(amount)) {

                                var impImpuesto = rec.getCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'taxrate1'
                                });

                                var taxPorcentajeFloat = parseFloat(taxPorcentaje);
                                log.debug('updateLines', 'taxPorcentajeFloat: ' + taxPorcentajeFloat);

                                log.debug('updateLines', 'impImpuesto: ' + impImpuesto);

                                amount = (parseFloat(importeDescuento) - (parseFloat(importeDescuento) * parseFloat(taxPorcentajeFloat)));

                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    value: amount.toString(),
                                    ignoreFieldChange: false,
                                    fireSlavingSync: true
                                });
                            }

                            log.debug('updateLines', 'amount voucher despues if: ' + amount);

                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                value: amount.toString(),
                                ignoreFieldChange: false,
                                fireSlavingSync: true
                            });

                            var grossamtVoucher = rec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'grossamt'
                            });

                            log.debug('updateLines', 'grossamtVoucher: ' + grossamtVoucher);

                            if (grossamtVoucher != importeDescuento) {

                                rec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'grossamt',
                                    value: importeDescuento.toString()
                                });
                            }

                            rec.commitLine({
                                sublistId: 'item'
                            });

                            //INICIO APLICACION DE VOUCHERS 02-08-2018

                            var monedaBase = null;
                            var monedaVoucherOV = null;
                            var tipoCambioVoucher = null;

                            monedaVoucherOV = rec.getValue({
                                fieldId: 'currency'
                            });

                            tipoCambioVoucher = rec.getValue({
                                fieldId: 'custbody_3k_exchangerate_voucher'
                            });

                            var subsidiariaOV = rec.getValue({
                                fieldId: 'subsidiary'
                            });

                            var objFieldLookUpSubsidiariary = search.lookupFields({
                                type: record.Type.SUBSIDIARY,
                                id: subsidiariaOV,
                                columns: [
                                    'currency'
                                ]
                            });


                            log.audit('objFieldLookUpSubsidiariary', JSON.stringify(objFieldLookUpSubsidiariary));

                            monedaBase = objFieldLookUpSubsidiariary["currency"][0].value;

                            log.audit('monedaBase', monedaBase);


                            var objFieldLookUp = search.lookupFields({
                                type: 'customrecord_3k_vouchers',
                                id: IDVoucher,
                                columns: [
                                    'custrecord_3k_vouchers_orden', 'custrecord_3k_vouchers_cosumido', 'custrecord_3k_vouchers_saldo', 'custrecord_3k_vouchers_moneda'
                                ]
                            });

                            var arrayOrdenes = objFieldLookUp["custrecord_3k_vouchers_orden"];
                            var stockConsumido = objFieldLookUp["custrecord_3k_vouchers_cosumido"];
                            var saldoRestante = objFieldLookUp["custrecord_3k_vouchers_saldo"];
                            var monedaVoucher = objFieldLookUp["custrecord_3k_vouchers_moneda"][0].value;

                            var arrayIdOrdenes = new Array();

                            for (var q = 0; q < arrayOrdenes.length; q++) {
                                arrayIdOrdenes.push(arrayOrdenes[q].value);
                            }

                            arrayIdOrdenes.push(idOV);
                            var stockConsumidoFinal;

                            if (!utilities.isEmpty(monedaVoucher)) {

                                if (monedaVoucher != monedaVoucherOV) {

                                    /*var tiposCambiosFilter = tiposCambios.filter(function (obj) {
                                        return obj.basecurrency == monedaVoucher
                                    });*/

                                    //log.error('tiposCambiosFilter', JSON.stringify(tiposCambiosFilter));
                                    log.audit('tipoCambioVoucher', tipoCambioVoucher);
                                    if (!utilities.isEmpty(tipoCambioVoucher)) {

                                        if (monedaBase != monedaVoucherOV) {

                                            stockConsumidoFinal = parseFloat(stockConsumido) + (parseFloat(montoVoucher) * parseFloat(tipoCambioVoucher));
                                        } else {
                                            stockConsumidoFinal = parseFloat(stockConsumido) + (parseFloat(montoVoucher) / parseFloat(tipoCambioVoucher));
                                        }

                                    }

                                    log.audit('stockConsumidoFinal', stockConsumidoFinal);

                                } else {
                                    stockConsumidoFinal = parseFloat(stockConsumido) + parseFloat(montoVoucher);
                                }


                                //var stockConsumidoFinal = parseFloat(stockConsumido) + parseFloat(arrayVoucher[n].montoVoucher);
                                log.debug('AfterSubmitOV', 'stockConsumidoFinal: ' + stockConsumidoFinal);

                                log.audit('diferencia saldos', (parseFloat(saldoRestante) - stockConsumidoFinal));
                                if (!utilities.isEmpty(saldoRestante) && (parseFloat(saldoRestante) - stockConsumidoFinal) >= -1) {
                                    try {

                                        if ((parseFloat(saldoRestante) - stockConsumidoFinal) < 0) {
                                            stockConsumidoFinal = saldoRestante;
                                        }

                                        var idRecordVoucher = record.submitFields({
                                            type: 'customrecord_3k_vouchers',
                                            id: IDVoucher,
                                            values: {
                                                custrecord_3k_vouchers_orden: arrayIdOrdenes,
                                                custrecord_3k_vouchers_cosumido: stockConsumidoFinal
                                            },
                                            options: {
                                                enableSourcing: true,
                                                ignoreMandatoryFields: false
                                            }
                                        });
                                        if (utilities.isEmpty(idRecordVoucher)) {
                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'SROV014';
                                            respuestaParcial.mensaje = 'Error Actualizando Registro de Voucher con ID Interno : ' + IDVoucher + ' No se recibio ID de Respuesta de Actualizacion';
                                            respuesta.detalle.push(respuestaParcial);
                                        }
                                    } catch (excepcionVoucher) {
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'SROV015';
                                        respuestaParcial.mensaje = 'Excepcion Actualizando Registro de Voucher con ID Interno : ' + IDVoucher + ' - Excepcion : ' + excepcionVoucher.message.toString();
                                        respuesta.detalle.push(respuestaParcial);
                                    }

                                } else {
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'SROV020';
                                    respuestaParcial.mensaje = 'El voucher ingresado está consumido en su totalidad';
                                    respuesta.detalle.push(respuestaParcial);
                                    return respuesta;
                                }
                            } else {

                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SROV021';
                                respuestaParcial.mensaje = 'El voucher ingresado no tiene moneda';
                                respuesta.detalle.push(respuestaParcial);
                                return respuesta;

                            }

                            //INICIO USOS VOUCHERS


                            var idRecUsoVoucher = record.create({
                                type: 'customrecord_3k_usos_vouchers',
                                isDynamic: true
                            });

                            idRecUsoVoucher.setValue({
                                fieldId: 'custrecord_3k_usos_vouchers_voucher',
                                value: IDVoucher
                            });

                            idRecUsoVoucher.setValue({
                                fieldId: 'custrecord_3k_usos_vouchers_consumido',
                                value: montoVoucher.toString()
                            });

                            idRecUsoVoucher.setValue({
                                fieldId: 'custrecord_3k_usos_vouchers_orden',
                                value: idDetalleOV
                            });

                            idRecUsoVoucher.setValue({
                                fieldId: 'custrecord_3k_usos_vouchers_fecha',
                                value: fecha
                            });

                            idRecUsoVoucher.setValue({
                                fieldId: 'custrecord_3k_usos_vouchers_ov',
                                value: idOV
                            });

                            try {
                                idRecUsoVoucherSave = idRecUsoVoucher.save();
                                if (utilities.isEmpty(idRecUsoVoucherSave)) {
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'SROV016';
                                    respuestaParcial.mensaje = 'Error Grabando Registro de Uso Voucher - Error : No se recibio ID de Respuesta de Actualizacion';
                                    respuesta.detalle.push(respuestaParcial);
                                }
                            } catch (excepcionUsoVoucher) {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SROV017';
                                respuestaParcial.mensaje = 'Excepcion Grabando Registro de Voucher - Excepcion : ' + excepcionUsoVoucher.message.toString();
                                respuesta.detalle.push(respuestaParcial);
                            }

                            //FIN USOS VOUCHERS


                            //FIN APLICACION VOUCHERS

                        }
                        break;
                    }

                    //} // END FOR I
                } //END FOR U
                var importeTotalOrdenDeVenta = rec.getValue({
                    fieldId: 'total'
                });
                log.debug('updateLines', 'importeTotalOrdenDeVenta: ' + importeTotalOrdenDeVenta);
                var importeTotalVouchers = rec.getValue({
                    fieldId: 'custbody_3k_imp_voucher_dev_aplic_ov'
                });
                log.debug('updateLines', 'importeTotalVoucher Devolucion: ' + importeTotalVouchers);
                var clienteOrdenDeVenta = rec.getValue({
                    fieldId: 'entity'
                });
                var idOV = rec.save();
                respuesta.idOv = idOV;

                // INICIO GENERAR AJUSTE POR REDONDEO
                var respuestaAjusteRedondeo = generarAjusteRedondeo(idOV, null);
                // FIN GENERAR AJUSTE POR REDONDEO

                if (respuestaAjusteRedondeo.error) {
                    return respuestaAjusteRedondeo;
                }

                /*var objFieldLookUpImpVoucher = search.lookupFields({
                            type: 'transaction',
                            id: respuesta.idOv,
                            columns: [
                                'custbody_3k_imp_voucher_dev_aplic_ov'
                            ]
                        });

                importeTotalVouchers = objFieldLookUpImpVoucher.custbody_3k_imp_voucher_dev_aplic_ov;*/

                importeTotalVouchers = respuestaAjusteRedondeo.importeTotalVouchers;

                log.debug('updateLines', 'importeTotalVoucher Devolucion Luego Ajuste Redondeo : ' + importeTotalVouchers);

                var importeTotalOrdenDeVenta = respuestaAjusteRedondeo.importeTotalOV;

                var objRecord = record.load({
                    type: record.Type.SALES_ORDER,
                    id: idOV,
                    isDynamic: true
                });

                var importeRestantePagoOV = objRecord.getValue({
                    fieldId: 'custbody_3k_imp_rest_pago'
                });
                var ovCerrada = objRecord.getValue({
                    fieldId: 'orderstatus'
                });
                var clienteOrdenDeVenta = objRecord.getValue({
                    fieldId: 'entity'
                });

                log.debug('updateLines', 'importeRestantePagoOV: ' + importeRestantePagoOV + ' ovCerrada: ' + ovCerrada + ' importeTotalOrdenDeVenta: ' + importeTotalOrdenDeVenta);

                if (importeTotalOrdenDeVenta <= 0 || (!utilities.isEmpty(ovCerrada) && (ovCerrada != 'C' || ovCerrada != 'H') && !utilities.isEmpty(importeRestantePagoOV) && importeRestantePagoOV <= 0.00)) {

                    //if (importeTotalOrdenDeVenta <= 0 || importeTotalVouchers == importeTotalOrdenDeVenta) {
                    // INICIO Generar Cupones
                    var pago = new Object();
                    var respuestaGeneracionCupon = generarCupones(null, idOV, clienteOrdenDeVenta, pago);

                    if (utilities.isEmpty(respuestaGeneracionCupon)) {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'SROV023';
                        respuestaParcial.mensaje = 'Error Generando Cupones a la Orden de Venta con ID Interno : ' + idOV;
                        respuesta.detalle.push(respuestaParcial);
                    } else {
                        if (respuestaGeneracionCupon.error == true) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SROV024';
                            respuestaParcial.mensaje = 'Error Generando Cupones para la Orden de Venta con ID Interno : ' + idOV + ' - Error : ' + respuestaGeneracionCupon.codigo + ' - Detalle : ' + respuestaGeneracionCupon.mensaje;
                            respuesta.detalle.push(respuestaParcial);
                        }
                    }
                    // FIN Generar Cupones
                    if (respuesta.error == false) {
                        // INICIO - Obtener Requisiciones Generadas por Orden de Venta
                        var arrayRequisiciones = new Array();
                        var objParam = new Object();
                        objParam.name = 'custrecord_3k_req_compra_ov';
                        objParam.operator = 'IS';
                        objParam.values = idOV;

                        var searchRequisiciones = utilities.searchSaved('customsearch_3k_requisiciones_ov', objParam);
                        if (!utilities.isEmpty(searchRequisiciones) && searchRequisiciones.error == false) {
                            if (!utilities.isEmpty(searchRequisiciones.objRsponseFunction.result) && searchRequisiciones.objRsponseFunction.result.length > 0) {
                                // Agrupar Cupones por ID de Orden
                                var resultSet = searchRequisiciones.objRsponseFunction.result;
                                var resultSearch = searchRequisiciones.objRsponseFunction.search;

                                var idLineaOVAnterior = '';
                                var idLineaOVActual = '';

                                for (var l = 0; !utilities.isEmpty(resultSet) && l < resultSet.length; l++) {

                                    var obj = new Object();
                                    obj.indice = l;
                                    obj.idInterno = resultSet[l].getValue({
                                        name: resultSearch.columns[0]
                                    });
                                    obj.idOV = resultSet[l].getValue({
                                        name: resultSearch.columns[1]
                                    });
                                    obj.idLineaOV = resultSet[l].getValue({
                                        name: resultSearch.columns[2]
                                    });

                                    arrayRequisiciones.push(obj);
                                }
                            } else {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'RDEP013';
                                respuestaParcial.mensaje = 'Error Consultando Requisiciones por Orden de Venta para Actualizar Cupones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se encontraron Requisiciones';
                                respuesta.detalle.push(respuestaParcial);
                            }
                        } else {
                            if (utilities.isEmpty(searchRequisiciones)) {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'RDEP014';
                                respuestaParcial.mensaje = 'Error Consultando Requisiciones por Orden de Venta para Actualizar Cupones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Recibio Objeto de Respuesta';
                                respuesta.detalle.push(respuestaParcial);
                            } else {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'RDEP015';
                                respuestaParcial.mensaje = 'Error Consultando Requisiciones por Orden de Venta para Actualizar Cupones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Tipo Error : ' + searchRequisiciones.tipoError + ' - Descripcion : ' + searchRequisiciones.descripcion;
                                respuesta.detalle.push(respuestaParcial);
                            }
                        }
                        // FIN - Obtener Requisiciones Generadas por Orden de Venta

                        // INICIO - Actualizar Requisiciones
                        if (!utilities.isEmpty(respuestaGeneracionCupon.informacionCupones)) {
                            respuesta.cupones = respuestaGeneracionCupon.informacionCuponesResult;
                            for (var s = 0; s < respuestaGeneracionCupon.informacionCupones.length && respuesta.error == false; s++) {
                                var objRequisicion = arrayRequisiciones.filter(function (obj) {
                                    return (obj.idLineaOV === respuestaGeneracionCupon.informacionCupones[s].idLineaOV);
                                });

                                if (!utilities.isEmpty(objRequisicion) && objRequisicion.length > 0) {
                                    for (var q = 0; q < objRequisicion.length && respuesta.error == false; q++) {
                                        try {
                                            var idRecordRequisicion = record.submitFields({
                                                type: 'customrecord_3k_req_compra',
                                                id: objRequisicion[q].idInterno,
                                                values: {
                                                    custrecord_3k_req_compra_cupon: respuestaGeneracionCupon.informacionCupones[s].idCupones
                                                },
                                                options: {
                                                    enableSourcing: true,
                                                    ignoreMandatoryFields: false
                                                }
                                            });
                                            if (utilities.isEmpty(idRecordRequisicion)) {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'RDEP016';
                                                respuestaParcial.mensaje = 'Error Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Recibio ID de la Requisicion Actualizada';
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                        } catch (exepcionSubmitRequisicion) {
                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'RDEP017';
                                            respuestaParcial.mensaje = 'Excepcion Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Excepcion : ' + exepcionSubmitRequisicion.message.toString();
                                            respuesta.detalle.push(respuestaParcial);
                                        }
                                    }

                                } else {
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'RDEP018';
                                    respuestaParcial.mensaje = 'Error Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Encontro la Requisicion para el ID Detalle OV : ' + informacionCupones[i].idLineaOV;
                                    respuesta.detalle.push(respuestaParcial);
                                }
                            }
                        } else {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'RDEP019';
                            respuestaParcial.mensaje = 'Error Actualizando Cupones en Requisiciones en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Recibio Informacion de Array de Cupones';
                            respuesta.detalle.push(respuestaParcial);
                        }
                        // FIN - Actualizar Requisiciones
                    }
                }
            } catch (e) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'SROV015';
                respuestaParcial.mensaje = 'Excepcion agregarVouchers : ' + e;
                respuesta.detalle.push(respuestaParcial);
            }

            log.audit('updateLinesVouchers', 'Fin UPDATELINES de OV');

            return respuesta;

        }

        function CuponNew(informacion) {
            log.audit('Cupon New', 'INICIO Proceso');

            var respuesta = new Object();
            respuesta.idCupon = '';
            respuesta.idRegLiqConf = '';
            respuesta.idRegLiqGen = '';
            respuesta.error = false;
            respuesta.detalle = new Array();

            var recordIdLiqConf = '';

            var importeIngreso = 0;
            var importeDeuda = 0;

            var idCuentaIngresoAConfirmar = '';
            var idCuentaDeudaAConfirmar = '';

            try {
                if (!utilities.isEmpty(informacion)) {
                    respuesta.idCupon = informacion.idInterno;
                    if (!utilities.isEmpty(informacion.registro)) {

                        // INICIO - Obtener Cuentas Contables de Confirmacion
                        var searchConfig = utilities.searchSaved('customsearch_3k_configuracion_cupones_ss');

                        if (!utilities.isEmpty(searchConfig) && searchConfig.error == false) {
                            if (!utilities.isEmpty(searchConfig.objRsponseFunction.result) && searchConfig.objRsponseFunction.result.length > 0) {
                                idCuentaIngresoAConfirmar = searchConfig.objRsponseFunction.result[0].getValue({
                                    name: searchConfig.objRsponseFunction.search.columns[2]
                                });
                                idCuentaDeudaAConfirmar = searchConfig.objRsponseFunction.result[0].getValue({
                                    name: searchConfig.objRsponseFunction.search.columns[3]
                                });
                                idCuentaIngresoInicial = searchConfig.objRsponseFunction.result[0].getValue({
                                    name: searchConfig.objRsponseFunction.search.columns[6]
                                });
                                if (utilities.isEmpty(idCuentaIngresoAConfirmar) || utilities.isEmpty(idCuentaDeudaAConfirmar) || utilities.isEmpty(idCuentaIngresoInicial)) {
                                    var mensaje = 'No se encuentran configuradas las siguientes Cuentas en la Configuracion de Cupones : ';
                                    if (utilities.isEmpty(idCuentaIngresoAConfirmar)) {
                                        mensaje = mensaje + ' Cuenta de Ingresos A Confirmar / ';
                                    }
                                    if (utilities.isEmpty(idCuentaDeudaAConfirmar)) {
                                        mensaje = mensaje + ' Cuenta de Deuda A Confirmar / ';
                                    }
                                    if (utilities.isEmpty(idCuentaIngresoInicial)) {
                                        mensaje = mensaje + ' Cuenta de Ingresos Inicial / ';
                                    }
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'SCUP046';
                                    respuestaParcial.mensaje = mensaje;
                                    respuesta.detalle.push(respuestaParcial);
                                }
                            } else {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SCUP026';
                                respuestaParcial.mensaje = 'No se encuentra realizada la Configuracion de Cupones';
                                respuesta.detalle.push(respuestaParcial);
                            }
                        } else {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SCUP027';
                            respuestaParcial.mensaje = 'Error Consultando Configuracion de Cupones - Tipo Error : ' + searchConfig.tipoError + ' - Descripcion : ' + searchConfig.descripcion;
                            respuesta.detalle.push(respuestaParcial);
                        }

                        // FIN - Obtener Cuentas Contables de Confirmacion

                        var subsidiaria = informacion.registro.getValue({
                            fieldId: 'custrecord_3k_cupon_subsidiaria'
                        });

                        var monedaPrincipalSubsidiaria = '';

                        // INICIO - Obtener Moneda Subsidiaria
                        var filtrosMonedasSubsidiaria = new Array();

                        var filtroMoneda = new Object();
                        filtroMoneda.name = 'internalid';
                        filtroMoneda.operator = 'IS';
                        filtroMoneda.values = subsidiaria;
                        filtrosMonedasSubsidiaria.push(filtroMoneda);

                        var searchMonedaSubsidiaria = utilities.searchSavedPro('customsearch_3k_monedas_base_sub', filtrosMonedasSubsidiaria);

                        if (!utilities.isEmpty(searchMonedaSubsidiaria) && searchMonedaSubsidiaria.error == false) {
                            if (!utilities.isEmpty(searchMonedaSubsidiaria.objRsponseFunction.result) && searchMonedaSubsidiaria.objRsponseFunction.result.length > 0) {
                                var resultSet = searchMonedaSubsidiaria.objRsponseFunction.result;
                                var resultSearch = searchMonedaSubsidiaria.objRsponseFunction.search;
                                for (var i = 0; i < resultSet.length; i++) {
                                    // INICIO - Obtener Informacion Costo de Medio de Pago
                                    monedaPrincipalSubsidiaria = resultSet[i].getValue({
                                        name: resultSearch.columns[2]
                                    });
                                }
                                // FIN - Obtener Informacion Costo de Medio de Pago
                                if (utilities.isEmpty(monedaPrincipalSubsidiaria)) {
                                    // Error
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'SCUP048';
                                    respuestaParcial.mensaje = 'Error Grabando Cupon con ID Interno : ' + informacion.idInterno + ' - Error : No se encontro la Moneda Base para la Subsidiaria con ID Interno : ' + subsidiaria;
                                    respuesta.detalle.push(respuestaParcial);
                                }
                                log.debug('COBRANZA', 'Moneda Base : ' + monedaPrincipalSubsidiaria);
                            } else {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SCUP049';
                                respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + informacion.idInterno + ' - Error : No se encontro la Moneda Base para la Subsidiaria con ID Interno : ' + subsidiaria;
                                respuesta.detalle.push(respuestaParcial);
                            }
                        } else {
                            if (utilities.isEmpty(searchMonedaSubsidiaria)) {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SCUP050';
                                respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + informacion.idInterno + ' - Error : No se recibio Respuesta del Proceso de Busqueda de las Monedas Base de las Subsidiarias';
                                respuesta.detalle.push(respuestaParcial);
                            } else {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SCUP051';
                                respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + informacion.idInterno + ' Error Consultando las Monedas Base de las Subsidiarias - Error : ' + searchMonedaSubsidiaria.tipoError + ' - Descripcion : ' + searchMonedaSubsidiaria.descripcion;
                                respuesta.detalle.push(respuestaParcial);
                            }
                        }
                        // FIN - Obtener Moneda Subsidiaria

                        if (respuesta.error == false) {

                            var cuentaDeposito = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_cuenta_deposito'
                            });

                            var moneda = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_moneda'
                            });

                            /*var tipoCambio = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_tipo_cambio'
                            });*/

                            var tipoCambio = parseFloat(1, 10).toFixed(2);

                            if (!utilities.isEmpty(subsidiaria) && !utilities.isEmpty(cuentaDeposito) && !utilities.isEmpty(moneda) && !utilities.isEmpty(tipoCambio)) {

                                /*var importeCupon = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_importe'
                                });*/

                                var importeCupon = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_importe_mb'
                                });

                                var porcentajeComision = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_por_comision'
                                });

                                var porcentajeDeuda = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_por_liquidacion'
                                });

                                var idLiquidacionConfirmar = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_link_liq_conf'
                                });

                                log.debug('Grabar Cupon', 'ID Registro Liquidacion A Confirmar : ' + idLiquidacionConfirmar);



                                if (!utilities.isEmpty(importeCupon) && !isNaN(parseFloat(importeCupon, 10)) && importeCupon > 0) {
                                    log.debug('Grabar Cupon', 'Importe Cupon : ' + importeCupon + ' - Porcentaje Comision : ' + porcentajeComision + ' - Porcentaje Deuda : ' + porcentajeDeuda);

                                    var importeCuponMonedaPrincipal = parseFloat((importeCupon * ((parseFloat(porcentajeDeuda, 10)) / 100)), 10).toFixed(2);
                                    // INICIO CREAR CUSTOM TRANSACTION DEUDA A CONFIRMAR
                                    if (!utilities.isEmpty(porcentajeDeuda) && parseFloat(porcentajeDeuda, 10) > 0) {
                                        importeDeuda = parseFloat((importeCupon * ((parseFloat(porcentajeDeuda, 10)) / 100)), 10).toFixed(2);
                                        importeIngreso = parseFloat((importeCupon - (parseFloat(importeDeuda, 10))), 10).toFixed(2);
                                        log.debug('Grabar Cupon', 'Importe Deuda A Confirmar : ' + importeDeuda + ' - Importe Ingreso A Confirmar : ' + importeIngreso);
                                        if ((!utilities.isEmpty(importeDeuda) && !isNaN(parseFloat(importeDeuda, 10)) && importeDeuda > 0) || (!utilities.isEmpty(importeIngreso) && !isNaN(parseFloat(importeIngreso, 10)) && importeIngreso > 0)) {
                                            var importeTotal = parseFloat(importeDeuda, 10) + parseFloat(importeIngreso, 10);
                                            var objRecordLiqConf = '';
                                            try {
                                                if (!utilities.isEmpty(idLiquidacionConfirmar)) {
                                                    objRecordLiqConf = record.load({
                                                        type: 'customtransaction_3k_liquidacion_conf',
                                                        id: idLiquidacionConfirmar,
                                                        isDynamic: true,
                                                    });
                                                } else {
                                                    objRecordLiqConf = record.create({
                                                        type: 'customtransaction_3k_liquidacion_conf',
                                                        isDynamic: true,
                                                    });
                                                }
                                            } catch (excepcionCreateLiqConf) {
                                                var mensaje = 'Excepcion Creando/Editando Registro de Liquidacion A Confirmar para el Cupon con ID Interno : ' + respuesta.idCupon + ' - Excepcion : ' + excepcionCreateLiqConf.message.toString();

                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SCUP012';
                                                respuestaParcial.mensaje = mensaje;
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                            if (!utilities.isEmpty(objRecordLiqConf)) {
                                                objRecordLiqConf.setValue({
                                                    fieldId: 'subsidiary',
                                                    value: subsidiaria
                                                });
                                                //objRecordLiqConf.setValue({ fieldId: 'currency', value: moneda });
                                                objRecordLiqConf.setValue({
                                                    fieldId: 'currency',
                                                    value: monedaPrincipalSubsidiaria
                                                });
                                                objRecordLiqConf.setValue({
                                                    fieldId: 'exchangerate',
                                                    value: tipoCambio
                                                });

                                                var cantidadLineasLiqConf = objRecordLiqConf.getLineCount({
                                                    sublistId: 'line'
                                                });

                                                if (!utilities.isEmpty(cantidadLineasLiqConf) && cantidadLineasLiqConf > 0) {
                                                    for (var iLiqConf = 0; iLiqConf < cantidadLineasLiqConf; iLiqConf++) {
                                                        objRecordLiqConf.removeLine({
                                                            sublistId: 'line',
                                                            line: 0
                                                        });
                                                    }
                                                }

                                                objRecordLiqConf.selectNewLine({
                                                    sublistId: 'line'
                                                });
                                                objRecordLiqConf.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'account',
                                                    value: idCuentaIngresoInicial
                                                });

                                                objRecordLiqConf.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'currency',
                                                    value: monedaPrincipalSubsidiaria
                                                });

                                                objRecordLiqConf.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'exchangerate',
                                                    value: tipoCambio
                                                });

                                                objRecordLiqConf.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'credit',
                                                    value: importeTotal
                                                });

                                                objRecordLiqConf.commitLine({
                                                    sublistId: 'line'
                                                });

                                                if (!utilities.isEmpty(importeDeuda) && !isNaN(parseFloat(importeDeuda, 10)) && importeDeuda > 0) {

                                                    objRecordLiqConf.selectNewLine({
                                                        sublistId: 'line'
                                                    });
                                                    objRecordLiqConf.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'account',
                                                        value: idCuentaDeudaAConfirmar
                                                    });

                                                    objRecordLiqConf.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'currency',
                                                        value: monedaPrincipalSubsidiaria
                                                    });

                                                    objRecordLiqConf.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'exchangerate',
                                                        value: tipoCambio
                                                    });

                                                    objRecordLiqConf.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'debit',
                                                        value: importeDeuda
                                                    });

                                                    objRecordLiqConf.commitLine({
                                                        sublistId: 'line'
                                                    });

                                                }

                                                if (!utilities.isEmpty(importeIngreso) && !isNaN(parseFloat(importeIngreso, 10)) && importeIngreso > 0) {

                                                    objRecordLiqConf.selectNewLine({
                                                        sublistId: 'line'
                                                    });
                                                    objRecordLiqConf.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'account',
                                                        value: idCuentaIngresoAConfirmar
                                                    });

                                                    objRecordLiqConf.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'currency',
                                                        value: monedaPrincipalSubsidiaria
                                                    });

                                                    objRecordLiqConf.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'exchangerate',
                                                        value: tipoCambio
                                                    });

                                                    objRecordLiqConf.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'debit',
                                                        value: importeIngreso
                                                    });

                                                    objRecordLiqConf.commitLine({
                                                        sublistId: 'line'
                                                    });

                                                }


                                                try {
                                                    recordIdLiqConf = objRecordLiqConf.save({
                                                        enableSourcing: true,
                                                        ignoreMandatoryFields: false
                                                    });
                                                } catch (excepcionSaveLiqConf) {
                                                    respuesta.error = true;
                                                    respuestaParcial = new Object();
                                                    respuestaParcial.codigo = 'SCUP010';
                                                    respuestaParcial.mensaje = 'Excepcion Grabando Registro de Liquidacion A Confirmar para el Cupon con ID Interno : ' + respuesta.idCupon + ' - Excepcion : ' + excepcionSaveLiqConf.message.toString();
                                                    respuesta.detalle.push(respuestaParcial);
                                                }
                                                if (utilities.isEmpty(recordIdLiqConf)) {
                                                    respuesta.error = true;
                                                    respuestaParcial = new Object();
                                                    respuestaParcial.codigo = 'SCUP011';
                                                    respuestaParcial.mensaje = 'Error Grabando Registro de Liquidacion A Confirmar para el Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : No se recibio el ID Interno del Registro de Liquidacion A Confirmar Generado';
                                                    respuesta.detalle.push(respuestaParcial);
                                                } else {
                                                    respuesta.idRegLiqConf = recordIdLiqConf;
                                                    log.debug('Grabar Cupon', 'Liquidacion A Confirmar Generada con ID : ' + recordIdLiqConf);
                                                }
                                            } else {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SCUP009';
                                                respuestaParcial.mensaje = 'Error Grabando Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : No se pudo crear el Registro de Liquidacion A Confirmar';
                                                respuesta.detalle.push(respuestaParcial);
                                            }

                                        }
                                    }

                                    // FIN CREAR CUSTOM TRANSACTION DEUDA A CONFIRMAR


                                    // INICIO - ACTUALIZAR CUPON
                                    if (!utilities.isEmpty(recordIdLiqConf)) {
                                        informacion.registro.setValue({
                                            fieldId: 'custrecord_3k_cupon_link_liq_conf',
                                            value: recordIdLiqConf
                                        });
                                        informacion.registro.setValue({
                                            fieldId: 'custrecord_3k_cupon_imp_ing_conf',
                                            value: importeIngreso
                                        });
                                        informacion.registro.setValue({
                                            fieldId: 'custrecord_3k_cupon_imp_deuda_conf',
                                            value: importeDeuda
                                        });
                                        informacion.registro.setValue({
                                            fieldId: 'custrecord_3k_cupon_imp_ingreso_fact',
                                            value: 0
                                        });
                                        informacion.registro.setValue({
                                            fieldId: 'custrecord_3k_cupon_imp_deuda_pagar',
                                            value: 0
                                        });
                                        informacion.registro.setValue({
                                            fieldId: 'custrecord_3k_cupon_cuenta_ing_conf',
                                            value: idCuentaIngresoAConfirmar
                                        });
                                        informacion.registro.setValue({
                                            fieldId: 'custrecord_3k_cupon_cuenta_deuda_conf',
                                            value: idCuentaDeudaAConfirmar
                                        });
                                        informacion.registro.setValue({
                                            fieldId: 'custrecord_3k_cupon_cuenta_ing_ini',
                                            value: idCuentaIngresoInicial
                                        });
                                        informacion.registro.setValue({
                                            fieldId: 'custrecord_3k_cupon_moneda_base',
                                            value: monedaPrincipalSubsidiaria
                                        });

                                    }


                                    try {
                                        recordCupon = informacion.registro.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: false
                                        });
                                    } catch (excepcionSaveCupon) {
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'SCUP018';
                                        respuestaParcial.mensaje = 'Excepcion Grabando Registro de Cupon con ID Interno : ' + respuesta.idCupon + ' - Excepcion : ' + excepcionSaveCupon.message.toString();
                                        respuesta.detalle.push(respuestaParcial);
                                    }
                                    if (utilities.isEmpty(recordCupon)) {
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'SCUP019';
                                        respuestaParcial.mensaje = 'Error Grabando Registro de Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : No se recibio el ID Interno del Registro de Cupon Actualizado';
                                        respuesta.detalle.push(respuestaParcial);
                                    } else {
                                        respuesta.idCupon = recordCupon;
                                        log.debug('Grabar Cupon', 'Cupon Grabado con ID : ' + recordCupon);
                                    }
                                    // FIN - ACTUALIZAR CUPON

                                } else {
                                    // Importe Cupon Invalido
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'SCUP017';
                                    respuestaParcial.mensaje = 'Error Grabando Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : El importe del Cupon : ' + importeCupon + ' Es Invalido';
                                    respuesta.detalle.push(respuestaParcial);
                                }


                            } else {
                                var mensaje = 'No se recibio la siguiente informacion Requerida de la Cobranza para procesar el Cupon : ';

                                if (utilities.isEmpty(subsidiaria)) {
                                    mensaje = mensaje + ' Subsidiaria / ';
                                }
                                if (utilities.isEmpty(cuentaDeposito)) {
                                    mensaje = mensaje + ' Cuenta Contable Asociada a la Cobranza / ';
                                }
                                if (utilities.isEmpty(moneda)) {
                                    mensaje = mensaje + ' Moneda / ';
                                }
                                if (utilities.isEmpty(tipoCambio)) {
                                    mensaje = mensaje + ' Tipo de Cambio / ';
                                }

                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SCUP020';
                                respuestaParcial.mensaje = mensaje;
                                respuesta.detalle.push(respuestaParcial);
                            }
                        }
                    } else {
                        respuesta.error = true;
                        var mensaje = 'No se recibio la informacion del Registro del Cupon';
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'SCUP008';
                        respuestaParcial.mensaje = mensaje;
                        respuesta.detalle.push(respuestaParcial);
                    }
                } else {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SCUP007';
                    respuestaParcial.mensaje = 'No se recibio la informacion del Cupon';
                    respuesta.detalle.push(respuestaParcial);
                }
            } catch (excepcionGeneral) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'SCUP006';
                respuestaParcial.mensaje = 'Excepcion Generando Custom Transaction para el Cupon con ID Interno : ' + respuesta.idCupon + ' - Excepcion : ' + excepcionGeneral.message.toString();
                respuesta.detalle.push(respuestaParcial);
            }

            log.audit('Cupon New', 'FIN Proceso');
            return respuesta;
        }

        function calcularVolumetrico(rec) {
            var respuesta = new Object({});
            respuesta.error = false;
            respuesta.detalle = [];

            try {

                //var rec = currentRecord.get();
                var numLines = rec.getLineCount({
                    sublistId: 'item'
                });

                var totalVolumentrico = 0;
                var totalPeso = 0;
                var totalCantidad = 0;

                for (var i = 0; i < numLines; i++) {

                    var pesoTotalLine = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_peso_total',
                        line: i
                    });

                    var tamanoTotalLine = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_tam_vol_total',
                        line: i
                    });

                    var quantity = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    });

                    if (!utilities.isEmpty(tamanoTotalLine) && isNaN(tamanoTotalLine))
                        totalVolumentrico += parseFloat(tamanoTotalLine, 10);

                    if (!utilities.isEmpty(pesoTotalLine) && isNaN(pesoTotalLine))
                        totalPeso += parseFloat(pesoTotalLine, 10);

                    if (!utilities.isEmpty(quantity) && isNaN(quantity))
                        totalCantidad += parseInt(quantity, 10);


                }

                rec.setValue({
                    fieldId: 'custbody_3k_peso_total',
                    value: totalPeso.toFixed(2).toString()
                });

                rec.setValue({
                    fieldId: 'custbody_3k_tam_vol_total',
                    value: totalVolumentrico.toFixed(2).toString()
                });

                rec.setValue({
                    fieldId: 'custbody_3k_cant_unidades_total',
                    value: totalCantidad.toString()
                });

                //var idRec = rec.save();

                respuesta.rec = rec;



            } catch (e) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'CVOL001';
                respuestaParcial.mensaje = 'Excepcion calculando Totales peso y tamaño : ' + e.message;
                respuesta.detalle.push(respuestaParcial);
            }

            return respuesta;
        }

        function generarFacturas(request, envioEmail, envioLogistico) {
            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();
            objRespuesta.idFactura = '';
            objRespuesta.carrito = '';
            var arrayRespuesta = new Array();
            var arrayFacturas = new Array();

            envioEmail = typeof envioEmail !== 'undefined' ? envioEmail : false;
            envioLogistico = typeof envioLogistico !== 'undefined' ? envioLogistico : false;

            var inforamcionAplicarNC = new Array();

            if (!utilities.isEmpty(request)) {
                try {
                    var informacion = JSON.parse(request);

                    //log.debug('doPost', 'informacion: ' + JSON.stringify(informacion));
                    //log.debug('doPost', 'informacion.length: ' + informacion.length);
                    //var array

                    var objResult = utilities.searchSavedPro('customsearch_3k_configuracion_voucher_ss');
                    if (objResult.error) {
                        objRespuesta.error = true;
                        objRespuestaParcial = new Object();
                        objRespuestaParcial.codigo = objResult.codigo;
                        objRespuestaParcial.mensaje = objResult.mensaje;
                        objRespuesta.detalle.push(objRespuestaParcial);
                        arrayRespuesta.push(objRespuesta);
                        return arrayRespuesta;
                    }

                    var configVoucher = objResult.objRsponseFunction.array;
                    log.debug('doPost', 'configVoucher: ' + JSON.stringify(configVoucher));

                    for (var i = 0; i < informacion.length; i++) {

                        var objOrden = new Object({});
                        //log.debug('doPost', 'informacion posicion i: ' + JSON.stringify(informacion[i]));
                        objOrden = informacion[i];

                        var objRespuestaN = new Object({});
                        objRespuestaN.error = false;
                        objRespuestaN.detalle = new Array();
                        objRespuestaN.idFactura = '';
                        objRespuestaN.carrito = objOrden.carrito;

                        var objFieldLookUpDireccion = search.lookupFields({
                            type: search.Type.SALES_ORDER,
                            id: objOrden.carrito,
                            columns: [
                                'exchangerate'
                            ]
                        });

                        var tipoCambioOV = objFieldLookUpDireccion.exchangerate;

                        var objRecord = record.transform({
                            fromType: record.Type.SALES_ORDER,
                            fromId: objOrden.carrito,
                            toType: record.Type.INVOICE,
                            isDynamic: true,
                        });

                        var facturaCompleta = objOrden.facturaCompleta;
                        var fechaRemito = objOrden.fechaRemito;

                        objRecord.setValue({
                            fieldId: 'exchangerate',
                            value: tipoCambioOV
                        });

                        if (facturaCompleta == "N") {
                            if (objOrden.ordenes.length > 0) {
                                var numLines = objRecord.getLineCount({
                                    sublistId: 'item'
                                });

                                var arrayOV = new Array();
                                //arrayCupones

                                //log.debug('doPost', 'linea 57');
                                for (var j = 0; j < objOrden.ordenes.length; j++) {
                                    var objOV = new Object({});
                                    objOV.index = j;
                                    objOV.idOV = objOrden.ordenes[j].idOV;
                                    objOV.cupones = objOrden.ordenes[j].cupones;
                                    objOV.actualizarEstadoCupon = false;
                                    arrayOV.push(JSON.parse(JSON.stringify(objOV)));

                                }

                                log.debug('doPost', 'arrayOV: ' + JSON.stringify(arrayOV));

                                var calculoProporcionVoucher = 0;
                                var arrayVoucher = [];

                                var newImporteEnvio = 0;

                                //log.debug('doPost', 'linea 67');
                                var informacionOV = new Array();
                                for (var k = 0; k < numLines; k++) {
                                    var isVoucher = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_linea_voucher',
                                        line: k
                                    });

                                    var esRedondeo = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_es_redondeo',
                                        line: k
                                    });

                                    if (!isVoucher && !esRedondeo) {
                                        var idOrden = objRecord.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_3k_id_orden',
                                            line: k
                                        });
                                    } else {
                                        objRecord.removeLine({
                                            sublistId: 'item',
                                            line: k
                                        });
                                        k--;
                                        numLines--;
                                    }
                                    var infoOV = new Object({});
                                    infoOV.idOV = idOrden;
                                    informacionOV.push(JSON.parse(JSON.stringify(infoOV)));
                                }

                                var ordenesNoEncontradas = new Array();

                                if (!utilities.isEmpty(informacionOV) && informacionOV.length > 0) {
                                    for (var jj = 0; jj < objOrden.ordenes.length; jj++) {
                                        var filterOV = informacionOV.filter(function (ob) {
                                            return (ob.idOV == objOrden.ordenes[jj].idOV);
                                        });
                                        if (utilities.isEmpty(filterOV) || (!utilities.isEmpty(filterOV) && filterOV.length <= 0)) {
                                            ordenesNoEncontradas.push(objOrden.ordenes[jj].idOV);
                                        }
                                    }
                                }

                                if (ordenesNoEncontradas.length > 0) {
                                    objRespuestaN.error = true;
                                    objRespuestaParcial = new Object();
                                    objRespuestaParcial.codigo = 'RFAC029';
                                    objRespuestaParcial.mensaje = 'No se encontraron las siguientes Ordenes para el carrito ID: ' + objOrden.carrito + ' - Ordenes No Encontradas : ' + ordenesNoEncontradas.toString();
                                    objRespuestaN.detalle.push(objRespuestaParcial);
                                    //objRespuesta.tipoError = 'RFAC005';
                                    //objRespuesta.descripcion = 'No se recibió ID de Ordenes a facturar para el carrito ID: ' + objOrden.carrito;
                                    /*log.error('RFAC029', objRespuestaParcial.mensaje);
                                    return JSON.stringify(objRespuesta);*/
                                    arrayRespuesta.push(objRespuestaN);
                                    continue;
                                }

                                /*for (var x = 0; x < numLines; x++) {

                                    var isVoucher = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_linea_voucher',
                                        line: x
                                    });

                                    if (isVoucher) {

                                        objRecord.removeLine({
                                            sublistId: 'item',
                                            line: x
                                        });
                                        x--;
                                        numLines--;

                                    }

                                }*/

                                var numLinesSinVoucher = objRecord.getLineCount({
                                    sublistId: 'item'
                                });

                                for (var k = 0; k < numLinesSinVoucher; k++) {
                                    var lineWithVoucher = false;

                                    var obj = new Object({});
                                    var line = k;
                                    var isVoucher = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_linea_voucher',
                                        line: k
                                    });

                                    var cantidadOV = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_cantidad_ov',
                                        line: k
                                    });
                                    var idOrden = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_id_orden',
                                        line: k
                                    });

                                    var importeVoucher = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_importe_voucher',
                                        line: k
                                    });

                                    var quantity = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'quantity',
                                        line: k
                                    });

                                    var importeEnvio = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_imp_envio',
                                        line: k
                                    });

                                    var codigoAccionVoucher = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_cod_accion_voucher',
                                        line: k
                                    });

                                    var notaCredito = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_nota_credito_asociada',
                                        line: k
                                    });

                                    var IDVoucher = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_voucher',
                                        line: k
                                    });

                                    var taxcode = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'taxcode',
                                        line: k
                                    });


                                    //log.debug('doPost', 'obj: ' + JSON.stringify(obj));
                                    //log.debug('doPost', 'linea 90');


                                    if (!isVoucher) {
                                        //log.debug('doPost', 'linea 93');
                                        var filterOrden = arrayOV.filter(function (ob) {
                                            /*log.debug('doPost', 'filter OV: ' + ob.idOV);
                                            log.debug('doPost', 'obj.idOrden: ' + obj.idOrden);*/
                                            return (ob.idOV == idOrden);
                                        });
                                        log.debug('doPost', 'filter OV: ' + JSON.stringify(filterOrden));
                                        if (!utilities.isEmpty(filterOrden) && filterOrden.length > 0) {
                                            if (filterOrden[0].cupones.length > 0) {
                                                if (!utilities.isEmpty(filterOrden) && filterOrden.length > 0) {
                                                    if (cantidadOV >= filterOrden[0].cupones.length) {
                                                        //log.debug('doPost', 'linea 100');
                                                        if (!utilities.isEmpty(importeEnvio) && importeEnvio > 0) {

                                                            var proporcionalEnvio = ((parseFloat(importeEnvio) / parseFloat(cantidadOV)) * filterOrden[0].cupones.length);
                                                            newImporteEnvio += parseFloat(proporcionalEnvio, 10);
                                                            objRecord.setCurrentSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'custcol_3k_imp_envio_fact',
                                                                value: parseFloat(proporcionalEnvio, 10).toFixed(2).toString()
                                                            });
                                                        }

                                                        objRecord.selectLine({
                                                            sublistId: 'item',
                                                            line: k
                                                        });

                                                        objRecord.setCurrentSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'quantity',
                                                            value: filterOrden[0].cupones.length
                                                        });



                                                        //Funcionalidad de agregar voucher de descuento proporcional por el numero de cupones en la facturación
                                                        var proporcionalVoucher = 0;
                                                        if (!utilities.isEmpty(importeVoucher) && importeVoucher > 0) {

                                                            proporcionalVoucher = ((parseFloat(importeVoucher) / parseFloat(cantidadOV)) * filterOrden[0].cupones.length);
                                                            log.debug('NC', 'Importe Proporcional : ' + proporcionalVoucher);
                                                            // Si no es un Voucher de Devolucion
                                                            if (codigoAccionVoucher != '2') {
                                                                lineWithVoucher = true;
                                                                calculoProporcionVoucher += ((parseFloat(importeVoucher) / parseFloat(cantidadOV)) * filterOrden[0].cupones.length);
                                                            } else {
                                                                // Asociar Nota de Credito A Factura
                                                                if (!utilities.isEmpty(notaCredito)) {
                                                                    var inforAplicarNC = new Object();
                                                                    inforAplicarNC.idVoucher = IDVoucher;
                                                                    inforAplicarNC.notaCredito = notaCredito;
                                                                    inforAplicarNC.importeAplicar = parseFloat(proporcionalVoucher, 10);
                                                                    inforamcionAplicarNC.push(inforAplicarNC);
                                                                } else {
                                                                    // Error - Voucher de Devolucion sin Nota de Credito Asociada
                                                                    objRespuestaN.error = true;
                                                                    objRespuestaParcial = new Object();
                                                                    objRespuestaParcial.codigo = 'RFAC008';
                                                                    objRespuestaParcial.mensaje = 'No se recibió la informacion de la Nota de Credito Asociada al Voucher de Devolucion con ID Interno : ' + IDVoucher + ' en el carrito ID: ' + objOrden.carrito + ' ID Orden: ' + idOrden;
                                                                    objRespuestaN.detalle.push(objRespuestaParcial);
                                                                    /*log.error('RFAC008', 'No se recibió la informacion de la Nota de Credito Asociada al Voucher de Devolucion con ID Interno : ' + IDVoucher + ' en el carrito ID: ' + objOrden.carrito + ' ID Orden: ' + idOrden);
                                                                    return objRespuesta;*/
                                                                    arrayRespuesta.push(objRespuestaN);
                                                                    break;

                                                                }
                                                            }

                                                            objRecord.setCurrentSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'custcol_3k_imp_voucher_fact',
                                                                value: parseFloat(proporcionalVoucher, 10).toFixed(2).toString()
                                                            });
                                                        }



                                                        objRecord.commitLine({
                                                            sublistId: 'item'
                                                        });

                                                        arrayOV[filterOrden[0].index].actualizarEstadoCupon = true;

                                                        //INICIO INSERTAR LINEA DE VOUCHER

                                                        if (lineWithVoucher) {
                                                            var importeDescuento = Math.abs(calculoProporcionVoucher) * (-1);
                                                            objRecord.insertLine({
                                                                sublistId: 'item',
                                                                line: (k + 1)
                                                            });
                                                            objRecord.setCurrentSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'item',
                                                                value: configVoucher[0].custrecord_3k_configvou_articulo
                                                            });
                                                            objRecord.setCurrentSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'taxcode',
                                                                value: taxcode
                                                            });

                                                            objRecord.setCurrentSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'grossamt',
                                                                value: importeDescuento.toString()
                                                            });
                                                            objRecord.setCurrentSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'custcol_3k_importe_voucher',
                                                                value: parseFloat(calculoProporcionVoucher, 10).toFixed(2).toString()
                                                            });

                                                            var amount = objRecord.getCurrentSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'amount'
                                                            });
                                                            var tipoDescuento = objRecord.getCurrentSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'custcol_3k_tipo_descuento'
                                                            });
                                                            objRecord.setCurrentSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'custcol_l598_tipo_desc_rec',
                                                                value: tipoDescuento
                                                            });
                                                            objRecord.setCurrentSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'rate',
                                                                value: amount.toString()
                                                            });
                                                            objRecord.setCurrentSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'custcol_3k_linea_voucher',
                                                                value: true
                                                            });

                                                            var grossamtVocherAfterRate = objRecord.getCurrentSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'grossamt'
                                                            });

                                                            log.debug('generarFacturas', 'grossamtVocherAfterRate: ' + grossamtVocherAfterRate.toString());

                                                            if (parseFloat(grossamtVocherAfterRate) != parseFloat(importeDescuento)) {

                                                                objRecord.setCurrentSublistValue({
                                                                    sublistId: 'item',
                                                                    fieldId: 'grossamt',
                                                                    value: importeDescuento.toString()
                                                                });
                                                            }

                                                            objRecord.commitLine({
                                                                sublistId: 'item'
                                                            });

                                                            k++;
                                                            numLinesSinVoucher++
                                                        }


                                                    } else {
                                                        objRespuestaN.error = true;
                                                        objRespuestaParcial = new Object();
                                                        objRespuestaParcial.codigo = 'RFAC003';
                                                        objRespuestaParcial.mensaje = 'La cantidad de cupones enviados es mayor a la faltante por facturar en la orden de venta ' + filterOrden[0].idOV;
                                                        objRespuestaN.detalle.push(objRespuestaParcial);
                                                        //objRespuesta.tipoError = 'RFAC003';
                                                        //objRespuesta.descripcion = 'La cantidad de cupones enviados es mayor a la faltante por facturar en la orden de venta ' + filterOrden[0].idOV;
                                                        /*log.error('RFAC003', 'La cantidad de cupones enviados es mayor a la faltante por facturar en la orden de venta ' + filterOrden[0].idOV);
                                                        return JSON.stringify(objRespuesta);*/
                                                        arrayRespuesta.push(objRespuestaN);
                                                        break;
                                                    }
                                                } else {
                                                    objRecord.removeLine({
                                                        sublistId: 'item',
                                                        line: k
                                                    });
                                                    k--;
                                                    numLinesSinVoucher--;
                                                }
                                            } else {
                                                objRespuestaN.error = true;
                                                objRespuestaParcial = new Object();
                                                objRespuestaParcial.codigo = 'RFAC004';
                                                objRespuestaParcial.mensaje = 'No se recibió cupones a factura en el carrito ID: ' + objOrden.carrito + ' ID Orden: ' + idOrden;
                                                objRespuestaN.detalle.push(objRespuestaParcial);
                                                //objRespuesta.tipoError = 'RFAC004';
                                                //objRespuesta.descripcion = 'No se recibió cupones a factura en el carrito ID: ' + objOrden.carrito + ' ID Orden: ' + idOrden;
                                                /*log.error('RFAC004', 'No se recibió cupones a factura en el carrito ID: ' + objOrden.carrito + ' ID Orden: ' + idOrden);
                                                return JSON.stringify(objRespuesta);*/
                                                arrayRespuesta.push(objRespuestaN);

                                                break;
                                            }
                                        } else {
                                            objRecord.removeLine({
                                                sublistId: 'item',
                                                line: k
                                            });
                                            k--;
                                            numLinesSinVoucher--;
                                        }
                                    }


                                } //END FOR K

                                if (objRespuestaN.error) {
                                    continue;
                                }

                                var array = new Array();
                                for (var x = 0; x < arrayOV.length; x++) {
                                    if (arrayOV[x].actualizarEstadoCupon) {
                                        for (var z = 0; z < arrayOV[x].cupones.length; z++) {
                                            //log.debug('doPost', 'cantidad cupones: ' + arrayOV[x].cupones.length);
                                            //log.debug('doPost', 'idCupon: ' + arrayOV[x].cupones[z].idCupon);
                                            array.push(arrayOV[x].cupones[z].idCupon);
                                        }
                                    }
                                }

                                //log.debug('doPost', 'array: ' + array.toString());

                                objRecord.setValue({
                                    fieldId: 'custbody_3k_fact_cupones',
                                    value: array
                                });

                                objRecord.setValue({
                                    fieldId: 'shippingcost',
                                    value: newImporteEnvio
                                });

                                //Ingresar linea de Voucher
                                /*if (lineWithVoucher) {
                                    var importeDescuento = Math.abs(calculoProporcionVoucher) * (-1);
                                    objRecord.selectNewLine({
                                        sublistId: 'item'
                                    });
                                    objRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'item',
                                        value: configVoucher[0].custrecord_3k_configvou_articulo
                                    });
                                    
                                    objRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_importe_voucher',
                                        value: parseFloat(calculoProporcionVoucher, 10).toFixed(2).toString()
                                    });
                                    objRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'rate',
                                        value: parseFloat(importeDescuento, 10).toFixed(2).toString()
                                    });
                                    
                                    objRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_linea_voucher',
                                        value: true
                                    });
                                    objRecord.commitLine({
                                        sublistId: 'item'
                                    });


                                }*/

                            } else {
                                objRespuestaN.error = true;
                                objRespuestaParcial = new Object();
                                objRespuestaParcial.codigo = 'RFAC005';
                                objRespuestaParcial.mensaje = 'No se recibió ID de Ordenes a facturar para el carrito ID: ' + objOrden.carrito;
                                objRespuestaN.detalle.push(objRespuestaParcial);
                                //objRespuesta.tipoError = 'RFAC005';
                                //objRespuesta.descripcion = 'No se recibió ID de Ordenes a facturar para el carrito ID: ' + objOrden.carrito;
                                /*log.error('RFAC005', 'No se recibió ID de Ordenes a facturar para el carrito ID: ' + objOrden.carrito);
                                return JSON.stringify(objRespuesta);*/
                                arrayRespuesta.push(objRespuestaN);
                                continue;
                            }
                        } else {

                            var arraySearchParams = new Array();
                            var objParam = new Object({});
                            objParam.name = 'custrecord_3k_cupon_ord_venta';
                            objParam.operator = 'IS';
                            objParam.values = [objOrden.carrito];
                            arraySearchParams.push(objParam);

                            var objResult = utilities.searchSavedPro('customsearch_3k_cupones_orden_venta', arraySearchParams);
                            if (objResult.error) {
                                //return objResult;
                                objRespuestaN.error = true;
                                objRespuestaParcial = new Object();
                                objRespuestaParcial.codigo = objResult.codigo;
                                objRespuestaParcial.mensaje = objResult.mensaje;
                                objRespuestaN.detalle.push(objRespuestaParcial);
                                arrayRespuesta.push(objRespuestaN);
                                continue;
                            }

                            var resultcupones = objResult.objRsponseFunction.array;

                            log.debug('Generar Factura', 'resultcupones: ' + JSON.stringify(resultcupones));

                            var cuponesOV = [];

                            for (var t = 0; t < resultcupones.length; t++) {
                                cuponesOV.push(resultcupones[t].internalid);
                            }

                            log.debug('Generar Factura', 'cuponesOV: ' + JSON.stringify(cuponesOV));

                            //log.debug('doPost', 'array: ' + array.toString());

                            objRecord.setValue({
                                fieldId: 'custbody_3k_fact_cupones',
                                value: cuponesOV
                            });

                            var numLines = objRecord.getLineCount({
                                sublistId: 'item'
                            });

                            for (var x = 0; x < numLines; x++) {

                                var isVoucher = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_linea_voucher',
                                    line: x
                                });

                                if (isVoucher) {

                                    objRecord.removeLine({
                                        sublistId: 'item',
                                        line: x
                                    });
                                    x--;
                                    numLines--;

                                }
                            }

                            // INICIO - Consultar Vouchers de Dovolucion

                            var numLinesSinVoucher = objRecord.getLineCount({
                                sublistId: 'item'
                            });

                            log.debug('Generar Factura', 'numLinesSinVoucher antes for: ' + numLinesSinVoucher);

                            for (var k = 0; k < numLinesSinVoucher; k++) {
                                log.debug('Generar Factura', 'k al inicio: ' + k);
                                log.debug('Generar Factura', 'numLinesSinVoucher al inicio: ' + numLinesSinVoucher);

                                var obj = new Object({});
                                var line = k;
                                var isVoucher = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_linea_voucher',
                                    line: k
                                });

                                var importeVoucher = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_importe_voucher',
                                    line: k
                                });

                                var codigoAccionVoucher = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_cod_accion_voucher',
                                    line: k
                                });

                                var notaCredito = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_nota_credito_asociada',
                                    line: k
                                });

                                var IDVoucher = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_voucher',
                                    line: k
                                });

                                var taxcode = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'taxcode',
                                    line: k
                                });

                                var aplicaDeposito = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_aplicar_deposito',
                                    line: k
                                });

                                if (!isVoucher) {
                                    var proporcionalVoucher = 0;
                                    if (!utilities.isEmpty(importeVoucher) && importeVoucher > 0) {
                                        //lineWithVoucher = true;
                                        //proporcionalVoucher = ((parseFloat(importeVoucher) / parseFloat(cantidadOV)) * filterOrden[0].cupones.length);
                                        log.debug('NC', 'Importe Proporcional 2 : ' + proporcionalVoucher);
                                        // Si no es un Voucher de Devolucion
                                        if (codigoAccionVoucher == '2') {
                                            // Asociar Nota de Credito A Factura
                                            if (!utilities.isEmpty(notaCredito)) {
                                                var inforAplicarNC = new Object();
                                                inforAplicarNC.idVoucher = IDVoucher;
                                                inforAplicarNC.notaCredito = notaCredito;
                                                inforAplicarNC.importeAplicar = parseFloat(importeVoucher, 10);
                                                inforAplicarNC.aplicaDeposito = aplicaDeposito;
                                                inforamcionAplicarNC.push(inforAplicarNC);
                                            } else {
                                                // Error - Voucher de Devolucion sin Nota de Credito Asociada
                                                objRespuestaN.error = true;
                                                objRespuestaParcial = new Object();
                                                objRespuestaParcial.codigo = 'RFAC008';
                                                objRespuestaParcial.mensaje = 'No se recibió la informacion de la Nota de Credito Asociada al Voucher de Devolucion con ID Interno : ' + IDVoucher + ' en el carrito ID: ' + objOrden.carrito + ' ID Orden: ' + idOrden;
                                                objRespuestaN.detalle.push(objRespuestaParcial);
                                                /*log.error('RFAC008', 'No se recibió la informacion de la Nota de Credito Asociada al Voucher de Devolucion con ID Interno : ' + IDVoucher + ' en el carrito ID: ' + objOrden.carrito + ' ID Orden: ' + idOrden);
                                                return JSON.stringify(objRespuesta);*/
                                                arrayRespuesta.push(objRespuestaN);
                                                break;
                                            }
                                        } else {

                                            var importeDescuento = Math.abs(importeVoucher) * (-1);
                                            objRecord.insertLine({
                                                sublistId: 'item',
                                                line: (k + 1)
                                            });
                                            objRecord.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'item',
                                                value: configVoucher[0].custrecord_3k_configvou_articulo
                                            });
                                            objRecord.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'taxcode',
                                                value: taxcode
                                            });

                                            objRecord.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'grossamt',
                                                value: importeDescuento.toString()
                                            });
                                            objRecord.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_3k_importe_voucher',
                                                value: parseFloat(importeVoucher, 10).toFixed(2).toString()
                                            });

                                            var amount = objRecord.getCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'amount'
                                            });

                                            var tipoDescuento = objRecord.getCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_3k_tipo_descuento'
                                            });
                                            objRecord.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_l598_tipo_desc_rec',
                                                value: tipoDescuento
                                            });
                                            objRecord.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'rate',
                                                value: amount.toString()
                                            });
                                            objRecord.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_3k_linea_voucher',
                                                value: true
                                            });

                                            objRecord.commitLine({
                                                sublistId: 'item'
                                            });

                                            k++;
                                            numLinesSinVoucher++;

                                            log.debug('Generar Factura', 'k despues sum: ' + k);
                                            log.debug('Generar Factura', 'numLinesSinVoucher despues sum: ' + numLinesSinVoucher);
                                        }

                                    }
                                }

                            }

                            if (objRespuestaN.error) {
                                continue;
                            }

                            // FIN - Consultar Vouchers de Dovolucion
                        }


                        // INICIO - Consultar y Grabar Unidad Indexada

                        var unidadIndexada = '';
                        var tasaMinima = '';
                        var tasaBasica = '';

                        var searchConfig = utilities.searchSaved('customsearch_3k_config_ui');

                        if (!utilities.isEmpty(searchConfig) && !searchConfig.error) {
                            if (!utilities.isEmpty(searchConfig.objRsponseFunction.result) && searchConfig.objRsponseFunction.result.length > 0) {
                                unidadIndexada = searchConfig.objRsponseFunction.result[0].getValue({
                                    name: searchConfig.objRsponseFunction.search.columns[1]
                                });
                                tasaMinima = searchConfig.objRsponseFunction.result[0].getValue({
                                    name: searchConfig.objRsponseFunction.search.columns[2]
                                });
                                tasaBasica = searchConfig.objRsponseFunction.result[0].getValue({
                                    name: searchConfig.objRsponseFunction.search.columns[3]
                                });

                                if (utilities.isEmpty(unidadIndexada) || utilities.isEmpty(tasaMinima) || utilities.isEmpty(tasaBasica)) {
                                    objRespuestaN.error = true;
                                    var mensaje = 'No se encuentra configurada la siguiente informacion del panel de configuracion de Unidad Indexada : ';
                                    if (utilities.isEmpty(unidadIndexada)) {
                                        mensaje = mensaje + ' Valor Unidad Indexada / ';
                                    }
                                    if (utilities.isEmpty(tasaMinima)) {
                                        mensaje = mensaje + ' Tasa Minima / ';
                                    }
                                    if (utilities.isEmpty(tasaBasica)) {
                                        mensaje = mensaje + ' Tasa Basica / ';
                                    }

                                    objRespuestaParcial = new Object();
                                    objRespuestaParcial.codigo = 'RFAC020';
                                    objRespuestaParcial.mensaje = mensaje;
                                    objRespuestaN.detalle.push(objRespuestaParcial);
                                    /*log.error('RFAC020', mensaje);
                                    return JSON.stringify(objRespuesta);*/
                                    arrayRespuesta.push(objRespuestaN);
                                    continue;
                                }
                            } else {
                                objRespuestaN.error = true;
                                var mensaje = 'No se encuentra realizada la configuracion de Configuracion de Unidad Indexada : ';

                                objRespuestaParcial = new Object();
                                objRespuestaParcial.codigo = 'RFAC021';
                                objRespuestaParcial.mensaje = mensaje;
                                objRespuestaN.detalle.push(objRespuestaParcial);
                                /*log.error('RFAC021', mensaje);
                                return JSON.stringify(objRespuesta);*/
                                arrayRespuesta.push(objRespuestaN);
                                continue;
                            }
                        } else {
                            objRespuestaN.error = true;
                            var mensaje = 'Error Consultando Configuracion de Unidad Indexada - Tipo Error : ' + searchConfig.tipoError + ' - Descripcion : ' + searchConfig.descripcion;

                            objRespuestaParcial = new Object();
                            objRespuestaParcial.codigo = 'RFAC022';
                            objRespuestaParcial.mensaje = mensaje;
                            objRespuestaN.detalle.push(objRespuestaParcial);
                            /*log.error('RFAC022', mensaje);
                            return JSON.stringify(objRespuesta);*/
                            arrayRespuesta.push(objRespuestaN);
                            continue;
                        }

                        if (!utilities.isEmpty(unidadIndexada)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_valor_unidad_indexada',
                                value: unidadIndexada
                            });
                        }
                        if (!utilities.isEmpty(tasaMinima)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_imp_tasa_minima',
                                value: tasaMinima
                            });
                        }
                        if (!utilities.isEmpty(tasaBasica)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_imp_tasa_basica',
                                value: tasaBasica
                            });
                        }
                        // FIN - Consultar y Grabar Unidad Indexada



                        /*var direccionConfigurada = objRecord.getValue({
                                fieldId: 'billingaddress.address1'
                            });

                        if(!utilities.isEmpty(direccionConfigurada)){
                            objOrden.informacionCliente.direccion=direccionConfigurada;
                        }

                        var ciudadConfigurada = objRecord.getValue({
                                fieldId: 'billingaddress.city'
                            });

                        if(!utilities.isEmpty(direccionConfigurada)){
                            objOrden.informacionCliente.ciudad=ciudadConfigurada;
                        }*/


                        // INICIO - Grabar Informacion de Cliente Facturacion
                        if (!utilities.isEmpty(objOrden.informacionCliente) && !utilities.isEmpty(objOrden.informacionCliente.tipoDocumento)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_tipo_documento',
                                value: objOrden.informacionCliente.tipoDocumento
                            });
                        }

                        if (!utilities.isEmpty(objOrden.informacionCliente) && !utilities.isEmpty(objOrden.informacionCliente.numeroDocumento)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_nro_documento',
                                value: objOrden.informacionCliente.numeroDocumento
                            });
                        }

                        var RazonsocialCliente = '';

                        if (!utilities.isEmpty(objOrden.informacionCliente) && !utilities.isEmpty(objOrden.informacionCliente.razonSocial)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_razon_social_cliente',
                                value: objOrden.informacionCliente.razonSocial
                            });
                            RazonsocialCliente = objOrden.informacionCliente.razonSocial;

                        } else {
                            RazonsocialCliente = objRecord.getValue({
                                fieldId: 'custbody_l598_razon_social_cliente'
                            });
                        }

                        var tipodocRUT = objRecord.getValue({
                            fieldId: 'custbody_l598_es_rut'
                        });

                        var tipodocCI = objRecord.getValue({
                            fieldId: 'custbody_l598_es_ci'
                        });

                        var tipodocDOCTransaccion = objRecord.getValue({
                            fieldId: 'custbody_l598_tipo_documento'
                        });

                        var numeroDOCTransaccion = objRecord.getValue({
                            fieldId: 'custbody_l598_nro_documento'
                        });

                        var razonSocialTransaccion = objRecord.getValue({
                            fieldId: 'custbody_l598_razon_social_cliente'
                        });

                        //COMENTADO POR ANTONY REQUERIMIENTO WOOW 10-05-2018
                        /*if (tipodocRUT == true) {
                            if ((utilities.isEmpty(tipodocDOCTransaccion) || utilities.isEmpty(numeroDOCTransaccion) || utilities.isEmpty(razonSocialTransaccion))) {

                                objRespuestaN.error = true;
                                var mensaje = 'No se recibio la Siguiente Informacion de Facturacion del Cliente : ';
                                if (utilities.isEmpty(tipodocDOCTransaccion)) {
                                    mensaje = mensaje + ' Tipo de Documento / ';
                                }
                                if (utilities.isEmpty(numeroDOCTransaccion)) {
                                    mensaje = mensaje + ' Numero de Documento / ';
                                }
                                if (utilities.isEmpty(razonSocialTransaccion)) {
                                    mensaje = mensaje + ' Razon Social / ';
                                }*/

                        // ESTE BLOQUE DE COMENTARIO ESTABA COMENTADO ANTES DEL BLOQUE DE COMENTARIO SUPERIOR DEL 10-05-2018
                        /*if (utilities.isEmpty(objOrden.informacionCliente.direccion)) {
                            mensaje = mensaje + ' Direccion / ';
                        }
                        if (utilities.isEmpty(objOrden.informacionCliente.ciudad)) {
                            mensaje = mensaje + ' Ciudad / ';
                        }*/
                        //FIN BLOQUE DE COMENTARIO ANTIGUO

                        /*objRespuestaParcial = new Object();
                                objRespuestaParcial.codigo = 'RFAC007';
                                objRespuestaParcial.mensaje = mensaje + ' - Para facturar la orden de venta ' + objOrden.carrito;
                                objRespuestaN.detalle.push(objRespuestaParcial);
                                arrayRespuesta.push(objRespuestaN);
                                continue;

                            }
                        }*/
                        //FIN COMENTARIO ANTONY REQUERIMIENTO WOOW 10-05-2018

                        //COMENTADO POR ANTONY REQUERIMIENTO WOOW 10-05-2018
                        /*if (tipodocCI == true) {
                            if ((utilities.isEmpty(tipodocDOCTransaccion) || utilities.isEmpty(numeroDOCTransaccion))) {

                                objRespuestaN.error = true;
                                var mensaje = 'No se recibio la Siguiente Informacion de Facturacion del Cliente : ';
                                if (utilities.isEmpty(tipodocDOCTransaccion)) {
                                    mensaje = mensaje + ' Tipo de Documento / ';
                                }
                                if (utilities.isEmpty(numeroDOCTransaccion)) {
                                    mensaje = mensaje + ' Numero de Documento / ';
                                }*/

                        // ESTE BLOQUE DE COMENTARIO ESTABA COMENTADO ANTES DEL BLOQUE DE COMENTARIO SUPERIOR DEL 10-05-2018
                        /*if (utilities.isEmpty(objOrden.informacionCliente.razonSocial)) {
                            mensaje = mensaje + ' Razon Social / ';
                        }*/
                        /*if (utilities.isEmpty(objOrden.informacionCliente.direccion)) {
                            mensaje = mensaje + ' Direccion / ';
                        }
                        if (utilities.isEmpty(objOrden.informacionCliente.ciudad)) {
                            mensaje = mensaje + ' Ciudad / ';
                        }*/
                        //FIN BLOQUE DE COMENTARIO ANTIGUO


                        /*objRespuestaParcial = new Object();
                                objRespuestaParcial.codigo = 'RFAC007';
                                objRespuestaParcial.mensaje = mensaje + ' - Para facturar la orden de venta ' + objOrden.carrito;
                                objRespuestaN.detalle.push(objRespuestaParcial);
                                arrayRespuesta.push(objRespuestaN);
                                continue;

                            }
                        }*/


                        if (utilities.isEmpty(tipodocRUT) || (!utilities.isEmpty(tipodocRUT) && tipodocRUT == false)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_trans_eticket',
                                value: true
                            });
                        }

                        if (!utilities.isEmpty(objOrden.informacionCliente) && !utilities.isEmpty(objOrden.informacionCliente.email)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_email_cliente',
                                value: objOrden.informacionCliente.email
                            });
                        }


                        objRecord.setValue({
                            fieldId: 'custbody_3k_enviar_email',
                            value: envioEmail
                        });

                        if (envioEmail) {

                            var fechaRemitoNS = format.parse({
                                value: fechaRemito,
                                type: format.Type.DATE
                            });

                            objRecord.setValue({
                                fieldId: 'trandate',
                                value: fechaRemitoNS
                            });
                        }

                        var fechaServidor = new Date();

                        var fechaLocalString = format.format({
                            value: fechaServidor,
                            type: format.Type.DATETIME,
                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                        });

                        var fechaLocal = format.parse({
                            value: fechaLocalString,
                            type: format.Type.DATETIME,
                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                        });

                        objRecord.setValue({
                            fieldId: 'custbody_3k_fecha_creacion',
                            value: fechaLocal
                        });


                        // FIN - Grabar Informacion de Cliente Facturacion

                        var recId = objRecord.save();
                        log.debug('doPost', 'idRec: ' + recId + 'carrito: ' + objOrden.carrito);
                        objRespuestaN.idFactura = recId;
                        objRespuestaN.carrito = objOrden.carrito;
                        arrayFacturas.push(recId);
                        //arrayRespuesta.push(objRespuesta);

                        if (!utilities.isEmpty(recId)) {

                            if (!utilities.isEmpty(objOrden.informacionCliente) && (!utilities.isEmpty(objOrden.informacionCliente.razonSocial) || !utilities.isEmpty(objOrden.informacionCliente.direccion) || !utilities.isEmpty(objOrden.informacionCliente.ciudad))) {

                                if (!utilities.isEmpty(objOrden.informacionCliente) && (!utilities.isEmpty(objOrden.informacionCliente.direccion) || !utilities.isEmpty(objOrden.informacionCliente.ciudad))) {
                                    // INICIO Obtener Domicilio General

                                    var filtrosOV = new Array();

                                    var filtroOrden = new Object();
                                    filtroOrden.name = 'internalid';
                                    filtroOrden.operator = 'IS';
                                    filtroOrden.values = recId;
                                    filtrosOV.push(filtroOrden);

                                    var searchDomicilio = utilities.searchSavedPro('customsearch_3k_direccion_fact', filtrosOV);

                                    if (!utilities.isEmpty(searchDomicilio) && searchDomicilio.error == false) {
                                        if (!utilities.isEmpty(searchDomicilio.objRsponseFunction.result) && searchDomicilio.objRsponseFunction.result.length > 0) {

                                            var resultSet = searchDomicilio.objRsponseFunction.result;
                                            var resultSearch = searchDomicilio.objRsponseFunction.search;

                                            var direccion = resultSet[0].getValue({
                                                name: resultSearch.columns[1]
                                            });

                                            if (utilities.isEmpty(objOrden.informacionCliente.direccion) && !utilities.isEmpty(direccion)) {
                                                objOrden.informacionCliente.direccion = direccion;
                                            }

                                            var ciudad = resultSet[0].getValue({
                                                name: resultSearch.columns[2]
                                            });

                                            if (utilities.isEmpty(objOrden.informacionCliente.ciudad) && !utilities.isEmpty(ciudad)) {
                                                objOrden.informacionCliente.ciudad = ciudad;
                                            }

                                            // FIN Obtener Domicilio General

                                        }
                                    }

                                }

                                // FIN - Obtener Informacion Remito

                                var idFactActualizada = record.submitFields({
                                    type: record.Type.INVOICE,
                                    id: recId,
                                    values: {
                                        billattention: RazonsocialCliente,
                                        billaddr1: objOrden.informacionCliente.direccion,
                                        billcity: objOrden.informacionCliente.ciudad
                                    },
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields: true
                                    }
                                });

                            }
                        }

                        var objFieldLookUpFactura = search.lookupFields({
                            type: 'transaction',
                            id: objRespuestaN.idFactura,
                            columns: [
                                'currency', 'entity', 'fxamountremaining', 'subsidiary', 'account'
                            ]
                        });

                        var monedaFact = objFieldLookUpFactura.currency[0].value;
                        var clienteFact = objFieldLookUpFactura.entity[0].value;
                        //var importeRestante = objFieldLookUpFactura.amountremaining;
                        var importeRestante = objFieldLookUpFactura.fxamountremaining;

                        log.debug('NC', 'Importe Restante : ' + importeRestante);


                        var subsidiariaFact = objFieldLookUpFactura.subsidiary[0].value;
                        var cuentaFact = objFieldLookUpFactura.account[0].value;

                        if (!utilities.isEmpty(importeRestante) && !isNaN(importeRestante) && parseFloat(importeRestante, 10) > 0.00) {

                            // INICIO - Asociar Facturas A Notas de Credito
                            if (!utilities.isEmpty(inforamcionAplicarNC) && inforamcionAplicarNC.length > 0) {
                                for (var i = 0; i < inforamcionAplicarNC.length; i++) {
                                    if (!utilities.isEmpty(inforamcionAplicarNC[i].notaCredito) && !utilities.isEmpty(inforamcionAplicarNC[i].importeAplicar) && parseFloat(inforamcionAplicarNC[i].importeAplicar, 10) > 0.00) {

                                        if (inforamcionAplicarNC[i].aplicaDeposito == false) {
                                            var objRecordNC = record.load({
                                                type: record.Type.CREDIT_MEMO,
                                                id: inforamcionAplicarNC[i].notaCredito,
                                                isDynamic: true,
                                            });
                                            if (!utilities.isEmpty(objRecordNC)) {
                                                var cantidadLineasApply = objRecordNC.getLineCount({
                                                    sublistId: 'apply'
                                                });

                                                var cliente = objRecordNC.getValue({
                                                    fieldId: 'entity'
                                                });

                                                var moneda = objRecordNC.getValue({
                                                    fieldId: 'currency'
                                                });

                                                var imoprteSinAplicar = objRecordNC.getValue({
                                                    fieldId: 'unapplied'
                                                });

                                                if (cliente == clienteFact && moneda == monedaFact) {

                                                    if (!utilities.isEmpty(imoprteSinAplicar) && !isNaN(imoprteSinAplicar) && parseFloat(imoprteSinAplicar, 10) > 0.00) {

                                                        if (parseFloat(imoprteSinAplicar, 10) >= parseFloat(inforamcionAplicarNC[i].importeAplicar, 10)) {

                                                            if (parseFloat(inforamcionAplicarNC[i].importeAplicar, 10) > parseFloat(importeRestante, 10)) {
                                                                inforamcionAplicarNC[i].importeAplicar = parseFloat(importeRestante, 10);
                                                            }

                                                            var transaccionEncontrada = false;

                                                            for (var j = 0; j < cantidadLineasApply && transaccionEncontrada == false; j++) {
                                                                var lineNum = objRecordNC.selectLine({
                                                                    sublistId: 'apply',
                                                                    line: j
                                                                });

                                                                var IDComprobante = objRecordNC.getCurrentSublistValue({
                                                                    sublistId: 'apply',
                                                                    fieldId: 'doc'
                                                                });

                                                                if (IDComprobante == objRespuestaN.idFactura) {
                                                                    transaccionEncontrada = true;
                                                                    objRecordNC.setCurrentSublistValue({
                                                                        sublistId: 'apply',
                                                                        fieldId: 'apply',
                                                                        value: true,
                                                                        ignoreFieldChange: false
                                                                    });

                                                                    objRecordNC.setCurrentSublistValue({
                                                                        sublistId: 'apply',
                                                                        fieldId: 'amount',
                                                                        value: parseFloat(inforamcionAplicarNC[i].importeAplicar, 10).toFixed(2).toString(),
                                                                        ignoreFieldChange: false
                                                                    });

                                                                    objRecordNC.commitLine({
                                                                        sublistId: 'apply'
                                                                    });
                                                                }
                                                            }

                                                            if (transaccionEncontrada == true) {
                                                                try {
                                                                    var recordIdNC = objRecordNC.save({
                                                                        enableSourcing: true,
                                                                        ignoreMandatoryFields: false
                                                                    });
                                                                } catch (excepcionSaveNC) {
                                                                    objRespuestaN.error = true;
                                                                    var mensaje = 'Excepcion Asociando la Nota de Credito con ID Interno : ' + inforamcionAplicarNC[i].notaCredito + ' a la Factura con ID Interno : ' + objRespuestaN.idFactura + ' para el Voucher de Devolucion con ID Interno : ' + inforamcionAplicarNC[i].idVoucher + ' en el carrito ID: ' + objOrden.carrito + ' - Excepcion : ' + excepcionSaveNC.message.toString();
                                                                    objRespuestaParcial = new Object();
                                                                    objRespuestaParcial.codigo = 'RFAC013';
                                                                    objRespuestaParcial.mensaje = mensaje;
                                                                    objRespuestaN.detalle.push(objRespuestaParcial);
                                                                    /*log.error('RFAC013', mensaje);
                                                                    return JSON.stringify(objRespuesta);*/
                                                                    arrayRespuesta.push(objRespuestaN);
                                                                    break;
                                                                }
                                                                if (utilities.isEmpty(recordIdNC)) {
                                                                    objRespuestaN.error = true;
                                                                    var mensaje = 'Error Asociando la Nota de Credito con ID Interno : ' + inforamcionAplicarNC[i].notaCredito + ' a la Factura con ID Interno : ' + objRespuestaN.idFactura + ' para el Voucher de Devolucion con ID Interno : ' + inforamcionAplicarNC[i].idVoucher + ' en el carrito ID: ' + objOrden.carrito + ' - Error : No se recibio el ID Interno de la Nota de Credito Actualizada';
                                                                    objRespuestaParcial = new Object();
                                                                    objRespuestaParcial.codigo = 'RFAC012';
                                                                    objRespuestaParcial.mensaje = mensaje;
                                                                    objRespuestaN.detalle.push(objRespuestaParcial);
                                                                    arrayRespuesta.push(objRespuestaN);
                                                                    /*log.error('RFAC012', mensaje);
                                                                    return JSON.stringify(objRespuesta);*/
                                                                    break;
                                                                } else {
                                                                    // Actualizar Importe Consumido Voucher e Importe Restante
                                                                    /*var objRecordVoucher = record.load({
                                                                        type: 'customrecord_3k_vouchers',
                                                                        id: inforamcionAplicarNC[i].idVoucher,
                                                                        isDynamic: true
                                                                    });
                                                                    if (!utilities.isEmpty(objRecordVoucher)) {

                                                                        var importeConsumido = objRecordVoucher.getValue({
                                                                            fieldId: 'custrecord_3k_vouchers_cosumido'
                                                                        });

                                                                        objRecordVoucher.setValue({
                                                                            fieldId: 'custrecord_3k_vouchers_cosumido',
                                                                            value: parseFloat(importeConsumido,10) + parseFloat(inforamcionAplicarNC[i].importeAplicar,10)
                                                                        });

                                                                        try {
                                                                            var recordIdVoucher = objRecordVoucher.save({
                                                                                enableSourcing: true,
                                                                                ignoreMandatoryFields: false
                                                                            });
                                                                        } catch (excepcionSaveVoucher) {
                                                                            respuesta.error = true;
                                                                            respuestaParcial = new Object();
                                                                            respuestaParcial.codigo = 'RFAC026';
                                                                            respuestaParcial.mensaje = 'Excepcion Actualizando Voucher con ID Interno : ' + inforamcionAplicarNC[i].idVoucher;
                                                                            respuesta.detalle.push(respuestaParcial);
                                                                        }
                                                                        if (utilities.isEmpty(recordIdVoucher)) {
                                                                            respuesta.error = true;
                                                                            respuestaParcial = new Object();
                                                                            respuestaParcial.codigo = 'RFAC027';
                                                                            respuestaParcial.mensaje = 'Error Actualizando Voucher con ID Interno : ' + inforamcionAplicarNC[i].idVoucher;
                                                                            respuesta.detalle.push(respuestaParcial);
                                                                        }

                                                                    }
                                                                    else{
                                                                        respuesta.error = true;
                                                                            respuestaParcial = new Object();
                                                                            respuestaParcial.codigo = 'RFAC028';
                                                                            respuestaParcial.mensaje = 'Error Actualizando Voucher con ID Interno : ' + inforamcionAplicarNC[i].idVoucher;
                                                                            respuesta.detalle.push(respuestaParcial);
                                                                    }
                                                                    */
                                                                }
                                                            } else {
                                                                // Error
                                                                objRespuestaN.error = true;
                                                                var mensaje = 'La Nota de Credito con ID Interno : ' + inforamcionAplicarNC[i].notaCredito + ' No esta disponible para ser aplicado a la Factura con ID Interno : ' + objRespuesta.idFactura + ' para el Voucher de Devolucion con ID Interno : ' + inforamcionAplicarNC[i].idVoucher + ' en el carrito ID: ' + objOrden.carrito;
                                                                objRespuestaParcial = new Object();
                                                                objRespuestaParcial.codigo = 'RFAC011';
                                                                objRespuestaParcial.mensaje = mensaje;
                                                                objRespuestaN.detalle.push(objRespuestaParcial);
                                                                arrayRespuesta.push(objRespuestaN);
                                                                /*log.error('RFAC011', mensaje);
                                                                return JSON.stringify(objRespuesta);*/
                                                                break;
                                                            }
                                                        } else {
                                                            objRespuestaN.error = true;
                                                            var mensaje = 'El Importe Pendiente de Pago de la Factura con ID Interno : ' + objRespuesta.idFactura + ' para el Voucher de Devolucion con ID Interno : ' + inforamcionAplicarNC[i].idVoucher + ' en el carrito ID: ' + objOrden.carrito + ' Supera el Importe A Aplicar del Voucher';
                                                            objRespuestaParcial = new Object();
                                                            objRespuestaParcial.codigo = 'RFAC014';
                                                            objRespuestaParcial.mensaje = mensaje;
                                                            objRespuestaN.detalle.push(objRespuestaParcial);
                                                            arrayRespuesta.push(objRespuestaN);
                                                            /*log.error('RFAC014', mensaje);
                                                            return JSON.stringify(objRespuesta);*/
                                                            break;
                                                        }

                                                    } else {
                                                        objRespuestaN.error = true;
                                                        var mensaje = 'La Nota de Credito con ID Interno : ' + inforamcionAplicarNC[i].notaCredito + ' No posee saldo para Aplicar para el Voucher de Devolucion con ID Interno : ' + inforamcionAplicarNC[i].idVoucher + ' en el carrito ID: ' + objOrden.carrito;
                                                        objRespuestaParcial = new Object();
                                                        objRespuestaParcial.codigo = 'RFAC015';
                                                        objRespuestaParcial.mensaje = mensaje;
                                                        objRespuestaN.detalle.push(objRespuestaParcial);
                                                        arrayRespuesta.push(objRespuestaN);
                                                        /*log.error('RFAC015', mensaje);
                                                        return JSON.stringify(objRespuesta);*/
                                                        break;
                                                    }

                                                } else {
                                                    objRespuestaN.error = true;
                                                    var mensaje = 'Error Apicando la Nota de Credito con ID Interno : ' + inforamcionAplicarNC[i].notaCredito + ' en la Factura con ID Interno : ' + objRespuesta.idFactura + ' para el Voucher de Devolucion con ID Interno : ' + inforamcionAplicarNC[i].idVoucher + ' en el carrito ID: ' + objOrden.carrito - ' - Error : ';
                                                    if (cliente != clienteFact) {
                                                        mensaje = mensaje + ' Cliente de la Nota de Credito Diferente al Cliente de la Factura / ';
                                                    }
                                                    if (moneda != monedaFact) {
                                                        mensaje = mensaje + ' Moneda de la Nota de Credito Diferente a la Moneda de la Factura / ';
                                                    }

                                                    objRespuestaParcial = new Object();
                                                    objRespuestaParcial.codigo = 'RFAC016';
                                                    objRespuestaParcial.mensaje = mensaje;
                                                    objRespuestaN.detalle.push(objRespuestaParcial);
                                                    arrayRespuesta.push(objRespuestaN);
                                                    /*log.error('RFAC016', mensaje);
                                                    return JSON.stringify(objRespuesta);*/
                                                    break;
                                                }


                                            } else {
                                                // Error
                                                objRespuestaN.error = true;
                                                var mensaje = 'Error Cargando la Nota de Credito con ID Interno : ' + inforamcionAplicarNC[i].notaCredito + ' para el Voucher de Devolucion con ID Interno : ' + inforamcionAplicarNC[i].idVoucher + ' en el carrito ID: ' + objOrden.carrito;
                                                objRespuestaParcial = new Object();
                                                objRespuestaParcial.codigo = 'RFAC010';
                                                objRespuestaParcial.mensaje = mensaje;
                                                objRespuestaN.detalle.push(objRespuestaParcial);
                                                arrayRespuesta.push(objRespuestaN);
                                                /*log.error('RFAC010', mensaje);
                                                return JSON.stringify(objRespuesta);*/
                                                break;
                                            }

                                        } else { //AQUI ELSE PARA APLICACION DE DEPOSITO

                                            var idDepositoVoucher = inforamcionAplicarNC[i].notaCredito;
                                            var error = false;

                                            var recPago = record.create({
                                                type: 'customerPayment',
                                                isDynamic: true
                                            });

                                            recPago.setValue({
                                                fieldId: 'customer',
                                                value: clienteFact
                                            });

                                            recPago.setValue({
                                                fieldId: 'currency',
                                                value: monedaFact
                                            });

                                            recPago.setValue({
                                                fieldId: 'aracct',
                                                value: cuentaFact
                                            });

                                            var cantidadLineasDeposito = recPago.getLineCount({
                                                sublistId: 'deposit'
                                            });

                                            var cantidadLineasFacturas = recPago.getLineCount({
                                                sublistId: 'apply'
                                            });



                                            for (var ff = 0; ff < cantidadLineasFacturas; ff++) {

                                                var IDComprobanteFact = recPago.getSublistValue({
                                                    sublistId: 'apply',
                                                    fieldId: 'doc',
                                                    line: ff
                                                });

                                                var importeRestanteFact = recPago.getSublistValue({
                                                    sublistId: 'apply',
                                                    fieldId: 'due',
                                                    line: ff
                                                });

                                                log.debug('aplicar deposit', 'IDComprobanteFact: ' + IDComprobanteFact);
                                                log.debug('aplicar deposti', 'objRespuestaN.idFactura: ' + objRespuestaN.idFactura);

                                                if (IDComprobanteFact == objRespuestaN.idFactura) {

                                                    if (parseFloat(inforamcionAplicarNC[i].importeAplicar) > parseFloat(importeRestanteFact)) {
                                                        inforamcionAplicarNC[i].importeAplicar = parseFloat(importeRestanteFact);
                                                    }

                                                    recPago.selectLine({
                                                        sublistId: 'apply',
                                                        line: ff
                                                    });

                                                    recPago.setCurrentSublistValue({
                                                        sublistId: 'apply',
                                                        fieldId: 'apply',
                                                        value: true
                                                    });

                                                    recPago.setCurrentSublistValue({
                                                        sublistId: 'apply',
                                                        fieldId: 'amount',
                                                        value: parseFloat(inforamcionAplicarNC[i].importeAplicar, 10).toFixed(2).toString(),
                                                        ignoreFieldChange: false
                                                    });

                                                    recPago.commitLine({
                                                        sublistId: 'apply'
                                                    });

                                                    break;
                                                }
                                            } // END FOR


                                            for (var dd = 0; dd < cantidadLineasDeposito; dd++) {

                                                var IDComprobante = recPago.getSublistValue({
                                                    sublistId: 'deposit',
                                                    fieldId: 'doc',
                                                    line: dd
                                                });

                                                var remaining = recPago.getSublistValue({
                                                    sublistId: 'deposit',
                                                    fieldId: 'remaining',
                                                    line: dd
                                                });
                                                log.debug('aplicar deposit', 'IDComprobante: ' + IDComprobante);
                                                log.debug('aplicar deposti', 'idDepositoVoucher: ' + idDepositoVoucher);

                                                if (IDComprobante == idDepositoVoucher) {

                                                    log.debug('aplicar deposti', 'inforamcionAplicarNC[i].importeAplicar: ' + inforamcionAplicarNC[i].importeAplicar);
                                                    log.debug('aplicar deposti', 'remaining: ' + remaining);

                                                    if (parseFloat(inforamcionAplicarNC[i].importeAplicar) > parseFloat(remaining)) {

                                                        log.debug('aplicar deposti', 'linea 9567');

                                                        objRespuestaN.error = true;
                                                        var mensaje = 'La Depósito con ID Interno : ' + inforamcionAplicarNC[i].notaCredito + ' No posee saldo para Aplicar para el Voucher de Devolucion con ID Interno : ' + inforamcionAplicarNC[i].idVoucher + ' en el carrito ID: ' + objOrden.carrito;
                                                        objRespuestaParcial = new Object();
                                                        objRespuestaParcial.codigo = 'RFAC015';
                                                        objRespuestaParcial.mensaje = mensaje;
                                                        objRespuestaN.detalle.push(objRespuestaParcial);
                                                        arrayRespuesta.push(objRespuestaN);
                                                        break;
                                                    }

                                                    recPago.selectLine({
                                                        sublistId: 'deposit',
                                                        line: dd
                                                    });


                                                    recPago.setCurrentSublistValue({
                                                        sublistId: 'deposit',
                                                        fieldId: 'apply',
                                                        value: true,
                                                        ignoreFieldChange: false
                                                    });

                                                    recPago.setCurrentSublistValue({
                                                        sublistId: 'deposit',
                                                        fieldId: 'amount',
                                                        value: parseFloat(inforamcionAplicarNC[i].importeAplicar, 10).toFixed(2).toString(),
                                                        ignoreFieldChange: false
                                                    });

                                                    recPago.commitLine({
                                                        sublistId: 'deposit'
                                                    });

                                                    log.debug('aplicar deposti', 'linea 9603');

                                                    break;
                                                }
                                            } // END FOR

                                            if (!objRespuestaN.error) {

                                                try {
                                                    var recordIdPago = recPago.save({
                                                        enableSourcing: true,
                                                        ignoreMandatoryFields: false
                                                    });
                                                } catch (excepcionSaveNC) {
                                                    objRespuestaN.error = true;
                                                    var mensaje = 'Excepcion Asociando el Deposito con ID Interno : ' + inforamcionAplicarNC[i].notaCredito + ' a la Factura con ID Interno : ' + objRespuesta.idFactura + ' para el Voucher de Devolucion con ID Interno : ' + inforamcionAplicarNC[i].idVoucher + ' en el carrito ID: ' + objOrden.carrito + ' - Excepcion : ' + excepcionSaveNC.message.toString();
                                                    objRespuestaParcial = new Object();
                                                    objRespuestaParcial.codigo = 'RFAC013';
                                                    objRespuestaParcial.mensaje = mensaje;
                                                    objRespuestaN.detalle.push(objRespuestaParcial);
                                                    /*log.error('RFAC013', mensaje);
                                                    return JSON.stringify(objRespuesta);*/
                                                    arrayRespuesta.push(objRespuestaN);
                                                    break;
                                                }
                                            }


                                        }

                                    } else {
                                        // Error
                                        objRespuestaN.error = true;
                                        var mensaje = 'No se recibio la siguiente informacion del Voucher de Devolucion con ID Interno : ' + inforamcionAplicarNC[i].idVoucher + ' en el carrito ID: ' + objOrden.carrito;
                                        if (utilities.isEmpty(inforamcionAplicarNC[i].notaCredito)) {
                                            mensaje = mensaje + ' Nota de Credito Asociada al Voucher / ';
                                        }
                                        if (utilities.isEmpty(inforamcionAplicarNC[i].importeAplicar) || (!utilities.isEmpty(inforamcionAplicarNC[i].importeAplicar) && parseFloat(inforamcionAplicarNC[i].importeAplicar, 10) <= 0.00)) {
                                            mensaje = mensaje + ' Importe Asociado al Voucher Invalido / ';
                                        }
                                        objRespuestaParcial = new Object();
                                        objRespuestaParcial.codigo = 'RFAC009';
                                        objRespuestaParcial.mensaje = mensaje;
                                        objRespuestaN.detalle.push(objRespuestaParcial);
                                        arrayRespuesta.push(objRespuestaN);
                                        /*log.error('RFAC009', mensaje);
                                        return JSON.stringify(objRespuesta);*/
                                        break;
                                    }
                                }

                                if (objRespuestaN.error) {
                                    continue;
                                }
                            }
                        }

                        // INICIO - Consultar Subsidiaria Facturacion Electronica
                        var subsidiaria = '';

                        var searchConfig = utilities.searchSaved('customsearch_3k_config_sub_fact');

                        if (!utilities.isEmpty(searchConfig) && !searchConfig.error) {
                            if (!utilities.isEmpty(searchConfig.objRsponseFunction.result) && searchConfig.objRsponseFunction.result.length > 0) {
                                subsidiaria = searchConfig.objRsponseFunction.result[0].getValue({
                                    name: searchConfig.objRsponseFunction.search.columns[1]
                                });

                                if (utilities.isEmpty(subsidiaria)) {
                                    objRespuestaN.error = true;
                                    var mensaje = 'No se encuentra configurada la siguiente informacion del panel de configuracion de Subsidiaria Facturacion : ';
                                    if (utilities.isEmpty(subsidiaria)) {
                                        mensaje = mensaje + ' Subsidiaria / ';
                                    }

                                    objRespuestaParcial = new Object();
                                    objRespuestaParcial.codigo = 'RFAC017';
                                    objRespuestaParcial.mensaje = mensaje;
                                    objRespuestaN.detalle.push(objRespuestaParcial);
                                    /*log.error('RFAC017', mensaje);
                                    return JSON.stringify(objRespuesta);*/
                                    arrayRespuesta.push(objRespuestaN);
                                    continue;
                                }
                            } else {
                                objRespuestaN.error = true;
                                var mensaje = 'No se encuentra realizada la configuracion de Subsidiaria Facturacion : ';

                                objRespuestaParcial = new Object();
                                objRespuestaParcial.codigo = 'RFAC018';
                                objRespuestaParcial.mensaje = mensaje;
                                objRespuestaN.detalle.push(objRespuestaParcial);
                                /*log.error('RFAC018', mensaje);
                                return JSON.stringify(objRespuesta);*/
                                arrayRespuesta.push(objRespuestaN);
                                continue;
                            }
                        } else {
                            objRespuestaN.error = true;
                            var mensaje = 'Error Consultando Configuracion de Subsidiaria de Facturacion - Tipo Error : ' + searchConfig.tipoError + ' - Descripcion : ' + searchConfig.descripcion;

                            objRespuestaParcial = new Object();
                            objRespuestaParcial.codigo = 'RFAC019';
                            objRespuestaParcial.mensaje = mensaje;
                            objRespuestaN.detalle.push(objRespuestaParcial);
                            /*log.error('RFAC019', mensaje);
                            return JSON.stringify(objRespuesta);*/
                            arrayRespuesta.push(objRespuestaN);
                            continue;
                        }


                        // FIN - Consultar Subsidiaria Facturacion Electronica 
                        // FIN - Asociar Facturas A Notas de Credito


                        arrayRespuesta.push(objRespuestaN);



                    } // END FOR FACTURAS

                    if (!envioLogistico) {

                        objRespuesta.resultCae = generarCAE(arrayFacturas, subsidiaria);
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

                        /*if (objRespuesta.error) {
                            log.error('RFAC30', JSON.stringify(objRespuesta));
                            arrayRespuesta.push(objRespuesta);
                            return JSON.stringify(arrayRespuesta);
                        }*/
                    }

                } catch (e) {
                    //objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'RFAC002';
                    objRespuestaParcial.mensaje = 'function doPost: ' + e.message;
                    //objRespuesta.detalle.push(objRespuestaParcial);
                    //objRespuesta.tipoError = 'RFAC002';
                    //objRespuesta.descripcion = 'function doPost: ' + e.message;
                    log.error('RFAC002', 'funtion doPost: ' + e.message + ' request:' + JSON.stringify(objOrden));

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

                //return JSON.stringify(arrayRespuesta);

            } else {
                objRespuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'RFAC001';
                objRespuestaParcial.mensaje = 'No se recibio parametro con informacion a realizar';
                objRespuesta.detalle.push(objRespuestaParcial);
                //objRespuesta.tipoError = 'RFAC001';
                //objRespuesta.descripcion = 'No se recibio parametro con informacion a realizar';
                log.error('RFAC001', 'No se recibio parametro con informacion a realizar');
                arrayRespuesta.push(objRespuesta);
                //return JSON.stringify(arrayRespuesta);
            }
            //arrayRespuesta.push(objRespuesta);
            return JSON.stringify(arrayRespuesta);
        }

        function consultarRemito(informacion) {
            var objetoRespuesta = new Object();
            objetoRespuesta.error = false;
            objetoRespuesta.mensaje = new Object();
            objetoRespuesta.informacionComandas = new Array();

            try {
                if (!utilities.isEmpty(informacion) && !utilities.isEmpty(informacion.comandas) && informacion.comandas.length > 0) {
                    for (var j = 0; j < informacion.comandas.length && objetoRespuesta.error == false; j++) {
                        var infoCarrito = new Object();
                        infoCarrito.existeRemito = false;
                        infoCarrito.ordenesPickeadasTotal = false;
                        infoCarrito.informacionRemito = new Object();
                        infoCarrito.informacionRemito.idInterno = '';
                        infoCarrito.informacionRemito.ordenesPickeadas = new Array();
                        infoCarrito.informacionRemito.ordenesNoPickeadas = new Array();

                        if (!utilities.isEmpty(informacion.comandas[j].idCarrito) && !utilities.isEmpty(informacion.comandas[j].idOrdenes) && informacion.comandas[j].idOrdenes.length > 0) {

                            var informacionOrdenes = new Array();

                            // INICIO - Obtener Informacion Remito
                            var filtrosRemito = new Array();

                            var filtroCarrito = new Object();
                            filtroCarrito.name = 'createdfrom';
                            filtroCarrito.operator = 'IS';
                            filtroCarrito.values = informacion.comandas[j].idCarrito;
                            filtrosRemito.push(filtroCarrito);

                            var searchRemito = utilities.searchSavedPro('customsearch_3k_cons_remitos', filtrosRemito);

                            if (!utilities.isEmpty(searchRemito) && searchRemito.error == false) {
                                if (!utilities.isEmpty(searchRemito.objRsponseFunction.result) && searchRemito.objRsponseFunction.result.length > 0) {

                                    infoCarrito.existeRemito = true;

                                    var resultSet = searchRemito.objRsponseFunction.result;
                                    var resultSearch = searchRemito.objRsponseFunction.search;

                                    infoCarrito.informacionRemito.idInterno = resultSet[0].getValue({
                                        name: resultSearch.columns[0]
                                    });

                                    // INICIO Obtener Ordenes Pickeadas
                                    var filtrosOrdenes = new Array();

                                    var filtroCarrito = new Object();
                                    filtroCarrito.name = 'internalid';
                                    filtroCarrito.operator = 'IS';
                                    filtroCarrito.values = informacion.comandas[j].idCarrito;
                                    filtrosOrdenes.push(filtroCarrito);

                                    var filtroOrden = new Object();
                                    filtroOrden.name = 'custcol_3k_id_orden';
                                    filtroOrden.operator = 'ANYOF';
                                    filtroOrden.values = informacion.comandas[j].idOrdenes;
                                    filtrosOrdenes.push(filtroOrden);

                                    var searchOrdenes = utilities.searchSavedPro('customsearch_3k_cons_ord_pickeadas', filtrosOrdenes);

                                    if (!utilities.isEmpty(searchOrdenes) && searchOrdenes.error == false) {
                                        if (!utilities.isEmpty(searchOrdenes.objRsponseFunction.result) && searchOrdenes.objRsponseFunction.result.length > 0) {

                                            var resultSet = searchOrdenes.objRsponseFunction.result;
                                            var resultSearch = searchOrdenes.objRsponseFunction.search;

                                            for (var i = 0; i < resultSet.length; i++) {

                                                var infoOrden = new Object();
                                                infoOrden.idInterno = resultSet[i].getValue({
                                                    name: resultSearch.columns[0]
                                                });
                                                infoOrden.idOrden = resultSet[i].getValue({
                                                    name: resultSearch.columns[1]
                                                });
                                                infoOrden.idArticulo = resultSet[i].getValue({
                                                    name: resultSearch.columns[2]
                                                });
                                                infoOrden.pickeada = resultSet[i].getValue({
                                                    name: resultSearch.columns[3]
                                                });

                                                informacionOrdenes.push(infoOrden);
                                            }

                                            var ordenSinPickear = false;

                                            for (var i = 0; i < informacion.comandas[j].idOrdenes.length; i++) {

                                                var objOrden = informacionOrdenes.filter(function (obj) {
                                                    return (obj.idOrden == informacion.comandas[j].idOrdenes[i]);
                                                });

                                                if (!utilities.isEmpty(objOrden) && objOrden.length > 0 && objOrden[0].pickeada == 'S') {
                                                    infoCarrito.informacionRemito.ordenesPickeadas.push(informacion.comandas[j].idOrdenes[i]);
                                                    if (ordenSinPickear == false) {
                                                        infoCarrito.ordenesPickeadasTotal = true;
                                                    }
                                                } else {
                                                    ordenSinPickear = true;
                                                    infoCarrito.ordenesPickeadasTotal = false;
                                                    infoCarrito.informacionRemito.ordenesNoPickeadas.push(informacion.comandas[j].idOrdenes[i]);
                                                }
                                            }

                                            // FIN Obtener Ordenes Pickeadas

                                        } else {
                                            infoCarrito.ordenesPickeadasTotal = false;

                                            for (var i = 0; i < informacion.comandas[j].idOrdenes.length; i++) {
                                                infoCarrito.informacionRemito.ordenesNoPickeadas.push(informacion.comandas[j].idOrdenes[i]);
                                            }
                                        }
                                    } else {
                                        if (utilities.isEmpty(searchOrdenes)) {
                                            objetoRespuesta.error = true;
                                            objetoRespuesta.mensaje.tipo = 'RCOM033';
                                            objetoRespuesta.mensaje.descripcion = 'Error Consultando Ordenes Pickeadas para Orden de Venta con ID Interno : ' + informacion.comandas[j].idCarrito + ' - Error : No se recibio Respuesta del Proceso de Busqueda de las Ordenes Asociados';
                                        } else {
                                            objetoRespuesta.error = true;
                                            objetoRespuesta.mensaje.tipo = 'RCOM034';
                                            objetoRespuesta.mensaje.descripcion = 'Error Consultando Ordenes Pickeadas para Orden de Venta con ID Interno : ' + informacion.comandas[j].idCarrito + ' Error Consultando Ordenes Asociadas - Error : ' + searchOrdenes.tipoError + ' - Descripcion : ' + searchOrdenes.descripcion;
                                        }
                                    }


                                } else {
                                    infoCarrito.existeRemito = false;
                                    infoCarrito.ordenesPickeadasTotal = false;

                                    for (var i = 0; i < informacion.comandas[j].idOrdenes.length; i++) {
                                        infoCarrito.informacionRemito.ordenesNoPickeadas.push(informacion.comandas[j].idOrdenes[i]);
                                    }
                                }
                            } else {
                                if (utilities.isEmpty(searchRemito)) {
                                    objetoRespuesta.error = true;
                                    objetoRespuesta.mensaje.tipo = 'RCOM008';
                                    objetoRespuesta.mensaje.descripcion = 'Error Consultando Remito para Orden de Venta con ID Interno : ' + informacion.comandas[j].idCarrito + ' - Error : No se recibio Respuesta del Proceso de Busqueda de los Remitos Asociados';
                                } else {
                                    objetoRespuesta.error = true;
                                    objetoRespuesta.mensaje.tipo = 'RCOM009';
                                    objetoRespuesta.mensaje.descripcion = 'Error Consultando Remito para Orden de Venta con ID Interno : ' + informacion.comandas[j].idCarrito + ' Error Consultando el Remito Asociado - Error : ' + searchRemito.tipoError + ' - Descripcion : ' + searchRemito.descripcion;
                                }
                            }

                            // FIN - Obtener Informacion Remito

                        } else {
                            var mensaje = 'No se recibio la siguiente informacion requerida para realizar la consulta Remito : ';
                            if (utilities.isEmpty(informacion.comandas[j].idCarrito)) {
                                mensaje = mensaje + " ID Interno del Carrito / ";
                            }
                            if (utilities.isEmpty(informacion.comandas[j].idOrdenes)) {
                                mensaje = mensaje + " ID Interno de las Ordenes / ";
                            }
                            if (!utilities.isEmpty(informacion.comandas[j].idOrdenes) && informacion.comandas[j].idOrdenes.length <= 0) {
                                mensaje = mensaje + " ID Interno de las Ordenes / ";
                            }

                            objetoRespuesta.error = true;
                            objetoRespuesta.mensaje.tipo = "RCOM010";
                            objetoRespuesta.mensaje.descripcion = mensaje;
                            log.error('Funcionalidades Comandas - Consulta Remito', mensaje);
                        }
                        objetoRespuesta.informacionComandas.push(infoCarrito);
                    }
                } else {
                    objetoRespuesta.error = true;
                    objetoRespuesta.mensaje.tipo = "RCOM011";
                    objetoRespuesta.mensaje.descripcion = "No se recibio parametro con informacion a realizar";
                }
            } catch (excepcionConsulta) {
                log.error('Funcionalidades Comandas - Consulta Remito', 'Excepcion Proceso Consulta de Remito - Excepcion : ' + excepcionConsulta.message);
                objetoRespuesta.error = true;
                objetoRespuesta.mensaje.tipo = "RCOM012";
                objetoRespuesta.mensaje.descripcion = "Excepcion en Proceso de Consulta de Remito - Excepcion : " + excepcionConsulta.message;
            }
            return objetoRespuesta;
        }

        function eliminarRegistrosDependientes(informacion, recordID) {
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.detalle = new Array();

            var idCobranza = recordID;

            log.audit('Generacion Cobranza', 'INICIO ELIMINACION REGISTROS DEPENDIENTES');

            if (!utilities.isEmpty(informacion)) {

                try {

                    // INICIO - Anular Registro CONCILIACION IMPACTO
                    var idRegistroConciliacionImpacto = informacion.idConciliacionImpacto;
                    if (!utilities.isEmpty(idRegistroConciliacionImpacto)) {
                        log.debug('Eliminar Cobranza', 'ID Registro Conciliacion de Impacto A Anular : ' + idRegistroConciliacionImpacto);
                        var voidConciliacionImpactoId = '';
                        try {
                            voidConciliacionImpactoId = transaction.void({
                                type: 'customtransaction_3k_conc_ing',
                                id: idRegistroConciliacionImpacto
                            });
                        } catch (excepcionAnularConciliacionImpacto) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SDEP027';
                            respuestaParcial.mensaje = 'Excepcion Anulando Registro de Conciliacion de Impacto para la Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionAnularConciliacionImpacto.message.toString();
                            respuesta.detalle.push(respuestaParcial);
                        }
                        if (utilities.isEmpty(voidConciliacionImpactoId)) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SDEP028';
                            respuestaParcial.mensaje = 'Error Anulando Registro de Conciliacion de Impacto para la Cobranza con ID Interno : ' + idCobranza + ' - Error : No se recibio el ID Interno del Registro de Anulacion de Conciliacion de Impacto';
                            respuesta.detalle.push(respuestaParcial);
                        } else {
                            log.debug('Eliminar Cobranza', 'ID Registro Conciliacion de Impacto Anulado : ' + idRegistroConciliacionImpacto);
                        }
                    }

                    // FIN - Anular Registro CONCILIACION IMPACTO

                    // INICIO - Anular Registro CONCILIACION
                    var idRegistroConciliacion = informacion.idConciliacion;
                    if (!utilities.isEmpty(idRegistroConciliacion)) {
                        log.debug('Eliminar Cobranza', 'ID Registro Conciliacion A Anular : ' + idRegistroConciliacion);
                        var voidConciliacionId = '';
                        try {
                            voidConciliacionId = transaction.void({
                                type: 'customtransaction_3k_conc_pagos',
                                id: idRegistroConciliacion
                            });
                        } catch (excepcionAnularConciliacion) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SDEP027';
                            respuestaParcial.mensaje = 'Excepcion Anulando Registro de Conciliacion para la Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionAnularConciliacion.message.toString();
                            respuesta.detalle.push(respuestaParcial);
                        }
                        if (utilities.isEmpty(voidConciliacionId)) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SDEP028';
                            respuestaParcial.mensaje = 'Error Anulando Registro de Conciliacion para la Cobranza con ID Interno : ' + idCobranza + ' - Error : No se recibio el ID Interno del Registro de Anulacion de Conciliacion';
                            respuesta.detalle.push(respuestaParcial);
                        } else {
                            log.debug('Eliminar Cobranza', 'ID Registro Conciliacion Anulado : ' + idRegistroConciliacion);
                        }
                    }

                    // FIN - Anular Registro CONCILIACION

                    // INICIO - Anular Registro MEDIO DE PAGO
                    var idRegistroMedioPago = informacion.idRegMedioPago;
                    if (!utilities.isEmpty(idRegistroMedioPago)) {
                        log.debug('Eliminar Cobranza', 'ID Registro Medio De Pago A Anular : ' + idRegistroMedioPago);
                        var voidMedioPagoId = '';
                        try {
                            voidMedioPagoId = transaction.void({
                                type: 'customtransaction_3k_medios_pago',
                                id: idRegistroMedioPago
                            });
                        } catch (excepcionAnularMedioPago) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SDEP024';
                            respuestaParcial.mensaje = 'Excepcion Anulando Registro de Medio de Pago para la Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionAnularMedioPago.message.toString();
                            respuesta.detalle.push(respuestaParcial);
                        }
                        if (utilities.isEmpty(voidMedioPagoId)) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SDEP025';
                            respuestaParcial.mensaje = 'Error Anulando Registro de Medio De Pago para la Cobranza con ID Interno : ' + idCobranza + ' - Error : No se recibio el ID Interno del Registro de Anulacion de Medio De Pago';
                            respuesta.detalle.push(respuestaParcial);
                        } else {
                            log.debug('Eliminar Cobranza', 'ID Registro Medio De Pago Anulado : ' + idRegistroMedioPago);
                        }
                    }

                    // FIN - Anular Registro MEDIO DE PAGO

                    // INICIO ELIMINAR CUPONES
                    if (!utilities.isEmpty(informacion.cupones) && informacion.cupones.length > 0) {
                        for (var i = 0; i < informacion.cupones.length; i++) {
                            if (!utilities.isEmpty(informacion.cupones[i].informacionCupones) && informacion.cupones[i].informacionCupones.length > 0) {
                                for (var j = 0; j < informacion.cupones[i].informacionCupones.length; j++) {
                                    if (!utilities.isEmpty(informacion.cupones[i].informacionCupones[j].idInterno)) {
                                        try {
                                            var objRecordCupon = record.delete({
                                                type: 'customrecord_3k_cupones',
                                                id: informacion.cupones[i].informacionCupones[j].idInterno,
                                            });
                                        } catch (excepcionEliminarCupon) {
                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'RDEP047';
                                            respuestaParcial.mensaje = 'Excepcion Eliminando Cupon con ID Interno : ' + informacion.cupones[i].informacionCupones[j].idCupon + ' - Excepcion : ' + excepcionEliminarCupon.message.toString();
                                            respuesta.detalle.push(respuestaParcial);
                                            log.error('Generacion Cobranza', respuestaParcial.mensaje);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // FIN ELIMINAR CUPONES

                    // INICIO ELIMINAR DEPOSITO
                    if (!utilities.isEmpty(idCobranza)) {
                        try {
                            var objRecordDeposito = record.delete({
                                type: record.Type.CUSTOMER_DEPOSIT,
                                id: idCobranza,
                            });
                        } catch (excepcionEliminarCobranza) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'RDEP048';
                            respuestaParcial.mensaje = 'Excepcion Eliminando Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionEliminarCobranza.message.toString();
                            respuesta.detalle.push(respuestaParcial);
                            log.error('Generacion Cobranza', respuestaParcial.mensaje);
                        }

                    }
                    // FIN ELIMINAR DEPOSITO


                    // FIN - Anular Custom Transactions

                } catch (excepcionGeneral) {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SDEP021';
                    respuestaParcial.mensaje = 'Excepcion Eliminando Cobranza Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionGeneral.message.toString();
                    respuesta.detalle.push(respuestaParcial);

                }

            } else {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'RDEP046';
                respuestaParcial.mensaje = 'Error Eliminando Registros Asociados a la Cobranza - Error : No se recibio informacion de registros a eliminar';
                respuesta.detalle.push(respuestaParcial);
                log.error('Generacion Cobranza', 'Error Eliminando Registros Asociados a la Cobranza - Error : No se recibio informacion de registros a eliminar');
            }

            log.audit('Generacion Cobranza', 'FIN ELIMINACION REGISTROS DEPENDIENTES');


            return respuesta;
        }

        function generarAjusteRedondeo(idOV, registro) {
            var objRespuesta = new Object();
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();
            objRespuesta.registro = null;
            objRespuesta.importeTotalVouchers = 0.00;

            try {

                var carritoCerrado = false;

                if (!utilities.isEmpty(idOV) || !utilities.isEmpty(registro)) {
                    if (!utilities.isEmpty(idOV)) {
                        var objRecord = record.load({
                            type: record.Type.SALES_ORDER,
                            id: idOV,
                            isDynamic: true,
                        });


                    } else {
                        var objRecord = registro;
                    }

                    objRespuesta.importeTotalVouchers = objRecord.getValue({
                        fieldId: 'custbody_3k_imp_voucher_dev_aplic_ov'
                    });

                    var estadoCarrito = objRecord.getValue({
                        fieldId: 'statusRef'
                    });

                    if (!utilities.isEmpty(objRecord)) {

                        var importeTotalOVNS = objRecord.getValue({
                            fieldId: 'custbody_3k_importe_total'
                        });
                        var importeTotalOVWOOW = objRecord.getValue({
                            fieldId: 'custbody_3k_imp_total_woow'
                        });

                        var cantidadLineasOV = objRecord.getLineCount({
                            sublistId: 'item'
                        });

                        if (utilities.isEmpty(importeTotalOVWOOW) || isNaN(parseFloat(importeTotalOVWOOW))) {
                            importeTotalOVWOOW = 0.00;
                        }

                        if (!utilities.isEmpty(importeTotalOVNS) && !isNaN(parseFloat(importeTotalOVNS)) && !utilities.isEmpty(importeTotalOVWOOW) && !isNaN(parseFloat(importeTotalOVWOOW))) {

                            var diferenciaImporte = (parseFloat(importeTotalOVWOOW)) - parseFloat(importeTotalOVNS);
                            log.error('ajusteporRedondeo', ' diferenciaImporte: ' + diferenciaImporte);
                            var eliminoLineaRedondeo = false;
                            if (parseFloat(diferenciaImporte) != 0.00) {

                                if (cantidadLineasOV > 0) {
                                    for (var i = 0; i < cantidadLineasOV; i++) {

                                        // INICIO ELIMINAR LINEAS DE REDONDEO

                                        log.error('ajusteporRedondeo', ' i antes de delete: ' + i);
                                        log.error('ajusteporRedondeo', ' cantidadLineasOV antes de delete: ' + cantidadLineasOV);

                                        var esRedondeo = objRecord.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_3k_es_redondeo',
                                            line: i
                                        });


                                        if (esRedondeo == true) {


                                            objRecord.selectLine({
                                                sublistId: 'item',
                                                line: i
                                            });

                                            objRecord.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'rate',
                                                value: '0'
                                            });

                                            objRecord.commitLine({
                                                sublistId: 'item'
                                            });

                                            /*var importeBruto = objRecord.getSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'grossamt',
                                                line: i
                                            });

                                            diferenciaImporte += parseFloat(diferenciaImporte, 10) + parseFloat(importeBruto, 10);*/

                                            /*objRecord.removeLine({
                                                sublistId: 'item',
                                                line: i
                                            });*/

                                            //i--;
                                            //cantidadLineasOV--;

                                            eliminoLineaRedondeo = true;

                                            //break;

                                            log.error('ajusteporRedondeo', ' i despues de delete: ' + i);
                                            log.error('ajusteporRedondeo', ' cantidadLineasOV despues de delete: ' + cantidadLineasOV);
                                        }

                                        // FIN ELIMINAR LINEAS DE REDONDEO

                                    }

                                    /*if (eliminoLineaRedondeo) {

                                        objRecord.save();

                                        var objRecord = record.load({
                                            type: record.Type.SALES_ORDER,
                                            id: idOV,
                                            isDynamic: true,
                                        });
                                    }*/
                                    // INICIO AGREGAR LINEA DE REDONDEO

                                    if (eliminoLineaRedondeo) {
                                        var totalNS = objRecord.getValue({
                                            sublistId: 'item',
                                            fieldId: 'total'
                                        });

                                        var diferenciaImporte = (parseFloat(importeTotalOVWOOW)) - parseFloat(totalNS);
                                    }

                                    if (parseFloat(diferenciaImporte, 10) != 0.00) {

                                        var resultConfigAjustes = utilities.searchSavedPro('customsearch_3k_config_ajuste_redondeo');
                                        if (resultConfigAjustes.error) {
                                            return resultConfigAjustes;
                                        }

                                        var configAjustes = resultConfigAjustes.objRsponseFunction.array;

                                        if (!utilities.isEmpty(configAjustes) && configAjustes.length > 0) {

                                            var articuloAjustePositivo = configAjustes[0].custrecord_3k_configajuste_articulo_p;
                                            var articuloAjusteNegativo = configAjustes[0].custrecord_3k_configajuste_articulo_n;
                                            var topeMaximo = configAjustes[0].custrecord_3k_configajuste_tope_max;

                                            var articuloUtilizar = articuloAjusteNegativo;
                                            if (parseFloat(diferenciaImporte) > 0.00) {
                                                articuloUtilizar = articuloAjustePositivo;
                                            }

                                            if (Math.abs(diferenciaImporte) < topeMaximo) {

                                                objRecord.selectNewLine({
                                                    sublistId: 'item'
                                                });

                                                log.debug('ajusteporRedondeo', 'articuloUtilizar: ' + articuloUtilizar);

                                                objRecord.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'item',
                                                    value: articuloUtilizar
                                                });

                                                objRecord.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'quantity',
                                                    value: 1
                                                });

                                                log.debug('ajusteporRedondeo', 'diferenciaImporte: ' + diferenciaImporte);

                                                objRecord.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'rate',
                                                    value: diferenciaImporte.toFixed(2).toString()
                                                });

                                                objRecord.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'custcol_3k_es_redondeo',
                                                    value: true
                                                });

                                                objRecord.commitLine({
                                                    sublistId: 'item'
                                                });

                                                if (!utilities.isEmpty(idOV)) {

                                                    try {
                                                        /*objRespuesta.importeTotalOV = objRecord.getValue({
                                                            fieldId: 'custbody_3k_importe_total'
                                                        });*/

                                                        objRespuesta.importeTotalOV = objRecord.getValue({
                                                            fieldId: 'total'
                                                        });

                                                        log.debug('ajusteporRedondeo', 'diferenciaImporte: ' + objRespuesta.importeTotalOV);

                                                        var recordId = objRecord.save();

                                                    } catch (excepcionGrabarOV) {
                                                        objRespuesta.error = true;
                                                        objRespuestaParcial = new Object({});
                                                        objRespuestaParcial.codigo = 'SROV032';
                                                        objRespuestaParcial.mensaje = 'function crearOrdenVenta Error: Excepcion Grabando Ajuste por Redondeo - Excepcion : ' + excepcionGrabarOV.message.toString();;
                                                        objRespuesta.detalle.push(objRespuestaParcial);
                                                        log.error('SROV032', objRespuestaParcial.mensaje);
                                                    }

                                                } else {
                                                    objRespuesta.registro = registro;
                                                }

                                            } else {
                                                //error

                                                objRespuesta.error = true;
                                                objRespuestaParcial = new Object({});
                                                objRespuestaParcial.codigo = 'SROV025';
                                                objRespuestaParcial.mensaje = 'function crearOrdenVenta Error: los ajustes por redondeo es mayor al tope maximo permitido ' + topeMaximo;
                                                objRespuesta.detalle.push(objRespuestaParcial);
                                                log.error('SROV025', 'function crearOrdenVenta Error: los ajustes por redondeo es mayor al tope maximo permitido ' + topeMaximo);
                                            }
                                        } else {
                                            objRespuesta.error = true;
                                            objRespuestaParcial = new Object({});
                                            objRespuestaParcial.codigo = 'SROV026';
                                            objRespuestaParcial.mensaje = 'function crearOrdenVenta Error: No se encuentra realizada la configuracion de Articulos de Redondeo';
                                            objRespuesta.detalle.push(objRespuestaParcial);
                                            log.error('SROV026', objRespuestaParcial.mensaje);
                                        }
                                        // FIN ELIMINAR LINEAS DE REDONDEO

                                    } else {
                                        if (!utilities.isEmpty(idOV)) {

                                            try {
                                                objRespuesta.importeTotalOV = objRecord.getValue({
                                                    fieldId: 'total'
                                                });

                                                var recordId = objRecord.save({
                                                    enableSourcing: true,
                                                    ignoreMandatoryFields: false
                                                });

                                            } catch (excepcionGrabarOV) {
                                                objRespuesta.error = true;
                                                objRespuestaParcial = new Object({});
                                                objRespuestaParcial.codigo = 'SROV032';
                                                objRespuestaParcial.mensaje = 'function crearOrdenVenta Error: Excepcion Grabando Ajuste por Redondeo - Excepcion : ' + excepcionGrabarOV.message.toString();;
                                                objRespuesta.detalle.push(objRespuestaParcial);
                                                log.error('SROV032', objRespuestaParcial.mensaje);
                                            }

                                        } else {
                                            objRespuesta.registro = registro;
                                        }
                                    }
                                } else {
                                    objRespuesta.error = true;
                                    objRespuestaParcial = new Object({});
                                    objRespuestaParcial.codigo = 'SROV027';
                                    objRespuestaParcial.mensaje = 'function crearOrdenVenta Error: No se detectaron lineas en la Orden de Venta';
                                    objRespuesta.detalle.push(objRespuestaParcial);
                                    log.error('SROV027', objRespuestaParcial.mensaje);
                                }

                            } else {
                                if (!utilities.isEmpty(idOV)) {

                                    objRespuesta.importeTotalOV = objRecord.getValue({
                                        fieldId: 'total'
                                    });

                                } else {
                                    objRespuesta.registro = registro;
                                }
                            }

                        } else {
                            objRespuesta.error = true;
                            objRespuestaParcial = new Object({});
                            objRespuestaParcial.codigo = 'SROV028';
                            objRespuestaParcial.mensaje = 'function crearOrdenVenta Error: Error Obteniendo Montos Totales de la Orden de Venta';
                            objRespuesta.detalle.push(objRespuestaParcial);
                            log.error('SROV028', objRespuestaParcial.mensaje);
                        }


                    } else {
                        objRespuesta.error = true;
                        objRespuestaParcial = new Object({});
                        objRespuestaParcial.codigo = 'SROV029';
                        objRespuestaParcial.mensaje = 'function crearOrdenVenta Error: Error Cargando la Orden de Venta';
                        objRespuesta.detalle.push(objRespuestaParcial);
                        log.error('SROV029', objRespuestaParcial.mensaje);
                    }

                } else {
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object({});
                    objRespuestaParcial.codigo = 'SROV030';
                    objRespuestaParcial.mensaje = 'function crearOrdenVenta Error: No se recibio registro de Orden de Venta';
                    objRespuesta.detalle.push(objRespuestaParcial);
                    log.error('SROV030', objRespuestaParcial.mensaje);
                }

            } catch (excepcion) {
                objRespuesta.error = true;
                objRespuestaParcial = new Object({});
                objRespuestaParcial.codigo = 'SROV031';
                objRespuestaParcial.mensaje = 'function crearOrdenVenta Error: Excepcion Generando Ajuste por Redondeo - Excepcion : ' + excepcion.message.toString();;
                objRespuesta.detalle.push(objRespuestaParcial);
                log.error('SROV031', objRespuestaParcial.mensaje);
            }

            return objRespuesta;
        }

        function generarFacturaTravel(request, envioEmail, envioLogistico) {
            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();
            objRespuesta.idFactura = '';
            objRespuesta.carrito = '';
            var arrayRespuesta = new Array();
            var arrayFacturas = new Array();

            envioEmail = typeof envioEmail !== 'undefined' ? envioEmail : false;
            envioLogistico = typeof envioLogistico !== 'undefined' ? envioLogistico : false;

            var inforamcionAplicarNC = new Array();

            if (!utilities.isEmpty(request)) {
                try {
                    log.debug('generarFacturaTravel', 'INICIO Proceso');

                    var informacion = JSON.parse(request);

                    log.debug('generarFacturaTravel', 'informacion: ' + JSON.stringify(informacion));
                    log.debug('generarFacturaTravel', 'informacion.length: ' + informacion.length);
                    //var array

                    for (var i = 0; i < informacion.length; i++) {

                        var objOrden = new Object({});
                        //log.debug('generarFacturaTravel', 'informacion posicion i: ' + JSON.stringify(informacion[i]));
                        objOrden = informacion[i];

                        var objRespuestaN = new Object({});
                        objRespuestaN.error = false;
                        objRespuestaN.detalle = new Array();
                        objRespuestaN.idFactura = '';
                        objRespuestaN.carrito = objOrden.carrito;

                        /*var objFieldLookUpDireccion = search.lookupFields({
                            type: search.Type.SALES_ORDER,
                            id: objOrden.carrito,
                            columns: [
                                'exchangerate'
                            ]
                        });*/

                        //var tipoCambioOV = objFieldLookUpDireccion.exchangerate;

                        var objRecord = record.transform({
                            fromType: record.Type.SALES_ORDER,
                            fromId: objOrden.carrito,
                            toType: record.Type.INVOICE,
                            isDynamic: true,
                        });

                        var facturaCompleta = objOrden.facturaCompleta;
                        var fechaRemito = objOrden.fechaRemito;

                        /*objRecord.setValue({
                            fieldId: 'exchangerate',
                            value: tipoCambioOV
                        });*/

                        if (facturaCompleta == "N") {
                            var numLines = objRecord.getLineCount({
                                sublistId: 'item'
                            });

                            //Eliminada sección referente a recorrer la informacion de "ordenes"
                            //Debido a que correspondía a información de la solapa "Ordenes Detalle"
                            //la cual con Kraken, ya no se está utilizando

                            var informacionOV = new Array();
                            for (var k = 0; k < numLines; k++) {
                                var isVoucher = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_linea_voucher',
                                    line: k
                                });

                                var esRedondeo = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_es_redondeo',
                                    line: k
                                });

                                //Se agrega, para verificar si hay línea de Millas-Fidelidad
                                var esFidelidad = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_programa_fidelidad',
                                    line: k
                                });

                                //Al no estar utilizando lo del ID Orden que era con la solapa de "Ordenes Detalle"
                                //Se modifica la instrucción para eliminar las lineas de voucher, redondeo y fidelidad
                                if (isVoucher || esRedondeo || esFidelidad) {
                                    objRecord.removeLine({
                                        sublistId: 'item',
                                        line: k
                                    });
                                    k--;
                                    numLines--;
                                }

                            }


                            //Eliminada sección referente a recorrer la informacion.ordenes
                            //Debido a que correspondía a información de la solapa "Ordenes Detalle"
                            //la cual con Kraken, ya no se está utilizando

                            //Eliminada sección referente a actualizarEstadoCupon

                            //Eliminada sección referente a Ingresar linea de Voucher
                        } //else {

                        //Eliminada sección referente a cupones

                        //Eliminada sección referente a Vouchers de Devolucion
                        //}


                        // INICIO - Consultar y Grabar Unidad Indexada

                        var unidadIndexada = '';
                        var tasaMinima = '';
                        var tasaBasica = '';

                        var searchConfig = utilities.searchSaved('customsearch_3k_config_ui');

                        if (!utilities.isEmpty(searchConfig) && !searchConfig.error) {
                            if (!utilities.isEmpty(searchConfig.objRsponseFunction.result) && searchConfig.objRsponseFunction.result.length > 0) {
                                unidadIndexada = searchConfig.objRsponseFunction.result[0].getValue({
                                    name: searchConfig.objRsponseFunction.search.columns[1]
                                });
                                tasaMinima = searchConfig.objRsponseFunction.result[0].getValue({
                                    name: searchConfig.objRsponseFunction.search.columns[2]
                                });
                                tasaBasica = searchConfig.objRsponseFunction.result[0].getValue({
                                    name: searchConfig.objRsponseFunction.search.columns[3]
                                });

                                if (utilities.isEmpty(unidadIndexada) || utilities.isEmpty(tasaMinima) || utilities.isEmpty(tasaBasica)) {
                                    objRespuestaN.error = true;
                                    var mensaje = 'No se encuentra configurada la siguiente informacion del panel de configuracion de Unidad Indexada : ';
                                    if (utilities.isEmpty(unidadIndexada)) {
                                        mensaje = mensaje + ' Valor Unidad Indexada / ';
                                    }
                                    if (utilities.isEmpty(tasaMinima)) {
                                        mensaje = mensaje + ' Tasa Minima / ';
                                    }
                                    if (utilities.isEmpty(tasaBasica)) {
                                        mensaje = mensaje + ' Tasa Basica / ';
                                    }

                                    objRespuestaParcial = new Object();
                                    objRespuestaParcial.codigo = 'RFAC020';
                                    objRespuestaParcial.mensaje = mensaje;
                                    objRespuestaN.detalle.push(objRespuestaParcial);
                                    arrayRespuesta.push(objRespuestaN);
                                    continue;
                                }
                            } else {
                                objRespuestaN.error = true;
                                var mensaje = 'No se encuentra realizada la configuracion de Configuracion de Unidad Indexada : ';

                                objRespuestaParcial = new Object();
                                objRespuestaParcial.codigo = 'RFAC021';
                                objRespuestaParcial.mensaje = mensaje;
                                objRespuestaN.detalle.push(objRespuestaParcial);
                                arrayRespuesta.push(objRespuestaN);
                                continue;
                            }
                        } else {
                            objRespuestaN.error = true;
                            var mensaje = 'Error Consultando Configuracion de Unidad Indexada - Tipo Error : ' + searchConfig.tipoError + ' - Descripcion : ' + searchConfig.descripcion;

                            objRespuestaParcial = new Object();
                            objRespuestaParcial.codigo = 'RFAC022';
                            objRespuestaParcial.mensaje = mensaje;
                            objRespuestaN.detalle.push(objRespuestaParcial);
                            arrayRespuesta.push(objRespuestaN);
                            continue;
                        }

                        if (!utilities.isEmpty(unidadIndexada)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_valor_unidad_indexada',
                                value: unidadIndexada
                            });
                        }
                        if (!utilities.isEmpty(tasaMinima)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_imp_tasa_minima',
                                value: tasaMinima
                            });
                        }
                        if (!utilities.isEmpty(tasaBasica)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_imp_tasa_basica',
                                value: tasaBasica
                            });
                        }
                        // FIN - Consultar y Grabar Unidad Indexada

                        // INICIO - Grabar Informacion de Cliente Facturacion
                        if (!utilities.isEmpty(objOrden.informacionCliente) && !utilities.isEmpty(objOrden.informacionCliente.tipoDocumento)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_tipo_documento',
                                value: objOrden.informacionCliente.tipoDocumento
                            });
                        }

                        if (!utilities.isEmpty(objOrden.informacionCliente) && !utilities.isEmpty(objOrden.informacionCliente.numeroDocumento)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_nro_documento',
                                value: objOrden.informacionCliente.numeroDocumento
                            });
                        }

                        var RazonsocialCliente = '';

                        if (!utilities.isEmpty(objOrden.informacionCliente) && !utilities.isEmpty(objOrden.informacionCliente.razonSocial)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_razon_social_cliente',
                                value: objOrden.informacionCliente.razonSocial
                            });
                            RazonsocialCliente = objOrden.informacionCliente.razonSocial;

                        } else {
                            RazonsocialCliente = objRecord.getValue({
                                fieldId: 'custbody_l598_razon_social_cliente'
                            });
                        }

                        var tipodocRUT = objRecord.getValue({
                            fieldId: 'custbody_l598_es_rut'
                        });

                        var tipodocCI = objRecord.getValue({
                            fieldId: 'custbody_l598_es_ci'
                        });

                        var tipodocDOCTransaccion = objRecord.getValue({
                            fieldId: 'custbody_l598_tipo_documento'
                        });

                        var numeroDOCTransaccion = objRecord.getValue({
                            fieldId: 'custbody_l598_nro_documento'
                        });

                        var razonSocialTransaccion = objRecord.getValue({
                            fieldId: 'custbody_l598_razon_social_cliente'
                        });


                        if (utilities.isEmpty(tipodocRUT) || (!utilities.isEmpty(tipodocRUT) && tipodocRUT == false)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_trans_eticket',
                                value: true
                            });
                        }

                        //Falta configurar email en el json
                        /*if (!utilities.isEmpty(objOrden.informacionCliente) && !utilities.isEmpty(objOrden.informacionCliente.email)) {
                            objRecord.setValue({
                                fieldId: 'custbody_l598_email_cliente',
                                value: objOrden.informacionCliente.email
                            });
                        }*/


                        objRecord.setValue({
                            fieldId: 'custbody_3k_enviar_email',
                            value: envioEmail
                        });

                        //Falta configurar fechaRemito en el json
                        /*if (envioEmail) {
        
                            var fechaRemitoNS = format.parse({
                                value: fechaRemito,
                                type: format.Type.DATE
                            });
        
                            objRecord.setValue({
                                fieldId: 'trandate',
                                value: fechaRemitoNS
                            });
                        }*/

                        var fechaServidor = new Date();

                        var fechaLocalString = format.format({
                            value: fechaServidor,
                            type: format.Type.DATETIME,
                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                        });

                        var fechaLocal = format.parse({
                            value: fechaLocalString,
                            type: format.Type.DATETIME,
                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                        });

                        objRecord.setValue({
                            fieldId: 'custbody_3k_fecha_creacion',
                            value: fechaLocal
                        });


                        // FIN - Grabar Informacion de Cliente Facturacion

                        var recId = objRecord.save();
                        log.debug('generarFacturaTravel', 'idRec: ' + recId + ', carrito: ' + objOrden.carrito);
                        objRespuestaN.idFactura = recId;
                        objRespuestaN.carrito = objOrden.carrito;
                        arrayFacturas.push(recId);
                        //arrayRespuesta.push(objRespuesta);

                        if (!utilities.isEmpty(recId)) {

                            var searchConfDomicilio = utilities.searchSavedPro('customsearch_3k_conf_dom_fact');

                            if (!utilities.isEmpty(searchConfDomicilio) && searchConfDomicilio.error == false) {
                                if (!utilities.isEmpty(searchConfDomicilio.objRsponseFunction.result) && searchConfDomicilio.objRsponseFunction.result.length > 0) {

                                    var resultSet = searchConfDomicilio.objRsponseFunction.result;
                                    var resultSearch = searchConfDomicilio.objRsponseFunction.search;

                                    var direccionGenerica = resultSet[0].getValue({
                                        name: resultSearch.columns[1]
                                    });

                                    log.error('Crear Orden de Venta', 'informacion.direccionFactura: ' + informacion.direccionFactura);

                                    if (utilities.isEmpty(objOrden.informacionCliente.direccion) && !utilities.isEmpty(direccionGenerica)) {

                                        objOrden.informacionCliente.direccion = direccionGenerica;

                                    }

                                    var ciudadGenerica = resultSet[0].getValue({
                                        name: resultSearch.columns[2]
                                    });

                                    log.error('Crear Orden de Venta', 'informacion.ciudadFactura: ' + informacion.direccionFactura);

                                    if (utilities.isEmpty(objOrden.informacionCliente.ciudad) && !utilities.isEmpty(ciudadGenerica)) {

                                        objOrden.informacionCliente.ciudad = ciudadGenerica;

                                    }

                                } else {
                                    objetoRespuesta.error = true;
                                    objetoRespuesta.mensaje.tipo = 'RFAC025';
                                    objetoRespuesta.mensaje.descripcion = 'Error Consultando Domicilio Generico de Facturacion - Error : No se encontro la Configuracion Generica de Domicilio de Facturacion';
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

                            log.debug('generarFacturaTravel', 'RazonsocialCliente: ' + RazonsocialCliente + ', objOrden.informacionCliente.direccion: ' + objOrden.informacionCliente.direccion + ', objOrden.informacionCliente.ciudad: ' + objOrden.informacionCliente.ciudad);

                            var idFactActualizada = record.submitFields({
                                type: record.Type.INVOICE,
                                id: recId,
                                values: {
                                    billattention: RazonsocialCliente,
                                    billaddr1: objOrden.informacionCliente.direccion,
                                    billcity: objOrden.informacionCliente.ciudad
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });

                            log.debug('generarFacturaTravel', 'idFactActualizada: ' + idFactActualizada);

                        }

                        //Eliminada sección referente a Asociar Facturas A Notas de Credito
                        //Debido a que ese proceso se realiza con el array inforamcionAplicarNC
                        //el cual se completa con información de voucher y voucher ya no va

                        // INICIO - Consultar Subsidiaria Facturacion Electronica
                        var subsidiaria = '';

                        var searchConfig = utilities.searchSaved('customsearch_3k_config_sub_fact');

                        if (!utilities.isEmpty(searchConfig) && !searchConfig.error) {
                            if (!utilities.isEmpty(searchConfig.objRsponseFunction.result) && searchConfig.objRsponseFunction.result.length > 0) {
                                subsidiaria = searchConfig.objRsponseFunction.result[0].getValue({
                                    name: searchConfig.objRsponseFunction.search.columns[1]
                                });

                                if (utilities.isEmpty(subsidiaria)) {
                                    objRespuestaN.error = true;
                                    var mensaje = 'No se encuentra configurada la siguiente informacion del panel de configuracion de Subsidiaria Facturacion : ';
                                    if (utilities.isEmpty(subsidiaria)) {
                                        mensaje = mensaje + ' Subsidiaria / ';
                                    }

                                    objRespuestaParcial = new Object();
                                    objRespuestaParcial.codigo = 'RFAC017';
                                    objRespuestaParcial.mensaje = mensaje;
                                    objRespuestaN.detalle.push(objRespuestaParcial);
                                    /*log.error('RFAC017', mensaje);
                                    return JSON.stringify(objRespuesta);*/
                                    arrayRespuesta.push(objRespuestaN);
                                    continue;
                                }
                            } else {
                                objRespuestaN.error = true;
                                var mensaje = 'No se encuentra realizada la configuracion de Subsidiaria Facturacion : ';

                                objRespuestaParcial = new Object();
                                objRespuestaParcial.codigo = 'RFAC018';
                                objRespuestaParcial.mensaje = mensaje;
                                objRespuestaN.detalle.push(objRespuestaParcial);
                                /*log.error('RFAC018', mensaje);
                                return JSON.stringify(objRespuesta);*/
                                arrayRespuesta.push(objRespuestaN);
                                continue;
                            }
                        } else {
                            objRespuestaN.error = true;
                            var mensaje = 'Error Consultando Configuracion de Subsidiaria de Facturacion - Tipo Error : ' + searchConfig.tipoError + ' - Descripcion : ' + searchConfig.descripcion;

                            objRespuestaParcial = new Object();
                            objRespuestaParcial.codigo = 'RFAC019';
                            objRespuestaParcial.mensaje = mensaje;
                            objRespuestaN.detalle.push(objRespuestaParcial);
                            /*log.error('RFAC019', mensaje);
                            return JSON.stringify(objRespuesta);*/
                            arrayRespuesta.push(objRespuestaN);
                            continue;
                        }

                        // FIN - Consultar Subsidiaria Facturacion Electronica 

                        arrayRespuesta.push(objRespuestaN);

                    } // END FOR FACTURAS

                    if (!envioLogistico) {

                        log.debug('generarFacturaTravel', 'arrayFacturas a generar CAE:' + JSON.stringify(arrayFacturas));

                        objRespuesta.resultCae = generarCAE(arrayFacturas, subsidiaria);
                        if (objRespuesta.resultCae.error) {
                            objRespuestaParcial = new Object();
                            objRespuestaParcial.codigo = objRespuesta.resultCae.codigo;
                            objRespuestaParcial.mensaje = objRespuesta.resultCae.mensaje;

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
                    }

                    log.debug('generarFacturaTravel', 'FIN Proceso');

                } catch (e) {
                    //objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'RFAC002';
                    objRespuestaParcial.mensaje = 'function doPost: ' + e.message;
                    log.error('RFAC002', 'funtion doPost: ' + e.message + ' request:' + JSON.stringify(objOrden));

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

                    return JSON.stringify(arrayRespuesta);

                }

            } else {
                objRespuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'RFAC001';
                objRespuestaParcial.mensaje = 'No se recibio parametro con informacion a realizar';
                objRespuesta.detalle.push(objRespuestaParcial);
                log.error('RFAC001', 'No se recibio parametro con informacion a realizar');
                arrayRespuesta.push(objRespuesta);
            }
            return JSON.stringify(arrayRespuesta);
        }

        function cerrarTransaccion (idTran,sublist,tranType){

            var objRespuesta = new Object();
            objRespuesta.error = false;
            objRespuesta.mensaje = '';

            try{

                var rec = record.load({
                    type: tranType,
                    id: idTran,
                    isDynamic: true
                });

                var numLines = rec.getLineCount({sublistId: sublist});

                if(!utilities.isEmpty(numlines) && numLines > 0 ){

                    for(var i = 0; i < numlines; i++){

                        rec.selectLine({
                            sublistId: sublist,
                            line: i
                        });

                        rec.setCurrentSublistValue({
                            sublistId: sublist,
                            fieldId: 'isclosed',
                            value: true
                        })

                        rec.commitLine({sublistId: sublist});


                    }

                    rec.save();
                    return objRespuesta;

                }

            }catch(e){
                objRespuesta.error = true;
                objRespuesta.mensaje = e.message;
                return objRespuesta;
            }

        }


        return {
            beforeSubmitOV: beforeSubmitOV,
            afterSubmitOV: afterSubmitOV,
            crearOrdenVenta: crearOrdenVenta,
            generarCAE: generarCAE,
            calcularFecha: calcularFecha,
            crearDepositos: crearDepositos,
            afterSubmitDep: afterSubmitDep,
            closedLinesOV: closedLinesOV,
            consultarDiasNoLoborables: consultarDiasNoLoborables,
            generarMediosDePago: generarMediosDePago,
            generarCupones: generarCupones,
            updateLinesVouchers: updateLinesVouchers,
            calcularVolumetrico: calcularVolumetrico,
            generarFacturas: generarFacturas,
            consultarRemito: consultarRemito,
            eliminarRegistrosDependientes: eliminarRegistrosDependientes,
            generarAjusteRedondeo: generarAjusteRedondeo,
            obtenerInformacionProveedores: obtenerInformacionProveedores,
            generarFacturaTravel: generarFacturaTravel,
            cerrarTransaccion: cerrarTransaccion
        };
    });
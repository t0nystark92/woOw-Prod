/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', '3K/utilities'], function (record, search, utilities) {


    function afterSubmit(context) {
        try {

            if (context.type == 'edit') {

                var soRecord = context.newRecord;


                var soRecordOld = context.oldRecord;

                var esServicio = soRecord.getValue({
                    fieldId: 'custbody_3k_ov_servicio'
                });

                log.debug('esServicio', esServicio);

                var itemSubList = soRecord.getSublist({
                    sublistId: 'item'
                })

                log.debug('itemSubList.isChanged', itemSubList.isChanged);

                if (esServicio == true) {

                    var numLines = soRecord.getLineCount({
                        sublistId: 'item'
                    });

                    var arrayResult = utilities.searchSavedPro('customsearch_3k_estados_accionables');
                    var arregloEstados = arrayResult.objRsponseFunction.array;
                    log.debug('arregloEstados', JSON.stringify(arregloEstados));

                    var arrayULID = new Array();
                    for (var k = 0; k < numLines; k++) {

                        var ulidLine = soRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'lineuniquekey',
                            line: k
                        });

                        arrayULID.push(ulidLine);
                    }

                    log.debug('arrayULID', JSON.stringify(arrayULID));

                    var arraySearchParams = [];
                    var objParam = new Object({});
                    objParam.name = 'custbody_3k_ulid_servicios';
                    objParam.operator = 'ANY';
                    objParam.values = arrayULID;
                    arraySearchParams.push(objParam);

                    var arrayResultTran = utilities.searchSavedPro('customsearch_3k_tran_asociadoas_liq_ulid');
                    var arregloTranAsociadas = arrayResultTran.objRsponseFunction.array;

                    log.debug('arregloTranAsociadas', JSON.stringify(arregloTranAsociadas));

                    //var marcarFacturado = false;
                    var arrayLineasMarcarFacturadas = new Array();

                    for (var i = 0; i < numLines; i++) {

                        var estadoServicio = soRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_estados_servicios',
                            line: i
                        });

                        var estadoServicioOld = soRecordOld.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_estados_servicios',
                            line: i
                        });

                        log.debug('estadoServicio', estadoServicio);
                        log.debug('estadoServicioOld', estadoServicioOld);

                        if (estadoServicio != estadoServicioOld) {

                            var filterEstados = arregloEstados.filter(function (obj) {
                                return obj.custrecord_3k_accionable_estado == estadoServicio
                            })

                            log.debug('filterEstados', JSON.stringify(filterEstados));

                            if (!utilities.isEmpty(filterEstados) && filterEstados.length > 0) {

                                var clienteLiq = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_cliente_liquidacion',
                                    line: i
                                });

                                var proveedorLiq = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_proveedor_liquidacion',
                                    line: i
                                });

                                var deudaLiq = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_deuda_pagar',
                                    line: i
                                });

                                var ingresoLiq = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_importe_fact_liq',
                                    line: i
                                });

                                var ulid = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'lineuniquekey',
                                    line: i
                                });

                                var item = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    line: i
                                });

                                var quantity = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    line: i
                                });

                                var facturado = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_servicio_facturado',
                                    line: i
                                });

                                var liquidado = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_servicio_liquidado',
                                    line: i
                                });

                                log.debug('campos so', 'cliente: ' + clienteLiq + ' - proveedor: ' + proveedorLiq + ' - deuda: ' + deudaLiq + ' - ingreso: ' + ingresoLiq + ' - item: ' + item);

                                for (var j = 0; j < filterEstados.length; j++) {

                                    var accion = filterEstados[j].custrecord_3k_accionable_accion;
                                    var transform = filterEstados[j].custrecord_3k_accionable_transform;
                                    var clienteGenerico = filterEstados[j].custrecord_3k_accionable_cliente;
                                    var fromrt = filterEstados[j].custrecord_3k_accionable_fromrt;
                                    var devolucion = filterEstados[j].custrecord_3k_accionable_devolucion;
                                    var unredeem = filterEstados[j].custrecord_3k_accionable_unredeem;

                                    log.debug('accion', accion);
                                    log.debug('transform', transform);
                                    log.debug('clienteGenerico', clienteGenerico);
                                    log.debug('fromrt', fromrt);
                                    log.debug('devolucion', devolucion);




                                    if (devolucion == false && facturado == false) {

                                        //marcarFacturado = true;

                                        if (transform == true) {

                                            var factComision = record.transform({
                                                fromType: fromrt.toString(),
                                                fromId: soRecord.id,
                                                toType: accion.toString(),
                                                isDynamic: true
                                            });

                                            factComision.setValue({
                                                fieldId: 'custbody_3k_ulid_servicios',
                                                value: ulid
                                            });

                                            if (!utilities.isEmpty(clienteGenerico)) {

                                                factComision.setValue({
                                                    fieldId: 'entity',
                                                    value: clienteGenerico
                                                });
                                            } else {
                                                factComision.setValue({
                                                    fieldId: 'entity',
                                                    value: clienteLiq
                                                });
                                            }



                                            var numLinesFact = factComision.getLineCount({
                                                sublistId: 'item'
                                            });

                                            for (var l = 0; l < numLinesFact; l++) {

                                                if (i == l) {

                                                    if (unredeem == false) {

                                                        factComision.selectLine({
                                                            sublistId: 'item',
                                                            line: l
                                                        });

                                                        factComision.setCurrentSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'grossamt',
                                                            value: parseFloat(ingresoLiq).toFixed(2)
                                                        });

                                                        factComision.commitLine({
                                                            sublistId: 'item'
                                                        });
                                                    }

                                                } else {

                                                    factComision.removeLine({
                                                        sublistId: 'item',
                                                        line: l
                                                    });

                                                    numLinesFact--;

                                                }

                                            }

                                            factComision.save();



                                        } else {

                                            factCompra = record.create({
                                                type: accion.toString(),
                                                isDynamic: true
                                            });

                                            factCompra.setValue({
                                                fieldId: 'entity',
                                                value: proveedorLiq
                                            })

                                            factCompra.setValue({
                                                fieldId: 'custbody_3k_ulid_servicios',
                                                value: ulid
                                            });

                                            factCompra.selectNewLine({
                                                sublistId: 'item'
                                            });

                                            factCompra.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'item',
                                                value: item
                                            });

                                            factCompra.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'quantity',
                                                value: quantity
                                            });

                                            factCompra.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'grossamt',
                                                value: parseFloat(deudaLiq).toFixed(2)
                                            });

                                            factCompra.commitLine({
                                                sublistId: 'item'
                                            });

                                            factCompra.save();



                                        }

                                        if (j == (filterEstados.length - 1)) {

                                            //marcarFacturado = true;
                                            arrayLineasMarcarFacturadas.push(i);


                                        }

                                    } else {

                                        if (transform == true) {

                                            var filterTranAsociada = arregloTranAsociadas.filter(function (obj) {
                                                return obj.custbody_3k_ulid_servicios == ulid && obj.recordtype == fromrt && utilities.isEmpty(obj.applyingtransaction)
                                            });

                                            log.debug('filterTranAsociada', JSON.stringify(filterTranAsociada))

                                            if (!utilities.isEmpty(filterTranAsociada) && filterTranAsociada.length > 0) {



                                                var devRecord = record.transform({
                                                    fromType: fromrt.toString(),
                                                    fromId: filterTranAsociada[0].internalid,
                                                    toType: accion.toString(),
                                                    isDynamic: true
                                                });

                                                devRecord.save();


                                            }



                                        }

                                    }

                                }

                                if (arrayLineasMarcarFacturadas.length > 0) {

                                    log.debug('entro facturar', 'entro');

                                    var soRecordFinal = record.load({
                                        type: context.newRecord.type,
                                        id: context.newRecord.id,
                                        isDynamic: true
                                    });

                                    for (var x = 0; x < arrayLineasMarcarFacturadas.length; x++) {

                                        soRecordFinal.selectLine({
                                            sublistId: 'item',
                                            line: arrayLineasMarcarFacturadas[x]
                                        });

                                        soRecordFinal.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_3k_servicio_facturado',
                                            value: true
                                        });

                                        soRecordFinal.commitLine({
                                            sublistId: 'item'
                                        });

                                    }



                                    soRecordFinal.save();

                                }



                            }

                        }







                    }



                }


            }


        } catch (error) {
            log.error("Error afertSubmit Catch", error.message);
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});
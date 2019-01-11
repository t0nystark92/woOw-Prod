/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/format', '3K/utilities'], function (record, search, format, utilities) {


    function afterSubmit(context) {
        try {

            if (context.type == 'edit') {

                var soRecord = context.newRecord;


                var soRecordOld = context.oldRecord;

                var esServicio = soRecord.getValue({
                    fieldId: 'custbody_3k_ov_servicio'
                });

                var subsidiary = soRecord.getValue({
                    fieldId: 'subsidiary'
                });

                var currency = soRecord.getValue({
                    fieldId: 'currency'
                });

                var customer = soRecord.getValue({
                    fieldId: 'entity'
                });

                var trandate = soRecord.getValue({
                    fieldId: 'trandate'
                });

                var sitioWeb = soRecord.getValue({
                    fieldId: 'custbody_cseg_3k_sitio_web_o'
                });

                var sistema = soRecord.getValue({
                    fieldId: 'custbody_cseg_3k_sistema'
                });



                log.debug('esServicio', esServicio);

                var itemSubList = soRecord.getSublist({
                    sublistId: 'item'
                })

                log.debug('itemSubList.isChanged', itemSubList.isChanged);

                var arrayTranCreated = new Array();

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

                    var arrayResultTran = utilities.searchSavedPro('customsearch_3k_tran_asociadoas_liq_ulid', arraySearchParams);
                    var arregloTranAsociadas = arrayResultTran.objRsponseFunction.array;

                    log.debug('arregloTranAsociadas', JSON.stringify(arregloTranAsociadas));

                    var arraySearchParams = [];
                    var objParam = new Object({});
                    objParam.name = 'createdfrom';
                    objParam.operator = 'ANYOF';
                    objParam.values = soRecord.id;
                    arraySearchParams.push(objParam);

                    var arrayResultDep = utilities.searchSavedPro('customsearch_3k_depositos_ov', arraySearchParams);
                    var arregloDepositosOV = arrayResultDep.objRsponseFunction.array;

                    log.debug('arregloDepositosOV', JSON.stringify(arregloDepositosOV));




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

                                /*var liquidado = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_servicio_liquidado',
                                    line: i
                                });*/

                                var grossamt = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'grossamt',
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
                                    var cuentaGral = filterEstados[j].custrecord_3k_accionable_cuentagen;
                                    var cuentaDebe = filterEstados[j].custrecord_3k_accionable_cuentadebe;
                                    var cuentaHaber = filterEstados[j].custrecord_3k_accionable_cuentahaber;
                                    var journal = filterEstados[j].custrecord_3k_accionable_journal;
                                    var aplicacionDeposito = filterEstados[j].custrecord_3k_accionable_aplicacion;
                                    var orden = filterEstados[j].custrecord_3k_accionable_orden;
                                    var cuentaPayment = filterEstados[j].custrecord_3k_accionable_paymentacct;

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



                                                    factComision.selectLine({
                                                        sublistId: 'item',
                                                        line: l
                                                    });

                                                    factComision.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'rate',
                                                        value: 0
                                                    });

                                                    if (unredeem == false) {

                                                        factComision.setCurrentSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'amount',
                                                            value: parseFloat(ingresoLiq).toFixed(2)
                                                        });

                                                    }

                                                    factComision.commitLine({
                                                        sublistId: 'item'
                                                    });


                                                } else {

                                                    factComision.removeLine({
                                                        sublistId: 'item',
                                                        line: l
                                                    });

                                                    numLinesFact--;

                                                }

                                            }

                                            var idTran = factComision.save();


                                            var obj = new Object();
                                            obj.idTran = idTran;
                                            obj.accion = accion;
                                            obj.order = orden;
                                            arrayTranCreated.push(obj);



                                        } else {


                                            if (journal == true) {

                                                var recordCreate = record.create({
                                                    type: accion.toString(),
                                                    isDynamic: true
                                                });

                                                recordCreate.setValue({
                                                    fieldId: 'subsidiary',
                                                    value: subsidiary
                                                });

                                                recordCreate.setValue({
                                                    fieldId: 'currency',
                                                    value: currency
                                                });

                                                /*var dateJE = format.format({
                                                    value: trandate,
                                                    type: format.Type.DATE,
                                                    timezone: format.Timezone.AMERCIA_BUENOS_AIRES
                                                });*/

                                                var dateJE = format.parse({
                                                    value: trandate,
                                                    type: format.Type.DATE,
                                                });

                                                log.debug('dateJE', dateJE)

                                                recordCreate.setValue({
                                                    fieldId: 'trandate',
                                                    value: dateJE
                                                });

                                                recordCreate.setValue({
                                                    fieldId: 'custbody_3k_ulid_servicios',
                                                    value: ulid
                                                });

                                                if (!utilities.isEmpty(sitioWeb)) {

                                                    recordCreate.setValue({
                                                        fieldId: 'custbody_cseg_3k_sitio_web_o',
                                                        value: sitioWeb
                                                    });

                                                }

                                                if (!utilities.isEmpty(sistema)) {

                                                    recordCreate.setValue({
                                                        fieldId: 'custbody_cseg_3k_sistema',
                                                        value: sistema
                                                    });

                                                }

                                                recordCreate.selectNewLine({
                                                    sublistId: 'line'
                                                });

                                                recordCreate.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'account',
                                                    value: cuentaDebe
                                                });

                                                recordCreate.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'debit',
                                                    value: parseFloat(grossamt).toFixed(2)
                                                });



                                                recordCreate.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'entity',
                                                    value: customer
                                                });


                                                recordCreate.commitLine({
                                                    sublistId: 'line'
                                                })

                                                recordCreate.selectNewLine({
                                                    sublistId: 'line'
                                                });


                                                recordCreate.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'account',
                                                    value: cuentaHaber
                                                });

                                                if (unredeem == false) {

                                                    recordCreate.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'entity',
                                                        value: customer
                                                    });

                                                } else {

                                                    recordCreate.setCurrentSublistValue({
                                                        sublistId: 'line',
                                                        fieldId: 'entity',
                                                        value: clienteGenerico
                                                    });

                                                }

                                                recordCreate.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'credit',
                                                    value: parseFloat(grossamt).toFixed(2)
                                                });

                                                recordCreate.commitLine({
                                                    sublistId: 'line'
                                                })

                                                var idTran = recordCreate.save();

                                                var obj = new Object();
                                                obj.idTran = idTran;
                                                obj.accion = accion;
                                                obj.order = orden;
                                                arrayTranCreated.push(obj);


                                            } else {

                                                if (aplicacionDeposito == true) {

                                                    var recordCreateDA = record.create({
                                                        type: accion.toString(),
                                                        isDynamic: true
                                                    });

                                                    var arraySearchParams = [];
                                                    var objParam = new Object({});
                                                    objParam.name = 'custbody_3k_ulid_servicios';
                                                    objParam.operator = 'IS';
                                                    objParam.values = ulid;
                                                    arraySearchParams.push(objParam);

                                                    var arrayResultJE = utilities.searchSavedPro('customsearch_3k_consulta_je_liquidacion', arraySearchParams);
                                                    var arregloJE = arrayResultJE.objRsponseFunction.array;

                                                    log.debug('arregloJE', JSON.stringify(arregloJE));

                                                    recordCreateDA.setValue({
                                                        fieldId: 'deposit',
                                                        value: arregloDepositosOV[0].internalid
                                                    })

                                                    recordCreateDA.setValue({
                                                        fieldId: 'customer',
                                                        value: arregloDepositosOV[0].entity
                                                    })

                                                    /*var dateDeposito = format.format({
                                                        value: arregloDepositosOV[0].trandate,
                                                        type: format.Type.DATE,
                                                        timezone: format.Timezone.AMERCIA_BUENOS_AIRES
                                                    });*/

                                                    var dateDeposito = format.parse({
                                                        value: arregloDepositosOV[0].trandate,
                                                        type: format.Type.DATE
                                                    });

                                                    log.debug('dateDeposito', dateDeposito)

                                                    recordCreateDA.setValue({
                                                        fieldId: 'trandate',
                                                        value: dateDeposito
                                                    })

                                                    recordCreateDA.setValue({
                                                        fieldId: 'currency',
                                                        value: arregloDepositosOV[0].currency
                                                    })

                                                    recordCreateDA.setValue({
                                                        fieldId: 'exchangerate',
                                                        value: arregloDepositosOV[0].exchangerate
                                                    })

                                                    recordCreateDA.setValue({
                                                        fieldId: 'aracct',
                                                        value: cuentaGral
                                                    });

                                                    recordCreateDA.setValue({
                                                        fieldId: 'account',
                                                        value: cuentaPayment
                                                    });
                                                    

                                                    if (!utilities.isEmpty(sitioWeb)) {

                                                        recordCreateDA.setValue({
                                                            fieldId: 'custbody_cseg_3k_sitio_web_o',
                                                            value: sitioWeb
                                                        });

                                                    }

                                                    if (!utilities.isEmpty(sistema)) {

                                                        recordCreateDA.setValue({
                                                            fieldId: 'custbody_cseg_3k_sistema',
                                                            value: sistema
                                                        });

                                                    }

                                                    var linesDepositApp = recordCreateDA.getLineCount({
                                                        sublistId: 'apply'
                                                    });

                                                    log.debug('linesDepositApp', linesDepositApp);

                                                    var sublistDA = recordCreateDA.getSublist({
                                                        sublistId: 'apply'
                                                    });

                                                    log.debug('sublistDA', JSON.stringify(sublistDA));


                                                    if (!utilities.isEmpty(arregloJE) && arregloJE.length > 0) {

                                                        log.debug('if arregloJE', 'entro')

                                                        var lineJournal = recordCreateDA.findSublistLineWithValue({
                                                            sublistId: 'apply',
                                                            fieldId: 'doc',
                                                            value: arregloJE[0].internalid

                                                        });

                                                        log.debug('lineJournal', lineJournal);

                                                        if (!utilities.isEmpty(lineJournal) && lineJournal >= 0) {

                                                            log.debug('if lineJournal', 'entro');

                                                            var lineaSeleccionada = recordCreateDA.selectLine({
                                                                sublistId: 'apply',
                                                                line: lineJournal
                                                            })

                                                            recordCreateDA.setCurrentSublistValue({
                                                                sublistId: 'apply',
                                                                fieldId: 'apply',
                                                                value: true
                                                            });

                                                            var apply = recordCreateDA.getCurrentSublistValue({
                                                                sublistId: 'apply',
                                                                fieldId: 'apply'
                                                            });

                                                            var amount = recordCreateDA.getCurrentSublistValue({
                                                                sublistId: 'apply',
                                                                fieldId: 'amount'
                                                            });

                                                            log.debug('apply', apply)
                                                            log.debug('amount', amount)

                                                            /*recordCreate.commitLine({
                                                                sublistId: 'apply'
                                                            });*/

                                                            /*recordCreate.setSublistValue({
                                                                sublistId: 'apply',
                                                                fieldId: 'apply',
                                                                value: true,
                                                                line: lineJournal
                                                            })*/

                                                            var lineDeposit = recordCreateDA.findSublistLineWithValue({
                                                                sublistId: 'deposit',
                                                                fieldId: 'doc',
                                                                value: arregloDepositosOV[0].internalid
                                                            })

                                                            recordCreateDA.selectLine({
                                                                sublistId: 'deposit',
                                                                line: lineDeposit
                                                            });

                                                            recordCreateDA.setCurrentSublistValue({
                                                                sublistId: 'deposit',
                                                                fieldId: 'apply',
                                                                value: true
                                                            });



                                                            var idTran = recordCreateDA.save({
                                                                enableSourcing: true,
                                                                ignoreMandatoryFields: false
                                                            });

                                                            var obj = new Object();
                                                            obj.idTran = idTran;
                                                            obj.accion = accion;
                                                            obj.order = orden;
                                                            arrayTranCreated.push(obj);

                                                        } else {
                                                            log.error('Error Aplicando Deposito a JE', 'No se encontraron JE: ' + arregloJE[0].internalid + ' en la sublista de aplicación del deposito');
                                                        }
                                                    } else {
                                                        log.error('Error Busqueda JE creado', 'No se encontraron JE asociados al ulid: ' + ulid);
                                                    }


                                                } else {

                                                    var recordCreate = record.create({
                                                        type: accion.toString(),
                                                        isDynamic: true
                                                    });

                                                    recordCreate.setValue({
                                                        fieldId: 'entity',
                                                        value: proveedorLiq
                                                    })

                                                    recordCreate.setValue({
                                                        fieldId: 'custbody_3k_ulid_servicios',
                                                        value: ulid
                                                    });

                                                    recordCreate.selectNewLine({
                                                        sublistId: 'item'
                                                    });

                                                    recordCreate.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'item',
                                                        value: item
                                                    });

                                                    recordCreate.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'quantity',
                                                        value: quantity
                                                    });

                                                    recordCreate.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'rate',
                                                        value: 0
                                                    });

                                                    recordCreate.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'amount',
                                                        value: parseFloat(deudaLiq).toFixed(2)
                                                    });

                                                    recordCreate.commitLine({
                                                        sublistId: 'item'
                                                    });

                                                    var idTran = recordCreate.save();

                                                    var obj = new Object();
                                                    obj.idTran = idTran;
                                                    obj.accion = accion;
                                                    obj.order = orden;
                                                    arrayTranCreated.push(obj);


                                                }

                                            }




                                        }

                                        if (j == (filterEstados.length - 1)) {

                                            //marcarFacturado = true;
                                            arrayLineasMarcarFacturadas.push(i);


                                        }

                                    } else {

                                        if (devolucion == true && facturado == true) {

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

                                                    var idTran = devRecord.save();

                                                    var obj = new Object();
                                                    obj.idTran = idTran;
                                                    obj.accion = accion;
                                                    obj.order = orden;
                                                    arrayTranCreated.push(obj);


                                                }



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

            log.debug('arrayTranCreated', JSON.stringify(arrayTranCreated))

            if (!utilities.isEmpty(arrayTranCreated) && arrayTranCreated.length > 0) {

                for (var y = 0; y < arrayTranCreated.length; y++) {

                    record.delete({
                        type: arrayTranCreated[y].accion,
                        id: arrayTranCreated[y].idTran
                    });

                }

            }
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});
/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/format', 'N/transaction', '3K/utilities', '3K/funcionalidadesOV', '3K/funcionalidadesURU'],
    function (record, search, format, transaction, utilities, funcionalidades, funcionalidadesURU) {


        function afterSubmit(context) {

            var errorCath = false;
            var soRecord = context.newRecord;


            var soRecordOld = context.oldRecord;

            try {

                if (context.type == 'edit') {

                    

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

                    var fidelidad = soRecord.getValue({
                        fieldId: 'custbody_3k_programa_fidelidad'
                    });

                    var travel = soRecord.getValue({
                        fieldId: 'custbody_3k_ov_travel'
                    });




                    if (travel == false) {


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

                            var arrayResultConfig = utilities.searchSavedPro('customsearch_3k_config_liquidaciones');
                            var arregloConfig = arrayResultConfig.objRsponseFunction.array;
                            log.debug('arregloConfig', JSON.stringify(arregloConfig));

                            var arrayULID = new Array();
                            for (var k = 0; k < numLines; k++) {

                                var ulidLine = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'lineuniquekey',
                                    line: k
                                });

                                var esFidelidadLine = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_programa_fidelidad',
                                    line: k
                                });

                                if (esFidelidadLine == false) {

                                    arrayULID.push(ulidLine);
                                }
                            }

                            log.debug('arrayULID', JSON.stringify(arrayULID));

                            /*if (fidelidad == false) {

                                var arraySearchParams = new Array();
                                var objParam = new Object({});
                                objParam.name = 'custbody_3k_ulid_servicios';
                                if (arrayULID.length > 1) {
                                    objParam.operator = 'ANY'
                                } else {
                                    objParam.operator = 'IS'
                                }
                                objParam.values = arrayULID;
                                arraySearchParams.push(objParam);

                            } else {

                                var arraySearchParams = new Array();
                                var objParam = new Object({});
                                objParam.name = 'createdfrom';
                                objParam.operator = 'ANYOF'
                                objParam.values = soRecord.id;
                                arraySearchParams.push(objParam);
                            }

                            var arrayResultTran = utilities.searchSavedPro('customsearch_3k_tran_asociadoas_liq_ulid', arraySearchParams);*/
                            var arrayResultTran = utilities.searchSavedPro('customsearch_3k_tran_asociadoas_liq_ulid');
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


                            var arraySearchParams = [];
                            var objParam = new Object({});
                            objParam.name = 'custbody_3k_ulid_servicios';
                            if (arrayULID.length > 1) {
                                objParam.operator = 'ANY'
                            } else {
                                objParam.operator = 'IS'
                            }

                            objParam.values = arrayULID;
                            arraySearchParams.push(objParam);

                            var arrayResultOC = utilities.searchSavedPro('customsearch_3k_oc_programa_fidelidad', arraySearchParams);
                            var arregloOC = arrayResultOC.objRsponseFunction.array;

                            log.debug('arregloOC', JSON.stringify(arregloOC));



                            //var marcarFacturado = false;
                            var arrayLineasMarcarFacturadas = new Array();
                            var taxConfig = parseFloat(arregloConfig[0].custrecord_3k_config_liq_tasa_art)

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

                                var esFidelidadLineFor = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_programa_fidelidad',
                                    line: i
                                });

                                var esRedondeoLineFor = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_es_redondeo',
                                    line: i
                                });

                                if (esFidelidadLineFor == true || esRedondeoLineFor == true) {
                                    continue
                                }

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

                                        var comision = soRecord.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_3k_comision',
                                            line: i
                                        });

                                        var amountOV = soRecord.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'amount',
                                            line: i
                                        });

                                        var taxrate = soRecord.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'taxrate1',
                                            line: i
                                        });

                                        /*var esFidelidadLine = objRecord.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_3k_programa_fidelidad',
                                            line: i
                                        });*/

                                        log.debug('comsion sin parse', comision);
                                        log.debug('comsion parse', parseFloat(comision).toFixed(2));


                                        var ingresoLiqSinIva = parseFloat(amountOV) * (parseFloat(comision) / 100);



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
                                            var isvoid = filterEstados[j].custrecord_3k_accionable_void;
                                            //var factFull = filterEstados[j].custrecord_3k_accionable_factfull;
                                            //var formaPago = filterEstados[j].custrecord_3k_accionable_forma_pago;
                                            var taxcode = filterEstados[j].custrecord_3k_accionable_taxcode;



                                            log.debug('accion', accion);
                                            log.debug('transform', transform);
                                            log.debug('clienteGenerico', clienteGenerico);
                                            log.debug('fromrt', fromrt);
                                            log.debug('devolucion', devolucion);

                                            if (unredeem == true && fidelidad == true && j == 0) {

                                                var arregloOCFilter = arregloOC.filter(function (obj) {
                                                    return obj.custbody_3k_ulid_servicios == ulid
                                                });

                                                if (!utilities.isEmpty(arregloOCFilter) && arregloOCFilter.length > 0) {

                                                    var recOC = record.load({
                                                        type: 'purchaseorder',
                                                        id: arregloOCFilter[0].internalid,
                                                        isDynamic: true
                                                    });

                                                    var numlinesOC = recOC.getLineCount({
                                                        sublistId: 'item'
                                                    });

                                                    if (numlinesOC > 0) {

                                                        for (var p = 0; p < numlinesOC; p++) {

                                                            recOC.selectLine({
                                                                sublistId: 'item',
                                                                line: p
                                                            });

                                                            recOC.setCurrentSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'isclosed',
                                                                value: true
                                                            });

                                                            recOC.commitLine({
                                                                sublistId: 'item'
                                                            });


                                                        }

                                                        recOC.save();
                                                    }

                                                }



                                            }


                                            if (devolucion == false && facturado == false) {


                                                if (transform == true) {

                                                    if (fidelidad == false) {

                                                        if (unredeem == true && aplicacionDeposito == true) {

                                                            var arrayTranCreatedFilterInv = arrayTranCreated.filter(function (obj) {
                                                                return obj.accion == 'invoice'
                                                            });

                                                            var idFact = arrayTranCreatedFilterInv[0].idTran;

                                                            log.debug('ID Invoice', idFact)

                                                            var recTransform = record.transform({
                                                                fromType: fromrt,
                                                                fromId: idFact,
                                                                toType: accion,
                                                                isDynamic: true

                                                            });

                                                            var linesPayment = recTransform.getLineCount({
                                                                sublistId: 'apply'
                                                            });




                                                            /*var linePago = recTransform.findSublistLineWithValue({
                                                                sublistId: 'apply',
                                                                fieldId: 'internalid',
                                                                value: idFact

                                                            });*/

                                                            log.debug('linesPayment apply list', linesPayment)

                                                            for (var z = 0; z < linesPayment; z++) {

                                                                var doc = recTransform.getSublistValue({
                                                                    sublistId: 'apply',
                                                                    fieldId: 'doc',
                                                                    line: z
                                                                });

                                                                log.debug('doc - idFacr', doc + '-' + idFact)

                                                                if (doc == idFact) {

                                                                    log.debug('entro linea apply', 'entro linea apply')

                                                                    recTransform.selectLine({
                                                                        sublistId: 'apply',
                                                                        line: z

                                                                    });

                                                                    recTransform.setCurrentSublistValue({
                                                                        sublistId: 'apply',
                                                                        fieldId: 'apply',
                                                                        value: true
                                                                    });

                                                                    var apply = recTransform.getCurrentSublistValue({
                                                                        sublistId: 'apply',
                                                                        fieldId: 'apply'
                                                                    });

                                                                    var amount = recTransform.getCurrentSublistValue({
                                                                        sublistId: 'apply',
                                                                        fieldId: 'amount'
                                                                    });

                                                                    log.debug('apply', apply)
                                                                    log.debug('amount', amount)
                                                                }

                                                            }

                                                            //Aplicación Journal

                                                            var linesJE = recTransform.getLineCount({
                                                                sublistId: 'credit'
                                                            });

                                                            log.debug('linesJE', linesJE);


                                                            log.debug('arrayTranCreated', JSON.stringify(arrayTranCreated));

                                                            var arrayTranCreatedFilter = arrayTranCreated.filter(function (obj) {
                                                                return obj.accion == 'journalentry'
                                                            });

                                                            log.debug('arrayTranCreatedFilter', JSON.stringify(arrayTranCreatedFilter));

                                                            if (arrayTranCreatedFilter.length > 0) {

                                                                var idJE = arrayTranCreatedFilter[0].idTran;
                                                                /*var linePago = recTransform.findSublistLineWithValue({
                                                                    sublistId: 'credit',
                                                                    fieldId: 'internalid',
                                                                    value: idJE

                                                                });*/

                                                                for (var u = 0; u < linesJE; u++) {

                                                                    var doc = recTransform.getSublistValue({
                                                                        sublistId: 'credit',
                                                                        fieldId: 'doc',
                                                                        line: u
                                                                    });

                                                                    log.debug('doc - idJE', doc + '-' + idJE)

                                                                    if (doc == idJE) {

                                                                        log.debug('entro linea credit', 'entro linea credit')

                                                                        recTransform.selectLine({
                                                                            sublistId: 'credit',
                                                                            line: u

                                                                        });

                                                                        recTransform.setCurrentSublistValue({
                                                                            sublistId: 'credit',
                                                                            fieldId: 'apply',
                                                                            value: true
                                                                        });

                                                                        var apply = recTransform.getCurrentSublistValue({
                                                                            sublistId: 'credit',
                                                                            fieldId: 'apply'
                                                                        });

                                                                        var amount = recTransform.getCurrentSublistValue({
                                                                            sublistId: 'credit',
                                                                            fieldId: 'amount'
                                                                        });

                                                                        log.debug('apply', apply)
                                                                        log.debug('amount', amount)


                                                                        var idTran2 = recTransform.save();

                                                                        var obj = new Object();
                                                                        obj.idTran = idTran2;
                                                                        obj.accion = accion;
                                                                        obj.order = orden;
                                                                        arrayTranCreated.push(obj);
                                                                    }

                                                                }

                                                            }

                                                        } else {

                                                            var factComision = record.transform({
                                                                fromType: fromrt.toString(),
                                                                fromId: soRecord.id,
                                                                toType: accion.toString(),
                                                                isDynamic: true
                                                            });




                                                            log.audit("Funcionalidades URU", "Inicio beforeSubmit")

                                                            var beforeSubmit = funcionalidadesURU.beforeSubmit('create', factComision);

                                                            log.audit("Funcionalidades URU", "Termino beforeSubmit")

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
                                                            log.audit("Fact Comisión", "Termino seteo cliente factura")

                                                            log.audit("Fact Comisión", "Inicio comprobación monedas")

                                                            var currencyFactComsion = factComision.getValue({fieldId: 'currency'});

                                                            log.debug('Fact Comisión', 'Moneda de Fact Comision: '+ currencyFactComsion + ' - Moneda OV: '+ currency);

                                                            if (currencyFactComsion != currency){

                                                                factComision.setValue({
                                                                    fieldId: 'currency',
                                                                    value: currency
                                                                })

                                                            }

                                                            var currencyFactComsionAfter = factComision.getValue({fieldId: 'currency'});

                                                            log.debug('Fact Comisión', 'Moneda de Fact Comision After seteo: '+ currencyFactComsion);

                                                            log.audit("Fact Comisión", "Fin comprobación monedas")

                                                            var numLinesFact = factComision.getLineCount({
                                                                sublistId: 'item'
                                                            });

                                                            for (var l = 0; l < numLinesFact; l++) {

                                                                if (i == l) {



                                                                    factComision.selectLine({
                                                                        sublistId: 'item',
                                                                        line: l
                                                                    });

                                                                    log.audit("Armado Lines Fact Comision", "Termino Seleccion de linea")

                                                                    if (unredeem == false) {

                                                                        factComision.setCurrentSublistValue({
                                                                            sublistId: 'item',
                                                                            fieldId: 'rate',
                                                                            value: 0
                                                                        });

                                                                        log.audit("Armado Lines Fact Comision", "Fin Seteo 0 Rate")

                                                                        log.audit("Armado Lines Fact Comision", "Inicio Seteo amount. ingresoLiqSinIva: "+ ingresoLiqSinIva)

                                                                        factComision.setCurrentSublistValue({
                                                                            sublistId: 'item',
                                                                            fieldId: 'amount',
                                                                            value: parseFloat(ingresoLiqSinIva).toFixed(2)
                                                                        });

                                                                        log.audit("Armado Lines Fact Comision", "Fin Seteo amount. ingresoLiqSinIva: "+ ingresoLiqSinIva)

                                                                        log.audit("Armado Lines Fact Comision", "Inicio Seteo taxcode. taxcode: "+ taxcode)

                                                                        factComision.setCurrentSublistValue({
                                                                            sublistId: 'item',
                                                                            fieldId: 'taxcode',
                                                                            value: taxcode
                                                                        });

                                                                        log.audit("Armado Lines Fact Comision", "Fin Seteo taxcode. taxcode: "+ taxcode)

                                                                    } else {





                                                                        factComision.setCurrentSublistValue({
                                                                            sublistId: 'item',
                                                                            fieldId: 'taxcode',
                                                                            value: taxcode
                                                                        });

                                                                        var taxrate = factComision.getCurrentSublistValue({
                                                                            sublistId: 'item',
                                                                            fieldId: 'taxrate1'
                                                                        });

                                                                        var quantity = factComision.getCurrentSublistValue({
                                                                            sublistId: 'item',
                                                                            fieldId: 'quantity'
                                                                        });

                                                                        var amountWithTax = parseFloat(grossamt) - ((parseFloat(grossamt) / (1 + (parseFloat(taxrate) / 100))) * (parseFloat(taxrate) / 100))
                                                                        var rate = (amountWithTax / quantity)
                                                                        log.debug('taxrate', taxrate)
                                                                        log.debug('grossamt', grossamt)
                                                                        log.debug('amountWithTax', amountWithTax)


                                                                        factComision.setCurrentSublistValue({
                                                                            sublistId: 'item',
                                                                            fieldId: 'rate',
                                                                            value: parseFloat(rate).toFixed(2)
                                                                        });

                                                                        /*factComision.setCurrentSublistValue({
                                                                            sublistId: 'item',
                                                                            fieldId: 'amount',
                                                                            value: parseFloat(amountWithTax).toFixed(2)
                                                                        });*/

                                                                        factComision.setCurrentSublistValue({
                                                                            sublistId: 'item',
                                                                            fieldId: 'grossamt',
                                                                            value: parseFloat(grossamt).toFixed(2)
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

                                                            var total = factComision.getValue({
                                                                fieldId: 'total'
                                                            })

                                                            log.audit("Armado Lines Fact Comision", "Inicio save FactComision");

                                                            var idTran = factComision.save();

                                                            log.audit("Armado Lines Fact Comision", "Fin save FactComision");

                                                            var obj = new Object();
                                                            obj.idTran = idTran;
                                                            obj.accion = accion;
                                                            obj.order = orden;
                                                            arrayTranCreated.push(obj);

                                                            var afterSubmit = funcionalidadesURU.afterSubmitWithMonto(accion, idTran, subsidiary, total);


                                                        }
                                                    } else {
                                                        // Si es fidelidad se crea la factura por los items de fidelidad al cliente final

                                                        if (unredeem == false) {

                                                            var objRecord = record.transform({
                                                                fromType: fromrt,
                                                                fromId: soRecord.id,
                                                                toType: accion,
                                                                isDynamic: true
                                                            });

                                                            var beforeSubmit = funcionalidadesURU.beforeSubmit('create', objRecord);


                                                            var numLinesFidelidad = objRecord.getLineCount({
                                                                sublistId: 'item'
                                                            });

                                                            log.debug('crearFactura', 'Cantidad Lineas OV: ' + numLines);

                                                            for (var s = 0; s < numLinesFidelidad; s++) {



                                                                if (s != i) {
                                                                    objRecord.removeLine({
                                                                        sublistId: 'item',
                                                                        line: s
                                                                    });

                                                                    numLinesFidelidad--;
                                                                }


                                                            }

                                                            var total = objRecord.getValue({
                                                                fieldId: 'total'
                                                            })

                                                            var saveID = objRecord.save();
                                                            log.debug('crearFactura', 'Registro Factura: ' + saveID);

                                                            var obj = new Object();
                                                            obj.idTran = saveID;
                                                            obj.accion = accion;
                                                            obj.order = orden;
                                                            arrayTranCreated.push(obj);

                                                            var afterSubmit = funcionalidadesURU.afterSubmitWithMonto(accion, saveID, subsidiary, total);
                                                        }


                                                    }



                                                } else {

                                                    if (isvoid == true && unredeem == true) {

                                                        if (fidelidad == false) {

                                                            if (arregloDepositosOV.length > 0) {

                                                                for (var t = 0; t < arregloDepositosOV.length; t++) {

                                                                    if (!utilities.isEmpty(arregloDepositosOV[t].custbody_3k_link_reg_liq_conf)) {

                                                                        transaction.void({
                                                                            id: arregloDepositosOV[t].custbody_3k_link_reg_liq_conf,
                                                                            type: accion.toString()
                                                                        })

                                                                    }

                                                                }

                                                            }
                                                        }

                                                    } else {


                                                        if (journal == true) {

                                                            if (fidelidad == false) {

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
                                                            }


                                                        } else {

                                                            if (aplicacionDeposito == true) {

                                                                if (fidelidad == false) {

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
                                                                }


                                                            } else {

                                                                if (fidelidad == false) {

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

                                                                } else {

                                                                    var arregloOCFilter = arregloOC.filter(function (obj) {
                                                                        return obj.custbody_3k_ulid_servicios == ulid
                                                                    });

                                                                    if (!utilities.isEmpty(arregloOCFilter) && arregloOCFilter.length > 0) {

                                                                        var recordCreate = record.transform({
                                                                            fromType: 'purchaseorder',
                                                                            fromId: arregloOCFilter[0].internalid,
                                                                            toType: accion.toString(),
                                                                            isDynamic: true
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
                                                            return (obj.custbody_3k_ulid_servicios == ulid && obj.recordtype == fromrt) || (obj.custbody_3k_programa_fidelidad == true && obj.createdfrom == soRecord.id && obj.recordtype == fromrt)
                                                        });

                                                        log.debug('filterTranAsociada', JSON.stringify(filterTranAsociada))

                                                        if (!utilities.isEmpty(filterTranAsociada) && filterTranAsociada.length > 0) {

                                                            for (var r = 0; r < filterTranAsociada.length; r++) {

                                                                var devRecord = record.transform({
                                                                    fromType: fromrt.toString(),
                                                                    fromId: filterTranAsociada[r].internalid,
                                                                    toType: accion.toString(),
                                                                    isDynamic: true
                                                                });

                                                                if (accion == 'invoice') {

                                                                    var beforeSubmit = funcionalidadesURU.beforeSubmit('create', devRecord);

                                                                }

                                                                var idTran = devRecord.save();

                                                                if (accion == 'invoice') {

                                                                    var afterSubmit = funcionalidadesURU.afterSubmit(accion, idTran);

                                                                }

                                                                var obj = new Object();
                                                                obj.idTran = idTran;
                                                                obj.accion = accion;
                                                                obj.order = orden;
                                                                arrayTranCreated.push(obj);
                                                            }


                                                        }



                                                    }
                                                } else {

                                                    if (devolucion == true && facturado == false && fidelidad == true) {

                                                        var arregloOCFilter = arregloOC.filter(function (obj) {
                                                            return obj.custbody_3k_ulid_servicios == ulid
                                                        });

                                                        if (!utilities.isEmpty(arregloOCFilter) && arregloOCFilter.length > 0) {

                                                            var recOC = record.load({
                                                                type: 'purchaseorder',
                                                                id: arregloOCFilter[0].internalid,
                                                                isDynamic: true
                                                            });

                                                            var numlinesOC = recOC.getLineCount({
                                                                sublistId: 'item'
                                                            });

                                                            if (numlinesOC > 0) {

                                                                for (var p = 0; p < numlinesOC; p++) {

                                                                    recOC.selectLine({
                                                                        sublistId: 'item',
                                                                        line: p
                                                                    });

                                                                    recOC.setCurrentSublistValue({
                                                                        sublistId: 'item',
                                                                        fieldId: 'isclosed',
                                                                        value: true
                                                                    });

                                                                    recOC.commitLine({
                                                                        sublistId: 'item'
                                                                    });


                                                                }

                                                                recOC.save();
                                                            }

                                                        }

                                                    }

                                                }

                                            }

                                        }

                                        /*
                                            ACTUALIZO OV PARA MARCAR LAS LINEAS COMO FACTURADAS
                                        */

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

                                            /*
                                            RECORRO NUEVAMENTE LAS LINEAS DE LA OV FINAL PARA SABER SI SE DEBE CREAR JE
                                            QUE BAJE SALDO DE CUENTA CORRIENTE DE DEPOSITO DE CLIENTE FINAL
                                            */

                                            var lineCountSOFinal = soRecordFinal.getLineCount({sublistId: 'item'});

                                            //for(var )



                                            soRecordFinal.save();

                                        }



                                    }

                                }


                            }

                        }

                        /*if (!utilities.isEmpty(arrayTranCreated) && arrayTranCreated.length > 0) {

                            var filterTran = arrayTranCreated.filter(function (obj) {
                                return obj.accion == 'invoice' || obj.accion == 'creditmemo'
                            })

                            if (!utilities.isEmpty(filterTran) && filterTran.length > 0) {

                                var arrayCAE = new Array();

                                for (var e = 0; e < filterTran.length; e++) {

                                    arrayCAE.push(filterTran[e].idTran);

                                }

                                var resultCae = funcionalidades.generarCAE(arrayCAE, subsidiary);

                                if (resultCae.error == true) {

                                    record.submitField({
                                        type: record.Type.SALES_ORDER,
                                        id: soRecord.id,
                                        values: {
                                            custbody_3k_netsuite_ov: resultCae.mensaje
                                        },
                                        options: {
                                            enableSourcing: true,
                                            ignoreMandatoryFields: false
                                        }
                                    })


                                }

                            }

                        }*/
                    }


                }


            } catch (error) {
                errorCath = true;
                log.error("Error afertSubmit Catch", error.message);
                log.error("Error Object afertSubmit Catch", JSON.stringify(error));

                log.debug('arrayTranCreated', JSON.stringify(arrayTranCreated))

                if (!utilities.isEmpty(arrayTranCreated) && arrayTranCreated.length > 0) {

                    for (var y = 0; y < arrayTranCreated.length; y++) {

                        /*record.delete({
                            type: arrayTranCreated[y].accion,
                            id: arrayTranCreated[y].idTran
                        });*/

                    }

                }
            }
            finally{

                if (!utilities.isEmpty(arrayTranCreated) && arrayTranCreated.length > 0 && errorCath == false) {

                    var filterTran = arrayTranCreated.filter(function (obj) {
                        return obj.accion == 'invoice' || obj.accion == 'creditmemo'
                    })

                    if (!utilities.isEmpty(filterTran) && filterTran.length > 0) {

                        var arrayCAE = new Array();

                        for (var e = 0; e < filterTran.length; e++) {

                            arrayCAE.push(filterTran[e].idTran);

                        }

                        var resultCae = funcionalidades.generarCAE(arrayCAE, subsidiary);

                        if (resultCae.error == true) {

                            record.submitField({
                                type: record.Type.SALES_ORDER,
                                id: soRecord.id,
                                values: {
                                    custbody_3k_netsuite_ov: resultCae.mensaje
                                },
                                options: {
                                    enableSourcing: true,
                                    ignoreMandatoryFields: false
                                }
                            })


                        }

                    }

                }
            }
        }

        return {
            afterSubmit: afterSubmit
        }
    });
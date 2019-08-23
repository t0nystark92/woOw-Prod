/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/format', 'N/transaction', 'N/task', 'N/runtime', '3K/utilities', '3K/funcionalidadesOV', '3K/funcionalidadesURU'],
    function (record, search, format, transaction, task, runtime, utilities, funcionalidades, funcionalidadesURU) {


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

                    var description = soRecord.getValue({
                        fieldId: 'description'
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
                            /*var arrayResultTran = utilities.searchSavedPro('customsearch_3k_tran_asociadoas_liq_ulid');
                            var arregloTranAsociadas = arrayResultTran.objRsponseFunction.array;*/
                            var savedSearch = search.load({
                                id: 'customsearch_3k_tran_asociadoas_liq_ulid'
                            });

                            var arrayExpresionsFinal = savedSearch.filterExpression;

                            var filterS = new Array()

                            for (var jj = 0; jj < arrayULID.length; jj++) {

                                var arraypushExpression = new Array();

                                arraypushExpression[0] = new Array()

                                arraypushExpression[0][0] = "custbody_3k_ulid_servicios"
                                arraypushExpression[0][1] = "is"
                                arraypushExpression[0][2] = arrayULID[jj];

                                if (arrayULID.length - 1 > jj) {
                                    arraypushExpression[1] = "OR"
                                }

                                filterS = filterS.concat(arraypushExpression);
                            }
                            var filterOV = ["createdfrom", "ANYOF", soRecord.id];
                            var filterUnificado = ["AND", [filterS, "OR", filterOV]]
                            arrayExpresionsFinal = arrayExpresionsFinal.concat(filterUnificado);
                            log.debug('filtersTranAsociadas', JSON.stringify(arrayExpresionsFinal));
                            savedSearch.filterExpression = arrayExpresionsFinal.concat(filterUnificado);

                            log.debug('filters', JSON.stringify(savedSearch.filterExpression));

                            var resultSearch = savedSearch.run();
                            var resultSet = [];
                            var resultIndex = 0;
                            var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
                            var resultado; // temporary variable used to store the result set

                            do {
                                // fetch one result set
                                resultado = resultSearch.getRange({
                                    start: resultIndex,
                                    end: resultIndex + resultStep
                                });
                                if (!utilities.isEmpty(resultado) && resultado.length > 0) {
                                    if (resultIndex == 0) resultSet = resultado;
                                    else resultSet = resultSet.concat(resultado);
                                }
                                // increase pointer
                                resultIndex = resultIndex + resultStep;
                                // once no records are returned we already got all of them
                            } while (!utilities.isEmpty(resultado) && resultado.length > 0)

                            var arregloTranAsociadas = new Array();

                            for (var xy = 0; xy < resultSet.length; xy++) {
                                var obj = new Object({});
                                obj.indice = xy;
                                for (var yy = 0; yy < resultSearch.columns.length; yy++) {
                                    var nombreColumna = resultSearch.columns[yy].name;
                                    //log.debug('armarArreglosSS','nombreColumna inicial: '+ nombreColumna);
                                    if (nombreColumna.indexOf("formula") !== -1 || !utilities.isEmpty(resultSearch.columns[yy].join)) {
                                        nombreColumna = resultSearch.columns[yy].label;


                                    }

                                    if (Array.isArray(resultSet[xy].getValue({
                                        name: resultSearch.columns[yy]
                                    }))) {

                                        var a = resultSet[xy].getValue({
                                            name: resultSearch.columns[yy]
                                        });
                                        //log.debug('armarArreglosSS', 'a: ' + JSON.stringify(a));
                                        obj[nombreColumna] = a[0].value;
                                    } else {
                                        //log.debug('armarArreglosSS', 'resultSet[i].getValue({ name: nombreColumna }): ' + JSON.stringify(resultSet[i].getValue({ name: nombreColumna })));
                                        obj[nombreColumna] = resultSet[xy].getValue({
                                            name: resultSearch.columns[yy]
                                        });
                                    }

                                }
                                //log.debug('armarArreglosSS', 'obj: ' + JSON.stringify(obj));
                                arregloTranAsociadas.push(obj);
                            }

                            log.debug('arregloTranAsociadas', JSON.stringify(arregloTranAsociadas));

                            /*var arraySearchParams = [];
                            var objParam = new Object({});
                            objParam.name = 'createdfrom';
                            objParam.operator = 'ANYOF';
                            objParam.values = soRecord.id;
                            arraySearchParams.push(objParam);

                            var arrayResultDep = utilities.searchSavedPro('customsearch_3k_depositos_ov', arraySearchParams);
                            var arregloDepositosOV = arrayResultDep.objRsponseFunction.array;

                            log.debug('arregloDepositosOV', JSON.stringify(arregloDepositosOV));*/


                            /*var arraySearchParams = [];
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
                            var arregloOC = arrayResultOC.objRsponseFunction.array;*/

                            var savedSearch = search.load({
                                id: 'customsearch_3k_oc_programa_fidelidad'
                            });

                            var arrayExpresionsFinal = savedSearch.filterExpression;

                            for (var jj = 0; jj < arrayULID.length; jj++) {

                                if (jj == 0) {
                                    arrayExpresionsFinal.push("AND");
                                }

                                var arraypushExpression = new Array();

                                arraypushExpression[0] = new Array()

                                arraypushExpression[0][0] = "custbody_3k_ulid_servicios"
                                arraypushExpression[0][1] = "is"
                                arraypushExpression[0][2] = arrayULID[jj];

                                if (arrayULID.length - 1 > jj) {
                                    arraypushExpression[1] = "OR"
                                }

                                arrayExpresionsFinal = arrayExpresionsFinal.concat(arraypushExpression);
                            }
                            savedSearch.filterExpression = arrayExpresionsFinal;

                            log.debug('filters', JSON.stringify(savedSearch.filterExpression));

                            var resultSearch = savedSearch.run();
                            var resultSet = [];
                            var resultIndex = 0;
                            var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
                            var resultado; // temporary variable used to store the result set

                            do {
                                // fetch one result set
                                resultado = resultSearch.getRange({
                                    start: resultIndex,
                                    end: resultIndex + resultStep
                                });
                                if (!utilities.isEmpty(resultado) && resultado.length > 0) {
                                    if (resultIndex == 0) resultSet = resultado;
                                    else resultSet = resultSet.concat(resultado);
                                }
                                // increase pointer
                                resultIndex = resultIndex + resultStep;
                                // once no records are returned we already got all of them
                            } while (!utilities.isEmpty(resultado) && resultado.length > 0)

                            var arregloOC = new Array();

                            for (var xy = 0; xy < resultSet.length; xy++) {
                                var obj = new Object({});
                                obj.indice = xy;
                                for (var yy = 0; yy < resultSearch.columns.length; yy++) {
                                    var nombreColumna = resultSearch.columns[yy].name;
                                    //log.debug('armarArreglosSS','nombreColumna inicial: '+ nombreColumna);
                                    if (nombreColumna.indexOf("formula") !== -1 || !utilities.isEmpty(resultSearch.columns[yy].join)) {
                                        nombreColumna = resultSearch.columns[yy].label;


                                    }

                                    if (Array.isArray(resultSet[xy].getValue({
                                        name: resultSearch.columns[yy]
                                    }))) {

                                        var a = resultSet[xy].getValue({
                                            name: resultSearch.columns[yy]
                                        });
                                        //log.debug('armarArreglosSS', 'a: ' + JSON.stringify(a));
                                        obj[nombreColumna] = a[0].value;
                                    } else {
                                        //log.debug('armarArreglosSS', 'resultSet[i].getValue({ name: nombreColumna }): ' + JSON.stringify(resultSet[i].getValue({ name: nombreColumna })));
                                        obj[nombreColumna] = resultSet[xy].getValue({
                                            name: resultSearch.columns[yy]
                                        });
                                    }

                                }
                                //log.debug('armarArreglosSS', 'obj: ' + JSON.stringify(obj));
                                arregloOC.push(obj);
                            }

                            log.debug('arregloOC', JSON.stringify(arregloOC));



                            //var marcarFacturado = false;
                            var arrayLineasMarcarFacturadas = new Array();
                            var arrayLinesCerrar = new Array();
                            /*var objMapParametro = new Object();
                            objMapParametro.ov = soRecord.id;*/
                            infoLineMapParam = new Array();
                            //objMapParametro.filterEstados = new Array();
                            //var taxConfig = parseFloat(arregloConfig[0].custrecord_3k_config_liq_tasa_art)

                            var validarFinal = false;
                            var notReedem = false;



                            log.debug('arrayLinesOrdered', JSON.stringify(arrayLinesOrdered))

                            for (var i = 0; i < numLines; i++) {

                                var objLine = new Object();

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

                                var esDescuentoLineFor = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_item_discount_line',
                                    line: i
                                });

                                var esClosed = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'isclosed',
                                    line: i
                                });

                                if (esFidelidadLineFor == true || esRedondeoLineFor == true || esDescuentoLineFor == true || esClosed == true) {
                                    continue
                                }

                                log.debug('estadoServicio', estadoServicio);
                                log.debug('estadoServicioOld', estadoServicioOld);

                                if (estadoServicio != estadoServicioOld) {

                                    var arrayLinesOrdered = new Array();
                                    var orderLine = 0;

                                    for (var ii = 0; ii < numLines; ii++) {

                                        var isOpen = soRecord.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'isopen',
                                            line: ii
                                        });

                                        log.debug('line isopen', 'isopen: ' + isOpen + ' typeof: ' + typeof (isOpen))

                                        if (isOpen == true || isOpen == 'T') {

                                            if (arrayLineasMarcarFacturadas.length > 0) {

                                                var f = arrayLineasMarcarFacturadas.filter(function (o) {
                                                    return o == ii
                                                })

                                                if (utilities.isEmpty(f) || f.length == 0) {

                                                    var objLine = new Object();
                                                    objLine.idx = ii;
                                                    objLine.order = orderLine;
                                                    arrayLinesOrdered.push(objLine);

                                                    orderLine++;
                                                }

                                            } else {

                                                var objLine = new Object();
                                                objLine.idx = ii;
                                                objLine.order = orderLine;
                                                arrayLinesOrdered.push(objLine);

                                                orderLine++;

                                            }


                                        }

                                    }



                                    var filterEstados = arregloEstados.filter(function (obj) {
                                        return obj.custrecord_3k_accionable_estado == estadoServicio
                                    })

                                    log.debug('filterEstados', JSON.stringify(filterEstados));

                                    if (!utilities.isEmpty(filterEstados) && filterEstados.length > 0) {

                                        validarFinal = true;

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

                                        objLine.ulid = ulid;
                                        objLine.estado = estadoServicio;
                                        objLine.filterEstados = new Array();


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
                                            var mapReduce = filterEstados[j].custrecord_3k_accionable_map;





                                            log.debug('accion', accion);
                                            log.debug('transform', transform);
                                            log.debug('clienteGenerico', clienteGenerico);
                                            log.debug('fromrt', fromrt);
                                            log.debug('devolucion', devolucion);

                                            if (mapReduce == true) {
                                                objLine.filterEstados.push(filterEstados[j])
                                                notReedem = true;

                                            } else {



                                                if (devolucion == false && facturado == false) {


                                                    if (transform == true) {

                                                        if (fidelidad == false) {

                                                            /*FACTURA USED COMISION*/
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


                                                            factComision.setValue({
                                                                fieldId: 'entity',
                                                                value: clienteLiq
                                                            });

                                                            log.audit("Fact Comisión", "Termino seteo cliente factura")

                                                            log.audit("Fact Comisión", "Inicio comprobación monedas")

                                                            var currencyFactComsion = factComision.getValue({
                                                                fieldId: 'currency'
                                                            });

                                                            log.debug('Fact Comisión', 'Moneda de Fact Comision: ' + currencyFactComsion + ' - Moneda OV: ' + currency);

                                                            if (currencyFactComsion != currency) {

                                                                factComision.setValue({
                                                                    fieldId: 'currency',
                                                                    value: currency
                                                                })

                                                            }


                                                            log.debug('Fact Comisión', 'Moneda de Fact Comision After seteo: ' + currencyFactComsion);

                                                            log.audit("Fact Comisión", "Fin comprobación monedas")

                                                            var filterOrder = arrayLinesOrdered.filter(function (obj) {
                                                                return obj.idx == i;
                                                            });

                                                            var numLinesFact = factComision.getLineCount({
                                                                sublistId: 'item'
                                                            });

                                                            for (var l = 0; l < numLinesFact; l++) {



                                                                if (parseInt(filterOrder[0].order) == l) {

                                                                    factComision.selectLine({
                                                                        sublistId: 'item',
                                                                        line: l
                                                                    });

                                                                    log.audit("Armado Lines Fact Comision", "Termino Seleccion de linea")

                                                                    if (unredeem == false) {

                                                                        if(!utilities.isEmpty(description)){

                                                                            factComision.setCurrentSublistValue({
                                                                                sublistId: 'item',
                                                                                fieldId: 'description',
                                                                                value: description
                                                                            });
                                                                        }


                                                                        factComision.setCurrentSublistValue({
                                                                            sublistId: 'item',
                                                                            fieldId: 'rate',
                                                                            value: 0
                                                                        });

                                                                        log.audit("Armado Lines Fact Comision", "Fin Seteo 0 Rate")

                                                                        log.audit("Armado Lines Fact Comision", "Inicio Seteo amount. ingresoLiqSinIva: " + ingresoLiqSinIva)

                                                                        factComision.setCurrentSublistValue({
                                                                            sublistId: 'item',
                                                                            fieldId: 'amount',
                                                                            value: parseFloat(ingresoLiqSinIva).toFixed(2)
                                                                        });

                                                                        log.audit("Armado Lines Fact Comision", "Fin Seteo amount. ingresoLiqSinIva: " + ingresoLiqSinIva)

                                                                        log.audit("Armado Lines Fact Comision", "Inicio Seteo taxcode. taxcode: " + taxcode)

                                                                        factComision.setCurrentSublistValue({
                                                                            sublistId: 'item',
                                                                            fieldId: 'taxcode',
                                                                            value: taxcode
                                                                        });

                                                                        log.audit("Armado Lines Fact Comision", "Fin Seteo taxcode. taxcode: " + taxcode)

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


                                                        } else {
                                                            /*Si es fidelidad se crea la factura por los items de fidelidad al cliente final*/

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


                                                                recordCreate.setCurrentSublistValue({
                                                                    sublistId: 'line',
                                                                    fieldId: 'entity',
                                                                    value: customer
                                                                });

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
                                                                    fieldId: 'currency',
                                                                    value: currency
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

                                                                if(!utilities.isEmpty(description)){

                                                                    recordCreate.setCurrentSublistValue({
                                                                        sublistId: 'item',
                                                                        fieldId: 'description',
                                                                        value: description
                                                                    });
                                                                    
                                                                }


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

                                                        if (devolucion == true && facturado == false) {

                                                            if (fidelidad == true) {

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

                                                            if (arrayLinesCerrar.indexOf(i) == -1) {

                                                                arrayLinesCerrar.push(i)
                                                                log.debug('arrayLinesCerrar', JSON.stringify(arrayLinesCerrar));
                                                            }

                                                        } else {

                                                            if (unredeem == true && map == true) {



                                                            }
                                                        }

                                                    }

                                                }

                                            }

                                        }

                                        //if (!utilities.isEmpty(objLine.filterEstados) && objLine.filterEstados.length > 0) {
                                        infoLineMapParam.push(objLine);
                                        //}

                                    }

                                }


                            }



                            /*ACTUALIZO OV PARA MARCAR LAS LINEAS COMO FACTURADAS*/

                            if (validarFinal == true) {

                                var soRecordFinal = record.load({
                                    type: context.newRecord.type,
                                    id: context.newRecord.id,
                                    isDynamic: true
                                });



                                var ejecutarMap = true;

                                if (arrayLineasMarcarFacturadas.length > 0) {

                                    log.debug('entro facturar', 'entro');


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

                                }

                                if (arrayLinesCerrar.length > 0) {

                                    for (var x = 0; x < arrayLinesCerrar.length; x++) {

                                        soRecordFinal.selectLine({
                                            sublistId: 'item',
                                            line: arrayLinesCerrar[x]
                                        })

                                        soRecordFinal.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'isclosed',
                                            value: true
                                        })

                                        soRecordFinal.commitLine({
                                            sublistId: 'item'
                                        })

                                    }

                                }




                                var asientoFinalApplied = soRecordFinal.getValue({
                                    fieldId: 'custbody_3k_je_serv_aplica_deposito'
                                })

                                if (asientoFinalApplied == false) {

                                    var numLinesFinal = soRecordFinal.getLineCount({
                                        sublistId: 'item'
                                    });

                                    for (var z = 0; z < numLinesFinal; z++) {

                                        /*soRecord.selectLine({
                                            sublistId: 'item',
                                            line: z
                                        });*/

                                        var esFidelidadLineFinal = soRecordFinal.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_3k_programa_fidelidad',
                                            line: z
                                        });

                                        var esRedondeoLineFinal = soRecordFinal.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_3k_es_redondeo',
                                            line: z
                                        });

                                        var esDescuentoLineFinal = soRecordFinal.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_3k_item_discount_line',
                                            line: z
                                        });

                                        var esClosedFinal = soRecordFinal.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'isclosed',
                                            line: z
                                        });

                                        var facturadoFinal = soRecordFinal.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_3k_servicio_facturado',
                                            line: z
                                        });

                                        log.debug('comprobacion asiento', 'esFidelidadLineFinal: ' + esFidelidadLineFinal + ' esRedondeoLineFinal: ' + esRedondeoLineFinal + ' esDescuentoLineFinal: ' + esDescuentoLineFinal + ' esClosedFinal: ' + esClosedFinal + ' facturadoFinal: ' + facturadoFinal)

                                        if (esFidelidadLineFinal == false && esRedondeoLineFinal == false && esDescuentoLineFinal == false && esClosedFinal == false && facturadoFinal == false) {

                                            ejecutarMap = false;
                                            break;


                                        }

                                    }

                                    soRecordFinal.save();

                                    log.debug('ejecutarMap', ejecutarMap);

                                    if (ejecutarMap == true || (infoLineMapParam.length > 0 && notReedem == true)) {

                                        var parametros = new Object();
                                        parametros.custscript_jsonLines = JSON.stringify(infoLineMapParam);
                                        parametros.custscript_idOV = soRecord.id;

                                        var respuestaMap = createAndSubmitMapReduceJob('customscript_3k_estado_reserva_map', parametros);

                                        if (respuestaMap.error == true) {
                                            throw respuestaMap;
                                        }

                                    }

                                } else {
                                    soRecordFinal.save();
                                }
                            }

                        }

                    }


                }


            } catch (error) {
                errorCath = true;
                log.error("Error afertSubmit Catch", error.message);
                log.error("Error Object afertSubmit Catch", JSON.stringify(error));

                //log.debug('arrayTranCreated', JSON.stringify(arrayTranCreated))

                var currScript = runtime.getCurrentScript();
                var tipoNota = currScript.getParameter('custscript_3k_tipo_nota');

                var crearNotaError = funcionalidades.crearNota(context.newRecord.id, 'Error en Estado Reservas OV (SS) - Excepcion', tipoNota, error.message);
                log.debug('Estado Reserva OV (SS)', 'crearNotaError: ' + JSON.stringify(crearNotaError));

                

                /*if (!utilities.isEmpty(arrayTranCreated) && arrayTranCreated.length > 0) {

                    for (var y = 0; y < arrayTranCreated.length; y++) {

                        record.delete({
                            type: arrayTranCreated[y].accion,
                            id: arrayTranCreated[y].idTran
                        });

                    }

                }*/
            } finally {

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

                            record.submitFields({
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

        function createAndSubmitMapReduceJob(idScript, parametros) {
            log.audit('createAndSubmitMapReduceJob', 'INICIO Invocacion Script MAP/REDUCE');
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";
            respuesta.estado = "";
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
                respuesta.mensaje = "Excepcion Invocando A Script MAP/REDUCE - Excepcion : " + excepcion.message;
                log.error('createAndSubmitMapReduceJob', 'Excepcion Invocando A Script MAP/REDUCE - Excepcion : ' + excepcion.message);
            }
            log.audit('createAndSubmitMapReduceJob', 'FIN Invocacion Script MAP/REDUCE');
            return respuesta;
        }

        return {
            afterSubmit: afterSubmit
        }
    });
/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/format', 'N/runtime', '3K/utilities', '3K/funcionalidadesURU'],

    function (search, record, email, runtime, error, format, runtime, utilities, funcionalidadesURU) {

        function isEmpty(value) {
            if (value === '') {
                return true;
            }

            if (value === null) {
                return true;
            }

            if (value === undefined) {
                return true;
            }
            return false;
        }

        function enviarEmail(autor, destinatario, titulo, mensaje) {
            log.debug('Funcionalidades OV', 'SUMMARIZE - INICIO ENVIO EMAIL - ID AUTOR : ' + autor + ' - ID DESTINATARIO : ' + destinatario + ' - TITULO : ' + titulo + ' - MENSAJE : ' + mensaje);

            if (!isEmpty(autor) && !isEmpty(destinatario) && !isEmpty(titulo) && !isEmpty(mensaje)) {
                email.send({
                    author: autor,
                    recipients: destinatario,
                    subject: titulo,
                    body: mensaje
                });
            } else {
                var detalleError = 'No se recibio la siguiente informacion necesaria para realizar el envio del Email : ';
                if (isEmpty(autor)) {
                    detalleError = detalleError + ' ID del Autor del Email / ';
                }
                if (isEmpty(destinatario)) {
                    detalleError = detalleError + ' ID del Destinatario del Email / ';
                }
                if (isEmpty(titulo)) {
                    detalleError = detalleError + ' ID del Titulo del Email / ';
                }
                if (isEmpty(mensaje)) {
                    detalleError = detalleError + ' ID del Mensaje del Email / ';
                }
                log.error('Generar Ordenes de Compras', 'SUMMARIZE - Error Envio Email - Error : ' + detalleError);
            }
            log.debug('Funcionalidades OV', 'SUMMARIZE - FIN ENVIO EMAIL');
        }

        function handleErrorAndSendNotification(e, stage) {
            log.error('Estado : ' + stage + ' Error', e);

            var author = runtime.getCurrentUser().id;
            var recipients = runtime.getCurrentUser().id;
            var subject = 'Proceso Niveles de Acción ' + runtime.getCurrentScript().id + ' Error en Estado : ' + stage;
            var body = 'Ocurrio un error con la siguiente informacion : \n' +
                'Codigo de Error: ' + e.name + '\n' +
                'Mensaje de Error: ' + e.message;

            email.send({
                author: author,
                recipients: recipients,
                subject: subject,
                body: body
            });
        }

        function handleOKAndSendNotification(msj) {
            log.audit('handleOKAndSendNotification', 'msj: ' + msj);

            var author = runtime.getCurrentUser().id;
            var recipients = runtime.getCurrentUser().id;
            var subject = 'Proceso Niveles de Acción ' + runtime.getCurrentScript().id + ' FINALIZADO';
            var body = msj

            email.send({
                author: author,
                recipients: recipients,
                subject: subject,
                body: body
            });
        }

        function handleErrorIfAny(summary) {
            var inputSummary = summary.inputSummary;
            var mapSummary = summary.mapSummary;
            var reduceSummary = summary.reduceSummary;

            var error = false;

            if (inputSummary.error) {

                error = true;

                var e = error.create({
                    name: 'INPUT_STAGE_FAILED',
                    message: inputSummary.error
                });
                handleErrorAndSendNotification(e, 'getInputData');
            }

            error = handleErrorInStage('map', mapSummary);
            error = handleErrorInStage('reduce', reduceSummary);

            if (error == false) {
                handleOKAndSendNotification('El proceso de Niveles de Acción Finalizó Correctamente');
            }
        }

        function handleErrorInStage(stage, summary) {
            var errorMsg = [];
            summary.errors.iterator().each(function (key, value) {
                var msg = 'Error: ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
                errorMsg.push(msg);
                return true;
            });
            if (errorMsg.length > 0) {

                var e = error.create({
                    name: 'ERROR_CUSTOM',
                    message: JSON.stringify(errorMsg)
                });
                handleErrorAndSendNotification(e, stage);
                return true;
            } else {
                return false;
            }
        }

        function getParams(param) {
            try {
                var currScript = runtime.getCurrentScript();
                var informacion = currScript.getParameter(param);
                //informacion.numeroDespacho = currScript.getParameter('custscript_3k_numero_despacho');

                return informacion;
            } catch (excepcion) {
                log.error('getParams', 'INPUT DATA - Excepcion Obteniendo Parametros - Excepcion : ' + excepcion.message.toString());
                return null;
            }
        }

        function getInputData() {

            try {

                var jsonLines = getParams('custscript_jsonLines');
                var jsonLinesObj = JSON.parse(jsonLines);

                log.debug('jsonLines', JSON.stringify(jsonLines))


                return jsonLinesObj;
            } catch (excepcion) {
                log.error('getParams', 'INPUT DATA - Excepcion Obteniendo Parametros - Excepcion : ' + excepcion.message.toString());
                return null;
            }

        }

        function map(context) {

            log.audit('Estados Reserva', 'INICIO MAP');

            try {

                var resultado = context.value;
                var obj = new Object({});

                if (!isEmpty(resultado)) {

                    var searchResult = JSON.parse(resultado);

                    if (!isEmpty(searchResult)) {

                        var idOv = getParams('custscript_idOV');
                        var soRecord = record.load({
                            type: 'salesorder',
                            id: idOv,
                            isDynamic: true
                        })

                        var currencyOV = soRecord.getValue({
                            sublistId: 'item',
                            fieldId: 'currency'
                        })

                        var subsidiariaOV = soRecord.getValue({
                            sublistId: 'item',
                            fieldId: 'subsidiary'
                        })

                        var customer = soRecord.getValue({
                            fieldId: 'entity'
                        });

                        var trandate = soRecord.getValue({
                            fieldId: 'trandate'
                        });

                        var formatDateJE = format.format({
                            value: trandate,
                            type: format.Type.DATE
                        });

                        log.debug('trandate', JSON.stringify(trandate))
                        log.debug('formatDateJE', JSON.stringify(formatDateJE))

                        //var dateParsedJS = new Date(trandate)

                        var sitioWeb = soRecord.getValue({
                            fieldId: 'custbody_cseg_3k_sitio_web_o'
                        });

                        var sistema = soRecord.getValue({
                            fieldId: 'custbody_cseg_3k_sistema'
                        });

                        var fidelidad = soRecord.getValue({
                            fieldId: 'custbody_3k_programa_fidelidad'
                        });

                        var numLinesOV = soRecord.getLineCount({
                            sublistId: 'item'
                        })



                        for (var i = 0; i < numLinesOV; i++) {

                            var ulidFor = soRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'lineuniquekey',
                                line: i
                            });

                            if (ulidFor == searchResult.ulid) {



                                var grossamt = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'grossamt',
                                    line: i
                                })

                                var ingresoLiq = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_importe_fact_liq',
                                    line: i
                                })

                                var deudaLiq = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_deuda_pagar',
                                    line: i
                                })

                                var clienteLiq = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_cliente_liquidacion',
                                    line: i
                                })

                                var proveedorLiq = soRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_proveedor_liquidacion',
                                    line: i
                                })


                                obj.idOV = idOv;
                                obj.currency = currencyOV;
                                obj.subsidiary = subsidiariaOV;
                                obj.customer = customer;
                                obj.trandate = formatDateJE;
                                obj.sitioWeb = sitioWeb;
                                obj.sistema = sistema;
                                obj.fidelidad = fidelidad;
                                obj.index = i;
                                obj.ingresoLiq = ingresoLiq;
                                obj.deudaLiq = deudaLiq;
                                obj.clienteLiq = clienteLiq;
                                obj.proveedorLiq = proveedorLiq;
                                obj.grossamt = grossamt;
                                obj.ulid = searchResult.ulid;
                                obj.estado = searchResult.estado;

                                obj.filterEstados = searchResult.filterEstados;

                                var clave = obj.ulid;

                                break;

                            }

                        }

                        /*var obj = new Object({});

                        obj.idOV = idOv;
                        obj.ulid = searchResult.ulid;
                        obj.estado = searchResult.estado;
                        obj.filterEstados = searchResult.filterEstados;

                        var clave = obj.ulid;*/

                        log.debug('objMap', JSON.stringify(obj));

                        context.write(clave, JSON.stringify(obj));

                    } else {
                        log.error('Estados Reserva', 'MAP - Error Obteniendo Resultados de Lineas OV A Procesar');
                    }

                } else {
                    log.error('Estados Reserva', 'MAP - Error Parseando Resultados de Lineas OV A Procesar');
                }

            } catch (excepcion) {
                log.error('Estados Reserva', 'MAP - Excepcion Procesando Lineas OV A Procesar - Excepcion : ' + excepcion.message.toString());
            }

            log.audit('Estados Reserva', 'FIN MAP');

        }

        function reduce(context) {

            /*************************NOT REDEEMED *****************************************/
            /*******************************************************************************/

            log.audit('Estados Reserva', 'INICIO REDUCE - KEY (ULID) : ' + context.key);

            if (!isEmpty(context.values) && context.values.length > 0) {

                //var idInternoOV = context.values[0].idOV;
                //if (!isEmpty(idInternoOV)) {

                /*var soRecord = record.load({
                        type: 'salesorder',
                        id: idInternoOV,
                        isDynamic: true
        
                    })*/

                log.debug('context.values')

                for (var i = 0; i < context.values.length; i++) {

                    registro = JSON.parse(context.values[i]);

                    var idOv = registro.idOV;
                    var currency = registro.currency;
                    var subsidiary = registro.subsidiary;
                    var grossamt = registro.grossamt;
                    var ulid = registro.ulid;
                    var estado = registro.estado;
                    var index = registro.index;
                    var customer = registro.customer;
                    var sitioWeb = registro.sitioWeb;
                    var sistema = registro.sistema;
                    var fidelidad = registro.fidelidad;
                    var trandate = registro.trandate;
                    var ingresoLiq = registro.ingresoLiq;
                    var deudaLiq = registro.deudaLiq;
                    var clienteLiq = registro.clienteLiq;
                    var proveedorLiq = registro.proveedorLiq;

                    var filterEstados = registro.filterEstados;


                    var arrayTranCreated = new Array();

                    //}

                    if (!utilities.isEmpty(filterEstados) && filterEstados.length > 0) {

                        var arraySearchParams = [];
                        var objParam = new Object({});
                        objParam.name = 'custbody_3k_ulid_servicios';
                        objParam.operator = 'IS'
                        objParam.values = ulid;
                        arraySearchParams.push(objParam);

                        var arrayResultOC = utilities.searchSavedPro('customsearch_3k_oc_programa_fidelidad', arraySearchParams);
                        var arregloOC = arrayResultOC.objRsponseFunction.array;

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

                            var taxcode = filterEstados[j].custrecord_3k_accionable_taxcode;
                            var mapReduce = filterEstados[j].custrecord_3k_accionable_map;

                            /*PASO 1: CERRAR OC SI ES FIDELIDAD*/
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
                            /*FIN PASO 1*/









                            if (transform == true && aplicacionDeposito == false) {




                                /*PASO 2: CREAR INVOICE A CLIENTE GENERICO CON TRANSFORM DESDE OV*/

                                var factComision = record.transform({
                                    fromType: fromrt.toString(),
                                    fromId: idOv,
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
                                    value: clienteGenerico
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

                                var numLinesFact = factComision.getLineCount({
                                    sublistId: 'item'
                                });

                                for (var l = 0; l < numLinesFact; l++) {

                                    if (index == l) {



                                        factComision.selectLine({
                                            sublistId: 'item',
                                            line: l
                                        });

                                        log.audit("Armado Lines Fact Comision", "Termino Seleccion de linea")


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


                                        factComision.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'grossamt',
                                            value: parseFloat(grossamt).toFixed(2)
                                        });

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

                            /*FIN PASO 2*/

                            /*PASO 3: CREAR JE PARA APLICAR A DEPOSITO Y FACTURA*/
                            if (journal == true) {

                                if (fidelidad == false) {

                                    if (unredeem == true) {

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



                                        /*var formatDateJE = format.format({
                                            value: trandate,
                                            type: format.Type.DATE
                                        });*/

                                        var dateJE = format.parse({
                                            value: trandate,
                                            type: format.Type.DATE
                                        });

                                        log.debug('dateJE', dateJE + ' typeof: ' + typeof dateJE)
                                        //log.debug('formatDateJE', formatDateJE + ' typeof: '+ typeof formatDateJE)
                                        log.debug('trandate', trandate + ' typeof: ' + typeof trandate)

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
                                            value: clienteGenerico
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

                                }


                            }
                            /*FIN PASO 3*/

                            /*PASO: 4: CREAR PAGO DE FACTURA CON JE CREADO*/
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
                            }
                            /*FIN PASO 4*/



                            /*PASO 5: VOID LIQUIDACION A CONFIRMAR*/
                            if (isvoid == true && unredeem == true) {

                                if (fidelidad == false) {

                                    var arraySearchParams = [];
                                    var objParam = new Object({});
                                    objParam.name = 'createdfrom';
                                    objParam.operator = 'ANYOF';
                                    objParam.values = idOv;
                                    arraySearchParams.push(objParam);

                                    var arrayResultDep = utilities.searchSavedPro('customsearch_3k_depositos_ov', arraySearchParams);
                                    var arregloDepositosOV = arrayResultDep.objRsponseFunction.array;

                                    log.debug('arregloDepositosOV', JSON.stringify(arregloDepositosOV));

                                    if (arregloDepositosOV.length > 0) {

                                        for (var t = 0; t < arregloDepositosOV.length; t++) {

                                            log.debug('arregloDepositosOV', JSON.stringify(arregloDepositosOV[t]))

                                            if (!utilities.isEmpty(arregloDepositosOV[t].custbody_3k_link_reg_liq_conf)) {

                                                var idLiqConfirmar = arregloDepositosOV[t].custbody_3k_link_reg_liq_conf;
                                                var fechaDeposito = arregloDepositosOV[t].trandate;
                                                var monedaDeposito = arregloDepositosOV[t].currency;
                                                var exchangeRateDeposito = arregloDepositosOV[t].exchangerate;
                                                var voidJournals = arregloDepositosOV[t].custbody_3k_reversal_journal;

                                                var importeTotalJE = (parseFloat(ingresoLiq) + parseFloat(deudaLiq))

                                                var journalReversal = record.create({
                                                    type: accion.toString(),
                                                    isDynamic: true
                                                })

                                                //INICIO SETEO DE CAMPOS CABECERA DEL JE

                                                journalReversal.setValue({
                                                    fieldId: 'subsidiary',
                                                    value: subsidiary
                                                })

                                                journalReversal.setValue({
                                                    fieldId: 'currency',
                                                    value: monedaDeposito
                                                })

                                                journalReversal.setValue({
                                                    fieldId: 'exchangerate',
                                                    value: exchangeRateDeposito
                                                })

                                                var dateDep = format.parse({
                                                    value: fechaDeposito,
                                                    type: format.Type.DATE,
                                                });

                                                log.debug('dateDep', dateDep)

                                                journalReversal.setValue({
                                                    fieldId: 'trandate',
                                                    value: dateDep
                                                });

                                                journalReversal.setValue({
                                                    fieldId: 'custbody_3k_ulid_servicios',
                                                    value: ulid
                                                });

                                                if (!utilities.isEmpty(sitioWeb)) {

                                                    journalReversal.setValue({
                                                        fieldId: 'custbody_cseg_3k_sitio_web_o',
                                                        value: sitioWeb
                                                    });

                                                }

                                                if (!utilities.isEmpty(sistema)) {

                                                    journalReversal.setValue({
                                                        fieldId: 'custbody_cseg_3k_sistema',
                                                        value: sistema
                                                    });

                                                }

                                                journalReversal.setValue({
                                                    fieldId: 'custbody_3k_liquidacion_confirmar_void',
                                                    value: idLiqConfirmar
                                                });

                                                //INCIO CREACION DE LINEAS DE JE

                                                //LINEA DE DEPOSITO DE CLIENTE
                                                journalReversal.selectNewLine({
                                                    sublistId: 'line'
                                                });

                                                journalReversal.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'account',
                                                    value: cuentaGral
                                                });

                                                journalReversal.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'credit',
                                                    value: parseFloat(importeTotalJE).toFixed(2)
                                                });



                                                journalReversal.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'entity',
                                                    value: customer
                                                });


                                                journalReversal.commitLine({
                                                    sublistId: 'line'
                                                })

                                                //LINEA INGRESO A CONFIRMAR

                                                journalReversal.selectNewLine({
                                                    sublistId: 'line'
                                                });

                                                journalReversal.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'account',
                                                    value: cuentaDebe
                                                });

                                                journalReversal.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'debit',
                                                    value: parseFloat(ingresoLiq).toFixed(2)
                                                });



                                                journalReversal.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'entity',
                                                    value: clienteLiq
                                                });


                                                journalReversal.commitLine({
                                                    sublistId: 'line'
                                                })

                                                //LINEA DEUDA A CONFIRMAR

                                                journalReversal.selectNewLine({
                                                    sublistId: 'line'
                                                });

                                                journalReversal.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'account',
                                                    value: cuentaHaber
                                                });

                                                journalReversal.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'debit',
                                                    value: parseFloat(deudaLiq).toFixed(2)
                                                });



                                                journalReversal.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'entity',
                                                    value: proveedorLiq
                                                });


                                                journalReversal.commitLine({
                                                    sublistId: 'line'
                                                })

                                                var idJEReversal = journalReversal.save();

                                                var reversalJEArray = []

                                                if (!utilities.isEmpty(voidJournals)) {

                                                    var splitVoid = voidJournals.split(",");
                                                    splitVoid.push(idJEReversal)
                                                    reversalJEArray = splitVoid
                                                }else{
                                                    reversalJEArray.push(idJEReversal)
                                                }

                                                log.debug('reversalJEArray', JSON.stringify(reversalJEArray))

                                                record.submitFields({
                                                    type: 'customtransaction_3k_liquidacion_conf',
                                                    id: idLiqConfirmar,
                                                    values: {
                                                        custbody_3k_reversal_journal: reversalJEArray
                                                    },
                                                    options: {
                                                        enableSourcing: true,
                                                        ignoreMandatoryFields: false
                                                    }
                                                })


                                                /*transaction.void({
                                                    id: arregloDepositosOV[t].custbody_3k_link_reg_liq_conf,
                                                    type: accion.toString()
                                                })*/

                                            }

                                        }

                                    }
                                }

                            }

                            /*FIN PASO 5*/


                            /************************* FIN NOT REDEEMED *************************************/
                            /*******************************************************************************/

                        }

                    }
                }




            }




        }

        function summarize(summary) {

            //SAVED SEARCH DE DEPOSITOS ASOCIADOS
            /*var arraySearchParams = [];
            var objParam = new Object({});
            objParam.name = 'createdfrom';
            objParam.operator = 'ANYOF';
            objParam.values = soRecord.id;
            arraySearchParams.push(objParam);

            var arrayResultDep = utilities.searchSavedPro('customsearch_3k_depositos_ov', arraySearchParams);
            var arregloDepositosOV = arrayResultDep.objRsponseFunction.array;

            log.debug('arregloDepositosOV', JSON.stringify(arregloDepositosOV));


            //APLICACION DE DEPOSITO CON ASIENTO
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


            }*/
            //FIN APLICACION DE DEPOSITO CON ASIENTO

            handleErrorIfAny(summary);

        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        }
    });
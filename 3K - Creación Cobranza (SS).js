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

define(['N/error', 'N/record', 'N/search', 'N/format', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */

    function (error, record, search, format, utilities, funcionalidades) {

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

                    log.audit('Creación Cobranza (SS)', 'INICIO - afterSubmit');

                    var recId = scriptContext.newRecord.id;
                    var recType = scriptContext.newRecord.type;

                    var objRecord = record.load({
                        type: recType,
                        id: recId,
                        isDynamic: true,
                    });

                    idOV = objRecord.id;

                    log.debug('Creación Cobranza (SS) - afterSubmit', 'ID Orden de Venta: ' + idOV);

                    //INICIO - CONSULTA INFORMACION ITEMS
                    var numLines = objRecord.getLineCount({
                        sublistId: 'item'
                    });

                    //log.debug('Creación Cobranza (SS) - afterSubmit', 'Cantidad Lineas Items: ' + numLines);

                    var impTotalItems = 0;
                    var impTotalMillas = 0;
                    var itemMillas = '';
                    var impTotalDeudaPagar = 0;
                    var impTotalImporteFacturar = 0;
                    var arrayAsientoLiqConfirmar = new Array();

                    var contadorDescuento = 0;
                    var totalDescuento = 0;

                    for (var i = 0; i < numLines; i++) {

                        var itemType = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemtype',
                            line: i
                        });

                        var esFidelidad = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_programa_fidelidad',
                            line: i
                        });

                        var impLinea = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'grossamt',
                            line: i
                        });

                        if (itemType == 'Discount') {
                            contadorDescuento++;
                            totalDescuento = totalDescuento + impLinea;
                            log.debug('Creación Cobranza (SS) - afterSubmit', 'contadorDescuento: ' + contadorDescuento + ', totalDescuento: ' + totalDescuento);
                        }


                        //Completar array de OV para enviar al Asiento de Liquidación a Confirmar
                        //Solo items de inventario, servicio y descuento
                        if (itemType == 'InvtPart' || itemType == 'Service' || itemType == 'Discount' && contadorDescuento == 1) {

                            var objAsientoLiqConfirmar = new Object({});

                            objAsientoLiqConfirmar.grossAmount = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'grossamt',
                                line: i
                            });

                            objAsientoLiqConfirmar.servicioImporteFacturar = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_importe_fact_liq',
                                line: i
                            });

                            objAsientoLiqConfirmar.servicioDeudaPagar = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_deuda_pagar',
                                line: i
                            });

                            objAsientoLiqConfirmar.clienteLiquidacion = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_cliente_liquidacion',
                                line: i
                            });

                            objAsientoLiqConfirmar.proveedorLiquidacion = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_proveedor_liquidacion',
                                line: i
                            });

                            objAsientoLiqConfirmar.cuentaItemDescuento = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_cta_devolucion_promo',
                                line: i
                            });

                            objAsientoLiqConfirmar.lineaDescuento = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_item_discount_line',
                                line: i
                            });

                            objAsientoLiqConfirmar.impBrutoDescuento = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_item_import_disc',
                                line: i
                            });

                            arrayAsientoLiqConfirmar.push(objAsientoLiqConfirmar);

                            /*var servicioImporteFacturar = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_importe_fact_liq',
                                line: i
                            });

                            var servicioDeudaPagar = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_deuda_pagar',
                                line: i
                            });*/

                        }

                        //log.debug('Creación Cobranza (SS) - afterSubmit', 'impTotalItems: ' + impTotalItems + ', impTotalMillasimpTotalMillas: ' + impTotalMillas);     
                        //log.debug('Creación Cobranza (SS) - afterSubmit', 'impLinea: ' + impLinea);     

                        if (esFidelidad) {
                            impTotalMillas = parseFloat(impTotalMillas, 10) + parseFloat(impLinea, 10);
                            itemMillas = true;
                        } else {
                            impTotalItems = parseFloat(impTotalItems, 10) + parseFloat(impLinea, 10);
                        }

                        /*if (!utilities.isEmpty(servicioDeudaPagar) && servicioDeudaPagar > 0) {
                            impTotalDeudaPagar = parseFloat(impTotalDeudaPagar, 10) + parseFloat(servicioDeudaPagar, 10);
                        }

                        if (!utilities.isEmpty(servicioImporteFacturar) && servicioImporteFacturar > 0) {
                            impTotalImporteFacturar = parseFloat(impTotalImporteFacturar, 10) + parseFloat(servicioImporteFacturar, 10);
                        }*/

                    }

                    log.debug('Creación Cobranza (SS) - afterSubmit', 'arrayAsientoLiqConfirmar: ' + JSON.stringify(arrayAsientoLiqConfirmar) + ', arrayAsientoLiqConfirmar.length: ' + arrayAsientoLiqConfirmar.length);
                    log.debug('Creación Cobranza (SS) - afterSubmit', 'TOTALES DESCUENTO - contadorDescuento: ' + contadorDescuento + ', totalDescuento: ' + totalDescuento);


                    log.debug('Creación Cobranza (SS) - afterSubmit', 'impTotalItems: ' + impTotalItems + ', impTotalMillas: ' + impTotalMillas + ', itemMillas: ' + itemMillas);
                    //log.debug('Creación Cobranza (SS) - afterSubmit', 'impTotalDeudaPagar: ' + impTotalDeudaPagar + ', impTotalImporteFacturar: ' + impTotalImporteFacturar);

                    //FIN - CONSULTA INFORMACION ITEMS

                    //INICIO - VERIFICAR SI SE GENERA COBRANZA
                    if (itemMillas == true && !utilities.isEmpty(impTotalMillas) && impTotalMillas > 0 && !utilities.isEmpty(impTotalItems) && impTotalItems == 0) {
                        var generaCobranza = false;
                    } else {
                        var generaCobranza = true;
                    }
                    //FIN - VERIFICAR SI SE GENERA COBRANZA

                    log.debug('Creación Cobranza (SS) - afterSubmit', 'generaCobranza: ' + generaCobranza);

                    if (generaCobranza == true) {
                        var objOV = new Object({});
                        var arrayOV = new Array();
                        var objFormasPago = new Object({});
                        var arrayFormasPago = new Array();

                        objOV.idOV = idOV;

                        objOV.idCliente = objRecord.getValue({
                            fieldId: 'entity'
                        });

                        objOV.monedaOV = objRecord.getValue({
                            fieldId: 'currency'
                        });

                        objOV.subsidiaria = objRecord.getValue({
                            fieldId: 'subsidiary'
                        });

                        objOV.tipoCambioOV = objRecord.getValue({
                            fieldId: 'exchangerate'
                        });

                        objOV.tipoCambioPago = objRecord.getValue({
                            fieldId: 'custbody_3k_tc_woow_ov'
                        });

                        objOV.monedaPago = objRecord.getValue({
                            fieldId: 'custbody_3k_moneda_pago_ov'
                        });

                        objFormasPago.formaPago = objRecord.getValue({
                            fieldId: 'custbody_3k_forma_pago'
                        });

                        objFormasPago.cantidadCuotas = objRecord.getValue({
                            fieldId: 'custbody_3k_cant_cuotas'
                        });

                        objFormasPago.importePago = objRecord.getValue({
                            fieldId: 'custbody_3k_importe_pago'
                        });

                        objOV.esServicio = objRecord.getValue({
                            fieldId: 'custbody_3k_ov_servicio'
                        });

                        objOV.esTravel = objRecord.getValue({
                            fieldId: 'custbody_3k_ov_travel'
                        });

                        objOV.sistema = objRecord.getValue({
                            fieldId: 'custbody_cseg_3k_sistema'
                        });

                        objOV.sitioWeb = objRecord.getValue({
                            fieldId: 'custbody_cseg_3k_sitio_web_o'
                        });

                        objOV.esFidelidad = objRecord.getValue({
                            fieldId: 'custbody_3k_programa_fidelidad'
                        });

                        arrayOV.push(objOV);
                        arrayFormasPago.push(objFormasPago);

                        log.debug('Creación Cobranza (SS) - afterSubmit', 'arrayOV: ' + JSON.stringify(arrayOV) + ', arrayOV.length: ' + arrayOV.length);
                        log.debug('Creación Cobranza (SS) - afterSubmit', 'arrayFormasPago: ' + JSON.stringify(arrayFormasPago) + ', arrayFormasPago.length: ' + arrayFormasPago.length);

                        //INICIO - CONSULTAR/LLENAR ARRAY DE FORMAS DE PAGO

                        /*var cantidadLineasFormaPago = objRecord.getLineCount({
                            sublistId: 'recmachcustrecord_3k_formas_de_pago_ov'
                        });

                        var arrayFormasPago = new Array();*/

                        //log.debug('Creación Cobranza (SS) - afterSubmit', 'cantidadLineasFormaPago: ' + cantidadLineasFormaPago);

                        /*if (cantidadLineasFormaPago > 0) {

                            for (var i = 0; i < cantidadLineasFormaPago; i++) {
                                var objFormasPago = new Object({});

                                var lineNum = objRecord.selectLine({
                                    sublistId: 'recmachcustrecord_3k_formas_de_pago_ov',
                                    line: i
                                });

                                objFormasPago.internalID = objRecord.getCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_3k_formas_de_pago_ov',
                                    fieldId: 'internalid'
                                });

                                objFormasPago.formaPago = objRecord.getCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_3k_formas_de_pago_ov',
                                    fieldId: 'custrecord_3k_formas_de_pago_forma'
                                });

                                objFormasPago.importePago = objRecord.getCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_3k_formas_de_pago_ov',
                                    fieldId: 'custrecord_3k_formas_de_pago_importe'
                                });

                                objFormasPago.cantidadCuotas = objRecord.getCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_3k_formas_de_pago_ov',
                                    fieldId: 'custrecord_3k_formas_de_pago_cuotas'
                                });

                                arrayFormasPago.push(objFormasPago);
                            }

                            log.debug('Creación Cobranza (SS) - afterSubmit', 'arrayFormasPago: ' + JSON.stringify(arrayFormasPago) + ', arrayFormasPago.length: ' + arrayFormasPago.length);

                        }*/

                        //FIN - CONSULTAR/LLENAR ARRAY DE FORMAS DE PAGO

                        if (!utilities.isEmpty(arrayOV) && arrayOV.length > 0 && !utilities.isEmpty(arrayFormasPago) && arrayFormasPago.length) {

                            var respuestaCrearDepositos = funcionalidades.crearDepositos(arrayOV, arrayFormasPago);
                            //log.debug('Creación Cobranza (SS) - afterSubmit', 'respuestaCrearDepositos: ' + JSON.stringify(respuestaCrearDepositos));

                            if (respuestaCrearDepositos.error) {
                                return JSON.stringify(respuestaCrearDepositos);
                            }

                            var idDeposito = respuestaCrearDepositos.depositos[0].idDeposito;

                            respuesta = respuestaCrearDepositos;

                            //Si la OV es de Servicio y No corresponde a Programa de Fidelidad, genera asiento de Deuda a Pagar e Ingreso a Confirmar
                            if (objOV.esServicio == true && objOV.esFidelidad == false && !utilities.isEmpty(arrayAsientoLiqConfirmar)) {
                                //var asientoDeudaIngreso = crearAsientoDeudaIngreso(impTotalDeudaPagar, impTotalImporteFacturar, objOV.tipoCambioOV, objOV.monedaOV, objOV.subsidiaria, objOV.sistema, objOV.sitioWeb, objOV.idCliente);
                                var asientoDeudaIngreso = crearAsientoDeudaIngreso(arrayAsientoLiqConfirmar, objOV.tipoCambioOV, objOV.monedaOV, objOV.subsidiaria, objOV.sistema, objOV.sitioWeb, objOV.idCliente, contadorDescuento, totalDescuento);
                                log.debug('Creación Cobranza (SS) - afterSubmit', 'asientoDeudaIngreso : ' + asientoDeudaIngreso);

                                var updCobranza = record.submitFields({
                                    type: record.Type.CUSTOMER_DEPOSIT,
                                    id: idDeposito,
                                    values: {
                                        custbody_3k_link_reg_liq_conf: asientoDeudaIngreso,
                                    },
                                    options: {
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    }
                                });

                            }
                        }

                    }

                } catch (excepcion) {
                    error = true;
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'UCOB001';
                    respuestaParcial.mensaje += excepcion;
                    respuesta.detalle.push(respuestaParcial);
                    log.error('Creación Cobranza (SS) - afterSubmit', 'UCOB001 - Excepcion : ' + excepcion);
                }

                log.audit('Creación Cobranza (SS)', 'FIN - afterSubmit');

            }
        }

        function crearAsientoDeudaIngreso(arrayAsientoLiqConfirmar, tipoCambio, moneda, subsidiaria, sistema, sitioWeb, idCliente, contadorDescuento, totalDescuento) {


            log.audit('crearAsientoDeudaIngreso', 'INICIO - Crear Asiento Deuda e Ingreso');
            //log.debug('crearAsientoDeudaIngreso', 'Parámetros: tipoCambio: ' + tipoCambio + ', impTotalImporteFacturar: ' + impTotalImporteFacturar + ', impTotalDeudaPagar: ' + impTotalDeudaPagar + ', moneda: ' + moneda + ', subsidiaria: ' + subsidiaria + ', sistema: ' + sistema + ', sitioWeb: ' + sitioWeb + ', idCliente: ' + idCliente);
            log.debug('crearAsientoDeudaIngreso', 'Parámetros: tipoCambio: ' + tipoCambio + ', moneda: ' + moneda + ', subsidiaria: ' + subsidiaria + ', sistema: ' + sistema + ', sitioWeb: ' + sitioWeb + ', idCliente: ' + idCliente);
            log.debug('crearAsientoDeudaIngreso', 'Parámetros: arrayAsientoLiqConfirmar: ' + JSON.stringify(arrayAsientoLiqConfirmar) + ' , arrayAsientoLiqConfirmar.length: ' + arrayAsientoLiqConfirmar.length);


            var respuesta = new Object();
            respuesta.error = false;
            respuesta.detalle = new Array();

            var idCuentaIngresoAConfirmar = '';
            var idCuentaDeudaAConfirmar = '';
            var idCuentaIngresoInicial = '';
            var recordIdLiqConf = '';

            var impTotalImporteFacturar = '';
            var impTotalDeudaPagar = '';
            var clienteLiquidacion = '';
            var proveedorLiquidacion = '';
            var grossAmount = '';
            var lineaDescuento = '';
            var cuentaItemDescuento = '';
            var impBrutoDescuento = '';

            try {

                if (!utilities.isEmpty(moneda)) {

                    // INICIO - Obtener Cuentas Contables de Confirmacion
                    var filtrosMoneda = new Array();

                    var filtroMon = new Object();
                    filtroMon.name = 'custrecord_3k_config_ctas_cup_mon';
                    filtroMon.operator = 'IS';
                    filtroMon.values = moneda;
                    filtrosMoneda.push(filtroMon);

                    var searchConfig = utilities.searchSavedPro('customsearch_3k_config_ctas_cupones', filtrosMoneda);
                    if (!utilities.isEmpty(searchConfig) && searchConfig.error == false) {
                        if (!utilities.isEmpty(searchConfig.objRsponseFunction.result) && searchConfig.objRsponseFunction.result.length > 0) {
                            idCuentaIngresoAConfirmar = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[3] });
                            idCuentaDeudaAConfirmar = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[4] });
                            idCuentaIngresoInicial = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[2] });
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
                } else {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SCUP054';
                    respuestaParcial.mensaje = 'No se encuentra Configurada la Moneda del Cupon';
                    respuesta.detalle.push(respuestaParcial);
                }

                objRecordLiqConf = record.create({
                    type: 'customtransaction_3k_liquidacion_conf',
                    isDynamic: true,
                });

                var cuentaItemCliente = idCuentaIngresoInicial;

                if (!utilities.isEmpty(objRecordLiqConf)) {
                    objRecordLiqConf.setValue({
                        fieldId: 'subsidiary',
                        value: subsidiaria
                    });
                    objRecordLiqConf.setValue({
                        fieldId: 'currency',
                        value: moneda
                    });
                    objRecordLiqConf.setValue({
                        fieldId: 'exchangerate',
                        value: tipoCambio
                    });
                    objRecordLiqConf.setValue({
                        fieldId: 'custbody_cseg_3k_sitio_web_o',
                        value: sitioWeb
                    });
                    objRecordLiqConf.setValue({
                        fieldId: 'custbody_cseg_3k_sistema',
                        value: sistema
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

                    for (var i = 0; i < arrayAsientoLiqConfirmar.length; i++) {

                        impTotalImporteFacturar = arrayAsientoLiqConfirmar[i].servicioImporteFacturar
                        impTotalDeudaPagar = arrayAsientoLiqConfirmar[i].servicioDeudaPagar;
                        clienteLiquidacion = arrayAsientoLiqConfirmar[i].clienteLiquidacion;
                        proveedorLiquidacion = arrayAsientoLiqConfirmar[i].proveedorLiquidacion;
                        grossAmount = arrayAsientoLiqConfirmar[i].grossAmount;
                        lineaDescuento = arrayAsientoLiqConfirmar[i].lineaDescuento;
                        cuentaItemDescuento = arrayAsientoLiqConfirmar[i].cuentaItemDescuento;;
                        impBrutoDescuento = arrayAsientoLiqConfirmar[i].impBrutoDescuento;
                        var idCuentaInicial = '';

                        log.debug('crearAsientoDeudaIngreso', 'grossAmount: ' + grossAmount);

                        if (lineaDescuento) {
                            log.debug('crearAsientoDeudaIngreso', 'contadorDescuento: ' + contadorDescuento + ', totalDescuento: ' + totalDescuento);
                            //Si hay mas de una linea de descuento, se agrega la linea al asiento con la sumatoria de los descuentos
                            if (contadorDescuento > 1) {
                                importeTotal = totalDescuento * (-1);
                            } else {
                                importeTotal = grossAmount * (-1);
                            }
                            idCuentaInicial = cuentaItemDescuento;
                        } else {
                            //importeTotal = parseFloat(impTotalDeudaPagar, 10) + parseFloat(impTotalImporteFacturar, 10);
                            importeTotal = grossAmount;
                            if (!utilities.isEmpty(impBrutoDescuento)) {
                                importeTotal = importeTotal - impBrutoDescuento;
                            }
                            idCuentaInicial = idCuentaIngresoInicial;
                        }

                        log.debug('crearAsientoDeudaIngreso', 'importeTotal: ' + importeTotal);

                        if (importeTotal != 0.00) {

                            log.debug('crearAsientoDeudaIngreso', 'Inicio - Agregando linea Principal');

                            objRecordLiqConf.selectNewLine({
                                sublistId: 'line'
                            });

                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                value: idCuentaInicial
                            });


                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'currency',
                                value: moneda
                            });

                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'exchangerate',
                                value: tipoCambio
                            });

                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'debit',
                                value: importeTotal
                            });

                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'entity',
                                value: idCliente
                            });

                            objRecordLiqConf.commitLine({
                                sublistId: 'line'
                            });

                            log.debug('crearAsientoDeudaIngreso', 'Fin - Agregando linea Principal');

                        }

                        if (!lineaDescuento && !utilities.isEmpty(impTotalDeudaPagar) && !isNaN(parseFloat(impTotalDeudaPagar, 10)) && impTotalDeudaPagar > 0) {
                            log.debug('crearAsientoDeudaIngreso', 'Inicio - Agregando linea Deuda a Pagar');
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
                                value: moneda
                            });

                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'exchangerate',
                                value: tipoCambio
                            });

                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'credit',
                                value: impTotalDeudaPagar
                            });

                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'entity',
                                value: proveedorLiquidacion
                            });

                            objRecordLiqConf.commitLine({
                                sublistId: 'line'
                            });
                            log.debug('crearAsientoDeudaIngreso', 'Fin - Agregando linea Deuda a Pagar');

                        }

                        if (!lineaDescuento && !utilities.isEmpty(impTotalImporteFacturar) && !isNaN(parseFloat(impTotalImporteFacturar, 10)) && impTotalImporteFacturar > 0) {
                            log.debug('crearAsientoDeudaIngreso', 'Inicio - Agregando linea Importe a Facturar');

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
                                value: moneda
                            });

                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'exchangerate',
                                value: tipoCambio
                            });

                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'credit',
                                value: impTotalImporteFacturar
                            });

                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'entity',
                                value: clienteLiquidacion
                            });

                            objRecordLiqConf.commitLine({
                                sublistId: 'line'
                            });
                            log.debug('crearAsientoDeudaIngreso', 'Fin - Agregando linea Importe a Facturar');
                        }

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
                        return respuesta.idRegLiqConf;
                    }
                } else {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SCUP009';
                    respuestaParcial.mensaje = 'Error Grabando Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : No se pudo crear el Registro de Liquidacion A Confirmar';
                    respuesta.detalle.push(respuestaParcial);
                }

            } catch (excepcion) {
                error = true;
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'UADI001';
                respuestaParcial.mensaje += excepcion;
                respuesta.detalle.push(respuestaParcial);
                log.error('crearAsientoDeudaIngreso', 'UADI001 - Excepcion : ' + excepcion);
            }

            log.audit('crearAsientoDeudaIngreso', 'FIN - Crear Asiento Deuda e Ingreso');

        }

        return {
            afterSubmit: afterSubmit
        };

    });


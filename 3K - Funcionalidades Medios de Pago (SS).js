/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/

define(['N/error', 'N/record', 'N/search', 'N/format', 'N/transaction', '3K/utilities'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */

    function(error, record, search, format, transaction, utilities) {

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

            log.audit('Inicio Cobranza', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

            var idCobranza = '';
            var pagoEnDiferenteMoneda = false;
            var cuentaContableFinal = '';
            var monedaPrincipalSubsidiaria = '';

            var respuesta = new Object();
            respuesta.idConciliacion = '';
            respuesta.idCobranza = '';
            respuesta.idRegMedioPago = '';
            respuesta.error = false;
            respuesta.detalle = new Array();

            var recordIdMedioPago = '';
            var objRecordMedioPago = '';

            var estadoEnviadoCupon = '';

            var importeTotalCustomTransaction = 0;

            if (scriptContext.type == 'create' || scriptContext.type == 'edit') {

                log.audit('Inicio Grabar Cobranza', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

                try {
                    var informacionMedioPago = new Object();
                    informacionMedioPago.idInterno = '';
                    informacionMedioPago.fechaInicio = '';
                    informacionMedioPago.fechaFin = '';
                    informacionMedioPago.cantidadCuotas = '';
                    informacionMedioPago.importeCustomTransaction = 0;
                    informacionMedioPago.detalle = new Array();

                    var recordCobranza = '';
                    recordCobranza = scriptContext.newRecord;
                    /*if (scriptContext.type == 'create') {
                        recordCobranza = scriptContext.newRecord;
                    }
                    if (scriptContext.type == 'edit') {
                        recordCobranza = scriptContext.oldRecord;
                    }*/
                    if (!utilities.isEmpty(recordCobranza)) {
                        idCobranza = recordCobranza.id;
                        respuesta.idCobranza = idCobranza;
                        var tipoTransaccion = recordCobranza.type;
                        if (!utilities.isEmpty(idCobranza) && !utilities.isEmpty(tipoTransaccion)) {
                            log.debug('COBRANZA', 'ID Cobranza : ' + idCobranza);

                            var subsidiaria = recordCobranza.getValue({
                                fieldId: 'subsidiary'
                            });

                            var fecha = recordCobranza.getValue({
                                fieldId: 'trandate'
                            });

                            var sitioWeb = recordCobranza.getValue({
                                fieldId: 'custbody_cseg_3k_sitio_web_o'
                            });
                            var formaPago = recordCobranza.getValue({
                                fieldId: 'paymentmethod'
                            });

                            var importePago = recordCobranza.getValue({
                                fieldId: 'payment'
                            });

                            var moneda = recordCobranza.getValue({
                                fieldId: 'currency'
                            });

                            var monedaPago = recordCobranza.getValue({
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

                            var tipoCambio = recordCobranza.getValue({
                                fieldId: 'exchangerate'
                            });

                            var tipoCambioPago = recordCobranza.getValue({
                                fieldId: 'custbody_3k_tipo_cambio_pago'
                            });

                            if (!utilities.isEmpty(tipoCambioPago)) {
                                tipoCambio = tipoCambioPago;
                            }

                            var cuenta = recordCobranza.getValue({
                                fieldId: 'account'
                            });

                            var idRegistroMedioPago = recordCobranza.getValue({
                                fieldId: 'custbody_3k_link_medio_pago'
                            });

                            var idRegistroConciliacion = recordCobranza.getValue({
                                fieldId: 'custbody_3k_link_reg_conc_pagos'
                            });

                            log.debug('COBRANZA', 'Pago en Diferente Moneda : ' + pagoEnDiferenteMoneda + ' - Moneda Cobranza : ' + moneda + ' - Moneda Pago : ' + monedaPago);

                            if (pagoEnDiferenteMoneda == true) {
                                // INICIO - Obtener Cuenta Contable A Utilizar para la Moneda del Pago
                                var filtrosMedioPagoMoneda = new Array();

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
                                                if (respuesta.error == false) {
                                                    var importeUtilizar = '';
                                                    var monedaUtilizar = '';
                                                    var importeUtilizarMedioPago='';
                                                    if (moneda != monedaPrincipalSubsidiaria) {
                                                        monedaUtilizar = moneda;
                                                        importeUtilizarMedioPago = parseFloat(importePago, 10) * parseFloat(tipoCambio, 10);
                                                        importeUtilizar = parseFloat(importePago, 10);
                                                    } else {
                                                        monedaUtilizar = monedaPago;
                                                        importeUtilizar = parseFloat(importePago, 10) / parseFloat(tipoCambio, 10);
                                                        importeUtilizarMedioPago = parseFloat(importeUtilizar, 10);
                                                    }
                                                    log.debug('Cobranza', 'Moneda Pago : ' + monedaUtilizar + ' - Importe Pago : ' + importeUtilizar);

                                                    log.debug('Cobranza', 'Cuenta Deposito : ' + cuenta + ' - Cuenta Final : ' + cuentaContableFinal);

                                                    if (!utilities.isEmpty(importeUtilizar) && !isNaN(parseFloat(importeUtilizar, 10)) && parseFloat(importeUtilizar, 10) > 0.00) {
                                                        respuesta = generarCustomTransactionConciliacion(scriptContext, subsidiaria, fecha, monedaUtilizar, tipoCambio, idCobranza, idRegistroConciliacion, cuenta, cuentaContableFinal, importeUtilizar);
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
                                        respuestaParcial.mensaje = 'Error Grabando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se encontro un Medio de Pago para la Fecha : ' + fechaLocal + ' - Sitio Web ID Interno : ' + sitioWeb + ' - Forma de Pago ID Interno : ' + formaPago;
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
                            }

                            if (respuesta.error == false) {

                                if (!utilities.isEmpty(sitioWeb) && !utilities.isEmpty(formaPago) && !utilities.isEmpty(cuenta) && !utilities.isEmpty(importePago) && importePago > 0) {

                                    var filtrosMedioPago = new Array();
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
                                                        objRecordMedioPago.setValue({ fieldId: 'subsidiary', value: subsidiaria });
                                                        objRecordMedioPago.setValue({ fieldId: 'trandate', value: fecha });
                                                        objRecordMedioPago.setValue({ fieldId: 'currency', value: moneda });
                                                        objRecordMedioPago.setValue({ fieldId: 'exchangerate', value: tipoCambio });
                                                        objRecordMedioPago.setValue({ fieldId: 'custbody_3k_deposito', value: idCobranza });

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
                                                    objRecordCobranza = record.load({
                                                        type: tipoTransaccion,
                                                        id: idCobranza,
                                                        isDynamic: true,
                                                    });
                                                    if (!utilities.isEmpty(objRecordCobranza)) {
                                                        objRecordCobranza.setValue({ fieldId: 'custbody_3k_link_medio_pago', value: recordIdMedioPago });
                                                        //objRecordCobranza.setValue({ fieldId: 'custbody_3k_cant_cuotas', value: informacionMedioPago.cantidadCuotas });
                                                        objRecordCobranza.setValue({ fieldId: 'custbody_3k_medio_pago', value: informacionMedioPago.idInterno });

                                                        if (respuesta.error == false && !utilities.isEmpty(respuesta.idConciliacion)) {
                                                            objRecordCobranza.setValue({ fieldId: 'custbody_3k_link_reg_conc_pagos', value: respuesta.idConciliacion });
                                                        }

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
                                                    } else {
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'SDEP013';
                                                        respuestaParcial.mensaje = 'Error Actualizando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se pudo cargar el Registro de la Cobranza';
                                                        respuesta.detalle.push(respuestaParcial);
                                                    }
                                                    if (utilities.isEmpty(idRecordCobranza)) {
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'SDEP013';
                                                        respuestaParcial.mensaje = 'Error Actualizando Cobranza con ID Interno : ' + idCobranza + ' - Error : No se recibio el ID Interno del Registro de Cobranza Actualizada';
                                                        respuesta.detalle.push(respuestaParcial);
                                                    }
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
                    } else {
                        var mensaje = 'Error obteniendo Registro de Cobranza';
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'SDEP003';
                        respuestaParcial.mensaje = 'Error Grabando la Cobranza con ID Interno : ' + idCobranza + ' - Error : ' + mensaje;
                        respuesta.detalle.push(respuestaParcial);
                    }
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

                if (respuesta.error == true && !utilities.isEmpty(respuesta.detalle) && respuesta.detalle.length > 0) {
                    log.error('Grabar Cobranza', 'Error Grabado la Cobranza con ID Interno : ' + idCobranza + ' Error : ' + JSON.stringify(respuesta));
                    throw utilities.crearError('SDEP001', 'Error Grabando la Cobranza con ID Interno : ' + idCobranza + ' - Error : ' + JSON.stringify(respuesta));
                }


                log.audit('Fin Grabar Cobranza', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);
            }

            log.audit('Fin Cobranza', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

        }

        function beforeSubmit(scriptContext) {

            log.audit('Inicio Cobranza', 'BeforeSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

            var idCobranza = '';

            var respuesta = new Object();
            respuesta.idCobranza = '';
            respuesta.idRegMedioPago = '';

            respuesta.error = false;
            respuesta.detalle = new Array();

            var recordIdMedioPago = '';

            if (scriptContext.type == 'delete') {

                log.audit('Inicio Eliminar Cobranza', 'BeforeSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

                try {

                    // INICIO - Anular Custom Transactions
                    var informacionMedioPago = new Object();
                    var recordCobranza = scriptContext.oldRecord
                    if (!utilities.isEmpty(recordCobranza)) {
                        idCobranza = recordCobranza.id;
                        respuesta.idCobranza = idCobranza;
                        var tipoTransaccion = recordCobranza.type;

                        if (!utilities.isEmpty(idCobranza) && !utilities.isEmpty(tipoTransaccion)) {

                            log.audit('Eliminar Cobranza', 'BeforeSubmit - Tipo : Servidor - Evento : ' + scriptContext.type + ' - ID Interno Cobranza : ' + idCobranza);

                            var idRegistroMedioPago = recordCobranza.getValue({
                                fieldId: 'custbody_3k_link_medio_pago'
                            });

                            var idRegistroConciliacion = recordCobranza.getValue({
                                fieldId: 'custbody_3k_link_reg_conc_pagos'
                            });

                            var idRegistroConciliacionImpacto = recordCobranza.getValue({
                                fieldId: 'custbody_3k_link_reg_conc_imp'
                            });

                            // INICIO - Anular Registro CONCILIACION IMPACTO
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
                            respuestaParcial.codigo = 'SDEP023';
                            respuestaParcial.mensaje = 'Error Eliminando la Cobranza con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
                            respuesta.detalle.push(respuestaParcial);
                        }
                    } else {
                        var mensaje = 'Error obteniendo Registro de Cobranza';
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'SDEP022';
                        respuestaParcial.mensaje = 'Error Eliminando la Cobranza con ID Interno : ' + idCobranza + ' - Error : ' + mensaje;
                        respuesta.detalle.push(respuestaParcial);
                    }
                    // FIN - Anular Custom Transactions

                } catch (excepcionGeneral) {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SDEP021';
                    respuestaParcial.mensaje = 'Excepcion Eliminando Cobranza Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionGeneral.message.toString();
                    respuesta.detalle.push(respuestaParcial);

                }

                log.debug('Eliminar Cobranza', 'Respuesta : ' + JSON.stringify(respuesta));

                if (respuesta.error == true && !utilities.isEmpty(respuesta.detalle) && respuesta.detalle.length > 0) {
                    log.error('Eliminar Cobranza', 'Error Eliminando la Cobranza con ID Interno : ' + idCobranza + ' Error : ' + JSON.stringify(respuesta));
                    throw utilities.crearError('SDEP026', 'Error Eliminando la Cobranza con ID Interno : ' + idCobranza + ' - Error : ' + JSON.stringify(respuesta));
                }

                log.audit('Fin EliminarCobranza', 'BeforeSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

            }

            log.audit('Fin Cobranza', 'BeforeSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

        }

        function generarCustomTransactionConciliacion(scriptContext, subsidiaria, fecha, monedaUtilizar, tipoCambio, idCobranza, idRegistroConciliacion, cuentaClearing, cuentaContableFinal, importe) {
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
                            type: 'customtransaction_3k_conc_pagos',
                            id: idRegistroMedioPago,
                            isDynamic: true
                        });
                    } else {
                        objRecorConciliacion = record.create({
                            type: 'customtransaction_3k_conc_pagos',
                            isDynamic: true
                        });
                    }
                } catch (excepcionCreateConciliacion) {
                    var mensaje = 'Excepcion Creando Registro de Conciliacion Pago para la Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionCreateConciliacion.message.toString();
                    if (scriptContext.type == 'edit') {
                        mensaje = 'Excepcion Editando Registro de Conciliacion con ID Interno : ' + idRegistroConciliacion + ' para la Cobranza con ID Interno : ' + idCobranza + ' - Excepcion : ' + excepcionCreateConciliacion.message.toString();
                    }
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SDEP029';
                    respuestaParcial.mensaje = mensaje;
                    respuesta.detalle.push(respuestaParcial);
                }
                if (!utilities.isEmpty(objRecorConciliacion)) {
                    registroCreado = true;
                    objRecorConciliacion.setValue({ fieldId: 'subsidiary', value: subsidiaria });
                    objRecorConciliacion.setValue({ fieldId: 'trandate', value: fecha });
                    objRecorConciliacion.setValue({ fieldId: 'currency', value: monedaUtilizar });
                    objRecorConciliacion.setValue({ fieldId: 'exchangerate', value: tipoCambio });
                    objRecorConciliacion.setValue({ fieldId: 'custbody_3k_deposito', value: idCobranza });

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
                        value: cuentaContableFinal
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

        return {
            afterSubmit: afterSubmit,
            beforeSubmit: beforeSubmit
        };

    });

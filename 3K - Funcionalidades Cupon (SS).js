/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities',
        '3K/funcionalidadesURU': './3K - Funcionalidades URU',
        '3K/funcionalidadesOV': './3K - Funcionalidades OV'
    }
});*/

define(['N/error', 'N/record', 'N/search', 'N/runtime', 'N/transaction', 'N/format', '3K/utilities', '3K/funcionalidadesURU', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */

    function(error, record, search, runtime, transaction, format, utilities, funcionalidadesURU, funcionalidades) {

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

            var idCupon = '';
            var tipoTransaccion = '';

            var respuesta = new Object();
            respuesta.idCupon = '';
            respuesta.idRegLiqConf = '';
            respuesta.idRegLiqGen = '';
            respuesta.error = false;
            respuesta.detalle = new Array();

            var informacionCupon = new Object();
            informacionCupon.idInterno = '';
            informacionCupon.tipoTransaccion = '';
            informacionCupon.registro = '';

            try {
                log.audit('Inicio Grabar Cupon', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);
                var executionContext = runtime.executionContext;
                log.audit('Inicio Grabar Cupon', 'AftereSubmit - Contexto : ' + executionContext);
                //if ((executionContext != "RESTLET")){
                if (scriptContext.type == 'create' || scriptContext.type == 'edit' || scriptContext.type == 'xedit') {
                    idCupon = scriptContext.newRecord.id;
                    tipoTransaccion = scriptContext.newRecord.type;
                    log.debug('Grabar Cupon', 'tipoTransaccion: ' + tipoTransaccion);
                    if (!utilities.isEmpty(idCupon) && !utilities.isEmpty(tipoTransaccion)) {
                        respuesta.idCupon = idCupon;
                        informacionCupon.idInterno = idCupon;
                        informacionCupon.tipoTransaccion = tipoTransaccion;

                        log.audit('Grabar Cupon', 'AftereSubmit - ID Cupon : ' + idCupon);

                        var objRecord = record.load({
                            type: tipoTransaccion,
                            id: idCupon,
                            isDynamic: true,
                        });
                        if (!utilities.isEmpty(objRecord)) {

                            informacionCupon.registro = objRecord;

                            var accionCupon = objRecord.getValue({
                                fieldId: 'custrecord_3k_cupon_cod_acc'
                            });

                            var cuponServicio = objRecord.getValue({
                                fieldId: 'custrecord_3k_cupones_servicio'
                            });

                            var cuponLiquidado = objRecord.getValue({
                                fieldId: 'custrecord_3k_cupon_liquidado'
                            });

                            var procNewFinalizado = objRecord.getValue({
                                fieldId: 'custrecord_3k_cupon_proc_new_fin'
                            });

                            var cuponTravel = objRecord.getValue({
                                fieldId: 'custrecord_3k_cupon_campana_travel'
                            });

                            log.debug('Grabar Cupon', 'Cupon de Servicio : ' + cuponServicio + ' - Cupon Travel : ' + cuponTravel + ' - Codigo de Accion : ' + accionCupon + ' - Cupon Liquidado : ' + cuponLiquidado);

                            //if (cuponServicio == true && cuponLiquidado == false) {
                            if (cuponServicio == true && cuponTravel != true) {
                                if (!utilities.isEmpty(accionCupon)) {
                                    switch (accionCupon) {

                                        //New
                                        case 'NE':
                                            if ((executionContext != "RESTLET")) {
                                                if (cuponLiquidado == false) {
                                                    respuesta = CuponNew(informacionCupon);
                                                }
                                            }
                                            break;
                                            //Devolucion Parcial
                                        case 'AC':
                                            if ((executionContext != "RESTLET")) {
                                                if (cuponLiquidado == false) {
                                                    respuesta = CuponNew(informacionCupon);
                                                }
                                                break;
                                            }
                                            //Devolucion Parcial
                                        case 'RP':
                                            respuesta = CuponDevolucion(informacionCupon);
                                            break;
                                            //Devolucion Completa
                                        case 'RC':
                                            respuesta = CuponDevolucion(informacionCupon);
                                            break;
                                            //Devolucion Efectivo
                                        case 'DE':
                                            respuesta = CuponDevolucion(informacionCupon);
                                            break;
                                            //Devolucion Credito
                                        case 'DC':
                                            respuesta = CuponDevolucion(informacionCupon);
                                            break;
                                            //Reservado
                                        case 'RS':
                                            //respuesta = CuponDevolucion(informacionCupon);
                                            break;
                                            //Devolucion Efectivo Reservado
                                        case 'RR':
                                            //respuesta = CuponDevolucion(informacionCupon);
                                            break;
                                            //Devolucion Tarjeta Credito
                                        case 'DT':
                                            respuesta = CuponDevolucion(informacionCupon);
                                            break;
                                        case 'US':
                                            if ((executionContext != "RESTLET")) {
                                                if (cuponLiquidado == false) {
                                                    if (procNewFinalizado != true) {
                                                        respuesta = CuponNew(informacionCupon);
                                                    }
                                                    if (respuesta.error != true) {
                                                        var objRecord = record.load({
                                                            type: tipoTransaccion,
                                                            id: idCupon,
                                                            isDynamic: true,
                                                        });
                                                        if (!utilities.isEmpty(objRecord)) {
                                                            informacionCupon.registro = objRecord;
                                                            respuesta = CuponUsed(informacionCupon);
                                                        } else {
                                                            var mensaje = 'Error cargando Registro de Cupon';
                                                            respuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SCUP004';
                                                            respuestaParcial.mensaje = 'Error Actualizando Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : ' + mensaje;
                                                            respuesta.detalle.push(respuestaParcial);
                                                        }
                                                    }
                                                }
                                            }
                                            break;
                                        default:
                                            break;
                                    }
                                } else {
                                    var mensaje = 'No se recibio Informacion del Tipo de Accion A Realizar';
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'SCUP005';
                                    respuestaParcial.mensaje = 'Error Actualizando Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : ' + mensaje;
                                    respuesta.detalle.push(respuestaParcial);
                                }
                            }
                            if (cuponServicio == false || cuponTravel == true) {
                                if (!utilities.isEmpty(accionCupon) && accionCupon == 'US') {
                                    var fechaUso = objRecord.getValue({
                                        fieldId: 'custrecord_3k_cupon_fecha_uso'
                                    });
                                    var fechaUsoStr = objRecord.getValue({
                                        fieldId: 'custrecord_3k_cupon_fecha_uso_str'
                                    });
                                    var fechaServidor = new Date();
                                    if (utilities.isEmpty(fechaUso) && !utilities.isEmpty(fechaUsoStr)) {
                                        var fechaUsoDate = format.parse({
                                            value: fechaUsoStr,
                                            type: format.Type.DATETIME,
                                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                                        });

                                        informacionCupon.registro.setValue({ fieldId: 'custrecord_3k_cupon_fecha_uso', value: fechaUsoDate });
                                        try {
                                            var recordCuponProducto = informacionCupon.registro.save({
                                                enableSourcing: true,
                                                ignoreMandatoryFields: false
                                            });
                                        } catch (excepcionSaveCupon) {
                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'SCUP039';
                                            respuestaParcial.mensaje = 'Excepcion Grabando Registro de Cupon con ID Interno : ' + respuesta.idCupon + ' - Excepcion : ' + excepcionSaveCupon.message.toString();
                                            respuesta.detalle.push(respuestaParcial);
                                        }
                                        if (utilities.isEmpty(recordCuponProducto)) {
                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'SCUP040';
                                            respuestaParcial.mensaje = 'Error Grabando Registro de Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : No se recibio el ID Interno del Registro de Cupon Actualizado';
                                            respuesta.detalle.push(respuestaParcial);
                                        } else {
                                            log.debug('Grabar Cupon', 'Cupon Grabado con ID : ' + recordCuponProducto);
                                        }
                                    }
                                }
                            }
                        } else {
                            var mensaje = 'Error cargando Registro de Cupon';
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SCUP004';
                            respuestaParcial.mensaje = 'Error Actualizando Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : ' + mensaje;
                            respuesta.detalle.push(respuestaParcial);
                        }
                    } else {
                        var mensaje = 'Error obteniendo la siguiente informacion del Cupon : ';
                        if (utilities.isEmpty(idCupon)) {
                            mensaje = mensaje + " ID Interno del Cupon / ";
                        }
                        if (utilities.isEmpty(tipoTransaccion)) {
                            mensaje = mensaje + " Tipo de transaccion / ";
                        }
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'SCUP003';
                        respuestaParcial.mensaje = 'Error Actualizando Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : ' + mensaje;
                        respuesta.detalle.push(respuestaParcial);
                    }
                }
                //}

            } catch (excepcionGeneral) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'SCUP002';
                respuestaParcial.mensaje = 'Excepcion Actualizando Cupon con ID Interno : ' + respuesta.idCupon + ' - Excepcion : ' + excepcionGeneral.message.toString();
                respuesta.detalle.push(respuestaParcial);
            }

            log.debug('Grabar Cupon', 'Respuesta : ' + JSON.stringify(respuesta));

            if (respuesta.error == true && !utilities.isEmpty(respuesta.detalle) && respuesta.detalle.length > 0) {
                log.error('Grabar Cupon', 'Error Grabando el Cupon con ID Interno : ' + respuesta.idCupon + ' Error : ' + JSON.stringify(respuesta));
                throw utilities.crearError('SCUP001', 'Error Actualizando Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : ' + JSON.stringify(respuesta));
            }

            log.audit('Fin Grabar Cupon', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

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

            var tasaLiquidacon = '';

            try {
                if (!utilities.isEmpty(informacion)) {
                    respuesta.idCupon = informacion.idInterno;
                    if (!utilities.isEmpty(informacion.registro)) {

                        // INICIO - Obtener Tasa de Liquidacion
                        var searchLiq = utilities.searchSaved('customsearch_3k_config_liquidaciones');

                        if (!utilities.isEmpty(searchLiq) && searchLiq.error == false) {
                            if (!utilities.isEmpty(searchLiq.objRsponseFunction.result) && searchLiq.objRsponseFunction.result.length > 0) {
                                tasaLiquidacon = searchLiq.objRsponseFunction.result[0].getValue({ name: searchLiq.objRsponseFunction.search.columns[15] });

                                if (utilities.isEmpty(tasaLiquidacon)) {
                                    var mensaje = 'No se encuentra configurada la Tasa de Liquidacion en el Panel de configuracion de Liquidaciones';

                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'SCUP052';
                                    respuestaParcial.mensaje = mensaje;
                                    respuesta.detalle.push(respuestaParcial);
                                } else {
                                    informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_tasa_liq', value: parseFloat(tasaLiquidacon, 10) });
                                }
                            } else {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SCUP053';
                                respuestaParcial.mensaje = 'No se encuentra realizada la Configuracion de Liquidaciones';
                                respuesta.detalle.push(respuestaParcial);
                            }
                        } else {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SCUP054';
                            respuestaParcial.mensaje = 'Error Consultando Configuracion de Liquidaciones - Tipo Error : ' + searchLiq.tipoError + ' - Descripcion : ' + searchLiq.descripcion;
                            respuesta.detalle.push(respuestaParcial);
                        }

                        var moneda = informacion.registro.getValue({
                            fieldId: 'custrecord_3k_cupon_moneda'
                        });

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
                                    idCuentaIngresoMillas = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[10] });
                                    idCuentaIngresoDescuentos = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[8] });
                                    idCuentaIngresoVouchers = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[9] });
                                    if (utilities.isEmpty(idCuentaIngresoAConfirmar) || utilities.isEmpty(idCuentaDeudaAConfirmar) || utilities.isEmpty(idCuentaIngresoInicial) || utilities.isEmpty(idCuentaIngresoMillas) || utilities.isEmpty(idCuentaIngresoDescuentos) || utilities.isEmpty(idCuentaIngresoVouchers)) {
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
                                        if (utilities.isEmpty(idCuentaIngresoMillas)) {
                                            mensaje = mensaje + ' Cuenta de Millas / ';
                                        }
                                        if (utilities.isEmpty(idCuentaIngresoDescuentos)) {
                                            mensaje = mensaje + ' Cuenta de Descuentos Concedidos / ';
                                        }
                                        if (utilities.isEmpty(idCuentaIngresoVouchers)) {
                                            mensaje = mensaje + ' Cuenta de Vouchers de Devoluciones Concedidos / ';
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

                        // FIN - Obtener Tasa de Liquidacion

                        // INICIO - Obtener Cuentas Contables de Confirmacion
                        /*var searchConfig = utilities.searchSaved('customsarch_3k_configuracion_cupones_ss');
                        if (!utilities.isEmpty(searchConfig) && searchConfig.error == false) {
                            if (!utilities.isEmpty(searchConfig.objRsponseFunction.result) && searchConfig.objRsponseFunction.result.length > 0) {
                                idCuentaIngresoAConfirmar = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[2] });
                                idCuentaDeudaAConfirmar = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[3] });
                                idCuentaIngresoInicial = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[6] });
                                idCuentaIngresoMillas = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[12] });
                                idCuentaIngresoDescuentos = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[10] });
                                idCuentaIngresoVouchers = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[11] });
                                if (utilities.isEmpty(idCuentaIngresoAConfirmar) || utilities.isEmpty(idCuentaDeudaAConfirmar) || utilities.isEmpty(idCuentaIngresoInicial) || utilities.isEmpty(idCuentaIngresoMillas) || utilities.isEmpty(idCuentaIngresoDescuentos) || utilities.isEmpty(idCuentaIngresoVouchers)) {
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
                                    if (utilities.isEmpty(idCuentaIngresoMillas)) {
                                        mensaje = mensaje + ' Cuenta de Millas / ';
                                    }
                                    if (utilities.isEmpty(idCuentaIngresoDescuentos)) {
                                        mensaje = mensaje + ' Cuenta de Descuentos Concedidos / ';
                                    }
                                    if (utilities.isEmpty(idCuentaIngresoVouchers)) {
                                        mensaje = mensaje + ' Cuenta de Vouchers de Devoluciones Concedidos / ';
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
                        }*/

                        // FIN - Obtener Cuentas Contables de Confirmacion

                        var subsidiaria = informacion.registro.getValue({
                            fieldId: 'custrecord_3k_cupon_subsidiaria'
                        });

                        var sitioWeb = informacion.registro.getValue({
                            fieldId: 'custrecord_69_cseg_3k_sitio_web_o'
                        });

                        var sistema = informacion.registro.getValue({
                            fieldId: 'custrecord_69_cseg_3k_sistema'
                        });

                        var monedaPrincipalSubsidiaria = '';

                        // INICIO - Obtener Moneda Subsidiaria
                        /*var filtrosMonedasSubsidiaria = new Array();

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
                                } else {
                                    informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_moneda_base', value: monedaPrincipalSubsidiaria });
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
                        }*/
                        // FIN - Obtener Moneda Subsidiaria

                        if (respuesta.error == false) {

                            /*var cuentaDeposito = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_cuenta_deposito'
                            });*/


                            var tipoCambio = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_tipo_cambio'
                            });

                            //var tipoCambio = parseFloat(1, 10).toFixed(2);

                            if (!utilities.isEmpty(subsidiaria) && !utilities.isEmpty(moneda) && !utilities.isEmpty(tipoCambio)) {

                                var importeCuponDifMoneda = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_importe'
                                });

                                /*var importeCupon = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_importe_mb'
                                });

                                var importeDinero = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_importe_dinero_mb'
                                });

                                var importeMillas = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_importe_millas_mb'
                                });

                                var importeDescuentos = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_importe_desc_mb'
                                });

                                var importeVouchers = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_importe_dev_mb'
                                });*/

                                var importeCupon = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_importe'
                                });

                                var importeDinero = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_importe_dinero'
                                });

                                var importeMillas = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_importe_millas'
                                });

                                var importeDescuentos = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_importe_desc'
                                });

                                var importeVouchers = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_importe_dev'
                                });

                                //var importeMiilasUtilizar = parseFloat(importeCupon,10) - (parseFloat(importeDescuentos,10) + parseFloat(importeVouchers,10));
                                //importeMiilasUtilizar = parseFloat(importeMillas,10);


                                var porcentualDinero = parseFloat(importeDinero, 10) / parseFloat(importeCupon, 10);
                                //var porcentualMillas = parseFloat(importeMiilasUtilizar,10) / parseFloat(importeCupon,10);
                                var porcentualMillas = parseFloat(importeMillas, 10) / parseFloat(importeCupon, 10);
                                var porcentualDescuento = parseFloat(importeDescuentos, 10) / parseFloat(importeCupon, 10);
                                var porcentualVouchers = parseFloat(importeVouchers, 10) / parseFloat(importeCupon, 10);

                                var importeNetoCupon = '';
                                var importeNetoCuponMonbase = '';
                                var importeNetoComision = '';
                                var importeIVAComision = '';

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

                                    var importeCuponIncluyeIVA = informacion.registro.getValue({
                                        fieldId: 'custrecord_3k_cupon_imp_con_iva'
                                    });

                                    /*if(importeCuponIncluyeIVA==true){
                                        importeNetoCuponMonbase = importeCupon/(1 + (parseFloat(tasaLiquidacon,10)/100));
                                        importeNetoCupon = importeCuponDifMoneda/(1 + (parseFloat(tasaLiquidacon,10)/100));
                                        importeIVAComision = parseFloat(importeCupon,10) - parseFloat(importeNetoCuponMonbase,10);
                                    }
                                    else{
                                        importeNetoCuponMonbase = parseFloat(importeCupon,10);
                                        importeNetoCupon = parseFloat(importeCuponDifMoneda,10);
                                        importeIVAComision = (parseFloat(importeCupon,10)*((parseFloat(tasaLiquidacon,10)/100)));
                                        importeCupon = parseFloat(importeCupon,10) + parseFloat(importeIVAComision,10);
                                    }

                                    informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_importe_neto', value: importeNetoCupon });
                                    informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_importe_neto_mb', value: importeNetoCuponMonbase });*/

                                    //var importeCuponMonedaPrincipal = parseFloat((importeCupon * ((parseFloat(porcentajeDeuda, 10)) / 100)), 10).toFixed(2);
                                    // INICIO CREAR CUSTOM TRANSACTION DEUDA A CONFIRMAR
                                    //if (!utilities.isEmpty(porcentajeComision) && parseFloat(porcentajeComision, 10) > 0) {
                                    importeIngreso = parseFloat((importeCupon * ((parseFloat(porcentajeComision, 10)) / 100)), 10);
                                    //importeIngreso = parseFloat((importeCupon * ((parseFloat(porcentajeComision, 10)) / 100)), 10).toFixed(2);

                                    if (importeCuponIncluyeIVA == true) {
                                        importeNetoComision = importeIngreso / (1 + (parseFloat(tasaLiquidacon, 10) / 100));
                                        importeIVAComision = parseFloat(importeIngreso, 10) - parseFloat(importeNetoComision, 10);
                                    } else {
                                        importeNetoComision = parseFloat(importeIngreso, 10);
                                        importeIVAComision = (parseFloat(importeIngreso, 10) * ((parseFloat(tasaLiquidacon, 10) / 100)));
                                        importeIngreso = parseFloat(importeIngreso, 10) + parseFloat(importeIVAComision, 10);
                                    }

                                    importeNetoComision = parseFloat(importeNetoComision, 10).toFixed(2);
                                    importeIVAComision = parseFloat(importeIVAComision, 10).toFixed(2);
                                    importeIngreso = parseFloat(importeIngreso, 10).toFixed(2);

                                    informacion.registro.setValue({ fieldId: 'custrecord3k_cupon_imp_iva_com', value: importeIVAComision });
                                    informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_imp_neto_com', value: importeNetoComision });

                                    importeDeuda = parseFloat((importeCupon - (parseFloat(importeIngreso, 10))), 10).toFixed(2);
                                    log.debug('Grabar Cupon', 'Importe Deuda A Confirmar : ' + importeDeuda + ' - Importe Ingreso A Confirmar : ' + importeIngreso);
                                    if ((!utilities.isEmpty(importeDeuda) && !isNaN(parseFloat(importeDeuda, 10)) && importeDeuda > 0) || (!utilities.isEmpty(importeIngreso) && !isNaN(parseFloat(importeIngreso, 10)) && importeIngreso > 0)) {
                                        var importeTotal = parseFloat((parseFloat(importeDeuda, 10) + parseFloat(importeIngreso, 10)), 10).toFixed(2);
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
                                            objRecordLiqConf.setValue({ fieldId: 'subsidiary', value: subsidiaria });
                                            objRecordLiqConf.setValue({ fieldId: 'currency', value: moneda });
                                            //objRecordLiqConf.setValue({ fieldId: 'currency', value: monedaPrincipalSubsidiaria });
                                            objRecordLiqConf.setValue({ fieldId: 'exchangerate', value: tipoCambio });

                                            objRecordLiqConf.setValue({ fieldId: 'custbody_cseg_3k_sitio_web_o', value: sitioWeb });
                                            objRecordLiqConf.setValue({ fieldId: 'custbody_cseg_3k_sistema', value: sistema });

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

                                            log.debug('Grabar Cupon', 'Importe total : ' + importeTotal + ' - Importe Deuda : ' + importeDeuda + ' - Importe Ingreso : ' + importeIngreso);

                                            var arrayLineasAsiento = new Array();

                                            var importeRestanteCupon = parseFloat(importeCupon, 10).toFixed(2);
                                            var importeRestanteIngreso = parseFloat(importeIngreso, 10).toFixed(2);
                                            var importeRestanteDeuda = parseFloat(importeDeuda, 10).toFixed(2);

                                            var importeTotalDinero = parseFloat((parseFloat(importeCupon, 10) * parseFloat(porcentualDinero, 10)), 10).toFixed(2);
                                            var importeIngresoDinero = parseFloat((parseFloat(importeIngreso, 10) * parseFloat(porcentualDinero, 10)), 10).toFixed(2);
                                            var importeDeudaDinero = parseFloat((parseFloat(importeTotalDinero, 10) - parseFloat(importeIngresoDinero, 10)), 10).toFixed(2);

                                            if (importeTotalDinero > 0) {
                                                var lineaAsiento = new Object();
                                                lineaAsiento.arrayDebit = new Array();
                                                lineaAsiento.arrayCredit = new Array();
                                                var lineaDebit = new Object();
                                                lineaDebit.importe = importeTotalDinero;
                                                lineaDebit.cuenta = idCuentaIngresoInicial;
                                                lineaAsiento.arrayDebit.push(lineaDebit);
                                                //if(importeIngresoDinero>0){
                                                var lineaCredit = new Object();
                                                lineaCredit.importe = importeIngresoDinero;
                                                lineaCredit.cuenta = idCuentaIngresoAConfirmar;
                                                lineaAsiento.arrayCredit.push(lineaCredit);
                                                //}
                                                //if(importeDeudaDinero>0){
                                                var lineaCredit = new Object();
                                                lineaCredit.importe = importeDeudaDinero;
                                                lineaCredit.cuenta = idCuentaDeudaAConfirmar;
                                                lineaAsiento.arrayCredit.push(lineaCredit);
                                                //}
                                                arrayLineasAsiento.push(lineaAsiento);
                                            }

                                            var importeTotalMillas = parseFloat((parseFloat(importeCupon, 10) * parseFloat(porcentualMillas, 10)), 10).toFixed(2);
                                            var importeIngresoMillas = parseFloat((parseFloat(importeIngreso, 10) * parseFloat(porcentualMillas, 10)), 10).toFixed(2);
                                            var importeDeudaMillas = parseFloat((parseFloat(importeTotalMillas, 10) - parseFloat(importeIngresoMillas, 10)), 10).toFixed(2);

                                            if (importeTotalMillas > 0) {
                                                var lineaAsiento = new Object();
                                                lineaAsiento.arrayDebit = new Array();
                                                lineaAsiento.arrayCredit = new Array();
                                                var lineaDebit = new Object();
                                                lineaDebit.importe = importeTotalMillas;
                                                lineaDebit.cuenta = idCuentaIngresoMillas;
                                                lineaAsiento.arrayDebit.push(lineaDebit);
                                                //if(importeIngresoMillas>0){
                                                var lineaCredit = new Object();
                                                lineaCredit.importe = importeIngresoMillas;
                                                lineaCredit.cuenta = idCuentaIngresoAConfirmar;
                                                lineaAsiento.arrayCredit.push(lineaCredit);
                                                //}
                                                //if(importeDeudaMillas>0){
                                                var lineaCredit = new Object();
                                                lineaCredit.importe = importeDeudaMillas;
                                                lineaCredit.cuenta = idCuentaDeudaAConfirmar;
                                                lineaAsiento.arrayCredit.push(lineaCredit);
                                                //}
                                                arrayLineasAsiento.push(lineaAsiento);
                                            }

                                            var importeTotalDescuento = parseFloat((parseFloat(importeCupon, 10) * parseFloat(porcentualDescuento, 10)), 10).toFixed(2);
                                            var importeIngresoDescuento = parseFloat((parseFloat(importeIngreso, 10) * parseFloat(porcentualDescuento, 10)), 10).toFixed(2);
                                            var importeDeudaDescuento = parseFloat((parseFloat(importeTotalDescuento, 10) - parseFloat(importeIngresoDescuento, 10)), 10).toFixed(2);

                                            if (importeTotalDescuento > 0) {
                                                var lineaAsiento = new Object();
                                                lineaAsiento.arrayDebit = new Array();
                                                lineaAsiento.arrayCredit = new Array();
                                                var lineaDebit = new Object();
                                                lineaDebit.importe = importeTotalDescuento;
                                                lineaDebit.cuenta = idCuentaIngresoDescuentos;
                                                lineaAsiento.arrayDebit.push(lineaDebit);
                                                //if(importeIngresoDescuento>0){
                                                var lineaCredit = new Object();
                                                lineaCredit.importe = importeIngresoDescuento;
                                                lineaCredit.cuenta = idCuentaIngresoAConfirmar;
                                                lineaAsiento.arrayCredit.push(lineaCredit);
                                                //}
                                                //if(importeDeudaDescuento>0){
                                                var lineaCredit = new Object();
                                                lineaCredit.importe = importeDeudaDescuento;
                                                lineaCredit.cuenta = idCuentaDeudaAConfirmar;
                                                lineaAsiento.arrayCredit.push(lineaCredit);
                                                //}
                                                arrayLineasAsiento.push(lineaAsiento);
                                            }

                                            var importeTotalVoucher = parseFloat((parseFloat(importeCupon, 10) * parseFloat(porcentualVouchers, 10)), 10).toFixed(2);
                                            var importeIngresoVoucher = parseFloat((parseFloat(importeIngreso, 10) * parseFloat(porcentualVouchers, 10)), 10).toFixed(2);
                                            var importeDeudaVoucher = parseFloat((parseFloat(importeTotalVoucher, 10) - parseFloat(importeIngresoVoucher, 10)), 10).toFixed(2);

                                            if (importeTotalVoucher > 0) {
                                                var lineaAsiento = new Object();
                                                lineaAsiento.arrayDebit = new Array();
                                                lineaAsiento.arrayCredit = new Array();
                                                var lineaDebit = new Object();
                                                lineaDebit.importe = importeTotalVoucher;
                                                lineaDebit.cuenta = idCuentaIngresoVouchers;
                                                log.debug('Grabar Cupon', 'Cuenta Voucher Ingreso : ' + idCuentaIngresoVouchers);
                                                lineaAsiento.arrayDebit.push(lineaDebit);
                                                //if(importeIngresoVoucher>0){
                                                var lineaCredit = new Object();
                                                lineaCredit.importe = importeIngresoVoucher;
                                                lineaCredit.cuenta = idCuentaIngresoAConfirmar;
                                                lineaAsiento.arrayCredit.push(lineaCredit);
                                                //}
                                                //if(importeDeudaVoucher>0){
                                                var lineaCredit = new Object();
                                                lineaCredit.importe = importeDeudaVoucher;
                                                lineaCredit.cuenta = idCuentaDeudaAConfirmar;
                                                lineaAsiento.arrayCredit.push(lineaCredit);
                                                //}
                                                arrayLineasAsiento.push(lineaAsiento);
                                            }



                                            for (var i = 0; i < arrayLineasAsiento.length; i++) {
                                                if (!utilities.isEmpty(arrayLineasAsiento[i].arrayDebit) && arrayLineasAsiento[i].arrayDebit.length > 0) {
                                                    if (i == arrayLineasAsiento.length - 1) {
                                                        if (!utilities.isEmpty(importeRestanteCupon) && !isNaN(parseFloat(importeRestanteCupon, 10)) && parseFloat(importeRestanteCupon, 10) > 0 && arrayLineasAsiento[i].arrayDebit.length > 0 && !utilities.isEmpty(arrayLineasAsiento[i].arrayDebit[0])) {
                                                            arrayLineasAsiento[i].arrayDebit[0].importe = parseFloat(importeRestanteCupon, 10).toFixed(2);
                                                        }
                                                    } else {
                                                        if (arrayLineasAsiento[i].arrayDebit.length > 0 && !utilities.isEmpty(arrayLineasAsiento[i].arrayDebit[0])) {
                                                            importeRestanteCupon = parseFloat((parseFloat(importeRestanteCupon, 10) - parseFloat(arrayLineasAsiento[i].arrayDebit[0].importe, 10)), 10).toFixed(2);
                                                        }
                                                    }
                                                    for (var j = 0; j < arrayLineasAsiento[i].arrayDebit.length; j++) {
                                                        if (arrayLineasAsiento[i].arrayDebit[j].importe > 0) {
                                                            objRecordLiqConf.selectNewLine({
                                                                sublistId: 'line'
                                                            });
                                                            objRecordLiqConf.setCurrentSublistValue({
                                                                sublistId: 'line',
                                                                fieldId: 'account',
                                                                value: arrayLineasAsiento[i].arrayDebit[j].cuenta
                                                            });


                                                            /*objRecordLiqConf.setCurrentSublistValue({
                                                                sublistId: 'line',
                                                                fieldId: 'currency',
                                                                value: monedaPrincipalSubsidiaria
                                                            });*/

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
                                                                value: arrayLineasAsiento[i].arrayDebit[j].importe
                                                            });

                                                            log.debug('Grabar Cupon', 'Importe Debito : ' + arrayLineasAsiento[i].arrayDebit[j].importe);

                                                            objRecordLiqConf.commitLine({
                                                                sublistId: 'line'
                                                            });

                                                        }
                                                    }
                                                }
                                                if (!utilities.isEmpty(arrayLineasAsiento[i].arrayCredit) && arrayLineasAsiento[i].arrayCredit.length > 0) {
                                                    if (i == arrayLineasAsiento.length - 1) {
                                                        if (!utilities.isEmpty(importeRestanteIngreso) && !isNaN(parseFloat(importeRestanteIngreso, 10)) && parseFloat(importeRestanteIngreso, 10) > 0 && arrayLineasAsiento[i].arrayCredit.length > 0 && !utilities.isEmpty(arrayLineasAsiento[i].arrayCredit[0])) {
                                                            arrayLineasAsiento[i].arrayCredit[0].importe = parseFloat(importeRestanteIngreso, 10).toFixed(2);
                                                        }
                                                        if (!utilities.isEmpty(importeRestanteDeuda) && !isNaN(parseFloat(importeRestanteDeuda, 10)) && parseFloat(importeRestanteDeuda, 10) > 0 && arrayLineasAsiento[i].arrayCredit.length > 1 && !utilities.isEmpty(arrayLineasAsiento[i].arrayCredit[1])) {
                                                            arrayLineasAsiento[i].arrayCredit[1].importe = parseFloat(importeRestanteDeuda, 10).toFixed(2);
                                                        }
                                                    } else {
                                                        if (arrayLineasAsiento[i].arrayCredit.length > 0 && !utilities.isEmpty(arrayLineasAsiento[i].arrayCredit[0])) {
                                                            importeRestanteIngreso = parseFloat((parseFloat(importeRestanteIngreso, 10) - parseFloat(arrayLineasAsiento[i].arrayCredit[0].importe, 10)), 10).toFixed(2);
                                                        }
                                                        if (arrayLineasAsiento[i].arrayCredit.length > 1 && !utilities.isEmpty(arrayLineasAsiento[i].arrayCredit[1])) {
                                                            importeRestanteDeuda = parseFloat((parseFloat(importeRestanteDeuda, 10) - parseFloat(arrayLineasAsiento[i].arrayCredit[1].importe, 10)), 10).toFixed(2);
                                                        }
                                                    }
                                                    for (var j = 0; j < arrayLineasAsiento[i].arrayCredit.length; j++) {
                                                        if (arrayLineasAsiento[i].arrayCredit[j].importe > 0) {
                                                            objRecordLiqConf.selectNewLine({
                                                                sublistId: 'line'
                                                            });
                                                            objRecordLiqConf.setCurrentSublistValue({
                                                                sublistId: 'line',
                                                                fieldId: 'account',
                                                                value: arrayLineasAsiento[i].arrayCredit[j].cuenta
                                                            });


                                                            /*objRecordLiqConf.setCurrentSublistValue({
                                                                sublistId: 'line',
                                                                fieldId: 'currency',
                                                                value: monedaPrincipalSubsidiaria
                                                            });*/

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
                                                                value: arrayLineasAsiento[i].arrayCredit[j].importe
                                                            });

                                                            log.debug('Grabar Cupon', 'Importe Credito : ' + arrayLineasAsiento[i].arrayCredit[j].importe);

                                                            objRecordLiqConf.commitLine({
                                                                sublistId: 'line'
                                                            });
                                                        }
                                                    }
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
                                    //}

                                    // FIN CREAR CUSTOM TRANSACTION DEUDA A CONFIRMAR


                                    // INICIO - ACTUALIZAR CUPON
                                    if (!utilities.isEmpty(recordIdLiqConf)) {
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_link_liq_conf', value: recordIdLiqConf });
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_imp_ing_conf', value: importeIngreso });
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_imp_deuda_conf', value: importeDeuda });
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_imp_ingreso_fact', value: 0 });
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_imp_deuda_pagar', value: 0 });
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_cuenta_ing_conf', value: idCuentaIngresoAConfirmar });
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_cuenta_deuda_conf', value: idCuentaDeudaAConfirmar });
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_cuenta_ing_ini', value: idCuentaIngresoInicial });
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_cuenta_ing_millas', value: idCuentaIngresoMillas });
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_cuenta_ing_desc', value: idCuentaIngresoDescuentos });
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_cuenta_ing_voucher', value: idCuentaIngresoVouchers });
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_proc_new_fin', value: true });

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
                                /*if (utilities.isEmpty(cuentaDeposito)) {
                                    mensaje = mensaje + ' Cuenta Contable Asociada a la Cobranza / ';
                                }*/
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

        function CuponDevolucion(informacion) {
            log.audit('Devolucion Cupon', 'INICIO Proceso');

            var respuesta = new Object();
            respuesta.idCupon = '';
            respuesta.idRegLiqConf = '';
            respuesta.idRegLiqGen = '';
            respuesta.error = false;
            respuesta.detalle = new Array();

            var recordIdLiqConf = '';

            var voidDeudaAConfirmarId = '';
            var voidIngresoAConfirmarId = '';

            try {
                if (!utilities.isEmpty(informacion)) {
                    respuesta.idCupon = informacion.idInterno;
                    if (!utilities.isEmpty(informacion.registro)) {

                        var cuponLiquidado = informacion.registro.getValue({
                            fieldId: 'custrecord_3k_cupon_liquidado'
                        });

                        if (cuponLiquidado == false) {

                            var idLiqConfirmar = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_link_liq_conf'
                            });

                            var idLiqGenerar = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_link_liq_gen'
                            });

                            log.debug('Devolucion Cupon', 'ID Registro Liquidacion A Confirmar : ' + idLiqConfirmar);

                            log.debug('Devolucion Cupon', 'ID Registro Liquidacion A Generar : ' + idLiqGenerar);

                            // INICIO - Anular Liquidacion A Generar
                            if (!utilities.isEmpty(idLiqGenerar)) {
                                log.debug('Devolucion Cupon', 'ID Registro Liquidacion A Generar A Anular : ' + idLiqGenerar);
                                voidLiqAGenerarId = '';
                                try {
                                    voidLiqAGenerarId = transaction.void({
                                        type: 'customtransaction_3k_liquidacion_generar',
                                        id: idLiqGenerar
                                    });
                                } catch (excepcionAnularLiqAGenerar) {
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'SCUP025';
                                    respuestaParcial.mensaje = 'Excepcion Anulando Registro de Liquidacion A Generar Asociado al Cupon con ID Interno : ' + respuesta.idCupon + ' - Excepcion : ' + excepcionAnularLiqAGenerar.message.toString();
                                    respuesta.detalle.push(respuestaParcial);
                                }
                                if (utilities.isEmpty(voidLiqAGenerarId)) {
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'SCUP026';
                                    respuestaParcial.mensaje = 'Error Anulando Registro de Liquidacion A Generar Asociado al Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : No se recibio el ID Interno del Registro de Anulacion';
                                    respuesta.detalle.push(respuestaParcial);
                                } else {
                                    log.debug('Devolucion Cupon', 'ID Registro Liquidacion A Generar Anulado : ' + idLiqGenerar);
                                }
                            }
                            // FIN - Anular Liquidacion A Generar

                            // INICIO - Anular Liquidacion A Confirmar
                            if (!utilities.isEmpty(idLiqConfirmar)) {
                                log.debug('Devolucion Cupon', 'ID Registro Liquidacion A Confirmar A Anular : ' + idLiqConfirmar);
                                var voidLiqAConfirmarId = '';
                                try {
                                    voidLiqAConfirmarId = transaction.void({
                                        type: 'customtransaction_3k_liquidacion_conf',
                                        id: idLiqConfirmar
                                    });
                                } catch (excepcionAnularLiqAConfiramr) {
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'SCUP021';
                                    respuestaParcial.mensaje = 'Excepcion Anulando Registro de Liquidacion A Confirmar Asociado al Cupon con ID Interno : ' + respuesta.idCupon + ' - Excepcion : ' + excepcionAnularLiqAConfiramr.message.toString();
                                    respuesta.detalle.push(respuestaParcial);
                                }
                                if (utilities.isEmpty(voidLiqAConfirmarId)) {
                                    respuesta.error = true;
                                    respuestaParcial = new Object();
                                    respuestaParcial.codigo = 'SCUP022';
                                    respuestaParcial.mensaje = 'Error Anulando Registro de Liquidacion A Confirmar Asociado al Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : No se recibio el ID Interno del Registro de Anulacion';
                                    respuesta.detalle.push(respuestaParcial);
                                } else {
                                    log.debug('Devolucion Cupon', 'ID Registro Liquidacion A Confirmar Anulado : ' + idLiqConfirmar);
                                }
                            }
                            // FIN - Anular Liquidacion A Confirmar

                            if (respuesta.error == false) {
                                // INICIO - ACTUALIZAR CUPON
                                if (!utilities.isEmpty(voidLiqAConfirmarId)) {
                                    informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_imp_ing_conf', value: 0 });
                                    informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_imp_ingreso_fact', value: 0 });
                                    informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_imp_deuda_conf', value: 0 });
                                    informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_imp_deuda_pagar', value: 0 });
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
                            }

                        } else {
                            // INICIO - Validar si el Cupon ya no fue Ajustado por el Proceso de Generacion de Ajuste en Devolucion
                            var cuponConAjuste = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupones_con_ajuste_liq'
                            });
                            // FIN - Validar si el Cupon ya no fue Ajustado por el Proceso de Generacion de Ajuste en Devolucion
                            if (cuponConAjuste != true) {

                                // Si el cupon ya fue liquidado se generara un Ajuste
                                var codigoCupon = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_id_alias'
                                });

                                var sitioCupon = informacion.registro.getValue({
                                    fieldId: 'custrecord_69_cseg_3k_sitio_web_o'
                                });

                                var sistema = informacion.registro.getValue({
                                    fieldId: 'custrecord_69_cseg_3k_sistema'
                                });

                                var mainCategory = informacion.registro.getValue({
                                    fieldId: 'custrecord_69_cseg_3k_main_cat'
                                });

                                var destino = informacion.registro.getValue({
                                    fieldId: 'custrecord_69_cseg_3k_destino'
                                });

                                var tipoOperativa = informacion.registro.getValue({
                                    fieldId: 'custrecord_69_cseg_3k_tipo_operat'
                                });

                                var fechaTravel = informacion.registro.getValue({
                                    fieldId: 'custrecord_69_cseg_3k_fecha'
                                });

                                var monedaCupon = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_moneda'
                                });

                                var tipoCambioCupon = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_tipo_cambio'
                                });

                                var empresaCupon = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_empresa'
                                });

                                var importePagarCupon = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_imp_deuda_pagar'
                                });

                                /*var importeComisionCupon = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_imp_ingreso_fact'
                                });*/

                                var importeComisionCupon = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_imp_neto_com'
                                });

                                if (((!utilities.isEmpty(importePagarCupon) && !isNaN(importePagarCupon) && parseFloat(importePagarCupon, 10) > 0) || (!utilities.isEmpty(importeComisionCupon) && !isNaN(importeComisionCupon) && parseFloat(importeComisionCupon, 10) > 0))) {


                                    // INICIO - Obtener informacion de Importe Liquidacion e importe de Comision del Cupon

                                    if (!utilities.isEmpty(sitioCupon) && !utilities.isEmpty(monedaCupon) && !utilities.isEmpty(tipoCambioCupon) && !utilities.isEmpty(empresaCupon)) {

                                        // FIN - Obtener informacion de Importe Liquidacion e importe de Comision del Cupon
                                        // INICIO - Crear Ajuste de Liquidacion
                                        var rec = record.create({
                                            type: 'customrecord_3k_ajustes_liq_emp',
                                            isDynamic: true
                                        });

                                        rec.setValue({
                                            fieldId: 'name',
                                            value: 'Devolucion Cupon Codigo : ' + codigoCupon
                                        });

                                        rec.setValue({
                                            fieldId: 'custrecord_85_cseg_3k_sitio_web_o',
                                            value: sitioCupon
                                        });

                                        rec.setValue({
                                            fieldId: 'custrecord_85_cseg_3k_sistema',
                                            value: sistema
                                        });

                                        rec.setValue({
                                            fieldId: 'custrecord_85_cseg_3k_main_cat',
                                            value: mainCategory
                                        });

                                        rec.setValue({
                                            fieldId: 'custrecord_85_cseg_3k_tipo_operat',
                                            value: tipoOperativa
                                        });

                                        rec.setValue({
                                            fieldId: 'custrecord_85_cseg_3k_destino',
                                            value: destino
                                        });

                                        rec.setValue({
                                            fieldId: 'custrecord_85_cseg_3k_fecha',
                                            value: fechaTravel
                                        });

                                        rec.setValue({
                                            fieldId: 'custrecord_3k_ajustes_liq_emp_cupon',
                                            value: informacion.idInterno
                                        });

                                        rec.setValue({
                                            fieldId: 'custrecord_3k_ajustes_liq_emp_mon',
                                            value: monedaCupon
                                        });

                                        rec.setValue({
                                            fieldId: 'custrecord_3k_ajustes_liq_emp_tc',
                                            value: tipoCambioCupon
                                        });

                                        rec.setValue({
                                            fieldId: 'custrecord_3k_ajustes_liq_emp_emp',
                                            value: empresaCupon
                                        });

                                        if ((!utilities.isEmpty(importePagarCupon) && !isNaN(importePagarCupon) && parseFloat(importePagarCupon, 10) > 0)) {
                                            rec.setValue({
                                                fieldId: 'custrecord_3k_ajustes_liq_emp_imp_pag',
                                                value: parseFloat((parseFloat(importePagarCupon, 10) * -1), 10).toFixed(2)
                                            });
                                        }

                                        if ((!utilities.isEmpty(importeComisionCupon) && !isNaN(importeComisionCupon) && parseFloat(importeComisionCupon, 10) > 0)) {
                                            rec.setValue({
                                                fieldId: 'custrecord_3k_ajustes_liq_emp_imp_fact',
                                                value: parseFloat((parseFloat(importeComisionCupon, 10) * -1), 10).toFixed(2)
                                            });
                                        }


                                        try {
                                            var recId = rec.save();
                                            // INICIO - Marcar Cupon Como Ajustado
                                            informacion.registro.setValue({ fieldId: 'custrecord_3k_cupones_con_ajuste_liq', value: true });

                                            try {
                                                recordCupon = informacion.registro.save({
                                                    enableSourcing: true,
                                                    ignoreMandatoryFields: false
                                                });
                                            } catch (excepcionSaveCupon) {
                                                log.error('Devolucion Cupon - Creacion Ajuste Liquidacion', 'Excepcion Actualizar Cupon Ajustado - Excepcion : ' + excepcionSaveCupon.message.toString());
                                            }
                                            // FIN - Marcar Cupon Como Ajustado
                                        } catch (excepcionSave) {
                                            log.error('Devolucion Cupon - Creacion Ajuste Liquidacion', 'Excepcion Proceso Creacion de Ajuste de Liquidacion - Excepcion : ' + excepcionSave.message.toString());
                                            var error = new Object();
                                            if (!utilities.isEmpty(excepcionSave.message) && excepcionSave.message.indexOf('Error') >= 0) {
                                                var excepcionObj = JSON.parse(excepcionSave.message);
                                                error.name = excepcionObj.name;
                                                error.message = excepcionObj.message;
                                            } else {
                                                error.name = 'SCUP024';
                                                error.message = excepcionSave.message;
                                            }

                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = error.name;
                                            respuestaParcial.mensaje = error.message;
                                            respuesta.detalle.push(respuestaParcial);
                                        }
                                        // FIN - Crear Ajuste de Liquidacion

                                    } else {
                                        respuesta.error = true;
                                        var mensaje = 'No se recibio la siguiente informacion del Registro del Cupon con ID Interno : ' + informacion.idInterno;
                                        if (!utilities.isEmpty(sitioCupon)) {
                                            mensaje = mensaje + ' Sitio Web / ';
                                        }
                                        if (!utilities.isEmpty(monedaCupon)) {
                                            mensaje = mensaje + ' Moneda / ';
                                        }
                                        if (!utilities.isEmpty(tipoCambioCupon)) {
                                            mensaje = mensaje + ' Tipo de Cambio / ';
                                        }
                                        if (!utilities.isEmpty(empresaCupon)) {
                                            mensaje = mensaje + ' Empresa / ';
                                        }

                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'SCUP023';
                                        respuestaParcial.mensaje = mensaje;
                                        respuesta.detalle.push(respuestaParcial);
                                    }

                                }
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
                respuestaParcial.codigo = 'SCUP025';
                respuestaParcial.mensaje = 'Excepcion Devolucion Cupon con ID Interno : ' + respuesta.idCupon + ' - Excepcion : ' + excepcionGeneral.message.toString();
                respuesta.detalle.push(respuestaParcial);
            }

            log.audit('Devolucion Cupon', 'FIN Proceso');
            return respuesta;
        }

        function CuponUsed(informacion) {
            log.audit('Cupon Used', 'INICIO Proceso');

            var respuesta = new Object();
            respuesta.idCupon = '';
            respuesta.idRegLiqConf = '';
            respuesta.idRegLiqGen = '';
            respuesta.error = false;
            respuesta.detalle = new Array();

            var recordIdLiqGenerar = '';

            var importeIngreso = 0;
            var importeDeuda = 0;

            var idCuentaIngresoAConfirmar = '';
            var idCuentaDeudaAConfirmar = '';
            var idCuentaIngresoAFacturar = '';
            var idCuentaDeudaALiquidar = '';

            try {
                if (!utilities.isEmpty(informacion)) {
                    respuesta.idCupon = informacion.idInterno;
                    if (!utilities.isEmpty(informacion.registro)) {

                        var moneda = informacion.registro.getValue({
                            fieldId: 'custrecord_3k_cupon_moneda'
                        });

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
                                    idCuentaIngresoAFacturar = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[5] });
                                    idCuentaDeudaALiquidar = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[6] });
                                    if (utilities.isEmpty(idCuentaIngresoAConfirmar) || utilities.isEmpty(idCuentaDeudaAConfirmar) || utilities.isEmpty(idCuentaIngresoAFacturar) || utilities.isEmpty(idCuentaDeudaALiquidar)) {
                                        var mensaje = 'No se encuentran configuradas las siguientes Cuentas en la Configuracion de Cupones : ';
                                        if (utilities.isEmpty(idCuentaIngresoAFacturar)) {
                                            mensaje = mensaje + ' Cuenta de Ingresos A Confirmar / ';
                                        }
                                        if (utilities.isEmpty(idCuentaDeudaALiquidar)) {
                                            mensaje = mensaje + ' Cuenta de Deuda A Confirmar / ';
                                        }
                                        if (utilities.isEmpty(idCuentaIngresoAFacturar)) {
                                            mensaje = mensaje + ' Cuenta de Ingresos A Facturar / ';
                                        }
                                        if (utilities.isEmpty(idCuentaDeudaALiquidar)) {
                                            mensaje = mensaje + ' Cuenta de Deuda A Liquidar / ';
                                        }
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'SCUP047';
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

                        // FIN - Obtener Cuentas Contables de Confirmacion

                        if (respuesta.error == false) {

                            // Obtener Cuentas de Confirmacion

                            /*var idCuentaIngresoAConfirmar = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_cuenta_ing_conf'
                            });

                            var idCuentaDeudaAConfirmar = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_cuenta_deuda_conf'
                            });*/

                            //if (!utilities.isEmpty(idCuentaIngresoAConfirmar) || !utilities.isEmpty(idCuentaDeudaAConfirmar)) {

                            var subsidiaria = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_subsidiaria'
                            });

                            /*var cuentaDeposito = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_cuenta_deposito'
                            });*/

                            /*var moneda = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_moneda'
                            });*/

                            var monedaPrincipalSubsidiaria = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_moneda_base'
                            });

                            var tipoCambio = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_tipo_cambio'
                            });

                            //var tipoCambio = parseFloat(1, 10).toFixed(2);

                            var empresa = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_empresa'
                            });

                            var idOV = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_ord_venta'
                            });

                            var idOrden = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_id_orden'
                            });

                            var porcentajeComision = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_por_comision'
                            });

                            var porcentajeDeuda = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_por_liquidacion'
                            });

                            var esFacturaCliente = informacion.registro.getValue({
                                fieldId: 'custrecord_3k_cupon_factura_cliente'
                            });

                            var sitioWeb = informacion.registro.getValue({
                                fieldId: 'custrecord_69_cseg_3k_sitio_web_o'
                            });

                            var sistema = informacion.registro.getValue({
                                fieldId: 'custrecord_69_cseg_3k_sistema'
                            });

                            if (!utilities.isEmpty(empresa) && !utilities.isEmpty(subsidiaria) && !utilities.isEmpty(moneda) && !utilities.isEmpty(tipoCambio)) {

                                var importeIngresoAConfirmar = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_imp_ing_conf'
                                });

                                var importeDeudaAConfirmar = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_imp_deuda_conf'
                                });

                                var idLiqConfirmar = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_link_liq_conf'
                                });

                                var idLiqGenerar = informacion.registro.getValue({
                                    fieldId: 'custrecord_3k_cupon_link_liq_gen'
                                });

                                log.debug('Grabar Cupon', 'ID Registro Liquidacion A Facturar : ' + idLiqGenerar + ' - Importe Ingreso A Confirmar : ' + importeIngresoAConfirmar + ' - Importe Deuda A Confirmar : ' + importeDeudaAConfirmar);


                                if (!utilities.isEmpty(esFacturaCliente) && esFacturaCliente) {
                                    // INICIO FACTURAR CUPON

                                    var objResult = utilities.searchSavedPro('customsearch_3k_configuracion_voucher_ss');
                                    if (objResult.error) {
                                        return objResult;
                                    }

                                    var calculoProporcionVoucher = 0;
                                    var lineWithVoucher = false;

                                    var configVoucher = objResult.objRsponseFunction.array;


                                    var cuponFacturado = informacion.registro.getValue({
                                        fieldId: 'custrecord_3k_cupon_facturado'
                                    });

                                    if (cuponFacturado != true) {

                                        var idOrdenVenta = informacion.registro.getValue({
                                            fieldId: 'custrecord_3k_cupon_ord_venta'
                                        });

                                        var idDetalleOV = informacion.registro.getValue({
                                            fieldId: 'custrecord_3k_cupon_id_orden'
                                        });

                                        if (!utilities.isEmpty(idOrdenVenta) && !utilities.isEmpty(idDetalleOV)) {
                                            var registroFact = record.transform({
                                                fromType: record.Type.SALES_ORDER,
                                                fromId: idOrdenVenta,
                                                toType: record.Type.INVOICE,
                                                isDynamic: true
                                            });

                                            if (!utilities.isEmpty(registroFact)) {

                                                informacion.registro.getValue({
                                                    fieldId: 'custrecord_3k_cupon_ord_venta'
                                                });

                                                var numLines = registroFact.getLineCount({
                                                    sublistId: 'item'
                                                });

                                                var line = registroFact.findSublistLineWithValue({
                                                    sublistId: 'item',
                                                    fieldId: 'custcol_3k_id_orden',
                                                    value: idDetalleOV
                                                });

                                                var idOrdenEncontrada = false;

                                                for (var x = 0; x < numLines; x++) {

                                                    var isVoucher = registroFact.getSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_3k_linea_voucher',
                                                        line: x
                                                    });

                                                    if (isVoucher) {

                                                        registroFact.removeLine({
                                                            sublistId: 'item',
                                                            line: x
                                                        });
                                                        x--;
                                                        numLines--;

                                                    }
                                                }

                                                var numLinesSinVoucher = registroFact.getLineCount({
                                                    sublistId: 'item'
                                                });

                                                for (var k = 0; k < numLinesSinVoucher; k++) {

                                                    var isVoucher = registroFact.getSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_3k_linea_voucher',
                                                        line: k
                                                    });

                                                    var cantidadOV = registroFact.getSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_3k_cantidad_ov',
                                                        line: k
                                                    });
                                                    var idOrdenLinea = registroFact.getSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_3k_id_orden',
                                                        line: k
                                                    });

                                                    var importeVoucher = registroFact.getSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_3k_importe_voucher',
                                                        line: k
                                                    });

                                                    var quantity = registroFact.getSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'quantity',
                                                        line: k
                                                    });

                                                    var taxcode = registroFact.getSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'taxcode',
                                                        line: k
                                                    });

                                                    if (!isVoucher) {

                                                        if (idDetalleOV == idOrdenLinea) {

                                                            idOrdenEncontrada = true;

                                                            if (cantidadOV >= 1) {

                                                                registroFact.selectLine({
                                                                    sublistId: 'item',
                                                                    line: k
                                                                });

                                                                registroFact.setCurrentSublistValue({
                                                                    sublistId: 'item',
                                                                    fieldId: 'quantity',
                                                                    value: 1
                                                                });


                                                                //Funcionalidad de agregar voucher de descuento proporcional por el numero de cupones en la facturación
                                                                if (!utilities.isEmpty(importeVoucher) && importeVoucher > 0) {
                                                                    lineWithVoucher = true;
                                                                    var importeVoucherProporcional = ((parseFloat(importeVoucher) / parseFloat(cantidadOV)) * 1);

                                                                    calculoProporcionVoucher += parseFloat(importeVoucherProporcional, 10);

                                                                    registroFact.setCurrentSublistValue({
                                                                        sublistId: 'item',
                                                                        fieldId: 'custcol_3k_imp_voucher_fact',
                                                                        value: importeVoucherProporcional
                                                                    });
                                                                    //calculoProporcionVoucher += ((parseFloat(importeVoucher) / parseFloat(cantidadOV)) * 1);
                                                                }

                                                                registroFact.commitLine({
                                                                    sublistId: 'item'
                                                                });

                                                                if (lineWithVoucher) {
                                                                    var importeDescuento = Math.abs(calculoProporcionVoucher) * (-1);
                                                                    registroFact.insertLine({
                                                                        sublistId: 'item',
                                                                        line: (k + 1)
                                                                    });
                                                                    registroFact.setCurrentSublistValue({
                                                                        sublistId: 'item',
                                                                        fieldId: 'item',
                                                                        value: configVoucher[0].custrecord_3k_configvou_articulo
                                                                    });
                                                                    registroFact.setCurrentSublistValue({
                                                                        sublistId: 'item',
                                                                        fieldId: 'taxcode',
                                                                        value: taxcode
                                                                    });

                                                                    registroFact.setCurrentSublistValue({
                                                                        sublistId: 'item',
                                                                        fieldId: 'grossamt',
                                                                        value: importeDescuento.toString()
                                                                    });
                                                                    registroFact.setCurrentSublistValue({
                                                                        sublistId: 'item',
                                                                        fieldId: 'custcol_3k_importe_voucher',
                                                                        value: parseFloat(calculoProporcionVoucher, 10).toFixed(2).toString()
                                                                    });

                                                                    var amount = registroFact.getCurrentSublistValue({
                                                                        sublistId: 'item',
                                                                        fieldId: 'amount'
                                                                    });
                                                                    var tipoDescuento = registroFact.getCurrentSublistValue({
                                                                        sublistId: 'item',
                                                                        fieldId: 'custcol_3k_tipo_descuento'
                                                                    });
                                                                    registroFact.setCurrentSublistValue({
                                                                        sublistId: 'item',
                                                                        fieldId: 'custcol_l598_tipo_desc_rec',
                                                                        value: tipoDescuento
                                                                    });
                                                                    registroFact.setCurrentSublistValue({
                                                                        sublistId: 'item',
                                                                        fieldId: 'rate',
                                                                        value: amount.toString()
                                                                    });
                                                                    registroFact.setCurrentSublistValue({
                                                                        sublistId: 'item',
                                                                        fieldId: 'custcol_3k_linea_voucher',
                                                                        value: true
                                                                    });
                                                                    registroFact.commitLine({
                                                                        sublistId: 'item'
                                                                    });

                                                                    k++;
                                                                    numLinesSinVoucher++
                                                                }

                                                            } else {
                                                                respuesta.error = true;
                                                                respuestaParcial = new Object();
                                                                respuestaParcial.codigo = 'SCUP029';
                                                                respuestaParcial.mensaje = 'Error Facturando Cupon con ID Interno : ' + respuesta.idCupon + ' - La Cantidad de Cupones A Facturar 1 excede la cantidad no Facturada';
                                                                respuesta.detalle.push(respuestaParcial);
                                                            }
                                                        } else {
                                                            registroFact.removeLine({
                                                                sublistId: 'item',
                                                                line: k
                                                            });
                                                            k--;
                                                            numLinesSinVoucher--;
                                                        }
                                                    }
                                                }
                                                //Ingresar linea de Voucher
                                                /*if (lineWithVoucher) {
                                                    var importeDescuento = Math.abs(calculoProporcionVoucher) * (-1);
                                                    registroFact.selectNewLine({
                                                        sublistId: 'item'
                                                    });
                                                    registroFact.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'item',
                                                        value: configVoucher[0].custrecord_3k_configvou_articulo
                                                    });
                                                    objRecord.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'quantity',
                                                        value: "1"
                                                    });
                                                    objRecord.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_3k_voucher',
                                                        value: configVoucher.internalid
                                                    });
                                                    registroFact.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_3k_importe_voucher',
                                                        value: parseFloat(calculoProporcionVoucher, 10).toFixed(2).toString()
                                                    });
                                                    registroFact.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'rate',
                                                        value: parseFloat(importeDescuento, 10).toFixed(2).toString()
                                                    });
                                                    objRecord.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_3k_fecha_creacion',
                                                        value: fecha
                                                    });
                                                    objRecord.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_3k_fecha_modificacion',
                                                        value: fecha
                                                    });
                                                    registroFact.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_3k_linea_voucher',
                                                        value: true
                                                    });
                                                    registroFact.commitLine({
                                                        sublistId: 'item'
                                                    });

                                                }*/
                                                if (idOrdenEncontrada == false) {
                                                    respuesta.error = true;
                                                    respuestaParcial = new Object();
                                                    respuestaParcial.codigo = 'SCUP041';
                                                    respuestaParcial.mensaje = 'Error Facturando Cupon con ID Interno : ' + respuesta.idCupon + ' - No se encontro el Detalle de OV con ID Interno : ' + idDetalleOV;
                                                    respuesta.detalle.push(respuestaParcial);
                                                }
                                            } else {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SCUP031';
                                                respuestaParcial.mensaje = 'Error Facturando Cupon con ID Interno : ' + respuesta.idCupon + ' - Error Generando Factura desde la Orden de Venta';
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                        } else {
                                            respuesta.error = true;
                                            var mensaje = 'Error Obteniendo la siguiente informacion requerida para el Cupon con ID Interno : ' + respuesta.idCupon + ' : ';
                                            if (utilities.isEmpty(idOrdenVenta) && !utilities.isEmpty(idDetalleOV)) {
                                                mensaje = mensaje + ' ID Interno de la Orden de Venta Asociada / ';

                                            }
                                            if (utilities.isEmpty(idOrdenVenta) && !utilities.isEmpty(idDetalleOV)) {
                                                mensaje = mensaje + ' ID Interno del Detalle de la Orden de Venta Asociada / '
                                            }
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'SCUP032';
                                            respuestaParcial.mensaje = mensaje;
                                            respuesta.detalle.push(respuestaParcial);
                                        }

                                        if (respuesta.error == false) {

                                            registroFact.setValue({
                                                fieldId: 'custbody_3k_fact_cupones',
                                                value: respuesta.idCupon
                                            });

                                            var respuestaBefore = funcionalidadesURU.beforeSubmit('create', registroFact);

                                            if (respuestaBefore.error) {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SCUP033';
                                                respuestaParcial.mensaje = 'Error Facturando Cupon con ID Interno : ' + respuesta.idCupon + ' - Error Generando Factura desde la Orden de Venta. Excepcion: ' + JSON.stringify(respuestaBefore);
                                                respuesta.detalle.push(respuestaParcial);
                                            }

                                            try {
                                                idFactura = registroFact.save();
                                                if (!utilities.isEmpty(idFactura)) {
                                                    //informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_facturado', value: true });

                                                    var respuestaAfter = funcionalidadesURU.afterSubmit('invoice', idFactura);

                                                    if (respuestaAfter.error) {
                                                        record.delete({
                                                            type: record.Type.INVOICE,
                                                            id: idFactura,
                                                        });
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'SCUP033';
                                                        respuestaParcial.mensaje = 'Error Facturando Cupon con ID Interno : ' + respuesta.idCupon + ' - Error Generando Factura desde la Orden de Venta. Excepcion: ' + JSON.stringify(respuestaAfter);
                                                        respuesta.detalle.push(respuestaParcial);
                                                    }


                                                    informacion.registro.setValue({ fieldId: 'custrecord_3k_cupones_factura', value: idFactura });

                                                    var arrayFacturas = new Array();
                                                    arrayFacturas.push(idFactura);
                                                    /*respuesta.resultCae = funcionalidades.generarCAE(arrayFacturas); // Generar CAE aca o dejar proceso Automatico para Servicios
                                                    if (respuesta.resultCae.error) {
                                                        return respuesta.resultCae;
                                                    }*/

                                                    //INICIO CONSULTAR SUBSIDIARIA
                                                    var subsidiaria = '';

                                                    var searchConfig = utilities.searchSaved('customsearch_3k_config_sub_fact');

                                                    if (!utilities.isEmpty(searchConfig) && !searchConfig.error) {
                                                        if (!utilities.isEmpty(searchConfig.objRsponseFunction.result) && searchConfig.objRsponseFunction.result.length > 0) {
                                                            subsidiaria = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[1] });

                                                            if (utilities.isEmpty(subsidiaria)) {
                                                                //objRespuesta.error = true;

                                                                respuesta.error = true;
                                                                respuestaParcial = new Object();
                                                                respuestaParcial.codigo = 'SCUP033';
                                                                respuestaParcial.mensaje = 'No se encuentra configurada la siguiente informacion del panel de configuracion de Subsidiaria Facturacion : ';


                                                                //var mensaje = 'No se encuentra configurada la siguiente informacion del panel de configuracion de Subsidiaria Facturacion : ';
                                                                if (utilities.isEmpty(subsidiaria)) {
                                                                    respuestaParcial.mensaje = respuestaParcial.mensaje + ' Subsidiaria / ';
                                                                }
                                                                respuesta.detalle.push(respuestaParcial);

                                                                log.error('ERROR', JSON.stringify(respuesta));
                                                            }
                                                        } else {
                                                            respuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SCUP033';
                                                            respuestaParcial.mensaje = 'No se encuentra realizada la configuracion de Subsidiaria Facturacion : ';
                                                            respuesta.detalle.push(respuestaParcial);

                                                            log.error('ERROR', JSON.stringify(respuesta));

                                                            /*var mensaje = 'No se encuentra realizada la configuracion de Subsidiaria Facturacion : ';
                                                            log.error('SVOU014', mensaje);
                                                            throw utilities.crearError('SVOU014', JSON.stringify(mensaje));*/
                                                        }
                                                    } else {

                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'SCUP033';
                                                        respuestaParcial.mensaje = 'Error Consultando Configuracion de Subsidiaria de Facturacion - Tipo Error : ' + searchConfig.tipoError + ' - Descripcion : ' + searchConfig.descripcion;
                                                        respuesta.detalle.push(respuestaParcial);

                                                        log.error('ERROR', JSON.stringify(respuesta));


                                                        /*var mensaje = 'Error Consultando Configuracion de Subsidiaria de Facturacion - Tipo Error : ' + searchConfig.tipoError + ' - Descripcion : ' + searchConfig.descripcion;
                                                        log.error('SVOU014', mensaje);
                                                        throw utilities.crearError('SVOU014', JSON.stringify(mensaje));*/
                                                    }

                                                    var resultCae = funcionalidades.generarCAE(arrayFacturas, subsidiaria);
                                                    if (resultCae.error) {
                                                        throw utilities.crearError('SCUP033', JSON.stringify(resultCae));
                                                    }
                                                } else {
                                                    respuesta.error = true;
                                                    respuestaParcial = new Object();
                                                    respuestaParcial.codigo = 'SCUP038';
                                                    respuestaParcial.mensaje = 'Error Grabando Factura para el Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : No se recibio el ID Interno del Registro de Factura Generado';
                                                    respuesta.detalle.push(respuestaParcial);
                                                }
                                            } catch (excepcionFact) {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SCUP037';
                                                respuestaParcial.mensaje = 'Excepcion Generando Factura para el Cupon con ID Interno : ' + respuesta.idCupon + ' - Excepcion : ' + excepcionFact.message.toString();
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                        }
                                    }
                                }

                                if (respuesta.error == false) {

                                    if ((!utilities.isEmpty(importeIngresoAConfirmar) && !isNaN(parseFloat(importeIngresoAConfirmar, 10)) && importeIngresoAConfirmar > 0) || (!utilities.isEmpty(importeDeudaAConfirmar) && !isNaN(parseFloat(importeDeudaAConfirmar, 10)) && importeDeudaAConfirmar > 0)) {
                                        // INICIO CREAR CUSTOM TRANSACTION LIQUIDACION A FACTURAR

                                        var objRecordLiqGenerar = '';
                                        try {
                                            if (!utilities.isEmpty(idLiqGenerar)) {
                                                objRecordLiqGenerar = record.load({
                                                    type: 'customtransaction_3k_liquidacion_generar',
                                                    id: idLiqGenerar,
                                                    isDynamic: true,
                                                });
                                            } else {
                                                objRecordLiqGenerar = record.create({
                                                    type: 'customtransaction_3k_liquidacion_generar',
                                                    isDynamic: true,
                                                });
                                            }
                                        } catch (excepcionCreateLiqGenerar) {
                                            var mensaje = 'Excepcion Creando/Editando Registro de Liquidacion A Generar para el Cupon con ID Interno : ' + respuesta.idCupon + ' - Excepcion : ' + excepcionCreateLiqGenerar.message.toString();

                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'SCUP042';
                                            respuestaParcial.mensaje = mensaje;
                                            respuesta.detalle.push(respuestaParcial);
                                        }
                                        if (!utilities.isEmpty(objRecordLiqGenerar)) {
                                            objRecordLiqGenerar.setValue({ fieldId: 'subsidiary', value: subsidiaria });
                                            objRecordLiqGenerar.setValue({ fieldId: 'currency', value: moneda });
                                            objRecordLiqGenerar.setValue({ fieldId: 'exchangerate', value: tipoCambio });

                                            objRecordLiqGenerar.setValue({ fieldId: 'custbody_cseg_3k_sitio_web_o', value: sitioWeb });
                                            objRecordLiqGenerar.setValue({ fieldId: 'custbody_cseg_3k_sistema', value: sistema });

                                            var cantidadLineasLiqGenerar = objRecordLiqGenerar.getLineCount({
                                                sublistId: 'line'
                                            });

                                            if (!utilities.isEmpty(cantidadLineasLiqGenerar) && cantidadLineasLiqGenerar > 0) {
                                                for (var iLiqGen = 0; iLiqGen < cantidadLineasLiqGenerar; iLiqGen++) {
                                                    objRecordLiqGenerar.removeLine({
                                                        sublistId: 'line',
                                                        line: 0
                                                    });
                                                }
                                            }

                                            if ((!utilities.isEmpty(importeIngresoAConfirmar) && !isNaN(parseFloat(importeIngresoAConfirmar, 10)) && importeIngresoAConfirmar > 0)) {

                                                objRecordLiqGenerar.selectNewLine({
                                                    sublistId: 'line'
                                                });
                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'account',
                                                    value: idCuentaIngresoAConfirmar
                                                });

                                                /*objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'currency',
                                                    value: monedaPrincipalSubsidiaria
                                                });*/

                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'currency',
                                                    value: moneda
                                                });

                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'exchangerate',
                                                    value: tipoCambio
                                                });

                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'debit',
                                                    value: importeIngresoAConfirmar
                                                });

                                                objRecordLiqGenerar.commitLine({
                                                    sublistId: 'line'
                                                });


                                                objRecordLiqGenerar.selectNewLine({
                                                    sublistId: 'line'
                                                });
                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'account',
                                                    value: idCuentaIngresoAFacturar
                                                });

                                                /*objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'currency',
                                                    value: monedaPrincipalSubsidiaria
                                                });*/

                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'currency',
                                                    value: moneda
                                                });

                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'exchangerate',
                                                    value: tipoCambio
                                                });

                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'credit',
                                                    value: importeIngresoAConfirmar
                                                });

                                                objRecordLiqGenerar.commitLine({
                                                    sublistId: 'line'
                                                });

                                            }

                                            if ((!utilities.isEmpty(importeDeudaAConfirmar) && !isNaN(parseFloat(importeDeudaAConfirmar, 10)) && importeDeudaAConfirmar > 0)) {

                                                objRecordLiqGenerar.selectNewLine({
                                                    sublistId: 'line'
                                                });
                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'account',
                                                    value: idCuentaDeudaAConfirmar
                                                });

                                                /*objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'currency',
                                                    value: monedaPrincipalSubsidiaria
                                                });*/

                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'currency',
                                                    value: moneda
                                                });

                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'exchangerate',
                                                    value: tipoCambio
                                                });

                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'debit',
                                                    value: importeDeudaAConfirmar
                                                });

                                                objRecordLiqGenerar.commitLine({
                                                    sublistId: 'line'
                                                });


                                                objRecordLiqGenerar.selectNewLine({
                                                    sublistId: 'line'
                                                });
                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'account',
                                                    value: idCuentaDeudaALiquidar
                                                });

                                                /*objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'currency',
                                                    value: monedaPrincipalSubsidiaria
                                                });*/

                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'currency',
                                                    value: moneda
                                                });

                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'exchangerate',
                                                    value: tipoCambio
                                                });

                                                objRecordLiqGenerar.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'credit',
                                                    value: importeDeudaAConfirmar
                                                });

                                                objRecordLiqGenerar.commitLine({
                                                    sublistId: 'line'
                                                });

                                            }


                                            try {
                                                recordIdLiqGenerar = objRecordLiqGenerar.save({
                                                    enableSourcing: true,
                                                    ignoreMandatoryFields: false
                                                });
                                            } catch (excepcionSaveLiqGenerar) {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SCUP043';
                                                respuestaParcial.mensaje = 'Excepcion Grabando Registro de Liquidacion A Generar para el Cupon con ID Interno : ' + respuesta.idCupon + ' - Excepcion : ' + excepcionSaveLiqGenerar.message.toString();
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                            if (utilities.isEmpty(recordIdLiqGenerar)) {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SCUP044';
                                                respuestaParcial.mensaje = 'Error Grabando Registro de Liquidacion A Generar para el Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : No se recibio el ID Interno del Registro de Liquidacion A Generar Generado';
                                                respuesta.detalle.push(respuestaParcial);
                                            } else {
                                                informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_facturado', value: true });
                                                respuesta.idRegLiqGen = recordIdLiqGenerar;
                                                log.debug('Grabar Cupon', 'Liquidacion A Generar Generada con ID : ' + recordIdLiqGenerar);
                                            }
                                        } else {
                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'SCUP045';
                                            respuestaParcial.mensaje = 'Error Grabando Cupon con ID Interno : ' + respuesta.idCupon + ' - Error : No se pudo crear el Registro de Liquidacion A Generar';
                                            respuesta.detalle.push(respuestaParcial);
                                        }
                                    }

                                    // FIN CREAR CUSTOM TRANSACTION LIQUIDACION A GENERAR
                                }

                                //}

                                if (respuesta.error == false) {

                                    // INICIO - ACTUALIZAR CUPON
                                    if (!utilities.isEmpty(recordIdLiqGenerar)) {
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_link_liq_gen', value: recordIdLiqGenerar });
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_imp_ingreso_fact', value: importeIngresoAConfirmar });
                                        //informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_imp_ing_conf', value: 0 });
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_cuenta_ing_fact', value: idCuentaIngresoAFacturar });
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_imp_deuda_pagar', value: importeDeudaAConfirmar });
                                        //informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_imp_deuda_conf', value: 0 });
                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_cuenta_deuda_liq', value: idCuentaDeudaALiquidar });
                                    }

                                    /*

                                    // INICIO - Generar Registro de Liquidacion
                                    var cantidadLineasLiquidacion = informacion.registro.getLineCount({
                                        sublistId: 'recmachcustrecord_3k_liq_emp_cupon'
                                    });

                                    log.debug('Cupon', 'Cantidad de Lineas Liquidaciones : ' + cantidadLineasLiquidacion);

                                    if (cantidadLineasLiquidacion > 0) {
                                        for (var i = 0; i < cantidadLineasLiquidacion; i++) {

                                            var lineNum = informacion.registro.selectLine({
                                                sublistId: 'recmachcustrecord_3k_liq_emp_cupon',
                                                line: i
                                            });

                                            var liquidado = informacion.registro.getSublistValue({
                                                sublistId: 'recmachcustrecord_3k_liq_emp_cupon',
                                                fieldId: 'custrecord_3k_liq_emp_liq',
                                                line: i
                                            });

                                            if (liquidado != true) {
                                                // Eliminar Lineas
                                                informacion.registro.removeLine({
                                                    sublistId: 'recmachcustrecord_3k_liq_emp_cupon',
                                                    line: i
                                                });
                                                i--;
                                                cantidadLineasLiquidacion--;
                                            }
                                        }
                                    }

                                    informacion.registro.selectNewLine({
                                        sublistId: 'recmachcustrecord_3k_liq_emp_cupon'
                                    });

                                    var fechaServidor = new Date();

                                    var fechaLocal = format.format({
                                        value: fechaServidor,
                                        type: format.Type.DATE,
                                        timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                                    });

                                    var fechaLocalStr = format.parse({
                                        value: fechaLocal,
                                        type: format.Type.DATE,
                                        timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                                    });

                                    informacion.registro.setCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_liq_emp_cupon',
                                        fieldId: 'custrecord_3k_liq_emp_fecha',
                                        value: fechaLocalStr
                                    });

                                    informacion.registro.setCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_liq_emp_cupon',
                                        fieldId: 'custrecord_3k_liq_emp_empresa',
                                        value: empresa
                                    });

                                    informacion.registro.setCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_liq_emp_cupon',
                                        fieldId: 'custrecord_3k_liq_emp_moneda',
                                        value: moneda
                                    });

                                    informacion.registro.setCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_liq_emp_cupon',
                                        fieldId: 'custrecord_3k_liq_emp_tipo_cambio',
                                        value: tipoCambio
                                    });

                                    informacion.registro.setCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_liq_emp_cupon',
                                        fieldId: 'custrecord_3k_liq_emp_porc_fact',
                                        value: porcentajeComision
                                    });

                                    informacion.registro.setCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_liq_emp_cupon',
                                        fieldId: 'custrecord_3k_liq_emp_imp_fact',
                                        value: importeIngresoAConfirmar
                                    });

                                    informacion.registro.setCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_liq_emp_cupon',
                                        fieldId: 'custrecord_3k_liq_emp_porc_liq',
                                        value: porcentajeDeuda
                                    });

                                    informacion.registro.setCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_liq_emp_cupon',
                                        fieldId: 'custrecord_3k_liq_emp_imp_liq',
                                        value: importeDeudaAConfirmar
                                    });

                                    informacion.registro.setCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_liq_emp_cupon',
                                        fieldId: 'custrecord_3k_liq_emp_id_det_ov',
                                        value: idOrden
                                    });

                                    informacion.registro.setCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_liq_emp_cupon',
                                        fieldId: 'custrecord_3k_liq_emp_ov',
                                        value: idOV
                                    });

                                    informacion.registro.setCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_liq_emp_cupon',
                                        fieldId: 'custrecord_3k_liq_emp_liq',
                                        value: false
                                    });

                                    informacion.registro.commitLine({
                                        sublistId: 'recmachcustrecord_3k_liq_emp_cupon'
                                    });

                                    // FIN - Generar Registro de Liquidacion

                                    */

                                    // INICIO - Grabar Fecha de USO
                                    var fechaUso = informacion.registro.getValue({
                                        fieldId: 'custrecord_3k_cupon_fecha_uso'
                                    });
                                    var fechaUsoStr = informacion.registro.getValue({
                                        fieldId: 'custrecord_3k_cupon_fecha_uso_str'
                                    });

                                    if (utilities.isEmpty(fechaUso) && !utilities.isEmpty(fechaUsoStr)) {
                                        var fechaUsoDate = format.parse({
                                            value: fechaUsoStr,
                                            type: format.Type.DATETIME,
                                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                                        });

                                        informacion.registro.setValue({ fieldId: 'custrecord_3k_cupon_fecha_uso', value: fechaUsoDate });
                                    }
                                    // FIN - Grabar Fecha de USO

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

                                }
                            } else {
                                var mensaje = 'No se recibio la siguiente informacion Requerida de la Cobranza para procesar el Cupon : ';

                                if (utilities.isEmpty(empresa)) {
                                    mensaje = mensaje + ' Empresa / ';
                                }
                                if (utilities.isEmpty(subsidiaria)) {
                                    mensaje = mensaje + ' Subsidiaria / ';
                                }
                                /*if (utilities.isEmpty(cuentaDeposito)) {
                                    mensaje = mensaje + ' Cuenta Contable Asociada a la Cobranza / ';
                                }*/
                                if (utilities.isEmpty(moneda)) {
                                    mensaje = mensaje + ' Moneda / ';
                                }
                                if (utilities.isEmpty(monedaPrincipalSubsidiaria)) {
                                    mensaje = mensaje + ' Moneda Base Subsidiaria / ';
                                }
                                if (utilities.isEmpty(tipoCambio)) {
                                    mensaje = mensaje + ' Tipo de Cambio / ';
                                }

                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SCUP020';
                                respuestaParcial.mensaje = mensaje;
                                respuesta.detalle.push(respuestaParcial);
                            }

                            /*} else {
                                var mensaje = 'No se encontro la siguiente informacion de la Configuracion de Cupones : ';

                                if (utilities.isEmpty(idCuentaIngresoAConfirmar)) {
                                    mensaje = mensaje + ' Cuenta Contable A Utilizar Para los Ingresos A Confirmar / ';
                                }
                                if (utilities.isEmpty(idCuentaDeudaAConfirmar)) {
                                    mensaje = mensaje + ' Cuenta Contable A Utilizar Para las Deudas A Confirmar / ';
                                }

                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'SCUP028';
                                respuestaParcial.mensaje = mensaje;
                                respuesta.detalle.push(respuestaParcial);
                            }*/
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

        return {
            afterSubmit: afterSubmit
        };

    });
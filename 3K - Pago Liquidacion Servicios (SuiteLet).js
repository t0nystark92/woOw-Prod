/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/

define(['N/ui/serverWidget', 'N/https', 'N/record', 'N/error', 'N/search', 'N/format', 'N/task', '3K/utilities'],

    function(serverWidget, https, record, error, search, format, task, utilities) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            log.audit('Generacion Pagos Servicios REST', 'INICIO Proceso - Metodo : ' + context.request.method + ' Empresa : ' + context.request.parameters.empresa + ' Fecha Inicio : ' + context.request.parameters.fechaInicio + ' Fecha Fin : ' + context.request.parameters.fechafin);

            try {

                var form = serverWidget.createForm({
                    title: 'Pago de Liquidaciones de Servicios'
                });

                //form.clientScriptFileId = 6026;
                form.clientScriptModulePath = './3K - Pago Liquidacion Servicios (Cliente).js'

                var grupoFiltros = form.addFieldGroup({
                    id: 'filtros',
                    label: 'Criterios de Busqueda de Liquidaciones'
                });

                var grupoPago = form.addFieldGroup({
                    id: 'infopago',
                    label: 'Informacion Pago'
                });

                var grupoDatos = form.addFieldGroup({
                    id: 'infoliquidaciones',
                    label: 'Informacion Liquidaciones A Pagar'
                });

                var tabDetalle = form.addTab({
                    id: 'tabdetalle',
                    label: 'Detalle'
                });

                var subTabCupones = form.addSubtab({
                    id: 'tabliquidaciones',
                    label: 'Liquidaciones A Pagar',
                    tab: 'tabdetalle'
                });

                // INICIO CAMPOS
                var btnAccion = form.addField({
                    id: 'custpage_accion',
                    label: 'Accion:',
                    type: serverWidget.FieldType.TEXT,
                    container: 'filtros'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                // FIN CAMPOS

                // INICIO FILTROS
                var sitioWeb = form.addField({
                    id: 'sitioweb',
                    label: 'Sitio Web',
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'customrecord_cseg_3k_sitio_web_o',
                    container: 'filtros'
                });

                var empresa = form.addField({
                    id: 'empresa',
                    label: 'Empresa Proveedor',
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'vendor',
                    container: 'filtros'
                });

                var fechaInicio = form.addField({
                    id: 'fechainicio',
                    label: 'Fecha Desde',
                    type: serverWidget.FieldType.DATE,
                    container: 'filtros'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                //fechaInicio.isMandatory = true;

                var fechaFin = form.addField({
                    id: 'fechafin',
                    label: 'Fecha Hasta',
                    type: serverWidget.FieldType.DATE,
                    container: 'filtros'
                });
                fechaFin.isMandatory = true;

                // Por defecto la Fecha Actual
                var fechaServidor = new Date();

                var fechaLocal = format.format({
                    value: fechaServidor,
                    type: format.Type.DATE,
                    timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                });

                var fechaLocalDate = format.parse({
                    value: fechaLocal,
                    type: format.Type.DATE,
                    timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                });

                if(!utilities.isEmpty(context.request.parameters.fechafin)){
                    fechaFin.defaultValue = context.request.parameters.fechafin;
                }
                else{
                    if (!utilities.isEmpty(fechaLocal)) {
                        //fechaInicio.defaultValue = fechaLocal;
                        fechaFin.defaultValue = fechaLocal;
                    }
                }

                /*var enviarEmailProveedor = form.addField({
                    id: 'enviaremail',
                    label: 'Enviar Factura Comision por Email',
                    type: serverWidget.FieldType.CHECKBOX,
                    container: 'filtros'
                });
                enviarEmailProveedor.defaultValue = 'T';*/

                // FIN FILTROS

                // INICIO DATOS PAGO
                var formaPago = form.addField({
                    id: 'formapago',
                    label: 'Forma de Pago',
                    type: serverWidget.FieldType.SELECT,
                    source: 'customrecord_3k_forma_de_pago',
                    container: 'infopago'
                });

                if(!utilities.isEmpty(context.request.parameters.formapago)){
                    formaPago.defaultValue = context.request.parameters.formapago;
                }

                var formularioImpresion = form.addField({
                    id: 'formimp',
                    label: 'Formulario Impresion Cheques',
                    type: serverWidget.FieldType.SELECT,
                    source: 'customlist3k_formulario_de_impresion',
                    container: 'infopago'
                });

                if(!utilities.isEmpty(context.request.parameters.formimp)){
                    formularioImpresion.defaultValue = context.request.parameters.formimp;
                }

                var fechaDiferida = form.addField({
                    id: 'fechadif',
                    label: 'Fecha Cheque Diferido',
                    type: serverWidget.FieldType.DATE,
                    container: 'infopago'
                });

                if(!utilities.isEmpty(context.request.parameters.fechadif)){
                    fechaDiferida.defaultValue = context.request.parameters.fechadif;
                }

                var imprimirCheque = form.addField({
                    id: 'impcheque',
                    label: 'Cheque Para Imprimir',
                    type: serverWidget.FieldType.CHECKBOX,
                    container: 'infopago'
                });

                if(!utilities.isEmpty(context.request.parameters.impcheque)){
                    imprimirCheque.defaultValue = context.request.parameters.impcheque;
                }
                else{
                    imprimirCheque.defaultValue = 'T';
                }

                // INICIO CARGAR COMBO CUENTAS CONTABLES
                var cuentasContables = search.load({
                    id: 'customsearch_3k_cuentas_proc_pago_liq'
                });

                var resultSet = cuentasContables.run();

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

                var cuentaBanco = form.addField({
                    id: 'cuentabanco',
                    label: 'Cuenta Banco Origen',
                    type: serverWidget.FieldType.SELECT,
                    container: 'infopago'
                });

                cuentaBanco.isMandatory = true;

                cuentaBanco.addSelectOption({
                                value: 0,
                                text: ' ',
                                isSelected: true
                            });

                if (!utilities.isEmpty(completeResultSet) && completeResultSet.length > 0) {

                    for (var i = 0; !utilities.isEmpty(completeResultSet) && completeResultSet.length > 0 && i < completeResultSet.length; i++) {
                        var idCuenta = completeResultSet[i].getValue({
                            name: resultSet.columns[0]
                        });
                        var nombreCuenta = completeResultSet[i].getValue({
                            name: resultSet.columns[1]
                        });

                        if (!utilities.isEmpty(idCuenta) && !utilities.isEmpty(nombreCuenta)) {
                            cuentaBanco.addSelectOption({
                                value: idCuenta,
                                text: nombreCuenta
                            });
                        } else {
                            var mensaje = 'No se pudo obtener la siguiente informacion de las Cuentas Contables para cargar el combo de Cuenta Banco : ';
                            if (utilities.isEmpty(idCuenta)) {
                                mensaje = mensaje + ' ID Interno de la Cuenta / ';
                            }
                            if (utilities.isEmpty(nombreCuenta)) {
                                mensaje = mensaje + ' Nombre de la Cuenta / ';
                            }
                            log.error('Generacion Pagos Servicios REST', 'Suitelet Generacion Pantalla - Error : ' + mensaje);
                        }
                    }
                } else {
                    log.error('Generacion Pagos Servicios REST', 'Suitelet Generacion Pantalla - Error : No se Encontraron Cuentas Contables');
                }
                // FIN CARGAR COMBO CUENTAS CONTABLES

                if(!utilities.isEmpty(context.request.parameters.cuentabanco)){
                    cuentaBanco.defaultValue = context.request.parameters.cuentabanco;
                }

                var fechaPago = form.addField({
                    id: 'fechapago',
                    label: 'Fecha Pago',
                    type: serverWidget.FieldType.DATE,
                    container: 'infopago'
                });

                if(!utilities.isEmpty(context.request.parameters.fechapago)){
                    fechaPago.defaultValue = context.request.parameters.fechapago;
                }
                else{
                    if (!utilities.isEmpty(fechaLocal)) {
                        //fechaInicio.defaultValue = fechaLocal;
                        fechaPago.defaultValue = fechaLocal;
                    }
                }

                var numeroLiquidacion = form.addField({
                    id: 'numliq',
                    label: 'Numero de Referencia',
                    type: serverWidget.FieldType.TEXT,
                    container: 'infopago'
                });

                if(!utilities.isEmpty(context.request.parameters.numliq)){
                    numeroLiquidacion.defaultValue = context.request.parameters.numliq;
                }

                if (context.request.method === 'POST') {
                    fechaPago.isMandatory = true;
                    numeroLiquidacion.isMandatory = true;
                }
                // FIN DATOS PAGO

                ////////////////////////////////////////////////////////////////

                // INICIO CARGAR DATOS BANCARIOS PROVEEDORES
                var informacionBancariaProveedores = new Array();

                var datosBancariosProveedores = search.load({
                    id: 'customsearch_3k_datos_banc_prov_com'
                });

                var resultSet = datosBancariosProveedores.run();

                var completeResultSetDatosBancarios = null;

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
                            completeResultSetDatosBancarios = resultado;
                        else
                            completeResultSetDatosBancarios = completeResultSetDatosBancarios.concat(resultado);
                    }

                    // increase pointer
                    resultIndex = resultIndex + resultStep;

                    // once no records are returned we already got all of them
                } while (!utilities.isEmpty(resultado) && resultado.length > 0)

                if (!utilities.isEmpty(completeResultSetDatosBancarios) && completeResultSetDatosBancarios.length > 0) {

                    for (var i = 0; !utilities.isEmpty(completeResultSetDatosBancarios) && completeResultSetDatosBancarios.length > 0 && i < completeResultSetDatosBancarios.length; i++) {
                        var infoBancaria = new Object();
                        infoBancaria.idProveedor = completeResultSetDatosBancarios[i].getValue({
                            name: resultSet.columns[2]
                        });
                        infoBancaria.idMoneda = completeResultSetDatosBancarios[i].getValue({
                            name: resultSet.columns[3]
                        });
                        infoBancaria.idBanco = completeResultSetDatosBancarios[i].getValue({
                            name: resultSet.columns[4]
                        });
                        
                        if (!utilities.isEmpty(infoBancaria.idProveedor) && !utilities.isEmpty(infoBancaria.idMoneda) && !utilities.isEmpty(infoBancaria.idBanco)) {
                            informacionBancariaProveedores.push(infoBancaria);
                        }
                    }
                }

                var bancoProv = form.addField({
                    id: 'bancoprov',
                    label: 'Banco Pago A Proveedor',
                    type: serverWidget.FieldType.SELECT,
                    source: 'customrecord_3k_bancos',
                    container: 'infopago'
                });

                if(!utilities.isEmpty(context.request.parameters.bancoprov)){
                    bancoProv.defaultValue = context.request.parameters.bancoprov;
                }

                var bancoEmisorPago = form.addField({
                    id: 'bancoemisorpago',
                    label: 'Banco Emisor Pago',
                    type: serverWidget.FieldType.SELECT,
                    //source: 'customrecord_3k_bancos',
                    container: 'infopago'
                });

                if(!utilities.isEmpty(context.request.parameters.bancoemisorpago))
                {
                    bancoEmisorPago.defaultValue = context.request.parameters.bancoemisorpago;
                }
                bancoEmisorPago.isMandatory = true;
                // FIN CARGAR DATOS BANCARIOS PROVEEDORES


                //INICIO - CARGAR LISTADO DE BANCOS EMISORES DE PAGO
                var dataBancoEmisor = search.load({
                    id: 'customsearch_3k_banco_emisor_pago_prov'
                });
                
                var resultSet = dataBancoEmisor.run();
                var completeResultSet = null;
                var resultIndex = 0;
                var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
                var resultado; // temporary variable used to store the result set
                do
                {
                    resultado = resultSet.getRange({
                        start: resultIndex,
                        end: resultIndex + resultStep
                    });

                    if (!utilities.isEmpty(resultado) && resultado.length > 0)
                    {
                        if (resultIndex == 0)
                            completeResultSet = resultado;
                        else
                            completeResultSet = completeResultSet.concat(resultado);
                    }

                    // increase pointer
                    resultIndex = resultIndex + resultStep;
                    // once no records are returned we already got all of them
                } while (!utilities.isEmpty(resultado) && resultado.length > 0)

                if (!utilities.isEmpty(completeResultSet))
                {
                    var i = 0;
                    while (!utilities.isEmpty(completeResultSet) && completeResultSet.length > 0 && i < completeResultSet.length)
                    {
                        var idBanco = completeResultSet[i].getValue({
                            name: resultSet.columns[0]
                        });

                        var nameBanco = completeResultSet[i].getValue({
                            name: resultSet.columns[1]
                        });

                        bancoEmisorPago.addSelectOption({
                            value : idBanco,
                            text : nameBanco
                        });
                        i++;
                    }
                }
                //FIN - CARGAR LISTADO DE BANCOS EMISORES DE PAGO


                //////////////////////////////////////////////////////////////////

                // INICIO SUBLISTA
                var sublistLiquidaciones = form.addSublist({
                    id: 'liquidaciones',
                    type: serverWidget.SublistType.LIST,
                    label: 'Liquidaciones Pendientes de Pagar',
                    tab: 'tabliquidaciones'
                });

                sublistLiquidaciones.addField({
                    id: 'procesar',
                    label: 'Procesar',
                    type: serverWidget.FieldType.CHECKBOX
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.ENTRY
                });

                sublistLiquidaciones.addField({
                    id: 'numero',
                    label: 'Numero Liquidacion',
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistLiquidaciones.addField({
                    id: 'fecha',
                    label: 'Fecha',
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistLiquidaciones.addField({
                    id: 'empresa',
                    label: 'Empresa',
                    type: serverWidget.FieldType.SELECT,
                    source: 'vendor'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistLiquidaciones.addField({
                    id: 'moneda',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Moneda',
                    source: 'currency'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistLiquidaciones.addField({
                    id: 'importepagar',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Importe Pagar'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistLiquidaciones.addField({
                    id: 'sitio',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Sitio Web',
                    source: 'customrecord_cseg_3k_sitio_web_o'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistLiquidaciones.addField({
                    id: 'informacionpago',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Informacion Pago'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistLiquidaciones.addField({
                    id: 'idinternos',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ID Internos'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                sublistLiquidaciones.addMarkAllButtons();
                // FIN SUBLISTA

                form.addSubmitButton({
                    label: 'Buscar Liquidaciones Pendientes de Pago'
                });

                form.addButton({
                    id: 'custpage_btgenpagoliq',
                    label: 'Generar Pago de Liquidaciones',
                    functionName: "generarPagos"
                });

                var infoResultado = form.addField({
                    id: 'custpage_resultado',
                    label: 'Resultados',
                    type: serverWidget.FieldType.INLINEHTML
                });

                if (context.request.method === 'GET') {
                    log.audit('Generacion Pagos Servicios REST', 'FIN Proceso');
                    context.response.writePage(form);
                } else {
                    var sAccion = utilities.isEmpty(context.request.parameters.custpage_accion) ? context.request.parameters.submitter : context.request.parameters.custpage_accion;

                    switch (sAccion) {
                        case 'GENERARPAGO':
                            var mensaje = "Se proceso su solicitud. Recibira una notificacion al finalizar por email";
                            var resultado = generarPagos(sublistLiquidaciones, context.request);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                mensaje = resultado.mensaje;
                                log.error('Generacion Pagos Servicios REST', 'Error Consulta Liquidaciones A Procesar - Error : ' + mensaje);
                            }
                            infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            log.audit('Generacion Pagos Servicios REST', 'FIN Proceso');
                            context.response.writePage(form);
                            break;
                        case 'Buscar Liquidaciones Pendientes de Pago':
                            var resultado = cargarLiquidaciones(sublistLiquidaciones, context.request,informacionBancariaProveedores);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                var mensaje = resultado.mensaje;
                                log.error('Generacion Pagos Servicios REST', 'Error Consulta Liquidaciones Pendientes - Error : ' + mensaje);
                                infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            }
                            log.audit('Generacion Pagos Servicios REST', 'FIN Proceso');
                            context.response.writePage(form);
                            break;
                    }
                }
            } catch (excepcion) {
                log.error('Generacion Pagos Servicios REST', 'Excepcion Proceso Generacion de Pagos de Liquidaciones de Servicios - Excepcion : ' + excepcion.message);
            }
        }

        function generarPagos(sublistAjustes, request) {
            log.audit('Generacion Pagos Servicios REST', 'INICIO Consulta Liquidaciones A Procesar');

            var idLiquidacionesProcesar = new Array();
            var existenLiquidacionesSeleccionadas = false;
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";
            respuesta.estado = "";

            try {
                if (!utilities.isEmpty(request.parameters.liquidacionesdata)) {
                    var delimiterCampos = /\u0001/;
                    var delimiterArray = /\u0002/;

                    /*var enviarEmail = 'F';
                    if (!utilities.isEmpty(request.parameters.enviaremail) && request.parameters.enviaremail == 'T') {
                        enviarEmail = 'T';
                    }*/

                    if (!utilities.isEmpty(request.parameters.liquidacionesdata)) {

                        var sublistaLiquidaciones = request.parameters.liquidacionesdata.split(delimiterArray);

                        if (!utilities.isEmpty(sublistaLiquidaciones) && sublistaLiquidaciones.length > 0) {

                            for (var i = 0; respuesta.error == false && i < sublistaLiquidaciones.length; i++) {
                                if (!utilities.isEmpty(sublistaLiquidaciones[i])) {

                                    var columnas = sublistaLiquidaciones[i].split(delimiterCampos);

                                    if (!utilities.isEmpty(sublistaLiquidaciones) && sublistaLiquidaciones.length > 0) {
                                        var procesar = columnas[0];

                                        if (procesar == 'T') { //solo si est� marcado para enviar
                                            existenLiquidacionesSeleccionadas = true;

                                            var idInternoLiquidaciones = columnas[9];

                                            if (!utilities.isEmpty(idInternoLiquidaciones)) {

                                                idLiquidacionesProcesar.push(idInternoLiquidaciones);
                                            } else {
                                                //Error Obteniendo ID Interno de la Liquidacion a procesar
                                                respuesta.error = true;
                                                respuesta.mensaje = "No se pudo Obtener el ID Interno de las Liquidaciones a procesar";
                                            }
                                        }
                                    } else {
                                        //Error Obteniendo Columnas de Sublista
                                        respuesta.error = true;
                                        respuesta.mensaje = "No se pudo Obtener las columnas de la sublista de Liquidaciones a procesar";
                                    }
                                } else {
                                    //Error Obteniendo Contenido de Sublista
                                    respuesta.error = true;
                                    respuesta.mensaje = "No se pudo Obtener el contenido de la sublista de Liquidaciones a procesar";
                                }

                            }

                        } else {
                            respuesta.error = true;
                            respuesta.mensaje = "No se pudo obtener registros de la sublista de Liquidaciones a procesar";
                        }
                    }

                    if (respuesta.error == false && existenLiquidacionesSeleccionadas == false) {
                        respuesta.error = true;
                        respuesta.mensaje = "No se selecciono ninguna Liquidacion para procesar";
                    }

                    if (respuesta.error == false) {

                        // INCIO - Invocar Script de Pagos

                        parametros = new Object();
                        parametros.custscript_generar_pago_id_liq = idLiquidacionesProcesar.toString();
                        parametros.custscript_generar_pago_forma_pago = request.parameters.formapago;
                        parametros.custscript_generar_pago_fecha_pago = request.parameters.fechapago;
                        parametros.custscript_generar_pago_num_liq = request.parameters.numliq;
                        parametros.custscript_generar_pago_cta_orig = request.parameters.cuentabanco;
                        parametros.custscript_generar_pago_form_imp = request.parameters.formimp;
                        parametros.custscript_generar_pago_fecha_dif = request.parameters.fechadif;
                        parametros.custscript_generar_pago_imp_cheq = request.parameters.impcheque;
                        parametros.custscript_generar_pago_banco_emisor = request.parameters.bancoemisorpago;
                        
                        log.debug('Generacion Pagos Servicios REST', 'Generacion Pagos - ID Liquidaciones A Procesar : ' + parametros.custscript_generar_liq_id_liq);

                        log.debug('Generacion Pagos Servicios REST', 'Generacion Pagos - INICIO llamada Script MAP/REDUCE');

                        log.debug('Generacion Pagos Servicios REST','Parametros: '+JSON.stringify(parametros));

                        respuesta = createAndSubmitMapReduceJob('customscript_3k_generacion_pago_liq_mp', parametros);

                        var mensajeEstado = "";
                        if (!utilities.isEmpty(respuesta) && !utilities.isEmpty(respuesta.estado)) {
                            mensajeEstado = respuesta.estado.status;
                        }

                        log.debug('Generacion Pagos Servicios REST', 'Generacion Pagos - /REDUCE - Estado : ' + mensajeEstado);

                        // FIN - Invicar Script de Pagos

                    }
                } else {
                    respuesta.error = true;
                    respuesta.mensaje = "No se pudo obtener sublista de Liquidaciones a procesar";
                }

            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Liquidaciones A Procesar - Excepcion : " + excepcion.message;

                log.error('Generacion Pagos Servicios REST', 'Consulta Liquidaciones A Procesar - Excepcion Consultando Liquidaciones A Procesar - Excepcion : ' + excepcion.message);
            }
            log.audit('Generacion Pagos Servicios REST', 'FIN Consulta Liquidaciones A Procesar');
            return respuesta;
        }

        function cargarLiquidaciones(sublistLiquidaciones, request,informacionBancariaProveedores) {
            log.audit('Generacion Pagos Servicios REST', 'INICIO Consulta Liquidaciones Pendientes');
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";

            try {

                var separadorMultiSelect = /\u0005/;

                var liquidacionesPendientes = search.load({
                    id: 'customsearch_3k_liq_pend_pago'
                });

                if (!utilities.isEmpty(request.parameters.cuentabanco)) {
                    var objRecord = record.load({
                            type: record.Type.ACCOUNT,
                            id: request.parameters.cuentabanco,
                            isDynamic: true
                        });

                    var monedaCuenta = objRecord.getValue({
                            fieldId: 'currency'
                        });

                    if (!utilities.isEmpty(monedaCuenta)) {
                        var filtroMoneda = search.createFilter({
                            name: 'custrecord_3k_liq_emp_moneda',
                            operator: search.Operator.ANYOF,
                            values: monedaCuenta
                        });

                        liquidacionesPendientes.filters.push(filtroMoneda);

                    }
                }

                if (!utilities.isEmpty(request.parameters.sitioweb)) {
                    var sitiosSeleccionados = request.parameters.sitioweb.split(separadorMultiSelect);
                    if (!utilities.isEmpty(sitiosSeleccionados) && sitiosSeleccionados.length > 0) {
                        var filtroSitio = search.createFilter({
                            name: 'custrecord_52_cseg_3k_sitio_web_o',
                            operator: search.Operator.ANYOF,
                            values: sitiosSeleccionados
                        });

                        liquidacionesPendientes.filters.push(filtroSitio);

                    }
                }

                if (!utilities.isEmpty(request.parameters.empresa)) {
                    var empresasSeleccionadas = request.parameters.empresa.split(separadorMultiSelect);
                    if (!utilities.isEmpty(empresasSeleccionadas) && empresasSeleccionadas.length > 0) {
                        var filtroEmpresa = search.createFilter({
                            name: 'custrecord_3k_liq_emp_prov',
                            operator: search.Operator.ANYOF,
                            values: empresasSeleccionadas
                        });

                        liquidacionesPendientes.filters.push(filtroEmpresa);

                    }
                }

                if (!utilities.isEmpty(request.parameters.fechainicio)) {
                    var filtroFechaInicio = search.createFilter({
                        name: 'custrecord_3k_liq_emp_fecha',
                        operator: search.Operator.ONORAFTER,
                        values: request.parameters.fechainicio
                    });

                    liquidacionesPendientes.filters.push(filtroFechaInicio);

                }

                if (!utilities.isEmpty(request.parameters.fechafin)) {
                    var filtroFechaFin = search.createFilter({
                        name: 'custrecord_3k_liq_emp_fecha',
                        operator: search.Operator.ONORBEFORE,
                        values: request.parameters.fechafin
                    });

                    liquidacionesPendientes.filters.push(filtroFechaFin);

                }

                // INICIO - Consulta Cupones Pendientes

                var resultSet = liquidacionesPendientes.run();

                var completeResultSetLiquidaciones = null;

                log.debug('Generacion Pagos Servicios REST', 'INICIO Consulta Busqueda Liquidaciones Pendientes');

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
                            completeResultSetLiquidaciones = resultado;
                        else
                            completeResultSetLiquidaciones = completeResultSetLiquidaciones.concat(resultado);
                    }

                    // increase pointer
                    resultIndex = resultIndex + resultStep;

                    // once no records are returned we already got all of them
                } while (!utilities.isEmpty(resultado) && resultado.length > 0)

                log.debug('Generacion Pagos Servicios REST', 'FIN Consulta Busqueda Liquidaciones Pendientes');

                if (!utilities.isEmpty(completeResultSetLiquidaciones)) {
                    log.debug('Generacion Pagos Servicios REST', 'FIN Consulta Busqueda Liquidaciones Pendientes - Cantidad Registros Encontrados : ' + completeResultSetLiquidaciones.length);

                    var indiceSublista = 0;

                    for (var i = 0; !utilities.isEmpty(completeResultSetLiquidaciones) && completeResultSetLiquidaciones.length > 0 && i < completeResultSetLiquidaciones.length; i++) {


                        var idInterno = completeResultSetLiquidaciones[i].getValue({
                            name: resultSet.columns[0]
                        });

                        var fecha = completeResultSetLiquidaciones[i].getValue({
                            name: resultSet.columns[1]
                        });

                        var idEmpresa = completeResultSetLiquidaciones[i].getValue({
                            name: resultSet.columns[2]
                        });

                        var idMoneda = completeResultSetLiquidaciones[i].getValue({
                            name: resultSet.columns[3]
                        });

                        var importePagar = completeResultSetLiquidaciones[i].getValue({
                            name: resultSet.columns[4]
                        });

                        var sitio = completeResultSetLiquidaciones[i].getValue({
                            name: resultSet.columns[5]
                        });

                        var idLiquidacion = completeResultSetLiquidaciones[i].getValue({
                            name: resultSet.columns[6]
                        });

                        var informacionPago = completeResultSetLiquidaciones[i].getValue({
                            name: resultSet.columns[7]
                        });

                        var incluirEnsublista=true;

                        if (!utilities.isEmpty(request.parameters.bancoprov)) {
                            if (!utilities.isEmpty(informacionBancariaProveedores) && informacionBancariaProveedores.length > 0) {
                                var objDetalleBancario = informacionBancariaProveedores.filter(function(obj) {
                                    return (obj.idProveedor == idEmpresa && obj.idMoneda == idMoneda && obj.idBanco == request.parameters.bancoprov);
                                });
                                if (!utilities.isEmpty(objDetalleBancario) && objDetalleBancario.length > 0) {
                                    incluirEnsublista=true;
                                }
                                else{
                                    incluirEnsublista=false;
                                }
                            }
                            else{
                                incluirEnsublista=false;
                            }
                        }

                        if(incluirEnsublista==true){

                            sublistLiquidaciones.setSublistValue({
                                id: 'numero',
                                line: indiceSublista,
                                value: idLiquidacion
                            });


                            sublistLiquidaciones.setSublistValue({
                                id: 'fecha',
                                line: indiceSublista,
                                value: fecha
                            });

                            if(!utilities.isEmpty(idEmpresa)){
                                sublistLiquidaciones.setSublistValue({
                                    id: 'empresa',
                                    line: indiceSublista,
                                    value: idEmpresa
                                });
                            }

                            if(!utilities.isEmpty(idMoneda)){
                                sublistLiquidaciones.setSublistValue({
                                    id: 'moneda',
                                    line: indiceSublista,
                                    value: idMoneda
                                });
                            }

                            sublistLiquidaciones.setSublistValue({
                                id: 'importepagar',
                                line: indiceSublista,
                                value: importePagar
                            });

                            if(!utilities.isEmpty(sitio)){

                                sublistLiquidaciones.setSublistValue({
                                    id: 'sitio',
                                    line: indiceSublista,
                                    value: sitio
                                });

                            }

                            if(!utilities.isEmpty(informacionPago)){
                                sublistLiquidaciones.setSublistValue({
                                    id: 'informacionpago',
                                    line: indiceSublista,
                                    value: informacionPago
                                });
                            }

                            sublistLiquidaciones.setSublistValue({
                                id: 'idinternos',
                                line: indiceSublista,
                                value: idInterno.toString()
                            });

                            indiceSublista++;

                        }

                    } //for
                } //if

                // FIN - Consulta Liquidaciones Pendientes

                if (utilities.isEmpty(completeResultSetLiquidaciones)) {
                    respuesta.error = true;
                    respuesta.mensaje = "No se encontraron Liquidaciones Pendientes";
                    log.audit('Generacion Pagos Servicios REST', 'FIN Consulta Busqueda Liquidaciones Pendientes - No se encontraron Liquidaciones Pendientes');
                }

            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Liquidaciones - Excepcion : " + excepcion.message;
                log.error('Generacion Pagos Servicios REST', 'Consulta Busqueda Liquidaciones Pendientes - Excepcion Consultando Liquidaciones - Excepcion : ' + excepcion.message);
            }

            log.audit('Generacion Pagos Servicios REST', 'FIN Consulta Liquidaciones Pendientes');
            return respuesta;
        }

        function createAndSubmitMapReduceJob(idScript, parametros) {
            log.audit('Generacion Pagos Servicios REST', 'INICIO Invocacion Script MAP/REDUCE');
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
                log.error('Generacion Pagos Servicios REST', 'Generacion Facturas Liquidaciones - Excepcion Invocando A Script MAP/REDUCE - Excepcion : ' + excepcion.message);
            }
            log.audit('Generacion Pagos Servicios REST', 'FIN Invocacion Script MAP/REDUCE');
            return respuesta;
        }

        return {
            onRequest: onRequest
        };

    });

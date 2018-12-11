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
            log.audit('Generacion Liquidaciones Servicios REST', 'INICIO Proceso - Metodo : ' + context.request.method + ' Empresa : ' + context.request.parameters.empresa + ' Fecha Inicio : ' + context.request.parameters.fechainicio + ' Fecha Fin : ' + context.request.parameters.fechafin);

            try {

                var form = serverWidget.createForm({
                    title: 'Generacion de Liquidaciones de Servicios'
                });

                //form.clientScriptFileId = 6026;
                form.clientScriptModulePath = './3K - Generacion Liquidacion Servicios (Cliente).js'

                var grupoFiltros = form.addFieldGroup({
                    id: 'filtros',
                    label: 'Criterios de Busqueda de Cupones A Liquidar'
                });

                var grupoDatos = form.addFieldGroup({
                    id: 'inforequisiciones',
                    label: 'Informacion Cupones A Liquidar'
                });

                var tabDetalle = form.addTab({
                    id: 'tabdetalle',
                    label: 'Detalle'
                });

                var subTabCupones = form.addSubtab({
                    id: 'tabcupones',
                    label: 'Cupones A Liquidar',
                    tab: 'tabdetalle'
                });

                var subTabAjustes = form.addSubtab({
                    id: 'tabajustes',
                    label: 'Ajustes A Liquidar',
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
                    label: 'Empresa Cliente',
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'customer',
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

                if(!utilities.isEmpty(context.request.parameters.fechafin)){
                    fechaFin.defaultValue = context.request.parameters.fechafin;
                }
                else{

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

                // INICIO SUBLISTA
                var sublistCupones = form.addSublist({
                    id: 'cupones',
                    type: serverWidget.SublistType.LIST,
                    label: 'Cupones Pendientes Liquidacion',
                    tab: 'tabcupones'
                });

                sublistCupones.addField({
                    id: 'procesar',
                    label: 'Procesar',
                    type: serverWidget.FieldType.CHECKBOX
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.ENTRY
                });

                /*sublistCupones.addField({
                    id: 'fecha',
                    label: 'Fecha',
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });*/

                sublistCupones.addField({
                    id: 'empresa',
                    label: 'Empresa',
                    type: serverWidget.FieldType.SELECT,
                    source: 'vendor'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                /*sublistCupones.addField({
                    id: 'cupon',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Cupon',
                    source: 'customrecord_3k_cupones'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });*/

                sublistCupones.addField({
                    id: 'moneda',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Moneda',
                    source: 'currency'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                /*sublistCupones.addField({
                    id: 'tipocambio',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Tipo de Cambio'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'importecupon',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Importe Cupon'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'porcentajefacturar',
                    type: serverWidget.FieldType.PERCENT,
                    label: 'Porcentaje Facturacion'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });*/

                sublistCupones.addField({
                    id: 'importefacturar',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Importe Facturar'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                /*sublistCupones.addField({
                    id: 'porcentajeliquidar',
                    type: serverWidget.FieldType.PERCENT,
                    label: 'Porcentaje Liquidacion'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });*/

                sublistCupones.addField({
                    id: 'importeliquidar',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Importe Liquidar'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'sitio',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Sitio Web',
                    source: 'customrecord_cseg_3k_sitio_web_o'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                /*sublistCupones.addField({
                    id: 'info',
                    type: serverWidget.FieldType.URL,
                    label: 'Detalle Cupones',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });*/

                sublistCupones.addField({
                    id: 'idinternos',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ID Internos'
                });/*.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });*/

                sublistCupones.addField({
                    id: 'idinternos2',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ID Internos 2'
                });/*.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });*/

                sublistCupones.addField({
                    id: 'idinternos3',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ID Internos 3'
                });/*.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });*/

                sublistCupones.addField({
                    id: 'idinternos4',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ID Internos 4'
                });/*.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });*/

                sublistCupones.addMarkAllButtons();
                // FIN SUBLISTA

                var sublistAjustes = form.addSublist({
                    id: 'ajustes',
                    type: serverWidget.SublistType.LIST,
                    label: 'Ajustes Liquidaciones Pendientes',
                    tab: 'tabajustes'
                });

                sublistAjustes.addField({
                    id: 'procesar',
                    label: 'Procesar',
                    type: serverWidget.FieldType.CHECKBOX
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.ENTRY
                });

                /*sublistAjustes.addField({
                    id: 'fecha',
                    label: 'Fecha',
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });*/

                sublistAjustes.addField({
                    id: 'empresa',
                    label: 'Empresa',
                    type: serverWidget.FieldType.SELECT,
                    source: 'vendor'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                /*sublistAjustes.addField({
                    id: 'cupon',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Cupon',
                    source: 'customrecord_3k_cupones'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });*/

                sublistAjustes.addField({
                    id: 'moneda',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Moneda',
                    source: 'currency'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                /*sublistAjustes.addField({
                    id: 'tipocambio',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Tipo de Cambio'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });*/

                /*sublistAjustes.addField({
                    id: 'importecupon',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Importe Cupon'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });*/

                sublistAjustes.addField({
                    id: 'importefacturar',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Importe Facturar'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistAjustes.addField({
                    id: 'importeliquidar',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Importe Liquidar'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistAjustes.addField({
                    id: 'sitio',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Sitio Web',
                    source: 'customrecord_cseg_3k_sitio_web_o'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistAjustes.addField({
                    id: 'idinternos',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ID Internos'
                });/*.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });*/

                sublistAjustes.addMarkAllButtons();

                form.addSubmitButton({
                    label: 'Buscar Liquidaciones Pendientes'
                });

                form.addButton({
                    id: 'custpage_btgenliq',
                    label: 'Generar Liquidacion Servicios',
                    functionName: "generarLiquidacion"
                });

                var infoResultado = form.addField({
                    id: 'custpage_resultado',
                    label: 'Resultados',
                    type: serverWidget.FieldType.INLINEHTML
                });

                if (context.request.method === 'GET') {
                    log.audit('Generacion Liquidaciones Servicios REST', 'FIN Proceso');
                    context.response.writePage(form);
                } else {
                    var sAccion = utilities.isEmpty(context.request.parameters.custpage_accion) ? context.request.parameters.submitter : context.request.parameters.custpage_accion;

                    switch (sAccion) {
                        case 'GENERARLIQ':
                            var mensaje = "Se proceso su solicitud. Recibira una notificacion al finalizar por email";
                            var resultado = generarLiquidaciones(sublistCupones, sublistAjustes, context.request);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                mensaje = resultado.mensaje;
                                log.error('Generacion Liquidaciones Servicios REST', 'Error Consulta Liquidaciones A Procesar - Error : ' + mensaje);
                            }
                            infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            log.audit('Generacion Liquidaciones Servicios REST', 'FIN Proceso');
                            context.response.writePage(form);
                            break;
                        case 'Buscar Liquidaciones Pendientes':
                            var resultado = cargarLiquidaciones(sublistCupones, sublistAjustes, context.request);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                var mensaje = resultado.mensaje;
                                log.error('Generacion Liquidaciones Servicios REST', 'Error Consulta Liquidaciones Pendientes - Error : ' + mensaje);
                                infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            }
                            log.audit('Generacion Liquidaciones Servicios REST', 'FIN Proceso');
                            context.response.writePage(form);
                            break;
                    }
                }
            } catch (excepcion) {
                log.error('Generacion Liquidaciones Servicios REST', 'Excepcion Proceso Generacion de Liquidaciones de Servicios - Excepcion : ' + excepcion.message);
            }
        }

        function generarLiquidaciones(sublistCupones, sublistAjustes, request) {
            log.audit('Generacion Liquidaciones Servicios REST', 'INICIO Consulta Liquidaciones A Procesar');

            var idCuponesProcesar = new Array();
            var idAjustesProcesar = new Array();
            var existenLiquidacionesSeleccionadas = false;
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";
            respuesta.estado = "";

            try {
                if (!utilities.isEmpty(request.parameters.cuponesdata) || !utilities.isEmpty(request.parameters.ajustesdata)) {
                    var delimiterCampos = /\u0001/;
                    var delimiterArray = /\u0002/;

                    /*var enviarEmail = 'F';
                    if (!utilities.isEmpty(request.parameters.enviaremail) && request.parameters.enviaremail == 'T') {
                        enviarEmail = 'T';
                    }*/

                    if (!utilities.isEmpty(request.parameters.cuponesdata)) {

                        var sublistaCupones = request.parameters.cuponesdata.split(delimiterArray);

                        if (!utilities.isEmpty(sublistaCupones) && sublistaCupones.length > 0) {

                            for (var i = 0; respuesta.error == false && i < sublistaCupones.length; i++) {
                                if (!utilities.isEmpty(sublistaCupones[i])) {

                                    var columnas = sublistaCupones[i].split(delimiterCampos);

                                    if (!utilities.isEmpty(sublistaCupones) && sublistaCupones.length > 0) {
                                        var procesar = columnas[0];

                                        if (procesar == 'T') { //solo si est� marcado para enviar
                                            existenLiquidacionesSeleccionadas = true;

                                            var idInternoCupones = columnas[7];
                                            var idInternoCupones2 = columnas[8];
                                            var idInternoCupones3 = columnas[9];
                                            var idInternoCupones4 = columnas[10];

                                            log.audit('Generacion Liquidaciones Servicios REST', 'INFO : ' + JSON.stringify(columnas));

                                            if (!utilities.isEmpty(idInternoCupones)) {


                                                if (!utilities.isEmpty(idInternoCupones2)) {

                                                    idInternoCupones = idInternoCupones + ',' + idInternoCupones2;

                                                }

                                                if (!utilities.isEmpty(idInternoCupones3)) {

                                                    idInternoCupones = idInternoCupones + ',' + idInternoCupones3;

                                                }

                                                if (!utilities.isEmpty(idInternoCupones4)) {

                                                    idInternoCupones = idInternoCupones + ',' + idInternoCupones4;

                                                }

                                                idCuponesProcesar.push(idInternoCupones);
                                            } else {
                                                //Error Obteniendo ID Interno de la Liquidacion a procesar
                                                respuesta.error = true;
                                                respuesta.mensaje = "No se pudo Obtener el ID Interno de los Cupones a procesar";
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
                            respuesta.mensaje = "No se pudo obtener registros de la sublista de Cupones a procesar";
                        }
                    }

                    if (!utilities.isEmpty(request.parameters.ajustesdata)) {

                        var sublistaAjustes = request.parameters.ajustesdata.split(delimiterArray);

                        if (!utilities.isEmpty(sublistaAjustes) && sublistaAjustes.length > 0) {

                            for (var i = 0; respuesta.error == false && i < sublistaAjustes.length; i++) {
                                if (!utilities.isEmpty(sublistaAjustes[i])) {

                                    var columnas = sublistaAjustes[i].split(delimiterCampos);

                                    if (!utilities.isEmpty(sublistaAjustes) && sublistaAjustes.length > 0) {
                                        var procesar = columnas[0];

                                        if (procesar == 'T') { //solo si est� marcado para enviar
                                            existenLiquidacionesSeleccionadas = true;

                                            var idInternoAjustes = columnas[7];

                                            if (!utilities.isEmpty(idInternoAjustes)) {

                                                idAjustesProcesar.push(idInternoAjustes);
                                            } else {
                                                //Error Obteniendo ID Interno de la Liquidacion a procesar
                                                respuesta.error = true;
                                                respuesta.mensaje = "No se pudo Obtener el ID Interno de los Ajustes a procesar";
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
                            respuesta.mensaje = "No se pudo obtener registros de la sublista de Ajustes a procesar";
                        }

                    }

                    if (respuesta.error == false && existenLiquidacionesSeleccionadas == false) {
                        respuesta.error = true;
                        respuesta.mensaje = "No se selecciono ninguna Liquidacion para procesar";
                    }

                    if (respuesta.error == false) {

                        // INCIO - Invicar Script de Facturacion

                        /*parametros = new Object();
                        parametros.custscript_generar_op_liq_id = idLiquidacionesProcesar.toString();
                        parametros.custscript_generar_op_email = enviarEmail;

                        log.debug('Generacion Liquidaciones Servicios REST', 'Generacion Ordenes de Pago - ID Liquidaciones A Procesar : ' + parametros.custscript_generar_op_liq_id);

                        log.debug('Generacion Liquidaciones Servicios REST', 'Generacion  Ordenes de Pago - INICIO llamada Script MAP/REDUCE');

                        respuesta = createAndSubmitMapReduceJob('customscript_3k_generacion_op_liq_mp', parametros);

                        var mensajeEstado = "";
                        if (!utilities.isEmpty(respuesta) && !utilities.isEmpty(respuesta.estado)) {
                            mensajeEstado = respuesta.estado.status;
                        }

                        log.debug('Generacion Liquidaciones Servicios REST', 'Generacion  Ordenes de Pago - /REDUCE - Estado : ' + mensajeEstado);*/

                        // FIN - Invicar Script de Facturacion

                        // INCIO - Invocar Script de Pago

                        parametros = new Object();
                        parametros.custscript_generar_liq_id_cup = idCuponesProcesar.toString();
                        parametros.custscript_generar_liq_id_aju = idAjustesProcesar.toString();
                        parametros.custscript_generar_liq_fecha_corte = request.parameters.fechafin;
                        //parametros.custscript_generar_fact_email = enviarEmail;

                        log.debug('Generacion Liquidaciones Servicios REST', 'Generacion Pagos - ID Cupones A Procesar : ' + parametros.custscript_generar_liq_id_cup);
                        log.debug('Generacion Liquidaciones Servicios REST', 'Generacion Pagos - ID Ajustes A Procesar : ' + parametros.custscript_generar_liq_id_aju);
                        log.debug('Generacion Liquidaciones Servicios REST', 'Generacion Pagos - Fecha Corte : ' + parametros.custscript_generar_liq_fecha_corte);

                        log.debug('Generacion Liquidaciones Servicios REST', 'Generacion Pagos - INICIO llamada Script MAP/REDUCE');

                        respuesta = createAndSubmitMapReduceJob('customscript_3k_generacion_liq_mp', parametros);

                        var mensajeEstado = "";
                        if (!utilities.isEmpty(respuesta) && !utilities.isEmpty(respuesta.estado)) {
                            mensajeEstado = respuesta.estado.status;
                        }

                        log.debug('Generacion Liquidaciones Servicios REST', 'Generacion Pagos - /REDUCE - Estado : ' + mensajeEstado);

                        // FIN - Invicar Script de Pago

                    }
                } else {
                    respuesta.error = true;
                    respuesta.mensaje = "No se pudo obtener sublista de Liquidaciones a procesar";
                }

            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Liquidaciones A Procesar - Excepcion : " + excepcion.message;

                log.error('Generacion Liquidaciones Servicios REST', 'Consulta Liquidaciones A Procesar - Excepcion Consultando Liquidaciones A Procesar - Excepcion : ' + excepcion.message);
            }
            log.audit('Generacion Liquidaciones Servicios REST', 'FIN Consulta Liquidaciones A Procesar');
            return respuesta;
        }

        function cargarLiquidaciones(sublistCupones, sublistAjustes, request) {
            log.audit('Generacion Liquidaciones Servicios REST', 'INICIO Consulta Liquidaciones Pendientes');
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";

            try {

                var separadorMultiSelect = /\u0005/;

                var cuponesPendientes = search.load({
                    id: 'customsearch_3k_cupones_pend_liq'
                });

                var ajustesPendientes = search.load({
                    id: 'customsearch_3k_ajustes_pend_liq'
                });

                if (!utilities.isEmpty(request.parameters.sitioweb)) {
                    var sitiosSeleccionados = request.parameters.sitioweb.split(separadorMultiSelect);
                    if (!utilities.isEmpty(sitiosSeleccionados) && sitiosSeleccionados.length > 0) {
                        var filtroEmpresa = search.createFilter({
                            name: 'custrecord_69_cseg_3k_sitio_web_o',
                            operator: search.Operator.ANYOF,
                            values: sitiosSeleccionados
                        });

                        cuponesPendientes.filters.push(filtroEmpresa);

                        var filtroEmpresa = search.createFilter({
                            name: 'custrecord_85_cseg_3k_sitio_web_o',
                            operator: search.Operator.ANYOF,
                            values: sitiosSeleccionados
                        });

                        ajustesPendientes.filters.push(filtroEmpresa);
                    }
                }

                if (!utilities.isEmpty(request.parameters.empresa)) {
                    var empresasSeleccionadas = request.parameters.empresa.split(separadorMultiSelect);
                    if (!utilities.isEmpty(empresasSeleccionadas) && empresasSeleccionadas.length > 0) {
                        var filtroEmpresa = search.createFilter({
                            name: 'custrecord_3k_cupon_empresa',
                            operator: search.Operator.ANYOF,
                            values: empresasSeleccionadas
                        });

                        cuponesPendientes.filters.push(filtroEmpresa);

                        var filtroEmpresa = search.createFilter({
                            name: 'custrecord_3k_ajustes_liq_emp_emp',
                            operator: search.Operator.ANYOF,
                            values: empresasSeleccionadas
                        });

                        ajustesPendientes.filters.push(filtroEmpresa);
                    }
                }

                if (!utilities.isEmpty(request.parameters.fechainicio)) {
                    var filtroFechaInicio = search.createFilter({
                        name: 'custrecord_3k_cupon_fecha_uso',
                        operator: search.Operator.ONORAFTER,
                        values: request.parameters.fechainicio
                    });

                    cuponesPendientes.filters.push(filtroFechaInicio);

                    var filtroFechaInicio = search.createFilter({
                        name: 'custrecord_3k_ajustes_liq_emp_fecha',
                        operator: search.Operator.ONORAFTER,
                        values: request.parameters.fechainicio
                    });

                    ajustesPendientes.filters.push(filtroFechaInicio);
                }

                if (!utilities.isEmpty(request.parameters.fechafin)) {
                    var filtroFechaFin = search.createFilter({
                        name: 'custrecord_3k_cupon_fecha_uso',
                        operator: search.Operator.ONORBEFORE,
                        values: request.parameters.fechafin
                    });

                    cuponesPendientes.filters.push(filtroFechaFin);

                    var filtroFechaFin = search.createFilter({
                        name: 'custrecord_3k_ajustes_liq_emp_fecha',
                        operator: search.Operator.ONORBEFORE,
                        values: request.parameters.fechafin
                    });

                    ajustesPendientes.filters.push(filtroFechaFin);
                }

                // INICIO - Consulta Cupones Pendientes

                var resultSet = cuponesPendientes.run();

                var completeResultSetCupones = null;

                log.debug('Generacion Liquidaciones Servicios REST', 'INICIO Consulta Busqueda Cupones Pendientes');

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
                            completeResultSetCupones = resultado;
                        else
                            completeResultSetCupones = completeResultSetCupones.concat(resultado);
                    }

                    // increase pointer
                    resultIndex = resultIndex + resultStep;

                    // once no records are returned we already got all of them
                } while (!utilities.isEmpty(resultado) && resultado.length > 0)

                log.debug('Generacion Liquidaciones Servicios REST', 'FIN Consulta Busqueda Cupones Pendientes');

                var j = 0;

                if (!utilities.isEmpty(completeResultSetCupones)) {
                    log.debug('Generacion Liquidaciones Servicios REST', 'FIN Consulta Busqueda Cupones Pendientes - Cantidad Registros Encontrados : ' + completeResultSetCupones.length);

                    var idUnico = 0;
                    var idUnicoAnterior = 0;
                    var idInternosTotal =[];

                    var i = 0;

                    while (!utilities.isEmpty(completeResultSetCupones) && completeResultSetCupones.length > 0 && i < completeResultSetCupones.length) {

                        var idEmpresa = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[2]
                        });

                        var idMoneda = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[13]
                        });

                        var sitio = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[11]
                        });

                        idUnico = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[15]
                        });

                        var idInternos = new Array();
                        var idInternos2 = new Array();
                        var idInternos3 = new Array();
                        var idInternos4 = new Array();
                        var importeFacturacionTotal = 0;
                        var importeLiquidacionTotal = 0;

                        do {
                            idUnicoAnterior = idUnico;

                            var idInterno = completeResultSetCupones[i].getValue({
                                name: resultSet.columns[0]
                            });

                            /*var importeFacturacion = completeResultSetCupones[i].getValue({
                                name: resultSet.columns[8]
                            });*/

                            var importeFacturacion = completeResultSetCupones[i].getValue({
                                name: resultSet.columns[16]
                            });

                            var importeLiquidacion = completeResultSetCupones[i].getValue({
                                name: resultSet.columns[10]
                            });

                            if (!utilities.isEmpty(importeFacturacion) && !isNaN(importeFacturacion)) {
                                importeFacturacionTotal = parseFloat(importeFacturacionTotal, 10) + parseFloat(importeFacturacion, 10);
                            }
                            if (!utilities.isEmpty(importeLiquidacion) && !isNaN(importeLiquidacion)) {
                                importeLiquidacionTotal = parseFloat(importeLiquidacionTotal, 10) + parseFloat(importeLiquidacion, 10);
                            }
                            
                            if (idInternos.toString().length <= 3800) {
                                idInternosTotal.push(idInterno);
                                idInternos.push(idInterno);
                            } else {
                                if (idInternos2.toString().length <= 3800) {
                                    idInternos2.push(idInterno);
                                    idInternosTotal.push(idInterno);
                                }
                                else{
                                    if (idInternos3.toString().length <= 3800) {
                                        idInternos3.push(idInterno);
                                        idInternosTotal.push(idInterno);
                                    }
                                    else{
                                        idInternos4.push(idInterno);
                                        idInternosTotal.push(idInterno);
                                    }
                                }
                            }

                            i++;
                            if (i < completeResultSetCupones.length) {

                                idUnico = completeResultSetCupones[i].getValue({
                                    name: resultSet.columns[15]
                                });

                            }

                        } while (i < completeResultSetCupones.length && idUnico == idUnicoAnterior)



                        /*sublistCupones.setSublistValue({
                            id: 'fecha',
                            line: j,
                            value: fecha
                        });*/

                        sublistCupones.setSublistValue({
                            id: 'empresa',
                            line: j,
                            value: idEmpresa
                        });

                        /*sublistCupones.setSublistValue({
                            id: 'cupon',
                            line: j,
                            value: idInterno
                        });*/

                        sublistCupones.setSublistValue({
                            id: 'moneda',
                            line: j,
                            value: idMoneda
                        });

                        /*sublistCupones.setSublistValue({
                            id: 'tipocambio',
                            line: j,
                            value: tipoCambio
                        });

                        sublistCupones.setSublistValue({
                            id: 'importecupon',
                            line: j,
                            value: importeCupon
                        });

                        sublistCupones.setSublistValue({
                            id: 'porcentajefacturar',
                            line: j,
                            value: porcentajeFacturacion
                        });*/

                        sublistCupones.setSublistValue({
                            id: 'importefacturar',
                            line: j,
                            value: parseFloat(importeFacturacionTotal,10).toFixed(2)
                        });

                        /*sublistCupones.setSublistValue({
                            id: 'porcentajeliquidar',
                            line: j,
                            value: porcentajeLiquidacion
                        });*/

                        sublistCupones.setSublistValue({
                            id: 'importeliquidar',
                            line: j,
                            value: parseFloat(importeLiquidacionTotal,10).toFixed(2)
                        });

                        sublistCupones.setSublistValue({
                            id: 'sitio',
                            line: j,
                            value: sitio
                        });

                        /*sublistCupones.setSublistValue({
                            id: 'info',
                            line: j,
                            value: 'https://system.sandbox.netsuite.com/app/common/search/searchresults.nl?searchid=48&saverun=T&AEV_Entity_INTERNALID=12446'
                        });*/

                        //log.debug('LIQ','INFORMACION ID 1 : ' + idInternos + ' - ID 2 : ' + idInternos2);

                        sublistCupones.setSublistValue({
                            id: 'idinternos',
                            line: j,
                            value: idInternos.toString()
                        });


                        if (!utilities.isEmpty(idInternos2) && idInternos2.length>0) {
                            sublistCupones.setSublistValue({
                                id: 'idinternos2',
                                line: j,
                                value: idInternos2.toString()
                            });
                        }

                        if (!utilities.isEmpty(idInternos3) && idInternos3.length>0) {
                            sublistCupones.setSublistValue({
                                id: 'idinternos3',
                                line: j,
                                value: idInternos3.toString()
                            });
                        }

                        if (!utilities.isEmpty(idInternos4) && idInternos4.length>0) {
                            sublistCupones.setSublistValue({
                                id: 'idinternos4',
                                line: j,
                                value: idInternos4.toString()
                            });
                        }

                        j++;

                    } //for
                } //if

                // FIN - Consulta Cupones Pendientes

                // INICIO - Consulta Ajustes Pendientes

                var resultSet = ajustesPendientes.run();

                var completeResultSetAjustes = null;

                log.debug('Generacion Liquidaciones Servicios REST', 'INICIO Consulta Busqueda Ajustes Pendientes');

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
                            completeResultSetAjustes = resultado;
                        else
                            completeResultSetAjustes = completeResultSetAjustes.concat(resultado);
                    }

                    // increase pointer
                    resultIndex = resultIndex + resultStep;

                    // once no records are returned we already got all of them
                } while (!utilities.isEmpty(resultado) && resultado.length > 0)

                log.debug('Generacion Liquidaciones Servicios REST', 'FIN Consulta Busqueda Ajustes Pendientes');
var j = 0;
                if (!utilities.isEmpty(completeResultSetAjustes)) {
                    log.debug('Generacion Liquidaciones Servicios REST', 'FIN Consulta Busqueda Ajustes Pendientes - Cantidad Registros Encontrados : ' + completeResultSetAjustes.length);
                    /////////////////////////////////////////
var idUnico = 0;
                    var idUnicoAnterior = 0;
                    var idInternosTotal =[];

                    var i = 0;

                    while (!utilities.isEmpty(completeResultSetAjustes) && completeResultSetAjustes.length > 0 && i < completeResultSetAjustes.length) {

                        var idEmpresa = completeResultSetAjustes[i].getValue({
                            name: resultSet.columns[2]
                        });

                        var idMoneda = completeResultSetAjustes[i].getValue({
                            name: resultSet.columns[3]
                        });

                        var sitio = completeResultSetAjustes[i].getValue({
                            name: resultSet.columns[7]
                        });

                        idUnico = completeResultSetAjustes[i].getValue({
                            name: resultSet.columns[12]
                        });

                        var idInternos = new Array();
                        var idInternos2 = new Array();
                        var importeFacturacionTotal = 0;
                        var importeLiquidacionTotal = 0;

                        do {
                            idUnicoAnterior = idUnico;

                            var idInterno = completeResultSetAjustes[i].getValue({
                                name: resultSet.columns[0]
                            });

                            /*var importeFacturacion = completeResultSetAjustes[i].getValue({
                                name: resultSet.columns[8]
                            });*/

                            var importeFacturacion = completeResultSetAjustes[i].getValue({
                                name: resultSet.columns[5]
                            });

                            var importeLiquidacion = completeResultSetAjustes[i].getValue({
                                name: resultSet.columns[6]
                            });

                            if (!utilities.isEmpty(importeFacturacion) && !isNaN(importeFacturacion)) {
                                importeFacturacionTotal = parseFloat(importeFacturacionTotal, 10) + parseFloat(importeFacturacion, 10);
                            }
                            if (!utilities.isEmpty(importeLiquidacion) && !isNaN(importeLiquidacion)) {
                                importeLiquidacionTotal = parseFloat(importeLiquidacionTotal, 10) + parseFloat(importeLiquidacion, 10);
                            }
                            
                            if (idInternos.toString().length <= 3800) {
                                idInternosTotal.push(idInterno);
                                idInternos.push(idInterno);
                            } else {
                                idInternos2.push(idInterno);
                                idInternosTotal.push(idInterno);
                            }

                            i++;
                            if (i < completeResultSetAjustes.length) {

                                idUnico = completeResultSetAjustes[i].getValue({
                                    name: resultSet.columns[12]
                                });

                            }

                        } while (i < completeResultSetAjustes.length && idUnico == idUnicoAnterior)



                        /*sublistAjustes.setSublistValue({
                            id: 'fecha',
                            line: j,
                            value: fecha
                        });*/

                        sublistAjustes.setSublistValue({
                            id: 'empresa',
                            line: j,
                            value: idEmpresa
                        });

                        /*sublistAjustes.setSublistValue({
                            id: 'cupon',
                            line: j,
                            value: idInterno
                        });*/

                        sublistAjustes.setSublistValue({
                            id: 'moneda',
                            line: j,
                            value: idMoneda
                        });

                        /*sublistAjustes.setSublistValue({
                            id: 'tipocambio',
                            line: j,
                            value: tipoCambio
                        });

                        sublistAjustes.setSublistValue({
                            id: 'importecupon',
                            line: j,
                            value: importeCupon
                        });

                        sublistAjustes.setSublistValue({
                            id: 'porcentajefacturar',
                            line: j,
                            value: porcentajeFacturacion
                        });*/

                        sublistAjustes.setSublistValue({
                            id: 'importefacturar',
                            line: j,
                            value: parseFloat(importeFacturacionTotal,10).toFixed(2)
                        });

                        /*sublistAjustes.setSublistValue({
                            id: 'porcentajeliquidar',
                            line: j,
                            value: porcentajeLiquidacion
                        });*/

                        sublistAjustes.setSublistValue({
                            id: 'importeliquidar',
                            line: j,
                            value: parseFloat(importeLiquidacionTotal,10).toFixed(2)
                        });

                        sublistAjustes.setSublistValue({
                            id: 'sitio',
                            line: j,
                            value: sitio
                        });

                        /*sublistAjustes.setSublistValue({
                            id: 'info',
                            line: j,
                            value: 'https://system.sandbox.netsuite.com/app/common/search/searchresults.nl?searchid=48&saverun=T&AEV_Entity_INTERNALID=12446'
                        });*/

                        sublistAjustes.setSublistValue({
                            id: 'idinternos',
                            line: j,
                            value: idInternos.toString()
                        });


                        if (!utilities.isEmpty(idInternos2) && idInternos2.length>0) {
                            sublistAjustes.setSublistValue({
                                id: 'idinternos2',
                                line: j,
                                value: idInternos2.toString()
                            });
                        }

                        j++;

                    } //for

                    ///////////////////////////////////////////
                    
                } //if

                // FIN - Consulta Ajustes Pendientes

                if (utilities.isEmpty(completeResultSetCupones) && utilities.isEmpty(completeResultSetAjustes)) {
                    respuesta.error = true;
                    respuesta.mensaje = "No se encontraron Liquidaciones Pendientes";
                    log.audit('Generacion Liquidaciones Servicios REST', 'FIN Consulta Busqueda Liquidaciones Pendientes - No se encontraron Liquidaciones Pendientes');
                }

                /*else {
                    respuesta.error = true;
                    respuesta.mensaje = "No se encontraron Liquidaciones Pendientes";
                    log.audit('Generacion Liquidaciones Servicios REST', 'FIN Consulta Busqueda Liquidaciones Pendientes - No se encontraron Liquidaciones Pendientes');
                }*/
            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Liquidaciones - Excepcion : " + excepcion.message;
                log.error('Generacion Liquidaciones Servicios REST', 'Consulta Busqueda Liquidaciones Pendientes - Excepcion Consultando Liquidaciones - Excepcion : ' + excepcion.message);
            }

            log.audit('Generacion Liquidaciones Servicios REST', 'FIN Consulta Liquidaciones Pendientes');
            return respuesta;
        }

        function createAndSubmitMapReduceJob(idScript, parametros) {
            log.audit('Generacion Liquidaciones Servicios REST', 'INICIO Invocacion Script MAP/REDUCE');
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
                log.error('Generacion Liquidaciones Servicios REST', 'Generacion Liquidaciones - Excepcion Invocando A Script MAP/REDUCE - Excepcion : ' + excepcion.message);
            }
            log.audit('Generacion Liquidaciones Servicios REST', 'FIN Invocacion Script MAP/REDUCE');
            return respuesta;
        }

        return {
            onRequest: onRequest
        };

    });

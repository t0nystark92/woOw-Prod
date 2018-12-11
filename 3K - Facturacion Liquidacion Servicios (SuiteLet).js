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
            log.audit('Generacion Facturacion Servicios REST', 'INICIO Proceso - Metodo : ' + context.request.method + ' Empresa : ' + context.request.parameters.empresa + ' Fecha Inicio : ' + context.request.parameters.fechaInicio + ' Fecha Fin : ' + context.request.parameters.fechafin);

            try {

                var form = serverWidget.createForm({
                    title: 'Facturacion de Liquidaciones de Servicios'
                });

                //form.clientScriptFileId = 6026;
                form.clientScriptModulePath = './3K - Facturacion Liquidacion Servicios (Cliente).js'

                var grupoFiltros = form.addFieldGroup({
                    id: 'filtros',
                    label: 'Criterios de Busqueda de Liquidaciones'
                });

                var grupoDatos = form.addFieldGroup({
                    id: 'infoliquidaciones',
                    label: 'Informacion Liquidaciones A Facturar'
                });

                var tabDetalle = form.addTab({
                    id: 'tabdetalle',
                    label: 'Detalle'
                });

                var subTabCupones = form.addSubtab({
                    id: 'tabliquidaciones',
                    label: 'Liquidaciones A Facturar',
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

                // INICIO SUBLISTA
                var sublistLiquidaciones = form.addSublist({
                    id: 'liquidaciones',
                    type: serverWidget.SublistType.LIST,
                    label: 'Liquidaciones Pendientes de Facturar',
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
                    id: 'importefacturar',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Importe Facturar'
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
                    id: 'idinternos',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ID Internos'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                sublistLiquidaciones.addMarkAllButtons();
                // FIN SUBLISTA

                form.addSubmitButton({
                    label: 'Buscar Liquidaciones Pendientes Facturacion'
                });

                form.addButton({
                    id: 'custpage_btgenfactliq',
                    label: 'Generar Facturacion Liquidaciones',
                    functionName: "generarFacturacion"
                });

                var infoResultado = form.addField({
                    id: 'custpage_resultado',
                    label: 'Resultados',
                    type: serverWidget.FieldType.INLINEHTML
                });

                if (context.request.method === 'GET') {
                    log.audit('Generacion Facturacion Servicios REST', 'FIN Proceso');
                    context.response.writePage(form);
                } else {
                    var sAccion = utilities.isEmpty(context.request.parameters.custpage_accion) ? context.request.parameters.submitter : context.request.parameters.custpage_accion;

                    switch (sAccion) {
                        case 'GENERARFACT':
                            var mensaje = "Se proceso su solicitud. Recibira una notificacion al finalizar por email";
                            var resultado = generarFacturas(sublistLiquidaciones, context.request);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                mensaje = resultado.mensaje;
                                log.error('Generacion Facturacion Servicios REST', 'Error Consulta Liquidaciones A Procesar - Error : ' + mensaje);
                            }
                            infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            log.audit('Generacion Facturacion Servicios REST', 'FIN Proceso');
                            context.response.writePage(form);
                            break;
                        case 'Buscar Liquidaciones Pendientes Facturacion':
                            var resultado = cargarLiquidaciones(sublistLiquidaciones, context.request);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                var mensaje = resultado.mensaje;
                                log.error('Generacion Facturacion Servicios REST', 'Error Consulta Liquidaciones Pendientes - Error : ' + mensaje);
                                infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            }
                            log.audit('Generacion Facturacion Servicios REST', 'FIN Proceso');
                            context.response.writePage(form);
                            break;
                    }
                }
            } catch (excepcion) {
                log.error('Generacion Facturacion Servicios REST', 'Excepcion Proceso Generacion de Facturacion de Liquidaciones de Servicios - Excepcion : ' + excepcion.message);
            }
        }

        function generarFacturas(sublistAjustes, request) {
            log.audit('Generacion Facturacion Servicios REST', 'INICIO Consulta Liquidaciones A Procesar');

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

                                            var idInternoLiquidaciones = columnas[8];

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

                        // INCIO - Invocar Script de Facturacion

                        parametros = new Object();
                        parametros.custscript_generar_liq_id_liq = idLiquidacionesProcesar.toString();

                        log.debug('Generacion Facturacion Servicios REST', 'Generacion Facturas - ID Liquidaciones A Procesar : ' + parametros.custscript_generar_liq_id_liq);

                        log.debug('Generacion Facturacion Servicios REST', 'Generacion Facturas - INICIO llamada Script MAP/REDUCE');

                        respuesta = createAndSubmitMapReduceJob('customscript_3k_generacion_fact_liq_mp', parametros);

                        var mensajeEstado = "";
                        if (!utilities.isEmpty(respuesta) && !utilities.isEmpty(respuesta.estado)) {
                            mensajeEstado = respuesta.estado.status;
                        }

                        log.debug('Generacion Facturacion Servicios REST', 'Generacion Facturas - /REDUCE - Estado : ' + mensajeEstado);

                        // FIN - Invicar Script de Facturacion

                    }
                } else {
                    respuesta.error = true;
                    respuesta.mensaje = "No se pudo obtener sublista de Liquidaciones a procesar";
                }

            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Liquidaciones A Procesar - Excepcion : " + excepcion.message;

                log.error('Generacion Facturacion Servicios REST', 'Consulta Liquidaciones A Procesar - Excepcion Consultando Liquidaciones A Procesar - Excepcion : ' + excepcion.message);
            }
            log.audit('Generacion Facturacion Servicios REST', 'FIN Consulta Liquidaciones A Procesar');
            return respuesta;
        }

        function cargarLiquidaciones(sublistLiquidaciones, request) {
            log.audit('Generacion Facturacion Servicios REST', 'INICIO Consulta Liquidaciones Pendientes');
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";

            try {

                var separadorMultiSelect = /\u0005/;

                var liquidacionesPendientes = search.load({
                    id: 'customsearch_3k_liq_pend_fact'
                });

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
                            name: 'custrecord_3k_liq_emp_empresa',
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

                log.debug('Generacion Facturacion Servicios REST', 'INICIO Consulta Busqueda Liquidaciones Pendientes');

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

                log.debug('Generacion Facturacion Servicios REST', 'FIN Consulta Busqueda Liquidaciones Pendientes');

                if (!utilities.isEmpty(completeResultSetLiquidaciones)) {
                    log.debug('Generacion Facturacion Servicios REST', 'FIN Consulta Busqueda Liquidaciones Pendientes - Cantidad Registros Encontrados : ' + completeResultSetLiquidaciones.length);

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

                        var importeFacturacion = completeResultSetLiquidaciones[i].getValue({
                            name: resultSet.columns[4]
                        });

                        var sitio = completeResultSetLiquidaciones[i].getValue({
                            name: resultSet.columns[5]
                        });

                        var idLiquidacion = completeResultSetLiquidaciones[i].getValue({
                            name: resultSet.columns[7]
                        });

                        sublistLiquidaciones.setSublistValue({
                            id: 'numero',
                            line: i,
                            value: idLiquidacion
                        });


                        sublistLiquidaciones.setSublistValue({
                            id: 'fecha',
                            line: i,
                            value: fecha
                        });

                        if(!utilities.isEmpty(idEmpresa)){
                            sublistLiquidaciones.setSublistValue({
                                id: 'empresa',
                                line: i,
                                value: idEmpresa
                            });
                        }

                        if(!utilities.isEmpty(idMoneda)){
                            sublistLiquidaciones.setSublistValue({
                                id: 'moneda',
                                line: i,
                                value: idMoneda
                            });
                        }

                        sublistLiquidaciones.setSublistValue({
                            id: 'importefacturar',
                            line: i,
                            value: importeFacturacion
                        });

                        if(!utilities.isEmpty(sitio)){

                            sublistLiquidaciones.setSublistValue({
                                id: 'sitio',
                                line: i,
                                value: sitio
                            });

                        }

                        sublistLiquidaciones.setSublistValue({
                            id: 'idinternos',
                            line: i,
                            value: idInterno.toString()
                        });

                    } //for
                } //if

                // FIN - Consulta Liquidaciones Pendientes

                if (utilities.isEmpty(completeResultSetLiquidaciones)) {
                    respuesta.error = true;
                    respuesta.mensaje = "No se encontraron Liquidaciones Pendientes";
                    log.audit('Generacion Facturacion Servicios REST', 'FIN Consulta Busqueda Liquidaciones Pendientes - No se encontraron Liquidaciones Pendientes');
                }

            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Liquidaciones - Excepcion : " + excepcion.message;
                log.error('Generacion Facturacion Servicios REST', 'Consulta Busqueda Liquidaciones Pendientes - Excepcion Consultando Liquidaciones - Excepcion : ' + excepcion.message);
            }

            log.audit('Generacion Facturacion Servicios REST', 'FIN Consulta Liquidaciones Pendientes');
            return respuesta;
        }

        function createAndSubmitMapReduceJob(idScript, parametros) {
            log.audit('Generacion Facturacion Servicios REST', 'INICIO Invocacion Script MAP/REDUCE');
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
                log.error('Generacion Facturacion Servicios REST', 'Generacion Facturas Liquidaciones - Excepcion Invocando A Script MAP/REDUCE - Excepcion : ' + excepcion.message);
            }
            log.audit('Generacion Facturacion Servicios REST', 'FIN Invocacion Script MAP/REDUCE');
            return respuesta;
        }

        return {
            onRequest: onRequest
        };

    });

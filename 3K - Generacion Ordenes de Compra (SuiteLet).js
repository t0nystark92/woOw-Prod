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
            log.audit('Generacion Ordenes de Compras REST', 'INICIO Proceso - Metodo : ' + context.request.method + ' Proveedor : ' + context.request.parameters.proveedor + ' Articulo : ' + context.request.parameters.articulo + ' Dias Pedidos : ' + context.request.parameters.diapedido);
            //+ ' Fecha : ' + context.request.parameters.fechapedido);

            try {

                var form = serverWidget.createForm({
                    title: 'Generacion de Ordenes de Compras'
                });

                //form.clientScriptFileId = 6026;
                form.clientScriptModulePath = './3K - Generacion Ordenes de Compra (Cliente).js'

                var grupoFiltros = form.addFieldGroup({
                    id: 'filtros',
                    label: 'Criterios de Busqueda de Requisiciones de Compras'
                });

                var grupoDatos = form.addFieldGroup({
                    id: 'inforequisiciones',
                    label: 'Informacion Requisiciones de Compras'
                });

                var tabDetalle = form.addTab({
                    id: 'tabdetalle',
                    label: 'Detalle'
                });

                var subTab = form.addSubtab({
                    id: 'tabbusqueda',
                    label: 'Requisiciones de Compras',
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

                var idInternoField = form.addField({
                    id: 'custpage_idinterno',
                    label: 'Id Requisicion:',
                    type: serverWidget.FieldType.LONGTEXT,
                    container: 'filtros'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                var idInternoField2 = form.addField({
                    id: 'custpage_idinterno2',
                    label: 'Id Requisicion2:',
                    type: serverWidget.FieldType.LONGTEXT,
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
                var proveedor = form.addField({
                    id: 'proveedor',
                    label: 'Proveedor',
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'vendor',
                    container: 'filtros'
                });
                var articulo = form.addField({
                    id: 'articulo',
                    label: 'Articulo',
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'item',
                    container: 'filtros'
                });

                /*var fechaPedido = form.addField({
                id : 'fechapedido',
                label : 'Fecha Pedido',
                type : serverWidget.FieldType.DATE,
                container : 'filtros'
                });
                fechaPedido.isMandatory = true;*/
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

                /*if (!utilities.isEmpty(fechaLocal)) {
                fechaPedido.defaultValue = fechaLocal;
                }*/

                // INICIO MULTISELECT DIAS SEMANA

                // INICIO BUSCAR DIAS DE LA SEMANA
                var requisicionesPendientes = search.load({
                    id: 'customsearch_3k_dias_semana'
                });

                var resultSet = requisicionesPendientes.run();

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
                // FIN BUSCAR DIAS DE LA SEMANA

                var diaPedido = form.addField({
                    id: 'diapedido',
                    label: 'Dia Solicitud Proveedor',
                    type: serverWidget.FieldType.MULTISELECT,
                    //source : 'customrecord_3k_dias_semana',
                    container: 'filtros'
                });
                diaPedido.isMandatory = true;

                var codigoDiaJS = '';
                if (!utilities.isEmpty(fechaLocalDate)) {
                    codigoDiaJS = fechaLocalDate.getDay();
                }

                if (!utilities.isEmpty(completeResultSet) && completeResultSet.length > 0) {

                    for (var i = 0; !utilities.isEmpty(completeResultSet) && completeResultSet.length > 0 && i < completeResultSet.length; i++) {
                        var idDia = completeResultSet[i].getValue({
                            name: resultSet.columns[0]
                        });
                        var nombreDia = completeResultSet[i].getValue({
                            name: resultSet.columns[1]
                        });
                        var codigoDia = completeResultSet[i].getValue({
                            name: resultSet.columns[2]
                        });

                        var isSelected = false;
                        if (!utilities.isEmpty(codigoDiaJS) && !utilities.isEmpty(codigoDia) && codigoDia == codigoDiaJS) {
                            isSelected = true;
                        }

                        if (!utilities.isEmpty(idDia) && !utilities.isEmpty(nombreDia)) {
                            diaPedido.addSelectOption({
                                value: idDia,
                                text: nombreDia,
                                isSelected: isSelected
                            });
                        } else {
                            var mensaje = 'No se pudo obtener la siguiente informacion de los dias de la semana para cargar el combo de Dias de Pedido Proveedor : ';
                            if (utilities.isEmpty(idDia)) {
                                mensaje = mensaje + ' ID Interno del Dia de la Semana / ';
                            }
                            if (utilities.isEmpty(nombreDia)) {
                                mensaje = mensaje + ' Nombre del Dia de la Semana / ';
                            }
                            log.error('Generacion Ordenes de Compras REST', 'Suitelet Generacion Pantalla - Error : ' + mensaje);
                        }
                    }
                } else {
                    log.error('Generacion Ordenes de Compras REST', 'Suitelet Generacion Pantalla - Error : No se Encontraron Dias de la Semana Configurados');
                }

                // FIN MULTISELECT DIAS SEMANA

                var ubicacion = form.addField({
                    id: 'ubicacion',
                    label: 'Ubicacion',
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'location',
                    container: 'filtros'
                });

                var enviarEmailProveedor = form.addField({
                    id: 'enviaremail',
                    label: 'Enviar OC por Email al Proveedor',
                    type: serverWidget.FieldType.CHECKBOX,
                    container: 'filtros'
                });
                enviarEmailProveedor.defaultValue = 'T';

                // FIN FILTROS

                // INICIO SUBLISTA
                var sublist = form.addSublist({
                    id: 'requisiciones',
                    type: serverWidget.SublistType.LIST,
                    label: 'Requisiciones de Compras Pendientes',
                    tab: 'tabbusqueda'
                });

                /*sublist.addField({
                    id: 'procesar',
                    label: 'Procesar',
                    type: serverWidget.FieldType.CHECKBOX
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.ENTRY
                });*/
                /*sublist.addField({
                id: 'sitioweb',
                label: 'Date',
                type: serverWidget.FieldType.DATE
                });*/
                sublist.addField({
                    id: 'proveedor',
                    label: 'Proveedor',
                    type: serverWidget.FieldType.SELECT,
                    source: 'vendor'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'articulo',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Articulo',
                    source: 'item'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                /*sublist.addField({
                    id: 'moneda',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Moneda',
                    source: 'currency'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'precio',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Precio'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });*/
                sublist.addField({
                    id: 'cantidad',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Cantidad'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                /*sublist.addField({
                    id: 'preciototal',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Precio Total'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'pila',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Pila',
                    source: 'customrecord_stock_terceros'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'ubicacion',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Ubicacion',
                    source: 'location'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'sitio',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Sitio Web',
                    source: 'customrecord_cseg_3k_sitio_web_o'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'tipoingreso',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Tipo Ingreso',
                    source: 'customrecord_3k_tipos_ingresos_oc'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });*/
                sublist.addField({
                    id: 'idinternos',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ID Internos'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                sublist.addField({
                    id: 'idinternos2',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ID Internos 2'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                sublist.addField({
                    id: 'idinternos3',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ID Internos 3'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                sublist.addField({
                    id: 'idinternos4',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ID Internos 4'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                //sublist.addMarkAllButtons();
                // FIN SUBLISTA

                form.addSubmitButton({
                    label: 'Buscar Requisiciones Pendientes'
                });

                form.addButton({
                    id: 'custpage_btgenoc',
                    label: 'Generar Ordenes de Compra',
                    functionName: "generarOC"
                });

                var infoResultado = form.addField({
                    id: 'custpage_resultado',
                    label: 'Resultados',
                    type: serverWidget.FieldType.INLINEHTML
                });

                if (context.request.method === 'GET') {
                    log.audit('Generacion Ordenes de Compras REST', 'FIN Proceso');
                    context.response.writePage(form);
                } else {
                    var sAccion = utilities.isEmpty(context.request.parameters.custpage_accion) ? context.request.parameters.submitter : context.request.parameters.custpage_accion;

                    switch (sAccion) {
                        case 'GENERAROC':
                            var mensaje = "Se proceso su solicitud. Recibira una notificacion al finalizar por email";
                            var resultado = generarOrdenesCompra(sublist, context.request);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                mensaje = resultado.mensaje;
                                log.error('Generacion Ordenes de Compras REST', 'Error Consulta Requisiciones A Procesar - Error : ' + mensaje);
                            }
                            infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            log.audit('Generacion Ordenes de Compras REST', 'FIN Proceso');
                            context.response.writePage(form);
                            break;
                        case 'Buscar Requisiciones Pendientes':
                            var resultado = cargarRequisiciones(sublist,idInternoField, context.request);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                var mensaje = resultado.mensaje;
                                log.error('Generacion Ordenes de Compras REST', 'Error Consulta Requisiciones Pendientes - Error : ' + mensaje);
                                infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            }
                            log.audit('Generacion Ordenes de Compras REST', 'FIN Proceso');
                            context.response.writePage(form);
                            break;
                    }
                }
            } catch (excepcion) {
                log.error('Generacion Ordenes de Compras REST', 'Excepcion Proceso Generacion Ordenes de Compras - Excepcion : ' + excepcion.message);
            }
        }

        function generarOrdenesCompra(sublist, request) {
            log.audit('Generacion Ordenes de Compras REST', 'INICIO Consulta Requisiciones A Procesar');

            var idRequisicionesProcesar = new Array();
            var existenRequisicionesSeleccionadas = false;
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";
            respuesta.estado = "";
            try {
                if (!utilities.isEmpty(request.parameters.requisicionesdata)) {
                    var delimiterCampos = /\u0001/;
                    var delimiterArray = /\u0002/;

                    var idInternosRequis = request.parameters.custpage_idinterno;
                    log.debug('generar OC', 'idInternosRequis: '+ idInternosRequis);

                    var enviarEmail = 'F';
                    if (!utilities.isEmpty(request.parameters.enviaremail) && request.parameters.enviaremail == 'T') {
                        enviarEmail = 'T';
                    }

                     log.debug('Generacion Ordenes de Compras SUITELET', 'mensaje : ' + JSON.stringify(request.parameters.requisicionesdata));


                    var sublista = request.parameters.requisicionesdata.split(delimiterArray);

                    if (!utilities.isEmpty(sublista) && sublista.length > 0) {

                        /*for (var i = 0; respuesta.error == false && i < sublista.length; i++) {
                            if (!utilities.isEmpty(sublista[i])) {

                                var columnas = sublista[i].split(delimiterCampos);

                                log.debug('Generacion OC' , 'columnas: '+ JSON.stringify(columnas));

                                if (!utilities.isEmpty(sublista) && sublista.length > 0) {
                                    var procesar = columnas[0];

                                    if (procesar == 'T') { //solo si est� marcado para enviar
                                        existenRequisicionesSeleccionadas = true;

                                        var idInternoRequisiciones = columnas[6];
                                        var idInternoRequisiciones2 = columnas[7];

log.debug('Generacion Ordenes de Compras SUITELET', 'Tamano Array columna : ' + columnas.length);

                                         log.debug('Generacion Ordenes de Compras SUITELET', 'Contador : ' + (i+1) + ' - idInternoRequisiciones: ' + idInternoRequisiciones);

                                        if (!utilities.isEmpty(idInternoRequisiciones)) {

                                            if (!utilities.isEmpty(idInternoRequisiciones2)) {

                                                idInternoRequisiciones = idInternoRequisiciones + ',' + idInternoRequisiciones2;

                                            }



                                            idRequisicionesProcesar.push(idInternoRequisiciones);
                                        } else {
                                            //Error Obteniendo ID Interno de la Requisicion a procesar
                                            respuesta.error = true;
                                            respuesta.mensaje = "No se pudo Obtener el ID Interno de requisiciones a procesar";
                                        }
                                    }
                                } else {
                                    //Error Obteniendo Columnas de Sublista
                                    respuesta.error = true;
                                    respuesta.mensaje = "No se pudo Obtener las columnas de la sublista de requisiciones a procesar";
                                }
                            } else {
                                //Error Obteniendo Contenido de Sublista
                                respuesta.error = true;
                                respuesta.mensaje = "No se pudo Obtener el contenido de la sublista de requisiciones a procesar";
                            }

                        }*/

                        /*if (respuesta.error == false && existenRequisicionesSeleccionadas == false) {
                            respuesta.error = true;
                            respuesta.mensaje = "No se selecciono ninguna requisicion para procesar";
                        }*/

                        if (respuesta.error == false &&  utilities.isEmpty(idInternosRequis)) {
                            respuesta.error = true;
                            respuesta.mensaje = "No se selecciono ninguna requisicion para procesar";
                        }

                        if (respuesta.error == false) {

                            //log.audit('Generacion Ordenes de Compras REST', 'ID REQ : ' + idRequisicionesProcesar.toString());

                            // Objeto de ID a Enviar por Parametro
                            parametros = new Object();
                            //parametros.custscript_generar_oc_id = idRequisicionesProcesar.toString();
                            parametros.custscript_generar_oc_id = idInternosRequis.toString();
                            parametros.custscript_generar_oc_email = enviarEmail;

                            log.debug('Generacion Ordenes de Compras SUITELET', 'idInternoRequisiciones: ' + idInternosRequis);

                            log.debug('Generacion Ordenes de Compras REST', 'Generacion Ordenes de Compras - ID Requisiciones A Procesar : ' + parametros.custscript_generar_oc_id);

                            log.debug('Generacion Ordenes de Compras REST', 'Generacion Ordenes de Compras - INICIO llamada Script MAP/REDUCE');

                            respuesta = createAndSubmitMapReduceJob('customscript_3k_generacion_oc_mp', parametros);

                            var mensajeEstado = "";
                            if (!utilities.isEmpty(respuesta) && !utilities.isEmpty(respuesta.estado)) {
                                mensajeEstado = respuesta.estado.status;
                            }

                            log.debug('Generacion Ordenes de Compras REST', 'Generacion Ordenes de Compras - /REDUCE - Estado : ' + mensajeEstado);

                        }
                    } else {
                        respuesta.error = true;
                        respuesta.mensaje = "No se pudo obtener registros de la sublista de requisiciones a procesar";
                    }
                } else {
                    respuesta.error = true;
                    respuesta.mensaje = "No se pudo obtener sublista de requisiciones a procesar";
                }

            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Requisiciones A Procesar - Excepcion : " + excepcion.message;

                log.error('Generacion Ordenes de Compras REST', 'Consulta Requisiciones A Procesar - Excepcion Consultando Requisiciones A Procesar - Excepcion : ' + excepcion.message);
            }
            log.audit('Generacion Ordenes de Compras REST', 'FIN Consulta Requisiciones A Procesar');
            return respuesta;
        }

        function cargarRequisiciones(sublist, form, request) {
            log.audit('Generacion Ordenes de Compras REST', 'INICIO Consulta Requisiciones Pendientes');
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";

            try {

                var separadorMultiSelect = /\u0005/;

                var requisicionesPendientes = search.load({
                    id: 'customsearch_3k_req_compra_pendientes'
                });

                if (!utilities.isEmpty(request.parameters.sitioweb)) {
                    var sitiosSeleccionados = request.parameters.sitioweb.split(separadorMultiSelect);
                    if (!utilities.isEmpty(sitiosSeleccionados) && sitiosSeleccionados.length > 0) {
                        var filtroEmpresa = search.createFilter({
                            name: 'custrecord_46_cseg_3k_sitio_web_o',
                            operator: search.Operator.ANYOF,
                            values: sitiosSeleccionados
                        });

                        requisicionesPendientes.filters.push(filtroEmpresa);
                    }
                }

                if (!utilities.isEmpty(request.parameters.ubicacion)) {
                    var ubicacionesSeleccionadas = request.parameters.ubicacion.split(separadorMultiSelect);
                    if (!utilities.isEmpty(ubicacionesSeleccionadas) && ubicacionesSeleccionadas.length > 0) {
                        var filtroUbicacion = search.createFilter({
                            name: 'custrecord_3k_req_compra_ubicacion',
                            operator: search.Operator.ANYOF,
                            values: ubicacionesSeleccionadas
                        });

                        requisicionesPendientes.filters.push(filtroUbicacion);
                    }

                }

                if (!utilities.isEmpty(request.parameters.proveedor)) {
                    var proveedoresSeleccionados = request.parameters.proveedor.split(separadorMultiSelect);
                    if (!utilities.isEmpty(proveedoresSeleccionados) && proveedoresSeleccionados.length > 0) {
                        var filtroProveedor = search.createFilter({
                            name: 'custrecord_3k_req_compra_proveedor',
                            operator: search.Operator.ANYOF,
                            values: proveedoresSeleccionados
                        });

                        requisicionesPendientes.filters.push(filtroProveedor);
                    }

                }

                if (!utilities.isEmpty(request.parameters.articulo)) {
                    var articulosSeleccionados = request.parameters.articulo.split(separadorMultiSelect);
                    if (!utilities.isEmpty(articulosSeleccionados) && articulosSeleccionados.length > 0) {
                        var filtroArticulo = search.createFilter({
                            name: 'custrecord_3k_req_compra_articulo',
                            operator: search.Operator.ANYOF,
                            values: articulosSeleccionados
                        });

                        requisicionesPendientes.filters.push(filtroArticulo);
                    }

                }

                /*if (!utilities.isEmpty(request.parameters.fechapedido)) {

                var fechaPedido = format.parse({
                value : request.parameters.fechapedido,
                type : format.Type.DATE,
                timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                });

                if (!utilities.isEmpty(fechaPedido)) {
                var diaSemana = fechaPedido.getDay();
                if (!utilities.isEmpty(diaSemana)) {
                var diaPedido = '';
                switch (diaSemana) {
                case 0:
                var filtroFechaPedido = search.createFilter({
                name : 'custentity_3k_pedido_domingo',
                join : 'custrecord_3k_req_compra_proveedor',
                operator : search.Operator.IS,
                values : ['T']
                });
                requisicionesPendientes.filters.push(filtroFechaPedido);
                break;
                case 1:
                var filtroFechaPedido = search.createFilter({
                name : 'custentity_3k_pedido_lunes',
                join : 'custrecord_3k_req_compra_proveedor',
                operator : search.Operator.IS,
                values : ['T']
                });
                requisicionesPendientes.filters.push(filtroFechaPedido);
                break;
                case 2:
                var filtroFechaPedido = search.createFilter({
                name : 'custentity_3k_pedido_martes',
                join : 'custrecord_3k_req_compra_proveedor',
                operator : search.Operator.IS,
                values : ['T']
                });
                requisicionesPendientes.filters.push(filtroFechaPedido);
                break;
                case 3:
                var filtroFechaPedido = search.createFilter({
                name : 'custentity_3k_pedido_miercoles',
                join : 'custrecord_3k_req_compra_proveedor',
                operator : search.Operator.IS,
                values : ['T']
                });
                requisicionesPendientes.filters.push(filtroFechaPedido);
                break;
                case 4:
                var filtroFechaPedido = search.createFilter({
                name : 'custentity_3k_pedido_jueves',
                join : 'custrecord_3k_req_compra_proveedor',
                operator : search.Operator.IS,
                values : ['T']
                });
                requisicionesPendientes.filters.push(filtroFechaPedido);
                break;
                case 5:
                var filtroFechaPedido = search.createFilter({
                name : 'custentity_3k_pedido_viernes',
                join : 'custrecord_3k_req_compra_proveedor',
                operator : search.Operator.IS,
                values : ['T']
                });
                requisicionesPendientes.filters.push(filtroFechaPedido);
                break;
                case 6:
                var filtroFechaPedido = search.createFilter({
                name : 'custentity_3k_pedido_sabado',
                join : 'custrecord_3k_req_compra_proveedor',
                operator : search.Operator.IS,
                values : ['T']
                });
                requisicionesPendientes.filters.push(filtroFechaPedido);
                break;
                default:
                break;
                }

                }
                }

                }*/

                if (!utilities.isEmpty(request.parameters.diapedido)) {
                    var diasSeleccionados = request.parameters.diapedido.split(separadorMultiSelect);
                    if (!utilities.isEmpty(diasSeleccionados) && diasSeleccionados.length > 0) {
                        var filtroDiaPedido = search.createFilter({
                            name: 'custentity_3k_dias_pedido',
                            join: 'custrecord_3k_req_compra_proveedor',
                            operator: search.Operator.ANYOF,
                            values: diasSeleccionados
                        });
                        requisicionesPendientes.filters.push(filtroDiaPedido);
                    }

                }

                var resultSet = requisicionesPendientes.run();

                var completeResultSet = null;

                log.debug('Generacion Ordenes de Compras REST', 'INICIO Consulta Busqueda Requisiciones Pendientes');

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

                log.debug('Generacion Ordenes de Compras REST', 'FIN Consulta Busqueda Requisiciones Pendientes');

                var j = 0;

                if (!utilities.isEmpty(completeResultSet)) {
                    log.debug('Generacion Ordenes de Compras REST', 'FIN Consulta Busqueda Requisiciones Pendientes - Cantidad Registros Encontrados : ' + completeResultSet.length);

                    var idUnico = 0;
                    var idUnicoAnterior = 0;
                    var idInternosTotal =[];

                    var i = 0;
                    while (!utilities.isEmpty(completeResultSet) && completeResultSet.length > 0 && i < completeResultSet.length) {

                        var idProveedor = completeResultSet[i].getValue({
                            name: resultSet.columns[1]
                        });

                        var idArticulo = completeResultSet[i].getValue({
                            name: resultSet.columns[2]
                        });

                        var idPila = completeResultSet[i].getValue({
                            name: resultSet.columns[6]
                        });

                        var idMoneda = completeResultSet[i].getValue({
                            name: resultSet.columns[3]
                        });

                        var precio = completeResultSet[i].getValue({
                            name: resultSet.columns[4]
                        });

                        var ubicacion = completeResultSet[i].getValue({
                            name: resultSet.columns[7]
                        });

                        var sitioWeb = completeResultSet[i].getValue({
                            name: resultSet.columns[10]
                        });

                        var tipoIngreso = completeResultSet[i].getValue({
                            name: resultSet.columns[9]
                        });

                        idUnico = completeResultSet[i].getValue({
                            name: resultSet.columns[8]
                        });

                        var idInternos = new Array();
                        var idInternos2 = new Array();
                        var idInternos3 = new Array();
                        var idInternos4 = new Array();
                        var cantidadTotal = 0;

                        do {
                            idUnicoAnterior = idUnico;

                            var idInterno = completeResultSet[i].getValue({
                                name: resultSet.columns[0]
                            });
                            var cantidad = completeResultSet[i].getValue({
                                name: resultSet.columns[5]
                            });

                            if (!utilities.isEmpty(cantidad) && !isNaN(cantidad)) {
                                cantidadTotal = parseInt(cantidadTotal, 10) + parseInt(cantidad, 10);

                            }
                            /*
                            log.debug('Generacion Ordenes de Compras SUITELET', 'idInternos array: ' +JSON.stringify(idInternos));
                            log.debug('Generacion Ordenes de Compras SUITELET', 'idInternos array length: ' +idInternos.length);
                            log.debug('Generacion Ordenes de Compras SUITELET', 'idInternos array toString length: ' +idInternos.toString().length);
                            log.debug('Generacion Ordenes de Compras SUITELET', 'idInternos2 array: ' +JSON.stringify(idInternos2));
                            log.debug('Generacion Ordenes de Compras SUITELET', 'idInternos array length: ' +idInternos2.length);
                            log.debug('Generacion Ordenes de Compras SUITELET', 'idInternos array toString length: ' +idInternos2.toString().length);
                            */

                            idInternosTotal.push(idInterno);

                            /*if (idInternos.toString().length <= 3800) {
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
                            }*/

                            i++;
                            if (i < completeResultSet.length) {

                                idUnico = completeResultSet[i].getValue({
                                    name: resultSet.columns[8]
                                });

                            }

                        } while (i < completeResultSet.length && idUnico == idUnicoAnterior)

                        sublist.setSublistValue({
                            id: 'proveedor',
                            line: j,
                            value: idProveedor
                        });
                        sublist.setSublistValue({
                            id: 'articulo',
                            line: j,
                            value: idArticulo
                        });
                        sublist.setSublistValue({
                            id: 'moneda',
                            line: j,
                            value: idMoneda
                        });
                        sublist.setSublistValue({
                            id: 'precio',
                            line: j,
                            value: precio
                        });

                        sublist.setSublistValue({
                            id: 'cantidad',
                            line: j,
                            value: parseInt(cantidadTotal, 10).toString()
                        });

                        if (!utilities.isEmpty(cantidadTotal) && !isNaN(cantidadTotal) && !utilities.isEmpty(precio) && !isNaN(precio)) {
                            sublist.setSublistValue({
                                id: 'preciototal',
                                line: j,
                                value: parseFloat(precio, 10) * parseInt(cantidadTotal, 10)
                            });

                        }

                        if (!utilities.isEmpty(idPila)) {
                            sublist.setSublistValue({
                                id: 'pila',
                                line: j,
                                value: idPila
                            });
                        }

                        if (!utilities.isEmpty(ubicacion)) {
                            sublist.setSublistValue({
                                id: 'ubicacion',
                                line: j,
                                value: ubicacion
                            });
                        }

                        if (!utilities.isEmpty(sitioWeb)) {
                            sublist.setSublistValue({
                                id: 'sitio',
                                line: j,
                                value: sitioWeb
                            });
                        }

                        if (!utilities.isEmpty(tipoIngreso)) {
                            sublist.setSublistValue({
                                id: 'tipoingreso',
                                line: j,
                                value: tipoIngreso
                            });
                        }

                        //log.debug('Generacion Ordenes de Compras SUITELET', 'idInterno array: ' +JSON.stringify(idInternos));
                        //log.debug('Generacion Ordenes de Compras SUITELET', 'idInternos array length: ' +idInternos.length);
                        //log.debug('Generacion Ordenes de Compras SUITELET', 'idInternos array toString length: ' +idInternos.toString().length);
                        //log.debug('Generacion Ordenes de Compras SUITELET', 'idInternos2 array: ' +JSON.stringify(idInternos2));
                          //  log.debug('Generacion Ordenes de Compras SUITELET', 'idInternos2 array length: ' +idInternos2.length);
                           // log.debug('Generacion Ordenes de Compras SUITELET', 'idInternos2 array toString length: ' +idInternos2.toString().length);

                        /*sublistCupones.setSublistValue({
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
                        }*/
                        /*var concatIdInterno = idInternos.concat(idInternos2)
                        idInternosTotal.concat(concatIdInterno)*/

                        j++;
                    } //for

                    form.defaultValue = idInternosTotal.toString();
                } //if
                else {
                    respuesta.error = true;
                    respuesta.mensaje = "No se encontraron Requisiciones Pendientes";
                    log.audit('Generacion Ordenes de Compras REST', 'FIN Consulta Busqueda Requisiciones Pendientes - No se encontraron Requisiciones Pendientes');
                }
            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Requisiciones - Excepcion : " + excepcion.message;
                log.error('Generacion Ordenes de Compras REST', 'Consulta Busqueda Requisiciones Pendientes - Excepcion Consultando Requisiciones - Excepcion : ' + excepcion.message);
            }

            log.audit('Generacion Ordenes de Compras REST', 'FIN Consulta Requisiciones Pendientes');
            return respuesta;
        }

        function createAndSubmitMapReduceJob(idScript, parametros) {
            log.audit('Generacion Ordenes de Compras REST', 'INICIO Invocacion Script MAP/REDUCE');
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
                log.error('Generacion Ordenes de Compras REST', 'Generacion Ordenes de Compras - Excepcion Invocando A Script MAP/REDUCE - Excepcion : ' + excepcion.message);
            }
            log.audit('Generacion Ordenes de Compras REST', 'FIN Invocacion Script MAP/REDUCE');
            return respuesta;
        }

        return {
            onRequest: onRequest
        };

    });

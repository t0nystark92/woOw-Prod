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
            log.audit('Niveles de Acción', 'INICIO Proceso');
            //+ ' Fecha : ' + context.request.parameters.fechapedido);

            try {

                var form = serverWidget.createForm({
                    title: 'Asignar Niveles de Acción'
                });

                //form.clientScriptFileId = 6026;
                form.clientScriptModulePath = './3K - Niveles Accion Suitelet (Cliente).js';

                var grupoFiltros = form.addFieldGroup({
                    id: 'filtros',
                    label: 'Criterios de Busqueda de Cupones'
                });

                /*var grupoDatos = form.addFieldGroup({
                    id: 'inforequisiciones',
                    label: 'Informacion Requisiciones de Compras'
                });*/

                var grupoDatos = form.addFieldGroup({
                    id: 'infocupones',
                    label: 'Informacion Cupones'
                });

                var tabDetalle = form.addTab({
                    id: 'tabdetalle',
                    label: 'Detalle'
                });

                var subTab = form.addSubtab({
                    id: 'tabbusqueda',
                    label: 'Cupones',
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

                /*var idInternoField = form.addField({
                    id: 'custpage_idinterno',
                    label: 'Id Requisicion:',
                    type: serverWidget.FieldType.LONGTEXT,
                    container: 'filtros'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });*/


                // FIN CAMPOS

                // INICIO FILTROS
                var ordenDetalle = form.addField({
                    id: 'idordendetalle',
                    label: 'Orden Detalle',
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'customrecord_3k_det_linea_ov',
                    container: 'filtros'
                });
                var lugarRetiro = form.addField({
                    id: 'retiro',
                    label: 'Lugar Retiro',
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'customrecord_3k_destinos_envio',
                    container: 'filtros'
                });
                var articulo = form.addField({
                    id: 'articulo',
                    label: 'Articulo',
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'item',
                    container: 'filtros'
                });

                var OrdenVenta = form.addField({
                    id: 'ordenventa',
                    label: 'Orden de Venta',
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'salesorder',
                    container: 'filtros'
                });

                var OrdenCompra = form.addField({
                    id: 'ordencompra',
                    label: 'Orden de Compra',
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'purchaseorder',
                    container: 'filtros'
                });

                //FIN FILTROS

                // INICIO SUBLISTA
                var sublist = form.addSublist({
                    id: 'cupones',
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

                sublist.addField({
                    id: 'proveedor',
                    label: 'Proveedor',
                    type: serverWidget.FieldType.SELECT,
                    source: 'vendor'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'idinterno',
                    label: 'ID Interno',
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                sublist.addField({
                    id: 'articulo',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Articulo',
                    source: 'item'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'skuproveedor',
                    type: serverWidget.FieldType.TEXT,
                    label: 'SKU Proveedor'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'descripcion',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Descripción'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'alias',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Alias'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'estado',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Estado',
                    source: 'customrecord_3k_estado_cupon'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'lugarretiro',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Lugar Retiro',
                    source: 'customrecord_3k_destinos_envio'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: 'salesorder',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Orden Venta',
                    source: 'salesorder'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'ordendetalle',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Orden Detalle',
                    source: 'customrecord_3k_det_linea_ov'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'ordencompra',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Orden Compra',
                    source: 'purchaseorder'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'fechapedido',
                    type: serverWidget.FieldType.DATE,
                    label: 'Fecha Pedido'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'fechapickup',
                    type: serverWidget.FieldType.DATE,
                    label: 'Fecha Entrega PickUp'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'fechaclienteinicial',
                    type: serverWidget.FieldType.DATE,
                    label: 'Fecha Cliente Inicial'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'fechacliente',
                    type: serverWidget.FieldType.DATE,
                    label: 'Fecha Cliente'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                sublist.addField({
                    id: 'nivelaccionvigente',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Nivel Acción Vigente',
                    source: 'customrecord_3k_niveles_accion'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: 'nivelesaplicados',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Niveles de Acción Aplicados'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                /*sublist.addField({
                    id: 'cantidadcambios',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Cambiar Nro Niveles Aplicados'
                });*/

                //cambiarNivelesAplicados.defaultValue = 0;

                sublist.addField({
                    id: 'nivelaccion',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Niveles Acción',
                    source: 'customrecord_3k_niveles_accion'
                });

                //nivelaccion.defaultValue = null;


                sublist.addMarkAllButtons();
                // FIN SUBLISTA

                form.addSubmitButton({
                    label: 'Buscar Cupones'
                });

                form.addButton({
                    id: 'custpage_btaplicar',
                    label: 'Aplicar Niveles de Acción',
                    functionName: "aplicar"
                });

                var infoResultado = form.addField({
                    id: 'custpage_resultado',
                    label: 'Resultados',
                    type: serverWidget.FieldType.INLINEHTML
                });

                if (context.request.method === 'GET') {
                    log.audit('Aplicar Niveles Accion', 'FIN Proceso');
                    context.response.writePage(form);
                } else {
                    var sAccion = utilities.isEmpty(context.request.parameters.custpage_accion) ? context.request.parameters.submitter : context.request.parameters.custpage_accion;

                    switch (sAccion) {
                        case 'APLICAR':
                            var mensaje = "Se proceso su solicitud. Recibira una notificacion al finalizar por email";
                            var resultado = aplicarNivelesAccion(sublist, context.request);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                mensaje = resultado.mensaje;
                                log.error('Aplicar Niveles Accion', 'Error Consulta Cupones - Error : ' + mensaje);
                            }
                            infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            log.audit('Aplicar Niveles Accion', 'FIN Proceso');
                            context.response.writePage(form);
                            break;
                        case 'Buscar Cupones':
                            var resultado = cargarCupones(sublist, context.request);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                var mensaje = resultado.mensaje;
                                log.error('Aplicar Niveles Accion', 'Error Consulta Cupones - Error : ' + mensaje);
                                infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            }
                            log.audit('Aplicar Niveles Accion', 'FIN Proceso');
                            context.response.writePage(form);
                            break;
                    }
                }
            } catch (excepcion) {
                log.error('Aplicar Niveles Accion', 'Excepcion Aplicar Niveles Accion : ' + excepcion.message);
            }
        }

        function aplicarNivelesAccion(sublist, request) {
            log.audit('Aplicar Niveles Accion', 'INICIO Aplicar Niveles Accion');

            var idCuponesProcesar = new Array();
            var existenCuponesAplicar = false;
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";
            respuesta.estado = "";
            try {
                if (!utilities.isEmpty(request.parameters.cuponesdata)) {
                    var delimiterCampos = /\u0001/;
                    var delimiterArray = /\u0002/;

                    /*var idInternosRequis = request.parameters.custpage_idinterno;
                    log.debug('generar OC', 'idInternosRequis: ' + idInternosRequis);*/

                    var enviarEmail = 'F';
                    if (!utilities.isEmpty(request.parameters.enviaremail) && request.parameters.enviaremail == 'T') {
                        enviarEmail = 'T';
                    }

                    log.debug('Aplicar Niveles Accion', 'mensaje : ' + JSON.stringify(request.parameters.cuponesdata));


                    var sublista = request.parameters.cuponesdata.split(delimiterArray);

                    if (!utilities.isEmpty(sublista) && sublista.length > 0) {

                        for (var i = 0; respuesta.error == false && i < sublista.length; i++) {
                            if (!utilities.isEmpty(sublista[i])) {

                                var columnas = sublista[i].split(delimiterCampos);

                                log.debug('Aplicar Niveles Accion', 'columnas: ' + JSON.stringify(columnas));

                                if (!utilities.isEmpty(sublista) && sublista.length > 0) {
                                    //var procesar = columnas[0];
                                    //var oldNroAplicados = columnas[16];
                                    //var oldNivelAccion = columnas[15];

                                    //var newNroAplicados = columnas[17];
                                    var newNivelAccion = columnas[22];

                                    var objAplicar = new Object({});

                                    if (!utilities.isEmpty(newNivelAccion)) { //solo si est� marcado para enviar
                                        existenCuponesAplicar = true;

                                        var idInternoCupon = columnas[2];

                                        //var idInternoRequisiciones2 = columnas[7];

                                        log.debug('Aplicar Niveles Accion SUITELET', 'Tamano Array columna : ' + columnas.length);

                                        log.debug('Aplicar Niveles Accion SUITELET', 'Contador : ' + (i + 1) + ' - idInternoRequisiciones: ' + idInternoCupon);
                                        log.debug('Aplicar Niveles Accion SUITELET', 'Contador : ' + (i + 1) + ' - newNivelAccion: ' + newNivelAccion);

                                        if (!utilities.isEmpty(idInternoCupon)) {

                                            objAplicar.i = idInternoCupon;
                                            objAplicar.n = newNivelAccion;

                                            idCuponesProcesar.push(objAplicar);

                                        } else {
                                            //Error Obteniendo ID Interno de la Requisicion a procesar
                                            respuesta.error = true;
                                            respuesta.mensaje = "No se pudo Obtener el ID Interno de cupon a procesar";
                                        }
                                    }
                                } else {
                                    //Error Obteniendo Columnas de Sublista
                                    respuesta.error = true;
                                    respuesta.mensaje = "No se pudo Obtener las columnas de la sublista de cupones a procesar";
                                }
                            } else {
                                //Error Obteniendo Contenido de Sublista
                                respuesta.error = true;
                                respuesta.mensaje = "No se pudo Obtener el contenido de la sublista de cupones a procesar";
                            }

                        }

                        if (respuesta.error == false && existenCuponesAplicar == false) {
                            respuesta.error = true;
                            respuesta.mensaje = "No se selecciono ninguna requisicion para procesar";
                        }

                        /*if (respuesta.error == false && utilities.isEmpty(idInternosRequis)) {
                            respuesta.error = true;
                            respuesta.mensaje = "No se selecciono ninguna requisicion para procesar";
                        }*/

                        if (respuesta.error == false) {

                            //log.audit('Generacion Ordenes de Compras REST', 'ID REQ : ' + idRequisicionesProcesar.toString());

                            // Objeto de ID a Enviar por Parametro
                            parametros = new Object({});
                            //parametros.custscript_generar_oc_id = idRequisicionesProcesar.toString();
                            parametros.custscript_aplicar_cup_json = JSON.stringify(idCuponesProcesar);
                            //parametros.custscript_generar_oc_email = enviarEmail;

                            //log.debug('Generacion Ordenes de Compras SUITELET', 'idInternoRequisiciones: ' + idInternosRequis);

                            log.debug('Aplicar Niveles Accion', 'Aplicar Niveles Accion - Parametro de Cupones a Aplicar : ' + parametros.custscript_aplicar_cup_json);

                            log.debug('Aplicar Niveles Accion', 'Aplicar Niveles Accion - INICIO llamada Script MAP/REDUCE');

                            respuesta = createAndSubmitMapReduceJob('customscript_3k_aplicar_niveles_accion', parametros);

                            var mensajeEstado = "";
                            if (!utilities.isEmpty(respuesta) && !utilities.isEmpty(respuesta.estado)) {
                                mensajeEstado = respuesta.estado.status;
                            }

                            log.debug('Aplicar Niveles Accion', 'Aplicar Niveles Accion - /REDUCE - Estado : ' + mensajeEstado);

                        }
                    } else {
                        respuesta.error = true;
                        respuesta.mensaje = "No se pudo obtener registros de la sublista de cupones a procesar";
                    }
                } else {
                    respuesta.error = true;
                    respuesta.mensaje = "No se pudo obtener sublista de cupones a procesar";
                }

            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Cupones A Procesar - Excepcion : " + excepcion.message;

                log.error('Aplicar Niveles Accion', 'Consulta Cupones A Procesar - Excepcion Consultando Cupones A Procesar - Excepcion : ' + excepcion.message);
            }
            log.audit('Aplicar Niveles Accion', 'FIN Consulta Cupones A Procesar');
            return respuesta;
        }

        function cargarCupones(sublist, request) {
            log.audit('Aplicar Niveles de Acción', 'INICIO Busqueda Cupones');
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";

            try {

                var separadorMultiSelect = /\u0005/;

                var cuponesNivelAccion = search.load({
                    id: 'customsearch_3k_nivel_accion_cupones_st'
                });

                if (!utilities.isEmpty(request.parameters.idordendetalle)) {
                    var ordenesSeleccionados = request.parameters.idordendetalle.split(separadorMultiSelect);
                    if (!utilities.isEmpty(ordenesSeleccionados) && ordenesSeleccionados.length > 0) {
                        var filtroOrden = search.createFilter({
                            name: 'custrecord_3k_cupon_id_orden',
                            operator: search.Operator.ANYOF,
                            values: ordenesSeleccionados
                        });

                        cuponesNivelAccion.filters.push(filtroOrden);
                    }
                }

                if (!utilities.isEmpty(request.parameters.retiro)) {
                    var retiroSeleccionadas = request.parameters.retiro.split(separadorMultiSelect);
                    if (!utilities.isEmpty(retiroSeleccionadas) && retiroSeleccionadas.length > 0) {
                        var filtroRetiro = search.createFilter({
                            name: 'custrecord_3k_cupon_lugar_retiro',
                            operator: search.Operator.ANYOF,
                            values: retiroSeleccionadas
                        });

                        cuponesNivelAccion.filters.push(filtroRetiro);
                    }

                }

                if (!utilities.isEmpty(request.parameters.ordenventa)) {
                    var ordenventaSeleccionados = request.parameters.ordenventa.split(separadorMultiSelect);
                    if (!utilities.isEmpty(ordenventaSeleccionados) && ordenventaSeleccionados.length > 0) {
                        var filtroOrdenVenta = search.createFilter({
                            name: 'custrecord_3k_cupon_ord_venta',
                            operator: search.Operator.ANYOF,
                            values: ordenventaSeleccionados
                        });

                        cuponesNivelAccion.filters.push(filtroOrdenVenta);
                    }

                }

                if (!utilities.isEmpty(request.parameters.articulo)) {
                    var articulosSeleccionados = request.parameters.articulo.split(separadorMultiSelect);
                    if (!utilities.isEmpty(articulosSeleccionados) && articulosSeleccionados.length > 0) {
                        var filtroArticulo = search.createFilter({
                            name: 'custrecord_3k_cupon_articulo',
                            operator: search.Operator.ANYOF,
                            values: articulosSeleccionados
                        });

                        cuponesNivelAccion.filters.push(filtroArticulo);
                    }

                }

                if (!utilities.isEmpty(request.parameters.ordencompra)) {
                    var ordencompraSeleccionados = request.parameters.ordencompra.split(separadorMultiSelect);
                    if (!utilities.isEmpty(ordencompraSeleccionados) && ordencompraSeleccionados.length > 0) {
                        var filtroOrdenCompra = search.createFilter({
                            name: 'custrecord_3k_cupon_oc',
                            operator: search.Operator.ANYOF,
                            values: ordencompraSeleccionados
                        });

                        cuponesNivelAccion.filters.push(filtroOrdenCompra);
                    }

                }




                var resultSet = cuponesNivelAccion.run();

                var completeResultSet = null;

                log.debug('Aplicar Niveles de Acción', 'INICIO Busqueda Cupones');

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

                log.debug('Aplicar Niveles de Acción', 'FIN Busqueda Cupones');

                //var j = 0;

                if (!utilities.isEmpty(completeResultSet) && completeResultSet.length > 0) {
                    log.debug('Aplicar Niveles de Acción', 'FIN Busqueda Cupones - Cantidad Registros Encontrados : ' + completeResultSet.length);

                    var idUnico = 0;
                    var idUnicoAnterior = 0;
                    var idInternosTotal = [];

                    //var i = 0;
                    for (var j = 0; j < completeResultSet.length; j++) {

                        var idProveedor = completeResultSet[j].getValue({
                            name: resultSet.columns[13]
                        });

                        var idArticulo = completeResultSet[j].getValue({
                            name: resultSet.columns[3]
                        });

                        var alias = completeResultSet[j].getValue({
                            name: resultSet.columns[1]
                        });

                        var estado = completeResultSet[j].getValue({
                            name: resultSet.columns[2]
                        });

                        var lugarRetiro = completeResultSet[j].getValue({
                            name: resultSet.columns[8]
                        });

                        var ordenVenta = completeResultSet[j].getValue({
                            name: resultSet.columns[9]
                        });

                        var ordenDetalle = completeResultSet[j].getValue({
                            name: resultSet.columns[10]
                        });

                        var ordenCompra = completeResultSet[j].getValue({
                            name: resultSet.columns[11]
                        });

                        var fechaPedido = completeResultSet[j].getValue({
                            name: resultSet.columns[12]
                        });

                        var fechaPickUp = completeResultSet[j].getValue({
                            name: resultSet.columns[5]
                        });

                        var fechaClienteInicial = completeResultSet[j].getValue({
                            name: resultSet.columns[6]
                        });

                        var fechaCliente = completeResultSet[j].getValue({
                            name: resultSet.columns[7]
                        });

                        var idInterno = completeResultSet[j].getValue({
                            name: resultSet.columns[0]
                        });

                        var nivelAccionVigente = completeResultSet[j].getValue({
                            name: resultSet.columns[4]
                        });

                        var nroAplicados = completeResultSet[j].getValue({
                            name: resultSet.columns[21]
                        });

                        var skuProveedor = completeResultSet[j].getValue({
                            name: resultSet.columns[14]
                        });

                        var descripcion = completeResultSet[j].getValue({
                            name: resultSet.columns[15]
                        });

                        var campana = completeResultSet[j].getValue({
                            name: resultSet.columns[16]
                        });

                        if (!utilities.isEmpty(idProveedor)) {
                            sublist.setSublistValue({
                                id: 'proveedor',
                                line: j,
                                value: idProveedor
                            });
                        }


                        if (!utilities.isEmpty(idArticulo)) {
                            sublist.setSublistValue({
                                id: 'articulo',
                                line: j,
                                value: idArticulo
                            });
                        }

                        if (!utilities.isEmpty(alias)) {
                            sublist.setSublistValue({
                                id: 'alias',
                                line: j,
                                value: alias
                            });
                        }

                        if (!utilities.isEmpty(estado)) {
                            sublist.setSublistValue({
                                id: 'estado',
                                line: j,
                                value: estado
                            });
                        }

                        if (!utilities.isEmpty(lugarRetiro)) {

                            sublist.setSublistValue({
                                id: 'lugarretiro',
                                line: j,
                                value: lugarRetiro
                            });
                        }

                        if (!utilities.isEmpty(ordenVenta)) {
                            sublist.setSublistValue({
                                id: 'salesorder',
                                line: j,
                                value: ordenVenta
                            });
                        }

                        if (!utilities.isEmpty(ordenDetalle)) {


                            sublist.setSublistValue({
                                id: 'ordendetalle',
                                line: j,
                                value: ordenDetalle
                            });
                        }

                        if (!utilities.isEmpty(ordenCompra)) {

                            sublist.setSublistValue({
                                id: 'ordencompra',
                                line: j,
                                value: ordenCompra
                            });
                        }


                        if (!utilities.isEmpty(fechaPedido)) {
                            sublist.setSublistValue({
                                id: 'fechapedido',
                                line: j,
                                value: fechaPedido
                            });
                        }

                        if (!utilities.isEmpty(fechaPickUp)) {

                            sublist.setSublistValue({
                                id: 'fechapickup',
                                line: j,
                                value: fechaPickUp
                            });
                        }

                        if (!utilities.isEmpty(fechaCliente)) {

                            sublist.setSublistValue({
                                id: 'fechacliente',
                                line: j,
                                value: fechaCliente
                            });
                        }

                        if (!utilities.isEmpty(fechaClienteInicial)) {

                            sublist.setSublistValue({
                                id: 'fechaclienteinicial',
                                line: j,
                                value: fechaClienteInicial
                            });
                        }

                        sublist.setSublistValue({
                            id: 'idinterno',
                            line: j,
                            value: idInterno
                        });

                        if (!utilities.isEmpty(nivelAccionVigente)) {

                            sublist.setSublistValue({
                                id: 'nivelaccionvigente',
                                line: j,
                                value: nivelAccionVigente
                            });
                        }

                        if (!utilities.isEmpty(nroAplicados)) {

                            sublist.setSublistValue({
                                id: 'nivelesaplicados',
                                line: j,
                                value: nroAplicados
                            });
                        }

                        if (!utilities.isEmpty(skuProveedor)) {

                            sublist.setSublistValue({
                                id: 'skuproveedor',
                                line: j,
                                value: skuProveedor
                            });
                        }

                        if (!utilities.isEmpty(descripcion)) {

                            sublist.setSublistValue({
                                id: 'descripcion',
                                line: j,
                                value: descripcion
                            });
                        }

                        /*sublist.setSublistValue({
                            id: 'nivelaccion',
                            line: j,
                            value: ''
                        });*/

                        /*sublist.setSublistValue({
                            id: 'cantidadcambios',
                            line: j,
                            value: '0'
                        });*/



                        //j++;
                    } //for

                    //form.defaultValue = idInternosTotal.toString();
                } //if
                else {
                    respuesta.error = true;
                    respuesta.mensaje = "No se encontraron Cupones";
                    log.audit('Aplicar Niveles de Accion', 'FIN Busqueda Cupones - No se encontraron Cupones');
                }
            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Cupones - Excepcion : " + excepcion.message;
                log.error('Aplicar Niveles de Accion', 'Busqueda Cupones - Excepcion : ' + excepcion.message);
            }

            log.audit('Aplicar Niveles de Accion', 'FIN Consulta Cupones');
            return respuesta;
        }

        function createAndSubmitMapReduceJob(idScript, parametros) {
            log.audit('Aplicar Niveles Accion', 'INICIO Invocacion Script MAP/REDUCE');
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
                log.error('Aplicar Niveles Accion', 'Aplicar Niveles Accion - Excepcion Invocando A Script MAP/REDUCE - Excepcion : ' + excepcion.message);
            }
            log.audit('Aplicar Niveles Accion', 'FIN Invocacion Script MAP/REDUCE');
            return respuesta;
        }

        return {
            onRequest: onRequest
        };

    });
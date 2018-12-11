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

define(['N/ui/serverWidget', 'N/https', 'N/record', 'N/error', 'N/search', 'N/format', 'N/task', '3K/utilities', 'N/render', 'N/file'],

    function(serverWidget, https, record, error, search, format, task, utilities, render, file) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            log.audit('Generacion Etiquetas Envio REST', 'INICIO Proceso - Metodo : ' + context.request.method + ' Sitio : ' + context.request.parameters.sitioweb + ' Destino : ' + context.request.parameters.destino + ' Fecha Desde : ' + context.request.parameters.fechadesde + ' Fecha Hasta : ' + context.request.parameters.fechahasta);

            try {

                var form = serverWidget.createForm({
                    title: 'Generacion de Etiquetas de Envio'
                });

                //form.clientScriptFileId = 6026;
                form.clientScriptModulePath = './3K - Generacion Etiquetas Envio (Cliente).js'

                var grupoFiltros = form.addFieldGroup({
                    id: 'filtros',
                    label: 'Criterios de Busqueda de Cupones para Envio'
                });

                var grupoDatos = form.addFieldGroup({
                    id: 'infocupones',
                    label: 'Informacion Cupones para Envio'
                });

                var tabDetalle = form.addTab({
                    id: 'tabdetalle',
                    label: 'Detalle'
                });

                var subTab = form.addSubtab({
                    id: 'tabbusqueda',
                    label: 'Cupones Pendientes de Envio',
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
                // FIN CAMPOS

                // INICIO FILTROS
                var sitioWeb = form.addField({
                    id: 'sitioweb',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Sitio',
                    source: 'customrecord_cseg_3k_sitio_web_o',
                    container: 'filtros'
                });
                sitioWeb.isMandatory = true;

                if (!utilities.isEmpty(context.request.parameters.sitioweb)) {
                    sitioWeb.defaultValue = context.request.parameters.sitioweb;
                }

                var destino = form.addField({
                    id: 'destino',
                    label: 'Destino',
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'customrecord_3k_destinos_envio',
                    container: 'filtros'
                });

                var fechaDesde = form.addField({
                    id: 'fechadesde',
                    label: 'Fecha Desde',
                    type: serverWidget.FieldType.DATE,
                    container: 'filtros'
                });
                fechaDesde.isMandatory = true;

                var fechaHasta = form.addField({
                    id: 'fechahasta',
                    label: 'Fecha Hasta',
                    type: serverWidget.FieldType.DATE,
                    container: 'filtros'
                });
                fechaHasta.isMandatory = true;

                var batchId = form.addField({
                    id: 'batchid',
                    label: 'Batch ID',
                    type: serverWidget.FieldType.TEXT,
                    container: 'filtros'
                });


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
                    fechaDesde.defaultValue = fechaLocal;
                    fechaHasta.defaultValue = fechaLocal;
                }

                // FIN FILTROS

                // INICIO SUBLISTA
                var sublist = form.addSublist({
                    id: 'cupones',
                    type: serverWidget.SublistType.LIST,
                    label: 'Cupones Pendientes de Envio',
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
                    id: 'articulo',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Articulo',
                    source: 'item'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: 'cantidad',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Cantidad',
                    source: 'item'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: 'cupones',
                    label: 'Cupones',
                    type: serverWidget.FieldType.TEXTAREA
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: 'idinternos',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ID Internos'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                //sublist.addMarkAllButtons();
                // FIN SUBLISTA

                form.addSubmitButton({
                    label: 'Buscar Cupones Pendientes de Envio'
                });

                form.addButton({
                    id: 'custpage_btgenetiqueta',
                    label: 'Generar Etiquetas de Envio',
                    functionName: "generarEtiqueta"
                });

                var infoResultado = form.addField({
                    id: 'custpage_resultado',
                    label: 'Resultados',
                    type: serverWidget.FieldType.INLINEHTML
                });

                if (context.request.method === 'GET') {
                    log.audit('Generacion Etiquetas Envio REST', 'FIN Proceso');
                    context.response.writePage(form);
                } else {
                    var sAccion = utilities.isEmpty(context.request.parameters.custpage_accion) ? context.request.parameters.submitter : context.request.parameters.custpage_accion;
                    log.audit('Generacion Cupones REST', sAccion);
                    switch (sAccion) {
                        case 'GENERARETIQUETA':
                            var mensaje = "Se proceso su solicitud. Recibira una notificacion al finalizar por email";
                            var resultado = generarEtiquetas(sublist, context.request);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                mensaje = resultado.mensaje;
                                log.error('Generacion Etiquetas Envio REST', 'Error Consulta Cupones A Procesar - Error : ' + mensaje);
                                infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            } else {
                                //Envia el archivo
                                log.debug('Generacion Etiquetas Envio REST', 'Se envia el archivo');
                                if (!utilities.isEmpty(resultado.archivoPDF))
                                    context.response.writeFile(resultado.archivoPDF, false);
                            }

                            if (utilities.isEmpty(resultado.archivoPDF))
                                context.response.writePage(form);

                            log.audit('Generacion Etiquetas Envio REST', 'FIN Proceso');

                            break;
                        case 'Buscar Cupones Pendientes de Envio':
                            var resultado = cargarCuponesPendienteEnvio(sublist, idInternoField, context.request);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                var mensaje = resultado.mensaje;
                                log.error('Generacion Etiquetas Envio REST', 'Error Consulta Cupones Pendientes de Envio - Error : ' + mensaje);
                                infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            }
                            log.audit('Generacion Etiquetas Envio REST', 'FIN Proceso');
                            context.response.writePage(form);
                            break;
                    }
                }
            } catch (excepcion) {
                log.error('Generacion Etiquetas Envio REST', 'Excepcion Proceso Generacion Cupones - Excepcion : ' + excepcion.message);
            }
        }

        function generarEtiquetas(sublist, request) {
            log.audit('Generacion Cupones REST', 'INICIO Consulta Cupones a procesar');

            var idCuponesProcesar = new Array();
            var existenCuponesSeleccionadas = false;
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";
            respuesta.estado = "";
            respuesta.archivoPDF = '';

            try {
                log.debug('generarEtiquetas', 'info a procesar:' + JSON.stringify(request.parameters));
                log.debug('generarEtiquetas', 'info a procesar:' + request.parameters.cuponesdata);
                if (!utilities.isEmpty(request.parameters.cuponesdata)) {
                    var delimiterCampos = /\u0001/;
                    var delimiterArray = /\u0002/;

                    var idInternosRequis = request.parameters.custpage_idinterno;
                    log.debug('generar Etiquetas', 'idInternosRequis: ' + idInternosRequis);

                    var sublista = request.parameters.cuponesdata.split(delimiterArray);

                    if (!utilities.isEmpty(sublista) && sublista.length > 0) {

                        /*for (var i = 0; respuesta.error == false && i < sublista.length; i++) {
                            if (!utilities.isEmpty(sublista[i])) {

                                var columnas = sublista[i].split(delimiterCampos);

                                if (!utilities.isEmpty(sublista) && sublista.length > 0) {
                                    var procesar = columnas[0];

                                    if (procesar == 'T') { //solo si está marcado para enviar
                                        existenCuponesSeleccionadas = true;

                                        var idInternoCupones = columnas[4];

                                        if (!utilities.isEmpty(idInternoCupones)) {

                                            idCuponesProcesar.push(idInternoCupones);
                                        } else {
                                            //Error Obteniendo ID Interno de la Requisicion a procesar
                                            respuesta.error = true;
                                            respuesta.mensaje = "No se pudo Obtener el ID Interno de Cupones a procesar";
                                        }
                                    }
                                } else {
                                    //Error Obteniendo Columnas de Sublista
                                    respuesta.error = true;
                                    respuesta.mensaje = "No se pudo Obtener las columnas de la sublista de Cupones a procesar";
                                }
                            } else {
                                //Error Obteniendo Contenido de Sublista
                                respuesta.error = true;
                                respuesta.mensaje = "No se pudo Obtener el contenido de la sublista de Cupones a procesar";
                            }

                        }*/

                        /*if (respuesta.error == false && existenCuponesSeleccionadas == false) {
                            respuesta.error = true;
                            respuesta.mensaje = "No se selecciono ninguna requisicion para procesar";
                        }*/

                        if (respuesta.error == false && utilities.isEmpty(idInternosRequis)) {
                            respuesta.error = true;
                            respuesta.mensaje = "No se selecciono ninguna requisicion para procesar";
                        }


                        if (respuesta.error == false) {
                            log.debug('Generacion Cupones REST', 'Generacion Cupones - ID Cupones a procesar : ' + idCuponesProcesar.toString());

                            var sitio = request.parameters.sitioweb;

                            var arraySearchParams = new Array();
                            var objParam = new Object({});
                            objParam.name = 'custrecord_77_cseg_3k_sitio_web_o';
                            objParam.operator = 'IS';
                            objParam.values = [sitio];
                            arraySearchParams.push(objParam);

                            var objResultSet = utilities.searchSavedPro('customsearch_3k_config_etiquetas_envio', arraySearchParams);

                            var configEtiqueta = objResultSet.objRsponseFunction.array;
                            log.debug('Generacion Cupones REST', 'configEtiqueta: ' + JSON.stringify(configEtiqueta));

                            if (!utilities.isEmpty(configEtiqueta) && configEtiqueta.length > 0) {

                                //respuesta = generarEtiquetaEnvio(idCuponesProcesar.toString(), configEtiqueta);
                                respuesta = generarEtiquetaEnvio(idInternosRequis.toString(), configEtiqueta);

                                var mensajeEstado = "";
                                if (!utilities.isEmpty(respuesta) && !utilities.isEmpty(respuesta.estado)) {
                                    mensajeEstado = respuesta.estado.status;
                                }

                                log.debug('Generacion Cupones REST', 'Generacion Cupones - /REDUCE - Estado : ' + mensajeEstado);

                            } else {
                                respuesta.error = true;
                                respuesta.mensaje = "No se encontró configuración de etiquetas de envío";
                            }

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

                log.error('Generacion Cupones REST', 'Consulta Cupones a procesar - Excepcion Consultando Cupones a procesar - Excepcion : ' + excepcion.message);
            }
            log.audit('Generacion Cupones REST', 'FIN Consulta Cupones a procesar');
            return respuesta;
        }

        function generarEtiquetaEnvio(arrInfoCupones, configEtiqueta) {
            var respuesta = new Object();
            try {
                var arrayEtiquetasOriginal = new Array();
                var arrayEtiquetasFinal = new Array();
                var arrayArticulos = new Array();
                var cantidadEtiquetas = new Array();
                var objJSONEtiquetas = new Object();
                var arrayRegistrosCupones = new Array();
                objJSONEtiquetas.arrayEtiquetasFinal = new Array();

                //var request = options.request;
                //var response = options.response;
                log.debug('generarEtiquetaPDF', 'Param:' + arrInfoCupones);

                if (!utilities.isEmpty(arrInfoCupones) && arrInfoCupones.length > 0) {
                    arrayRegistrosCupones = arrInfoCupones.split(',');

                    if (!utilities.isEmpty(arrayRegistrosCupones) && arrayRegistrosCupones.length > 0) {

                        var rangoInicial = 0;
                        var rangoSalto = 1000;
                        var completeResultSet = [];

                        log.debug('Generacion Etiquetas PDF - Envio REST', 'INICIO Consulta Busqueda Cupones Pendientes de Envio');

                        do {
                            // fetch one result set
                            var indiceFinal = (rangoInicial + rangoSalto);
                            if (arrayRegistrosCupones.length <= indiceFinal) {
                                indiceFinal = arrayRegistrosCupones.length;
                            }

                            var resultadoParcial = arrayRegistrosCupones.slice(rangoInicial, indiceFinal);

                            if (!utilities.isEmpty(resultadoParcial) && resultadoParcial.length > 0) {
                                // INICIO Consultar Cupones A Imprimir
                                var cuponesPendientes = search.load({
                                    id: 'customsearch_3k_detalle_cupones_envio'
                                });

                                var filtroID = search.createFilter({
                                    name: 'internalid',
                                    operator: search.Operator.ANYOF,
                                    values: resultadoParcial
                                });

                                cuponesPendientes.filters.push(filtroID);

                                var resultSearch = cuponesPendientes.run();
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
                                        if (rangoInicial == 0) completeResultSet = resultado;
                                        else completeResultSet = completeResultSet.concat(resultado);
                                    }
                                    // increase pointer
                                    resultIndex = resultIndex + resultStep;
                                    // once no records are returned we already got all of them
                                } while (!utilities.isEmpty(resultado) && resultado.length > 0)
                                rangoInicial = rangoInicial + rangoSalto;
                            }
                        } while (!utilities.isEmpty(resultadoParcial) && resultadoParcial.length > 0 && arrayRegistrosCupones.length > indiceFinal)

                        log.debug('Generacion Etiquetas PDF - Envio REST', 'FIN Consulta Busqueda Cupones Pendientes de Envio: Cantidad: ' + completeResultSet.length);

                        if (!utilities.isEmpty(completeResultSet) && completeResultSet.length > 0) {
                            for (var i = 0; i < completeResultSet.length; i++) {

                                var etiquetaOriginal = new Object();

                                etiquetaOriginal.idInternoCupon = completeResultSet[i].getValue({
                                    name: resultSearch.columns[0]
                                });

                                var idInternoArticulo = completeResultSet[i].getValue({
                                    name: resultSearch.columns[1]
                                });

                                etiquetaOriginal.idInternoArticulo = idInternoArticulo;

                                etiquetaOriginal.lugarRetiro = completeResultSet[i].getValue({
                                    name: resultSearch.columns[2]
                                });
                                etiquetaOriginal.fechaDisponibilidad = completeResultSet[i].getValue({
                                    name: resultSearch.columns[3]
                                });
                                etiquetaOriginal.articuloCodigoUPC = completeResultSet[i].getValue({
                                    name: resultSearch.columns[4]
                                });
                                etiquetaOriginal.articuloNombreMostrar = completeResultSet[i].getValue({
                                    name: resultSearch.columns[5]
                                });
                                etiquetaOriginal.idAlias = completeResultSet[i].getValue({
                                    name: resultSearch.columns[6]
                                });
                                etiquetaOriginal.articuloSKU = completeResultSet[i].getValue({
                                    name: resultSearch.columns[7]
                                });
                                etiquetaOriginal.articuloSKUProveedor = completeResultSet[i].getValue({
                                    name: resultSearch.columns[8]
                                });
                                etiquetaOriginal.clienteNombreLegal = completeResultSet[i].getValue({
                                    name: resultSearch.columns[9]
                                });

                                etiquetaOriginal.cantidadBultos = 1;

                                log.debug('Generacion Etiquetas PDF - Envio REST', ' INFO : ' + JSON.stringify(etiquetaOriginal));

                                arrayEtiquetasOriginal.push(etiquetaOriginal);

                                var index = arrayArticulos.indexOf(idInternoArticulo);

                                if (index == -1) {
                                    arrayArticulos.push(idInternoArticulo);
                                }
                            }
                        }

                        log.debug('Generacion Etiquetas PDF - Envio REST', 'FIN Grabar Original - Tam : ' + arrayArticulos.length);

                        // INICIO - Consultar Cantidad de Etiquetas A Imprimir por Cupon y Articulo
                        var filtrosArticulos = new Array();

                        var filtroArticulo = new Object();
                        filtroArticulo.name = 'internalid';
                        filtroArticulo.operator = 'ANYOF';
                        filtroArticulo.values = arrayArticulos;
                        filtrosArticulos.push(filtroArticulo);

                        log.debug('Generacion Etiquetas PDF - Envio REST', 'INICIO Consulta Bultos');

                        var searchEtiquetasArticulos = utilities.searchSavedPro('customsearch_3k_cant_bultos_articulos', filtrosArticulos);

                        if (!utilities.isEmpty(searchEtiquetasArticulos) && searchEtiquetasArticulos.error == false) {
                            if (!utilities.isEmpty(searchEtiquetasArticulos.objRsponseFunction.result) && searchEtiquetasArticulos.objRsponseFunction.result.length > 0) {
                                var resultSet = searchEtiquetasArticulos.objRsponseFunction.result;
                                var resultSearch = searchEtiquetasArticulos.objRsponseFunction.search;
                                for (var i = 0; i < resultSet.length; i++) {
                                    var cantEtiqueta = new Object();
                                    cantEtiqueta.idInternoArticulo = resultSet[i].getValue({
                                        name: resultSearch.columns[0]
                                    });
                                    cantEtiqueta.cantidad = resultSet[i].getValue({
                                        name: resultSearch.columns[5]
                                    });

                                    if (!utilities.isEmpty(cantEtiqueta.cantidad) && !isNaN(cantEtiqueta.cantidad)) {
                                        cantEtiqueta.cantidad = parseInt(cantEtiqueta.cantidad, 10);
                                    } else {
                                        cantEtiqueta.cantidad = parseInt(1, 10);
                                    }

                                    //log.debug('Generacion Etiquetas PDF - Envio REST', 'XX : ' + cantEtiqueta.cantidad);

                                    cantidadEtiquetas.push(cantEtiqueta);
                                }

                            } else {
                                respuesta.error = true;
                                respuesta.mensaje = "Error Consultando Cantidad de Etiquetas A Imprimir por Cupon";
                                respuesta.estado = new Object();
                                respuesta.estado.status = respuesta.mensaje;
                            }
                        } else {
                            if (utilities.isEmpty(searchEtiquetasArticulos)) {
                                respuesta.error = true;
                                respuesta.mensaje = "Error Consultando Cantidad de Etiquetas A Imprimir por Cupon";
                                respuesta.estado = new Object();
                                respuesta.estado.status = respuesta.mensaje;
                            } else {
                                respuesta.error = true;
                                respuesta.mensaje = "Error Consultando Cantidad de Etiquetas A Imprimir por Cupon";
                                respuesta.estado = new Object();
                                respuesta.estado.status = respuesta.mensaje;
                            }
                        }

                        log.debug('Generacion Etiquetas PDF - Envio REST', 'FIN Consulta Bultos');

                        log.debug('Generacion Etiquetas PDF - Envio REST', 'INICIO Array Final');

                        //
                        for (var i = 0; !utilities.isEmpty(arrayEtiquetasOriginal) && i < arrayEtiquetasOriginal.length; i++) {
                            var cantidadEtiquetasGenerar = 0;
                            var objCantidadEtiquetas = cantidadEtiquetas.filter(function(obj) {
                                return (obj.idInternoArticulo == arrayEtiquetasOriginal[i].idInternoArticulo);
                            });

                            if (!utilities.isEmpty(objCantidadEtiquetas) && objCantidadEtiquetas.length > 0) {
                                for (var k = 0; k < objCantidadEtiquetas.length; k++) {
                                    var cantidad = objCantidadEtiquetas[k].cantidad;
                                    if (!utilities.isEmpty(cantidad) && cantidad > 0) {
                                        cantidadEtiquetasGenerar = cantidadEtiquetasGenerar + cantidad;
                                    }
                                }
                            }


                            for (var k = 0; k < cantidadEtiquetasGenerar; k++) {
                                arrayEtiquetasOriginal[i].cantidadBultos = cantidadEtiquetasGenerar;
                                objJSONEtiquetas.arrayEtiquetasFinal.push(arrayEtiquetasOriginal[i]);
                            }

                        }

                        log.debug('Generacion Etiquetas PDF - Envio REST', 'FIN Array Final');

                        //
                        // FIN - Consultar Cantidad de Etiquetas A Imprimir por Cupon y Articulo

                        var idTemplate = configEtiqueta[0].custrecord_3k_conf_etq_idtemplate;
                        var renderer = render.create();
                        var fileObj = file.load({
                            id: idTemplate
                        });

                        renderer.templateContent = fileObj.getContents();
                        //renderer.templateContent='<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\n<pdf>\n<body font-size="18">\nHello World!\n</body>\n</pdf>';

                        renderer.addCustomDataSource({
                            format: render.DataSource.JSON,
                            alias: 'cupones',
                            data: JSON.stringify(objJSONEtiquetas)
                        });

                        var newfile = renderer.renderAsPdf();


                        /*var newfile = render.xmlToPdf({
                            xmlString: '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\n<pdf>\n<body font-size="18">\nHello World!\n</body>\n</pdf>'
                        });*/

                        respuesta.archivoPDF = newfile;
                        respuesta.error = false;

                    } else {
                        respuesta.error = true;
                        respuesta.mensaje = "Error Consultando Cupones A Procesar - No se Recibio la informacion de los Cupones A Imprimir";
                        respuesta.estado = new Object();
                        respuesta.estado.status = respuesta.mensaje;

                        log.error('generarEtiquetaPDF', 'Error : ' + respuesta.mensaje);
                    }

                } else {
                    respuesta.error = true;
                    respuesta.mensaje = "Error Consultando Cupones A Procesar - No se Recibio la informacion de los Cupones A Imprimir";
                    respuesta.estado = new Object();
                    respuesta.estado.status = respuesta.mensaje;

                    log.error('generarEtiquetaPDF', 'Error : ' + respuesta.mensaje);
                }

            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Cupones A Procesar - Excepcion : " + JSON.stringify(excepcion);
                respuesta.estado = new Object();
                respuesta.estado.status = respuesta.mensaje;

                log.error('generarEtiquetaPDF', 'Error : ' + excepcion.message);
            }

            return respuesta;
        }

        function cargarCuponesPendienteEnvio(sublist, form, request) {
            log.audit('Generacion Etiquetas Envio REST', 'INICIO Consulta Cupones Pendientes de Envio');
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";
            var delimiterCampos = /\u0001/;
            var delimiterArray = /\u0002/;

            try {

                var separadorMultiSelect = /\u0005/;
                var idInternosArray = [];

                var requisicionesPendientes = search.load({
                    id: 'customsearch_3k_cup_envio_sl'
                });

                if (!utilities.isEmpty(request.parameters.destino)) {
                    var destinosSeleccionados = request.parameters.destino.split(separadorMultiSelect);
                    if (!utilities.isEmpty(destinosSeleccionados) && destinosSeleccionados.length > 0) {
                        var filtroDestino = search.createFilter({
                            name: 'custrecord_3k_cupon_lugar_retiro',
                            operator: search.Operator.ANYOF,
                            values: destinosSeleccionados
                        });

                        requisicionesPendientes.filters.push(filtroDestino);
                    }

                }

                if (!utilities.isEmpty(request.parameters.fechadesde)) {

                    var filtroFechaDesde = search.createFilter({
                        name: 'custrecord_3k_cupon_fecha_entrega',
                        operator: search.Operator.ONORAFTER,
                        values: [request.parameters.fechadesde]
                    });

                    requisicionesPendientes.filters.push(filtroFechaDesde);

                }

                if (!utilities.isEmpty(request.parameters.fechahasta)) {

                    var filtroFechaHasta = search.createFilter({
                        name: 'custrecord_3k_cupon_fecha_entrega',
                        operator: search.Operator.ONORBEFORE,
                        values: [request.parameters.fechahasta]
                    });

                    requisicionesPendientes.filters.push(filtroFechaHasta);

                }

                /*if (!utilities.isEmpty(request.parameters.sitioweb)) {

                    var filtroSitioWeb = search.createFilter({
                        name: 'custrecord_69_cseg_3k_sitio_web_o',
                        operator: search.Operator.IS,
                        values: [request.parameters.sitioweb]
                    });

                    requisicionesPendientes.filters.push(filtroSitioWeb);

                }*/

                if (!utilities.isEmpty(request.parameters.batchid)) {

                    var filtroBatchId = search.createFilter({
                        //name: 'custrecord_3k_cupon_ord_venta.custbody_rfs_woow_batchid',
                        name: 'custbody_rfs_woow_batchid',
                        join: 'custrecord_3k_cupon_ord_venta',
                        operator: search.Operator.STARTSWITH,
                        values: [request.parameters.batchid]
                    });

                    requisicionesPendientes.filters.push(filtroBatchId);
                }


                var resultSet = requisicionesPendientes.run();

                var completeResultSet = null;

                log.debug('Generacion Etiquetas Envio REST', 'INICIO Consulta Busqueda Cupones Pendientes de Envio');

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
                        if (resultIndex === 0)
                            completeResultSet = resultado;
                        else
                            completeResultSet = completeResultSet.concat(resultado);
                    }

                    // increase pointer
                    resultIndex = resultIndex + resultStep;

                    // once no records are returned we already got all of them
                } while (!utilities.isEmpty(resultado) && resultado.length > 0);

                log.debug('Generacion Etiquetas Envio REST', 'FIN Consulta Busqueda Cupones Pendientes de Envio');

                var j = 0;

                if (!utilities.isEmpty(completeResultSet)) {
                    log.debug('Generacion Etiquetas Envio REST', 'FIN Consulta Busqueda Cupones Pendientes de Envio - Cantidad Registros Encontrados : ' + completeResultSet.length);

                    var idArticulo = 0;
                    var idArticuloAnterior = 0;


                    var i = 0;
                    while (!utilities.isEmpty(completeResultSet) && completeResultSet.length > 0 && i < completeResultSet.length) {

                        idArticulo = completeResultSet[i].getValue({
                            name: resultSet.columns[0]
                        });

                        sublist.setSublistValue({
                            id: 'articulo',
                            line: j,
                            value: idArticulo
                        });

                        sublist.setSublistValue({
                            id: 'cantidad',
                            line: j,
                            value: parseInt(completeResultSet[i].getValue({
                                name: resultSet.columns[1]
                            }), 10).toString()
                        });

                        sublist.setSublistValue({
                            id: 'cupones',
                            line: j,
                            value: completeResultSet[i].getValue({
                                name: resultSet.columns[3]
                            })
                        });

                        sublist.setSublistValue({
                            id: 'idinternos',
                            line: j,
                            value: completeResultSet[i].getValue({
                                name: resultSet.columns[2]
                            })
                        });

                        var idInternosCupones = completeResultSet[i].getValue({
                            name: resultSet.columns[2]
                        })

                        idInternosArray.push(idInternosCupones);

                        j++;
                        i++;
                    } //for

                    form.defaultValue = idInternosArray.toString();
                } //if
                else {
                    respuesta.error = true;
                    respuesta.mensaje = "No se encontraron Cupones Pendientes de Envio para las Fechas Solicitadas";
                    log.audit('Generacion Etiquetas Envio REST', 'FIN Consulta Cupones Pendientes de Envio - No se encontraron Cupones Pendientes de Envio para las Fechas Solicitadas');
                }
            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Cupones Pendientes de Envio - Excepcion : " + excepcion.message;
                log.error('Generacion Etiquetas Envio REST', 'Consulta Busqueda Cupones Pendientes de Envio - Excepcion Consultando Cupones Pendientes de Envio - Excepcion : ' + excepcion.message);
            }

            log.audit('Generacion Etiquetas Envio REST', 'FIN Consulta Cupones Pendientes de Envio');
            return respuesta;
        }

        return {
            onRequest: onRequest
        };

    });
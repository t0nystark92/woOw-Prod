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

    function (serverWidget, https, record, error, search, format, task, utilities) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            log.audit('Generacion Envio Logistico', 'INICIO Proceso');

            try {

                var form = serverWidget.createForm({
                    title: 'Marcar Cupones como enviados'
                });

                //form.clientScriptFileId = 6026;
                form.clientScriptModulePath = './3K - Marcar Cupones como Enviados (Cliente).js';

                var grupoFiltros = form.addFieldGroup({
                    id: 'filtros',
                    label: 'Criterios de Busqueda de Cupones'
                });

                var grupoFiltroRapido = form.addFieldGroup({
                    id: 'busqueda',
                    label: 'Busqueda de Cupones'
                });

                var infoDespacho = form.addFieldGroup({
                    id: 'despachos',
                    label: 'Información para Despacho'
                });

                var grupoDatos = form.addFieldGroup({
                    id: 'infoliquidaciones',
                    label: 'Informacion Cupones'
                });

                var tabDetalle = form.addTab({
                    id: 'tabdetalle',
                    label: 'Detalle'
                });

                var subTabCupones = form.addSubtab({
                    id: 'tabcupones',
                    label: 'Cupones a Marcar',
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

                var busquedaCupon = form.addField({
                    id: 'numcupon',
                    label: 'Busqueda por Numero de Cupon',
                    type: serverWidget.FieldType.TEXT,
                    container: 'busqueda'
                });

                var cantidadCuponesMarcados = form.addField({
                    id: 'cantidadcupmarcados',
                    label: 'Cantidad de Cupones Seleccionados : ',
                    type: serverWidget.FieldType.TEXT,
                    container: 'busqueda'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                cantidadCuponesMarcados.defaultValue = '0';

                var txtDespacho = form.addField({
                    id: 'despacho',
                    label: 'Nro Despacho',
                    type: serverWidget.FieldType.TEXT,
                    container: 'despachos'
                });



                // FIN CAMPOS

                // INICIO FILTROS

                var destino = form.addField({
                    id: 'destino',
                    label: 'Lugar Retiro',
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'customrecord_3k_destinos_envio',
                    container: 'filtros'
                });


                /*var sitioWeb = form.addField({
                    id: 'sitioweb',
                    label: 'Sitio Web',
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'customrecord_cseg_3k_sitio_web_o',
                    container: 'filtros'
                });*/



                /*var empresa = form.addField({
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

                if (!utilities.isEmpty(fechaLocal)) {
                    //fechaInicio.defaultValue = fechaLocal;
                    fechaFin.defaultValue = fechaLocal;
                }*/

                /*var enviarEmailProveedor = form.addField({
                    id: 'enviaremail',
                    label: 'Enviar Factura Comision por Email',
                    type: serverWidget.FieldType.CHECKBOX,
                    container: 'filtros'
                });
                enviarEmailProveedor.defaultValue = 'T';
                
                */

                // FIN FILTROS

                // INICIO SUBLISTA
                var sublistCupones = form.addSublist({
                    id: 'cupones',
                    type: serverWidget.SublistType.LIST,
                    label: 'Cupones pendientes de envío',
                    tab: 'tabcupones'
                });

                sublistCupones.addField({
                    id: 'procesar',
                    label: 'Procesar',
                    type: serverWidget.FieldType.CHECKBOX
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.ENTRY
                });

                sublistCupones.addField({
                    id: 'alias',
                    label: 'Alias Cupon',
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'sku',
                    label: 'SKU',
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'descripcion',
                    label: 'Descripcion',
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'skuproveedor',
                    label: 'SKU Proveedor',
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });


                sublistCupones.addField({
                    id: 'idinternos',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ID Internos'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                sublistCupones.addField({
                    id: 'ordenmisbe',
                    label: 'ID Orden Misbe',
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'remito',
                    label: 'Remito',
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addMarkAllButtons();
                // FIN SUBLISTA

                form.addSubmitButton({
                    label: 'Buscar Cupones pendiente de Envío'
                });

                form.addButton({
                    id: 'custpage_btmarcupenv',
                    label: 'Marcar Cupones como enviados',
                    functionName: "marcarCupones"
                });

                var infoResultado = form.addField({
                    id: 'custpage_resultado',
                    label: 'Resultados',
                    type: serverWidget.FieldType.INLINEHTML
                });

                /*var cantCuponesMarcados = form.addField({
                    id: 'custpage_cant_cup_marcados',
                    label: 'Cantidad de Cupones Seleccionados',
                    type: serverWidget.FieldType.INLINEHTML,
                    container: 'busqueda'
                });
                cantCuponesMarcados.defaultValue = '<font color="blue">' + 'Cantidad de Cupones Seleccionados : 0' + '</font>';*/

                if (context.request.method === 'GET') {
                    log.audit('Generacion Envio Logistico', 'FIN Proceso');
                    context.response.writePage(form);
                } else {
                    var sAccion = utilities.isEmpty(context.request.parameters.custpage_accion) ? context.request.parameters.submitter : context.request.parameters.custpage_accion;
                    txtDespacho.isMandatory = true;

                    switch (sAccion) {
                        case 'MARCARCUP':
                            var mensaje = "Se proceso su solicitud. Recibira una notificacion al finalizar por email";
                            var resultado = marcarCupones(sublistCupones, context.request);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                mensaje = resultado.mensaje;
                                log.error('Generacion Envio Logistico', 'Error Consulta Cupones A Procesar - Error : ' + mensaje);
                            }
                            infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            log.audit('Generacion Envio Logistico', 'FIN Proceso');
                            context.response.writePage(form);
                            break;
                        case 'Buscar Cupones pendiente de Envío':
                            var resultado = cargarCupones(sublistCupones, context.request);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                var mensaje = resultado.mensaje;
                                log.error('Generacion Envio Logistico', 'Error Consulta Cupones Pendientes - Error : ' + mensaje);
                                infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            }
                            log.audit('Generacion Envio Logistico', 'FIN Proceso');
                            context.response.writePage(form);
                            break;
                    }
                }
            } catch (excepcion) {
                log.error('Generacion Envio Logistico', 'Excepcion Proceso Generacion Envio Logistico - Excepcion : ' + excepcion.message);
            }
        }

        function marcarCupones(sublistCupones, request) {
            log.audit('Generacion Envio Logistico', 'INICIO Consulta Cupones A Procesar');

            var idCuponesProcesar = new Array();
            var arrCuponesRemito = new Array();
            var arrCuponesRemitoSelected = new Array();
            var existenCuponesSeleccionados = false;
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";
            respuesta.estado = "";

            try {
                if (!utilities.isEmpty(request.parameters.cuponesdata)) {
                    var delimiterCampos = /\u0001/;
                    var delimiterArray = /\u0002/;

                    var numero_despacho = request.parameters.despacho;

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

                                        /*log.debug('columnas', JSON.stringify(columnas));

                                        var objRemitosCupones = new Object();
                                        objRemitosCupones.idCupon = new Array();
                                        objRemitosCupones.index = 0;
                                        objRemitosCupones.idRemito = columnas[7];

                                        var arrCuponesRemitoFilter = arrCuponesRemito.filter(function(obj) {
                                            return obj.idRemito == objRemitosCupones.idRemito;
                                        });

                                        if (!utilities.isEmpty(arrCuponesRemitoFilter) && arrCuponesRemitoFilter.length > 0) {
                                            log.debug('arrCuponesRemitoFilter', JSON.stringify(arrCuponesRemitoFilter));
                                            arrCuponesRemito[arrCuponesRemitoFilter[0].index].idCupon.push(columnas[1]);
                                        } else {
                                            objRemitosCupones.idCupon.push(columnas[1]);
                                            if (!utilities.isEmpty(arrCuponesRemito) && arrCuponesRemito.length > 0) {
                                                objRemitosCupones.index = arrCuponesRemito.length;
                                            }
                                            arrCuponesRemito.push(objRemitosCupones);
                                        }

                                        log.debug('arrCuponesRemito', JSON.stringify(arrCuponesRemito));*/

                                        if (procesar == 'T') { //solo si est� marcado para enviar
                                            existenCuponesSeleccionados = true;

                                            var idInternoCupones = columnas[5];

                                            if (!utilities.isEmpty(idInternoCupones)) {

                                                idCuponesProcesar.push(idInternoCupones);

                                                /*var objRemitosCuponesSelected = new Object();
                                                objRemitosCuponesSelected.idCupon = new Array();
                                                objRemitosCuponesSelected.index = 0;
                                                objRemitosCuponesSelected.idRemito = columnas[7];

                                                var arrCuponesRemitoSelectedFilter = arrCuponesRemitoSelected.filter(function (obj) {
                                                    return obj.idRemito == objRemitosCuponesSelected.idRemito;
                                                });

                                                if (!utilities.isEmpty(arrCuponesRemitoSelectedFilter) && arrCuponesRemitoSelectedFilter.length > 0) {
                                                    arrCuponesRemitoSelected[arrCuponesRemitoSelectedFilter[0].index].idCupon.push(columnas[1]);
                                                } else {
                                                    objRemitosCuponesSelected.idCupon.push(columnas[1]);
                                                    if (!utilities.isEmpty(arrCuponesRemitoSelected) && arrCuponesRemitoSelected.length > 0) {
                                                        objRemitosCuponesSelected.index = arrCuponesRemitoSelected.length;
                                                    }
                                                    arrCuponesRemitoSelected.push(objRemitosCuponesSelected);
                                                }


                                                log.debug('arrCuponesRemitoSelected', JSON.stringify(arrCuponesRemitoSelected));*/

                                            } else {
                                                //Error Obteniendo ID Interno de la Liquidacion a procesar
                                                respuesta.error = true;
                                                respuesta.mensaje = "No se pudo Obtener el ID Interno de los Cupones a procesar";
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

                            }

                            /*var arrRemitoError = new Array();

                            for(var j = 0; j< arrCuponesRemitoSelected.length; j++){
                                
                                var objRemitoError = new Object();

                                var remitoSel = arrCuponesRemitoSelected[j].idRemito;

                                
                                
                                var arrRemitosFilter = arrCuponesRemito.filter(function(o){
                                    return o.idRemito == remitoSel;
                                });

                                if(arrRemitosFilter.length > 0 && !utilities.isEmpty(arrRemitosFilter)){

                                    objRemitoError.remito = remitoSel;
                                    objRemitoError.cupones = new Array();
                                    if(arrRemitosFilter[0].idCupon.length != arrCuponesRemitoSelected[j].idCupon.length){

                                        for(var k = 0; k < arrCuponesRemitoSelected[j].idCupon.length; k++){

                                            var arrCuponesFilter = arrRemitosFilter[0].idCupon.filter(function(obj){
                                                return obj != arrCuponesRemitoSelected[j].idCupon[k];
                                            });

                                            objRemitoError.cupones.push(arrCuponesFilter);

                                        }

                                        arrRemitoError.push(objRemitoError);
                                        
                                    }
                                }
                            }

                            if(!utilities.isEmpty(arrRemitoError) && arrRemitoError.length > 0){

                                respuesta.error = true;
                                var mensajeErrorRemito = "";
                                for(var l = 0; l < arrRemitoError.length; l++){

                                    if(l==0){
                                        mensajeErrorRemito += "Remito: "+arrRemitoError[l].remito.toString()+ " Cupones: "+  arrRemitoError[l].cupones.toString();
                                    }else{
                                        mensajeErrorRemito += "/Remito: "+arrRemitoError[l].remito.toString()+ " Cupones: "+  arrRemitoError[l].cupones.toString();
                                    }
                                }
                                respuesta.mensaje = "Error al encontrar cupones no seleccionados dentro de remito seleccionados. Faltaron seleccionar los siguientes cupones: "+ mensajeErrorRemito;
                            }*/

                        } else {
                            respuesta.error = true;
                            respuesta.mensaje = "No se pudo obtener registros de la sublista de Cupones a procesar";
                        }
                    }

                    if (respuesta.error == false && existenCuponesSeleccionados == false) {
                        respuesta.error = true;
                        respuesta.mensaje = "No se selecciono ningun Cupon para procesar";
                    }

                    if (respuesta.error == false) {

                        // INCIO - Invocar Script de Facturacion

                        parametros = new Object();
                        parametros.custscript_3k_cupon_id = idCuponesProcesar.toString();
                        parametros.custscript_3k_numero_despacho = numero_despacho.toString();

                        log.debug('Generacion Envio Logistico', 'Generacion Envio Logistico - ID Cupones A Procesar : ' + parametros.custscript_3k_cupon_id);

                        log.debug('Generacion Envio Logistico', 'Generacion Envio Logistico - INICIO llamada Script MAP/REDUCE');

                        respuesta = createAndSubmitMapReduceJob('customscript_3k_marcar_cupon_map', parametros);

                        var mensajeEstado = "";
                        if (!utilities.isEmpty(respuesta) && !utilities.isEmpty(respuesta.estado)) {
                            mensajeEstado = respuesta.estado.status;
                        }

                        log.debug('Generacion Envio Logistico', 'Generacion Envio Logistico - /REDUCE - Estado : ' + mensajeEstado);

                        // FIN - Invicar Script de Facturacion

                    }
                } else {
                    respuesta.error = true;
                    respuesta.mensaje = "No se pudo obtener sublista de Cupones a procesar";
                }

            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Cupones A Procesar - Excepcion : " + excepcion.message;

                log.error('Generacion Envio Logistico', 'Consulta Cupones A Procesar - Excepcion Consultando Cupones A Procesar - Excepcion : ' + excepcion.message);
            }
            log.audit('Generacion Envio Logistico', 'FIN Consulta Cupones A Procesar');
            return respuesta;
        }

        function cargarCupones(sublistCupones, request) {
            log.audit('Generacion Envio Logistico', 'INICIO Consulta Cupones');
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";

            try {

                var separadorMultiSelect = /\u0005/;

                var cuponesPendientes = search.load({
                    id: 'customsearch_3k_marcar_cupon'
                });

                if (!utilities.isEmpty(request.parameters.destino)) {
                    var destinosSeleccionados = request.parameters.destino.split(separadorMultiSelect);
                    if (!utilities.isEmpty(destinosSeleccionados) && destinosSeleccionados.length > 0) {
                        var filtroDestino = search.createFilter({
                            name: 'custrecord_3k_cupon_lugar_retiro',
                            operator: search.Operator.ANYOF,
                            values: destinosSeleccionados
                        });

                        cuponesPendientes.filters.push(filtroDestino);

                    }
                }

                /*if (!utilities.isEmpty(request.parameters.empresa)) {
                    var empresasSeleccionadas = request.parameters.empresa.split(separadorMultiSelect);
                    if (!utilities.isEmpty(empresasSeleccionadas) && empresasSeleccionadas.length > 0) {
                        var filtroEmpresa = search.createFilter({
                            name: 'custrecord_3k_cupon_empresa',
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

                }*/

                // INICIO - Consulta Cupones Pendientes

                var resultSet = cuponesPendientes.run();

                var completeResultSetCupones = null;

                log.debug('Generacion Envio Logistico', 'INICIO Consulta Busqueda Cupones Pendientes');

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

                log.debug('Generacion Envio Logistico', 'FIN Consulta Busqueda Cupones Pendientes');

                if (!utilities.isEmpty(completeResultSetCupones)) {
                    log.debug('Generacion Facturacion Servicios REST', 'FIN Consulta Busqueda Liquidaciones Pendientes - Cantidad Registros Encontrados : ' + completeResultSetCupones.length);

                    for (var i = 0; !utilities.isEmpty(completeResultSetCupones) && completeResultSetCupones.length > 0 && i < completeResultSetCupones.length; i++) {

                        var idInterno = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[0]
                        });

                        var alias = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[1]
                        });

                        var sku = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[2]
                        });

                        var descripcion = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[3]
                        });

                        var skuProveedor = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[4]
                        });

                        var ordenMisbe = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[5]
                        });

                        var idRemito = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[6]
                        });

                        /*var sitio = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[5]
                        });

                        var idLiquidacion = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[7]
                        });*/

                        /*sublistCupones.setSublistValue({
                            id: 'numero',
                            line: i,
                            value: idLiquidacion
                        });*/


                        sublistCupones.setSublistValue({
                            id: 'alias',
                            line: i,
                            value: alias
                        });

                        if (!utilities.isEmpty(sku)) {
                            sublistCupones.setSublistValue({
                                id: 'sku',
                                line: i,
                                value: sku
                            });
                        }

                        if (!utilities.isEmpty(descripcion)) {
                            sublistCupones.setSublistValue({
                                id: 'descripcion',
                                line: i,
                                value: descripcion
                            });
                        }

                        if (!utilities.isEmpty(skuProveedor)) {
                            sublistCupones.setSublistValue({
                                id: 'skuproveedor',
                                line: i,
                                value: skuProveedor
                            });
                        }
                        /*if(!utilities.isEmpty(sitio)){

                            sublistCupones.setSublistValue({
                                id: 'sitio',
                                line: i,
                                value: sitio
                            });

                        }*/

                        sublistCupones.setSublistValue({
                            id: 'idinternos',
                            line: i,
                            value: idInterno.toString()
                        });

                        if (!utilities.isEmpty(ordenMisbe)) {
                            sublistCupones.setSublistValue({
                                id: 'ordenmisbe',
                                line: i,
                                value: ordenMisbe.toString()
                            });
                        }

                        sublistCupones.setSublistValue({
                            id: 'remito',
                            line: i,
                            value: idRemito
                        });

                    } //for
                } //if

                // FIN - Consulta Liquidaciones Pendientes

                if (utilities.isEmpty(completeResultSetCupones)) {
                    respuesta.error = true;
                    respuesta.mensaje = "No se encontraron Cupones Pendientes";
                    log.audit('Generacion Envio Logistico', 'FIN Consulta Busqueda Cupones Pendientes - No se encontraron Cupones Pendientes');
                }

            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Cupones - Excepcion : " + excepcion.message;
                log.error('Generacion Envio Logistico', 'Consulta Busqueda Cupones Pendientes - Excepcion Consultando Cupones - Excepcion : ' + excepcion.message);
            }

            log.audit('Generacion Envio Logistico', 'FIN Consulta Cupones Pendientes');
            return respuesta;
        }

        function createAndSubmitMapReduceJob(idScript, parametros) {
            log.audit('Generacion Envio Logistico', 'INICIO Invocacion Script MAP/REDUCE');
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
                log.error('Generacion Envio Logistico', 'Generacion Envio Logistico - Excepcion Invocando A Script MAP/REDUCE - Excepcion : ' + excepcion.message);
            }
            log.audit('Generacion Envio Logistico', 'FIN Invocacion Script MAP/REDUCE');
            return respuesta;
        }

        return {
            onRequest: onRequest
        };

    });
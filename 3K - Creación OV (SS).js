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

define(['N/error', 'N/record', 'N/search', 'N/runtime', '3K/utilities', 'N/format', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */

    function (error, record, search, runtime, utilities, format, funcionalidades) {

        Array.prototype.diff = function( arr ) {
            return this.filter( function( val ) {
              return (arr.internalid != val.internalid || utilities.isEmpty(arr.internalid));
            });
        };

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {
            var error = false;
            var codigoError = '';
            var mensajeError = '';

            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.message = "";
            objRespuesta.detalle = new Array();

            if (scriptContext.type == 'create') {

                try {
                    log.audit('Creación OV (SS)', 'INICIO - beforeSubmit');
                    log.debug('Creación OV (SS) - beforeSubmit', ' Tipo : Servidor - Evento : ' + scriptContext.type);


                    /******************************* INICIO  DE TRANSFORMAR FECHA EN FORMATO DE URU Y FORMATO NETSUITE****************************************************/
                    var fechaServidor = new Date();
                    var fechaString = format.format({
                        value: fechaServidor,
                        type: format.Type.DATETIME,
                        timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                    });
                    var fecha = format.parse({
                        value: fechaString,
                        type: format.Type.DATE
                    });
                    /******************************* FIN DE TRANSFORMAR FECHA EN FORMATO DE URU Y FORMATO NETSUITE****************************************************/

                    var objRecord = scriptContext.newRecord;
                    var arrayArticulos = [];
                    var arrayItems = [];

                    var id = objRecord.id;

                    var ubicacion = objRecord.getValue({
                        fieldId: 'location'
                    });

                    var sitio = objRecord.getValue({
                        fieldId: 'custbody_cseg_3k_sitio_web_o'
                    });

                    var logNS = objRecord.getValue({
                        fieldId: 'custbody_3k_netsuite_ov'
                    });

                    var moneda = objRecord.getValue({
                        fieldId: 'currency'
                    });

                    log.debug('Creación OV (SS) - beforeSubmit', ' id: ' + id + ', ubicacion: ' + ubicacion + ', sitio: ' + sitio + ', logNS: ' + logNS + ', moneda: ' + moneda);

                    //Consultar Item Programa Fidelidad
                    var filtrosMoneda = new Array();

                    var filtroMon = new Object();
                    filtroMon.name = 'custrecord_3k_conf_prog_fidelidad_moneda';
                    filtroMon.operator = 'IS';
                    filtroMon.values = moneda;
                    filtrosMoneda.push(filtroMon);

                    var searchConfigProg = utilities.searchSavedPro('customsearch_3k_conf_prog_fidelidad', filtrosMoneda);

                    if (!utilities.isEmpty(searchConfigProg) && searchConfigProg.error == false) {
                        if (!utilities.isEmpty(searchConfigProg.objRsponseFunction.result) && searchConfigProg.objRsponseFunction.result.length > 0) {

                            var resultSet = searchConfigProg.objRsponseFunction.result;
                            var resultSearch = searchConfigProg.objRsponseFunction.search;

                            var idItemMilla = '';

                            for (var i = 0; !utilities.isEmpty(resultSet) && i < resultSet.length; i++) {
                                idItemMilla = resultSet[i].getValue({
                                    name: resultSearch.columns[0]
                                });
                            }
                        } else {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'UCOV019';
                            respuestaParcial.mensaje = 'Error Consultando Configuracion Programa Fidelidad.';
                            respuesta.detalle.push(respuestaParcial);
                        }
                    } else {
                        if (utilities.isEmpty(searchRequisiciones)) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'UCOV019';
                            respuestaParcial.mensaje = 'Error Consultando Configuracion Programa Fidelidad.';
                            respuesta.detalle.push(respuestaParcial);
                        } else {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'UCOV019';
                            respuestaParcial.mensaje = 'Error Consultando Configuracion Programa Fidelidad - Tipo Error : ' + searchConfigProg.tipoError + ' - Descripcion : ' + searchConfigProg.descripcion;
                            respuesta.detalle.push(respuestaParcial);
                        }
                    }

                    //Consultar Configuracion Liquidaciones - TASA ARTICULO LIQUIDACION

                    var searchConfigLiq = utilities.searchSaved('customsearch_3k_config_liquidaciones');

                    if (!utilities.isEmpty(searchConfigLiq) && searchConfigLiq.error == false) {
                        if (!utilities.isEmpty(searchConfigLiq.objRsponseFunction.result) && searchConfigLiq.objRsponseFunction.result.length > 0) {

                            var resultSet = searchConfigLiq.objRsponseFunction.result;
                            var resultSearch = searchConfigLiq.objRsponseFunction.search;

                            var tasaArticuloLiq = '';

                            for (var i = 0; !utilities.isEmpty(resultSet) && i < resultSet.length; i++) {
                                tasaArticuloLiq = resultSet[i].getValue({
                                    name: resultSearch.columns[15]
                                });
                            }

                            if (!utilities.isEmpty(tasaArticuloLiq)) {
                                tasaArticuloLiq = (parseFloat(tasaArticuloLiq, 10));
                            }

                        } else {
                            objRespuesta.error = true;
                            objRespuestaParcial = new Object();
                            objRespuestaParcial.codigo = 'UCOV020';
                            objRespuestaParcial.mensaje = 'Error Consultando Configuracion Liquidaciones.';
                            objRespuesta.detalle.push(objRespuestaParcial);
                        }
                    } else {
                        if (utilities.isEmpty(searchConfigLiq)) {
                            objRespuesta.error = true;
                            objRespuestaParcial = new Object();
                            objRespuestaParcial.codigo = 'UCOV020';
                            objRespuestaParcial.mensaje = 'Error Consultando Configuracion Liquidaciones.';
                            objRespuesta.detalle.push(objRespuestaParcial);
                        } else {
                            objRespuesta.error = true;
                            objRespuestaParcial = new Object();
                            objRespuestaParcial.codigo = 'UCOV020';
                            objRespuestaParcial.mensaje = 'Error Consultando Configuracion Liquidaciones - Tipo Error : ' + searchConfigProg.tipoError + ' - Descripcion : ' + searchConfigProg.descripcion;
                            objRespuesta.detalle.push(objRespuestaParcial);
                        }
                    }

                    /************************************INICIO SE CREA ARREGLO DE ARTICULOS DE LA ORDEN DE VENTA PARA LUEGO PASARLO A SS************************************************************/

                    var numLines = objRecord.getLineCount({
                        sublistId: 'item'
                    });

                    log.debug('Creación OV (SS) - beforeSubmit', 'numLines: ' + numLines);

                    var travelOV = false;

                    var sumCantidadMillas = 0;
                    var sumUnitarioMillas = 0;
                    var sumTotalMillas = 0;

                    for (var i = 0; !utilities.isEmpty(numLines) && i < numLines; i++) {
                        var objJSON = new Object({});

                        objJSON.articulo = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });

                        objJSON.articuloDes = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item_display',
                            line: i
                        });


                        objJSON.importe = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: i
                        });

                        objJSON.cantidad = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        });

                        var isTravel = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_travel',
                            line: i
                        });

                        if (isTravel == true) {
                            travelOV = true;
                        }

                        var comisionServicio = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_comision',
                            line: i
                        });

                        var amount = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: i
                        });

                        var millasImpTotal = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_imp_tot_millas',
                            line: i
                        });

                        log.debug('Creación OV (SS) - beforeSubmit', 'comisionServicio: ' + comisionServicio + ', amount: ' + amount + ', tasaArticuloLiq: ' + tasaArticuloLiq + ', millasImpTotal: ' + millasImpTotal);

                        if (!utilities.isEmpty(comisionServicio) && comisionServicio > 0 && !utilities.isEmpty(tasaArticuloLiq) && tasaArticuloLiq > 0) {
                            var impFacturar = parseFloat((amount * ((parseFloat(comisionServicio, 10)) / 100)) * (((parseFloat(tasaArticuloLiq, 10)) / 100) + 1), 10).toFixed(2);
                            var deudaPagar = parseFloat((amount - (parseFloat(impFacturar, 10))), 10).toFixed(2);

                            log.debug('Creación OV (SS) - beforeSubmit', 'impFacturar: ' + impFacturar + ', deudaPagar: ' + deudaPagar);

                            objRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_importe_fact_liq',
                                line: i,
                                value: impFacturar
                            });

                            objRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_deuda_pagar',
                                line: i,
                                value: deudaPagar
                            });

                            impFacturarMillas = parseFloat((millasImpTotal * ((parseFloat(comisionServicio, 10)) / 100)) * (((parseFloat(tasaArticuloLiq, 10)) / 100) + 1), 10).toFixed(2);
                            deudaPagarMillas = parseFloat((millasImpTotal - (parseFloat(impFacturarMillas, 10))), 10).toFixed(2);

                            log.debug('Creación OV (SS) - beforeSubmit', 'impFacturarMillas: ' + impFacturarMillas + ', deudaPagarMillas: ' + deudaPagarMillas);

                            objRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_importe_fact_liq_millas',
                                line: i,
                                value: impFacturarMillas
                            });

                            objRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_deuda_pagar_millas',
                                line: i,
                                value: deudaPagarMillas
                            });
                        }

                        var millasCantidad = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_millas_utilizadas',
                            line: i
                        });

                        if (!utilities.isEmpty(millasCantidad) && millasCantidad > 0) {
                            sumCantidadMillas = parseFloat(sumCantidadMillas, 0) + parseFloat(millasCantidad, 0);
                        }

                        var millasImpUnitario = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_importe_unitario_millas',
                            line: i
                        });

                        /*if (!utilities.isEmpty(millasImpUnitario) && millasImpUnitario > 0) {
                            sumUnitarioMillas = parseFloat(sumUnitarioMillas, 0) + parseFloat(millasImpUnitario, 0);
                        }*/

                        if (utilities.isEmpty(sumUnitarioMillas) || sumUnitarioMillas == 0) {
                            sumUnitarioMillas = parseFloat(millasImpUnitario, 0);
                        }

                        var millasImpTotal = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_imp_tot_millas',
                            line: i
                        });

                        if (!utilities.isEmpty(millasImpTotal) && millasImpTotal > 0) {
                            sumTotalMillas = parseFloat(sumTotalMillas, 0) + parseFloat(millasImpTotal, 0);
                        }

                        arrayArticulos.push(objJSON.articulo);
                        arrayItems.push(objJSON);
                    }

                    log.debug('Creación OV (SS) - beforeSubmit', 'arrayArticulos: ' + JSON.stringify(arrayArticulos));
                    log.debug('Creación OV (SS) - beforeSubmit', 'arrayItems: ' + JSON.stringify(arrayItems));

                    var arraySearchParams = new Array();
                    var objParam = new Object();
                    objParam.name = 'internalid';
                    objParam.operator = 'ANYOF';
                    objParam.values = arrayArticulos;
                    arraySearchParams.push(objParam);

                    var objResultSet = utilities.searchSavedPro('customsearch_3k_componentes_art', arraySearchParams);
                    if (objResultSet.error) {
                        mensajeError = objResultSet.descripcion.toString();
                    }

                    var articulo = objResultSet.objRsponseFunction.array; //array que contiene los articulos que vienen en la orden de venta
                    log.debug('Creación OV (SS) - beforeSubmit', 'articulo array: ' + JSON.stringify(articulo));
                    log.debug('Creación OV (SS) - beforeSubmit', 'articulo.length: ' + articulo.length);

                    /************************************FIN SE CREA ARREGLO DE ARTICULOS DE LA ORDEN DE VENTA PARA LUEGO PASARLO A SS************************************************************/

                    /************************************ INICIO - AGREGAR LINEA DE MILLAS ************************************/

                    log.debug('Creación OV (SS) - beforeSubmit', 'idItemMilla: ' + idItemMilla + ', sumCantidadMillas: ' + sumCantidadMillas + ', sumUnitarioMillas: ' + sumUnitarioMillas + ', sumTotalMillas: ' + sumTotalMillas);

                    //Verificar que esté completa la informacion de Millas para agregar la línea
                    if (!utilities.isEmpty(idItemMilla) && !utilities.isEmpty(sumCantidadMillas) && sumCantidadMillas > 0 && !utilities.isEmpty(sumUnitarioMillas) && sumUnitarioMillas > 0 && !utilities.isEmpty(sumTotalMillas) && sumTotalMillas > 0) {

                        var lineNum = 0;
                        cantidadItem = objRecord.getLineCount({ sublistId: 'item' });
                        if (cantidadItem == 0) {
                            lineNum = 0
                        } else {
                            lineNum = parseInt(cantidadItem);
                        }
                        objRecord.setSublistValue({ sublistId: 'item', fieldId: 'item', line: lineNum, value: idItemMilla });
                        objRecord.setSublistValue({ sublistId: 'item', fieldId: 'quantity', line: lineNum, value: sumCantidadMillas });
                        objRecord.setSublistValue({ sublistId: 'item', fieldId: 'rate', line: lineNum, value: sumUnitarioMillas });
                        objRecord.setSublistValue({ sublistId: 'item', fieldId: 'amount', line: lineNum, value: sumTotalMillas });
                    }

                    /************************************ FIN - AGREGAR LINEA DE MILLAS ************************************/

                    /***************************INICIO SE CREA ARREGLO DE COMPONENTES PARA LUEGO PASARLO A SS DE BUSQUEDA DE STOCK TERCEROS Y STOCK PROPIO************************************************************/

                    var arrayComponentes = new Array();

                    for (var j = 0; j < articulo.length; j++) {
                        arrayComponentes.push(articulo[j]["ID Articulo Componente"]);
                    }

                    log.debug('Creación OV (SS) - beforeSubmit', 'arrayComponentes: ' + JSON.stringify(arrayComponentes));

                    var arraySearchParams = new Array();
                    var objParam = new Object();
                    objParam.name = 'custrecord_3k_stock_terc_articulo';
                    objParam.operator = 'ANYOF';
                    objParam.values = arrayComponentes;
                    arraySearchParams.push(objParam);

                    var objParam1 = new Object();
                    objParam1.name = 'custrecord_3k_stock_terc_sitio';
                    objParam1.operator = 'ANYOF';
                    objParam1.values = [sitio];
                    arraySearchParams.push(objParam1)

                    var objResultSet = utilities.searchSavedPro('customsearch_3k_stock_terceros', arraySearchParams);

                    if (objResultSet.error) {
                        mensajeError = mensajeError + ' ' + objResultSet.descripcion.toString();
                    }

                    var stockTerceros = objResultSet.objRsponseFunction.array;

                    log.debug('Creación OV (SS) - beforeSubmit', 'stockTerceros: ' + JSON.stringify(stockTerceros));

                    var arraySearchParams = new Array();
                    var objParam = new Object();
                    objParam.name = 'internalid';
                    objParam.operator = 'ANYOF';
                    objParam.values = arrayComponentes;
                    arraySearchParams.push(objParam);

                    var objParam1 = new Object();
                    objParam1.name = 'inventorylocation';
                    objParam1.operator = 'IS';
                    objParam1.values = [ubicacion];
                    arraySearchParams.push(objParam1)

                    var objResultSet = utilities.searchSavedPro('customsearch_3k_articulo_disponible', arraySearchParams);

                    if (objResultSet.error) {
                        mensajeError = mensajeError + ' ' + objResultSet.descripcion.toString();
                    }

                    var stockComponentes = objResultSet.objRsponseFunction.array;

                    if ((utilities.isEmpty(stockComponentes) && stockComponentes.length == 0) || stockComponentes.length < arrayComponentes.length){

                        var diffArray = arrayComponentes.diff(stockComponentes);

                        log.debug('diffArray',JSON.stringify(diffArray))

                        if(!utilities.isEmpty(diffArray) && diffArray.length > 0){

                            var indiceComponent = stockComponentes.length

                            for(var xx = 0; xx < diffArray.length; xx++){

                                var objComponent = new Object();
                                objComponent.indice = indiceComponent;
                                objComponent.internalid = diffArray[xx].internalid;
                                objComponent.inventorylocation = ubicacion;
                                objComponent.locationquantityonhand = 0;
                                objComponent.locationquantityavailable = 0;
                                objComponent.locationquantitycommitted = 0;
                                objComponent.locationquantitybackordered = 0;
                                
                                stockComponentes.push(objComponent);
                                
                                indiceComponent++;
                            }

                            log.debug('stockComponentes',JSON.stringify(stockComponentes))

                        }
                        


                    }

                    log.debug('Creación OV (SS) - beforeSubmit', 'stockComponentes: ' + JSON.stringify(stockComponentes));

                    var arrayLineaPila = new Array();
                    var arrayOV = new Array();

                    for (var i = 0; i < arrayItems.length; i++) {
                        if (!utilities.isEmpty(arrayItems[i].articulo)) {
                            var arrayLinea = new Array();
                            var articuloFilter = articulo.filter(function (obj) {
                                return (obj.internalid == arrayItems[i].articulo);
                            });

                            var diferenciaStock = 0;

                            var objLinea = new Object();
                            objLinea.articulo = arrayItems[i].articulo;

                            objLinea.importe = arrayItems[i].importe;

                            objLinea.cantidad = arrayItems[i].cantidad.toString();

                            objLinea.pila = null;
                            objLinea.isStockPropio = false;
                            objLinea.ubicacion = ubicacion;
                            objLinea.isService = false;
                            objLinea.isChange = false;
                            objLinea.sitio = sitio;

                            log.debug('Creación OV (SS) - beforeSubmit', 'articuloFilter cantidad: ' + articuloFilter.length);
                            if (articuloFilter.length > 0 && !utilities.isEmpty(articuloFilter)) {
                                log.debug('Creación OV (SS) - beforeSubmit', 'articuloFilter[0]["Articulo Principal Tipo Servicio"]: ' + articuloFilter[0]["Articulo Principal Tipo Servicio"]);

                                if (articuloFilter[0]["Articulo Principal Tipo Servicio"] == "N") {
                                    if (i == 0) {
                                        var servicioOV = false;
                                        log.debug('Creación OV (SS) - beforeSubmit', 'OV TIPO PRODUCTO');
                                    }
                                    //informacion.orden[j].articulo = articuloFilter;
                                    var mainCategory = articuloFilter[0]["Main Category"];
                                    log.debug('Creación OV (SS) - beforeSubmit', 'mainCategory: ' + mainCategory + ' articuloFilter array: ' + JSON.stringify(articuloFilter));
                                    objLinea.mainCategory = mainCategory;
                                    for (var j = 0; j < articuloFilter.length; j++) {
                                        var cantidadStock = 0;

                                        objLinea.componente = articuloFilter[j]["ID Articulo Componente"];

                                        if (articuloFilter[j]["Articulo Componente Tipo Servicio"] == "N") {

                                            var componenteFilter = stockComponentes.filter(function (obj) {
                                                return (obj.internalid == articuloFilter[j]["ID Articulo Componente"]);
                                            });
                                            log.debug('Creación OV (SS) - beforeSubmit', 'idComponente: ' + articuloFilter[j]["ID Articulo Componente"]);
                                            log.debug('Creación OV (SS) - beforeSubmit', 'componenteFilter array: ' + JSON.stringify(componenteFilter));

                                            log.debug('Creación OV (SS) - beforeSubmit', 'componenteFilter[0].quantityavailable: ' + componenteFilter[0].locationquantityavailable);
                                            if (componenteFilter[0].locationquantityavailable >= arrayItems[i].cantidad * articuloFilter[j]["Cantidad Componente"]) {
                                                //NO PILA
                                                objLinea.isStockPropio = true;
                                                var lineaFilter = arrayLinea.filter(function (obj) {
                                                    return (obj.articulo == arrayItems[i].articulo);
                                                });

                                                if (utilities.isEmpty(lineaFilter) || lineaFilter.length <= 0) {
                                                    arrayLinea.push(JSON.parse(JSON.stringify(objLinea)));
                                                    arrayOV.push(JSON.parse(JSON.stringify(objLinea)));
                                                }
                                                objLinea.cantidad = (arrayItems[i].cantidad * articuloFilter[j]["Cantidad Componente"]).toString();
                                                objLinea.cantidadComponente = articuloFilter[j]["Cantidad Componente"];
                                                cantidadStock = stockComponentes[componenteFilter[0].indice].locationquantityavailable - (arrayItems[i].cantidad * articuloFilter[j]["Cantidad Componente"]);
                                                stockComponentes[componenteFilter[0].indice].locationquantityavailable = cantidadStock;
                                                log.debug('Creación OV (SS) - beforeSubmit', 'STOCK PROPIO - NO GENERA REQUISICION');
                                            } else {
                                                //PILA
                                                if (componenteFilter[0].locationquantityavailable > 0) {
                                                    log.debug('Creación OV (SS) - beforeSubmit', 'STOCK PROPIO - NO GENERA REQUISICION');
                                                } else {
                                                    log.debug('Creación OV (SS) - beforeSubmit', 'STOCK TERCERO - SI GENERA REQUISICION');
                                                    diferenciaStock = (arrayItems[i].cantidad * articuloFilter[j]["Cantidad Componente"]) - componenteFilter[0].locationquantityavailable;
                                                    var indice = 0;
                                                    var stockFilter = stockTerceros.filter(function (obj) {
                                                        return (obj["ID interno"] == articuloFilter[j]["ID Articulo Componente"]);
                                                    });
                                                    log.debug('Creación OV (SS) - beforeSubmit', 'stockFilter: ' + JSON.stringify(stockFilter));
                                                    do {
                                                        if (!utilities.isEmpty(stockFilter) && stockFilter.length > 0) {
                                                            var insertarPila = true;
                                                            if (stockFilter[indice]["Stock Disponible"] >= diferenciaStock) {
                                                                objLinea.cantidad = diferenciaStock;
                                                                //cantidadStock = diferenciaStock;
                                                                stockTerceros[stockFilter[indice].indice]["Stock Disponible"] = stockTerceros[stockFilter[indice].indice]["Stock Disponible"] - diferenciaStock;
                                                                diferenciaStock = 0;
                                                            } else {
                                                                if (stockFilter[indice]["Stock Disponible"] > 0) {
                                                                    log.error('Creación OV (SS) - beforeSubmit', 'No se pudo crear Orden de Venta por stock insuficiente para el articulo: ' + articuloFilter[j].internalid);
                                                                } else {
                                                                    insertarPila = false;
                                                                }
                                                            }
                                                            if (insertarPila) {
                                                                log.debug('Creación OV (SS) - beforeSubmit', 'insertarPila');
                                                                objLinea.isStockPropio = false;
                                                                objLinea.pila = stockFilter[indice].internalid;
                                                                var lineaFilter = arrayLinea.filter(function (obj) {
                                                                    return (obj.articulo == arrayItems[i].articulo);
                                                                });
                                                                objLinea.cantidad = arrayItems[i].cantidad.toString();
                                                                if (utilities.isEmpty(lineaFilter) || lineaFilter.length <= 0) {
                                                                    //objLinea.pilas = pilas;
                                                                    arrayLinea.push(JSON.parse(JSON.stringify(objLinea)));
                                                                    arrayOV.push(JSON.parse(JSON.stringify(objLinea)));
                                                                }
                                                                objLinea.cantidad = arrayItems[i].cantidad * articuloFilter[j]["Cantidad Componente"];
                                                                objLinea.cantidadComponente = articuloFilter[j]["Cantidad Componente"];
                                                                arrayLineaPila.push(JSON.parse(JSON.stringify(objLinea)));
                                                                log.debug('Creación OV (SS) - beforeSubmit', 'Stock Propio insuficiente para el articulo: ' + articuloFilter[j].internalid + ', cantidadDisponible Stock Tercero: ' + stockFilter[indice]["Stock Disponible"]);
                                                            }
                                                            indice++;
                                                        }
                                                    } while (diferenciaStock > 0 && stockFilter.length > indice && !utilities.isEmpty(stockFilter) && !insertarPila)
                                                    if (diferenciaStock > 0) {
                                                        error = true;
                                                        objRespuesta.error = true;
                                                        objRespuestaParcial = new Object();
                                                        objRespuestaParcial.codigo = 'UCOV001';
                                                        objRespuestaParcial.mensaje = 'Item ' + arrayItems[i].articuloDes + ' no posee Stock Propio ni Stock Tercero Vigente, por lo cual no genera Requisición de Compra.';
                                                        mensajeError = mensajeError + ' ' + objRespuestaParcial.mensaje.toString();
                                                        objRespuesta.detalle.push(objRespuestaParcial);
                                                        log.error('Creación OV (SS) - beforeSubmit', 'UCOV001 - Item ' + arrayItems[i].articuloDes + ' no posee Stock Propio ni Stock Tercero Vigente, por lo cual no genera Requisición de Compra.');
                                                    }
                                                } // end else pila
                                            } // end else cantidad stock propio < requerido -> posible pila 
                                        } else {
                                            if (articuloFilter[j]["Articulo Componente Tipo Servicio"] == "S") {
                                                objLinea.isStockPropio = true;
                                                objLinea.componente = articuloFilter[j]["ID Articulo Componente"];
                                                objLinea.cantidad = (arrayItems[i].cantidad * articuloFilter[j]["Cantidad Componente"]).toString();
                                                objLinea.cantidadComponente = articuloFilter[j]["Cantidad Componente"];
                                            } else {
                                                objRespuesta.error = true;
                                                objRespuestaParcial = new Object();
                                                objRespuestaParcial.codigo = 'UCOV002';
                                                objRespuestaParcial.mensaje += 'Tipo de Articulo desconocido: ' + articuloFilter[j]["Articulo Componente Tipo Servicio"] + ' en el articulo: ' + articuloFilter[j].internalid + ' en el articulo componente: ' + articuloFilter[j]["ID Articulo Componente"];
                                                objRespuesta.detalle.push(objRespuestaParcial);
                                                log.error('Creación OV (SS) - beforeSubmit', 'UCOV002 - Tipo de Articulo desconocido: ' + articuloFilter[j]["Articulo Componente Tipo Servicio"] + ' en el articulo: ' + articuloFilter[j].internalid + ' en el articulo componente: ' + articuloFilter[j]["ID Articulo Componente"]);
                                            }
                                        }
                                    } //end for
                                } else {
                                    if (articuloFilter[0]["Articulo Principal Tipo Servicio"] == "S") {

                                        if (i == 0) {
                                            var servicioOV = true;
                                            log.debug('Creación OV (SS) - beforeSubmit', 'OV TIPO SERVICIO');
                                        }

                                        objLinea.isStockPropio = true;
                                        objLinea.isService = true;
                                        objLinea.componente = articuloFilter[0]["ID Articulo Componente"];
                                        objLinea.cantidad = arrayItems[i].cantidad.toString();

                                        var lineaFilter = arrayLinea.filter(function (obj) {
                                            return (obj.articulo == arrayItems[i].articulo);
                                        });
                                        if (utilities.isEmpty(lineaFilter) || lineaFilter.length <= 0) {
                                            arrayLinea.push(JSON.parse(JSON.stringify(objLinea)));
                                            arrayOV.push(JSON.parse(JSON.stringify(objLinea)));
                                        }

                                        objLinea.cantidadComponente = articuloFilter[0]["Cantidad Componente"];

                                    } else {
                                        objRespuesta.error = true;
                                        objRespuestaParcial = new Object();
                                        objRespuestaParcial.codigo = 'UCOV002';
                                        objRespuestaParcial.mensaje = 'Tipo de Articulo desconocido: ' + articuloFilter[0]["Articulo Principal Tipo Servicio"] + ' en el articulo: ' + articuloFilter[0].internalid;
                                        objRespuesta.detalle.push(objRespuestaParcial);
                                        log.error('Creación OV (SS) - beforeSubmit', 'UCOV002 - Tipo de Articulo desconocido: ' + articuloFilter[0]["Articulo Principal Tipo Servicio"] + ' en el articulo: ' + articuloFilter[0].internalid);
                                    }
                                }

                            }


                        }


                        for (var m = 0; m < arrayLinea.length; m++) {
                            //NUEVA LINEA
                            var lineNum = i;

                            //SE SETEAN SI EL ITEM TENE O NO STOCK PROPIO
                            objRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_stock_propio',
                                line: lineNum,
                                value: arrayLinea[m].isStockPropio
                            });

                        }

                    }
                    log.debug('Creación OV (SS) - beforeSubmit', 'servicioOV: ' + servicioOV + ', travelOV: ' + travelOV);

                    objRecord.setValue({
                        fieldId: 'custbody_3k_ov_servicio',
                        value: servicioOV
                    });

                    objRecord.setValue({
                        fieldId: 'custbody_3k_ov_travel',
                        value: travelOV
                    });

                    log.debug('Creación OV (SS) - beforeSubmit', 'arrayLinea lineas OV: ' + JSON.stringify(arrayLinea));
                    log.debug('Creación OV (SS) - beforeSubmit', 'arrayLineaPila lineas requi: ' + JSON.stringify(arrayLineaPila));

                    var crearRequisiciones = creacionRequisiciones(objRecord, arrayLineaPila, fecha);

                } catch (excepcion) {
                    error = true;
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'UCOV003';
                    objRespuestaParcial.mensaje = excepcion;
                    objRespuesta.detalle.push(objRespuestaParcial);
                    //codigoError = 'SBOV005';
                    log.error('Creación OV (SS) - beforeSubmit', 'UCOV003 - Excepcion Grabando Orden de Venta - Excepcion : ' + excepcion.message);

                }

                log.debug('Creación OV (SS) - beforeSubmit', 'error: ' + error + ' - mensajeError: ' + mensajeError);

                if (error == true) {
                    // SI HUBO ALGUN ERROR, GENERAR LA OV CON ESTADO "APROBACION PENDIENTE" Y SETEAR LOG 
                    objRecord.setValue({
                        fieldId: 'orderstatus',
                        value: 'A'
                    });

                    objRecord.setValue({
                        fieldId: 'custbody_3k_netsuite_ov',
                        value: mensajeError
                    });

                    log.debug('Creación OV (SS) - beforeSubmit', 'objRespuesta: ' + JSON.stringify(objRespuesta));
                    log.error('Creación OV (SS) - beforeSubmit', 'OV Creada en Estado APROBACION PENDIENTE');
                } else {

                    objRecord.setValue({
                        fieldId: 'custbody_3k_netsuite_ov',
                        value: ''
                    });

                }

                log.audit('Creación OV (SS)', 'FIN - beforeSubmit');

            }
        }


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
            respuesta.idOV = '';
            respuesta.ordenes = new Array();
            respuesta.error = false;
            respuesta.detalle = new Array();

            var arrayInformacionOV = new Array();
            var arrayArticulos = new Array();
            var arrayFechasProv = new Array();

            if (scriptContext.type == 'create') {

                try {
                    log.audit('Creación OV (SS)', 'INICIO - afterSubmit');
                    log.audit('Creación OV (SS) - afterSubmit', 'Tipo : Servidor - Evento : ' + scriptContext.type);

                    var recId = scriptContext.newRecord.id;
                    var recType = scriptContext.newRecord.type;
                    var currScript = runtime.getCurrentScript();
                
                    var tipoNota = currScript.getParameter('custscript_3k_tipo_nota');

                    var objRecord = record.load({
                        type: recType,
                        id: recId,
                        isDynamic: true,
                    });

                    var idOV = objRecord.id;

                    var dirOV = objRecord.getValue({
                        fieldId: 'billaddress'
                    });

                    var logNS = objRecord.getValue({
                        fieldId: 'custbody_3k_netsuite_ov'
                    });

                    log.debug('Creación OV (SS) - afterSubmit', 'idOV: ' + idOV + ', dirOV: ' + dirOV);
                    //INICIO - Consultar la configuración de información de facturación genérica y setearla en la orden de venta si los datos de facturación vienen vacíos
                    //Si la dirección de facturación viene vacía, consultar en el SS la configuración de dirección de facturación genérica
                    if (utilities.isEmpty(dirOV)) {
                        var searchConfDomicilio = utilities.searchSavedPro('customsearch_3k_conf_dom_fact');
                        log.debug('Creación OV (SS) - afterSubmit', 'searchConfDomicilio: ' + JSON.stringify(searchConfDomicilio));

                        if (!utilities.isEmpty(searchConfDomicilio) && searchConfDomicilio.error == false) {
                            if (!utilities.isEmpty(searchConfDomicilio.objRsponseFunction.result) && searchConfDomicilio.objRsponseFunction.result.length > 0) {

                                var resultSet = searchConfDomicilio.objRsponseFunction.result;
                                var resultSearch = searchConfDomicilio.objRsponseFunction.search;

                                var direccionGenerica = resultSet[0].getValue({
                                    name: resultSearch.columns[1]
                                });

                                var ciudadGenerica = resultSet[0].getValue({
                                    name: resultSearch.columns[2]
                                });

                                log.debug('Creación OV (SS) - afterSubmit', 'direccionGenerica: ' + direccionGenerica + ', ciudadGenerica: ' + ciudadGenerica);

                                var subrecord = objRecord.getSubrecord({
                                    fieldId: 'billingaddress'
                                });

                                subrecord.setValue({
                                    fieldId: 'addr1',
                                    value: direccionGenerica
                                });

                                subrecord.setValue({
                                    fieldId: 'city',
                                    value: ciudadGenerica
                                });
                                //var idTmp = objRecord.save();
                            } else {
                                error = true;
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'UCOV004';
                                respuestaParcial.mensaje = 'Error Consultando Domicilio Generico de Facturacion - Error : No se encontro la Configuracion Generica de Domicilio de Facturacion';
                                mensajeError = mensajeError + ' ' + respuestaParcial.mensaje.toString();
                                respuesta.detalle.push(respuestaParcial);
                                log.error('Creación OV (SS) - afterSubmit', 'UCOV004 - Error Consultando Domicilio Generico de Facturacion - Error : No se encontro la Configuracion Generica de Domicilio de Facturacion');
                            }
                        } else {
                            if (utilities.isEmpty(searchConfDomicilio)) {
                                error = true;
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'UCOV005';
                                respuestaParcial.mensaje = 'Error Consultando Domicilio Generico de Facturacion - Error : No se recibio Respuesta del Proceso de Busqueda del Domicilio Generico de Facturacion';
                                mensajeError = mensajeError + ' ' + respuestaParcial.mensaje.toString();
                                respuesta.detalle.push(respuestaParcial);
                                log.error('Creación OV (SS) - afterSubmit', 'UCOV005 - Error Consultando Domicilio Generico de Facturacion - Error : No se recibio Respuesta del Proceso de Busqueda del Domicilio Generico de Facturacion');
                            } else {
                                error = true;
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'UCOV006';
                                respuestaParcial.mensaje = 'Error Consultando Domicilio Generico de Facturacion - Error : ' + searchConfDomicilio.tipoError + ' - Descripcion : ' + searchConfDomicilio.descripcion;
                                mensajeError = mensajeError + ' ' + respuestaParcial.mensaje.toString();
                                respuesta.detalle.push(respuestaParcial);
                                log.error('Creación OV (SS) - afterSubmit', 'UCOV006 - Consultando Domicilio Generico de Facturacion - Error : ' + searchConfDomicilio.tipoError + ' - Descripcion : ' + searchConfDomicilio.descripcion);
                            }
                        }

                    }

                    //FIN - Consultar la configuración de información de facturación genérica y setearla en la orden de venta si los datos de facturación vienen vacíos

                    //INICIO - Verificar si algun item de la OV es de Fidelidad, para luego marcar la OV como Programa de Fidelidad
                    var numLines = objRecord.getLineCount({
                        sublistId: 'item'
                    });

                    log.debug('Creación OV (SS) - afterSubmit', 'numLines: ' + numLines);

                    var fidelidadOV = false;

                    for (var i = 0; !utilities.isEmpty(numLines) && i < numLines; i++) {
                        var objJSON = new Object({});

                        objJSON.articulo = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });

                        arrayArticulos.push(objJSON);

                        var esFidelidad = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_programa_fidelidad',
                            line: i
                        });

                        if (esFidelidad == true) {
                            fidelidadOV = true;

                            var lineNum = objRecord.selectLine({
                                sublistId: 'item',
                                line: i
                            });

                            var itemImporte = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'grossamt' });
                            log.debug('Creación OV (SS) - beforeSubmit', 'itemImporte: ' + itemImporte);

                            objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_3k_importe_bruto_woow', value: itemImporte });

                            objRecord.commitLine({ sublistId: 'item' });
                        }
                    }

                    var idTmp = objRecord.save();

                    log.debug('Creación OV (SS) - afterSubmit', 'arrayArticulos: ' + JSON.stringify(arrayArticulos));
                    //FIN - Verificar si algun item de la OV es de Fidelidad, para luego marcar la OV como Programa de Fidelidad

                    //INICIO - Cálculo y actualización de la fecha de entrega de proveedor.

                    //INICIO - Obtener Dias Pedidos Proveedores
                    var arrayDiasPedidoProveedor = new Array();

                    var respDiasPedidosProv = obtenerInformacionProveedores();

                    if (!utilities.isEmpty(respDiasPedidosProv) && respDiasPedidosProv.error == false && respDiasPedidosProv.arrayDiasPedidoProveedor.length > 0) {
                        arrayDiasPedidoProveedor = respDiasPedidosProv.arrayDiasPedidoProveedor;
                    } else {
                        if (utilities.isEmpty(respDiasPedidosProv)) {
                            error = true;
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'UCOV007';
                            respuestaParcial.mensaje = 'Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de la Consulta de Dias de Pedidos de Proveedores';
                            log.error('Creación OV (SS) - afterSubmit', 'UCOV007 - Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de la Consulta de Dias de Pedidos de Proveedores');
                            mensajeError = mensajeError + ' ' + respuestaParcial.mensaje.toString();
                            respuesta.detalle.push(respuestaParcial);
                        } else {
                            if (respDiasNoLab.error == true) {
                                error = true;
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'UCOV007';
                                respuestaParcial.mensaje = 'Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - Error : ' + respDiasPedidosProv.tipoError + ' - Descripcion : ' + respDiasPedidosProv.mensaje;
                                log.error('Creación OV (SS) - afterSubmit', 'UCOV007 - Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - Error : ' + respDiasPedidosProv.tipoError + ' - Descripcion : ' + respDiasPedidosProv.mensaje);
                                mensajeError = mensajeError + ' ' + respuestaParcial.mensaje.toString();
                                respuesta.detalle.push(respuestaParcial);
                            } else {
                                error = true;
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'UCOV007';
                                respuestaParcial.mensaje = 'Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de Array con Dias de Pedido de Proveedores';
                                log.error('Creación OV (SS) - afterSubmit', 'UCOV007 - Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de Array con Dias de Pedido de Proveedores');
                                mensajeError = mensajeError + ' ' + respuestaParcial.mensaje.toString();
                                respuesta.detalle.push(respuestaParcial);
                            }
                        }
                        //return respuesta;
                    }
                    // FIN - Obtener Dias Pedidos Proveedores
                    //log.debug('Creación OV (SS) - LINE 362', 'AfterSubmit - arrayDiasPedidoProveedor: ' + JSON.stringify(arrayDiasPedidoProveedor));
                    log.debug('Creación OV (SS) - afterSubmit', 'arrayDiasPedidoProveedor.length: ' + JSON.stringify(arrayDiasPedidoProveedor.length));

                    // INICIO - Obtener Array de Dias No Laborables
                    var respDiasNoLab = consultarDiasNoLoborables();


                    if (!utilities.isEmpty(respDiasNoLab) && respDiasNoLab.error == false && respDiasNoLab.arrayDiasNoLaborables.length > 0) {
                        arrayDiasNoLaborables = respDiasNoLab.arrayDiasNoLaborables;
                    } else {
                        if (utilities.isEmpty(respDiasNoLab)) {
                            error = true;
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'UCOV008';
                            respuestaParcial.mensaje = 'Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de la Consulta de Dias No Laborables';
                            log.error('Creación OV (SS) - afterSubmit', 'UCOV008 - Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de la Consulta de Dias No Laborables');
                            mensajeError = mensajeError + ' ' + respuestaParcial.mensaje.toString();
                            respuesta.detalle.push(respuestaParcial);
                        } else {
                            if (respDiasNoLab.error == true) {
                                error = true;
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'UCOV008';
                                respuestaParcial.mensaje = 'Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - Error : ' + respDiasNoLab.tipoError + ' - Descripcion : ' + respDiasNoLab.mensaje;
                                log.error('Creación OV (SS) - afterSubmit', 'UCOV008 - Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - Error : ' + respDiasNoLab.tipoError + ' - Descripcion : ' + respDiasNoLab.mensaje);
                                mensajeError = mensajeError + ' ' + respuestaParcial.mensaje.toString();
                                respuesta.detalle.push(respuestaParcial);
                            } else {
                                error = true;
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'UCOV008';
                                respuestaParcial.mensaje = 'Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de Array con Dias No Laborables';
                                log.error('Creación OV (SS) - afterSubmit', 'UCOV008 - Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de Array con Dias No Laborables');
                                mensajeError = mensajeError + ' ' + respuestaParcial.mensaje.toString();
                                respuesta.detalle.push(respuestaParcial);
                            }
                        }
                        //return respuesta;
                    }

                    //log.debug('Creación OV (SS) - LINE 396', 'AfterSubmit - arrayDiasNoLaborables: ' + JSON.stringify(arrayDiasNoLaborables));
                    log.debug('Creación OV (SS) - afterSubmit', 'arrayDiasNoLaborables.length: ' + JSON.stringify(arrayDiasNoLaborables.length));
                    //FIN - Cálculo y actualización de la fecha de entrega de proveedor.
                    log.debug('Creación OV (SS) - afterSubmit', 'idOV: ' + idOV)
                    if (!utilities.isEmpty(idOV)) {

                        var objRecord = record.load({
                            type: record.Type.SALES_ORDER,
                            id: idOV,
                            isDynamic: true
                        });

                        var impuestoCostoEnvio = 0.00;
                        var importeTotalWoow = 0.00;

                        impuestoCostoEnvio = objRecord.getValue({
                            fieldId: 'custbody_3k_impuesto_costo_envio'
                        });

                        importeTotalWoow = objRecord.getValue({
                            fieldId: 'custbody_3k_imp_total_woow'
                        });

                        //log.debug('Creación OV (SS) - afterSubmit', 'importeTotalWoow antes del Costo Envio: ' + JSON.stringify(importeTotalWoow) + ', impuestoCostoEnvio: ' + JSON.stringify(impuestoCostoEnvio));
//
                        //if (!utilities.isEmpty(impuestoCostoEnvio) && impuestoCostoEnvio> 0.00) {
                            //importeTotalWoow = parseFloat(importeTotalWoow + impuestoCostoEnvio, 10);
                            //importeTotalWoow = parseFloat(importeTotalWoow, 10).toFixed(2);
                            //log.debug('Creación OV (SS) - afterSubmit', 'importeTotalWoow + impuestoCostoEnvio: ' + JSON.stringify(importeTotalWoow));
                        //}

                        // INICIO GENERAR AJUSTE POR REDONDEO

                        var respuestaAjusteRedondeo = generarAjusteRedondeo(null, objRecord, importeTotalWoow);

                        log.debug('Creación OV (SS) - afterSubmit', 'respuestaAjusteRedondeo: ' + JSON.stringify(respuestaAjusteRedondeo));

                        if (respuestaAjusteRedondeo.error == true) {
                            error = true;
                            mensajeError = mensajeError + ' ' + respuestaAjusteRedondeo.mensajeError;
                            respuesta = respuestaAjusteRedondeo;
                        }
                        // FIN GENERAR AJUSTE POR REDONDEO
                        //log.debug('Creación OV (SS) - afterSubmit - LINE 702', 'objRecord: ' + JSON.stringify(objRecord));
                        if (!utilities.isEmpty(objRecord)) {
                            var cantidadLineasOV = objRecord.getLineCount({
                                sublistId: 'item'
                            });
                            var cantidadLineasREQ = objRecord.getLineCount({
                                sublistId: 'recmachcustrecord_3k_req_compra_ov'
                            });

                            log.audit('Creación OV (SS) - afterSubmit', 'cantidadLineasOV: ' + cantidadLineasOV + ', cantidadLineasREQ: ' + cantidadLineasREQ);

                            if (cantidadLineasOV > 0 && cantidadLineasREQ > 0) {
                                // INICIO ACTUALIZAR REQUISICIONES
                                log.audit('Creación OV (SS) - afterSubmit', 'INICIO Actualizar Requisiciones');

                                var errorREQ = false;

                                for (var i = 0; i < cantidadLineasREQ; i++) {

                                    var lineNum = objRecord.selectLine({
                                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                        line: i
                                    });


                                    var IDInterno = objRecord.getCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                        fieldId: 'internalid'
                                    });

                                    var IDArticulo = objRecord.getCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                        fieldId: 'custrecord_3k_req_compra_articulo_grupo'
                                    });

                                    var IDProveedor = objRecord.getCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                        fieldId: 'custrecord_3k_req_compra_proveedor'
                                    });

                                    var IDPila = objRecord.getCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                        fieldId: 'custrecord_3k_req_compra_pila'
                                    });

                                    var FechaReparto = objRecord.getCurrentSublistValue({
                                        sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                        fieldId: 'custrecord_3k_req_compra_fecha_reparto'
                                    });

                                    var informacionAdicionalOV = new Object();
                                    informacionAdicionalOV.Articulo = IDArticulo;
                                    informacionAdicionalOV.Proveedor = IDProveedor;
                                    informacionAdicionalOV.Pila = IDPila;
                                    informacionAdicionalOV.FechaReparto = FechaReparto;

                                    arrayInformacionOV.push(informacionAdicionalOV);

                                    //INICIO CALCULAR FECHA DE ENTREGA

                                    if (!utilities.isEmpty(arrayInformacionOV) && arrayInformacionOV.length > 0) {
                                        var objDetalleProv = arrayInformacionOV.filter(function (obj) {
                                            return (obj.Articulo == IDArticulo);
                                        });
                                    }

                                    var objFechaEntrega = new Object();
                                    var fechaEntrega = '';

                                    var arrayProveedores = new Array();
                                    var stockPropio = true;

                                    if (!utilities.isEmpty(objDetalleProv) && objDetalleProv.length > 0) {
                                        for (var k = 0; k < objDetalleProv.length; k++) {
                                            var infoProveedor = new Object();
                                            infoProveedor.Proveedor = objDetalleProv[k].Proveedor;
                                            infoProveedor.FechaReparto = objDetalleProv[k].FechaReparto;
                                            arrayProveedores.push(infoProveedor);

                                            if (!utilities.isEmpty(objDetalleProv[k].Pila))
                                                stockPropio = false;
                                        }
                                        log.debug('Creación OV (SS) - afterSubmit', 'objDetalleProv: ' + JSON.stringify(objDetalleProv));
                                        log.debug('Creación OV (SS) - afterSubmit', 'arrayProveedores: ' + JSON.stringify(arrayProveedores));
                                        log.debug('Creación OV (SS) - afterSubmit', 'stockPropio: ' + JSON.stringify(stockPropio));

                                        var objFechaEntrega = calcularFecha(arrayDiasNoLaborables, arrayProveedores, stockPropio, arrayDiasPedidoProveedor);
                                        log.debug('Creación OV (SS) - afterSubmit', 'objFechaEntrega: ' + JSON.stringify(objFechaEntrega));

                                        if (!utilities.isEmpty(objFechaEntrega) && objFechaEntrega.error == false) {
                                            if (!utilities.isEmpty(objFechaEntrega.fechaBaseCalculo)) {
                                                fechaEntrega = objFechaEntrega.fechaBaseCalculo;
                                            } else {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'UCOV009';
                                                respuestaParcial.mensaje = 'No se recibio fecha del proceso de calculo de fecha de entrega para el Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV;
                                                log.error('Creación OV (SS) - afterSubmit', 'UCOV009 - No se recibio fecha del proceso de calculo de fecha de entrega para el Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV);
                                                //mensajeError = respuestaParcial.mensaje.toString();
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                        } else {
                                            if (utilities.isEmpty(objFechaEntrega)) {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'UCOV010';
                                                respuestaParcial.mensaje = 'No se recibio objeto de respuesta del proceso de calculo de fecha de entrega para el Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV;
                                                log.error('Creación OV (SS) - afterSubmit', 'UCOV010 - No se recibio objeto de respuesta del proceso de calculo de fecha de entrega para el Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV);
                                                //mensajeError = respuestaParcial.mensaje.toString();
                                                respuesta.detalle.push(respuestaParcial);
                                            } else {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'UCOV011';
                                                respuestaParcial.mensaje = 'Error calculando fecha de entrega para el Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV + ' - Tipo Error : ' + objFechaEntrega.tipoError + ' - Descripcion : ' + objFechaEntrega.descripcion;
                                                log.error('Creación OV (SS) - afterSubmit', 'UCOV011 - Error calculando fecha de entrega para el Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV + ' - Tipo Error : ' + objFechaEntrega.tipoError + ' - Descripcion : ' + objFechaEntrega.descripcion);
                                                //mensajeError = respuestaParcial.mensaje.toString();
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                        }

                                    } else {
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'UCOV012';
                                        respuestaParcial.mensaje = 'No se encontraron Proveedores para el Articulo con ID Interno : ' + IDArticulo + '. Para configurar la Orden de Venta con ID Interno : ' + idOV;
                                        log.error('Creación OV (SS) - afterSubmit', 'UCOV012 - No se encontraron Proveedores para el Articulo con ID Interno : ' + IDArticulo + '. Para configurar la Orden de Venta con ID Interno : ' + idOV);
                                        mensajeError = mensajeError + ' ' + respuestaParcial.mensaje.toString();
                                        respuesta.detalle.push(respuestaParcial);
                                    }

                                    //FIN CALCULAR FECHA DE ENTREGA

                                    if (!utilities.isEmpty(IDArticulo)) {

                                        objRecord.setCurrentSublistValue({
                                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                                            fieldId: 'custrecord_3k_req_compra_f_entrega',
                                            value: fechaEntrega,
                                            ignoreFieldChange: false
                                        });


                                        objRecord.commitLine({
                                            sublistId: 'recmachcustrecord_3k_req_compra_ov'
                                        });

                                        var objFechasProv = new Object();
                                        objFechasProv.item = IDArticulo;
                                        objFechasProv.fecha = fechaEntrega;
                                        arrayFechasProv.push(objFechasProv);

                                    } else {
                                        errorREQ = true;
                                        var mensaje = 'No se pudo Obtener la siguiente información Para configurar la Requisicion con ID Interno : ' + IDInterno + ' : ';
                                        if (utilities.isEmpty(IDArticulo)) {
                                            mensaje = mensaje + ' ID Interno del Articulo / ';
                                        }
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'UCOV013';
                                        respuestaParcial.mensaje = mensaje;
                                        //mensajeError = respuestaParcial.mensaje.toString();
                                        log.error('Creación OV (SS) - afterSubmit', 'UCOV013 - ' + mensaje);
                                        respuesta.detalle.push(respuestaParcial);
                                    }

                                }

                                log.audit('Creación OV (SS) - afterSubmit', 'FIN Actualizar Requisiciones');

                                // FIN ACTUALIZAR REQUISICIONES          

                                // INICIO ACTUALIZAR LINEAS OV

                                //var errorOV = false;
                                //var indiceVoucher = 0;

                                log.audit('Creación OV (SS) - afterSubmit', 'INICIO Actualizar Lineas OV');
                                log.debug('Creación OV (SS) - afterSubmit', 'arrayFechasProv: ' + JSON.stringify(arrayFechasProv));

                                for (var i = 0; i < cantidadLineasOV; i++) {

                                    var infoOrden = new Object();

                                    var esRedondeo = objRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_es_redondeo',
                                        line: i
                                    });

                                    if (!esRedondeo) {

                                        var lineNum = objRecord.selectLine({
                                            sublistId: 'item',
                                            line: i
                                        });

                                        var IDArticulo = objRecord.getCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'item'
                                        });

                                        log.debug('Creación OV (SS) - afterSubmit', 'IDArticulo: ' + IDArticulo);

                                        if (!utilities.isEmpty(IDArticulo)) {
                                            var objLineaOV = arrayArticulos.filter(function (obj) {
                                                return (obj.articulo == IDArticulo);
                                            });

                                            log.debug('Creación OV (SS) - afterSubmit', 'objLineaOV: ' + JSON.stringify(objLineaOV));

                                            if (!utilities.isEmpty(objLineaOV) && objLineaOV.length > 0) {

                                                var objFechas = arrayFechasProv.filter(function (obj) {
                                                    return (obj.item == IDArticulo);
                                                });

                                                log.debug('Creación OV (SS) - afterSubmit', 'objFechas: ' + JSON.stringify(objFechas));


                                                if (!utilities.isEmpty(objFechas) && objFechas.length > 0) {

                                                    fechaEntrega = objFechas[objFechas.length - 1].fecha;

                                                    log.debug('Creación OV (SS) - afterSubmit', 'fechaEntrega: ' + fechaEntrega);

                                                    objRecord.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol_3k_fecha_entrega',
                                                        value: fechaEntrega,
                                                        ignoreFieldChange: true
                                                    });


                                                    objRecord.commitLine({
                                                        sublistId: 'item'
                                                    });

                                                }

                                            } else {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'UCOV014';
                                                respuestaParcial.mensaje = 'No se puede encontrar la informacion del Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV;
                                                //mensajeError = respuestaParcial.mensaje.toString();
                                                log.error('Creación OV (SS) - afterSubmit', 'UCOV014 - No se puede encontrar la informacion del Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV);
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                        } else {
                                            respuesta.error = true;
                                            var mensaje = 'No se pudo Obtener la siguiente información Para configurar la Orden de Venta con ID Interno : ' + idOV + ' Numero de Linea : ' + i + 1 + ' : ';
                                            if (utilities.isEmpty(IDArticulo)) {
                                                mensaje = mensaje + ' ID Interno del Articulo / ';
                                            }
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'UCOV015';
                                            respuestaParcial.mensaje = mensaje;
                                            //mensajeError = respuestaParcial.mensaje.toString();
                                            log.error('Creación OV (SS) - afterSubmit', 'UCOV015 - ' + mensaje);
                                            respuesta.detalle.push(respuestaParcial);
                                        }
                                    }
                                }

                                log.audit('Creación OV (SS) - afterSubmit', 'FIN Actualizar Lineas OV');

                                // FIN ACTUALIZAR LINEAS OV
                            }

                            objRecord.setValue({
                                fieldId: 'custbody_3k_programa_fidelidad',
                                value: fidelidadOV
                            });
       
                            // INICIO GRABAR OV
                            try {
                                var recordId = objRecord.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: false
                                });
                            } catch (excepcionSave) {
                                error = true;
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'UCOV016';
                                respuestaParcial.mensaje = 'Excepcion Actualizando Orden de Venta con ID Interno : ' + idOV + ' - Excepcion : ' + excepcionSave.message.toString();
                                log.error('Creación OV (SS) - afterSubmit', 'UCOV016 -Excepcion Actualizando Orden de Venta con ID Interno : ' + idOV + ' - Excepcion : ' + excepcionSave.message);
                                respuesta.detalle.push(respuestaParcial);
                            }
                            if (utilities.isEmpty(recordId)) {
                                error = true;
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'UCOV017';
                                respuestaParcial.mensaje = 'Error No se recibio el ID Interno de la Orden de Venta Actualizada';
                                log.error('Creación OV (SS) - afterSubmit', 'UCOV017 -Error No se recibio el ID Interno de la Orden de Venta Actualizada');
                                respuesta.detalle.push(respuestaParcial);
                            }
                            // FIN GRABAR OV
                        }
                    }

                } catch (excepcion) {
                    error = true;
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'UCOV018';
                    respuestaParcial.mensaje += excepcion;
                    mensajeError = mensajeError + ' ' + respuestaParcial.mensaje.toString();
                    respuesta.detalle.push(respuestaParcial);
                    log.error('Creación OV (SS) - afterSubmit', 'UCOV018 - Excepcion : ' + excepcion);
                }

                log.debug('Creación OV (SS) - afterSubmit ', 'error: ' + error + ' - mensajeError: ' + mensajeError);

                if (error == true) {
                    // SI HUBO ALGUN ERROR, GENERAR LA OV CON ESTADO "APROBACION PENDIENTE"

                    var idOVActualizada = record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: idOV,
                        values: {
                            orderstatus: 'A'
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });

                    log.debug('Creación OV (SS) - afterSubmit', 'respuesta: ' + JSON.stringify(respuesta) + ' - OV: ' + idOV);
                    log.error('Creación OV (SS) - afterSubmit', 'OV ' + idOV + ' Creada en Estado APROBACION PENDIENTE');
                    
                    //Se crea User Note con el error
                    var crearNotaError = funcionalidades.crearNota(idOV, 'OV en Aprobacion Pendiente', tipoNota, mensajeError);
                    log.debug('Creación OV (SS) - afterSubmit', 'crearNotaError: ' + JSON.stringify(crearNotaError));

                }

                log.audit('Creación OV (SS)', 'FIN - afterSubmit');

            }
        }

        function obtenerInformacionProveedores() {

            log.debug('obtenerInformacionProveedores', 'INICIO');

            var respuesta = new Object();
            respuesta.error = false;
            respuesta.arrayDiasPedidoProveedor = new Array();
            respuesta.detalle = new Array();

            var objResultSet = utilities.searchSaved('customsearch_3k_prov_dias_pedidos');

            if (objResultSet.error) {
                return objResultSet;
            }
            var resultSet = objResultSet.objRsponseFunction.result;
            var resultSearch = objResultSet.objRsponseFunction.search;

            if (!utilities.isEmpty(resultSet) && resultSet.length > 0) {

                for (var l = 0; !utilities.isEmpty(resultSet) && l < resultSet.length; l++) {

                    var obj = new Object();
                    obj.indice = l;
                    obj.proveedor = resultSet[l].getValue({
                        name: resultSearch.columns[0]
                    });
                    obj.codigoDiaJS = resultSet[l].getValue({
                        name: resultSearch.columns[2]
                    });
                    obj.demoraProveedor = resultSet[l].getValue({
                        name: resultSearch.columns[3]
                    });
                    respuesta.arrayDiasPedidoProveedor.push(obj);
                }
            } else {
                var mensaje = 'Error Calculando Fecha de Entrega - Error : Error Consultando dias de Pedidos de Proveedores';
                respuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'UDPP001';
                objRespuestaParcial.mensaje = mensaje;
                respuesta.detalle.push(objRespuestaParcial);
                log.error('obtenerInformacionProveedores', 'UDPP001 - ' + mensaje);
            }

            log.debug('obtenerInformacionProveedores', 'FIN');
            return respuesta;
        }

        function consultarDiasNoLoborables() {

            log.audit('consultarDiasNoLoborables', 'INICIO');

            var respuesta = new Object();
            respuesta.error = false;
            respuesta.arrayDiasNoLaborables = new Array();
            respuesta.detalle = new Array();

            // INICIO - Obtener Array de Dias No Laborable
            var objResultSet = utilities.searchSaved('customsearch_3k_calendario_dias_no_lab');
            if (objResultSet.error) {
                respuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'UDNL001';
                objRespuestaParcial.mensaje = 'Error Obteniendo Calendario de Dias No Laborables - Tipo Error : ' + objResultSet.tipoError + ' - Descripcion : ' + objResultSet.descripcion;
                respuesta.detalle.push(objRespuestaParcial);
                log.error('obtenerInformacionProveedores', 'UDNL001 - Error Obteniendo Calendario de Dias No Laborables - Tipo Error : ' + objResultSet.tipoError + ' - Descripcion : ' + objResultSet.descripcion);

                //respuesta.tipoError = 'SROV018';
                //respuesta.mensaje = 'Error Obteniendo Calendario de Dias No Laborables - Tipo Error : ' + objResultSet.tipoError + ' - Descripcion : ' + objResultSet.descripcion;;
                return respuesta;
            }

            var resultSet = objResultSet.objRsponseFunction.result;
            var resultSearch = objResultSet.objRsponseFunction.search;

            for (var l = 0; !utilities.isEmpty(resultSet) && l < resultSet.length; l++) {

                var obj = new Object();
                obj.indice = l;
                obj.idInterno = resultSet[l].getValue({
                    name: resultSearch.columns[0]
                });
                obj.nombre = resultSet[l].getValue({
                    name: resultSearch.columns[1]
                });
                obj.fecha = resultSet[l].getValue({
                    name: resultSearch.columns[2]
                });

                if (!utilities.isEmpty(obj.fecha)) {
                    obj.fecha = format.parse({
                        value: obj.fecha,
                        type: format.Type.DATE,
                    });
                }

                respuesta.arrayDiasNoLaborables.push(obj);
            }

            log.audit('consultarDiasNoLoborables', 'FIN');
            return respuesta;
            // FIN - Obtener Array de Dias No Laborables
        }

        function generarAjusteRedondeo(idOV, registro, importeTotalWoow) {

            log.audit('generarAjusteRedondeo ', 'INICIO');
            log.debug('generarAjusteRedondeo', 'Parámetros - idOV: ' + idOV + ', registro: ' + JSON.stringify(registro));

            var objRespuesta = new Object();
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();
            objRespuesta.registro = null;
            objRespuesta.mensajeError = null;
            //objRespuesta.importeTotalVouchers = 0.00;

            try {

                var carritoCerrado = false;

                if (!utilities.isEmpty(idOV) || !utilities.isEmpty(registro)) {
                    if (!utilities.isEmpty(idOV)) {
                        var objRecord = record.load({
                            type: record.Type.SALES_ORDER,
                            id: idOV,
                            isDynamic: true,
                        });

                    } else {
                        var objRecord = registro;
                    }

                    var estadoCarrito = objRecord.getValue({
                        fieldId: 'statusRef'
                    });

                    if (!utilities.isEmpty(objRecord)) {

                        var importeTotalOVNS = objRecord.getValue({
                            fieldId: 'custbody_3k_importe_total'
                        });
                        /*var importeTotalOVWOOW = objRecord.getValue({
                            fieldId: 'custbody_3k_imp_total_woow'
                        });*/
                        var importeTotalOVWOOW = importeTotalWoow;
                        var cantidadLineasOV = objRecord.getLineCount({
                            sublistId: 'item'
                        });

                        log.debug('generarAjusteRedondeo', 'importeTotalOVNS: ' + importeTotalOVNS + ', importeTotalOVWOOW: ' + importeTotalOVWOOW + ', cantidadLineasOV: ' + cantidadLineasOV);

                        var totalEnvioNS = objRecord.getValue({
                          fieldId: 'custbody_3k_total_envio'
                        });

                        var totalEnvioMagento = objRecord.getValue({
                          fieldId: 'custbody_woow_shippingcost_magento'
                        });

                      log.debug('totalesEnvio', 'totalEnvioMagento: ' + totalEnvioMagento + ' totalEnvioNS: ' + totalEnvioNS);

                        if (utilities.isEmpty(importeTotalOVWOOW) || isNaN(parseFloat(importeTotalOVWOOW))) {
                            importeTotalOVWOOW = 0.00;
                        }
                        if (utilities.isEmpty(totalEnvioMagento) || isNaN(parseFloat(totalEnvioMagento))) {
                          totalEnvioMagento = 0.00;
                        }
                        if (utilities.isEmpty(totalEnvioNS) || isNaN(parseFloat(totalEnvioNS))) {
                          totalEnvioNS = 0.00;
                        }

                        if (!utilities.isEmpty(importeTotalOVNS) && !isNaN(parseFloat(importeTotalOVNS)) && !utilities.isEmpty(importeTotalOVWOOW) && !isNaN(parseFloat(importeTotalOVWOOW))) {
                            
                            importeTotalOVWOOW = (parseFloat(importeTotalOVWOOW) + parseFloat(totalEnvioMagento));
                            //importeTotalOVNS = (parseFloat(importeTotalOVNS) - parseFloat(totalEnvioNS));
                            //var diferenciaEnvio = (parseFloat(totalEnvioMagento) - parseFloat(totalEnvioNS)).toFixed(2);
                            var diferenciaImporte = parseFloat(importeTotalOVWOOW) - parseFloat(importeTotalOVNS);// + parseFloat(diferenciaEnvio);
                            //log.debug('generarAjusteRedondeo', 'diferenciaEnvio: ' + diferenciaEnvio);
                            log.debug('generarAjusteRedondeo', 'diferenciaImporte: ' + diferenciaImporte);
                            var eliminoLineaRedondeo = false;
                            if (parseFloat(diferenciaImporte) != 0.00) {

                                if (cantidadLineasOV > 0) {
                                    for (var i = 0; i < cantidadLineasOV; i++) {

                                        // INICIO ELIMINAR LINEAS DE REDONDEO

                                        log.debug('generarAjusteRedondeo', 'i antes de delete: ' + i);
                                        log.debug('generarAjusteRedondeo', 'cantidadLineasOV antes de delete: ' + cantidadLineasOV);

                                        var esRedondeo = objRecord.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_3k_es_redondeo',
                                            line: i
                                        });

                                        log.debug('generarAjusteRedondeo', 'esRedondeo: ' + esRedondeo);

                                        if (esRedondeo == true) {


                                            objRecord.selectLine({
                                                sublistId: 'item',
                                                line: i
                                            });

                                            objRecord.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'rate',
                                                value: '0'
                                            });

                                            objRecord.commitLine({
                                                sublistId: 'item'
                                            });

                                            /*var importeBruto = objRecord.getSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'grossamt',
                                                line: i
                                            });

                                            diferenciaImporte += parseFloat(diferenciaImporte, 10) + parseFloat(importeBruto, 10);*/

                                            /*objRecord.removeLine({
                                                sublistId: 'item',
                                                line: i
                                            });*/

                                            //i--;
                                            //cantidadLineasOV--;

                                            eliminoLineaRedondeo = true;

                                            //break;

                                            log.debug('generarAjusteRedondeo', 'i despues de delete: ' + i);
                                            log.debug('generarAjusteRedondeo', 'cantidadLineasOV despues de delete: ' + cantidadLineasOV);
                                        }

                                        // FIN ELIMINAR LINEAS DE REDONDEO

                                    }

                                    /*if (eliminoLineaRedondeo) {

                                        objRecord.save();

                                        var objRecord = record.load({
                                            type: record.Type.SALES_ORDER,
                                            id: idOV,
                                            isDynamic: true,
                                        });
                                    }*/
                                    // INICIO AGREGAR LINEA DE REDONDEO

                                    if (eliminoLineaRedondeo) {
                                        var totalNS = objRecord.getValue({
                                            sublistId: 'item',
                                            fieldId: 'total'
                                        });

                                        var diferenciaImporte = (parseFloat(importeTotalOVWOOW)) - parseFloat(totalNS);
                                    }

                                    if (parseFloat(diferenciaImporte, 10) != 0.00) {

                                        var resultConfigAjustes = utilities.searchSavedPro('customsearch_3k_config_ajuste_redondeo');
                                        if (resultConfigAjustes.error) {
                                            return resultConfigAjustes;
                                        }

                                        var configAjustes = resultConfigAjustes.objRsponseFunction.array;

                                        if (!utilities.isEmpty(configAjustes) && configAjustes.length > 0) {

                                            var articuloAjustePositivo = configAjustes[0].custrecord_3k_configajuste_articulo_p;
                                            var articuloAjusteNegativo = configAjustes[0].custrecord_3k_configajuste_articulo_n;
                                            var topeMaximo = configAjustes[0].custrecord_3k_configajuste_tope_max;

                                            var articuloUtilizar = articuloAjusteNegativo;
                                            if (parseFloat(diferenciaImporte) > 0.00) {
                                                articuloUtilizar = articuloAjustePositivo;
                                            }

                                            log.debug('generarAjusteRedondeo', ' diferenciaImporte: ' + diferenciaImporte + ', topeMaximo: ' + topeMaximo);

                                            if (Math.abs(diferenciaImporte) < topeMaximo) {

                                                objRecord.selectNewLine({
                                                    sublistId: 'item'
                                                });

                                                log.debug('generarAjusteRedondeo ', 'articuloUtilizar: ' + articuloUtilizar);

                                                objRecord.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'item',
                                                    value: articuloUtilizar
                                                });

                                                objRecord.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'quantity',
                                                    value: 1
                                                });

                                                log.debug('generarAjusteRedondeo', 'diferenciaImporte: ' + diferenciaImporte);

                                                objRecord.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'rate',
                                                    value: diferenciaImporte.toFixed(2).toString()
                                                });

                                                objRecord.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'custcol_3k_es_redondeo',
                                                    value: true
                                                });

                                                objRecord.commitLine({
                                                    sublistId: 'item'
                                                });

                                                if (!utilities.isEmpty(idOV)) {

                                                    try {
                                                        /*objRespuesta.importeTotalOV = objRecord.getValue({
                                                            fieldId: 'custbody_3k_importe_total'
                                                        });*/

                                                        objRespuesta.importeTotalOV = objRecord.getValue({
                                                            fieldId: 'total'
                                                        });

                                                        log.debug('generarAjusteRedondeo ', 'diferenciaImporte: ' + objRespuesta.importeTotalOV);

                                                        var recordId = objRecord.save();

                                                    } catch (excepcionGrabarOV) {
                                                        objRespuesta.error = true;
                                                        objRespuestaParcial = new Object({});
                                                        objRespuestaParcial.codigo = 'UGAR001';
                                                        objRespuestaParcial.mensaje = 'Error: Excepcion Grabando Ajuste por Redondeo - Excepcion : ' + excepcionGrabarOV.message.toString();
                                                        //objRespuesta.mensajeError = objRespuestaParcial.mensaje.toString();
                                                        objRespuesta.detalle.push(objRespuestaParcial);
                                                        log.error('generarAjusteRedondeo', 'UGAR001 - Error: Excepcion Grabando Ajuste por Redondeo - Excepcion : ' + excepcionGrabarOV.message);
                                                    }

                                                } else {
                                                    objRespuesta.registro = registro;
                                                }

                                            } else {
                                                objRespuesta.error = true;
                                                objRespuestaParcial = new Object({});
                                                objRespuestaParcial.codigo = 'UGAR002';
                                                objRespuestaParcial.mensaje = 'Error generando Ajuste de Redondeo. El ajuste por redondeo ' + diferenciaImporte.toFixed(2) + ', es mayor al tope maximo permitido: ' + topeMaximo;
                                                objRespuesta.mensajeError = objRespuestaParcial.mensaje.toString();
                                                objRespuesta.detalle.push(objRespuestaParcial);
                                                log.error('generarAjusteRedondeo', 'UGAR002 - Error generando Ajuste de Redondeo. El ajuste por redondeo ' + diferenciaImporte.toFixed(2) + ', es mayor al tope maximo permitido: ' + topeMaximo);
                                            }
                                        } else {
                                            objRespuesta.error = true;
                                            objRespuestaParcial = new Object({});
                                            objRespuestaParcial.codigo = 'UGAR003';
                                            objRespuestaParcial.mensaje = 'Error generando Ajuste de Redondeo. No se encuentra realizada la configuración de Articulos de Redondeo.';
                                            objRespuesta.mensajeError = objRespuestaParcial.mensaje.toString();
                                            objRespuesta.detalle.push(objRespuestaParcial);
                                            log.error('generarAjusteRedondeo', 'UGAR003 - Error generando Ajuste de Redondeo. No se encuentra realizada la configuración de Articulos de Redondeo.');
                                        }
                                        // FIN ELIMINAR LINEAS DE REDONDEO

                                    } else {
                                        if (!utilities.isEmpty(idOV)) {

                                            try {
                                                objRespuesta.importeTotalOV = objRecord.getValue({
                                                    fieldId: 'total'
                                                });

                                                var recordId = objRecord.save({
                                                    enableSourcing: true,
                                                    ignoreMandatoryFields: false
                                                });

                                            } catch (excepcionGrabarOV) {
                                                objRespuesta.error = true;
                                                objRespuestaParcial = new Object({});
                                                objRespuestaParcial.codigo = 'UGAR004';
                                                objRespuestaParcial.mensaje = 'Error generando Ajuste de Redondeo. Excepcion Grabando Ajuste por Redondeo - Excepcion : ' + excepcionGrabarOV.message.toString();;
                                                objRespuesta.detalle.push(objRespuestaParcial);
                                                log.error('generarAjusteRedondeo', 'UGAR004 - Error generando Ajuste de Redondeo. Excepcion Grabando Ajuste por Redondeo - Excepcion : ' + excepcionGrabarOV.message);
                                            }

                                        } else {
                                            objRespuesta.registro = registro;
                                        }
                                    }
                                } else {
                                    objRespuesta.error = true;
                                    objRespuestaParcial = new Object({});
                                    objRespuestaParcial.codigo = 'UGAR005';
                                    objRespuestaParcial.mensaje = 'Error generando Ajuste de Redondeo. No se detectaron lineas en la Orden de Venta.';
                                    objRespuesta.detalle.push(objRespuestaParcial);
                                    log.error('generarAjusteRedondeo', 'UGAR005 - Error generando Ajuste de Redondeo. No se detectaron lineas en la Orden de Venta.');
                                }

                            } else {
                                if (!utilities.isEmpty(idOV)) {

                                    objRespuesta.importeTotalOV = objRecord.getValue({
                                        fieldId: 'total'
                                    });

                                } else {
                                    objRespuesta.registro = registro;
                                }
                            }

                        } else {
                            objRespuesta.error = true;
                            objRespuestaParcial = new Object({});
                            objRespuestaParcial.codigo = 'UGAR006';
                            objRespuestaParcial.mensaje = 'Error generando Ajuste de Redondeo. Error Obteniendo Montos Totales de la Orden de Venta';
                            objRespuesta.detalle.push(objRespuestaParcial);
                            log.error('generarAjusteRedondeo', 'UGAR006 - Error generando Ajuste de Redondeo. Error Obteniendo Montos Totales de la Orden de Venta');
                        }


                    } else {
                        objRespuesta.error = true;
                        objRespuestaParcial = new Object({});
                        objRespuestaParcial.codigo = 'UGAR007';
                        objRespuestaParcial.mensaje = 'Error generando Ajuste de Redondeo. Error Cargando la Orden de Venta';
                        objRespuesta.detalle.push(objRespuestaParcial);
                        log.error('generarAjusteRedondeo', 'UGAR007 - Error generando Ajuste de Redondeo. Error Cargando la Orden de Venta');
                    }

                } else {
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object({});
                    objRespuestaParcial.codigo = 'UGAR008';
                    objRespuestaParcial.mensaje = 'Error generando Ajuste de Redondeo. No se recibio registro de Orden de Venta';
                    objRespuesta.detalle.push(objRespuestaParcial);
                    log.error('generarAjusteRedondeo', 'UGAR008 - Error generando Ajuste de Redondeo. No se recibio registro de Orden de Venta');
                }

            } catch (excepcion) {
                objRespuesta.error = true;
                objRespuestaParcial = new Object({});
                objRespuestaParcial.codigo = 'UGAR009';
                objRespuestaParcial.mensaje = 'Error generando Ajuste de Redondeo. Excepcion Generando Ajuste por Redondeo - Excepcion : ' + excepcion.message.toString();;
                objRespuesta.detalle.push(objRespuestaParcial);
                log.error('generarAjusteRedondeo', 'UGAR009 - Error generando Ajuste de Redondeo. Excepcion Generando Ajuste por Redondeo - Excepcion : ' + excepcion.message);
            }

            log.audit('generarAjusteRedondeo', 'FIN');
            return objRespuesta;
        }

        function creacionRequisiciones(rec, arrayLinea, fecha) {
            /******************INCIO INSERTAR A TRAVES DE RECMACH REQUISICIONES*******************************************************************/
            log.audit('creacionRequisiciones', 'INICIO');
            log.debug('creacionRequisiciones', 'Parámetros - rec: ' + JSON.stringify(rec));
            log.debug('creacionRequisiciones', 'Parámetros - arrayLinea: ' + JSON.stringify(arrayLinea) + ', fecha: ' + fecha);

            var objRespuesta = new Object();
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();

            try {

                for (var i = 0; i < arrayLinea.length; i++) {
                    log.debug('creacionRequisiciones', 'arrayLinea: ' + JSON.stringify(arrayLinea[i]));

                    if (!arrayLinea[i].isStockPropio) {
                        //NUEVA LINEA
                        var lineNum = i;

                        //SE SETEAN LOS CAMPOS
                        rec.setSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_articulo_grupo',
                            line: lineNum,
                            value: arrayLinea[i].articulo
                        });

                        rec.setSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_articulo',
                            line: lineNum,
                            value: arrayLinea[i].componente
                        });

                        rec.setSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_fecha',
                            line: lineNum,
                            value: fecha
                        });

                        rec.setSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_pila',
                            line: lineNum,
                            value: arrayLinea[i].pila
                        });

                        rec.setSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_cantidad',
                            line: lineNum,
                            value: arrayLinea[i].cantidad.toString()
                        });

                        rec.setSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_cant_comp',
                            line: lineNum,
                            value: arrayLinea[i].cantidadComponente.toString()
                        });

                        rec.setSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_3k_req_compra_ubicacion',
                            line: lineNum,
                            value: arrayLinea[i].ubicacion
                        });

                        rec.setSublistValue({
                            sublistId: 'recmachcustrecord_3k_req_compra_ov',
                            fieldId: 'custrecord_46_cseg_3k_sitio_web_o',
                            line: lineNum,
                            value: arrayLinea[i].sitio
                        });

                    }

                    /******************FIN INSERTAR A TRAVES DE RECMACH REQUISICIONES*******************************************************************/
                } // END FOR 

            } catch (excepcion) {
                log.error('creacionRequisiciones', 'UCRQ001 - Error creando Requisicion. Excepcion :' + excepcion);
            }

            log.audit('creacionRequisiciones', 'FIN');
        }

        function calcularFecha(arrayDiasNoLaborales, arrayProveedor, stockPropio, arrayDiasEntregaProveedor) {

            log.audit('calcularFecha', 'INICIO');

            var objRespuesta = new Object();
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();
            //objRespuesta.tipoError = '';
            //objRespuesta.descripcion = '';

            try {

                var arrayFechasEntregas = new Array();

                if (!utilities.isEmpty(arrayProveedor) && arrayProveedor.length > 0) {

                    if (!utilities.isEmpty(arrayDiasEntregaProveedor) && arrayDiasEntregaProveedor.length > 0) {

                        var idProveedores = new Array();
                        for (var i = 0; i < arrayProveedor.length; i++) {
                            idProveedores.push(arrayProveedor[i].Proveedor);
                        }

                        log.debug('calcularFecha', 'Cantidad Resultados Dias Entrega : ' + arrayDiasEntregaProveedor.length);

                        // Por cada Proveedor Calcular la Fecha de Entrega
                        var fechaMayor = '';
                        var tieneFechaFija = false;
                        for (var i = 0; i < arrayProveedor.length; i++) {

                            var fechaServidor = new Date();

                            log.debug('calcularFecha', 'Fecha Serv : ' + fechaServidor);

                            if (!stockPropio)
                                fechaServidor.setDate(fechaServidor.getDate() + 1);

                            log.debug('calcularFecha', 'Fecha Serv 2 : ' + fechaServidor);

                            // Si la Fecha de Reparto es Superior a la Fecha Actual => Utilizar Fecha de Reparto
                            if (!utilities.isEmpty(arrayProveedor[i].FechaReparto)) {
                                var fechaRepartoDate = format.parse({
                                    value: arrayProveedor[i].FechaReparto,
                                    type: format.Type.DATE,
                                });

                                if (fechaRepartoDate > fechaServidor) {
                                    fechaServidor = fechaRepartoDate;
                                    tieneFechaFija = true;
                                }
                            }

                            var fechaString = format.format({
                                value: fechaServidor,
                                type: format.Type.DATE,
                                timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                            });

                            var fechaActual = format.parse({
                                value: fechaString,
                                type: format.Type.DATE
                            });

                            if (!tieneFechaFija) {

                                var diaActual = fechaActual.getDay();

                                log.debug('calcularFecha', 'Dia Actual : ' + diaActual);

                                log.debug('calcularFecha', 'Proveedor : ' + arrayProveedor[i].Proveedor);
                                var resultDiasEntrega = arrayDiasEntregaProveedor.filter(function (obj) {
                                    return (obj.proveedor == arrayProveedor[i].Proveedor);
                                });

                                log.debug('calcularFecha', 'Dias Entrega Proveedor Tam : ' + resultDiasEntrega.length);

                                //lunes es 1
                                //martes es 2
                                //miercoles es 3
                                //jueves es 4
                                //viernes es 5
                                //var primerIndice = false;
                                var splice = 0;
                                var arrayOrdenadoEntregaProveedor = new Array();

                                var arrayDiasMenor = new Array();

                                for (var j = 0; j < resultDiasEntrega.length; j++) {
                                    //var indexActual = i;
                                    //var splice=1;
                                    /*var valorActual;
                                    var valorMayor;*/

                                    if (diaActual == resultDiasEntrega[j].codigoDiaJS) {
                                        arrayOrdenadoEntregaProveedor.unshift(resultDiasEntrega[j]);
                                        //primerIndice=true;
                                        splice = splice + 1;
                                    } else {

                                        if (diaActual > resultDiasEntrega[j].codigoDiaJS) {
                                            arrayOrdenadoEntregaProveedor.push(resultDiasEntrega[j]);
                                        } else {
                                            if (splice > 0) {
                                                arrayOrdenadoEntregaProveedor.splice(splice, 0, resultDiasEntrega[j]);
                                                splice = splice + 1;
                                            } else {
                                                arrayOrdenadoEntregaProveedor.unshift(resultDiasEntrega[j]);
                                                splice = splice + 1;
                                            }
                                        }

                                    }

                                    /*if (diaActual >= resultDiasEntrega[j].codigoDiaJS) {
                                        arrayDiasMenor.push(resultDiasEntrega[j]);
                                    }
                                    else{
                                        arrayOrdenadoEntregaProveedor.push(resultDiasEntrega[j]);
                                    }*/
                                }

                                arrayOrdenadoEntregaProveedor.concat(arrayDiasMenor);

                                log.debug('calcularFecha', 'arrayOrdenadoEntregaProveedor: ' + JSON.stringify(arrayOrdenadoEntregaProveedor));

                                for (var k = 0; k < arrayOrdenadoEntregaProveedor.length; k++) {

                                    log.debug('calcularFecha', 'arrayOrdenadoEntregaProveedor codigoDiaJS : ' + arrayOrdenadoEntregaProveedor[k].codigoDiaJS);
                                    var diffDay = arrayOrdenadoEntregaProveedor[k].codigoDiaJS - diaActual;
                                    var fechaBaseCalculo = new Date(fechaActual.getTime());

                                    log.debug('calcularFecha', 'diffDay : ' + diffDay + ' linea: ' + k);

                                    if (diffDay >= 0) {
                                        fechaBaseCalculo.setDate(fechaBaseCalculo.getDate() + diffDay);
                                    } else {
                                        fechaBaseCalculo.setDate((fechaBaseCalculo.getDate() + 7) + diffDay);
                                    }

                                    log.debug('calcularFecha', 'fechaBaseCalculo despues de diffDay : ' + fechaBaseCalculo);

                                    var resultFilter = arrayDiasNoLaborales.filter(function (obj) {
                                        return (obj.fecha.getTime() == fechaBaseCalculo.getTime());
                                    });

                                    if (resultFilter.length > 0) {
                                        if (k == arrayOrdenadoEntregaProveedor.length - 1) {
                                            k = -1;
                                            fechaActual.setDate(fechaActual.getDate() + 7);
                                        }
                                        continue;
                                    } else {

                                        var diasTotales = 0;
                                        for (var b = 1; b <= parseInt(arrayOrdenadoEntregaProveedor[k].demoraProveedor); b++) {
                                            var fechaRecorrida = new Date(fechaBaseCalculo.getTime());
                                            //fechaRecorrida.setDate(newFechaDisponibilidad.getDate());

                                            fechaRecorrida.setDate(fechaBaseCalculo.getDate() + (diasTotales + 1));

                                            var resultFilter = arrayDiasNoLaborales.filter(function (obj) {
                                                return (obj.fecha.getTime() == fechaRecorrida.getTime());
                                            });

                                            //log.debug('NIVELES FILTER', 'obj.fecha.getTime()' + obj.fecha.getTime() +' fechaRecorrida.getTime(): '+ fechaRecorrida.getTime());

                                            if (!utilities.isEmpty(resultFilter) && resultFilter.length > 0) {
                                                b--;

                                            }

                                            diasTotales++;
                                        }

                                        fechaBaseCalculo.setDate(fechaBaseCalculo.getDate() + parseInt(diasTotales, 10));

                                        //objRespuesta.fechaBaseCalculo = fechaBaseCalculo;

                                        log.debug('calcularFecha', ' fechaBaseCalculo: ' + fechaBaseCalculo);
                                        if (utilities.isEmpty(fechaMayor)) {
                                            fechaMayor = fechaBaseCalculo;
                                        } else {
                                            if (fechaBaseCalculo > fechaMayor) {
                                                fechaMayor = fechaBaseCalculo;
                                            }
                                        }
                                        break;

                                    }

                                }
                            } else {
                                fechaMayor = fechaActual;
                            }

                        }

                        if (!utilities.isEmpty(fechaMayor)) {
                            objRespuesta.fechaBaseCalculo = fechaMayor;
                        } else {
                            var mensaje = 'Error Calculando Fecha de Entrega - Error : No se calcularon Fechas de Entregas para los Proveedores';
                            objRespuesta.error = true;
                            objRespuestaParcial = new Object();
                            objRespuestaParcial.codigo = 'UCFC001';
                            objRespuestaParcial.mensaje = mensaje;
                            objRespuesta.detalle.push(objRespuestaParcial);
                            log.error('CcalcularFecha', 'UCFC001 - ' + mensaje);
                        }
                    } else {
                        var mensaje = 'Error Calculando Fecha de Entrega - Error : No se recibio la informacion de los dias de Pedido de los Proveedores';
                        objRespuesta.error = true;
                        objRespuestaParcial = new Object();
                        objRespuestaParcial.codigo = 'UCFC002';
                        objRespuestaParcial.mensaje = mensaje;
                        objRespuesta.detalle.push(objRespuestaParcial);
                        log.error('calcularFecha', 'UCFC002 - ' + mensaje);
                    }
                } else {
                    var mensaje = 'Error Calculando Fecha de Entrega - Error : No se recibieron los ID de los Proveedores A Calcular las Fechas de Entrega';
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'UCFC003';
                    objRespuestaParcial.mensaje = mensaje;
                    objRespuesta.detalle.push(objRespuestaParcial);
                    log.error('calcularFecha', 'UCFC003 - ' + mensaje);
                }
            } catch (e) {
                objRespuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'UCFC004';
                objRespuestaParcial.mensaje = 'Error Calculando Fecha de Entrega - Excepcion: ' + e.message;
                objRespuesta.detalle.push(objRespuestaParcial);
                log.error('calcularFecha', 'UCFC004 - Error Calculando Fecha de Entrega - Excepcion' + e.message);

            }

            log.audit('calcularFecha', 'FIN');

            return objRespuesta;
        }

        return {
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });


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
define(['N/error', 'N/record', 'N/search', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function(error, record, search, utilities, funcionalidades) {

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

            log.audit('Consulta Stock', 'INICIO Consulta Stock');

            var objRespuesta = new Object({});
            objRespuesta.result = new Array();
            objRespuesta.error = false;
            objRespuesta.detalle = [];

            var idRec = scriptContext.newRecord.id;
            var requestBody = scriptContext.newRecord.getValue({ fieldId: 'custrecord_3k_consulstock_informacion' });
            var type = scriptContext.type;

            if (scriptContext.type == 'create') {
                try {

                    if (!utilities.isEmpty(requestBody)) {
                        log.debug('doPost', 'requestBody: ' + JSON.stringify(requestBody));
                        var body = JSON.parse(requestBody);
                        log.debug('doPost', 'body: ' + JSON.stringify(body));

                        if (!utilities.isEmpty(body)) {
                            var informacion = body.articulos;
                            var arrayArticulos = [];
                            for (var i = 0; i < informacion.length; i++) {
                                var obj = informacion[i];
                                arrayArticulos.push(obj.idArticulo);
                            }

                            var arraySearchParams = [];
                            var objParam = new Object({});
                            objParam.name = 'internalid';
                            objParam.operator = 'ANYOF';
                            objParam.values = arrayArticulos;
                            arraySearchParams.push(objParam);

                            var objResultSet = utilities.searchSavedPro('customsearch_3k_componentes_art', arraySearchParams);
                            if (objResultSet.error) {
                                objRespuesta.error = true;
                                objRespuestaParcial = new Object({});
                                objRespuestaParcial.codigo = 'RCSA011';
                                objRespuestaParcial.mensaje = 'Error consultando componentes del Articulo';
                                objRespuesta.detalle.push(objRespuestaParcial);
                                //return objResultSet;
                            }

                            if (objRespuesta.error != true) {

                                var articulo = objResultSet.objRsponseFunction.array;

                                var arrayComponentes = [];

                                for (var j = 0; j < articulo.length; j++) {
                                    arrayComponentes.push(articulo[j]["ID Articulo Componente"]);
                                }
                                log.emergency('Consultar Stock Articulo', 'doPost arrayComponentes' + JSON.stringify(arrayComponentes));
                                var arraySearchParams = [];
                                var objParam = new Object({});
                                objParam.name = 'custrecord_3k_stock_terc_articulo';
                                objParam.operator = 'ANYOF';
                                objParam.values = arrayComponentes;
                                arraySearchParams.push(objParam);

                                var objParam1 = new Object({});
                                objParam1.name = 'custrecord_3k_stock_terc_sitio';
                                objParam1.operator = 'ANYOF';
                                objParam1.values = [body.sitio];
                                arraySearchParams.push(objParam1);

                                log.audit('before search call 31 : ', new Date());

                                var objResultSet = utilities.searchSavedPro('customsearch_3k_stock_terceros', arraySearchParams);
                            	//log.emergency('customsearch_3k_stock_terceros', JSON.stringify(objResultSet))    
                                log.audit('after search call 31 : ', new Date());

                                if (objResultSet.error) {
                                    objRespuesta.error = true;
                                    objRespuestaParcial = new Object({});
                                    objRespuestaParcial.codigo = 'RCSA012';
                                    objRespuestaParcial.mensaje = 'Error consultando stock terceros';
                                    objRespuesta.detalle.push(objRespuestaParcial);
                                    //return objResultSet;
                                }

                                if (objRespuesta.error != true) {

                                    var stockTerceros = objResultSet.objRsponseFunction.array;
                                    log.emergency('Consultar Stock Articulo', 'doPost stockTerceros' + JSON.stringify(stockTerceros));


                                    var arraySearchParams = new Array();
                                    var objParam = new Object({});
                                    objParam.name = 'custrecord_3k_ubicacion_sitio';
                                    objParam.operator = 'IS';
                                    objParam.values = [body.sitio];
                                    arraySearchParams.push(objParam);

                                    var objResultSet = utilities.searchSavedPro('customsearch_3k_ubicacion_sitio_web', arraySearchParams);
                                    if (objResultSet.error) {
                                        objRespuesta.error = true;
                                        objRespuestaParcial = new Object({});
                                        objRespuestaParcial.codigo = 'RCSA013';
                                        objRespuestaParcial.mensaje = 'Error consultando Ubicacion de Sitio Web';
                                        objRespuesta.detalle.push(objRespuestaParcial);
                                        //return objResultSet;
                                    }

                                    if (objRespuesta.error != true) {

                                        var resultUbicacion = objResultSet.objRsponseFunction.array;
                                        var ubicacion = resultUbicacion[0].internalid;
                                      log.emergency('ubicacion', ubicacion);

                                        var arraySearchParams = [];
                                        var objParam = new Object({});
                                        objParam.name = 'internalid';
                                        objParam.operator = 'ANYOF';
                                        objParam.values = arrayComponentes;
                                        arraySearchParams.push(objParam);

                                        var objParam1 = new Object({});
                                        objParam1.name = 'inventorylocation';
                                        objParam1.operator = 'IS';
                                        objParam1.values = [ubicacion];
                                        arraySearchParams.push(objParam1);

                                        var objResultSet = utilities.searchSavedPro('customsearch_3k_articulo_disponible', arraySearchParams);
                                        if (objResultSet.error) {
                                            objRespuesta.error = true;
                                            objRespuestaParcial = new Object({});
                                            objRespuestaParcial.codigo = 'RCSA014';
                                            objRespuestaParcial.mensaje = 'Error consultando disponibilidad del Articulo';
                                            objRespuesta.detalle.push(objRespuestaParcial);
                                            //return objResultSet;
                                        }

                                        if (objRespuesta.error != true) {

                                            var stockComponentes = objResultSet.objRsponseFunction.array;


                                            var arrayResult = [];

                                            var respDiasNoLab = funcionalidades.consultarDiasNoLoborables();

                                            //busqueda de configuracion de proveedor para stock propio

                                            var arraySearchParams = new Array();
                                            var objParam = new Object({});
                                            objParam.name = 'custrecord_74_cseg_3k_sitio_web_o';
                                            objParam.operator = 'IS';
                                            objParam.values = [body.sitio];
                                            arraySearchParams.push(objParam);

                                            var objResultSet = utilities.searchSavedPro('customsearch_3k_configuracion_stock_prop', arraySearchParams);
                                            if (objResultSet.error) {
                                                objRespuesta.error = true;
                                                objRespuestaParcial = new Object({});
                                                objRespuestaParcial.codigo = 'RCSA015';
                                                objRespuestaParcial.mensaje = 'Error consultando configuracion de Stock Propio';
                                                objRespuesta.detalle.push(objRespuestaParcial);
                                                //return objResultSet;
                                            }

                                            if (objRespuesta.error != true) {

                                                // INICIO - Obtener Dias Pedidos Proveedores
                                                var arrayDiasPedidoProveedor = new Array();

                                                var respDiasPedidosProv = funcionalidades.obtenerInformacionProveedores();

                                                if (!utilities.isEmpty(respDiasPedidosProv) && respDiasPedidosProv.error == false && respDiasPedidosProv.arrayDiasPedidoProveedor.length > 0) {
                                                    arrayDiasPedidoProveedor = respDiasPedidosProv.arrayDiasPedidoProveedor;
                                                } else {
                                                    if (utilities.isEmpty(respDiasPedidosProv)) {
                                                        objRespuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'SROV033';
                                                        respuestaParcial.mensaje = 'Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de la Consulta de Dias de Pedidos de Proveedores';
                                                        objRespuesta.detalle.push(respuestaParcial);
                                                    } else {
                                                        if (respDiasNoLab.error == true) {
                                                            objRespuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SROV033';
                                                            respuestaParcial.mensaje = 'Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - Error : ' + respDiasPedidosProv.tipoError + ' - Descripcion : ' + respDiasPedidosProv.mensaje;
                                                            objRespuesta.detalle.push(respuestaParcial);
                                                        } else {
                                                            objRespuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SROV033';
                                                            respuestaParcial.mensaje = 'Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de Array con Dias de Pedido de Proveedores';
                                                            objRespuesta.detalle.push(respuestaParcial);
                                                        }
                                                    }
                                                }
                                                // FIN - Obtener Dias Pedidos Proveedores

                                                if (objRespuesta.error != true) {

                                                    var configProveedor = objResultSet.objRsponseFunction.array;

                                                    for (var i = 0; i < informacion.length; i++) {
                                                        var objJSON = informacion[i];
                                                        var objResult = new Object({});
                                                        var arrayStockComponentes = [];

                                                        var isStockPropio = false;
                                                        var stockPropio = true;
                                                        var isService = false;
                                                        var tieneStock = false;

                                                        objResult.idArticulo = objJSON.idArticulo;
                                                        objResult.campanana = objJSON.campanana;

                                                        var articuloFilter = articulo.filter(function(obj) {
                                                            return (obj.internalid == objJSON.idArticulo);
                                                        });

                                                        if (!utilities.isEmpty(articuloFilter) && articuloFilter.length > 0) {
                                                            for (var j = 0; j < articuloFilter.length; j++) {

                                                                var idComponente = articuloFilter[j]["ID Articulo Componente"];
                                                                var cantidadComponente = articuloFilter[j]["Cantidad Componente"];


                                                                if (articuloFilter[0]["Articulo Principal Tipo Servicio"] == "N") {

                                                                    var componenteFilter = stockComponentes.filter(function(obj) {
                                                                        return (obj.internalid == idComponente);
                                                                    });

                                                                    //log.debug('Consultar Stock Articulo', 'doPost componenteFilter' + JSON.stringify(componenteFilter));

                                                                    if (!utilities.isEmpty(componenteFilter) && componenteFilter.length > 0) {

                                                                        var stockPropioDisponible = 0;
                                                                        isService = false;


                                                                        for (var k = 0; k < componenteFilter.length; k++) {

                                                                            var obj = new Object({});

                                                                            //obj.ubicacion = componenteFilter[k].location;
                                                                            //var ubicacion = componenteFilter[k].location;
                                                                            var stockPropioDisponibleXUbicacion = (!utilities.isEmpty(componenteFilter[k].locationquantityavailable) ? componenteFilter[k].locationquantityavailable : 0);
                                                                            //log.debug('Consultar Stock Articulo', 'doPost stockPropioDisponibleXUbicacion: ' + JSON.stringify(stockPropioDisponibleXUbicacion));
                                                                            //stockPropioDisponible = stockPropioDisponible + stockPropioDisponibleXUbicacion;
                                                                            //arrayStockComponentes.push(obj);
                                                                            if (stockPropioDisponibleXUbicacion > 0) {
                                                                                isStockPropio = true;
                                                                                var stockPropioArmable = Math.floor((stockPropioDisponibleXUbicacion / cantidadComponente));
                                                                                if (stockPropioArmable < 0) stockPropioArmable = 0;
                                                                                obj.stockPropioDisponibleXUbicacion = stockPropioArmable;
                                                                                obj.proveedor = configProveedor[0].custrecord_3k_config_stkp_prov;
                                                                                obj.fechaReparto = null;
                                                                                arrayStockComponentes.push(JSON.parse(JSON.stringify(obj)));
                                                                                tieneStock = true;


                                                                            } else {
                                                                                isStockPropio = false;
                                                                                stockPropio = false;
                                                                                //log.debug('Consultar Stock Articulo', 'doPost stockTerceros' + JSON.stringify(stockTerceros));
                                                                                var stockFilter = stockTerceros.filter(function(obj) {
                                                                                    //log.debug('Consultar Stock Articulo', 'doPost articuloFilter[j]["ID Articulo Componente"]: ' + JSON.stringify(articuloFilter[j]["ID Articulo Componente"]));
                                                                                    //log.debug('Consultar Stock Articulo', 'doPost articuloFilter[j]["ID Articulo Componente"]: ' + JSON.stringify(articuloFilter[j]["ID Articulo Componente"]));
                                                                                    return (obj["ID interno"] == articuloFilter[j]["ID Articulo Componente"]);
                                                                                });
                                                                                log.debug('Consultar Stock Articulo', 'doPost stockFilter' + JSON.stringify(stockFilter));
                                                                                log.emergency('Consultar Stock Articulo', 'doPost stockFilter' + JSON.stringify(stockFilter));
                                                                                if (!utilities.isEmpty(stockFilter) && stockFilter.length > 0) {
                                                                                    //var indice = 0;

                                                                                    for (var l = 0; l < stockFilter.length; l++) {
                                                                                        if (stockFilter[l]["Stock Disponible"] > 0) {
                                                                                            var stockPropioArmable = Math.floor((stockFilter[l]["Stock Disponible"] / cantidadComponente));
                                                                                            if (stockPropioArmable < 0) stockPropioArmable = 0;
                                                                                            obj.stockPropioDisponibleXUbicacion = stockPropioArmable;
                                                                                            obj.proveedor = stockFilter[l]["ID Proveedor"];
                                                                                            obj.fechaReparto = stockFilter[l].custrecord_3k_stock_terc_fecha_rep;
                                                                                            //ubicacion = stockFilter[l].custrecord_3k_stock_terc_sku_prov;
                                                                                            arrayStockComponentes.push(JSON.parse(JSON.stringify(obj)));
                                                                                            tieneStock = true;
                                                                                            break;
                                                                                        } else {

                                                                                            if (l == stockFilter.length - 1) {
                                                                                                tieneStock = false;
                                                                                                break;
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    tieneStock = false;
                                                                                    break;
                                                                                }

                                                                                if (!tieneStock) break;
                                                                            }
                                                                        }

                                                                        if (!tieneStock) break;


                                                                    }
                                                                } else {
                                                                    isService = true;
                                                                }
                                                            }
                                                        }

                                                        /*filterStock = arrayStockComponentes.filter(function(obj) {
                                                            return (obj.idArticulo == objJSON.idArticulo);
                                                        });*/
                                                        if (!isService) {
                                                            var arrayProveedor = [];
                                                            var cantidadMenor = 0;
                                                            log.debug('Consultar Stock Articulo', 'doPost arrayStockComponentes' + JSON.stringify(arrayStockComponentes));
                                                            for (var x = 0; x < arrayStockComponentes.length; x++) {
                                                                var objProveedor = new Object({});
                                                                objProveedor.Proveedor = arrayStockComponentes[x].proveedor;
                                                                objProveedor.FechaReparto = arrayStockComponentes[x].fechaReparto;

                                                                arrayProveedor.push(JSON.parse(JSON.stringify(objProveedor)));

                                                                var cantidadActual = arrayStockComponentes[x].stockPropioDisponibleXUbicacion;
                                                                if (x === 0) {
                                                                    cantidadMenor = cantidadActual;
                                                                } else {
                                                                    if (cantidadActual < cantidadMenor) {
                                                                        cantidadMenor = cantidadActual;
                                                                    }
                                                                }


                                                            }

                                                            log.debug('Consultar Stock Articulo', 'doPost arrayProveedor' + JSON.stringify(arrayProveedor));

                                                            var objResponse = new Object({});
                                                            objResponse.idArticulo = objJSON.idArticulo;
                                                            objResponse.cantidadDisponible = cantidadMenor;
                                                            objResponse.fecha = null;
                                                            if (tieneStock) {
                                                                var fechaCalculada = funcionalidades.calcularFecha(respDiasNoLab.arrayDiasNoLaborables, arrayProveedor, stockPropio, arrayDiasPedidoProveedor);
                                                                if (fechaCalculada.error) {
                                                                    objRespuesta.error = true;
                                                                    objRespuestaParcial = new Object({});
                                                                    objRespuestaParcial.codigo = 'RCSA017';
                                                                    objRespuestaParcial.mensaje = 'Error consultando fecha de disponibilidad de Articulo';
                                                                    objRespuesta.detalle.push(objRespuestaParcial);
                                                                    //return fechaCalculada;
                                                                }
                                                                if (objRespuesta.error != true) {
                                                                    objResponse.fecha = fechaCalculada.fechaBaseCalculo;
                                                                }

                                                                if (!stockPropio) {
                                                                    objResponse.idProveedor = arrayProveedor;
                                                                } else {
                                                                    objResponse.idProveedor = null;
                                                                }
                                                            } else {
                                                                objResponse.cantidadDisponible = 0;
                                                                objResponse.idProveedor = null;
                                                            }


                                                            objResponse.ubicacion = ubicacion;

                                                            arrayResult.push(JSON.parse(JSON.stringify(objResponse)));


                                                        }
                                                    } // FOR

                                                    objRespuesta.result = arrayResult;

                                                }

                                            }
                                        }
                                    }
                                }
                            }



                        } else {
                            objRespuesta.error = true;
                            objRespuestaParcial = new Object({});
                            objRespuestaParcial.codigo = 'RCSA001';
                            objRespuestaParcial.mensaje = 'No se puede parsear objectJSON.';
                            objRespuesta.detalle.push(objRespuestaParcial);
                            //objRespuesta.tipoError = 'RCSA001';
                            //objRespuesta.descripcion = 'No se puede parsear objectJSON.';
                            log.error('RCSA001', 'No se puede parsear objectJSON');
                        }
                    } else {
                        objRespuesta.error = true;
                        objRespuestaParcial = new Object({});
                        objRespuestaParcial.codigo = 'RCSA002';
                        objRespuestaParcial.mensaje = 'No se recibio parametro con informacion a realizar';
                        objRespuesta.detalle.push(objRespuestaParcial);
                        //objRespuesta.tipoError = 'RCSA002';
                        //objRespuesta.descripcion = 'No se recibio parametro con informacion a realizar';
                        log.error('RCSA002', 'No se recibio parametro con informacion a realizar');
                    }

                } catch (e) {
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object({});
                    objRespuestaParcial.codigo = 'RCSA003';
                    objRespuestaParcial.mensaje = 'Consulta Stock Articulo Excepcion: ' + e;
                    objRespuesta.detalle.push(objRespuestaParcial);
                    //objRespuesta.tipoError = 'RCSA003';
                    //objRespuesta.descripcion = 'Consulta Stock Articulo Excepcion: ' + e;
                    log.error('RCSA003', 'Consulta Stock Articulo Excepcion: ' + e);
                }

                var idRecord = record.submitFields({
                    type: 'customrecord_3k_consulta_stock_mid',
                    id: idRec,
                    values: {
                        custrecord_3k_consulstock_respuesta: JSON.stringify(objRespuesta)
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: false
                    }
                });
            }

            log.audit('Consulta Stock', 'FIN Consulta Stock');

            return JSON.stringify(objRespuesta);



        }

        return {
            afterSubmit: afterSubmit
        };

    });

/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/

define(['N/error', 'N/record', 'N/search', 'N/runtime', '3K/utilities', 'N/format'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */

    function(error, record, search, runtime, utilities, format) {

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
            
            if ((scriptContext.type == 'create') || (scriptContext.type == 'edit')){

                try {
                    log.audit('Creación OV (SS) - LINE 44', 'INICIO - BeforeSubmit');
                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 45', ' Tipo : Servidor - Evento : ' + scriptContext.type);


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

                    /************************************INICIO SE CREA ARREGLO DE ARTICULOS DE LA ORDEN DE VENTA PARA LUEGO PASARLO A SS************************************************************/
                    var objRecord = scriptContext.newRecord;
                    var arrayArticulos = [];
                    var arrayItems = [];

                    var id = objRecord.id

                    var ubicacion = objRecord.getValue({
                        fieldId: 'location'
                    });

                    var sitio = objRecord.getValue({
                        fieldId: 'custbody_cseg_3k_sitio_web_o'
                    });

                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 76', ' id: ' + id + ', ubicacion: ' + ubicacion + ', sitio: ' + sitio);

                    var numLines = objRecord.getLineCount({
                        sublistId: 'item'
                    });

                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 82', 'numLines: ' + numLines);

                    for (var i=0; !utilities.isEmpty(numLines) && i < numLines; i++){                        
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

                        log.debug('Creación OV (SS) - BeforeSubmit - LINE 112', 'objJSON.articulo: ' +JSON.stringify(objJSON.articulo));

                        arrayArticulos.push(objJSON.articulo);     
                        arrayItems.push(objJSON);                
                    }

                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 118', 'arrayArticulos: ' +JSON.stringify(arrayArticulos));
                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 119', 'arrayItems: ' +JSON.stringify(arrayItems));

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
                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 134', 'articulo array: ' + JSON.stringify(articulo));
                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 135', 'articulo.length: ' + articulo.length);
               
                    /************************************FIN SE CREA ARREGLO DE ARTICULOS DE LA ORDEN DE VENTA PARA LUEGO PASARLO A SS************************************************************/

                    /***************************INICIO SE CREA ARREGLO DE COMPONENTES PARA LUEGO PASARLO A SS DE BUSQUEDA DE STOCK TERCEROS Y STOCK PROPIO************************************************************/

                    var arrayComponentes = new Array();

                    for (var j = 0; j < articulo.length; j++) {
                        arrayComponentes.push(articulo[j]["ID Articulo Componente"]);
                    }

                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 147', 'arrayComponentes: ' + JSON.stringify(arrayComponentes));

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
                        mensajeError = objResultSet.descripcion.toString();
                    }

                    var stockTerceros = objResultSet.objRsponseFunction.array;

                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 170', 'stockTerceros: ' +JSON.stringify(stockTerceros));

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
                        mensajeError = objResultSet.descripcion.toString();
                    }

                    var stockComponentes = objResultSet.objRsponseFunction.array;

                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 193', 'stockComponentes: ' +JSON.stringify(stockComponentes));                

                    var arrayLineaPila = new Array();
                    var arrayOV = new Array();
                    
                    for (var i = 0; i < arrayItems.length; i++) {
                        if (!utilities.isEmpty(arrayItems[i].articulo)){
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

                            log.debug('Creación OV (SS) - BeforeSubmit - LINE 221', 'articuloFilter cantidad: ' + articuloFilter.length);
                            if (articuloFilter.length > 0 && !utilities.isEmpty(articuloFilter)) {
                                log.debug('Creación OV (SS) - BeforeSubmit - LINE 223', 'articuloFilter[0]["Articulo Principal Tipo Servicio"]: ' + articuloFilter[0]["Articulo Principal Tipo Servicio"]);

                                if (articuloFilter[0]["Articulo Principal Tipo Servicio"] == "N") {
                                    //informacion.orden[j].articulo = articuloFilter;
                                    var mainCategory = articuloFilter[0]["Main Category"];
                                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 228', 'mainCategory: ' + mainCategory + ' articuloFilter array: ' + JSON.stringify(articuloFilter));
                                    objLinea.mainCategory = mainCategory;
                                    for (var j = 0; j < articuloFilter.length; j++) {
                                        var cantidadStock = 0;

                                        objLinea.componente = articuloFilter[j]["ID Articulo Componente"];

                                        if (articuloFilter[j]["Articulo Componente Tipo Servicio"] == "N") {

                                            var componenteFilter = stockComponentes.filter(function (obj) {
                                                return (obj.internalid == articuloFilter[j]["ID Articulo Componente"]);
                                            });
                                            log.debug('Creación OV (SS) - BeforeSubmit - LINE 240', 'idComponente: ' + articuloFilter[j]["ID Articulo Componente"]);
                                            log.debug('Creación OV (SS) - BeforeSubmit - LINE 241', 'componenteFilter array: ' + JSON.stringify(componenteFilter));

                                            log.debug('Creación OV (SS) - BeforeSubmit - LINE 243', 'componenteFilter[0].quantityavailable: ' + componenteFilter[0].locationquantityavailable);
                                            if (componenteFilter[0].locationquantityavailable >= arrayItems[i].cantidad * articuloFilter[j]["Cantidad Componente"]) {
                                                //NO PILA
                                                objLinea.isStockPropio = true;
                                                var lineaFilter = arrayLinea.filter(function (obj) {
                                                    return (obj.articulo == arrayItems[i].articulo);
                                                });

                                                if (utilities.isEmpty(lineaFilter) || lineaFilter.length <= 0) {
                                                    //objLinea.pilas = pilas;
                                                    arrayLinea.push(JSON.parse(JSON.stringify(objLinea)));
                                                    arrayOV.push(JSON.parse(JSON.stringify(objLinea)));
                                                }             
                                                objLinea.cantidad = (arrayItems[i].cantidad * articuloFilter[j]["Cantidad Componente"]).toString();
                                                objLinea.cantidadComponente = articuloFilter[j]["Cantidad Componente"];
                                                //arrayLineaPila.push(JSON.parse(JSON.stringify(objLinea)));
                                                cantidadStock = stockComponentes[componenteFilter[0].indice].locationquantityavailable - (arrayItems[i].cantidad * articuloFilter[j]["Cantidad Componente"]);
                                                stockComponentes[componenteFilter[0].indice].locationquantityavailable = cantidadStock;                                   
                                                log.debug('Creación OV (SS) - BeforeSubmit - LINE 261', 'STOCK PROPIO - NO GENERA REQUISICION');
                                                //mensajeError = 'Item ' + arrayItems[i].articulo + ' con Stock Propio. No genera requisición';
                                            } else {
                                                //PILA
                                                if (componenteFilter[0].locationquantityavailable > 0) {
                                                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 266', 'STOCK PROPIO - NO GENERA REQUISICION');
                                                    //log.error('Creación OV (SS) - BeforeSubmit - LINE 244', 'No se pudo crear Orden de Venta por stock insuficiente para el articulo: ' + articuloFilter[j].internalid);
                                                    //mensajeError = 'Item ' + arrayItems[i].articulo + ' con Stock Propio. No genera requisición';
                                                } else {
                                                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 270', 'STOCK TERCERO - SI GENERA REQUISICION');
                                                    diferenciaStock = (arrayItems[i].cantidad * articuloFilter[j]["Cantidad Componente"]) - componenteFilter[0].locationquantityavailable;
                                                    var indice = 0;
                                                    var stockFilter = stockTerceros.filter(function (obj) {
                                                        return (obj["ID interno"] == articuloFilter[j]["ID Articulo Componente"]);
                                                    });
                                                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 276', 'stockFilter: ' + JSON.stringify(stockFilter));
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
                                                                    log.error('Creación OV (SS) - BeforeSubmit - LINE 287', 'No se pudo crear Orden de Venta por stock insuficiente para el articulo: ' + articuloFilter[j].internalid);
                                                                } else {
                                                                    insertarPila = false;
                                                                }
                                                            }
                                                            if (insertarPila) {
                                                                log.debug('Creación OV (SS) - BeforeSubmit - LINE 293', 'insertarPila');
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
                                                                log.debug('Creación OV (SS) - BeforeSubmit - LINE 308', 'Stock Propio insuficiente para el articulo: ' + articuloFilter[j].internalid + ', cantidadDisponible Stock Tercero: ' + stockFilter[indice]["Stock Disponible"]);
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
                                                        mensajeError = objRespuestaParcial.mensaje.toString();
                                                        objRespuesta.detalle.push(objRespuestaParcial);
                                                        log.error('Creación OV (SS) - BeforeSubmit - LINE 321', 'UCOV001 - Item ' + arrayItems[i].articuloDes + ' no posee Stock Propio ni Stock Tercero Vigente, por lo cual no genera Requisición de Compra.');
                                                    }
                                                } // end else pila
                                            } // end else cantidad stock propio < requerido -> posible pila 
                                        } else {                                            
                                            if (articuloFilter[j]["Articulo Componente Tipo Servicio"] == "S") {
                                                objLinea.isStockPropio = true;
                                                objLinea.componente = articuloFilter[j]["ID Articulo Componente"];
                                                //objLinea.cantidad = informacion.orden[i].cantidadTotalCupones.toString();
                                                objLinea.cantidad = (arrayItems[i].cantidad * articuloFilter[j]["Cantidad Componente"]).toString();
                                                objLinea.cantidadComponente = articuloFilter[j]["Cantidad Componente"];
                                                //objLinea.isService = true;
                                                //arrayLineaPila.push(JSON.parse(JSON.stringify(objLinea)));
                                            } else {
                                                objRespuesta.error = true;
                                                objRespuestaParcial = new Object();
                                                objRespuestaParcial.codigo = 'UCOV002';
                                                objRespuestaParcial.mensaje += 'Tipo de Articulo desconocido: ' + articuloFilter[j]["Articulo Componente Tipo Servicio"] + ' en el articulo: ' + articuloFilter[j].internalid + ' en el articulo componente: ' + articuloFilter[j]["ID Articulo Componente"];
                                                objRespuesta.detalle.push(objRespuestaParcial);
                                                //objRespuesta.tipoError = 'RORV011';
                                                //objRespuesta.message += 'Tipo de Articulo desconocido: ' + articuloFilter[j]["Articulo Componente Tipo Servicio"] + ' en el articulo: ' + articuloFilter[j].internalid + ' en el articulol componente: ' + articuloFilter[j]["ID Articulo Componente"];
                                                log.error('Creación OV (SS) - BeforeSubmit - LINE 342', 'UCOV002 - Tipo de Articulo desconocido: ' + articuloFilter[j]["Articulo Componente Tipo Servicio"] + ' en el articulo: ' + articuloFilter[j].internalid + ' en el articulo componente: ' + articuloFilter[j]["ID Articulo Componente"]);
                                                //return objRespuesta;
                                            }
                                        }
                                    } //end for
                                } else {
                                    if (articuloFilter[0]["Articulo Principal Tipo Servicio"] == "S") {
                                        objLinea.isStockPropio = true;
                                        objLinea.isService = true;
                                        objLinea.componente = articuloFilter[0]["ID Articulo Componente"];
                                        objLinea.cantidad = arrayItems[i].cantidad.toString();

                                        var lineaFilter = arrayLinea.filter(function (obj) {
                                            return (obj.articulo == arrayItems[i].articulo);
                                        });
                                        if (utilities.isEmpty(lineaFilter) || lineaFilter.length <= 0) {
                                            //objLinea.pilas = pilas;
                                            arrayLinea.push(JSON.parse(JSON.stringify(objLinea)));
                                            arrayOV.push(JSON.parse(JSON.stringify(objLinea)));
                                        }

                                        objLinea.cantidadComponente = articuloFilter[0]["Cantidad Componente"];
                                        //arrayLineaPila.push(JSON.parse(JSON.stringify(objLinea)));

                                    } else {
                                        objRespuesta.error = true;
                                        objRespuestaParcial = new Object();
                                        objRespuestaParcial.codigo = 'UCOV002';
                                        objRespuestaParcial.mensaje = 'Tipo de Articulo desconocido: ' + articuloFilter[0]["Articulo Principal Tipo Servicio"] + ' en el articulo: ' + articuloFilter[0].internalid;
                                        //mensajeError = objRespuestaParcial.mensaje.toString();
                                        objRespuesta.detalle.push(objRespuestaParcial);
                                        //objRespuesta.tipoError = 'RORV011';
                                        //objRespuesta.message += 'Tipo de Articulo desconocido: ' + articuloFilter[0]["Articulo Principal Tipo Servicio"] + ' en el articulo: ' + articuloFilter[0].internalid;
                                        log.error('Creación OV (SS) - BeforeSubmit - LINE 375', 'UCOV002 - Tipo de Articulo desconocido: ' + articuloFilter[0]["Articulo Principal Tipo Servicio"] + ' en el articulo: ' + articuloFilter[0].internalid);
                                        //return objRespuesta;
                                    }
                                }

                            }


                        }


                        for (var m = 0; m < arrayLinea.length; m++) {

                            //NUEVA LINEA
                            var lineNum = i;

                            //SE SETEAN LOS CAMPOS
                            objRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_stock_propio',
                                line: lineNum,
                                value: arrayLinea[m].isStockPropio
                            });

                            objRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_servicio',
                                line: lineNum,
                                value: arrayLinea[m].isService
                            });                        

                        }

                    }

                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 410', 'arrayLinea lineas OV: ' + JSON.stringify(arrayLinea));
                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 411', 'arrayLineaPila lineas requi: ' + JSON.stringify(arrayLineaPila));

                    var crearRequisiciones = creacionRequisiciones(objRecord,arrayLineaPila,fecha);

                } catch (excepcion) {
                    error = true;
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'UCOV003';
                    objRespuestaParcial.mensaje = excepcion;
                    objRespuesta.detalle.push(objRespuestaParcial);
                    //codigoError = 'SBOV005';
                    log.error('Creación OV (SS) - BeforeSubmit - LINE 423', 'UCOV003 - Excepcion Grabando Orden de Venta - Excepcion : ' + excepcion.message);
               
                }
                    
                log.debug('Creación OV (SS) - BeforeSubmit - LINE 427', 'error: ' + error);                
                log.debug('Creación OV (SS) - BeforeSubmit - LINE 128', 'mensajeError: ' + mensajeError);                
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

                    log.debug('Creación OV (SS) - BeforeSubmit - LINE 441', 'objRespuesta: ' +JSON.stringify(objRespuesta));
                    log.error('Creación OV (SS) - BeforeSubmit - LINE 442', 'OV PENDIENTE APROBACION - PENDING APPROVAL');
                } else {

                    objRecord.setValue({
                        fieldId: 'custbody_3k_netsuite_ov',
                        value: ''
                    });

                }

                log.audit('Creación OV (SS) - LINE 452', 'FIN - BeforeSubmit');

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
                
            if ((scriptContext.type == 'create') || (scriptContext.type == 'edit')) {

                try {
                //INICIO - Consultar la configuración de información de facturación genérica y setearla en la orden de venta si los datos de facturación vienen vacíos
                log.audit('Creación OV (SS) - LINE 486', 'INICIO - afterSubmit');                
                log.audit('Creación OV (SS) - afterSubmit - LINE 487', 'Tipo : Servidor - Evento : ' + scriptContext.type);
                /************************************INICIO SE CREA ARREGLO DE ARTICULOS DE LA ORDEN DE VENTA PARA LUEGO PASARLO A SS************************************************************/

                var recId = scriptContext.newRecord.id;
                var recType = scriptContext.newRecord.type;

                var objRecord = record.load({
                                type: recType, 
                                id: recId,
                                isDynamic: true,
                        });

                var idOV = objRecord.id;

                var dirOV = objRecord.getValue({
                    fieldId: 'billaddress'
                });


                log.debug('Creación OV (SS) - afterSubmit - LINE 506', 'idOV: ' + idOV + ', dirOV: ' + dirOV);

                //Si la dirección de facturación viene vacía, consultar en el SS la configuración de dirección de facturación genérica
                if (utilities.isEmpty(dirOV)){
                    var searchConfDomicilio = utilities.searchSavedPro('customsearch_3k_conf_dom_fact');
                    log.debug('Creación OV (SS) - afterSubmit - LINE 511', 'searchConfDomicilio: ' + JSON.stringify(searchConfDomicilio));

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

                            log.debug('Creación OV (SS) - afterSubmit - LINE 527', 'direccionGenerica: ' + direccionGenerica + ', ciudadGenerica: ' + ciudadGenerica);

                            var subrecord = objRecord.getSubrecord({
                                    fieldId: 'billingaddress'
                            });

                            log.debug('Creación OV (SS) - afterSubmit - LINE 533', 'subrecord: ' + JSON.stringify(subrecord));

                            subrecord.setValue({
                                fieldId: 'addr1',
                                value: direccionGenerica
                            });

                            subrecord.setValue({
                                fieldId: 'city',
                                value: ciudadGenerica
                            });
                            var idTmp = objRecord.save();
                        } else {
                            error = true;
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'UCOV004';
                            respuestaParcial.mensaje = 'Error Consultando Domicilio Generico de Facturacion - Error : No se encontro la Configuracion Generica de Domicilio de Facturacion';
                            mensajeError = respuestaParcial.mensaje.toString();
                            respuesta.detalle.push(respuestaParcial);
                            log.error('Creación OV (SS) - afterSubmit - LINE 553', 'UCOV004 - Error Consultando Domicilio Generico de Facturacion - Error : No se encontro la Configuracion Generica de Domicilio de Facturacion');                           
                        }
                    } else {
                        if (utilities.isEmpty(searchConfDomicilio)) {
                            error = true;
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'UCOV005';
                            respuestaParcial.mensaje = 'Error Consultando Domicilio Generico de Facturacion - Error : No se recibio Respuesta del Proceso de Busqueda del Domicilio Generico de Facturacion';
                            mensajeError = respuestaParcial.mensaje.toString();
                            respuesta.detalle.push(respuestaParcial);
                            log.error('Creación OV (SS) - afterSubmit - LINE 564', 'UCOV005 - Error Consultando Domicilio Generico de Facturacion - Error : No se recibio Respuesta del Proceso de Busqueda del Domicilio Generico de Facturacion');                           
                        } else {
                            error = true;
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'UCOV006';
                            respuestaParcial.mensaje = 'Error Consultando Domicilio Generico de Facturacion - Error : ' + searchConfDomicilio.tipoError + ' - Descripcion : ' + searchConfDomicilio.descripcion;
                            mensajeError = respuestaParcial.mensaje.toString();
                            respuesta.detalle.push(respuestaParcial);
                            log.error('Creación OV (SS) - afterSubmit - LINE 573', 'UCOV006 - Consultando Domicilio Generico de Facturacion - Error : ' + searchConfDomicilio.tipoError + ' - Descripcion : ' + searchConfDomicilio.descripcion);                           
                        }
                    }

                }

                //FIN - Consultar la configuración de información de facturación genérica y setearla en la orden de venta si los datos de facturación vienen vacíos

                //INICIO - Cálculo y actualización de la fecha de entrega de proveedor.

                var numLines = objRecord.getLineCount({
                    sublistId: 'item'
                });

                log.debug('Creación OV (SS) - afterSubmit - LINE 587', 'numLines: ' + numLines);

                for (var i=0; !utilities.isEmpty(numLines) && i < numLines; i++){                        
                    var objJSON = new Object({});

                    objJSON.articulo = objRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });

                    arrayArticulos.push(objJSON);     
                }

                log.debug('Creación OV (SS) - afterSubmit - LINE 601', 'arrayArticulos: ' +JSON.stringify(arrayArticulos));


               // INICIO - Obtener Dias Pedidos Proveedores
                var arrayDiasPedidoProveedor = new Array();

                var respDiasPedidosProv = obtenerInformacionProveedores();

                if (!utilities.isEmpty(respDiasPedidosProv) && respDiasPedidosProv.error == false && respDiasPedidosProv.arrayDiasPedidoProveedor.length > 0) {
                    arrayDiasPedidoProveedor = respDiasPedidosProv.arrayDiasPedidoProveedor;
                } else {
                    if (utilities.isEmpty(respDiasPedidosProv)) {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'UCOV007';
                        respuestaParcial.mensaje = 'Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de la Consulta de Dias de Pedidos de Proveedores';
                        log.error('Creación OV (SS) - afterSubmit - LINE 617', 'UCOV007 - Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de la Consulta de Dias de Pedidos de Proveedores');                                                   
                        mensajeError = respuestaParcial.mensaje.toString();
                        respuesta.detalle.push(respuestaParcial);
                    } else {
                        if (respDiasNoLab.error == true) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'UCOV007';
                            respuestaParcial.mensaje = 'Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - Error : ' + respDiasPedidosProv.tipoError + ' - Descripcion : ' + respDiasPedidosProv.mensaje;
                            log.error('Creación OV (SS) - afterSubmit - LINE 626', 'UCOV007 - Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - Error : ' + respDiasPedidosProv.tipoError + ' - Descripcion : ' + respDiasPedidosProv.mensaje);                                                                               
                            mensajeError = respuestaParcial.mensaje.toString();
                            respuesta.detalle.push(respuestaParcial);
                        } else {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'UCOV007';
                            respuestaParcial.mensaje = 'Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de Array con Dias de Pedido de Proveedores';
                            log.error('Creación OV (SS) - afterSubmit - LINE 634', 'UCOV007 - Error Obteniendo Dias de Pedidos de los Proveedores para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de Array con Dias de Pedido de Proveedores');                                                                               
                            mensajeError = respuestaParcial.mensaje.toString();
                            respuesta.detalle.push(respuestaParcial);
                        }
                    }
                    //return respuesta;
                }
                // FIN - Obtener Dias Pedidos Proveedores
                //log.debug('Creación OV (SS) - LINE 362', 'AfterSubmit - arrayDiasPedidoProveedor: ' + JSON.stringify(arrayDiasPedidoProveedor));
                log.debug('Creación OV (SS) - afterSubmit - LINE 643', 'arrayDiasPedidoProveedor.length: ' + JSON.stringify(arrayDiasPedidoProveedor.length));

                // INICIO - Obtener Array de Dias No Laborables
                var respDiasNoLab = consultarDiasNoLoborables();


                if (!utilities.isEmpty(respDiasNoLab) && respDiasNoLab.error == false && respDiasNoLab.arrayDiasNoLaborables.length > 0) {
                    arrayDiasNoLaborables = respDiasNoLab.arrayDiasNoLaborables;
                } else {
                    if (utilities.isEmpty(respDiasNoLab)) {
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'UCOV008';
                        respuestaParcial.mensaje = 'Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de la Consulta de Dias No Laborables';
                        log.error('Creación OV (SS) - afterSubmit - LINE 657', 'UCOV008 - Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de la Consulta de Dias No Laborables');                                                                               
                        mensajeError = respuestaParcial.mensaje.toString();
                        respuesta.detalle.push(respuestaParcial);
                    } else {
                        if (respDiasNoLab.error == true) {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'UCOV008';
                            respuestaParcial.mensaje = 'Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - Error : ' + respDiasNoLab.tipoError + ' - Descripcion : ' + respDiasNoLab.mensaje;
                            log.error('Creación OV (SS) - afterSubmit - LINE 666', 'UCOV008 - Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - Error : ' + respDiasNoLab.tipoError + ' - Descripcion : ' + respDiasNoLab.mensaje);                                                                                                           
                            mensajeError = respuestaParcial.mensaje.toString();
                            respuesta.detalle.push(respuestaParcial);
                        } else {
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'UCOV008';
                            respuestaParcial.mensaje = 'Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de Array con Dias No Laborables';
                            log.error('Creación OV (SS) - afterSubmit - LINE 674', 'UCOV008 - Error Obteniendo Calendario de Dias No Laborables para la Orden de Venta con ID Interno : ' + idOV + ' - No se Recibio Informacion de Array con Dias No Laborables');                                                                                                           
                            mensajeError = respuestaParcial.mensaje.toString();
                            respuesta.detalle.push(respuestaParcial);
                        }
                    }
                    //return respuesta;
                }

                //log.debug('Creación OV (SS) - LINE 396', 'AfterSubmit - arrayDiasNoLaborables: ' + JSON.stringify(arrayDiasNoLaborables));
                log.debug('Creación OV (SS) - afterSubmit - LINE 683', 'arrayDiasNoLaborables.length: ' + JSON.stringify(arrayDiasNoLaborables.length));
                //FIN - Cálculo y actualización de la fecha de entrega de proveedor.
                log.debug('Creación OV (SS) - afterSubmit - LINE 685', 'idOV: ' + idOV)
                if (!utilities.isEmpty(idOV)) {

                        var objRecord = record.load({
                            type: record.Type.SALES_ORDER,
                            id: idOV,
                            isDynamic: true
                        });

                    // INICIO GENERAR AJUSTE POR REDONDEO

                    var respuestaAjusteRedondeo = generarAjusteRedondeo(idOV, objRecord);

                    log.debug('Creación OV (SS) - afterSubmit - LINE 698', 'respuestaAjusteRedondeo: ' + JSON.stringify(respuestaAjusteRedondeo));
                    // FIN GENERAR AJUSTE POR REDONDEO
                    if (respuestaAjusteRedondeo.error != true) {
                        //objRecord = respuestaAjusteRedondeo.registro;
                        log.debug('Creación OV (SS) - afterSubmit - LINE 702', 'objRecord: ' + JSON.stringify(objRecord));
                        if (!utilities.isEmpty(objRecord)) {
                            var cantidadLineasOV = objRecord.getLineCount({
                                sublistId: 'item'
                            });
                            var cantidadLineasREQ = objRecord.getLineCount({
                                sublistId: 'recmachcustrecord_3k_req_compra_ov'
                            });

                            log.audit('Creación OV (SS) - afterSubmit - LINE 711', 'cantidadLineasOV: ' + cantidadLineasOV + ', cantidadLineasREQ: ' + cantidadLineasREQ);

                            if (cantidadLineasOV > 0 && cantidadLineasREQ > 0) {
                                // INICIO ACTUALIZAR REQUISICIONES
                                log.audit('Creación OV (SS) - afterSubmit - LINE 715', 'INICIO Actualizar Requisiciones');

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
                                                log.debug('Creación OV (SS) - afterSubmit - LINE 784', 'objDetalleProv: ' + JSON.stringify(objDetalleProv));
                                                log.debug('Creación OV (SS) - afterSubmit - LINE 785', 'arrayProveedores: ' + JSON.stringify(arrayProveedores));
                                                log.debug('Creación OV (SS) - afterSubmit - LINE 786', 'stockPropio: ' + JSON.stringify(stockPropio));

                                                var objFechaEntrega = calcularFecha(arrayDiasNoLaborables, arrayProveedores, stockPropio, arrayDiasPedidoProveedor);
                                                log.debug('Creación OV (SS) - afterSubmit - LINE 789', 'objFechaEntrega: ' + JSON.stringify(objFechaEntrega));

                                                if (!utilities.isEmpty(objFechaEntrega) && objFechaEntrega.error == false) {
                                                    if (!utilities.isEmpty(objFechaEntrega.fechaBaseCalculo)) {
                                                        fechaEntrega = objFechaEntrega.fechaBaseCalculo;
                                                    } else {
                                                        errorOV = true;
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'UCOV009';
                                                        respuestaParcial.mensaje = 'No se recibio fecha del proceso de calculo de fecha de entrega para el Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV;
                                                        log.error('Creación OV (SS) - afterSubmit - LINE 800', 'UCOV009 - No se recibio fecha del proceso de calculo de fecha de entrega para el Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV);                                                                                                                                                                   
                                                        //mensajeError = respuestaParcial.mensaje.toString();
                                                        respuesta.detalle.push(respuestaParcial);
                                                    }
                                                } else {
                                                    if (utilities.isEmpty(objFechaEntrega)) {
                                                        errorOV = true;
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'UCOV010';
                                                        respuestaParcial.mensaje = 'No se recibio objeto de respuesta del proceso de calculo de fecha de entrega para el Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV;
                                                        log.error('Creación OV (SS) - afterSubmit - LINE 811', 'UCOV010 - No se recibio objeto de respuesta del proceso de calculo de fecha de entrega para el Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV);                                                                                                                                                                                                                           
                                                        //mensajeError = respuestaParcial.mensaje.toString();
                                                        respuesta.detalle.push(respuestaParcial);
                                                    } else {
                                                        errorOV = true;
                                                        respuesta.error = true;
                                                        respuestaParcial = new Object();
                                                        respuestaParcial.codigo = 'UCOV011';
                                                        respuestaParcial.mensaje = 'Error calculando fecha de entrega para el Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV + ' - Tipo Error : ' + objFechaEntrega.tipoError + ' - Descripcion : ' + objFechaEntrega.descripcion;
                                                        log.error('Creación OV (SS) - afterSubmit - LINE 820', 'UCOV011 - Error calculando fecha de entrega para el Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV + ' - Tipo Error : ' + objFechaEntrega.tipoError + ' - Descripcion : ' + objFechaEntrega.descripcion);                                                                                                                                                                                                                           
                                                        //mensajeError = respuestaParcial.mensaje.toString();
                                                        respuesta.detalle.push(respuestaParcial);
                                                    }
                                                }

                                            } else {
                                                errorOV = true;
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'UCOV012';
                                                respuestaParcial.mensaje = 'No se encontraron Proveedores para el Articulo con ID Interno : ' + IDArticulo + '. Para configurar la Orden de Venta con ID Interno : ' + idOV;
                                                log.error('Creación OV (SS) - afterSubmit - LINE 832', 'UCOV012 - No se encontraron Proveedores para el Articulo con ID Interno : ' + IDArticulo + '. Para configurar la Orden de Venta con ID Interno : ' + idOV);                                                                                                                                                                                                                           
                                                mensajeError = respuestaParcial.mensaje.toString();
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
                                                //respuesta.error = true;
                                                var mensaje = 'No se pudo Obtener la siguiente información Para configurar la Requisicion con ID Interno : ' + IDInterno + ' : ';
                                                if (utilities.isEmpty(IDArticulo)) {
                                                    mensaje = mensaje + ' ID Interno del Articulo / ';
                                                }
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'UCOV013';
                                                respuestaParcial.mensaje = mensaje;
                                                //mensajeError = respuestaParcial.mensaje.toString();
                                                log.error('Creación OV (SS) - afterSubmit - LINE 870', 'UCOV013 - ' + mensaje);                                                                                                                                                                                                                           
                                                respuesta.detalle.push(respuestaParcial);
                                            }

                                    }

                                    log.audit('Creación OV (SS) - afterSubmit - LINE 876', 'FIN Actualizar Requisiciones');

                                    // FIN ACTUALIZAR REQUISICIONES          

                                    // INICIO ACTUALIZAR LINEAS OV

                                    var errorOV = false;
                                    //var indiceVoucher = 0;

                                    log.audit('Creación OV (SS) - afterSubmit - LINE 885', 'INICIO Actualizar Lineas OV');
                                    log.debug('Creación OV (SS) - afterSubmit - LINE 886', 'arrayFechasProv: ' +JSON.stringify(arrayFechasProv));

                                    for (var i = 0; i < cantidadLineasOV && errorREQ == false; i++) {

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

                                            log.debug('Creación OV (SS) - afterSubmit - LINE 910', 'IDArticulo: ' + IDArticulo);

                                            if (!utilities.isEmpty(IDArticulo)) {
                                                var objLineaOV = arrayArticulos.filter(function (obj) {
                                                    return (obj.articulo == IDArticulo);
                                                });

                                                log.debug('Creación OV (SS) - afterSubmit - LINE 917', 'objLineaOV: ' +JSON.stringify(objLineaOV));

                                                if (!utilities.isEmpty(objLineaOV) && objLineaOV.length > 0) {
                                                
                                                        var objFechas = arrayFechasProv.filter(function (obj) {
                                                            return (obj.item == IDArticulo);
                                                        });

                                                        log.debug('Creación OV (SS) - afterSubmit - LINE 925', 'objFechas: ' +JSON.stringify(objFechas));                                        


                                                        if (!utilities.isEmpty(objFechas) && objFechas.length > 0) {

                                                            fechaEntrega = objFechas[objFechas.length - 1].fecha;
                                        
                                                            log.debug('Creación OV (SS) - afterSubmit - LINE 932', 'fechaEntrega: ' + fechaEntrega);

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
                                                    errorOV = true;
                                                    respuesta.error = true;
                                                    respuestaParcial = new Object();
                                                    respuestaParcial.codigo = 'UCOV014';
                                                    respuestaParcial.mensaje = 'No se puede encontrar la informacion del Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV;
                                                    //mensajeError = respuestaParcial.mensaje.toString();
                                                    log.error('Creación OV (SS) - afterSubmit - LINE 955', 'UCOV014 - No se puede encontrar la informacion del Articulo con ID Interno : ' + IDArticulo + ' Para configurar la Orden de Venta con ID Interno : ' + idOV);                                                                                                                                                                                                                                                   
                                                    respuesta.detalle.push(respuestaParcial);
                                                }
                                            } else {
                                                errorOV = true;
                                                respuesta.error = true;
                                                var mensaje = 'No se pudo Obtener la siguiente información Para configurar la Orden de Venta con ID Interno : ' + idOV + ' Numero de Linea : ' + i + 1 + ' : ';
                                                if (utilities.isEmpty(IDArticulo)) {
                                                    mensaje = mensaje + ' ID Interno del Articulo / ';
                                                }
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'UCOV015';
                                                respuestaParcial.mensaje = mensaje;
                                                //mensajeError = respuestaParcial.mensaje.toString();
                                                log.error('Creación OV (SS) - afterSubmit - LINE 969', 'UCOV015 - ' + mensaje);                                                                                                                                                                                                                                                   
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                        }
                                    }

                                    log.audit('Creación OV (SS) - afterSubmit - LINE 976', 'FIN Actualizar Lineas OV');

                                    // FIN ACTUALIZAR LINEAS OV

                                    // INICIO GRABAR OV
                                    if (respuesta.error == false) {
                                        // GRABAR ORDEN DE VENTA
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
                                            log.error('Creación OV (SS) - afterSubmit - LINE 993', 'UCOV016 -Excepcion Actualizando Orden de Venta con ID Interno : ' + idOV + ' - Excepcion : ' + excepcionSave.message);                                                                                                                                                                                                                                                                                               
                                            //mensajeError = respuestaParcial.mensaje.toString();
                                            respuesta.detalle.push(respuestaParcial);
                                        }
                                        if (utilities.isEmpty(recordId)) {
                                            error = true;
                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'UCOV017';
                                            respuestaParcial.mensaje = 'Error No se recibio el ID Interno de la Orden de Venta Actualizada';
                                            log.error('Creación OV (SS) - afterSubmit - LINE 1003', 'UCOV017 -Error No se recibio el ID Interno de la Orden de Venta Actualizada');                                                                                                                                                                                                                                                                                                                                           
                                            //mensajeError = respuestaParcial.mensaje.toString();
                                            respuesta.detalle.push(respuestaParcial);
                                        }
                                        //log.audit('Generación Orden de Venta - After Submit', 'Importe Total OV : ' + importeTotalOrdenDeVenta + ' - Importe Total Voucher Devolucion : ' + importeTotalVouchers);
                                    }
                                    // FIN GRABAR OV
                            }
                        }

                    } else {
                        error = true;
                        mensajeError = respuestaAjusteRedondeo.mensajeError;
                        respuesta = respuestaAjusteRedondeo;
                    }
                }

                //var idTmp = objRecord.save();

            } catch (excepcion) {
                error = true;
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'UCOV018';
                respuestaParcial.mensaje += excepcion;
                //mensajeError = respuestaParcial.mensaje.toString();
                respuesta.detalle.push(respuestaParcial);
                log.error('Creación OV (SS) - afterSubmit - LINE 1030', 'UCOV018 - Excepcion : ' + excepcion);                                                                                                                                                                                                                                                                                               
                //codigoError = 'SBOV005';
                //mensajeError = 'Excepcion Grabando Orden de Venta con ID Interno : ' + respuesta.idOV + ' Excepcion : ' + excepcion.message;
            }

            log.debug('Creación OV (SS) - afterSubmit - LINE 1035', 'error: ' + error);                

            if (error == true) {
                // SI HUBO ALGUN ERROR, GENERAR LA OV CON ESTADO "APROBACION PENDIENTE"
                /*objRecord.setValue({
                    fieldId: 'orderstatus',
                    value: 'A'
                });

                objRecord.setValue({
                    fieldId: 'custbody_3k_netsuite_ov',
                    value: mensajeError
                });*/

                    var idOVActualizada = record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: idOV,
                        values: {
                            orderstatus: 'A',
                            custbody_3k_netsuite_ov: mensajeError
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });

                log.debug('Creación OV (SS) - afterSubmit - LINEA 1062', 'respuesta: ' +JSON.stringify(respuesta));
                log.error('Creación OV (SS) - afterSubmit - LINEA 1063', 'OV PENDIENTE APROBACION - PENDING APPROVAL');
            }  else {

                    var idOVActualizada = record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: idOV,
                        values: {
                            custbody_3k_netsuite_ov: ''
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                    
            }

            log.audit('Creación OV (SS) - LINE 1080', 'FIN - afterSubmit');       

            }         
        }

        function obtenerInformacionProveedores() {

            log.debug('obtenerInformacionProveedores - LINE 1087', 'INICIO');

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
                log.error('obtenerInformacionProveedores - LINE 1126', 'UDPP001 - ' + mensaje);
            }

            log.debug('obtenerInformacionProveedores - LINE 1129', 'FIN');
            return respuesta;
        }

        function consultarDiasNoLoborables() {

            log.audit('consultarDiasNoLoborables - LINE 1135', 'INICIO');

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
                log.error('obtenerInformacionProveedores - LINE 1150', 'UDNL001 - Error Obteniendo Calendario de Dias No Laborables - Tipo Error : ' + objResultSet.tipoError + ' - Descripcion : ' + objResultSet.descripcion);

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

            log.audit('consultarDiasNoLoborables - LINEA 1184', 'FIN');
            return respuesta;
            // FIN - Obtener Array de Dias No Laborables
        }

        function generarAjusteRedondeo(idOV, registro) {

            log.audit('generarAjusteRedondeo - LINEA 1191', 'INICIO');
            log.debug('generarAjusteRedondeo - LINEA 1192', 'Parámetros - idOV: ' + idOV + ', registro: ' + JSON.stringify(registro));

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
                        var importeTotalOVWOOW = objRecord.getValue({
                            fieldId: 'custbody_3k_imp_total_woow'
                        });

                        var cantidadLineasOV = objRecord.getLineCount({
                            sublistId: 'item'
                        });
                
                        log.debug('generarAjusteRedondeo - LINEA 1234', 'importeTotalOVNS: ' +importeTotalOVNS + ', importeTotalOVWOOW: ' + importeTotalOVWOOW + ', cantidadLineasOV: ' + cantidadLineasOV);

                        if (utilities.isEmpty(importeTotalOVWOOW) || isNaN(parseFloat(importeTotalOVWOOW))) {
                            importeTotalOVWOOW = 0.00;
                        }

                        if (!utilities.isEmpty(importeTotalOVNS) && !isNaN(parseFloat(importeTotalOVNS)) && !utilities.isEmpty(importeTotalOVWOOW) && !isNaN(parseFloat(importeTotalOVWOOW))) {

                            var diferenciaImporte = (parseFloat(importeTotalOVWOOW)) - parseFloat(importeTotalOVNS);
                            log.debug('generarAjusteRedondeo - LINEA 1243', 'diferenciaImporte: ' + diferenciaImporte);
                            var eliminoLineaRedondeo = false;
                            if (parseFloat(diferenciaImporte) != 0.00) {

                                if (cantidadLineasOV > 0) {
                                    for (var i = 0; i < cantidadLineasOV; i++) {

                                        // INICIO ELIMINAR LINEAS DE REDONDEO

                                        log.debug('generarAjusteRedondeo - LINEA 1252', 'i antes de delete: ' + i);
                                        log.debug('generarAjusteRedondeo - LINEA 1253', 'cantidadLineasOV antes de delete: ' + cantidadLineasOV);

                                        var esRedondeo = objRecord.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_3k_es_redondeo',
                                            line: i
                                        });

                                        log.debug('generarAjusteRedondeo - LINEA 1261', 'esRedondeo: ' + esRedondeo);

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

                                            log.debug('generarAjusteRedondeo - LINEA 1301', 'i despues de delete: ' + i);
                                            log.debug('generarAjusteRedondeo - LINEA 1302', 'cantidadLineasOV despues de delete: ' + cantidadLineasOV);
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

                                            log.debug('generarAjusteRedondeo - LINEA 1350', ' diferenciaImporte: ' + diferenciaImporte + ', topeMaximo: ' + topeMaximo);

                                            if (Math.abs(diferenciaImporte) < topeMaximo) {

                                                objRecord.selectNewLine({
                                                    sublistId: 'item'
                                                });

                                                log.debug('generarAjusteRedondeo - LINEA 1358', 'articuloUtilizar: ' + articuloUtilizar);

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

                                                log.debug('generarAjusteRedondeo - LINEA 1372', 'diferenciaImporte: ' + diferenciaImporte);

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

                                                        log.debug('generarAjusteRedondeo - LINEA 1401', 'diferenciaImporte: ' + objRespuesta.importeTotalOV);

                                                        var recordId = objRecord.save();

                                                    } catch (excepcionGrabarOV) {
                                                        objRespuesta.error = true;
                                                        objRespuestaParcial = new Object({});
                                                        objRespuestaParcial.codigo = 'UGAR001';
                                                        objRespuestaParcial.mensaje = 'Error: Excepcion Grabando Ajuste por Redondeo - Excepcion : ' + excepcionGrabarOV.message.toString();
                                                        //objRespuesta.mensajeError = objRespuestaParcial.mensaje.toString();
                                                        objRespuesta.detalle.push(objRespuestaParcial);
                                                        log.error('generarAjusteRedondeo - LINE 1412', 'UGAR001 - Error: Excepcion Grabando Ajuste por Redondeo - Excepcion : ' + excepcionGrabarOV.message);
                                                    }

                                                } else {
                                                    objRespuesta.registro = registro;
                                                }

                                            } else {
                                                //error
                                                objRespuesta.error = true;
                                                objRespuestaParcial = new Object({});
                                                objRespuestaParcial.codigo = 'UGAR002';
                                                objRespuestaParcial.mensaje = 'Error generando Ajuste de Redondeo. El ajuste por redondeo ' + diferenciaImporte.toFixed(2) + ', es mayor al tope maximo permitido: ' + topeMaximo;
                                                objRespuesta.mensajeError = objRespuestaParcial.mensaje.toString();
                                                objRespuesta.detalle.push(objRespuestaParcial);
                                                log.error('generarAjusteRedondeo - LINE - 1427', 'UGAR002 - Error generando Ajuste de Redondeo. El ajuste por redondeo ' + diferenciaImporte.toFixed(2) + ', es mayor al tope maximo permitido: ' + topeMaximo);
                                            }
                                        } else {
                                            objRespuesta.error = true;
                                            objRespuestaParcial = new Object({});
                                            objRespuestaParcial.codigo = 'UGAR003';
                                            objRespuestaParcial.mensaje = 'Error generando Ajuste de Redondeo. No se encuentra realizada la configuración de Articulos de Redondeo.';
                                            objRespuesta.mensajeError = objRespuestaParcial.mensaje.toString();
                                            objRespuesta.detalle.push(objRespuestaParcial);
                                            log.error('generarAjusteRedondeo - LINE 1436', 'UGAR003 - Error generando Ajuste de Redondeo. No se encuentra realizada la configuración de Articulos de Redondeo.');
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
                                                //objRespuesta.mensajeError = objRespuestaParcial.mensaje.toString();
                                                objRespuesta.detalle.push(objRespuestaParcial);
                                                log.error('generarAjusteRedondeo - LINE 1460', 'UGAR004 - Error generando Ajuste de Redondeo. Excepcion Grabando Ajuste por Redondeo - Excepcion : ' + excepcionGrabarOV.message);
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
                                    objRespuesta.mensajeError = objRespuestaParcial.mensaje.toString();
                                    objRespuesta.detalle.push(objRespuestaParcial);
                                    log.error('generarAjusteRedondeo - LINE 1474', 'UGAR005 - Error generando Ajuste de Redondeo. No se detectaron lineas en la Orden de Venta.');
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
                            //objRespuesta.mensajeError = objRespuestaParcial.mensaje.toString();
                            objRespuesta.detalle.push(objRespuestaParcial);
                            log.error('generarAjusteRedondeo - LINE 1496', 'UGAR006 - Error generando Ajuste de Redondeo. Error Obteniendo Montos Totales de la Orden de Venta');
                        }


                    } else {
                        objRespuesta.error = true;
                        objRespuestaParcial = new Object({});
                        objRespuestaParcial.codigo = 'UGAR007';
                        objRespuestaParcial.mensaje = 'Error generando Ajuste de Redondeo. Error Cargando la Orden de Venta';
                        //objRespuesta.mensajeError = objRespuestaParcial.mensaje.toString();
                        objRespuesta.detalle.push(objRespuestaParcial);
                        log.error('generarAjusteRedondeo - LINE 1507', 'UGAR007 - Error generando Ajuste de Redondeo. Error Cargando la Orden de Venta');
                    }

                } else {
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object({});
                    objRespuestaParcial.codigo = 'UGAR008';
                    objRespuestaParcial.mensaje = 'Error generando Ajuste de Redondeo. No se recibio registro de Orden de Venta';
                    //objRespuesta.mensajeError = objRespuestaParcial.mensaje.toString();
                    objRespuesta.detalle.push(objRespuestaParcial);
                    log.error('generarAjusteRedondeo - LINE 1517', 'UGAR008 - Error generando Ajuste de Redondeo. No se recibio registro de Orden de Venta');
                }

            } catch (excepcion) {
                objRespuesta.error = true;
                objRespuestaParcial = new Object({});
                objRespuestaParcial.codigo = 'UGAR009';
                objRespuestaParcial.mensaje = 'Error generando Ajuste de Redondeo. Excepcion Generando Ajuste por Redondeo - Excepcion : ' + excepcion.message.toString();;
                //objRespuesta.mensajeError = objRespuestaParcial.mensaje.toString();
                objRespuesta.detalle.push(objRespuestaParcial);
                log.error('generarAjusteRedondeo - LINE 1527', 'UGAR009 - Error generando Ajuste de Redondeo. Excepcion Generando Ajuste por Redondeo - Excepcion : ' + excepcion.message);
            }

            log.audit('generarAjusteRedondeo - LINE 1530', 'FIN');
            return objRespuesta;
        }

        function creacionRequisiciones(rec, arrayLinea, fecha) {
            /******************INCIO INSERTAR A TRAVES DE RECMACH REQUISICIONES*******************************************************************/
            /*SOLO SE CREARAN REQUISICIONES DE ITEM DE INVENTARIO QUE NO TENGAN STOCK PROPIO Y TENGAN STOCK TERCERO VIGENTE*/
            log.audit('creacionRequisiciones - LINE 1537', 'INICIO');
            log.debug('creacionRequisiciones - LINE 1538', 'Parámetros - rec: ' + JSON.stringify(rec));
            log.debug('creacionRequisiciones - LINE 1539', 'Parámetros - arrayLinea: ' + JSON.stringify(arrayLinea) + ', fecha: ' + fecha);

            var objRespuesta = new Object();
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();

            try {

                for (var i = 0; i < arrayLinea.length; i++) {
                    log.debug('creacionRequisiciones - LINE 1548', 'arrayLinea: '+ JSON.stringify(arrayLinea[i]));

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
                log.error('creacionRequisiciones - LINE 1617', 'UCRQ001 - Error creando Requisicion. Excepcion :' + excepcion);
                /*objRespuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'UCRQ001';
                objRespuestaParcial.mensaje = 'Error creando Requisición: ' + excepcion;
                objRespuesta.detalle.push(objRespuestaParcial);*/
            }

            log.audit('creacionRequisiciones - LINE 1625', 'FIN');
        }

        function calcularFecha(arrayDiasNoLaborales, arrayProveedor, stockPropio, arrayDiasEntregaProveedor) {

            log.audit('calcularFecha - LINE 1630', 'INICIO');

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

                        log.debug('calcularFecha - LINE 1651', 'Cantidad Resultados Dias Entrega : ' + arrayDiasEntregaProveedor.length);

                        // Por cada Proveedor Calcular la Fecha de Entrega
                        var fechaMayor = '';
                        var tieneFechaFija = false;
                        for (var i = 0; i < arrayProveedor.length; i++) {

                            var fechaServidor = new Date();

                            log.debug('calcularFecha - LINE 1660', 'Fecha Serv : ' + fechaServidor);

                            if (!stockPropio)
                                fechaServidor.setDate(fechaServidor.getDate() + 1);

                            log.debug('calcularFecha - LINE 1665', 'Fecha Serv 2 : ' + fechaServidor);

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

                                log.debug('calcularFecha - LINE 1694', 'Dia Actual : ' + diaActual);

                                log.debug('calcularFecha - LINE 1697', 'Proveedor : ' + arrayProveedor[i].Proveedor);
                                var resultDiasEntrega = arrayDiasEntregaProveedor.filter(function (obj) {
                                    return (obj.proveedor == arrayProveedor[i].Proveedor);
                                });

                                log.debug('calcularFecha - LINE 1702', 'Dias Entrega Proveedor Tam : ' + resultDiasEntrega.length);

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

                                log.error('calcularFecha - LINE 1751', 'arrayOrdenadoEntregaProveedor: ' + JSON.stringify(arrayOrdenadoEntregaProveedor));

                                for (var k = 0; k < arrayOrdenadoEntregaProveedor.length; k++) {

                                    log.debug('calcularFecha', 'arrayOrdenadoEntregaProveedor codigoDiaJS : ' + arrayOrdenadoEntregaProveedor[k].codigoDiaJS);
                                    var diffDay = arrayOrdenadoEntregaProveedor[k].codigoDiaJS - diaActual;
                                    var fechaBaseCalculo = new Date(fechaActual.getTime());

                                    log.debug('calcularFecha - LINE 1759', 'diffDay : ' + diffDay + ' linea: ' + k);

                                    if (diffDay >= 0) {
                                        fechaBaseCalculo.setDate(fechaBaseCalculo.getDate() + diffDay);
                                    } else {
                                        fechaBaseCalculo.setDate((fechaBaseCalculo.getDate() + 7) + diffDay);
                                    }

                                    log.debug('calcularFecha - LINE 1767', 'fechaBaseCalculo despues de diffDay : ' + fechaBaseCalculo);

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

                                        log.debug('calcularFecha - LINA 1806', ' fechaBaseCalculo: ' + fechaBaseCalculo);
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
                            log.error('CcalcularFecha - LINE 1834', 'UCFC001 - ' + mensaje);
                        }
                    } else {
                        var mensaje = 'Error Calculando Fecha de Entrega - Error : No se recibio la informacion de los dias de Pedido de los Proveedores';
                        objRespuesta.error = true;
                        objRespuestaParcial = new Object();
                        objRespuestaParcial.codigo = 'UCFC002';
                        objRespuestaParcial.mensaje = mensaje;
                        objRespuesta.detalle.push(objRespuestaParcial);
                        log.error('calcularFecha - LINE 1843', 'UCFC002 - ' + mensaje);
                    }
                } else {
                    var mensaje = 'Error Calculando Fecha de Entrega - Error : No se recibieron los ID de los Proveedores A Calcular las Fechas de Entrega';
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'UCFC003';
                    objRespuestaParcial.mensaje = mensaje;
                    objRespuesta.detalle.push(objRespuestaParcial);
                    log.error('calcularFecha - LINE 1852', 'UCFC003 - ' + mensaje);
                }
            } catch (e) {
                objRespuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'UCFC004';
                objRespuestaParcial.mensaje = 'Error Calculando Fecha de Entrega - Excepcion: ' + e.message;
                objRespuesta.detalle.push(objRespuestaParcial);
                log.error('calcularFecha - LINE 1860', 'UCFC004 - Error Calculando Fecha de Entrega - Excepcion' + e.message);

            }

            log.audit('calcularFecha - LINE 1864', 'FIN');

            return objRespuesta;
        }

        return {
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });


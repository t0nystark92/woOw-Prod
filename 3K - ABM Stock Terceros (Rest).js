/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType Restlet
 * @NModuleScope Public
 */

/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/

define(['N/record', 'N/error', 'N/search', 'N/format', '3K/utilities'],

    function(record, error, search, format, utilities) {

        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPost(requestBody) {
            log.audit('ABM Stock Terceros', 'INICIO Proceso');
            var objetoRespuesta = new Object();
            objetoRespuesta.error = false;
            objetoRespuesta.mensaje = new Object();
            objetoRespuesta.existenRegistros = false;
            objetoRespuesta.stock = new Array();
            try {
                if (requestBody != null && requestBody != "") {
                    var informacion = JSON.parse(requestBody);
                    if (informacion != null && informacion != "") {
                        var operacion = informacion.operacion;

                        if (!utilities.isEmpty(operacion)) {
                            switch (operacion) {
                                case 'C':
                                    objetoRespuesta = consultarStock(informacion);
                                    break;
                                case 'A':
                                    objetoRespuesta = crearStock(informacion);
                                    break;
                                case 'M':
                                    objetoRespuesta = modificarStock(informacion);
                                    break;
                                default:
                                    objetoRespuesta.error = true;
                                    objetoRespuesta.mensaje.tipo = "RSTK001";
                                    objetoRespuesta.mensaje.descripcion = "Operacion a realizar recibida invalida";
                            }
                        } else {
                            objetoRespuesta.error = true;
                            objetoRespuesta.mensaje.tipo = "RSTK002";
                            objetoRespuesta.mensaje.descripcion = "No se recibio el Tipo de Operacion a realizar";
                        }
                    } else {
                        objetoRespuesta.error = true;
                        objetoRespuesta.mensaje.tipo = "RSTK003";
                        objetoRespuesta.mensaje.descripcion = "Error al parsear parametro con informacion a realizar";
                    }
                } else {
                    objetoRespuesta.error = true;
                    objetoRespuesta.mensaje.tipo = "RSTK004";
                    objetoRespuesta.mensaje.descripcion = "No se recibio parametro con informacion a realizar";
                }
            } catch (excepcion) {
                log.error('ABM Stock Terceros', 'Excepcion Proceso Stock Terceros - Excepcion : ' + excepcion.message);
                objetoRespuesta.error = true;
                objetoRespuesta.existenRegistros = false;
                objetoRespuesta.mensaje.tipo = "RSTK005";
                objetoRespuesta.mensaje.descripcion = 'Excepcion en Proceso ABM Stock Terceros - Excepcion : ' + excepcion.message;
            }

            var respuestaStockTerceros = JSON.stringify(objetoRespuesta);

            log.audit('ABM Stock Terceros', 'FIN Proceso');

            return respuestaStockTerceros;
        }

        function consultarStock(informacion) {
            log.audit('ABM Stock Terceros - Consulta', 'INICIO Proceso');
            var objetoRespuesta = new Object();
            objetoRespuesta.error = false;
            objetoRespuesta.mensaje = new Object();
            objetoRespuesta.existenRegistros = false;
            objetoRespuesta.stock = new Array();

            try {
                if (!utilities.isEmpty(informacion)) {
                    if (!utilities.isEmpty(informacion.proveedor)) {
                        // Generar Fecha Actual
                        var fechaServidor = new Date();

                        var fechaLocal = format.format({
                            value: fechaServidor,
                            type: format.Type.DATE,
                            timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                        });

                        var mySearch = search.load({
                            id: 'customsearch_3k_stock_terceros_abm'
                        });


                        var filtroIDProveedor = search.createFilter({
                            name: 'custrecord_3k_stock_terc_proveedor',
                            operator: search.Operator.IS,
                            values: [informacion.proveedor]
                        });

                        mySearch.filters.push(filtroIDProveedor);

                        if (!utilities.isEmpty(informacion.articulo)) {

                            var filtroIDArticulo = search.createFilter({
                                name: 'custrecord_3k_stock_terc_articulo',
                                operator: search.Operator.IS,
                                values: [informacion.articulo]
                            });

                            mySearch.filters.push(filtroIDArticulo);

                        }

                        if (!utilities.isEmpty(informacion.sitio)) {

                            var filtroIDSitio = search.createFilter({
                                name: 'custrecord_3k_stock_terc_sitio',
                                operator: search.Operator.ANYOF,
                                values: [informacion.sitio]
                            });

                            mySearch.filters.push(filtroIDSitio);

                        }

                        /*var filtroFechaDesde=search.createFilter({
                    name: 'custrecord_3k_stock_terc_fecha_ini',
                    operator: search.Operator.ONORBEFORE,
                    values: [fechaLocal]
                  });
                
                mySearch.filters.push(filtroFechaDesde);
                
                var filtroFechaHasta=search.createFilter({
                    name: 'custrecord_3k_stock_terc_fecha_fin',
                    operator: search.Operator.ONORAFTER,
                    values: [fechaLocal]
                  });
                
                mySearch.filters.push(filtroFechaHasta);*/

                        if (informacion.incluirRegistrosPush == 'F') {
                            var filtroPUSH = search.createFilter({
                                name: 'custrecord_3k_stock_tercero_push',
                                operator: search.Operator.IS,
                                values: ['F']
                            });

                            mySearch.filters.push(filtroPUSH);
                        }

                        var resultSet = mySearch.run();

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

                        if (!utilities.isEmpty(completeResultSet) && completeResultSet.length > 0) {
                            objetoRespuesta.existenRegistros = true;
                            for (var i = 0; i < completeResultSet.length; i++) {
                                var stockTercero = new Object();
                                stockTercero.idInterno = completeResultSet[i].getValue({
                                    name: resultSet.columns[0]
                                });
                                stockTercero.proveedor = completeResultSet[i].getValue({
                                    name: resultSet.columns[1]
                                });
                                stockTercero.stockInicial = completeResultSet[i].getValue({
                                    name: resultSet.columns[5]
                                });
                                stockTercero.stockDisponible = completeResultSet[i].getValue({
                                    name: resultSet.columns[6]
                                });
                                stockTercero.fechaInicio = completeResultSet[i].getValue({
                                    name: resultSet.columns[3]
                                });
                                stockTercero.fechaFin = completeResultSet[i].getValue({
                                    name: resultSet.columns[4]
                                });
                                stockTercero.push = completeResultSet[i].getValue({
                                    name: resultSet.columns[7]
                                });
                                stockTercero.posicion = completeResultSet[i].getValue({
                                    name: resultSet.columns[8]
                                });
                                stockTercero.skuProveedor = completeResultSet[i].getValue({
                                    name: resultSet.columns[2]
                                });
                                stockTercero.idArticulo = completeResultSet[i].getValue({
                                    name: resultSet.columns[10]
                                });

                                objetoRespuesta.stock.push(stockTercero);
                            }
                        }
                    } else {
                        var mensaje = 'No se recibio la siguiente informacion requerida para realizar la consulta del Stock de Terceros : ';
                        if (utilities.isEmpty(informacion.proveedor)) {
                            mensaje = mensaje + " ID Interno del Proveedor A Consultar el Stock de Terceros / ";
                        }
                        /*if(utilities.isEmpty(informacion.articulo)){
                            mensaje=mensaje+" ID Interno del Articulo A Consultar el Stock de Terceros / ";
                        }*/
                        /*if(utilities.isEmpty(informacion.incluirRegistrosPush)){
                            mensaje=mensaje+" Informacion de si los registros Push deben incluirse en la Consulta / ";
                        }*/
                        objetoRespuesta.error = true;
                        objetoRespuesta.mensaje.tipo = "RSTK006";
                        objetoRespuesta.mensaje.descripcion = mensaje;
                        log.error('ABM Stock Terceros - Consulta', mensaje);
                    }
                } else {
                    objetoRespuesta.error = true;
                    objetoRespuesta.mensaje.tipo = "RSTK007";
                    objetoRespuesta.mensaje.descripcion = "No se recibio parametro con informacion a realizar";
                }
            } catch (excepcionConsulta) {
                log.error('ABM Stock Terceros - Consulta', 'Excepcion Proceso Consulta Stock Terceros - Excepcion : ' + excepcionConsulta.message);
                objetoRespuesta.error = true;
                objetoRespuesta.existenRegistros = false;
                objetoRespuesta.mensaje.tipo = "RSTK008";
                objetoRespuesta.mensaje.descripcion = "Excepcion en Proceso de Consulta de Stock Terceros - Excepcion : " + excepcionConsulta.message;
            }
            log.audit('ABM Stock Terceros - Consulta', 'FIN Proceso');
            return objetoRespuesta;
        }

        function crearStock(informacion) {
            log.audit('ABM Stock Terceros - Creacion Stock', 'INICIO Proceso');
            var objetoRespuesta = new Object();
            objetoRespuesta.error = false;
            objetoRespuesta.mensaje = new Object();
            objetoRespuesta.existenRegistros = false;
            objetoRespuesta.stock = new Array();

            try {
                if (!utilities.isEmpty(informacion)) {
                    if (!utilities.isEmpty(informacion.proveedor) /*&& !utilities.isEmpty(informacion.sitio)&& informacion.sitio.length>0 */ && !utilities.isEmpty(informacion.skuProveedor) && !utilities.isEmpty(informacion.articulo) && !utilities.isEmpty(informacion.stockInicial) && !utilities.isEmpty(informacion.stockDisponible) && !utilities.isEmpty(informacion.moneda) && !utilities.isEmpty(informacion.costoUnitario)) {

                        var ubicacionDefault = '';
                        var sitioConfig;
                        // INICIO - Consultar Configuracion
                        var objParam = new Object({});
                        objParam.name = 'custrecord_3k_config_stkt_sitio';
                        objParam.operator = 'IS';
                        objParam.values = [informacion.sitio];

                        //var searchConfig = utilities.searchSaved('customsearch_3k_config_stk_terceros',objParam);
                        var searchConfig = utilities.searchSaved('customsearch_3k_config_stk_terceros');

                        if (!utilities.isEmpty(searchConfig) && searchConfig.error == false) {
                            if (!utilities.isEmpty(searchConfig.objRsponseFunction.result) && searchConfig.objRsponseFunction.result.length > 0) {
                                ubicacionDefault = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[2] });
                                tipoIngreso = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[3] });
                                sitioConfig = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[4] });
                                var arraySitio =  sitioConfig.split(",");

                                if (utilities.isEmpty(ubicacionDefault) || utilities.isEmpty(tipoIngreso) || utilities.isEmpty(sitioConfig)) {
                                    objetoRespuesta.error = true;
                                    //var mensaje = 'No se encuentra configurada la siguiente informacion del panel de configuracion de Stock Terceros para el Sitio con ID Interno ' + informacion.sitio + ' : ';
                                    var mensaje = 'No se encuentra configurada la siguiente informacion del panel de configuracion de Stock Terceros: ';
                                    if (utilities.isEmpty(ubicacionDefault)) {
                                        mensaje = mensaje + ' Ubicacion por Defecto A Utilizar / ';
                                    }
                                    if (utilities.isEmpty(tipoIngreso)) {
                                        mensaje = mensaje + ' Tipo de Ingreso de Orden de Compra A Utilizar / ';
                                    }
                                    if (utilities.isEmpty(sitioConfig)) {
                                        mensaje = mensaje + ' Sitio Web de Orden de Compra A Utilizar / ';
                                    }                                    
                                    objetoRespuesta.existenRegistros = false;
                                    objetoRespuesta.mensaje.tipo = "RSTK017";
                                    objetoRespuesta.mensaje.descripcion = mensaje;
                                }
                            } else {
                                objetoRespuesta.error = true;
                                objetoRespuesta.existenRegistros = false;
                                objetoRespuesta.mensaje.tipo = "RSTK018";
                                objetoRespuesta.mensaje.descripcion = "No se encuentra realizada la Configuracion de Stock Terceros";
                            }
                        } else {
                            objetoRespuesta.error = true;
                            objetoRespuesta.existenRegistros = false;
                            objetoRespuesta.mensaje.tipo = "RSTK019";
                            objetoRespuesta.mensaje.descripcion = 'Error Consultando Configuracion de Stock Terceros - Tipo Error : ' + searchConfig.tipoError + ' - Descripcion : ' + searchConfig.descripcion;
                        }

                        // FIN - Consultar Configuracion

                        if (objetoRespuesta.error == false) {

                            var rec = record.create({
                                type: 'customrecord_stock_terceros',
                                isDynamic: true
                            });

                            rec.setValue({
                                fieldId: 'custrecord_3k_stock_terc_proveedor',
                                value: informacion.proveedor
                            });

                            rec.setValue({
                                fieldId: 'custrecord_3k_stock_terc_sitio',
                                //value: informacion.sitio
                                value: arraySitio
                            });

                            rec.setValue({
                                fieldId: 'custrecord_3k_stock_terc_sku_prov',
                                value: informacion.skuProveedor
                            });

                            rec.setValue({
                                fieldId: 'custrecord_3k_stock_terc_articulo',
                                value: informacion.articulo
                            });

                            if (!utilities.isEmpty(informacion.deposito)) {
                                rec.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_deposito',
                                    value: informacion.deposito
                                });
                            } else {
                                if (!utilities.isEmpty(ubicacionDefault)) {
                                    rec.setValue({
                                        fieldId: 'custrecord_3k_stock_terc_deposito',
                                        value: ubicacionDefault
                                    });
                                }
                            }

                            if (!utilities.isEmpty(tipoIngreso)) {
                                rec.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_tipo_ing',
                                    value: tipoIngreso
                                });
                            }

                            rec.setValue({
                                fieldId: 'custrecord_3k_stock_terc_stock_ini',
                                value: informacion.stockInicial.toString()
                            });

                            rec.setValue({
                                fieldId: 'custrecord_3k_stock_terc_stock_disp',
                                value: informacion.stockDisponible.toString()
                            });

                            if (!utilities.isEmpty(informacion.fechaInicio)) {
                                var fechaInicioLocal = format.parse({
                                    value: informacion.fechaInicio,
                                    type: format.Type.DATE,
                                    //timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                                });

                                rec.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_fecha_ini',
                                    value: fechaInicioLocal
                                });
                            }

                            if (!utilities.isEmpty(informacion.fechaFin)) {
                                var fechaFinLocal = format.parse({
                                    value: informacion.fechaFin,
                                    type: format.Type.DATE,
                                    //timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                                });
                                rec.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_fecha_fin',
                                    value: fechaFinLocal
                                });
                            }

                            if (!utilities.isEmpty(informacion.fechaReparto)) {
                                var fechaRepartoLocal = format.parse({
                                    value: informacion.fechaReparto,
                                    type: format.Type.DATE,
                                    //timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                                });

                                rec.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_fecha_rep',
                                    value: fechaRepartoLocal
                                });
                            }

                            rec.setValue({
                                fieldId: 'custrecord_3k_stock_terc_moneda',
                                value: informacion.moneda
                            });

                            rec.setValue({
                                fieldId: 'custrecord_3k_stock_terc_costo_uni',
                                value: informacion.costoUnitario.toFixed(2).toString()
                            });

                            var push = false;
                            if (!utilities.isEmpty(informacion.push) && informacion.push == 'T') {
                                push = true;
                            }
                            rec.setValue({
                                fieldId: 'custrecord_3k_stock_tercero_push',
                                value: push
                            });

                            if (!utilities.isEmpty(informacion.posicion) && !isNaN(informacion.posicion)) {
                                rec.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_posicion',
                                    value: informacion.posicion
                                });
                            }

                            try {
                                var recId = rec.save();
                                var stockTercero = new Object();
                                stockTercero.idInterno = recId;
                                objetoRespuesta.stock.push(stockTercero);

                            } catch (excepcionSave) {
                                log.error('ABM Stock Terceros - Creacion Stock', 'Excepcion Proceso Creacion Stock Terceros - Excepcion : ' + excepcionSave.toString());
                                var error = new Object();
                                if (!utilities.isEmpty(excepcionSave.message) && excepcionSave.message.indexOf('Error') >= 0) {
                                    var excepcionObj = JSON.parse(excepcionSave.message);
                                    error.name = excepcionObj.name;
                                    error.message = excepcionObj.message;
                                } else {
                                    error.name = 'RSTK009';
                                    error.message = excepcionSave.message;
                                }

                                objetoRespuesta.error = true;
                                objetoRespuesta.existenRegistros = false;
                                objetoRespuesta.mensaje.tipo = error.name;
                                objetoRespuesta.mensaje.descripcion = error.message;
                            }

                        }
                    } else {
                        var mensaje = 'No se recibio la siguiente informacion requerida para realizar la creacion del Stock de Terceros : ';
                        if (utilities.isEmpty(informacion.proveedor)) {
                            mensaje = mensaje + " ID Interno del Proveedor del Stock de Terceros / ";
                        }
                        /*if(utilities.isEmpty(informacion.sitio) || (!utilities.isEmpty(informacion.sitio) && informacion.sitio.length>0)){
                             mensaje = mensaje + " Sitio del Stock de Terceros / ";
                        }*/
                        if (utilities.isEmpty(informacion.skuProveedor)) {
                            mensaje = mensaje + " SKU del Proveedor del Stock de Terceros / ";
                        }
                        if (utilities.isEmpty(informacion.articulo)) {
                            mensaje = mensaje + " ID Interno del Articulo del Stock de Terceros / ";
                        }
                        if (utilities.isEmpty(informacion.stockInicial)) {
                            mensaje = mensaje + " Cantidad de Stock Inicial / ";
                        }
                        if (utilities.isEmpty(informacion.stockDisponible)) {
                            mensaje = mensaje + " Cantidad de Stock Disponible / ";
                        }
                        if (utilities.isEmpty(informacion.moneda)) {
                            mensaje = mensaje + " Moneda del Costo Unitario del Stock Inicial / ";
                        }
                        if (utilities.isEmpty(informacion.costoUnitario)) {
                            mensaje = mensaje + " Costo Unitario del Stock Inicial / ";
                        }
                        objetoRespuesta.error = true;
                        objetoRespuesta.existenRegistros = false;
                        objetoRespuesta.mensaje.tipo = "RSTK010";
                        objetoRespuesta.mensaje.descripcion = mensaje;
                        log.error('ABM Stock Terceros - Creacion Stock', mensaje);
                    }
                } else {
                    objetoRespuesta.error = true;
                    objetoRespuesta.existenRegistros = false;
                    objetoRespuesta.mensaje.tipo = "RSTK011";
                    objetoRespuesta.mensaje.descripcion = "No se recibio parametro con informacion a realizar";
                }
            } catch (excepcionConsulta) {
                log.error('ABM Stock Terceros - Creacion Stock', 'Excepcion Proceso Creacion Stock Terceros - Excepcion : ' + excepcionConsulta.message);
                objetoRespuesta.error = true;
                objetoRespuesta.existenRegistros = false;
                objetoRespuesta.mensaje.tipo = "RSTK012";
                objetoRespuesta.mensaje.descripcion = "Excepcion en Proceso de Creacion de Stock Terceros - Excepcion : " + excepcionConsulta.message;
            }
            log.audit('ABM Stock Terceros - Creacion Stock', 'FIN Proceso');
            return objetoRespuesta;
        }

        function modificarStock(informacion) {
            log.audit('ABM Stock Terceros - Modificacion Stock', 'INICIO Proceso');
            var objetoRespuesta = new Object();
            objetoRespuesta.error = false;
            objetoRespuesta.mensaje = new Object();
            objetoRespuesta.existenRegistros = false;
            objetoRespuesta.stock = new Array();

            try {
                if (!utilities.isEmpty(informacion)) {
                    if (!utilities.isEmpty(informacion.idRegistro) && !utilities.isEmpty(informacion.stockInicial)) {

                        var idRecord = record.submitFields({
                            type: 'customrecord_stock_terceros',
                            id: informacion.idRegistro,
                            values: {
                                custrecord_3k_stock_terc_stock_ini: informacion.stockInicial
                            },
                            options: {
                                enableSourcing: true,
                                ignoreMandatoryFields: false
                            }
                        });

                        if (utilities.isEmpty(idRecord)) {
                            log.error('ABM Stock Terceros - Modificacion Stock', 'Error Actualizando Registro de Stock de Terceros - Error : No se recibio ID del Registro Actualizado');
                            throw utilities.crearError('RSTK013', 'Error Actualizando Registro de Stock de Terceros - Error : No se recibio ID del Registro Actualizado');
                        } else {
                            var stockTercero = new Object();
                            stockTercero.idInterno = idRecord;
                            objetoRespuesta.stock.push(stockTercero);
                        }

                    } else {
                        var mensaje = 'No se recibio la siguiente informacion requerida para realizar la modificacion del Stock de Terceros : ';
                        if (utilities.isEmpty(informacion.idRegistro)) {
                            mensaje = mensaje + " ID Interno del Registro a Modificar / ";
                        }
                        if (utilities.isEmpty(informacion.stockInicial)) {
                            mensaje = mensaje + " Cantidad de Stock Inicial / ";
                        }

                        objetoRespuesta.error = true;
                        objetoRespuesta.mensaje.tipo = "RSTK014";
                        objetoRespuesta.mensaje.descripcion = mensaje;
                        log.error('ABM Stock Terceros - Modificacion Stock', mensaje);
                    }
                } else {
                    objetoRespuesta.error = true;
                    objetoRespuesta.mensaje.tipo = "RSTK015";
                    objetoRespuesta.mensaje.descripcion = "No se recibio parametro con informacion a realizar";
                }
            } catch (excepcionConsulta) {
                log.error('ABM Stock Terceros - Modificacion Stock', 'Excepcion Proceso Modificacion Stock Terceros - Excepcion : ' + excepcionConsulta.message);
                objetoRespuesta.error = true;
                objetoRespuesta.existenRegistros = false;
                objetoRespuesta.mensaje.tipo = "RSTK016";
                objetoRespuesta.mensaje.descripcion = "Excepcion en Proceso de Modificacion de Stock Terceros - Excepcion : " + excepcionConsulta.message;
            }
            log.audit('ABM Stock Terceros - Modificacion Stock', 'FIN Proceso');
            return objetoRespuesta;
        }

        return {
            post: doPost
        };

    });

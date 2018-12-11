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

define(['N/error', 'N/record', 'N/search', 'N/format', '3K/utilities'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */

    function(error, record, search, format, utilities) {

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
            var respuesta = new Object();
            respuesta.idRemito = '';
            respuesta.error = false;
            respuesta.detalle = new Array();

            var estadoEnviadoCupon = '';
            try {
                log.audit('Inicio Grabar Remito', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

                if (scriptContext.type == 'create') {
                    var idRemito = scriptContext.newRecord.id;
                    var tipoTransaccion = scriptContext.newRecord.type;
                    if (!utilities.isEmpty(idRemito) && !utilities.isEmpty(tipoTransaccion)) {
                        respuesta.idRemito = idRemito;
                        var objRecord = record.load({
                            type: tipoTransaccion,
                            id: idRemito,
                            isDynamic: true,
                        });
                        if (!utilities.isEmpty(objRecord)) {

                            var idOrdenVenta = objRecord.getValue({
                                fieldId: 'createdfrom'
                            });

                            var fechaRemito = objRecord.getValue({
                                fieldId: 'trandate'
                            });

                            var fechaRemitoDate = format.parse({
                                value: fechaRemito,
                                type: format.Type.DATE,
                            });

                            var fechaRemitoString = format.format({
                                value: fechaRemitoDate,
                                type: format.Type.DATE,
                            });



                            if (!utilities.isEmpty(idOrdenVenta)) {

                                // Obtener Tipo Comprobante CreatedFrom

                                var tipoTransaccion = '';

                                var objParam = new Object();
                                objParam.name = 'internalid';
                                objParam.operator = 'IS';
                                objParam.values = idOrdenVenta;

                                var searchTipoTransaccion = utilities.searchSaved('customsearch_3k_tipos_transacciones', objParam);
                                if (!utilities.isEmpty(searchTipoTransaccion) && searchTipoTransaccion.error == false) {
                                    if (!utilities.isEmpty(searchTipoTransaccion.objRsponseFunction.result) && searchTipoTransaccion.objRsponseFunction.result.length > 0) {

                                        var resultSet = searchTipoTransaccion.objRsponseFunction.result;
                                        var resultSearch = searchTipoTransaccion.objRsponseFunction.search;

                                        tipoTransaccion = resultSet[0].getValue({
                                            name: resultSearch.columns[1]
                                        });

                                        if (utilities.isEmpty(tipoTransaccion)) {
                                            respuesta.error = true;
                                            respuestaParcial = new Object();
                                            respuestaParcial.codigo = 'SREM022';
                                            respuestaParcial.mensaje = 'Error Consultando Tipo de Transaccion Origen del Remito con ID Interno : ' + respuesta.idRemito + ' - Error : No se Recibio el Tipo de Transaccion';
                                            respuesta.detalle.push(respuestaParcial);
                                        }

                                    } else {
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'SREM019';
                                        respuestaParcial.mensaje = 'Error Consultando Tipo de Transaccion Origen del Remito con ID Interno : ' + respuesta.idRemito + ' - Error : No se encontro la transaccion';
                                        respuesta.detalle.push(respuestaParcial);
                                    }
                                } else {
                                    if (utilities.isEmpty(searchRequisiciones)) {
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'SREM020';
                                        respuestaParcial.mensaje = 'Error Consultando Tipo de Transaccion Origen del Remito con ID Interno : ' + respuesta.idRemito + ' - Error : No se Recibio Objeto de Respuesta';
                                        respuesta.detalle.push(respuestaParcial);
                                    } else {
                                        respuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'SREM021';
                                        respuestaParcial.mensaje = 'Error Consultando Tipo de Transaccion Origen del Remito con ID Interno : ' + respuesta.idRemito + ' - Tipo Error : ' + searchTipoTransaccion.tipoError + ' - Descripcion : ' + searchTipoTransaccion.descripcion;
                                        respuesta.detalle.push(respuestaParcial);
                                    }
                                }

                                // Fin Obtener Tipo Comprobante CreatedFrom

                                log.audit('Inicio Grabar Remito', 'AftereSubmit - Tipo Transaccion Created From : ' + tipoTransaccion);

                                if (respuesta.error == false) {
                                    // Solo Consulta Cupones si el Remito se genera desde una Orden de Venta
                                    if (tipoTransaccion == 'salesorder') {

                                        //INICIO - Consultar Configuracion Cupones
                                        /*var searchConfig = utilities.searchSaved('customsearch_3k_config_cupones');

                                        if (!utilities.isEmpty(searchConfig) && searchConfig.error == false) {
                                            if (!utilities.isEmpty(searchConfig.objRsponseFunction.result) && searchConfig.objRsponseFunction.result.length > 0) {
                                                estadoEnviadoCupon = searchConfig.objRsponseFunction.result[0].getValue({ name: searchConfig.objRsponseFunction.search.columns[2] });
                                                if (utilities.isEmpty(estadoEnviadoCupon)) {
                                                    respuesta.error = true;
                                                    respuestaParcial = new Object();
                                                    respuestaParcial.codigo = 'SREM015';
                                                    respuestaParcial.mensaje = 'Error Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : No se Encuentra Configurado el Estado de Cupon Enviado en la Configuracion de Cupones';
                                                    respuesta.detalle.push(respuestaParcial);
                                                }
                                            } else {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SREM016';
                                                respuestaParcial.mensaje = 'Error Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : No se Encuentra Generada la Configuracion de Cupones';
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                        } else {
                                            if (utilities.isEmpty(searchConfig)) {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SREM017';
                                                respuestaParcial.mensaje = 'Error Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : No se recibio Respuesta del Proceso de Busqueda de la Configuracion de Cupones';
                                                respuesta.detalle.push(respuestaParcial);
                                            } else {
                                                respuesta.error = true;
                                                respuestaParcial = new Object();
                                                respuestaParcial.codigo = 'SREM018';
                                                respuestaParcial.mensaje = 'Error Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' Error Consultando la Configuracion de Cupones - Error : ' + searchConfig.tipoError + ' - Descripcion : ' + searchConfig.descripcion;
                                                respuesta.detalle.push(respuestaParcial);
                                            }
                                        }*/
                                        //FIN - Consultar Configuracion Cupones
                                        

                                            var cantidadLineasRemito = objRecord.getLineCount({
                                                sublistId: 'item'
                                            });

                                            var informacionRemito = new Array();
                                            var idOrdenes = new Array();
                                            for (var i = 0; i < cantidadLineasRemito && respuesta.error == false; i++) {

                                                var idOrden = objRecord.getSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'custcol_3k_id_orden',
                                                    line: i
                                                });

                                                var cantidad = objRecord.getSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'quantity',
                                                    line: i
                                                });

                                                if (!utilities.isEmpty(idOrden)) {

                                                    if (!utilities.isEmpty(cantidad) && !isNaN(cantidad) && cantidad > 0) {
                                                        var infoLinea = new Object();
                                                        infoLinea.idOrden = idOrden;
                                                        infoLinea.cantidad = cantidad;
                                                        informacionRemito.push(infoLinea);
                                                        idOrdenes.push(idOrden);
                                                    } else {
                                                        if ((utilities.isEmpty(cantidad) || isNaN(cantidad) || cantidad <= 0)) {
                                                            var mensaje = 'Error Obteniendo informaciòn de la Linea del Remito - No se encontro la siguiente informacion : ';
                                                            if (utilities.isEmpty(cantidad)) {
                                                                mensaje = mensaje + ' Cantidad de Articulos de la Linea / ';
                                                            }
                                                            if (!utilities.isEmpty(cantidad) && isNaN(cantidad)) {
                                                                mensaje = mensaje + ' Cantidad de Articulos No Numerica / ';
                                                            }
                                                            if (!utilities.isEmpty(cantidad) && isNaN(cantidad)) {
                                                                mensaje = mensaje + ' Cantidad de Articulos Negativa / ';
                                                            }
                                                            respuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SREM005';
                                                            respuestaParcial.mensaje = 'Error Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
                                                            respuesta.detalle.push(respuestaParcial);
                                                        }
                                                    }
                                                }

                                            }
                                            if (respuesta.error == false) {
                                                if (!utilities.isEmpty(informacionRemito) && informacionRemito.length > 0 && !utilities.isEmpty(idOrdenes) && idOrdenes.length > 0) {
                                                    // INICIO - Consultar Cupones por Orden de Venta e ID Orden
                                                    var filtros = new Array();
                                                    var filtroOV = new Object();
                                                    filtroOV.name = 'custrecord_3k_cupon_ord_venta';
                                                    filtroOV.operator = 'IS';
                                                    filtroOV.values = idOrdenVenta;
                                                    filtros.push(filtroOV);

                                                    var filtroLineaOV = new Object();
                                                    filtroLineaOV.name = 'custrecord_3k_cupon_id_orden';
                                                    filtroLineaOV.operator = 'ANY';
                                                    filtroLineaOV.values = idOrdenes;
                                                    filtros.push(filtroLineaOV);


                                                    var searchCupones = utilities.searchSavedPro('customsearch_3k_cupones_id_orden', filtros);
                                                    if (!utilities.isEmpty(searchCupones) && searchCupones.error == false) {
                                                        if (!utilities.isEmpty(searchCupones.objRsponseFunction.result) && searchCupones.objRsponseFunction.result.length > 0) {
                                                            // Agrupar Cupones por ID de Orden
                                                            var resultSet = searchCupones.objRsponseFunction.result;
                                                            var resultSearch = searchCupones.objRsponseFunction.search;
                                                            var arrayCupones = new Array();
                                                            for (var i = 0; !utilities.isEmpty(resultSet) && i < resultSet.length; i++) {

                                                                var obj = new Object();
                                                                obj.indice = i;
                                                                obj.idInterno = resultSet[i].getValue({
                                                                    name: resultSearch.columns[0]
                                                                });
                                                                obj.codigo = resultSet[i].getValue({
                                                                    name: resultSearch.columns[1]
                                                                });
                                                                obj.idOrden = resultSet[i].getValue({
                                                                    name: resultSearch.columns[2]
                                                                });
                                                                obj.idOV = resultSet[i].getValue({
                                                                    name: resultSearch.columns[3]
                                                                });
                                                                obj.logistico = resultSet[i].getValue({
                                                                    name: resultSearch.columns[4]
                                                                });

                                                                arrayCupones.push(obj);
                                                            }

                                                            if (!utilities.isEmpty(arrayCupones) && arrayCupones.length > 0) {
                                                                for (var i = 0; !utilities.isEmpty(informacionRemito) && i < informacionRemito.length && respuesta.error == false; i++) {
                                                                    var objCupon = arrayCupones.filter(function(obj) {
                                                                        return (obj.idOrden === informacionRemito[i].idOrden);
                                                                    });

                                                                    if (!utilities.isEmpty(objCupon) && objCupon.length > 0) {
                                                                        if (objCupon.length >= informacionRemito[i].cantidad) {
                                                                            for (var j = 0; j < informacionRemito[i].cantidad && respuesta.error == false; j++) {
                                                                                try {
                                                                                    var informacionConfigurar = new Object();
                                                                                    informacionConfigurar.custrecord_3k_cupon_remito = idRemito;
                                                                                    if (objCupon[j].logistico == true) {
                                                                                        //informacionConfigurar.custrecord_3k_cupon_estado = estadoEnviadoCupon;
                                                                                        informacionConfigurar.custrecord_3k_cupon_fecha_despacho = fechaRemitoString;
                                                                                    }
                                                                                    var idRecordCupon = record.submitFields({
                                                                                        type: 'customrecord_3k_cupones',
                                                                                        id: objCupon[j].idInterno,
                                                                                        values: informacionConfigurar,
                                                                                        options: {
                                                                                            enableSourcing: true,
                                                                                            ignoreMandatoryFields: false
                                                                                        }
                                                                                    });
                                                                                    if (utilities.isEmpty(idRecordCupon)) {
                                                                                        respuesta.error = true;
                                                                                        respuestaParcial = new Object();
                                                                                        respuestaParcial.codigo = 'SREM014';
                                                                                        respuestaParcial.mensaje = 'Error Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : No se Recibio ID del Cupon Actualizado';
                                                                                        respuesta.detalle.push(respuestaParcial);
                                                                                    }
                                                                                } catch (exepcionSubmitCupon) {
                                                                                    respuesta.error = true;
                                                                                    respuestaParcial = new Object();
                                                                                    respuestaParcial.codigo = 'SREM013';
                                                                                    respuestaParcial.mensaje = 'Excepcion Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Excepcion : ' + exepcionSubmitCupon.message.toString();
                                                                                    respuesta.detalle.push(respuestaParcial);
                                                                                }
                                                                            }
                                                                        } else {
                                                                            //Cantidad Invalida
                                                                            var mensaje = 'La cantidad de Cupones encontrados para el ID de Orden : ' + informacionRemito[i].idOrden + ' Es Menor a la Cantidad Indicada en el Remito  - Cantidad : ' + informacionRemito[i].cantidad;
                                                                            respuesta.error = true;
                                                                            respuestaParcial = new Object();
                                                                            respuestaParcial.codigo = 'SREM012';
                                                                            respuestaParcial.mensaje = 'Error Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
                                                                            respuesta.detalle.push(respuestaParcial);
                                                                        }
                                                                    } else {
                                                                        var mensaje = 'Error Obteniendo Informacion del Cupon para el ID de Orden : ' + informacionRemito[i].idOrden;
                                                                        respuesta.error = true;
                                                                        respuestaParcial = new Object();
                                                                        respuestaParcial.codigo = 'SREM011';
                                                                        respuestaParcial.mensaje = 'Error Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
                                                                        respuesta.detalle.push(respuestaParcial);
                                                                    }
                                                                }

                                                            } else {
                                                                var mensaje = 'No Se encontraron Cupones';
                                                                respuesta.error = true;
                                                                respuestaParcial = new Object();
                                                                respuestaParcial.codigo = 'SREM010';
                                                                respuestaParcial.mensaje = 'Error Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
                                                                respuesta.detalle.push(respuestaParcial);
                                                            }
                                                        } else {
                                                            var mensaje = 'No Se encontraron Cupones';
                                                            respuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SREM009';
                                                            respuestaParcial.mensaje = 'Error Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
                                                            respuesta.detalle.push(respuestaParcial);
                                                        }
                                                    } else {
                                                        if (utilities.isEmpty(searchCupones)) {
                                                            var mensaje = 'Error Consultando Cupones Asociados a las ID de Ordenes del Remito - No se recibio respuesta de la Busqueda';
                                                            respuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SREM007';
                                                            respuestaParcial.mensaje = 'Error Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
                                                            respuesta.detalle.push(respuestaParcial);
                                                        } else {
                                                            var mensaje = 'Error Consultando Cupones Asociados a las ID de Ordenes del Remito';
                                                            respuesta.error = true;
                                                            respuestaParcial = new Object();
                                                            respuestaParcial.codigo = 'SREM008';
                                                            respuestaParcial.mensaje = 'Error Consultando Cupones Asociados a las ID de Ordenes del Remito con ID Interno : ' + respuesta.idRemito + ' - Tipo Error : ' + searchCupones.tipoError + ' - Descripcion : ' + searchCupones.descripcion;
                                                            respuesta.detalle.push(respuestaParcial);
                                                        }
                                                    }
                                                    // FIN - Consultar Cupones por Orden de Venta e ID Orden
                                                } else {
                                                    // No se encontraron ID de Linea de OV en el Remito
                                                    var mensaje = 'Error Obteniendo informaciòn de la Linea del Remito - No se encontraron lineas';
                                                    respuesta.error = true;
                                                    respuestaParcial = new Object();
                                                    respuestaParcial.codigo = 'SREM006';
                                                    respuestaParcial.mensaje = 'Error Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
                                                    respuesta.detalle.push(respuestaParcial);
                                                }
                                            }
                                        
                                    }
                                }
                            }
                        } else {
                            var mensaje = 'Error cargando Registro de Remito';
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SREM004';
                            respuestaParcial.mensaje = 'Error Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
                            respuesta.detalle.push(respuestaParcial);
                        }
                    } else {
                        var mensaje = 'Error obteniendo la siguiente informacion del Remito : ';
                        if (utilities.isEmpty(idRemito)) {
                            mensaje = mensaje + " ID Interno del Remito / ";
                        }
                        if (utilities.isEmpty(tipoTransaccion)) {
                            mensaje = mensaje + " Tipo de transaccion / ";
                        }
                        respuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'SREM003';
                        respuestaParcial.mensaje = 'Error Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
                        respuesta.detalle.push(respuestaParcial);
                    }
                }

            } catch (excepcionGeneral) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'SREM002';
                respuestaParcial.mensaje = 'Excepcion Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Excepcion : ' + excepcionGeneral.message.toString();
                respuesta.detalle.push(respuestaParcial);
            }

            log.debug('Grabar Remito', 'Respuesta : ' + JSON.stringify(respuesta));

            if (respuesta.error == true && !utilities.isEmpty(respuesta.detalle) && respuesta.detalle.length > 0) {
                log.error('Grabar Remito', 'Error Grabado el Remito con ID Interno : ' + respuesta.idRemito + ' Error : ' + JSON.stringify(respuesta));
                throw utilities.crearError('SREM001', 'Error Actualizando Remito en Cupones para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + JSON.stringify(respuesta));
            }

            log.audit('Fin Grabar Remito', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

        }

        return {
            afterSubmit: afterSubmit
        };

    });

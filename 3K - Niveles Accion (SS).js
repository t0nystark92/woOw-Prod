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
define(['N/error', 'N/record', 'N/search', 'N/format', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function(error, record, search, format, utilities, funcionalidades) {


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
            var respuesta = new Object({});
            respuesta.error = false;
            respuesta.detalle = [];


            try {
                log.audit('Niveles de Acción', 'INCIO NIVELES DE ACCION');

                var objRecordCupon = scriptContext.newRecord;

                var nivelAccionNuevo = objRecordCupon.getValue({
                    fieldId: 'custrecord_3k_cupon_nivel_accion_1'
                });

                var nivelAccionOld = scriptContext.oldRecord.getValue({
                    fieldId: 'custrecord_3k_cupon_nivel_accion_1'
                });

                /*var idCarrito = objRecordCupon.getValue({
                    fieldId: 'custrecord_3k_cupon_ord_venta'
                });

                var IDOrden = objRecordCupon.getValue({
                    fieldId: 'custrecord_3k_cupon_id_orden'
                });*/

                /*var fechaDisponibilidadClienteNew = objRecordCupon.getValue({
                    fieldId: 'custrecord_3k_cupon_fecha_dis_cliente'
                });

                var fechaDisponibilidadClienteOld = scriptContext.oldRecord.getValue({
                    fieldId: 'custrecord_3k_cupon_fecha_dis_cliente'
                });*/

                //log.debug('Niveles de Acción', 'nivelAccionNuevo: ' + nivelAccionNuevo);
                //log.debug('Niveles de Acción', 'nivelAccionOld: ' + nivelAccionOld);
                //log.debug('Niveles de Acción', 'fechaDisponibilidadClienteNew: ' + fechaDisponibilidadClienteNew);
                //log.debug('Niveles de Acción', 'fechaDisponibilidadClienteOld: ' + fechaDisponibilidadClienteOld);
                //log.debug('Niveles de Acción', 'scriptContext.type: ' + scriptContext.type);

                //if (nivelAccionNuevo != nivelAccionOld) {

                if (!utilities.isEmpty(nivelAccionNuevo)) {

                    var diasImpactoObj = search.lookupFields({
                        type: 'customrecord_3k_niveles_accion',
                        id: nivelAccionNuevo,
                        columns: ['custrecord_3k_niveles_accion_dias_impact']
                    });

                    //log.debug('Niveles de Acción', 'diasImpactoObj: ' + JSON.stringify(diasImpactoObj));
                    //alert('diasImpactoObj: ' + JSON.stringify(diasImpactoObj));

                    var diasImpacto = diasImpactoObj.custrecord_3k_niveles_accion_dias_impact;

                    if (!utilities.isEmpty(diasImpacto) && diasImpacto > 0) {
                        log.debug('Niveles de Acción', 'diasImpacto: ' + diasImpacto);
                        //alert('diasImpacto: ' + JSON.stringify(diasImpacto));

                        /*var fechaDisponibilidadCliente = objRecordCupon.getValue({
                            fieldId: 'custrecord_3k_cupon_fecha_dis_cliente'
                        });*/
                        if (scriptContext.type == "xedit") {

                            var fechaDisponibilidadCliente = scriptContext.oldRecord.getValue({
                                fieldId: 'custrecord_3k_cupon_fecha_dis_cliente'
                            });

                            var idCarrito = scriptContext.oldRecord.getValue({
                                fieldId: 'custrecord_3k_cupon_ord_venta'
                            });

                            var IDOrden = scriptContext.oldRecord.getValue({
                                fieldId: 'custrecord_3k_cupon_id_orden'
                            });

                            var fechaEntrega = scriptContext.oldRecord.getValue({
                                fieldId: 'custrecord_3k_cupon_fecha_entrega'
                            });

                            var nroAplicado = scriptContext.oldRecord.getValue({
                                fieldId: 'custrecord_3k_cupon_nievel_accion_apli'
                            });

                        } else {

                            var fechaDisponibilidadCliente = objRecordCupon.getValue({
                                fieldId: 'custrecord_3k_cupon_fecha_dis_cliente'
                            });

                            var idCarrito = objRecordCupon.getValue({
                                fieldId: 'custrecord_3k_cupon_ord_venta'
                            });

                            var IDOrden = objRecordCupon.getValue({
                                fieldId: 'custrecord_3k_cupon_id_orden'
                            });

                            var fechaEntrega = objRecordCupon.getValue({
                                fieldId: 'custrecord_3k_cupon_fecha_entrega'
                            });

                            var nroAplicado = objRecordCupon.getValue({
                                fieldId: 'custrecord_3k_cupon_nievel_accion_apli'
                            });

                        }

                        log.debug('Niveles de Acción', 'fechaDisponibilidadCliente: ' + fechaDisponibilidadCliente);
                        log.debug('Niveles de Acción', 'fechaEntrega: ' + fechaEntrega);
                        //alert('fechaDisponibilidadCliente: ' + fechaDisponibilidadCliente);

                        if (!utilities.isEmpty(fechaDisponibilidadCliente)) {


                            var fechaParse = format.parse({
                                value: fechaDisponibilidadCliente,
                                type: format.Type.DATE,
                                //timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                            });

                            var fechaParseEntrega = format.parse({
                                value: fechaEntrega,
                                type: format.Type.DATE,
                                //timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                            });

                            var newFechaDisponibilidad = fechaParse;
                            var newFechaEntrega = fechaParseEntrega;

                            var arrayDiasNoLaborales = [];

                            result = consultarDiasNoLoborables();
                            if (result.error) {
                                log.error('Niveles Accion', 'Error: ' + result);
                            }

                            arrayDiasNoLaborales = result.arrayDiasNoLaborables;

                            var diasTotales = 1;
                            for (var i = 1; i <= diasImpacto; i++) {
                                var fechaRecorrida = new Date(newFechaDisponibilidad.getTime());
                                //fechaRecorrida.setDate(newFechaDisponibilidad.getDate());

                                fechaRecorrida.setDate(newFechaDisponibilidad.getDate() + diasTotales);

                                log.debug('NIVELES', 'diasTotales: ' + diasTotales);
                                log.debug('NIVELES', 'newFechaDisponibilidad: ' + newFechaDisponibilidad);
                                log.debug('NIVELES', 'fechaRecorrida: ' + fechaRecorrida);
                                log.debug('NIVELES', 'fechaParse: ' + fechaParse);
                                log.debug('NIVELES', 'i: ' + i);

                                var resultFilter = arrayDiasNoLaborales.filter(function(obj) {
                                    /*log.debug('NIVELES FILTER', 'obj.fecha: ' + obj.fecha);
                                    var fechaFeriado = new Date(obj.fecha.getTime());
                                    log.debug('NIVELES FILTER', 'fechaFeriado: ' + fechaFeriado);
                                    log.debug('NIVELES FILTER', 'fechaRecorrida: ' + fechaRecorrida);

                                    lo.debug('NIVELES FILTER', 'fechaFeriado.getTime(): ' + fechaFeriado.getTime() + ' fechaRecorrida.getTime(): ' + fechaRecorrida.getTime());*/
                                    return (obj.fecha.getTime() == fechaRecorrida.getTime());
                                });

                                //log.debug('NIVELES FILTER', 'obj.fecha.getTime()' + obj.fecha.getTime() +' fechaRecorrida.getTime(): '+ fechaRecorrida.getTime());

                                if (!utilities.isEmpty(resultFilter) && resultFilter.length > 0) {
                                    i--;

                                }

                                diasTotales++;
                            }

                            newFechaDisponibilidad.setDate(newFechaDisponibilidad.getDate() + parseInt(diasTotales, 10));

                            // Fecha Entrega
                            var diasTotales = 1;
                            for (var i = 1; i <= diasImpacto; i++) {
                                var fechaRecorrida = new Date(newFechaEntrega.getTime());
                                //fechaRecorrida.setDate(newFechaDisponibilidad.getDate());

                                fechaRecorrida.setDate(newFechaEntrega.getDate() + diasTotales);

                                log.debug('NIVELES', 'diasTotales: ' + diasTotales);
                                log.debug('NIVELES', 'newFechaEntrega: ' + newFechaEntrega);
                                log.debug('NIVELES', 'fechaRecorrida: ' + fechaRecorrida);
                                log.debug('NIVELES', 'fechaParse: ' + fechaParse);
                                log.debug('NIVELES', 'i: ' + i);

                                var resultFilter = arrayDiasNoLaborales.filter(function(obj) {
                                    return (obj.fecha.getTime() == fechaRecorrida.getTime());
                                });

                                //log.debug('NIVELES FILTER', 'obj.fecha.getTime()' + obj.fecha.getTime() +' fechaRecorrida.getTime(): '+ fechaRecorrida.getTime());

                                if (!utilities.isEmpty(resultFilter) && resultFilter.length > 0) {
                                    i--;

                                }

                                diasTotales++;
                            }

                            newFechaEntrega.setDate(newFechaEntrega.getDate() + parseInt(diasTotales, 10));



                            log.debug('Niveles de Acción', 'newFechaDisponibilidad: ' + newFechaDisponibilidad);
                            log.debug('Niveles de Acción', 'newFechaEntrega: ' + newFechaEntrega);
                            //alert('newFechaDisponibilidad: ' + newFechaDisponibilidad);

                            /*rec.setValue({
                                fieldId: 'custrecord_3k_cupon_fecha_dis_cliente',
                                value: newFechaDisponibilidad
                            });*/

                            var fechaString = format.format({
                                value: newFechaDisponibilidad,
                                type: format.Type.DATE,
                                //timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                            });

                            var fechaStringEntrega = format.format({
                                value: newFechaEntrega,
                                type: format.Type.DATE,
                                //timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                            });

                            if(utilities.isEmpty(nroAplicado)) 
                                nroAplicado = 0;
                            
                            nroAplicado = parseInt(nroAplicado,10) + 1;

                            record.submitFields({
                                type: 'customrecord_3k_cupones',
                                id: objRecordCupon.id,
                                values: {
                                    custrecord_3k_cupon_fecha_dis_cliente: fechaString,
                                    custrecord_3k_cupon_fecha_entrega: fechaStringEntrega,
                                    custrecord_3k_cupon_nievel_accion_apli: nroAplicado

                                }
                            });

                            //INICIO ACTUALIZAR FECHA EN LA OV

                            log.debug('NIVELES', 'ID Carrito : ' + idCarrito);

                            var objRecordOV = record.load({
                                type: record.Type.SALES_ORDER,
                                id: idCarrito,
                                isDynamic: false
                            });

                            var lineNumber = objRecordOV.findSublistLineWithValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_id_orden',
                                value: IDOrden
                            });

                            log.debug('NIVELES', 'ID Linea : ' + lineNumber);

                            var fechaDisponibilidadOrden = objRecordOV.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_fecha_disponibiliad',
                                line: lineNumber
                            });

                            var fechaEntregaOrden = objRecordOV.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_fecha_entrega',
                                line: lineNumber
                            });

                            var guardarFecha = true;
                            var guardarFechaEntrega = true;

                            log.debug('NIVELES', 'fechaDisponibilidadOrden: ' + fechaDisponibilidadOrden);
                            log.debug('NIVELES', 'newFechaDisponibilidad: ' + newFechaDisponibilidad);

                            if (!utilities.isEmpty(fechaDisponibilidadOrden) && fechaDisponibilidadOrden > newFechaDisponibilidad) {

                                guardarFecha = false;

                            }

                            if (!utilities.isEmpty(fechaEntregaOrden) && fechaEntregaOrden > newFechaEntrega) {

                                guardarFechaEntrega = false;

                            }

                            if (guardarFecha) {
                                objRecordOV.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_fecha_disponibiliad',
                                    value: newFechaDisponibilidad,
                                    line: lineNumber
                                });
                            }

                            if (guardarFechaEntrega) {
                                objRecordOV.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_fecha_entrega',
                                    value: newFechaEntrega,
                                    line: lineNumber
                                });
                            }

                            objRecordOV.save();

                            //FIN ACTUALIZAR FECHA EN LA OV

                        }
                    }

                }



                //}



                log.audit('Niveles de Acción', 'FIN NIVELES DE ACCION');
            } catch (e) {
                respuesta.error = true;
                objrespuestaParcial = new Object({});
                objrespuestaParcial.codigo = 'RCCE001';
                objrespuestaParcial.mensaje += 'Excepción: ' + e;
                respuesta.detalle.push(objrespuestaParcial);
                log.error('Niveles Acción', 'Excepción: ' + JSON.stringify(respuesta));
            }


        }

        function consultarDiasNoLoborables() {
            var respuesta = new Object();
            respuesta.error = false;
            //respuesta.tipoError = '';
            //respuesta.mensaje = '';
            respuesta.arrayDiasNoLaborables = new Array();
            respuesta.detalle = new Array();

            // INICIO - Obtener Array de Dias No Laborable
            var objResultSet = utilities.searchSaved('customsearch_3k_calendario_dias_no_lab');
            if (objResultSet.error) {
                respuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'SROV018';
                objRespuestaParcial.mensaje = 'Error Obteniendo Calendario de Dias No Laborables - Tipo Error : ' + objResultSet.tipoError + ' - Descripcion : ' + objResultSet.descripcion;;
                respuesta.detalle.push(objRespuestaParcial);
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

            return respuesta;

            // FIN - Obtener Array de Dias No Laborables
        }


        return {

            afterSubmit: afterSubmit
        };

    });
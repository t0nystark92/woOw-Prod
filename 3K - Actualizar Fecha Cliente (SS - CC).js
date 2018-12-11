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
            log.audit('Consulta Stock', 'INICIO Actualizar Fecha Cliente');

            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.detalle = [];

            var idRec = scriptContext.newRecord.id;
            var requestBody = scriptContext.newRecord.getValue({ fieldId: 'custrecord_3k_act_fecha_ov_informacion' });
            var type = scriptContext.type;

            if (scriptContext.type == 'create') {

                try {

                    if (!utilities.isEmpty(requestBody)) {

                        var body = isJSON(requestBody);
                        if (!body.error) {
                            var informacion = body.json;

                            var carrito = informacion.carrito;
                            var idOrdenes = informacion.idOrdenes;
                            var arrayOrdenesActualizadas = [];
                            var cuponesOV = [];

                            var objRecordOV = record.load({
                                type: record.Type.SALES_ORDER,
                                id: carrito,
                                isDynamic: false
                            });

                            var numLinesCupon = objRecordOV.getLineCount({
                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta'
                            });

                            var numlines = objRecordOV.getLineCount({
                                sublistId: 'item'
                            });

                            for (var j = 0; j < numLinesCupon; j++) {
                                var obj = new Object({});

                                obj.index = j;

                                obj.idCupon = objRecordOV.getSublistValue({
                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                    fieldId: 'internalid',
                                    line: j
                                });

                                obj.idOrdenDetalle = objRecordOV.getSublistValue({
                                    sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                    fieldId: 'custrecord_3k_cupon_id_orden',
                                    line: j
                                });

                                cuponesOV.push(obj);
                            }

                            for (var i = 0; i < numlines; i++) {

                                var IDOrden = objRecordOV.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_3k_id_orden',
                                    line: i
                                });

                                var arrayFilter = idOrdenes.filter(function(obj) {
                                    return (obj.idOrden == IDOrden);
                                });

                                if (!utilities.isEmpty(arrayFilter) && arrayFilter.length > 0) {

                                    var fechaCliente = format.parse({
                                        value: arrayFilter[0].fechaCliente,
                                        type: format.Type.DATE,
                                    });

                                    objRecordOV.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_3k_fecha_disponibiliad',
                                        value: fechaCliente,
                                        line: i
                                    });

                                    var arrayFilterCupones = cuponesOV.filter(function(obj) {
                                        return (obj.idOrdenDetalle == IDOrden);
                                    });

                                    if (!utilities.isEmpty(arrayFilterCupones) && arrayFilterCupones.length > 0) {

                                        for (var k = 0; k < arrayFilterCupones.length; k++) {

                                            objRecordOV.setSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_fecha_dis_cliente',
                                                value: fechaCliente,
                                                line: arrayFilterCupones[k].index
                                            });

                                            objRecordOV.setSublistValue({
                                                sublistId: 'recmachcustrecord_3k_cupon_ord_venta',
                                                fieldId: 'custrecord_3k_cupon_fecha_dis_cli_ini',
                                                value: fechaCliente,
                                                line: arrayFilterCupones[k].index
                                            });
                                        }
                                    }

                                    arrayOrdenesActualizadas.push(IDOrden);
                                }


                            }

                            var recId = objRecordOV.save();

                            objRespuesta.carrito = recId;
                            objRespuesta.ordenesActualizadas = arrayOrdenesActualizadas;


                        } else {
                            objRespuesta.error = true;
                            objrespuestaParcial = new Object({});
                            objrespuestaParcial.codigo = 'RAFC003';
                            objrespuestaParcial.mensaje += 'Excepción: ' + body.excepcion;
                            respuesta.detalle.push(objrespuestaParcial);
                        }

                    } else {
                        objRespuesta.error = true;
                        objrespuestaParcial = new Object({});
                        objrespuestaParcial.codigo = 'RAFC002';
                        objrespuestaParcial.mensaje += 'No se recibió request Body.';
                        objRespuesta.detalle.push(objrespuestaParcial);
                    }

                } catch (e) {
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object({});
                    objRespuestaParcial.codigo = 'RAFC001';
                    objRespuestaParcial.mensaje = 'Actualizar Fecha Cliente Excepcion: ' + e;
                    objRespuesta.detalle.push(objRespuestaParcial);
                    //objRespuesta.tipoError = 'RCSA003';
                    //objRespuesta.descripcion = 'Consulta Stock Articulo Excepcion: ' + e;
                    log.error('RCSA001', 'Actualizar Fecha Cliente Excepcion: ' + e);
                }

                var idRecord = record.submitFields({
                    type: 'customrecord_3k_actualizar_fecha_ov',
                    id: idRec,
                    values: {
                        custrecord_3k_act_fecha_ov_respuesta: JSON.stringify(objRespuesta)
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: false
                    }
                });
            }

            log.audit('Consulta Stock', 'FIN Actualizar Fecha Cliente');

        }

        function isJSON(body) {
            //var isJSON = true;
            var respuesta = new Object({});

            try {
                respuesta.json = JSON.parse(body);
                //return respuesta;
            } catch (e) {
                //isJSON=false;
                respuesta.error = true;
                respuesta.excepcion = e;

            }

            return respuesta;
        }

        return {
            afterSubmit: afterSubmit
        };

    });

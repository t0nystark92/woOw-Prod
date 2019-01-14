/**
 * @NApiVersion 2.x
 * @NAmdConfig ./configuration.json
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

    function (error, record, search, format, utilities, funcionalidades) {

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
            respuesta.error = false;
            respuesta.detalle = new Array();

            if (scriptContext.type == 'create') {

                try {

                    log.audit('Programa Fidelidad (SS)', 'INICIO - afterSubmit');

                    var recId = scriptContext.newRecord.id;
                    var recType = scriptContext.newRecord.type;

                    var objOV = record.load({
                        type: recType,
                        id: recId,
                        isDynamic: true,
                    });

                    var fidelidadOV = objOV.getValue({
                        fieldId: 'custbody_3k_programa_fidelidad'
                    });

                    var servicioOV = objOV.getValue({
                        fieldId: 'custbody_3k_ov_servicio'
                    });

                    log.debug('Programa Fidelidad (SS) - afterSubmit', 'servicioOV: ' + servicioOV + ', fidelidadOV: ' + fidelidadOV);

                    //La OV corresponde a Programa de Fidelidad
                    if (fidelidadOV == true) {
                        var fcBanco = crearFactura(recId, 'BANCO');

                        if (servicioOV == true) {
                            var fcCliente = crearFactura(recId, 'CLIENTE');
                            //var generarOC = crearOrdenCompra();
                        }

                    }

                } catch (excepcion) {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'UPFD001';
                    respuestaParcial.mensaje += excepcion;
                    respuesta.detalle.push(respuestaParcial);
                    log.error('Programa Fidelidad (SS) - afterSubmit', 'UPFD001 - Excepcion : ' + excepcion);
                }

                log.audit('Programa Fidelidad (SS)', 'FIN - afterSubmit');

            }
        }

        function crearFactura(recId, tipo) {

            var respuesta = new Object();
            respuesta.error = false;
            respuesta.detalle = new Array();
            var arrayFacturas = new Array();

            try {

                log.audit('crearFactura', 'INICIO - Crear Factura ' + tipo);

                var objRecord = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: recId,
                    toType: record.Type.INVOICE,
                    isDynamic: true
                });


                var numLines = objRecord.getLineCount({
                    sublistId: 'item'
                });

                log.debug('crearFactura', 'Cantidad Lineas OV: ' + numLines);

                for (var i = 0; i < numLines; i++) {

                    var esFidelidad = objRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_programa_fidelidad',
                        line: i
                    });

                    var clienteFidelidad = objRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_cl_fact_fidelidad',
                        line: i
                    });

                    if (tipo == 'CLIENTE') {
                        if (esFidelidad) {
                            objRecord.removeLine({
                                sublistId: 'item',
                                line: i
                            });
                            i--;
                            numLines--;
                        }
                    } else {
                        if (!esFidelidad) {
                            objRecord.removeLine({
                                sublistId: 'item',
                                line: i
                            });
                            i--;
                            numLines--;
                        }
                    }

                }

                var numLines = objRecord.getLineCount({
                    sublistId: 'item'
                });

                log.debug('crearFactura', 'Cantidad Lineas FC: ' + numLines);


                if (tipo == 'BANCO') {

                    log.debug('crearFactura', 'clienteFidelidad: ' + clienteFidelidad);

                    objRecord.setValue({
                        fieldId: 'entity',
                        value: clienteFidelidad
                    });

                }

                /*custbody_l598_codigo_serie: 'A'
                custbody_l598_caja: "1"
                custbody_l598_codigo_sucursal: "1"
                custbody_l598_cae_serie: "A"
                custbody_l598_serie_comprobante: "1"
                custbody_l598_sucursal: "1"
                custbody_l598_tipo_comprobante: "4"*/

                /*objRecord.setValue({
                    fieldId: 'custbody_l598_tipo_comprobante',
                    value: 4
                });

                objRecord.setValue({
                    fieldId: 'custbody_l598_serie_comprobante',
                    value: 1
                });

                objRecord.setValue({
                    fieldId: 'custbody_l598_cae_serie',
                    value: 'A'
                });

                objRecord.setValue({
                    fieldId: 'custbody_l598_codigo_serie',
                    value: 'A'
                });

                objRecord.setValue({
                    fieldId: 'custbody_l598_sucursal',
                    value: 1
                });

                objRecord.setValue({
                    fieldId: 'custbody_l598_caja',
                    value: 1
                });*/


                var saveID = objRecord.save();
                log.debug('crearFactura', 'Registro Factura: ' + saveID);

                arrayFacturas.push(saveID);

                var generarCAE = callGenerarCAE(arrayFacturas);

                log.debug('crearFactura', 'generarCAE: ' + generarCAE);

                log.audit('crearFactura', 'FIN - Crear Factura ' + tipo);

            } catch (excepcion) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'UCFC001';
                respuestaParcial.mensaje += excepcion;
                respuesta.detalle.push(respuestaParcial);
                log.error('crearFactura', 'UCFC001 - Excepcion : ' + excepcion);
            }

        }


        function callGenerarCAE(arrayFacturas) {

            var objRespuesta = new Object({});
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();
            objRespuesta.idFactura = '';
            objRespuesta.carrito = '';
            var arrayRespuesta = new Array();

            log.audit('callGenerarCAE', 'INICIO - Generar CAE ');

            try {

                // INICIO - Consultar Subsidiaria Facturacion Electronica
                var subsidiaria = '';

                var searchConfig = utilities.searchSaved('customsearch_3k_config_sub_fact');

                if (!utilities.isEmpty(searchConfig) && !searchConfig.error) {
                    if (!utilities.isEmpty(searchConfig.objRsponseFunction.result) && searchConfig.objRsponseFunction.result.length > 0) {
                        subsidiaria = searchConfig.objRsponseFunction.result[0].getValue({
                            name: searchConfig.objRsponseFunction.search.columns[1]
                        });

                        log.debug('callGenerarCAE', 'Subsidiaria Facturacion Electronica: ' + subsidiaria);

                        if (utilities.isEmpty(subsidiaria)) {
                            objRespuestaN.error = true;
                            var mensaje = 'No se encuentra configurada la siguiente informacion del panel de configuracion de Subsidiaria Facturacion : ';
                            if (utilities.isEmpty(subsidiaria)) {
                                mensaje = mensaje + ' Subsidiaria / ';
                            }

                            objRespuestaParcial = new Object();
                            objRespuestaParcial.codigo = 'UCGC002';
                            objRespuestaParcial.mensaje = mensaje;
                            objRespuestaN.detalle.push(objRespuestaParcial);
                            /*log.error('UCGC002', mensaje);
                            return JSON.stringify(objRespuesta);*/
                            arrayRespuesta.push(objRespuestaN);
                            //continue;
                        }
                    } else {
                        objRespuestaN.error = true;
                        var mensaje = 'No se encuentra realizada la configuracion de Subsidiaria Facturacion : ';

                        objRespuestaParcial = new Object();
                        objRespuestaParcial.codigo = 'UCGC003';
                        objRespuestaParcial.mensaje = mensaje;
                        objRespuestaN.detalle.push(objRespuestaParcial);
                        /*log.error('UCGC003', mensaje);
                        return JSON.stringify(objRespuesta);*/
                        arrayRespuesta.push(objRespuestaN);
                        //continue;
                    }
                } else {
                    objRespuestaN.error = true;
                    var mensaje = 'Error Consultando Configuracion de Subsidiaria de Facturacion - Tipo Error : ' + searchConfig.tipoError + ' - Descripcion : ' + searchConfig.descripcion;

                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'UCGC004';
                    objRespuestaParcial.mensaje = mensaje;
                    objRespuestaN.detalle.push(objRespuestaParcial);
                    /*log.error('UCGC004', mensaje);
                    return JSON.stringify(objRespuesta);*/
                    arrayRespuesta.push(objRespuestaN);
                    //continue;
                }


                objRespuesta.resultCae = funcionalidades.generarCAE(arrayFacturas, subsidiaria);
                
                log.debug('callGenerarCAE', 'objRespuesta.resultCae: ' + JSON.stringify(objRespuesta.resultCae));

                if (objRespuesta.resultCae.error) {
                    //return objRespuesta.resultCae;
                    //objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = objRespuesta.resultCae.codigo;
                    objRespuestaParcial.mensaje = objRespuesta.resultCae.mensaje;
                    //objRespuesta.detalle.push(objRespuestaParcial);

                    if (arrayRespuesta.length > 0) {
                        for (var qq = 0; qq < arrayRespuesta.length; qq++) {
                            arrayRespuesta[qq].error = true;
                            arrayRespuesta[qq].detalle.push(objRespuestaParcial);
                        }
                    } else {
                        var objetoRespuestaN = new Object();
                        objetoRespuestaN.error = true;
                        objetoRespuestaN.idFactura = '';
                        objetoRespuestaN.idCarrito = '';
                        objetoRespuestaN.detalle = new Array();
                        objetoRespuestaN.detalle.push(objRespuestaParcial);
                        arrayRespuesta.push(objetoRespuestaN);
                    }
                }


            } catch (excepcion) {
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'UCGC001';
                objRespuestaParcial.mensaje = 'function doPost: ' + e.message;
                //objRespuesta.detalle.push(objRespuestaParcial);
                //objRespuesta.tipoError = 'RFAC002';
                //objRespuesta.descripcion = 'function doPost: ' + e.message;
                log.error('UCGC001', 'funtion doPost: ' + e.message + ' request:' + JSON.stringify(objOrden));

                if (arrayRespuesta.length > 0) {
                    for (var qq = 0; qq < arrayRespuesta.length; qq++) {
                        arrayRespuesta[qq].error = true;
                        arrayRespuesta[qq].detalle.push(objRespuestaParcial);
                    }
                } else {
                    var objetoRespuestaN = new Object();
                    objetoRespuestaN.error = true;
                    objetoRespuestaN.idFactura = '';
                    objetoRespuestaN.idCarrito = '';
                    objetoRespuestaN.detalle = new Array();
                    objetoRespuestaN.detalle.push(objRespuestaParcial);
                    arrayRespuesta.push(objetoRespuestaN);
                }

                //arrayRespuesta.push(objRespuesta);
                return JSON.stringify(arrayRespuesta);
            }

            log.audit('callGenerarCAE', 'FIN - Generar CAE ');

        }

        return {
            afterSubmit: afterSubmit
        };

    });


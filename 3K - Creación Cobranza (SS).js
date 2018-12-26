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
            var error = false;
            var codigoError = '';
            var mensajeError = '';

            var respuesta = new Object();
            respuesta.error = false;
            respuesta.detalle = new Array();
                
            if (scriptContext.type == 'create'){

                try {

                log.audit('Creación Cobranza (SS)', 'INICIO - afterSubmit');                

                var recId = scriptContext.newRecord.id;
                var recType = scriptContext.newRecord.type;

                var objRecord = record.load({
                    type: recType,
                    id: recId,
                    isDynamic: true,
                });

                idOV = objRecord.id;

                var objOV = new Object({});
                var arrayOV = new Array();

                objOV.idOV = idOV;

                objOV.idCliente = objRecord.getValue({
                    fieldId: 'entity' 
                });

                objOV.monedaOV = objRecord.getValue({
                    fieldId: 'currency' 
                });

                objOV.tipoCambioOV = objRecord.getValue({
                    fieldId: 'exchangerate' 
                });

                objOV.tipoCambioPago = objRecord.getValue({
                    fieldId: 'custbody_3k_tc_woow_ov' 
                });

                objOV.monedaPago = objRecord.getValue({
                    fieldId: 'custbody_3k_moneda_pago_ov' 
                });

                objOV.esServicio = objRecord.getValue({
                    fieldId: 'custbody_3k_ov_servicio' 
                });

                objOV.esTravel = objRecord.getValue({
                    fieldId: 'custbody_3k_ov_travel' 
                });

                arrayOV.push(objOV);

                log.debug('Creación Cobranza (SS) - afterSubmit', 'arrayOV: ' + JSON.stringify(arrayOV)  + ', arrayOV.length: ' + arrayOV.length);

                //INICIO - CONSULTAR/LLENAR ARRAY DE FORMAS DE PAGO

                var cantidadLineasFormaPago = objRecord.getLineCount({
                    sublistId: 'recmachcustrecord_3k_formas_de_pago_ov'
                });                

                var arrayFormasPago = new Array();

                log.debug('Creación Cobranza (SS) - afterSubmit', 'cantidadLineasFormaPago: ' + cantidadLineasFormaPago);

                if (cantidadLineasFormaPago > 0) {

                    for (var i = 0; i < cantidadLineasFormaPago; i++) {
                        var objFormasPago = new Object({});

                        var lineNum = objRecord.selectLine({
                            sublistId: 'recmachcustrecord_3k_formas_de_pago_ov',
                            line: i
                        });

                        objFormasPago.internalID = objRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_3k_formas_de_pago_ov',
                            fieldId: 'internalid'
                        });

                        objFormasPago.formaPago = objRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_3k_formas_de_pago_ov',
                            fieldId: 'custrecord_3k_formas_de_pago_forma'
                        });

                        objFormasPago.importePago = objRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_3k_formas_de_pago_ov',
                            fieldId: 'custrecord_3k_formas_de_pago_importe'
                        });

                        objFormasPago.cantidadCuotas = objRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_3k_formas_de_pago_ov',
                            fieldId: 'custrecord_3k_formas_de_pago_cuotas'
                        });

                        arrayFormasPago.push(objFormasPago);
                    }

                    log.debug('Creación Cobranza (SS) - afterSubmit', 'arrayFormasPago: ' + JSON.stringify(arrayFormasPago) + ', arrayFormasPago.length: ' + arrayFormasPago.length);

                }

                //FIN - CONSULTAR/LLENAR ARRAY DE FORMAS DE PAGO


                if (!utilities.isEmpty(arrayOV) && arrayOV.length > 0 && !utilities.isEmpty(arrayFormasPago) && arrayFormasPago.length) {

                    var respuestaCrearDepositos = funcionalidades.crearDepositos(arrayOV, arrayFormasPago);
                    if (respuestaCrearDepositos.error) {
                        return JSON.stringify(respuestaCrearDepositos);
                    }

                    respuesta = respuestaCrearDepositos;
                }

                } catch (excepcion) {
                    error = true;
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'UCOB001';
                    respuestaParcial.mensaje += excepcion;
                    respuesta.detalle.push(respuestaParcial);
                    log.error('Creación Cobranza (SS) - afterSubmit', 'UCOB001 - Excepcion : ' + excepcion);                                                                                                                                                                                                                                                                                               
                }

            log.audit('Creación Cobranza (SS)', 'FIN - afterSubmit');       

            }         
        }

        return {
            afterSubmit: afterSubmit
        };

    });


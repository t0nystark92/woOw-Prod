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
        function beforeSubmit(scriptContext) {
            var respuesta = new Object({});
            respuesta.error = false;
            respuesta.detalle = [];


            try {
                log.audit('Ship Envio Logistica', 'INICIO Ship Envio Logistica');

                if(scriptContext.type == 'edit'){

                var objRecord = scriptContext.newRecord;

                var enviado = objRecord.getValue({
                    fieldId: 'custrecord_3k_cupon_envio_ok'
                });

                var enviadoOld = scriptContext.oldRecord.getValue({
                    fieldId: 'custrecord_3k_cupon_envio_ok'
                });

                if (enviado != enviadoOld) {

                    if (scriptContext.type == 'xedit') {

                        var idRemito = scriptContext.oldRecord.getValue({
                            fieldId: 'custrecord_3k_cupon_remito'
                        });

                    }else{

                       var idRemito = objRecord.getValue({
                            fieldId: 'custrecord_3k_cupon_remito'
                        }); 
                    }

                    log.debug('ship', ' idRemito: '+ idRemito);

                        var objFieldLookUpRecord = search.lookupFields({
                            type: record.Type.ITEM_FULFILLMENT,
                            id: idRemito,
                            columns: ['status']
                        });


                        log.debug('ship', 'objFieldLookUpRecord: '+ JSON.stringify(objFieldLookUpRecord));

                        var statusRemito = objFieldLookUpRecord.status[0].value;

                        log.debug('ship', 'status: '+ statusRemito);

                        if (enviado) {

                            if (statusRemito == 'picked') {

                                var fechaJS = new Date();



                                var fechaString = format.format({
                                    value: fechaJS,
                                    type: format.Type.DATE,
                                    timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                                });

                                var fechaNS = format.parse({
                                    value: fechaString,
                                    type: format.Type.DATE,
                                    timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                                });

                                /*record.submitFields({
                                    type: 'customrecord_3k_cupones',
                                    id: objRecord.id,
                                    values: {
                                        custrecord_3k_cupon_fecha_envio: fechaString,
                                    }
                                });*/

                                objRecord.setValue({
                                    fieldId: 'custrecord_3k_cupon_fecha_envio',
                                    value: fechaNS
                                });

                                record.submitFields({
                                    type: record.Type.ITEM_FULFILLMENT,
                                    id: idRemito,
                                    values: {
                                        shipstatus: 'C'
                                    },
                                    options: {
                                        enableSourcing: true,
                                        ignoreMandatoryFields: false
                                    }
                                });


                            }
                        } else {
                            if (statusRemito == 'shipped') {

                                /*record.submitFields({
                                    type: 'customrecord_3k_cupones',
                                    id: objRecord.id,
                                    values: {
                                        custrecord_3k_cupon_fecha_envio: null,
                                    }
                                });*/

                                objRecord.setValue({
                                    fieldId: 'custrecord_3k_cupon_fecha_envio',
                                    value: null
                                });

                                record.submitFields({
                                    type: record.Type.ITEM_FULFILLMENT,
                                    id: idRemito,
                                    values: {
                                        shipstatus: 'A'
                                    },
                                    options: {
                                        enableSourcing: true,
                                        ignoreMandatoryFields: false
                                    }
                                });
                            }
                        }
                    
                }
            }

                log.audit('Ship Envio Logistica', 'FIN Ship Envio Logistica');
            } catch (e) {
                respuesta.error = true;
                objrespuestaParcial = new Object({});
                objrespuestaParcial.codigo = 'RCCE001';
                objrespuestaParcial.mensaje += 'Excepción: ' + e;
                respuesta.detalle.push(objrespuestaParcial);
                log.error('Ship Envio Logistica', 'Excepción: ' + JSON.stringify(respuesta));

                throw utilities.crearError('RCCE001', 'Excepcion Ship Envio Logistica - Excepcion : ' + JSON.stringify(respuesta));
            }


        }

        return {

            beforeSubmit: beforeSubmit
        };

    });

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
        function beforeSubmit(scriptContext) {
            log.audit('Inactivar Pilas', 'Inicio el proceso');

            var objrecord = scriptContext.newRecord;

            try {
                //log.audit('DEBUG ', 'context: '+ JSON.stringify(runtime.executionContext));
                if (scriptContext.type == 'create') {

                    var recordObject = new Object({});
                    recordObject.id = objrecord.id;
                    recordObject.skuProveedor = objrecord.getValue({ fieldId: 'custrecord_3k_stock_terc_sku_prov' });
                    recordObject.proveedor = objrecord.getValue({ fieldId: 'custrecord_3k_stock_terc_proveedor' });
                    recordObject.fechaInicio = objrecord.getValue({ fieldId: 'custrecord_3k_stock_terc_fecha_ini' });
                    recordObject.fechaFin = objrecord.getValue({ fieldId: 'custrecord_3k_stock_terc_fecha_fin' });
                    recordObject.push = objrecord.getValue({ fieldId: 'custrecord_3k_stock_tercero_push' });
                    recordObject.articulo = objrecord.getValue({ fieldId: 'custrecord_3k_stock_terc_articulo' });
                    
                    var inactivar = objrecord.getValue({ fieldId: 'custrecord_3k_stock_terc_inactivar_pilas' });

                    if (inactivar) {

                        if(utilities.isEmpty(recordObject.push)){
                            recordObject.push = false;
                        }

                        var objResultSet = utilities.searchSavedPro('customsearch_3k_pilas_inactivar');
                        if (objResultSet.error) {
                            context.response.write(JSON.stringify(objResultSet));
                        }

                        var pilasVigentes = objResultSet.objRsponseFunction.array;
                        log.debug('actualizar pilas', 'pilasVigentes: ' + JSON.stringify(pilasVigentes));

                        var filterPilas = pilasVigentes.filter(function(obj) {
                            return (obj.custrecord_3k_stock_terc_proveedor == recordObject.proveedor && obj.custrecord_3k_stock_terc_articulo == recordObject.articulo && obj.custrecord_3k_stock_tercero_push == recordObject.push);
                        });

                        log.debug('actualizar pilas', 'filterPilas: ' + JSON.stringify(filterPilas));
                        //log.debug('')

                        if (!utilities.isEmpty(filterPilas) && filterPilas.length > 0) {

                            for (var i = 0; i < filterPilas.length; i++) {

                                if (!utilities.isEmpty(recordObject.fechaFin)) {

                                    var fechaFinPilaNuevaNS = format.parse({
                                        value: recordObject.fechaFin,
                                        type: format.Type.DATE
                                    });
                                }

                                var fechaInicioPilaNuevaNS = format.parse({
                                    value: recordObject.fechaInicio,
                                    type: format.Type.DATE
                                });

                                //log.debug('actualizar pilas', 'fechaFinPilaNuevaNS: ' + JSON.stringify(fechaFinPilaNuevaNS));
                                log.debug('actualizar pilas', 'fechaInicioPilaNuevaNS: ' + JSON.stringify(fechaInicioPilaNuevaNS));
                                log.debug('actualizar pilas', 'filterPilas[i].custrecord_3k_stock_terc_fecha_fin: ' + JSON.stringify(filterPilas[i].custrecord_3k_stock_terc_fecha_fin));

                                if (!utilities.isEmpty(filterPilas[i].custrecord_3k_stock_terc_fecha_fin)) {

                                    var fechaFinNS = format.parse({
                                        value: filterPilas[i].custrecord_3k_stock_terc_fecha_fin,
                                        type: format.Type.DATE
                                    });


                                    if (!utilities.isEmpty(fechaFinNS)) {

                                        if (fechaFinNS >= fechaInicioPilaNuevaNS) {
                                            fechaFinNS.setDate(fechaFinNS.getDate() - 1);
                                        }

                                    }
                                    /*else {
                                                                    fechaFinNS.setDate(fechaFinNS.getDate() - 1);
                                                                }*/

                                } else {

                                    log.debug('actualizar pilas', 'entro else');

                                    var fechaFinNS = fechaInicioPilaNuevaNS;
                                    log.debug('actualizar pilas', 'fechaFinNS antes setDate: ' + fechaFinNS);

                                    fechaFinNS.setDate(fechaFinNS.getDate() - 1);
                                }

                                log.debug('actualizar pilas', 'fechaFinNS despues setDate: ' + fechaFinNS);

                                var fechaFinString = format.format({
                                    value: fechaFinNS,
                                    type: format.Type.DATE
                                });

                                var idStockSubmited = record.submitFields({
                                    type: 'customrecord_stock_terceros',
                                    id: filterPilas[i].internalid,
                                    values: {
                                        custrecord_3k_stock_terc_fecha_fin: fechaFinString

                                    },
                                    ignoreFieldChange: false,
                                    fireSlavingSync: true

                                });

                                objrecord.setValue({
                                	fieldId: 'custrecord_3k_stock_terc_inactivar_pilas',
                                	value: false
                                });



                            } //END FOR
                        }
                    }

                }


            } catch (e) {
                log.error('SSTK001', 'function beforeSubmit: ' + e.message);
                //throw utilities.crearError('SSTK001', 'function beforeSubmit: ' + e.message);
                throw e.message;
                //return false
            }

            log.audit('Inactivar Pilas', 'Finalizó el proceso');

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
            log.audit('Actulizar Stock Consumido', 'Inicio el proceso');

            if (scriptContext.type != 'create') {

                var objrecord = scriptContext.newRecord;

                try {
                    //log.audit('DEBUG ', 'context: '+ JSON.stringify(runtime.executionContext));

                    var recordObject = new Object({});
                    recordObject.id = objrecord.id;
                    log.audit('stock Terceros', 'id interno: ' + recordObject.id);

                    var actualizar = objrecord.getValue({ fieldId: 'custrecord_3k_stock_terc_act_stock' });

                    if (actualizar) {

                        var nuevoConsumido = objrecord.getValue({ fieldId: 'custrecord_3k_stock_terc_nuevo_stock' });

                        log.audit('stock Terceros', 'nuevoConsumido: ' + nuevoConsumido);

                        if (!utilities.isEmpty(nuevoConsumido)) {

                            var recordStock = record.load({
                                type: 'customrecord_stock_terceros',
                                id: recordObject.id,
                                isDynamic: true
                            });

                            var consumidoActual = (utilities.isEmpty(recordStock.getValue({ fieldId: 'custrecord_3k_stock_terc_stock_cons' })) ? 0 : recordStock.getValue({ fieldId: 'custrecord_3k_stock_terc_stock_cons' }));
                            /*var stockInicial = (utilities.isEmpty(recordStock.getValue({ fieldId: 'custrecord_3k_stock_terc_stock_ini' })) ? 0 : recordStock.getValue({ fieldId: 'custrecord_3k_stock_terc_stock_ini' }));

                            var disponible = parseInt(stockInicial, 10) - parseInt(consumidoActual, 10);

                            log.audit('stock Terceros', 'disponible: ' + disponible);*/

                            var newStockInicial = parseInt(nuevoConsumido, 10) + parseInt(consumidoActual, 10);

                            log.audit('stock Terceros', 'newStockInicial: ' + newStockInicial);

                            recordStock.setValue({
                                fieldId: 'custrecord_3k_stock_terc_stock_ini',
                                value: newStockInicial
                            });

                            recordStock.setValue({
                                fieldId: 'custrecord_3k_stock_terc_act_stock',
                                value: false
                            });

                            recordStock.save();
                        }
                    }






                } catch (e) {
                    log.error('SSTK001', 'function afterSubmit: ' + e.message);
                    //throw utilities.crearError('SSTK001', 'function afterSubmit: ' + e.message);
                    //return false
                    throw e.message;
                }
            }

            log.audit('Actulizar Stock Consumido', 'Finalizó el proceso');
        }

        return {
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });
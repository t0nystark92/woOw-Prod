/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteScripts/Kraken/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

 define(['N/error', 'N/record', 'N/search', 'N/format', 'N/runtime', '3K/utilities'],
 /**
  * @param {error} error
  * @param {record} record
  * @param {search} search
  */

 function(error, record, search, format, runtime, utilities) {

     /**
      * Function definition to be triggered before record is loaded.
      *
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {Record} scriptContext.oldRecord - Old record
      * @param {string} scriptContext.type - Trigger type
      * @Since 2015.2
      */
    var proceso = 'Calculo de descuento por item';

    function afterSubmit(scriptContext) {

        try {

            log.audit(proceso, 'Tipo Evento: ' + scriptContext.type + ' - Tipo Registro: ' + scriptContext.newRecord.type + ' - ID: ' + scriptContext.newRecord.id + ' - ExecutionContext: ' + runtime.executionContext);

            if (scriptContext.newRecord.type == 'salesorder') { //(scriptContext.type == 'create' || scriptContext.type == 'edit') && 

                log.debug(proceso, 'INICIO del proceso.');
                
                var respDevPromo = {};
                respDevPromo.item = '1393577'; //1392849 Buscar en RT customrecord_3k_conf_dev_promo --> custrecord_3k_conf_dev_promo_disc_item

                var objRecord = record.load({
                    type: scriptContext.newRecord.type,
                    id: scriptContext.newRecord.id,
                    isDynamic: true
                }); 
                
                var numLines = objRecord.getLineCount({
                    sublistId: 'item'
                });

                var dataItems = [];
                var error = false;
                
                for (var i = 0; i < numLines && !error; i++) {

                    var importeDescuento = objRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_item_import_disc',
                        line: i
                    }); 

                    importeDescuento = !utilities.isEmpty(importeDescuento) ? parseFloat(importeDescuento) : 0.0;

                    if(importeDescuento > 0) { 
                        var objItem = {};

                        objItem.importeDescuento = importeDescuento;

                        objItem.taxCode = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            line: i
                        }); 
                        
                        objItem.ingresoFacturar = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_importe_fact_liq',
                            line: i
                        }); 

                        objItem.deudaPagar = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_deuda_pagar',
                            line: i
                        }); 

                        objItem.clienteLiq = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_cliente_liquidacion',
                            line: i
                        }); 

                        objItem.proveedorLiq = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_proveedor_liquidacion',
                            line: i
                        }); 

                        try{
                            //aca se debe insertar la nueva linea
                            objRecord.insertLine({
                                sublistId: 'item',
                                line: (i+1),
                            });

                            objRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: respDevPromo.item
                            });

                            objRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'taxcode',
                                value: objItem.taxCode
                            });                        

                            objRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'grossamt',
                                value: objItem.importeDescuento
                            }); 

                            objRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_item_discount_line',
                                value: true
                            });
                            
                            objItem.ctaItemDevolucion = objRecord.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_cta_devolucion_promo'
                            });

                            objRecord.commitLine({
                                sublistId: 'item'
                            });                            
                        } catch(eNewLine) {
                            error = true;
                            log.error(proceso, 'Excepcion Inesperada al insertar la linea de descuento ' + (i+1) + ' - Excepcion : ' + excepcionSave.message);
                        }

                        if(!error){
                            //despues de agregar la nueva linea
                            numLines++;
                            dataItems.push(objItem);    
                        }
                    }
                }

                log.debug(proceso, 'Lineas con Descuento: ' + JSON.stringify(dataItems));

                /*
                objRecord.setValue({
                    fieldId: 'custbody_3k_neto_no_gravado',
                    value: totalNoGravado
                }); 
                */

                if(!error && dataItems.length > 0){
                    
                    objRecordLiqConf = record.create({
                        type: 'customtransaction_3k_liquidacion_conf',
                        isDynamic: true,
                    });
                    
                    if (!utilities.isEmpty(objRecordLiqConf)) {
                        objRecordLiqConf.setValue({
                            fieldId: 'subsidiary',
                            value: subsidiaria
                        });
                        //objRecordLiqConf.setValue({ fieldId: 'currency', value: moneda });
                        objRecordLiqConf.setValue({
                            fieldId: 'currency',
                            value: moneda
                        });
                        objRecordLiqConf.setValue({
                            fieldId: 'exchangerate',
                            value: tipoCambio
                        });
                        objRecordLiqConf.setValue({
                            fieldId: 'custbody_cseg_3k_sitio_web_o',
                            value: sitioWeb
                        });
                        objRecordLiqConf.setValue({
                            fieldId: 'custbody_cseg_3k_sistema',
                            value: sistema
                        });
    
                        var cantidadLineasLiqConf = objRecordLiqConf.getLineCount({
                            sublistId: 'line'
                        });

                        /*
                        if (!utilities.isEmpty(cantidadLineasLiqConf) && cantidadLineasLiqConf > 0) {
                            for (var iLiqConf = 0; iLiqConf < cantidadLineasLiqConf; iLiqConf++) {
                                objRecordLiqConf.removeLine({
                                    sublistId: 'line',
                                    line: 0
                                });
                            }
                        }
                        */
    
                        objRecordLiqConf.selectNewLine({
                            sublistId: 'line'
                        });
                        objRecordLiqConf.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'account',
                            value: idCuentaIngresoInicial
                        });
    
                        objRecordLiqConf.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'currency',
                            value: moneda
                        });
    
                        objRecordLiqConf.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'exchangerate',
                            value: tipoCambio
                        });
    
                        objRecordLiqConf.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'debit',
                            value: importeTotal
                        });
    
                        objRecordLiqConf.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'entity',
                            value: idCliente
                        });
    
                        objRecordLiqConf.commitLine({
                            sublistId: 'line'
                        });                        
                    }


                }
                
                try {
                    var idRecordUpdate = objRecord.save();
                    if (utilities.isEmpty(idRecordUpdate)) {
                        log.error(proceso, 'Error al Guardar - Error : No se Recibio el ID Interno del Registro a Actualizar');
                    } else {
                        log.debug(proceso, 'FIN.');
                    }
                } catch (excepcionSave) {
                    log.error(proceso, 'Excepcion Inesperada al guardar Registro - Excepcion : ' + excepcionSave.message);
                }             
            }
        } catch (excepcion) {
                log.error(proceso + ' - afterSubmit', 'Ocurrió una excepcion general - error: ' + excepcion.message);
        }
    }
    
    return {
        afterSubmit: afterSubmit
    };

 });
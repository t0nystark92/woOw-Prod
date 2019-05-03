/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
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

            if (scriptContext.newRecord.type == 'salesorder') { //&& runtime.executionContext != 'USERINTERFACE' /*Agregar en Productivo*/

                log.debug(proceso, 'INICIO del proceso.');

                log.audit(proceso, 'Tipo Evento: ' + scriptContext.type + ' - Tipo Registro: ' + scriptContext.newRecord.type + ' - ID: ' + scriptContext.newRecord.id + ' - ExecutionContext: ' + runtime.executionContext);

                var idCtaIngresoAConfirm = '';
                var idCtaDeudaAConfirm = '';
                var itemDescuento = '';

                var dataItems = [];
                var ovCabecera = {};
                var error = false;

                //se carga la OV y se agregan las lineas de descuento adicionales
                var objRecord = record.load({
                    type: scriptContext.newRecord.type,
                    id: scriptContext.newRecord.id,
                    isDynamic: true
                }); 

                ovCabecera.id = scriptContext.newRecord.id;

                ovCabecera.entity = objRecord.getValue({
                    fieldId: 'entity'
                }); 

                ovCabecera.moneda = objRecord.getValue({
                    fieldId: 'currency'
                }); 

                ovCabecera.tipoCambio = objRecord.getValue({
                    fieldId: 'exchangerate'
                });

                ovCabecera.subsidiaria = objRecord.getValue({
                    fieldId: 'subsidiary'
                });                
                
                ovCabecera.sistema = objRecord.getValue({
                    fieldId: 'custbody_cseg_3k_sistema'
                });

                ovCabecera.sitioWeb = objRecord.getValue({
                    fieldId: 'custbody_cseg_3k_sitio_web_o'
                });

                ovCabecera.isService = objRecord.getValue({
                    fieldId: 'custbody_3k_ov_servicio'
                });        
                
                ovCabecera.isTravel = objRecord.getValue({
                    fieldId: 'custbody_3k_ov_travel'
                });                   
                
                ovCabecera.isFidelity = objRecord.getValue({
                    fieldId: 'custbody_3k_programa_fidelidad'
                });                 

                ovCabecera.bfTotal = objRecord.getValue({
                    fieldId: 'total'
                });     
                
                ovCabecera.sumDescuentos = 0.0;

                ovCabecera.ctaItemDevolucion = '';

                var ctasOv = ctasIngresoDeuda(ovCabecera.moneda);  

                if(!ctasOv.error){
                    if(ctasOv.result.length > 0) {
                        idCtaIngresoAConfirm = ctasOv.result[0].ctaIngreso;
                        idCtaDeudaAConfirm = ctasOv.result[0].ctaDeuda;
                    }
                } else {
                    error = ctasOv.error;
                }

                var respArtPromo = artDescuentoPromo();

                if(!respArtPromo.error){ 
                    if(respArtPromo.result.length > 0) {
                        itemDescuento = respArtPromo.result[0].idItem;
                    }
                } else {
                    error = respArtPromo.error;
                }           
                
                var numLines = objRecord.getLineCount({
                    sublistId: 'item'
                });
                
                for (var i = 0; i < numLines && !error; i++) {

                    var importeDescuento = objRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_item_import_disc',
                        line: i
                    }); 

                    importeDescuento = !utilities.isEmpty(importeDescuento) ? parseFloat(importeDescuento)  : 0.0;

                    if(importeDescuento > 0) { 
                        var objItem = {};

                        objItem.importeDescuento = importeDescuento;

                        ovCabecera.sumDescuentos += importeDescuento;

                        objItem.taxCode = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            line: i
                        }); 

                        objItem.priceLevel = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'price',
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
                            
                            objRecord.insertLine({
                                sublistId: 'item',
                                line: (i+1),
                            });

                            objRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: itemDescuento
                            });

                            objRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'taxcode',
                                value: objItem.taxCode
                            });            

                            objRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'price',
                                value: objItem.priceLevel
                            });  

                            objRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'grossamt',
                                value: (objItem.importeDescuento * -1)
                            }); 

                            objRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_importe_bruto_woow',
                                value: (objItem.importeDescuento * -1)
                            });

                            objRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_item_discount_line',
                                value: true
                            });
                            
                            var ctaItemDevolucion = objRecord.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_cta_devolucion_promo'
                            });

                            if(!utilities.isEmpty(ctaItemDevolucion) && utilities.isEmpty(ovCabecera.ctaItemDevolucion)) {ovCabecera.ctaItemDevolucion = ctaItemDevolucion;}

                            objRecord.commitLine({
                                sublistId: 'item'
                            });                            
                        } catch(exNewLine) {
                            error = true;
                            log.error(proceso, 'Excepcion Inesperada al insertar la linea de descuento ' + (i+1) + ' - Excepcion : ' + exNewLine.message);
                        }

                        if(!error){ //si no hay error se cuenta la linea
                            numLines++;
                            dataItems.push(objItem);    
                        }
                    }
                }

                ovCabecera.afTotal = objRecord.getValue({
                    fieldId: 'total'
                });     
                
                log.debug(proceso, 'Cabecera: ' + JSON.stringify(ovCabecera));

                log.debug(proceso, 'Lineas con Descuento: ' + JSON.stringify(dataItems));
                
                if(!error){
                    try {
                        var idRecordUpdate = objRecord.save();
                        if (utilities.isEmpty(idRecordUpdate)) {
                            error = true;
                            log.error(proceso, 'Error al Guardar - Error : No se Recibio el ID Interno del Registro a Actualizar');
                        } else {
                            log.debug(proceso, 'FIN.');
                        }
                    } catch (exSave) {
                        error = true;
                        log.error(proceso, 'Excepcion Inesperada al guardar Registro - Excepcion : ' + exSave.message);
                    } 
                }
                
                if(!error && dataItems.length > 0 && ovCabecera.afTotal <= 0 && (ovCabecera.isService && !(ovCabecera.isTravel || ovCabecera.isFidelity))){
                    
                    //si se cumplen las condiciones se inicia el proceso para crear el custom transaction liquidacion_a_confirmar
                    log.debug(proceso, 'Inicio - Custom Trasaction 3k_liquidacion_conf.');
                    
                    objRecordLiqConf = record.create({
                        type: 'customtransaction_3k_liquidacion_conf',
                        isDynamic: true,
                    });
                    
                    if (!utilities.isEmpty(objRecordLiqConf)) {
                        objRecordLiqConf.setValue({
                            fieldId: 'subsidiary',
                            value: ovCabecera.subsidiaria
                        });
                        
                        objRecordLiqConf.setValue({
                            fieldId: 'currency',
                            value: ovCabecera.moneda
                        });
                        objRecordLiqConf.setValue({
                            fieldId: 'exchangerate',
                            value: ovCabecera.tipoCambio
                        });
                        objRecordLiqConf.setValue({
                            fieldId: 'custbody_cseg_3k_sitio_web_o',
                            value: ovCabecera.sitioWeb
                        });
                        objRecordLiqConf.setValue({
                            fieldId: 'custbody_cseg_3k_sistema',
                            value: ovCabecera.sistema
                        });
    
                        var cantidadLineasLiqConf = objRecordLiqConf.getLineCount({
                            sublistId: 'line'
                        });
                        
                        if (!utilities.isEmpty(cantidadLineasLiqConf) && cantidadLineasLiqConf > 0) {
                            for (var iLiqConf = 0; iLiqConf < cantidadLineasLiqConf; iLiqConf++) {
                                objRecordLiqConf.removeLine({
                                    sublistId: 'line',
                                    line: 0
                                });
                            }
                        }
                        
                        //linea de debito - sumatoria de descuentos
                        objRecordLiqConf.selectNewLine({
                            sublistId: 'line'
                        });

                        objRecordLiqConf.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'account',
                            value: ovCabecera.ctaItemDevolucion
                        });
    
                        objRecordLiqConf.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'currency',
                            value: ovCabecera.moneda
                        });
    
                        objRecordLiqConf.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'exchangerate',
                            value: ovCabecera.tipoCambio
                        });
    
                        objRecordLiqConf.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'debit',
                            value: ovCabecera.sumDescuentos
                        });
    
                        objRecordLiqConf.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'entity',
                            value: ovCabecera.entity
                        });
    
                        objRecordLiqConf.commitLine({
                            sublistId: 'line'
                        });      

                        for (var i = 0; i < dataItems.length; i++) {   
                            
                            //linea de Deuda a confirmar
                            objRecordLiqConf.selectNewLine({
                                sublistId: 'line'
                            });
    
                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                value: idCtaDeudaAConfirm
                            });
        
                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'currency',
                                value: ovCabecera.moneda
                            });
        
                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'exchangerate',
                                value: ovCabecera.tipoCambio
                            });
        
                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'credit',
                                value: dataItems[i].deudaPagar
                            });
        
                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'entity',
                                value: dataItems[i].proveedorLiq
                            });
        
                            objRecordLiqConf.commitLine({
                                sublistId: 'line'
                            }); 

                            //linea de ingreso a confirmar
                            objRecordLiqConf.selectNewLine({
                                sublistId: 'line'
                            });
    
                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'account',
                                value: idCtaIngresoAConfirm
                            });
        
                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'currency',
                                value: ovCabecera.moneda
                            });
        
                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'exchangerate',
                                value: ovCabecera.tipoCambio
                            });
        
                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'credit',
                                value: dataItems[i].ingresoFacturar
                            });
        
                            objRecordLiqConf.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'entity',
                                value: dataItems[i].clienteLiq
                            });
        
                            objRecordLiqConf.commitLine({
                                sublistId: 'line'
                            });                             
                        }

                        try {
                            var idRecordCreate = objRecordLiqConf.save();
                            if (utilities.isEmpty(idRecordCreate)) {
                                error = true;
                                log.error(proceso, 'Error al Guardar Custom Transaction  - Error : No se Recibio el ID Interno del Registro a Actualizar');
                            } else {
                                
                                log.debug(proceso, 'FIN - Guardada la custom transaction exitosamente.');

                                try{
                                    var idOVUpdate = record.submitFields({
                                        type: scriptContext.newRecord.type,
                                        id: ovCabecera.id,
                                        values: {'custbody_3k_link_reg_liq_conf':idRecordCreate},
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });

                                    if (utilities.isEmpty(idOVUpdate)) {
                                        log.error(proceso, 'Error intentando guardar el ID del Custom Transaction en la Sales Order: ' + ovCabecera.id); 
                                    } 
                                } catch(exUpdateOV) {
                                    log.error(proceso, 'Excepción al intentar guardar el ID del Custom Transaction en la Sales Order - Excepción: ' + exUpdateOV.message);
                                }
                            }
                        } catch (exSave) {
                            error = true;
                            log.error(proceso, 'Excepcion Inesperada al guardar Custom Transaction - Excepcion : ' + exSave.message);
                        }                         
                    }
                }                
            }
        } catch (excepcion) {
                log.error(proceso + ' - afterSubmit', 'Ocurrió una excepcion general - error: ' + excepcion.message);
        }
    }

    function ctasIngresoDeuda(moneda){
        log.audit(proceso, 'INICIO Consulta de Cuentas de la OV');
        var respuesta = {};
        respuesta.error = false;
        respuesta.mensaje = "";

        try {
            if (!utilities.isEmpty(moneda)) {   
                
                var filtros = [];
                var filtroMoneda = {};
                filtroMoneda.name = 'custrecord_3k_config_ctas_cup_mon';
                filtroMoneda.operator = 'ANYOF';
                filtroMoneda.values = moneda; 
                filtros.push(filtroMoneda);                           
                
                var searchCuentas = utilities.searchSavedPro('customsearch_3k_config_ctas_cupones',filtros);
                
                respuesta.result = [];

                if (!searchCuentas.error && !utilities.isEmpty(searchCuentas.objRsponseFunction.result) && searchCuentas.objRsponseFunction.result.length > 0) {

                    var cuentasResultSet = searchCuentas.objRsponseFunction.result;
                    var cuentasResultSearch = searchCuentas.objRsponseFunction.search;
                    
                    for(var i = 0; i < cuentasResultSet.length; i++)
                    {
                        var objDebitos = {};

                        objDebitos.id = cuentasResultSet[i].getValue({
                            name: cuentasResultSearch.columns[0]
                        });
                                                    
                        objDebitos.ctaIngreso = parseFloat(cuentasResultSet[i].getValue({
                            name: cuentasResultSearch.columns[3]
                        }));
                        
                        objDebitos.ctaDeuda = parseFloat(cuentasResultSet[i].getValue({
                            name: cuentasResultSearch.columns[4]
                        }));                                                      

                        respuesta.result.push(objDebitos);
                    }
                } else{
                    respuesta.error = true;
                    respuesta.mensaje = "No hay cuentas configuradas para la moneda.";
                    log.error(proceso, respuesta.mensaje);                        
                }
                log.debug(proceso, 'Cuentas: ' + JSON.stringify(respuesta.result));
 
            } else {
                respuesta.error = true;
                respuesta.mensaje = "Debe indicar la moneda de la OV.";
                log.error(proceso, respuesta.mensaje);
            }
        } catch (excepcion) {
            respuesta.error = true;
            respuesta.mensaje = "Excepcion Consultando Cuentas de la OV - Excepcion : " + excepcion.message;
            log.error(proceso, respuesta.mensaje);
        }

        log.audit(proceso, 'FIN Consulta de Cuentas de la OV');
        return respuesta;                    
    }  
    
    function artDescuentoPromo(){
        log.audit(proceso, 'INICIO Consulta de articulo disc');
        var respuesta = {};
        respuesta.error = false;
        respuesta.mensaje = "";

        try {
                        
            var searchArt = utilities.searchSavedPro('customsearch_3k_item_dev_promo');
            
            respuesta.result = [];

            if (!searchArt.error && !utilities.isEmpty(searchArt.objRsponseFunction.result) && searchArt.objRsponseFunction.result.length > 0) {

                var ResultSet = searchArt.objRsponseFunction.result;
                var ResultSearch = searchArt.objRsponseFunction.search;
                
                for(var i = 0; i < ResultSet.length; i++)
                {
                    var objDebitos = {};

                    objDebitos.id = ResultSet[i].getValue({
                        name: ResultSearch.columns[0]
                    });
                                                
                    objDebitos.idItem = parseFloat(ResultSet[i].getValue({
                        name: ResultSearch.columns[1]
                    }));                                               

                    respuesta.result.push(objDebitos);
                }
            } else{
                respuesta.error = true;
                respuesta.mensaje = "No hay articulos de disc configurados.";
                log.error(proceso, respuesta.mensaje);                        
            }
            log.debug(proceso, 'Articulo Discount: ' + JSON.stringify(respuesta.result));
        } catch (excepcion) {
            respuesta.error = true;
            respuesta.mensaje = "Excepcion Consultando Articulo Discount - Excepcion : " + excepcion.message;
            log.error(proceso, respuesta.mensaje);
        }

        log.audit(proceso, 'FIN Consulta de articulo disc');
        return respuesta;                    
    }    
    
    return {
        afterSubmit: afterSubmit
    };

 });
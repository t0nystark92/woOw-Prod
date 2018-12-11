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

define(['N/error', 'N/record', 'N/search', '3K/utilities'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */

    function(error, record, search, utilities) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {
            try {
                log.audit('Inicio Grabar Articulo', 'BeforeLoad - Tipo : Servidor - Evento : ' + scriptContext.type);
                if (scriptContext.type == 'create') {
                    var nombreGenerico = '';
                    var idProgramaFiscal = '';
                    // INICIO - Obtener Nombre Generico Articulos
                    var mySearch = search.load({
                        id: 'customsearch_3k_configuracion_articulos'
                    });
                    var resultSet = mySearch.run();
                    var searchResult = resultSet.getRange({
                        start: 0,
                        end: 1
                    });

                    if (!utilities.isEmpty(searchResult) && searchResult.length > 0) {

                        nombreGenerico = searchResult[0].getValue({
                            name: resultSet.columns[2]
                        });
                        if (!utilities.isEmpty(nombreGenerico)) {
                            scriptContext.newRecord.setValue({ fieldId: 'itemid', value: nombreGenerico });
                        } else {
                            log.error('Grabar Articulo', 'BeforeLoad - No se encuentra configurado el Nombre Generico para Asignar a los Articulos en la Configuracion de Articulos');
                            throw utilities.crearError('SART001', 'No se encuentra configurado el Nombre Generico para Asignar a los Articulos en la Configuracion de Articulos');
                        }

                        idProgramaFiscal = searchResult[0].getValue({
                            name: resultSet.columns[6]
                        });
                        if (!utilities.isEmpty(idProgramaFiscal)) {
                            scriptContext.newRecord.setValue({ fieldId: 'taxschedule', value: idProgramaFiscal });
                        } else {
                            log.error('Grabar Articulo', 'BeforeLoad - No se encuentra configurada el ID del Programa Fiscal en la Configuracion de Tipos de IVA');
                            throw utilities.crearError('SART002', 'No se encuentra configurada el ID del Programa Fiscal en la Configuracion de Tipos de IVA');
                        }

                    } else {
                        // No se encuentra Definida la Numeracion de los Articulos
                        log.error('Grabar Articulo', 'BeforeLoad - No se encuentra definida la Configuracion de Articulos');
                        throw utilities.crearError('SART003', 'No se encuentra definida la Configuracion de Articulos');
                    }
                    // FIN - Obtener Nombre Generico de Articulo


                }
                log.audit('Fin Grabar Articulo', 'BeforeLoad - Tipo : Servidor');
            } catch (excepcion) {
                log.error('Grabar Articulo', 'BeforeLoad - Excepcion Grabando Articulo - Excepcion : ' + excepcion.message);
                throw utilities.crearError('SART004', 'Excepcion Grabando Articulo - Excepcion : ' + excepcion.message);
            }
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
        function beforeSubmit(scriptContext) {
            try {
                log.audit('Inicio Grabar Articulo', 'BeforeSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);
                if (scriptContext.type == 'create' || scriptContext.type == 'edit') {
                    var idProgramaFiscal = '';
                    var tipoUnidadVenta = '';
                    var unidadVenta = '';
                    var unidadStock = '';
                    var unidadMedidaLote = '';
                    var unidadMedidaKIT = '';
                    var unidadMedidaServicio = '';
                    // INICIO - Validar SKU Duplicado

                    log.audit('Grabar Articulo', 'BeforeSubmit - Tipo Articulo : ' + scriptContext.newRecord.type);
                    var skuArticulo = scriptContext.newRecord.getValue({ fieldId: 'custitem_3k_sku_proveedor' });
                    var idArticulo = scriptContext.newRecord.id;
                    /*if(!utilities.isEmpty(skuArticulo)){
                    var mySearch = search.load({
                        id: 'customsearch_3k_articulo_sku'
                    });
                    
                    var filtroSKU=search.createFilter({
                        name: 'custitem_3k_sku_proveedor',
                        operator: search.Operator.IS,
                        values: [skuArticulo]
                      });
                    
                    mySearch.filters.push(filtroSKU);
                    
                    if(!utilities.isEmpty(idArticulo)){
                        var filtroID=search.createFilter({
                            name: 'internalid',
                            operator: search.Operator.NONEOF,
                            values: [idArticulo]
                          });
                        
                        mySearch.filters.push(filtroID);
                    }
                    
                    var resultSet = mySearch.run();
                    var searchResult = resultSet.getRange({
                        start: 0,
                        end: 1
                        });
                    
                    if(!utilities.isEmpty(searchResult) && searchResult.length>0){
                        var idInternoArticuloExistente=searchResult[0].getValue({
                            name: resultSet.columns[0]
                        }); 
                        
                        log.error('Grabar Articulo','BeforeSubmit - El Articulo con ID Interno : ' + idInternoArticuloExistente + ' Posee el mismo SKU : ' + skuArticulo);
                        throw utilities.crearError('SART005','El Articulo con ID Interno : ' + idInternoArticuloExistente + ' Posee el mismo SKU : ' + skuArticulo);
                        
                    }
                }*/
                    // INICIO - Fin SKU Duplicado

                    // INICIO - Obtener Nombre Generico Articulos
                    var mySearch = search.load({
                        id: 'customsearch_3k_configuracion_articulos'
                    });
                    var resultSet = mySearch.run();
                    var searchResult = resultSet.getRange({
                        start: 0,
                        end: 1
                    });

                    if (!utilities.isEmpty(searchResult) && searchResult.length > 0) {
                        tipoUnidadVenta = searchResult[0].getValue({
                            name: resultSet.columns[3]
                        });

                        unidadVenta = searchResult[0].getValue({
                            name: resultSet.columns[4]
                        });

                        unidadStock = searchResult[0].getValue({
                            name: resultSet.columns[5]
                        });

                        unidadMedidaLote = searchResult[0].getValue({
                            name: resultSet.columns[7]
                        });

                        unidadMedidaKIT = searchResult[0].getValue({
                            name: resultSet.columns[8]
                        });

                        unidadMedidaServicio = searchResult[0].getValue({
                            name: resultSet.columns[9]
                        });

                    } else {
                        // No se encuentra Definida la Numeracion de los Articulos
                        log.error('Grabar Articulo', 'BeforeSubmit - No se encuentra definida la Configuracion de Articulos');
                        throw utilities.crearError('SART003', 'No se encuentra definida la Configuracion de Articulos');
                    }
                    // FIN - Obtener Nombre Generico de Articulo
                    // INICIO - Obtener Programa Fiscal
                    var alicuotaIVA = scriptContext.newRecord.getValue({ fieldId: 'custitem_3k_alicuota_iva' });

                    if (!utilities.isEmpty(alicuotaIVA)) {
                        var mySearch = search.load({
                            id: 'customsearch_3k_tipos_iva'
                        });

                        var filtroAlicuota = search.createFilter({
                            name: 'custrecord_3k_tipos_iva_alicuota',
                            operator: search.Operator.EQUALTO,
                            values: [alicuotaIVA]
                        });

                        mySearch.filters = [filtroAlicuota];

                        var resultSet = mySearch.run();
                        var searchResult = resultSet.getRange({
                            start: 0,
                            end: 1
                        });

                        if (!utilities.isEmpty(searchResult) && searchResult.length > 0) {
                            idProgramaFiscal = searchResult[0].getValue({
                                name: resultSet.columns[1]
                            });

                            if (!utilities.isEmpty(idProgramaFiscal)) {
                                scriptContext.newRecord.setValue({ fieldId: 'taxschedule', value: idProgramaFiscal });
                            } else {
                                if (scriptContext.type == 'create') {
                                    log.error('Grabar Articulo', 'BeforeLoad - No se encuentra configurada el ID del Programa Fiscal en la Configuracion de Tipos de IVA');
                                    throw utilities.crearError('SART002', 'No se encuentra configurada el ID del Programa Fiscal en la Configuracion de Tipos de IVA');
                                }
                            }
                        } else {
                            if (scriptContext.type == 'create') {
                                // No se encuentra Definida la Numeracion de los Articulos
                                log.error('Grabar Articulo', 'BeforeSubmit - No se encuentra definida la Configuracion de Tipos de IVA');
                                throw utilities.crearError('SART006', 'No se encuentra definida la Configuracion de Tipos de IVA');
                            }
                        }

                    }
                    // FIN - Obtener Programa Fiscal
                    if (scriptContext.newRecord.type != 'kititem') {

                        if (!utilities.isEmpty(scriptContext.newRecord.type) && (scriptContext.newRecord.type == 'inventoryitem' || scriptContext.newRecord.type == 'lotnumberedinventoryitem')) {
                            // INICIO - Configurar Que los Articulos Utilizan Depositos
                            scriptContext.newRecord.setValue({ fieldId: 'usebins', value: true });
                            // FIN - Configurar Que los Articulos Utilizan Depositos
                            // INICIO - Configurar Que los Articulos Utilizan Seguimiento de costo de entrega
                            scriptContext.newRecord.setValue({ fieldId: 'tracklandedcost', value: true });
                            // FIN - Configurar Que los Articulos Utilizan Seguimiento de costo de entrega
                        }

                        var tipoUnidadActual = scriptContext.newRecord.getValue({ fieldId: 'unitstype' });

                        if (utilities.isEmpty(tipoUnidadActual) && !utilities.isEmpty(tipoUnidadVenta) && !utilities.isEmpty(unidadVenta)) {
                            scriptContext.newRecord.setValue({ fieldId: 'unitstype', value: tipoUnidadVenta, ignoreFieldChange: false, fireSlavingSync: true });
                            scriptContext.newRecord.setValue({ fieldId: 'saleunit', value: unidadVenta, ignoreFieldChange: false, fireSlavingSync: true });

                            if (!utilities.isEmpty(scriptContext.newRecord.type) && (scriptContext.newRecord.type == 'inventoryitem' || scriptContext.newRecord.type == 'lotnumberedinventoryitem')) {
                                if (!utilities.isEmpty(unidadStock)) {
                                    scriptContext.newRecord.setValue({ fieldId: 'stockunit', value: unidadStock, ignoreFieldChange: false, fireSlavingSync: true });
                                }
                            }
                        }
                    }

                    // INICIO - Configurar Tipo de Articulo
                    if (scriptContext.newRecord.type == 'kititem') {
                        scriptContext.newRecord.setValue({ fieldId: 'custitem_3k_articulo_kit', value: 'S', ignoreFieldChange: false, fireSlavingSync: true });
                        scriptContext.newRecord.setValue({ fieldId: 'custitem_3k_articulo_servicio', value: 'N', ignoreFieldChange: false, fireSlavingSync: true });
                        if (!utilities.isEmpty(unidadMedidaKIT)) {
                            scriptContext.newRecord.setValue({ fieldId: 'custitem_l598_unidad_medida', value: unidadMedidaKIT, ignoreFieldChange: false, fireSlavingSync: true });
                        }
                    } else {
                        if (scriptContext.newRecord.type == 'serviceitem') {
                            scriptContext.newRecord.setValue({ fieldId: 'custitem_3k_articulo_kit', value: 'N', ignoreFieldChange: false, fireSlavingSync: true });
                            scriptContext.newRecord.setValue({ fieldId: 'custitem_3k_articulo_servicio', value: 'S', ignoreFieldChange: false, fireSlavingSync: true });
                            if (!utilities.isEmpty(unidadMedidaServicio)) {
                                scriptContext.newRecord.setValue({ fieldId: 'custitem_l598_unidad_medida', value: unidadMedidaServicio, ignoreFieldChange: false, fireSlavingSync: true });
                            }
                        } else {
                            scriptContext.newRecord.setValue({ fieldId: 'custitem_3k_articulo_kit', value: 'N', ignoreFieldChange: false, fireSlavingSync: true });
                            scriptContext.newRecord.setValue({ fieldId: 'custitem_3k_articulo_servicio', value: 'N', ignoreFieldChange: false, fireSlavingSync: true });
                            if (!utilities.isEmpty(unidadMedidaLote)) {
                                scriptContext.newRecord.setValue({ fieldId: 'custitem_l598_unidad_medida', value: unidadMedidaLote, ignoreFieldChange: false, fireSlavingSync: true });
                            }
                        }
                    }
                    // FIN - Configurar Tipo de Articulo
                }

                log.audit('Fin Grabar Articulo', 'BeforeSubmit - Tipo : Servidor');
            } catch (excepcion) {
                log.error('Grabar Articulo', 'BeforeSubmit - Excepcion Grabando Articulo - Excepcion : ' + excepcion.message);
                throw utilities.crearError('SART007', 'Excepcion Grabando Articulo - Excepcion : ' + excepcion.message);
            }
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
            try {
                log.audit('Inicio Grabar Articulo', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);
                if (scriptContext.type == 'create' || scriptContext.type == 'edit') {
                    var cuentaIngresos = '';
                    var baseNumeracion = 0;
                    var idArticulo = scriptContext.newRecord.id;
                    var tipoArticulo = scriptContext.newRecord.type;
                    if (!utilities.isEmpty(idArticulo) && !utilities.isEmpty(tipoArticulo)) {
                        // INICIO - Obtener Ultimo nivel de Rubro del Articulo
                        var rubro1 = scriptContext.newRecord.getValue({ fieldId: 'custitem_3k_rubro_nivel_1' });
                        var rubro2 = scriptContext.newRecord.getValue({ fieldId: 'custitem_3k_rubro_nivel_2' });
                        var rubro3 = scriptContext.newRecord.getValue({ fieldId: 'custitem_3k_rubro_nivel_3' });
                        var rubro4 = scriptContext.newRecord.getValue({ fieldId: 'custitem_3k_rubro_nivel_4' });
                        var rubro5 = scriptContext.newRecord.getValue({ fieldId: 'custitem_3k_rubro_nivel_5' });
                        var nombreArticuloOriginal = scriptContext.newRecord.getValue({ fieldId: 'itemid' });
                        var idRubroArticulo = '';
                        if (!utilities.isEmpty(rubro1)) {
                            idRubroArticulo = rubro1;
                            // INICIO - Obtener Cuenta Contable Ingresos
                            var cuentaIngresos = scriptContext.newRecord.getValue({ fieldId: 'incomeaccount' });

                            var CuentaIngresosObj = search.lookupFields({
                                type: 'customrecord_3k_rubros',
                                id: idRubroArticulo,
                                columns: ['custrecord_3k_rubros_cta_ing']
                            });

                            if (!utilities.isEmpty(CuentaIngresosObj) && !utilities.isEmpty(CuentaIngresosObj.custrecord_3k_rubros_cta_ing) && CuentaIngresosObj.custrecord_3k_rubros_cta_ing.length > 0) {
                                cuentaIngresos = CuentaIngresosObj.custrecord_3k_rubros_cta_ing[0].value;
                            }
                            // FIN - Obtener Cuenta Contable Ingresos
                            if (!utilities.isEmpty(rubro2)) {
                                idRubroArticulo = rubro2;
                                if (!utilities.isEmpty(rubro3)) {
                                    idRubroArticulo = rubro3;
                                    if (!utilities.isEmpty(rubro4)) {
                                        idRubroArticulo = rubro4;
                                        if (!utilities.isEmpty(rubro5)) {
                                            idRubroArticulo = rubro5;
                                        }
                                    }
                                }
                            }
                        } else {
                            // No se Configuro el Rubro del Articulo
                            log.error('Grabar Articulo', 'AftereSubmit - No se realizo la configuracion de los Rubros del Articulo');
                            throw utilities.crearError('SART008', 'No se realizo la configuracion de los Rubros del Articulo');
                        }
                        // FIN - Obtener Ultimo nivel de Rubro del Articulo
                        // INICIO - Obtener SKU del Rubro
                        var SKURubro = '';
                        if (!utilities.isEmpty(idRubroArticulo)) {
                            var SKURubroObj = search.lookupFields({
                                type: 'customrecord_3k_rubros',
                                id: idRubroArticulo,
                                columns: ['custrecord_3k_rubros_nom_sku']
                            });
                            if (!utilities.isEmpty(SKURubroObj) && !utilities.isEmpty(SKURubroObj.custrecord_3k_rubros_nom_sku)) {
                                SKURubro = SKURubroObj.custrecord_3k_rubros_nom_sku;
                            }
                        }
                        // FIN - Obtener SKU del Rubro
                        var utilizarBaseNumeracion = false;
                        if (!utilities.isEmpty(SKURubro)) {
                            var numeroArticulo = scriptContext.newRecord.getValue({ fieldId: 'custitem_3k_numero_art' });
                            if (utilities.isEmpty(numeroArticulo)) {
                                numeroArticulo = scriptContext.newRecord.id;
                                utilizarBaseNumeracion = true;
                            }
                            if (utilizarBaseNumeracion == true) {
                                // INICIO - Obtener Numerador Base de Articulo
                                var mySearch = search.load({
                                    id: 'customsearch_3k_configuracion_articulos'
                                });

                                var resultSet = mySearch.run();
                                var searchResult = resultSet.getRange({
                                    start: 0,
                                    end: 1
                                });

                                if (!utilities.isEmpty(searchResult) && searchResult.length > 0) {
                                    baseNumeracion = searchResult[0].getValue({
                                        name: resultSet.columns[1]
                                    });
                                    if (!utilities.isEmpty(baseNumeracion) && !isNaN(parseInt(baseNumeracion, 10))) {
                                        baseNumeracion = parseInt(baseNumeracion, 10);
                                    } else {
                                        baseNumeracion = '';
                                        log.error('Grabar Articulo', 'AfterSubmit - No se encuentra configurada la Base de Numeracion de los Articulos en la Configuracion de Articulos');
                                        throw utilities.crearError('SART009', 'No se encuentra configurada la Base de Numeracion de los Articulos en la Configuracion de Articulos');
                                    }
                                } else {
                                    // No se encuentra Definida la Numeracion de los Articulos
                                    baseNumeracion = '';
                                    log.error('Grabar Articulo', 'AfterSubmit - No se encuentra definida la Configuracion de Articulos');
                                    throw utilities.crearError('SART003', 'No se encuentra definida la Configuracion de Articulos');
                                }
                                // FIN - Obtener Numerador Base de Articulo
                            }
                            if (!utilities.isEmpty(numeroArticulo) && !utilities.isEmpty(baseNumeracion) && !utilities.isEmpty(SKURubro)) {
                                var NumeroArticuloCompleto = (parseInt(baseNumeracion, 10) + parseInt(numeroArticulo, 10));
                                var NombreArticulo = SKURubro + NumeroArticuloCompleto.toString();
                                if(scriptContext.type == 'edit'){
                                    NombreArticulo = nombreArticuloOriginal;
                                }
                                try {
                                    var idRecord = record.submitFields({
                                        type: tipoArticulo,
                                        id: idArticulo,
                                        values: {
                                            itemid: NombreArticulo,
                                            externalid: NombreArticulo,
                                            custitem_3k_numero_art: NumeroArticuloCompleto,
                                            custitem_3k_rubro: idRubroArticulo,
                                            incomeaccount: cuentaIngresos
                                        },
                                        options: {
                                            enableSourcing: true,
                                            ignoreMandatoryFields: false
                                        }
                                    });
                                    if (utilities.isEmpty(idRecord)) {
                                        log.error('Grabar Articulo', 'AfterSubmit - Error Grabando Campos de Articulo - Error : No se recibio ID de Articulo Grabado');
                                        throw utilities.crearError('SART010', 'Error Grabando Campos de Articulo - Error : No se recibio ID de Articulo Grabado');
                                    }
                                } catch (exepcionSubmit) {
                                    log.error('Grabar Articulo', 'AfterSubmit - Excepcion Grabando Campos de Articulo - Excepcion : ' + exepcionSubmit.message);
                                    throw utilities.crearError('SART011', 'Excepcion Grabando Campos de Articulo - Excepcion : ' + exepcionSubmit.message);
                                }
                            } else {
                                // Error Generando Numeracion de Articulo
                                var mensaje = "Error Obteniendo la siguiente Informacion : ";
                                if (utilities.isEmpty(numeroArticulo)) {
                                    mensaje = mensaje + " Numero de Articulo /";
                                }
                                if (utilities.isEmpty(baseNumeracion)) {
                                    mensaje = mensaje + " Base de Numeracion de Articulo /";
                                }
                                if (utilities.isEmpty(SKURubro)) {
                                    mensaje = mensaje + " SKU Rubro de Articulo /";
                                }
                                log.error('Grabar Articulo', 'BeforeSubmit - Error Grabando Articulo - Error: ' + mensaje);
                                throw utilities.crearError('SART012', 'Error Grabando Articulo - Error : ' + mensaje);
                            }
                        } else {
                            // El Rubro No Posee Nomenclatura SKU
                            log.error('Grabar Articulo', 'AfterSubmit - El Rubro con ID Interno : ' + idRubroArticulo + ' No posee Nomneclatura SKU');
                            throw utilities.crearError('SART013', 'El Rubro con ID Interno : ' + idRubroArticulo + ' No posee Nomneclatura SKU');
                        }
                    } else {
                        // Error Obteniendo ID/ Tipo de Articulo
                        var mensaje = "Error Obteniendo la siguiente Informacion del Articulo : ";
                        if (utilities.isEmpty(idArticulo)) {
                            mensaje = mensaje + " ID Interno de Articulo /";
                        }
                        if (utilities.isEmpty(tipoArticulo)) {
                            mensaje = mensaje + " Tipo de Articulo /";
                        }
                        log.error('Grabar Articulo', 'BeforeSubmit - Error Grando Articulo - Error : ' + mensaje);
                        throw utilities.crearError('SART014', 'Error Grando Articulo - Error : ' + mensaje);
                    }
                }
            } catch (excepcion) {
                log.error('Grabar Articulo', 'AfterSubmit - Excepcion Grabando Articulo - Excepcion : ' + excepcion.message);
                throw utilities.crearError('SART015', 'Excepcion Grabando Articulo - Excepcion : ' + excepcion.message);
            }
            log.audit('Fin Grabar Articulo', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });

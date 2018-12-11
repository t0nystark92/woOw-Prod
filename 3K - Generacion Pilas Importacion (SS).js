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
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {
            try {
                log.audit('Inicio Generar Pilas Importación', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);
                var objRecordid = scriptContext.newRecord.id;
                var tipoTransaccion = scriptContext.newRecord.type;

                log.debug('afterSubmit', 'tipoTransaccion: ' + tipoTransaccion);
                //levanto la orden de compra

                if (scriptContext.type == 'create') {

                    /*var objRecord = record.load({
                        type: tipoTransaccion,
                        id: objRecordid,
                        isDynamic: true
                    });

                    var currency = objRecord.getValue({
                        fieldId: 'currency'
                    });


                    //obtengo numero de lineas de los articulos en la orden de ventas
                    var numLines = objRecord.getLineCount({
                        sublistId: 'item'
                    });*/

                    //Busqueda de configuracion de proveedor y deposito de proveedores

                    var obj = utilities.searchSavedPro('customsearch_3k_stock_terc_activos');
                    if (obj.error) {
                        throw utilities.crearError('SGPI001', 'Excepcion Generar Pilas Importación - Excepcion : ' + JSON.stringify(obj.error));
                    }

                    var searchConfig = obj.objRsponseFunction.array;

                    var arraySearchParams = [];
                    var objParam = new Object({});
                    objParam.name = 'internalid';
                    objParam.operator = 'IS';
                    objParam.values = objRecordid;
                    arraySearchParams.push(objParam);

                    var objPilas = utilities.searchSavedPro('customsearch_3k_stock_terc_creacion', arraySearchParams);
                    if (objPilas.error) {
                        throw utilities.crearError('SGPI001', 'Excepcion Generar Pilas Importación - Excepcion : ' + JSON.stringify(objPilas.error));
                    }

                    var arrayPilasCrear = objPilas.objRsponseFunction.array;

                    var objSitios = utilities.searchSavedPro('customsearch_3k_sitios_web');
                    if (objSitios.error) {
                        throw utilities.crearError('SGPI001', 'Excepcion Generar Pilas Importación - Excepcion : ' + JSON.stringify(objSitios.error));
                    }

                    var arrayResultSitiosWeb = objSitios.objRsponseFunction.array;

                    //if (!utilities.isEmpty(searchConfig) && searchConfig.length > 0) {

                    //obtengo los datos de la busqueda de configuracion importacion

                    log.debug('afterSubmit', 'searchConfig: ' + JSON.stringify(searchConfig));
                    log.debug('afterSubmit', 'arrayPilasCrear: ' + JSON.stringify(arrayPilasCrear));
                    log.debug('afterSubmit', 'arrayResultSitiosWeb: ' + JSON.stringify(arrayResultSitiosWeb));

                    var arraySitiosWeb = [];

                    if(!utilities.isEmpty(arrayResultSitiosWeb) && arrayResultSitiosWeb.length > 0){
                    	
                    	for(var j=0; j< arrayResultSitiosWeb.length; j++){

                    		var idSitio = arrayResultSitiosWeb[j].internalid;
                    		arraySitiosWeb.push(idSitio);
                    	}
                    }

                    if (!utilities.isEmpty(arrayPilasCrear) && arrayPilasCrear.length > 0) {

                        for (var i = 0; i < arrayPilasCrear.length; i++) {

                            //var proveedor = arrayPilasCrear[i].custcol_3k_proveedor_importacion;
                            var proveedor = arrayPilasCrear[i]["Proveedor Importación"];
                            var currency = arrayPilasCrear[i].currency;
                            var quantity = arrayPilasCrear[i].quantity;
                            var rate = arrayPilasCrear[i].rate;
                            var item = arrayPilasCrear[i].item;
                            //var isImport = arrayPilasCrear[i].custcol_3k_importacion;
                            var isImport = arrayPilasCrear[i]["Generar Orden de Traslado"];
                            var location = arrayPilasCrear[i].location;

                            if (isImport) {

                                var objRecordPilas = record.create({
                                    type: 'customrecord_stock_terceros',
                                    isDynamic: true
                                });

                                //proveedor
                                objRecordPilas.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_proveedor',
                                    value: proveedor
                                });

                                log.debug('afterSubmit', 'proveedor: '+proveedor);

                                //stock inicial
                                objRecordPilas.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_stock_ini',
                                    value: quantity
                                });

                                log.debug('afterSubmit', 'quantity: '+ quantity);


                                //Costo Unitario
                                objRecordPilas.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_costo_uni',
                                    value: rate
                                });

                                //log.debug('afterSubmit', 'linea 162');

                                //Proveedor Importación
                                objRecordPilas.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_importacion',
                                    value: true
                                });

                                objRecordPilas.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_prov_imp',
                                    value: true
                                });

                                //log.debug('afterSubmit', 'linea 171');

                                //articulo
                                objRecordPilas.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_articulo',
                                    value: item
                                });

                                //log.debug('afterSubmit', 'linea 180');

                                //moneda
                                objRecordPilas.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_moneda',
                                    value: currency
                                });

                                log.debug('afterSubmit', 'linea 189');

                                var posicion = 0;

                                if (!utilities.isEmpty(searchConfig) && searchConfig.length > 0) {

                                    var filterPilas = searchConfig.filter(function(obj) {
                                        return (obj.custrecord_3k_stock_terc_proveedor == proveedor && obj.custrecord_3k_stock_terc_articulo == item);
                                    });

                                    if (!utilities.isEmpty(filterPilas) && filterPilas.length > 0) {
                                        log.debug('afterSubmit', 'ENTRO IF');
                                        posicion = parseInt(filterPilas[0].custrecord_3k_stock_terc_posicion, 10) + 1;
                                    }
                                }
                                //Posicion
                                objRecordPilas.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_posicion',
                                    value: posicion
                                });

                                log.debug('afterSubmit', 'linea 198');


                                //skuProveedor
                                objRecordPilas.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_sku_prov',
                                    value: proveedor
                                });

                                //Recepciones Asociadas

                                objRecordPilas.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_rec_asociadas',
                                    value: objRecordid
                                });

                                log.debug('afterSubmit', 'objRecordid: '+ objRecordid);

                                objRecordPilas.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_deposito',
                                    value: location
                                });

                                log.debug('afterSubmit', 'location: '+ location);

                                objRecordPilas.setValue({
                                    fieldId: 'custrecord_3k_stock_terc_sitio',
                                    value: arraySitiosWeb
                                });

                                log.debug('afterSubmit', 'arraySitiosWeb: '+ JSON.stringify(arraySitiosWeb));

                                var idPila = objRecordPilas.save();
                                log.debug('Generar Pilas Importacion','id Pila generada: '+ idPila);
                            }
                        }
                    }


                    /*var recId = objRecord.save();
                    log.debug('afterSubmit', 'recId: ' + recId);*/
                    //}
                }



            } catch (excepcion) {
                log.error('SGPI001', 'AfterSubmit - Excepcion Generar Pilas Importación - Excepcion : ' + excepcion.message);

                record.delete({
                    type: tipoTransaccion,
                    id: objRecordid,
                });

                throw utilities.crearError('SGPI001', 'Excepcion Generar Pilas Importación - Excepcion : ' + excepcion.message);

            }
            log.audit('Fin Generar Pilas Importación', 'AfterSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

        }

        return {
            afterSubmit: afterSubmit
        };

    });

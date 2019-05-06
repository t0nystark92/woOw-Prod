/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', '3K/utilities'], function (record, search, utilities) {


    function beforeSubmit(context) {

        try {

            var error = false;

            var objRecord = context.newRecord;

            /*INICIO CONSULTAR MAIN CATEGORY*/

            var linesOV = objRecord.getLineCount({
                sublistId: 'item'
            })

            var arrayArticulosMC = new Array();

            for (var j = 0; j < linesOV; j++) {



                var itemMC = objRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: j
                });

                var discount = objRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_3k_item_discount_line',
                    line: j
                });

                var redondeo = objRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_3k_es_redondeo',
                    line: j
                });

                var fidelidad = objRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_3k_programa_fidelidad',
                    line: j
                });

                if (discount == false && redondeo == false && fidelidad == false) {

                    arrayArticulosMC.push(itemMC);

                }


            }

            log.debug('arrayArticulosMC', JSON.stringify(arrayArticulosMC))

            var arraySearchParams = [];
            var objParam = new Object({});
            objParam.name = 'internalid';
            objParam.operator = 'ANYOF';
            objParam.values = arrayArticulosMC;
            arraySearchParams.push(objParam);

            var searchMC = utilities.searchSavedPro('customsearch_3k_maincategory_items', arraySearchParams);
            log.debug('searchMC', JSON.stringify(searchMC))
            //var arregloMainCategory = searchMC.objRsponseFunction.array;

            //log.debug('arregloDepositosOV', JSON.stringify(arregloDepositosOV));


            /*var filtrosMC = new Array();

            var filtrosMainCategory = new Object();
            filtrosMainCategory.name = 'internalid';
            filtrosMainCategory.operator = 'ANY';
            filtrosMainCategory.values = arrayArticulosMC;
            filtrosMC.push(filtrosMainCategory);

            var searchMC = utilities.searchSavedPro('customsearch_3k_maincategory_items', filtrosMC);*/

            if (!utilities.isEmpty(searchMC) && searchMC.error == false) {
                if (!utilities.isEmpty(searchMC.objRsponseFunction.array) && searchMC.objRsponseFunction.array.length > 0) {

                    var arregloMainCategory = searchMC.objRsponseFunction.array;
                    log.debug('arregloMainCategory', JSON.stringify(arregloMainCategory))

                    //INICIO AGREGAR MAIN CATEGORY

                    for (var i = 0; i < linesOV; i++) {

                        var item = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });

                        var mainCategory = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_cseg_3k_main_cat',
                            line: i
                        });

                        if (utilities.isEmpty(mainCategory)) {

                            var filterArregloMainCategory = arregloMainCategory.filter(function (obj) {
                                return obj.internalid == item
                            });

                            log.debug('Agregar Main Category', JSON.stringify(filterArregloMainCategory));

                            if (!utilities.isEmpty(filterArregloMainCategory) && filterArregloMainCategory.length > 0) {

                                objRecord.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_cseg_3k_main_cat',
                                    value: filterArregloMainCategory[0]['Main Category'],
                                    line: i
                                })

                            }

                        }
                    }


                } else {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'UCOV019';
                    respuestaParcial.mensaje = 'Error Consultando Main Category - No se encontraron resultados.';
                    respuesta.detalle.push(respuestaParcial);
                    throw respuesta;
                }
            } else {

                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'UCOV019';
                respuestaParcial.mensaje = 'Error Consultando Main Category - ' + JSON.stringify(searchMC);
                respuesta.detalle.push(respuestaParcial);
                throw respuesta;

            }



            /*FIN CONSULTAR MAIN CATEGORY*/


            //FIN AGREGAR MAIN CATEGORY

        } catch (e) {
            log.error('Exception', e.message)
            error = true;
            objRespuesta.error = true;
            objRespuestaParcial = new Object();
            objRespuestaParcial.codigo = 'UCOV003';
            objRespuestaParcial.mensaje = e.message;
            objRespuesta.detalle.push(objRespuestaParcial);
        }

        if (error == true) {
            // SI HUBO ALGUN ERROR, GENERAR LA OV CON ESTADO "APROBACION PENDIENTE" Y SETEAR LOG 
            objRecord.setValue({
                fieldId: 'orderstatus',
                value: 'A'
            });

            objRecord.setValue({
                fieldId: 'custbody_3k_netsuite_ov',
                value: objRespuesta.mensaje
            });

            log.debug('Creación OV (SS) - beforeSubmit', 'objRespuesta: ' + JSON.stringify(objRespuesta));
            log.error('Creación OV (SS) - beforeSubmit', 'OV Creada en Estado APROBACION PENDIENTE');
        } else {

            objRecord.setValue({
                fieldId: 'custbody_3k_netsuite_ov',
                value: ''
            });

        }


    }


    return {
        beforeSubmit: beforeSubmit
    }
});
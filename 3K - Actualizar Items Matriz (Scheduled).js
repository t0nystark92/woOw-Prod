/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'    }
});*/
define(['N/error', 'N/record', 'N/search', 'N/format', '3K/utilities'],

    function (error, record, search, format, utilities) {

        /**
         * Definition of the Scheduled script trigger point.
         *
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
         * @Since 2015.2
         */
        function execute(scriptContext) {

            var respuesta = new Object();
            respuesta.error = false;
            respuesta.detalle = new Array();

            log.audit('Actualizar Items Matriz', 'Inicio - execute');

            var type = scriptContext.type;

            log.debug('Actualizar Items Matriz', 'type: ' + type);

            try {

                //Consulta el PANEL TIPO ARTICULO, para determinar el recordtype correspondiente
                var objResultTipoArticulo = utilities.searchSaved('customsearch_3k_panel_tipo_articulo');

                var resultSet = objResultTipoArticulo.objRsponseFunction.result;
                var resultSearch = objResultTipoArticulo.objRsponseFunction.search;

                var arrayTipoArticulo = new Array();

                for (var l = 0; !utilities.isEmpty(resultSet) && l < resultSet.length; l++) {

                    var objTipoArticulo = new Object();

                    objTipoArticulo.itemTipoArticulo = resultSet[l].getValue({
                        name: resultSearch.columns[0]
                    });

                    objTipoArticulo.itemTipoRegistro = resultSet[l].getValue({
                        name: resultSearch.columns[1]
                    });

                    arrayTipoArticulo.push(objTipoArticulo);

                }

                log.debug('Actualizar Items Matriz', 'arrayTipoArticulo: ' + JSON.stringify(arrayTipoArticulo));

                //Consulta los items matriz a actualizarle Nombre y Nombre Actualizado
                var objResultSet = utilities.searchSaved('customsearch_3k_act_items_matriz');

                var resultSet = objResultSet.objRsponseFunction.result;
                var resultSearch = objResultSet.objRsponseFunction.search;

                var arrayItemsActualizar = new Array();
                var arrayItemsID = new Array();

                for (var l = 0; !utilities.isEmpty(resultSet) && l < resultSet.length; l++) {

                    var objActualizar = new Object({});

                    objActualizar.itemID = resultSet[l].getValue({
                        name: resultSearch.columns[0]
                    });

                    objActualizar.itemTipo = resultSet[l].getValue({
                        name: resultSearch.columns[1]
                    });

                    objActualizar.itemPadre = resultSet[l].getValue({
                        name: resultSearch.columns[3]
                    });

                    objActualizar.itemPadreNombre = resultSet[l].getValue({
                        name: resultSearch.columns[4]
                    });

                    objActualizar.itemPadreID = resultSet[l].getValue({
                        name: resultSearch.columns[5]
                    });

                    objActualizar.itemRegla = resultSet[l].getValue({
                        name: resultSearch.columns[6]
                    });

                    arrayItemsID.push(objActualizar.itemID);

                    var objItem = arrayTipoArticulo.filter(function (obj) {
                        return (obj.itemTipoArticulo == objActualizar.itemTipo.toUpperCase());
                    });

                    if (!utilities.isEmpty(objItem) && objItem.length > 0) {
                        objActualizar.itemTipo = objItem[0].itemTipoRegistro;
                    }

                    arrayItemsActualizar.push(objActualizar);
                }

                if (!utilities.isEmpty(arrayItemsActualizar) && arrayItemsActualizar.length > 0){
                    var afterSubmitItem = procesarItem(arrayItemsActualizar);
                    log.debug('Actualizar Items Matriz', 'arrayItemsID: ' + JSON.stringify(arrayItemsID));
                }


            } catch (excepcion) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'SAIM001';
                respuestaParcial.mensaje += excepcion;
                respuesta.detalle.push(respuestaParcial);
                log.error('Actualizar Items Matriz', 'SAIM001 - Excepcion : ' + excepcion);
            }


            log.audit('Actualizar Items Matriz', 'Fin - execute');

        }

        function procesarItem(arrayItemsActualizar) {

            var respuesta = new Object();
            respuesta.error = false;
            respuesta.detalle = new Array();

            var cuentaIngresos = '';
            var baseNumeracion = 0;
            //var idArticulo = objItem.id;
            //var tipoArticulo = objItem.type;
            log.debug('procesarItem', 'Parámetro - arrayItemsActualizar: ' + JSON.stringify(arrayItemsActualizar));

            for (var i = 0; !utilities.isEmpty(arrayItemsActualizar) && i < arrayItemsActualizar.length; i++) {

                var idArticulo = arrayItemsActualizar[i].itemID;
                var tipoArticulo = arrayItemsActualizar[i].itemTipo;
                log.debug('procesarItem', 'idArticulo: ' + idArticulo + ', tipoArticulo: ' + tipoArticulo);

                try {
                    if (!utilities.isEmpty(idArticulo) && !utilities.isEmpty(tipoArticulo)) {

                        var objItem = record.load({
                            type: tipoArticulo,
                            id: idArticulo,
                            isDynamic: true,
                        });

                        // INICIO - Obtener Ultimo nivel de Rubro del Articulo
                        var rubro1 = objItem.getValue({ fieldId: 'custitem_3k_rubro_nivel_1' });
                        var rubro2 = objItem.getValue({ fieldId: 'custitem_3k_rubro_nivel_2' });
                        var rubro3 = objItem.getValue({ fieldId: 'custitem_3k_rubro_nivel_3' });
                        var rubro4 = objItem.getValue({ fieldId: 'custitem_3k_rubro_nivel_4' });
                        var rubro5 = objItem.getValue({ fieldId: 'custitem_3k_rubro_nivel_5' });
                        var nombreArticuloOriginal = objItem.getValue({ fieldId: 'itemid' });
                        var idRubroArticulo = '';
                        if (!utilities.isEmpty(rubro1)) {
                            idRubroArticulo = rubro1;
                            // INICIO - Obtener Cuenta Contable Ingresos
                            var cuentaIngresos = objItem.getValue({ fieldId: 'incomeaccount' });

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
                            var numeroArticulo = objItem.getValue({ fieldId: 'custitem_3k_numero_art' });
                            if (utilities.isEmpty(numeroArticulo)) {
                                numeroArticulo = objItem.id;
                                log.debug('Grabar Articulo', 'numeroArticulo: ' + numeroArticulo);
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
                                log.debug('Grabar Articulo', 'NumeroArticuloCompleto: ' + NumeroArticuloCompleto + ', NombreArticulo: ' + NombreArticulo);
                                /*if (scriptContext.type == 'edit') {
                                    NombreArticulo = nombreArticuloOriginal;
                                }*/
                                if (!arrayItemsActualizar[i].itemPadre) {
                                    var itemPadre = search.lookupFields({
                                        type: arrayItemsActualizar[i].itemTipo,
                                        id: arrayItemsActualizar[i].itemPadreID,
                                        columns: ['itemid','custitem_3k_numero_art']
                                    });

                                    log.debug('Grabar Articulo', 'itemPadre: ' + JSON.stringify(itemPadre));
                                    var padreNombreItem = itemPadre.itemid;
                                    var padreReglaItem = arrayItemsActualizar[i].itemRegla;
                                    var padreNumeroItem = itemPadre.custitem_3k_numero_art;
                                    
                                    var reglaName = padreReglaItem.indexOf('itemid');
                                    //log.debug('Grabar Articulo', 'reglaName: ' + reglaName);                        

                                    NumeroArticuloCompleto = padreNumeroItem;
                                    //Si es diferente de -1, significa que se encuentra "itemid" en la regla y hay que sustituir el nombre anterior por el nuevo nombre del item padre
                                    if (!utilities.isEmpty(reglaName) && reglaName != '-1'){
                                        NombreArticulo = padreNombreItem;
                                        var nombreActualizado = nombreArticuloOriginal.replace(arrayItemsActualizar[i].itemPadreNombre, NombreArticulo, "gi");
                                        //log.debug('Grabar Articulo', 'nombreActualizado: ' + JSON.stringify(nombreActualizado) + ', nombreArticuloOriginal: ' + JSON.stringify(nombreArticuloOriginal));

                                        NombreArticulo = nombreActualizado;
                                    }else{
                                        NombreArticulo = nombreArticuloOriginal;
                                    }

                                }
                                try {
                                    /*var idRecord = record.submitFields({
                                        type: tipoArticulo,
                                        id: idArticulo,
                                        values: {
                                            itemid: NombreArticulo,
                                            externalid: NombreArticulo,
                                            custitem_3k_numero_art: NumeroArticuloCompleto,
                                            custitem_3k_rubro: idRubroArticulo,
                                            incomeaccount: cuentaIngresos,
                                            custitem_3k_nombre_actualizado: true
                                        },
                                        options: {
                                            enableSourcing: true,
                                            ignoreMandatoryFields: false
                                        }
                                    });*/

                                    objItem.setValue({
                                        fieldId: 'itemid',
                                        value: NombreArticulo
                                    });
                                    objItem.setValue({
                                        fieldId: 'externalid',
                                        value: NombreArticulo
                                    });
                                    objItem.setValue({
                                        fieldId: 'custitem_3k_numero_art',
                                        value: NumeroArticuloCompleto
                                    });
                                    objItem.setValue({
                                        fieldId: 'custitem_3k_rubro',
                                        value: idRubroArticulo
                                    });
                                    objItem.setValue({
                                        fieldId: 'incomeaccount',
                                        value: cuentaIngresos
                                    });
                                    objItem.setValue({
                                        fieldId: 'custitem_3k_nombre_actualizado',
                                        value: true
                                    });

                                    var idRecord = objItem.save();

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

                } catch (excepcion) {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SPIT001';
                    respuestaParcial.mensaje += excepcion;
                    respuesta.detalle.push(respuestaParcial);
                    log.error('procesarItem', 'SPIT001 - Excepcion : ' + excepcion);
                }
            }
        }

        return {
            execute: execute
        };

    });

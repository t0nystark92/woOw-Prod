/**
 * @NApiVersion 2.0
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/

define(['N/currentRecord', 'N/error', 'N/record', 'N/search', 'N/ui/dialog', 'N/ui/message', '3K/utilities'],
    function (currentRecord, error, record, search, dialog, message, utilities) {
        function marcarCupones() {
            var record = currentRecord.get();
            var arrCuponesRemito = new Array();
            var arrCuponesRemitoSelected = new Array();
            var existenCuponesSeleccionados = false;
            var error = false;

            try {
                var cantidadLineasCupones = record.getLineCount({
                    sublistId: "cupones"
                });

                if (!utilities.isEmpty(cantidadLineasCupones) && cantidadLineasCupones > 0) {

                    for (var i = 0; i < cantidadLineasCupones; i++) {

                        /*record.selectLine({
                            sublistId: 'cupones',
                            line: i
                        });*/

                        var idCupon = record.getSublistValue({
                            sublistId: 'cupones',
                            fieldId: 'idinternos',
                            line: i
                        });

                        var remito = record.getSublistValue({
                            sublistId: 'cupones',
                            fieldId: 'remito',
                            line: i
                        });

                        var alias = record.getSublistValue({
                            sublistId: 'cupones',
                            fieldId: 'alias',
                            line: i
                        });

                        var objRemitosCupones = new Object();
                        objRemitosCupones.idCupon = new Array();
                        objRemitosCupones.index = 0;
                        objRemitosCupones.idRemito = remito;

                        var arrCuponesRemitoFilter = arrCuponesRemito.filter(function (obj) {
                            return obj.idRemito == objRemitosCupones.idRemito;
                        });

                        if (!utilities.isEmpty(arrCuponesRemitoFilter) && arrCuponesRemitoFilter.length > 0) {
                            log.debug('arrCuponesRemitoFilter', JSON.stringify(arrCuponesRemitoFilter));
                            arrCuponesRemito[arrCuponesRemitoFilter[0].index].idCupon.push(alias);
                        } else {
                            objRemitosCupones.idCupon.push(alias);
                            if (!utilities.isEmpty(arrCuponesRemito) && arrCuponesRemito.length > 0) {
                                objRemitosCupones.index = arrCuponesRemito.length;
                            }
                            arrCuponesRemito.push(objRemitosCupones);
                        }

                        log.debug('arrCuponesRemito', JSON.stringify(arrCuponesRemito));

                        var procesarCupon = record.getSublistValue({
                            sublistId: 'cupones',
                            fieldId: 'procesar',
                            line: i
                        });

                        //alert(procesarCupon + "typeof: " + typeof (procesarCupon));

                        if (procesarCupon) {
                            existenCuponesSeleccionados = true;

                            if (!utilities.isEmpty(idCupon)) {

                                var objRemitosCuponesSelected = new Object();
                                objRemitosCuponesSelected.idCupon = new Array();
                                objRemitosCuponesSelected.index = 0;
                                objRemitosCuponesSelected.idRemito = remito;

                                var arrCuponesRemitoSelectedFilter = arrCuponesRemitoSelected.filter(function (obj) {
                                    return obj.idRemito == objRemitosCuponesSelected.idRemito;
                                });

                                if (!utilities.isEmpty(arrCuponesRemitoSelectedFilter) && arrCuponesRemitoSelectedFilter.length > 0) {
                                    arrCuponesRemitoSelected[arrCuponesRemitoSelectedFilter[0].index].idCupon.push(alias);
                                } else {
                                    objRemitosCuponesSelected.idCupon.push(alias);
                                    if (!utilities.isEmpty(arrCuponesRemitoSelected) && arrCuponesRemitoSelected.length > 0) {
                                        objRemitosCuponesSelected.index = arrCuponesRemitoSelected.length;
                                    }
                                    arrCuponesRemitoSelected.push(objRemitosCuponesSelected);
                                }


                                log.debug('arrCuponesRemitoSelected', JSON.stringify(arrCuponesRemitoSelected));
                            }
                        }
                    }

                    if (!existenCuponesSeleccionados) {
                        error = true;
                        alert("No se selecciono ningun Cupon para procesar");
                        return false;

                    } else {
                        var arrRemitoError = new Array();

                        for (var j = 0; j < arrCuponesRemitoSelected.length; j++) {

                            var objRemitoError = new Object();

                            var remitoSel = arrCuponesRemitoSelected[j].idRemito;



                            var arrRemitosFilter = arrCuponesRemito.filter(function (o) {
                                return o.idRemito == remitoSel;
                            });

                            if (arrRemitosFilter.length > 0 && !utilities.isEmpty(arrRemitosFilter)) {

                                objRemitoError.remito = remitoSel;
                                objRemitoError.cupones = new Array();
                                if (arrRemitosFilter[0].idCupon.length != arrCuponesRemitoSelected[j].idCupon.length) {

                                    for (var k = 0; k < arrCuponesRemitoSelected[j].idCupon.length; k++) {

                                        var arrCuponesFilter = arrRemitosFilter[0].idCupon.filter(function (obj) {
                                            return obj != arrCuponesRemitoSelected[j].idCupon[k];
                                        });

                                        objRemitoError.cupones.push(arrCuponesFilter);

                                    }

                                    arrRemitoError.push(objRemitoError);

                                }
                            }
                        }

                        if (!utilities.isEmpty(arrRemitoError) && arrRemitoError.length > 0) {

                            error = true;
                            var mensajeErrorRemito = "";
                            for (var l = 0; l < arrRemitoError.length; l++) {

                                if (l == 0) {
                                    mensajeErrorRemito += "Remito: " + arrRemitoError[l].remito.toString() + " Cupones: " + arrRemitoError[l].cupones.toString();
                                } else {
                                    mensajeErrorRemito += "/Remito: " + arrRemitoError[l].remito.toString() + " Cupones: " + arrRemitoError[l].cupones.toString();
                                }
                            }
                            alert("Error al encontrar cupones no seleccionados dentro de remito seleccionados. Faltaron seleccionar los siguientes cupones: " + mensajeErrorRemito);
                            return false;
                        }
                    }
                } else {
                    
                    error = true;
                    alert('No se pudo Obtener el contenido de la sublista de Cupones a procesar');
                    return false;
                }


                if (!error) {
                    record.setValue({
                        fieldId: 'custpage_accion',
                        value: 'MARCARCUP'
                    });

                    document.forms['main_form'].submitter.click();
                    return true;
                }
            } catch (e) {
                alert("Excepción. " + e.message);
            }
        }

        function fieldChanged(context) {
            if (context.fieldId == 'numcupon') {
                var cuponConsultar = context.currentRecord.getValue({
                    fieldId: 'numcupon'
                });

                //alert("Numero de Cupon A Consultar : " + cuponConsultar);

                if (!utilities.isEmpty(cuponConsultar)) {
                    var cantidadLineas = context.currentRecord.getLineCount({
                        sublistId: 'cupones'
                    });

                    //alert("Cantidad de Lineas : " + cantidadLineas);

                    if (!utilities.isEmpty(cantidadLineas) && cantidadLineas > 0) {
                        // INICIO Consultar Linea Para el Cupon
                        var numeroLinea = context.currentRecord.findSublistLineWithValue({
                            sublistId: 'cupones',
                            fieldId: 'alias',
                            value: cuponConsultar
                        });

                        //alert("Numero de Linea Encontrada : " + numeroLinea);

                        if (!utilities.isEmpty(numeroLinea) && numeroLinea >= 0) {
                            context.currentRecord.selectLine({
                                sublistId: 'cupones',
                                line: numeroLinea
                            });

                            context.currentRecord.setCurrentSublistValue({
                                sublistId: 'cupones',
                                fieldId: 'procesar',
                                value: true,
                                ignoreFieldChange: false
                            });

                            context.currentRecord.commitLine({
                                sublistId: 'cupones'
                            });
                        }
                        // FIN Consultar Linea Para el Cupon
                    }

                    // Inicio Blanquear Campo
                    context.currentRecord.setValue({
                        fieldId: 'numcupon',
                        value: '',
                        ignoreFieldChange: true
                    });
                    // Fin Blanquear Campo
                }
            }
            if (context.fieldId == 'procesar' && !utilities.isEmpty(context.line) && context.line >= 0) {
                context.currentRecord.selectLine({
                    sublistId: 'cupones',
                    line: context.line
                });

                var procesarCupon = context.currentRecord.getCurrentSublistValue({
                    sublistId: 'cupones',
                    fieldId: 'procesar',
                });

                var cantidadCuponesMarcados = context.currentRecord.getValue({
                    fieldId: 'cantidadcupmarcados'
                });
                if (!utilities.isEmpty(procesarCupon)) {
                    if (utilities.isEmpty(cantidadCuponesMarcados)) {
                        cantidadCuponesMarcados = parseInt(0, 10);
                    }
                    if (procesarCupon == true) {
                        cantidadCuponesMarcados = parseInt(cantidadCuponesMarcados, 10) + parseInt(1, 10);
                    }
                    if (procesarCupon == false && cantidadCuponesMarcados > 0) {
                        cantidadCuponesMarcados = parseInt(cantidadCuponesMarcados, 10) - parseInt(1, 10);
                    }
                    if (cantidadCuponesMarcados < 0) {
                        cantidadCuponesMarcados = parseInt(0, 10);
                    }
                    context.currentRecord.setValue({
                        fieldId: 'cantidadcupmarcados',
                        value: cantidadCuponesMarcados.toString(),
                        ignoreFieldChange: true
                    });
                }
            }
        }

        /*function saveRecord(context) {
            alert("Prueba de alert");
            return false;
        }*/

        return {
            marcarCupones: marcarCupones,
            fieldChanged: fieldChanged
            //saveRecord: saveRecord
        };
    });
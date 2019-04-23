/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/error', '3K/utilities', '3K/funcionalidadesOV'], function (record, error, utilities, funcionalidades) {

    function beforeSubmit(context) {

        var objRespuesta = new Object();
        objRespuesta.error = false;
        objRespuesta.mensaje = '';

        try {

            var rec = context.newRecord;

            if (tranType = "customerrefund") {

                var arrayTranCerrar = new Array();

                var numLines = rec.getLineCount({
                    sublistId: 'deposit'
                });

                var sublistas = rec.getSublist({
                    sublistId: 'deposit'
                });

                log.debug('sublistas', JSON.stringify(sublistas))

                log.debug('numLines', numLines);

                for (var i = 0; i < numLines; i++) {

                    var apply = rec.getSublistValue({
                        sublistId: 'deposit',
                        fieldId: 'apply',
                        line: i
                    });

                    log.debug('apply', apply);

                    if (apply == true) {

                        arrayTranCerrar.push(rec.getSublistValue({
                            sublistId: 'deposit',
                            fieldId: 'doc',
                            line: i
                        }));

                    }

                }

                /*var cliente = rec.getValue({
                    fieldId: 'customer'
                });*/

                log.debug('arrayTranCerrar', JSON.stringify(arrayTranCerrar));

                if (arrayTranCerrar.length > 0) {

                    var arraySearchParams = [];
                    var objParam = new Object({});
                    objParam.name = 'internalid';
                    objParam.operator = 'ANYOF';
                    objParam.values = arrayTranCerrar;
                    arraySearchParams.push(objParam);

                    var arrayResultDep = utilities.searchSavedPro('customsearch_3k_depositos_cerrar_ov', arraySearchParams);

                    log.debug('arrayResultDep', JSON.stringify(arrayResultDep));

                    var arregloDepositosOV = arrayResultDep.objRsponseFunction.array;

                    if (!utilities.isEmpty(arregloDepositosOV) && arregloDepositosOV.length > 0) {

                        var arrayMsjError = new Array()

                        for (var i = 0; i < arregloDepositosOV.length; i++) {

                            var respuestaCerrar = funcionalidades.cerrarTransaccion(arregloDepositosOV[i].createdfrom, 'item', 'salesorder');

                            if (respuestaCerrar.error == true) {

                                log.error('ID Deposito: ' + arregloDepositosOV[i].internalid + ' - ID OV: ' + arregloDepositosOV[i].createdfrom + ' - Error: ' + respuestaCerrar.mensaje);
                                arrayMsjError.push('ID Deposito: ' + arregloDepositosOV[i].internalid + ' - ID OV: ' + arregloDepositosOV[i].createdfrom + ' - Error: ' + respuestaCerrar.mensaje);

                            }

                        }

                        if (arrayMsjError.length > 0) {

                            objRespuesta.error = true;
                            objRespuesta.mensaje = arrayMsjError.toString();

                            var errObj = error.create({
                                name: 'E001',
                                message: arrayMsjError.toString()
                            })

                            throw errObj;

                        }

                    }
                }



            }
            /*else{

                            var giftCard = rec.getValue({
                                fieldId: 'custbody_3k_devolucion_giftcard'
                            })

                            if(giftCard == true){

                                var returnId = rec.getValue({fieldId: 'createdfrom'});

                            }

                        }*/

        } catch (e) {

            var errObj = error.create({
                name: 'E002',
                message: e.message
            })

            throw errObj;
        }
    }

    return {
        beforeSubmit: beforeSubmit
    }
});
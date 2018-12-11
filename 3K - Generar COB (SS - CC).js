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


define(['N/error', 'N/http', 'N/https', 'N/record', 'N/search', 'N/url', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {http} http
     * @param {https} https
     * @param {record} record
     * @param {search} search
     */
    function (error, http, https, record, search, url, utilities, funcionalidades) {

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

            log.audit('Inicio Grabar Cobranza', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);


            if (scriptContext.type == 'create') {
                try {
                    log.audit('Inicio Grabar Cobranza', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

                    var objRespuesta = new Object();
                    objRespuesta.error = false;
                    objRespuesta.detalle = new Array();

                    var idRegistro = scriptContext.newRecord.id;
                    var tipoRegistro = scriptContext.newRecord.type;

                    var requestBody = scriptContext.newRecord.getValue({
                        fieldId: 'custrecord_3k_generacion_cob_info'
                    });

                    if (!utilities.isEmpty(requestBody)) {
                        var informacion = JSON.parse(requestBody);

                        if (!utilities.isEmpty(informacion)) {

                            var operacion = informacion.operacion;

                            if (!utilities.isEmpty(operacion)) {

                                switch (operacion) {

                                    //Alta
                                    case "A":
                                        objRespuesta = crearDeposito(informacion);
                                        break;

                                        //Consulta
                                    case "C":
                                        objRespuesta = consultarCupones(informacion);
                                        break;

                                        //Modificar
                                    case "M":
                                        break;
                                    default:
                                        objRespuesta.error = true;
                                        respuestaParcial = new Object();
                                        respuestaParcial.codigo = 'RDEP001';
                                        respuestaParcial.mensaje = 'Tipo de Operación no válida.';
                                        objRespuesta.detalle.push(respuestaParcial);
                                        log.error('RDEP001', 'Tipo de Operación no válida.');

                                        break;
                                }

                            } else {
                                objRespuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'RDEP002';
                                respuestaParcial.mensaje = 'Variable Operación vacía';
                                objRespuesta.detalle.push(respuestaParcial);
                                log.error('RDEP002', 'Variable Operación vacía');
                            }

                        } else {
                            objRespuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'RDEP003';
                            respuestaParcial.mensaje = 'No se puede parsear objectJSON.';
                            objRespuesta.detalle.push(respuestaParcial);
                            log.error('RDEP003', 'No se puede parsear objectJSON');
                        }

                    } else {
                        objRespuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'RDEP004';
                        respuestaParcial.mensaje = 'No se recibio parametro con informacion a realizar';
                        objRespuesta.detalle.push(respuestaParcial);
                        log.error('RDEP004', 'No se recibio parametro con informacion a realizar');
                    }

                } catch (excepcion) {
                    log.error('Grabar Cobranza', 'AfterSubmit - Excepcion Grabando Cobranza - Excepcion : ' + excepcion.message);
                    throw utilities.crearError('RDEP050', 'Excepcion Grabando Cobranza - Excepcion : ' + excepcion.message);
                }

                // INICIO - Actualizar Respuesta
                try {
                    var idRecord = record.submitFields({
                        type: tipoRegistro,
                        id: idRegistro,
                        values: {
                            custrecord_3k_generacion_cob_resp: JSON.stringify(objRespuesta)
                        },
                        options: {
                            enableSourcing: true,
                            ignoreMandatoryFields: false
                        }
                    });
                    if (utilities.isEmpty(idRecord)) {
                        log.error('Grabar Cobranza', 'AfterSubmit - Error Grabando Cobranza - Error : No se recibio ID de Registro de Cobranza Actualizdo');
                        throw utilities.crearError('RDEP051', 'Error Grabando Cobranza - Error : No se recibio ID de Registro de Cobranza Actualizdo');
                    }
                } catch (exepcionSubmit) {
                    log.error('Grabar Cobranza', 'AfterSubmit - Excepcion Grabando Cobranza - Excepcion : ' + exepcionSubmit.message);
                    throw utilities.crearError('RDEP052', 'Excepcion Grabando Cobranza - Excepcion : ' + exepcionSubmit.message);
                }
                // FIN - Actualizar Respuesta

            }

            log.audit('Fin Grabar Cobranza', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

        }

        function crearDeposito(informacion) {
            log.audit('Cobranza Cliente', 'INICIO Generacion Deposito Cliente');

            var arrayCuponesProcesar = new Array();
            var arrayCuponesProcesados = new Array();

            var respuesta = new Object();
            respuesta.idOV = '';
            respuesta.idDeposito = '';
            respuesta.cupones = new Array();
            respuesta.error = false;
            respuesta.detalle = new Array();

            try {
                if (!utilities.isEmpty(informacion)) {
                    if (!utilities.isEmpty(informacion.carrito) && !utilities.isEmpty(informacion.cliente) && !utilities.isEmpty(informacion.pago) && informacion.pago.length > 0) {

                        var filtrosDesposito = new Array();

                        var filtroOV = new Object();
                        filtroOV.name = 'createdfrom';
                        filtroOV.operator = 'ANYOF';
                        filtroOV.values = informacion.carrito;
                        filtrosDesposito.push(filtroOV);

                        var searchRemitos = utilities.searchSavedPro('customsearch_3k_deposito_ov', filtrosDesposito);
                        if (searchRemitos.error) {
                            return searchRemitos;
                        }

                        var depositos = searchRemitos.objRsponseFunction.array 

                        if (!utilities.isEmpty(depositos) && depositos.length > 0) {

                            var formaPago = informacion.pago[0].formaPago;
                            var importePago = parseFloat(informacion.pago[0].importePago, 10);

                            var respuestaDespositos = new Object();
                            respuestaDespositos.idOV = '';
                            respuestaDespositos.idOV = informacion.carrito;
                            respuestaDespositos.idCliente = informacion.cliente;
                            respuestaDespositos.error = false;
                            respuestaDespositos.depositos = new Array();
                            respuestaDespositos.detalle = new Array();

                            var objRespuestaAfter = new Object({})
                            objRespuestaAfter.idDeposito = depositos[0].internalid;
                            objRespuestaAfter.formaPago = formaPago;
                            objRespuestaAfter.importePago = importePago;
                            objRespuestaAfter.cupones = [];
                            respuestaDespositos.depositos.push(objRespuestaAfter);

                            respuesta = respuestaDespositos;


                            /*respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'RDEP016';
                            respuestaParcial.mensaje = 'Existen dépositos de clientes asociados a la orden de venta: ' + informacion.carrito;
                            respuesta.detalle.push(respuestaParcial);*/
                        } else {

                            var respuestaCrearDepositos = funcionalidades.crearDepositos(informacion.carrito, informacion.cliente, informacion.pago);
                            if (respuestaCrearDepositos.error) {
                                return JSON.stringify(respuestaCrearDepositos);
                            }

                            respuesta = respuestaCrearDepositos;
                        }




                    } else {
                        respuesta.error = true;
                        var mensaje = 'No se recibio la siguiente informacion Requerida para realizar la Cobranza de Cliente : ';

                        if (utilities.isEmpty(informacion.carrito)) {
                            mensaje = mensaje + ' Numero de Carrito / ';
                        }
                        if (utilities.isEmpty(informacion.cliente)) {
                            mensaje = mensaje + ' ID de Cliente / ';
                        }
                        if (utilities.isEmpty(informacion.formaPago)) {
                            mensaje = mensaje + ' Forma de Pago / ';
                        }
                        if (utilities.isEmpty(informacion.importePago)) {
                            mensaje = mensaje + ' Importe de Pago / ';
                        }
                        if (isNaN(informacion.importePago)) {
                            mensaje = mensaje + ' Importe de Pago No Numerico / ';
                        }
                        if (informacion.importePago <= 0) {
                            mensaje = mensaje + ' Importe de Pago No Valido / ';
                        }

                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'RDEP014';
                        respuestaParcial.mensaje = mensaje;
                        respuesta.detalle.push(respuestaParcial);
                    }
                } else {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SROV016';
                    respuestaParcial.mensaje = 'No se recibio la informacion de la Cobranza a Realizar';
                    respuesta.detalle.push(respuestaParcial);
                }
            } catch (excepcionGeneral) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'RDEP015';
                respuestaParcial.mensaje = 'Excepcion Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Excepcion : ' + excepcionGeneral.message.toString();
                respuesta.detalle.push(respuestaParcial);
            }

            log.debug('Cobranza Cliente', 'Respuesta : ' + JSON.stringify(respuesta));

            if (respuesta.error == true && !utilities.isEmpty(respuesta.detalle) && respuesta.detalle.length > 0) {
                log.error('Cobranza Cliente', 'Error Generando Cobranza de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' Error : ' + JSON.stringify(respuesta));
            }

            log.audit('Cobranza Cliente', 'FIN Generacion Deposito Cliente');
            return respuesta;
        }

        function consultarCupones(informacion) {
            log.audit('Cobranza Cliente', 'INICIO Consulta de Cupones');

            var arrayCuponesProcesar = new Array();
            var arrayCuponesProcesados = new Array();

            var respuesta = new Object();
            respuesta.idOV = '';
            respuesta.idDeposito = '';
            respuesta.cupones = new Array();
            respuesta.error = false;
            respuesta.detalle = new Array();

            try {
                if (!utilities.isEmpty(informacion)) {
                    if (!utilities.isEmpty(informacion.carrito)) {

                        respuesta.idOV = informacion.carrito;

                        var informacionCupones = new Array();
                        var informacionCuponesResult = new Array();

                        var filtrosConsultaCupones = new Array();

                        var filtroOV = new Object();
                        filtroOV.name = 'custrecord_3k_cupon_ord_venta';
                        filtroOV.operator = 'IS';
                        filtroOV.values = respuesta.idOV;
                        filtrosConsultaCupones.push(filtroOV);

                        var searchCupones = utilities.searchSavedPro('customsearch_3k_cupones_gen_ov', filtrosConsultaCupones);
                        if (!utilities.isEmpty(searchCupones) && searchCupones.error == false) {
                            if (!utilities.isEmpty(searchCupones.objRsponseFunction.result) && searchCupones.objRsponseFunction.result.length > 0) {
                                // Agrupar Cupones por ID de Orden
                                var resultSet = searchCupones.objRsponseFunction.result;
                                var resultSearch = searchCupones.objRsponseFunction.search;

                                var idLineaOVAnterior = '';
                                var idLineaOVActual = '';
                                var contador = 0;

                                var l = 0;

                                while (!utilities.isEmpty(resultSet) && resultSet.length > 0 && l < resultSet.length) {
                                    var arrayCupones = new Array();
                                    var arrayCuponesResult = new Array();
                                    var obj = new Object();
                                    obj.indice = contador;
                                    contador++;

                                    respuesta.idDeposito = resultSet[l].getValue({
                                        name: resultSearch.columns[5]
                                    });

                                    idLineaOVActual = resultSet[l].getValue({
                                        name: resultSearch.columns[2]
                                    });

                                    do {
                                        idLineaOVAnterior = idLineaOVActual;

                                        var idCupon = resultSet[l].getValue({
                                            name: resultSearch.columns[0]
                                        });

                                        var codigoCupon = resultSet[l].getValue({
                                            name: resultSearch.columns[3]
                                        });

                                        var aliasCupon = resultSet[l].getValue({
                                            name: resultSearch.columns[4]
                                        });

                                        arrayCupones.push(idCupon);
                                        arrayCuponesProcesar.push(idCupon);

                                        var informacionParcialCupon = new Object();
                                        informacionParcialCupon.idInterno = idCupon;
                                        informacionParcialCupon.codigo = codigoCupon;
                                        informacionParcialCupon.alias = aliasCupon;
                                        arrayCuponesResult.push(informacionParcialCupon);


                                        l++;


                                        if (l < resultSet.length) {

                                            idLineaOVActual = resultSet[l].getValue({
                                                name: resultSearch.columns[2]
                                            });

                                        }

                                    } while (l < resultSet.length && idLineaOVActual == idLineaOVAnterior)

                                    var obj = new Object();
                                    obj.idOV = respuesta.idOV;
                                    obj.idLineaOV = idLineaOVAnterior;
                                    obj.idCupones = arrayCupones;

                                    informacionCupones.push(obj);

                                    var objCupon = new Object();
                                    objCupon.idOV = respuesta.idOV;
                                    objCupon.idLineaOV = idLineaOVAnterior;
                                    objCupon.informacionCupones = arrayCuponesResult;

                                    informacionCuponesResult.push(objCupon);



                                }

                                respuesta.cupones = informacionCuponesResult;

                            }
                            /*else {
                                                           respuesta.error = true;
                                                           respuestaParcial = new Object();
                                                           respuestaParcial.codigo = 'RDEP046';
                                                           respuestaParcial.mensaje = 'Error Consultando Cupones por Orden de Venta en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se encontraron Cupones Generados';
                                                           respuesta.detalle.push(respuestaParcial);
                                                       }*/
                        } else {
                            if (utilities.isEmpty(searchCupones)) {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'RDEP047';
                                respuestaParcial.mensaje = 'Error Consultando Cupones por Orden de Venta en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Error : No se Recibio Objeto de Respuesta';
                                respuesta.detalle.push(respuestaParcial);
                            } else {
                                respuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'RDEP048';
                                respuestaParcial.mensaje = 'Error Consultando Cupones por Orden en Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Tipo Error : ' + searchCupones.tipoError + ' - Descripcion : ' + searchCupones.descripcion;
                                respuesta.detalle.push(respuestaParcial);
                            }
                        }

                    } else {
                        respuesta.error = true;
                        var mensaje = 'No se recibio la siguiente informacion Requerida para realizar la Consulta de Cupones : ';

                        if (utilities.isEmpty(informacion.carrito)) {
                            mensaje = mensaje + ' Numero de Carrito / ';
                        }

                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'RDEP049';
                        respuestaParcial.mensaje = mensaje;
                        respuesta.detalle.push(respuestaParcial);
                    }
                } else {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SROV050';
                    respuestaParcial.mensaje = 'No se recibio la informacion de la Consulta de Cupones a Realizar';
                    respuesta.detalle.push(respuestaParcial);
                }
            } catch (excepcionGeneral) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'RDEP051';
                respuestaParcial.mensaje = 'Excepcion Consultando Cupones de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' - Excepcion : ' + excepcionGeneral.message.toString();
                respuesta.detalle.push(respuestaParcial);
            }

            log.debug('Cobranza Cliente', 'Respuesta : ' + JSON.stringify(respuesta));

            if (respuesta.error == true && !utilities.isEmpty(respuesta.detalle) && respuesta.detalle.length > 0) {
                log.error('Cobranza Cliente', 'Error Consultando Cupones de la Orden de Venta con ID Interno : ' + respuesta.idOV + ' Error : ' + JSON.stringify(respuesta));
            }

            log.audit('Cobranza Cliente', 'FIN Consulta de Cupones');
            return respuesta;
        }

        return {
            afterSubmit: afterSubmit
        };

    });
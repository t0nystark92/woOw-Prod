/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType Restlet
 * @NModuleScope Public
 */

/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities',
        '3K/funcionalidadesOV': './3K - Funcionalidades OV'
    }
});*/

define(['N/record', 'N/error', 'N/search', 'N/format', '3K/utilities', '3K/funcionalidadesOV'],

    function(record, error, search, format, utilities, funcionalidades) {

        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPost(requestBody) {
            log.audit('Funcionalidades Comandas', 'INICIO Proceso');
            var objetoRespuesta = new Object();
            objetoRespuesta.error = false;
            objetoRespuesta.mensaje = new Object();
            objetoRespuesta.informacionComandas = new Array();

            try {
                if (requestBody != null && requestBody != "") {
                    var informacion = JSON.parse(requestBody);
                    if (informacion != null && informacion != "") {
                        var operacion = informacion.operacion;

                        if (!utilities.isEmpty(operacion)) {
                            switch (operacion) {
                                case 'CONS':
                                    objetoRespuesta = consultarRemito(informacion);
                                    break;
                                case 'CANC':
                                    objetoRespuesta = cancelarRemito(informacion);
                                    break;
                                case 'PACK':
                                    objetoRespuesta = packRemito(informacion);
                                    break;
                                case 'SHIP':
                                    objetoRespuesta = shipRemito(informacion);
                                    break;
                                default:
                                    objetoRespuesta.error = true;
                                    objetoRespuesta.mensaje.tipo = "RCOM001";
                                    objetoRespuesta.mensaje.descripcion = "Operacion a realizar recibida invalida";
                            }
                        } else {
                            objetoRespuesta.error = true;
                            objetoRespuesta.mensaje.tipo = "RCOM002";
                            objetoRespuesta.mensaje.descripcion = "No se recibio el Tipo de Operacion a realizar";
                        }
                    } else {
                        objetoRespuesta.error = true;
                        objetoRespuesta.mensaje.tipo = "RCOM003";
                        objetoRespuesta.mensaje.descripcion = "Error al parsear parametro con informacion a realizar";
                    }
                } else {
                    objetoRespuesta.error = true;
                    objetoRespuesta.mensaje.tipo = "RCOM004";
                    objetoRespuesta.mensaje.descripcion = "No se recibio parametro con informacion a realizar";
                }
            } catch (excepcion) {
                log.error('Funcionalidades Comandas', 'Excepcion Proceso Comandas - Excepcion : ' + excepcion.message);
                objetoRespuesta.error = true;
                objetoRespuesta.existenRegistros = false;
                objetoRespuesta.mensaje.tipo = "RCOM005";
                objetoRespuesta.mensaje.descripcion = 'Excepcion en Proceso Comandas - Excepcion : ' + excepcion.message;
            }

            var respuestaStockTerceros = JSON.stringify(objetoRespuesta);

            log.audit('Funcionalidades Comandas', 'FIN Proceso');

            return respuestaStockTerceros;
        }

        function consultarRemito(informacion) {
            log.audit('Funcionalidades Comandas - Consulta Remito', 'INICIO Proceso');
            var objetoRespuesta = funcionalidades.consultarRemito(informacion);
            log.audit('Funcionalidades Comandas - Consulta Remito', 'FIN Proceso');
            return objetoRespuesta;
        }

        function cancelarRemito(informacion) {
            log.audit('Funcionalidades Comandas - Cancelar Remito', 'INICIO Proceso');
            var objetoRespuesta = new Object();
            objetoRespuesta.error = false;
            objetoRespuesta.mensaje = new Object();
            objetoRespuesta.informacionComandas = new Array();

            try {
                if (!utilities.isEmpty(informacion) && !utilities.isEmpty(informacion.comandas) && informacion.comandas.length > 0) {
                    for (var j = 0; j < informacion.comandas.length && objetoRespuesta.error == false; j++) {
                        var infoCarrito = new Object();
                        infoCarrito.existeRemito = false;
                        infoCarrito.ordenesPickeadasTotal = false;
                        infoCarrito.informacionRemito = new Object();
                        infoCarrito.informacionRemito.idInterno = '';
                        infoCarrito.informacionRemito.ordenesPickeadas = new Array();
                        infoCarrito.informacionRemito.ordenesNoPickeadas = new Array();
                        if (!utilities.isEmpty(informacion.comandas[j].idRemito)) {

                            infoCarrito.informacionRemito.idInterno = informacion.comandas[j].idRemito;

                            try {
                                var objRecord = record.delete({
                                    type: record.Type.ITEM_FULFILLMENT,
                                    id: informacion.comandas[j].idRemito,
                                });
                            } catch (excepcionEliminar) {
                                log.error('Funcionalidades Cancelar - Cancelacion Remito', 'Excepcion Proceso Eliminacion de Remito - Excepcion : ' + excepcionEliminar.message);
                                objetoRespuesta.error = true;
                                objetoRespuesta.mensaje.tipo = "RCOM013";
                                objetoRespuesta.mensaje.descripcion = "Excepcion en Proceso de Eliminacion de Remito - Excepcion : " + excepcionEliminar.message;
                            }

                        } else {
                            var mensaje = 'No se recibio la siguiente informacion requerida para realizar la cancelacion del Remito : ';
                            if (utilities.isEmpty(informacion.comandas[j].idRemito)) {
                                mensaje = mensaje + " ID Interno del Remito / ";
                            }

                            objetoRespuesta.error = true;
                            objetoRespuesta.mensaje.tipo = "RCOM014";
                            objetoRespuesta.mensaje.descripcion = mensaje;
                            log.error('Funcionalidades Comandas - Consulta Remito', mensaje);
                        }
                        objetoRespuesta.informacionComandas.push(infoCarrito);
                    }
                } else {
                    objetoRespuesta.error = true;
                    objetoRespuesta.mensaje.tipo = "RCOM015";
                    objetoRespuesta.mensaje.descripcion = "No se recibio parametro con informacion a realizar";
                }
            } catch (excepcionConsulta) {
                log.error('Funcionalidades Cancelar - Cancelacion Remito', 'Excepcion Proceso Cancelacion de Remito - Excepcion : ' + excepcionConsulta.message);
                objetoRespuesta.error = true;
                objetoRespuesta.mensaje.tipo = "RCOM016";
                objetoRespuesta.mensaje.descripcion = "Excepcion en Proceso de Cancelacion de Remito - Excepcion : " + excepcionConsulta.message;
            }
            log.audit('Funcionalidades Comandas - Cancelar Remito', 'FIN Proceso');
            return objetoRespuesta;
        }

        function packRemito(informacion) {
            log.audit('Funcionalidades Comandas - Pack Remito', 'INICIO Proceso');
            var objetoRespuesta = new Object();
            objetoRespuesta.error = false;
            objetoRespuesta.mensaje = new Object();
            objetoRespuesta.informacionComandas = new Array();

            try {
                if (!utilities.isEmpty(informacion) && !utilities.isEmpty(informacion.comandas) && informacion.comandas.length > 0) {
                    for (var j = 0; j < informacion.comandas.length && objetoRespuesta.error == false; j++) {
                        var infoCarrito = new Object();
                        infoCarrito.existeRemito = false;
                        infoCarrito.ordenesPickeadasTotal = false;
                        infoCarrito.informacionRemito = new Object();
                        infoCarrito.informacionRemito.idInterno = '';
                        infoCarrito.informacionRemito.ordenesPickeadas = new Array();
                        infoCarrito.informacionRemito.ordenesNoPickeadas = new Array();
                        if (!utilities.isEmpty(informacion.comandas[j].idRemito)) {

                            infoCarrito.informacionRemito.idInterno = informacion.comandas[j].idRemito;

                            // INICIO - Obtener Informacion Remito
                            var filtrosRemito = new Array();

                            var filtroID = new Object();
                            filtroID.name = 'internalid';
                            filtroID.operator = 'IS';
                            filtroID.values = informacion.comandas[j].idRemito;
                            filtrosRemito.push(filtroID);

                            var searchRemito = utilities.searchSavedPro('customsearch_3k_remitos_pick', filtrosRemito);

                            if (!utilities.isEmpty(searchRemito) && searchRemito.error == false) {
                                if (!utilities.isEmpty(searchRemito.objRsponseFunction.result) && searchRemito.objRsponseFunction.result.length > 0) {
                                    infoCarrito.existeRemito = true;
                                    try {
                                        var idRecord = record.submitFields({
                                            type: record.Type.ITEM_FULFILLMENT,
                                            id: informacion.comandas[j].idRemito,
                                            values: {
                                                shipstatus: 'B'
                                            },
                                            options: {
                                                enableSourcing: true,
                                                ignoreMandatoryFields: false
                                            }
                                        });
                                        if (utilities.isEmpty(idRecord)) {
                                            log.error('Funcionalidades Comandas - Pack Remito', 'Error Realizando Pack de Remito con ID Interno : ' + informacion.comandas[j].idRemito + ' - Error : No se recibio ID del Remito Grabado');
                                            objetoRespuesta.error = true;
                                            objetoRespuesta.mensaje.tipo = "RCOM018";
                                            objetoRespuesta.mensaje.descripcion = 'Error Realizando Pack de Remito con ID Interno : ' + informacion.comandas[j].idRemito + ' - Error : No se recibio ID del Remito Grabado';
                                        }
                                    } catch (excepcionPack) {
                                        log.error('Funcionalidades Comandas - Pack Remito', 'Excepcion Proceso Pack de Remito - Excepcion : ' + excepcionPack.message);
                                        objetoRespuesta.error = true;
                                        objetoRespuesta.mensaje.tipo = "RCOM018";
                                        objetoRespuesta.mensaje.descripcion = "Excepcion en Proceso Pack de Remito - Excepcion : " + excepcionPack.message;
                                    }

                                } else {
                                    objetoRespuesta.error = true;
                                    objetoRespuesta.mensaje.tipo = 'RCOM019';
                                    objetoRespuesta.mensaje.descripcion = 'Error Realizando Pack de Remito con ID Interno : ' + informacion.comandas[j].idRemito + ' - No se encontro el Remito o No se encuentra en estado Pick';
                                }
                            } else {
                                if (utilities.isEmpty(searchRemito)) {
                                    objetoRespuesta.error = true;
                                    objetoRespuesta.mensaje.tipo = 'RCOM020';
                                    objetoRespuesta.mensaje.descripcion = 'Error Realizando Pack de Remito con ID Interno : ' + informacion.comandas[j].idRemito + ' - Error : No se recibio Respuesta del Proceso de Busqueda del Estado del Remito';
                                } else {
                                    objetoRespuesta.error = true;
                                    objetoRespuesta.mensaje.tipo = 'RCOM021';
                                    objetoRespuesta.mensaje.descripcion = 'Error Realizando Pack de Remito con ID Interno : ' + informacion.comandas[j].idRemito + ' Error Consultando el Remito - Error : ' + searchRemito.tipoError + ' - Descripcion : ' + searchRemito.descripcion;
                                }
                            }

                            // FIN - Obtener Informacion Remito


                        } else {
                            var mensaje = 'No se recibio la siguiente informacion requerida para realizar el Pack del Remito : ';
                            if (utilities.isEmpty(informacion.comandas[j].idRemito)) {
                                mensaje = mensaje + " ID Interno del Remito / ";
                            }

                            objetoRespuesta.error = true;
                            objetoRespuesta.mensaje.tipo = "RCOM022";
                            objetoRespuesta.mensaje.descripcion = mensaje;
                            log.error('Funcionalidades Comandas - Pack Remito', mensaje);
                        }
                        objetoRespuesta.informacionComandas.push(infoCarrito);
                    }
                } else {
                    objetoRespuesta.error = true;
                    objetoRespuesta.mensaje.tipo = "RCOM023";
                    objetoRespuesta.mensaje.descripcion = "No se recibio parametro con informacion a realizar";
                }
            } catch (excepcionConsulta) {
                log.error('Funcionalidades Comandas - Pack Remito', 'Excepcion Proceso Pack de Remito - Excepcion : ' + excepcionConsulta.message);
                objetoRespuesta.error = true;
                objetoRespuesta.mensaje.tipo = "RCOM024";
                objetoRespuesta.mensaje.descripcion = "Excepcion en Proceso de Pack de Remito - Excepcion : " + excepcionConsulta.message;
            }
            log.audit('Funcionalidades Comandas - Pack Remito', 'FIN Proceso');
            return objetoRespuesta;
        }

        function shipRemito(informacion) {
            log.audit('Funcionalidades Comandas - Ship Remito', 'INICIO Proceso');
            var objetoRespuesta = new Object();
            objetoRespuesta.error = false;
            objetoRespuesta.mensaje = new Object();
            objetoRespuesta.informacionComandas = new Array();

            try {
                if (!utilities.isEmpty(informacion) && !utilities.isEmpty(informacion.comandas) && informacion.comandas.length > 0) {
                    for (var j = 0; j < informacion.comandas.length && objetoRespuesta.error == false; j++) {
                        var infoCarrito = new Object();
                        infoCarrito.existeRemito = false;
                        infoCarrito.ordenesPickeadasTotal = false;
                        infoCarrito.informacionRemito = new Object();
                        infoCarrito.informacionRemito.idInterno = '';
                        infoCarrito.informacionRemito.ordenesPickeadas = new Array();
                        infoCarrito.informacionRemito.ordenesNoPickeadas = new Array();
                        if (!utilities.isEmpty(informacion.comandas[j].idRemito)) {

                            infoCarrito.informacionRemito.idInterno = informacion.comandas[j].idRemito;

                            // INICIO - Obtener Informacion Remito
                            var filtrosRemito = new Array();

                            var filtroID = new Object();
                            filtroID.name = 'internalid';
                            filtroID.operator = 'IS';
                            filtroID.values = informacion.comandas[j].idRemito;
                            filtrosRemito.push(filtroID);

                            var searchRemito = utilities.searchSavedPro('customsearch_3k_remitos_pack', filtrosRemito);

                            if (!utilities.isEmpty(searchRemito) && searchRemito.error == false) {
                                if (!utilities.isEmpty(searchRemito.objRsponseFunction.result) && searchRemito.objRsponseFunction.result.length > 0) {
                                    infoCarrito.existeRemito = true;
                                    try {
                                        var idRecord = record.submitFields({
                                            type: record.Type.ITEM_FULFILLMENT,
                                            id: informacion.comandas[j].idRemito,
                                            values: {
                                                shipstatus: 'C'
                                            },
                                            options: {
                                                enableSourcing: true,
                                                ignoreMandatoryFields: false
                                            }
                                        });
                                        if (utilities.isEmpty(idRecord)) {
                                            log.error('Funcionalidades Comandas - Ship Remito', 'Error Realizando Ship de Remito con ID Interno : ' + informacion.comandas[j].idRemito + ' - Error : No se recibio ID del Remito Grabado');
                                            objetoRespuesta.error = true;
                                            objetoRespuesta.mensaje.tipo = "RCOM025";
                                            objetoRespuesta.mensaje.descripcion = 'Error Realizando Ship de Remito con ID Interno : ' + informacion.comandas[j].idRemito + ' - Error : No se recibio ID del Remito Grabado';
                                        }
                                    } catch (excepcionShip) {
                                        log.error('Funcionalidades Comandas - Ship Remito', 'Excepcion Proceso Ship de Remito - Excepcion : ' + excepcionShip.message);
                                        objetoRespuesta.error = true;
                                        objetoRespuesta.mensaje.tipo = "RCOM026";
                                        objetoRespuesta.mensaje.descripcion = "Excepcion en Proceso Ship de Remito - Excepcion : " + excepcionShip.message;
                                    }

                                } else {
                                    objetoRespuesta.error = true;
                                    objetoRespuesta.mensaje.tipo = 'RCOM027';
                                    objetoRespuesta.mensaje.descripcion = 'Error Realizando Ship de Remito con ID Interno : ' + informacion.comandas[j].idRemito + ' - No se encontro el Remito o No se encuentra en estado Pack';
                                }
                            } else {
                                if (utilities.isEmpty(searchRemito)) {
                                    objetoRespuesta.error = true;
                                    objetoRespuesta.mensaje.tipo = 'RCOM028';
                                    objetoRespuesta.mensaje.descripcion = 'Error Realizando Ship de Remito con ID Interno : ' + informacion.comandas[j].idRemito + ' - Error : No se recibio Respuesta del Proceso de Busqueda del Estado del Remito';
                                } else {
                                    objetoRespuesta.error = true;
                                    objetoRespuesta.mensaje.tipo = 'RCOM029';
                                    objetoRespuesta.mensaje.descripcion = 'Error Realizando Ship de Remito con ID Interno : ' + informacion.comandas[j].idRemito + ' Error Consultando el Remito - Error : ' + searchRemito.tipoError + ' - Descripcion : ' + searchRemito.descripcion;
                                }
                            }

                            // FIN - Obtener Informacion Remito


                        } else {
                            var mensaje = 'No se recibio la siguiente informacion requerida para realizar el Ship del Remito : ';
                            if (utilities.isEmpty(informacion.comandas[j].idRemito)) {
                                mensaje = mensaje + " ID Interno del Remito / ";
                            }

                            objetoRespuesta.error = true;
                            objetoRespuesta.mensaje.tipo = "RCOM030";
                            objetoRespuesta.mensaje.descripcion = mensaje;
                            log.error('Funcionalidades Comandas - Ship Remito', mensaje);
                        }
                        objetoRespuesta.informacionComandas.push(infoCarrito);
                    }
                } else {
                    objetoRespuesta.error = true;
                    objetoRespuesta.mensaje.tipo = "RCOM031";
                    objetoRespuesta.mensaje.descripcion = "No se recibio parametro con informacion a realizar";
                }
            } catch (excepcionConsulta) {
                log.error('Funcionalidades Comandas - Ship Remito', 'Excepcion Proceso Ship de Remito - Excepcion : ' + excepcionConsulta.message);
                objetoRespuesta.error = true;
                objetoRespuesta.mensaje.tipo = "RCOM032";
                objetoRespuesta.mensaje.descripcion = "Excepcion en Proceso de Ship de Remito - Excepcion : " + excepcionConsulta.message;
            }
            log.audit('Funcionalidades Comandas - Ship Remito', 'FIN Proceso');
            return objetoRespuesta;
        }

        return {
            post: doPost
        };

    });

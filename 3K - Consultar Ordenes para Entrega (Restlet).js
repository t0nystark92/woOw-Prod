/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType Restlet
 * @NModuleScope Public
 */

/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/

define(['N/record', 'N/error', 'N/search', 'N/format', '3K/utilities'],

    function(record, error, search, format, utilities) {

        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPost(requestBody) {
            log.audit('Consulta Ordenes Para Entrega', 'INICIO Proceso');
            var objetoRespuesta = new Object();
            objetoRespuesta.error = false;
            objetoRespuesta.mensaje = new Object();
            objetoRespuesta.existeCarrito = false;
            objetoRespuesta.informacionOrdenes = new Array();

            try {
                if (requestBody != null && requestBody != "") {
                    var informacion = JSON.parse(requestBody);
                    if (informacion != null && informacion != "") {
                        if (!utilities.isEmpty(informacion.idCarrito)) {
                            // INICIO - Obtener Informacion Carrito
                            var filtrosCarrito = new Array();

                            var filtroCarrito = new Object();
                            filtroCarrito.name = 'internalid';
                            filtroCarrito.operator = 'IS';
                            filtroCarrito.values = informacion.idCarrito;
                            filtrosCarrito.push(filtroCarrito);

                            var searchCarrito = utilities.searchSavedPro('customsearch_3k_ord_entrega', filtrosCarrito);

                            if (!utilities.isEmpty(searchCarrito) && searchCarrito.error == false) {
                                if (!utilities.isEmpty(searchCarrito.objRsponseFunction.result) && searchCarrito.objRsponseFunction.result.length > 0) {

                                    objetoRespuesta.existeCarrito = true;

                                    var resultSet = searchCarrito.objRsponseFunction.result;
                                    var resultSearch = searchCarrito.objRsponseFunction.search;
                                    for (var i = 0; i < resultSet.length; i++) {

                                        var infoCarrito = new Object();
                                        infoCarrito.idInterno = resultSet[i].getValue({
                                            name: resultSearch.columns[0]
                                        });
                                        infoCarrito.idOrden = resultSet[i].getValue({
                                            name: resultSearch.columns[1]
                                        });

                                        var disponible = resultSet[i].getValue({
                                            name: resultSearch.columns[2]
                                        });

                                        if (disponible == 'S') {
                                            infoCarrito.disponible = true;
                                        } else {
                                            infoCarrito.disponible = false;
                                        }
                                        infoCarrito.fechaDisponibilidad = resultSet[i].getValue({
                                            name: resultSearch.columns[3]
                                        });
                                        infoCarrito.lugarRetiro = resultSet[i].getValue({
                                            name: resultSearch.columns[4]
                                        });

                                        objetoRespuesta.informacionOrdenes.push(infoCarrito);
                                    }

                                } else {
                                    objetoRespuesta.error = true;
                                    objetoRespuesta.mensaje.tipo = 'RCOE007';
                                    objetoRespuesta.mensaje.descripcion = 'Error Consultando Orden de Venta con ID Interno : ' + informacion.idCarrito + ' - No se encontro el Carrito';
                                }
                            } else {
                                if (utilities.isEmpty(searchRemito)) {
                                    objetoRespuesta.error = true;
                                    objetoRespuesta.mensaje.tipo = 'RCOE006';
                                    objetoRespuesta.mensaje.descripcion = 'Error Consultando Orden de Venta con ID Interno : ' + informacion.idCarrito + ' - Error : No se recibio Respuesta del Proceso de Busqueda de Informacion de Carrito';
                                } else {
                                    objetoRespuesta.error = true;
                                    objetoRespuesta.mensaje.tipo = 'RCOE005';
                                    objetoRespuesta.mensaje.descripcion = 'Error Consultando Orden de Venta con ID Interno : ' + informacion.idCarrito + ' Error : ' + searchCarrito.tipoError + ' - Descripcion : ' + searchCarrito.descripcion;
                                }
                            }

                            // FIN - Obtener Informacion Carrito
                        } else {
                            objetoRespuesta.error = true;
                            objetoRespuesta.mensaje.tipo = "RCOE004";
                            objetoRespuesta.mensaje.descripcion = "No se recibio el ID Interno del Carrito a Consultar";
                        }
                    } else {
                        objetoRespuesta.error = true;
                        objetoRespuesta.mensaje.tipo = "RCOE003";
                        objetoRespuesta.mensaje.descripcion = "Error al parsear parametro con informacion a realizar";
                    }
                } else {
                    objetoRespuesta.error = true;
                    objetoRespuesta.mensaje.tipo = "RCOE002";
                    objetoRespuesta.mensaje.descripcion = "No se recibio parametro con informacion a realizar";
                }
            } catch (excepcion) {
                log.error('Consulta Ordenes Para Entrega', 'Excepcion Pen Proceso Consulta de Ordenes para entrega - Excepcion : ' + excepcion.message);
                objetoRespuesta.error = true;
                objetoRespuesta.existenRegistros = false;
                objetoRespuesta.mensaje.tipo = "RCOE001";
                objetoRespuesta.mensaje.descripcion = 'Excepcion en Proceso Consulta de Ordenes para entrega - Excepcion : ' + excepcion.message;
            }

            var respuestaOrdenes = JSON.stringify(objetoRespuesta);

            log.audit('Consulta Ordenes Para Entrega', 'FIN Proceso');

            return respuestaOrdenes;
        }

        return {
            post: doPost
        };

    });

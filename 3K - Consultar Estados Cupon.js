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
define(['N/error', 'N/record', 'N/search', 'N/format', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function(error, record, search, format, utilities, funcionalidades) {

        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPost(requestBody) {
            var respuesta = new Object({});
            respuesta.error = false;
            respuesta.detalle = [];
            respuesta.cupones = [];

            try {

                if (!utilities.isEmpty(requestBody)) {

                    var body = JSON.parse(requestBody);

                    var estadoCupon = body.estado;
                    var arrayEstado = new Array();
                    for (var x = 0; x < estadoCupon.length; x++) {
                        log.debug('Consultar Estado Cupones', 'estadoCupon[x]: ' + estadoCupon[x]);
                        arrayEstado.push(estadoCupon[x]);
                    }
                    var fechaIni = body.fechaIni;
                    var fechaFin = body.fechaFin;
                    log.debug('Consultar Estado Cupones', 'estado: ' + JSON.stringify(estadoCupon) + ' fechaIni: ' + fechaIni + ' fechaFin: ' + fechaFin);
                    log.debug('Consultar Estado Cupones', 'arrayEstado: ' + JSON.stringify(arrayEstado));
                    //log.debug('Consultar Estado Cupones', 'fechaLocalIni: ' + fechaLocalIni + ' fechaLocalFin: ' + fechaLocalFin);

                    var arrayCupones = [];

                    var arraySearchParams = [];
                    var objParam = new Object({});
                    objParam.name = 'date';
                    objParam.operator = 'ONORAFTER';
                    objParam.join = 'systemNotes';
                    objParam.values = [fechaIni];
                    arraySearchParams.push(objParam);

                    var objParam1 = new Object({});
                    objParam1.name = 'date';
                    objParam1.operator = 'ONORBEFORE';
                    objParam1.join = 'systemNotes';
                    objParam1.values = [fechaFin];
                    arraySearchParams.push(objParam1);

                    /*var objParam2 = new Object({});
                    objParam2.name = 'newvalue';
                    objParam2.operator = 'ANYOF';
                    objParam2.join = 'systemNotes';
                    objParam2.values = [estadoCupon];
                    arraySearchParams.push(objParam2);*/

                    var objResultSet = utilities.searchSavedPro('customsearch_3k_cupones_log_estados', arraySearchParams);
                    if (objResultSet.error) {
                        return objResultSet;
                    }

                    var resultCupones = objResultSet.objRsponseFunction.array;

                    log.debug('Consultar', 'resultCupones' + JSON.stringify(resultCupones));


                    if (!utilities.isEmpty(resultCupones) && resultCupones.length > 0) {



                        for (var i = 0; i < resultCupones.length; i++) {
                            var obj = new Object({});
                            obj.idCupon = resultCupones[i].internalid;
                            obj.estado = resultCupones[i]["Nuevo valor"];
                            obj.fecha = resultCupones[i]["Fecha"];
                            if (arrayEstado.indexOf(obj.estado) >= 0) {

                                var filterArray = arrayCupones.filter(function(o) {
                                    return (o.idCupon == obj.idCupon && o.estado == obj.estado);
                                });

                                if (!utilities.isEmpty(filterArray) && filterArray.length > 0) {
                                    continue;
                                }else{
                                    arrayCupones.push(obj);
                                }
                            }
                        }

                        /*var filterCupones = arrayCupones.filter(function(o){
                            return (inde)
                        });*/
                        respuesta.cupones = arrayCupones;
                    }

                } else {

                    respuesta.error = true;
                    objrespuestaParcial = new Object({});
                    objrespuestaParcial.codigo = 'RCEC002';
                    objrespuestaParcial.mensaje = 'No se recibió body request';
                    respuesta.detalle.push(objrespuestaParcial);
                    //objRespuesta.tipoError = 'RORV004';
                    //objRespuesta.descripcion = 'function crearOrdenVenta: ' + e.message;
                    log.error('RCEC002', 'No se recibió body request');
                }

            } catch (e) {
                respuesta.error = true;
                objrespuestaParcial = new Object({});
                objrespuestaParcial.codigo = 'RCEC001';
                objrespuestaParcial.mensaje = 'Excepción: ' + e.message;
                respuesta.detalle.push(objrespuestaParcial);
                //objRespuesta.tipoError = 'RORV004';
                //objRespuesta.descripcion = 'function crearOrdenVenta: ' + e.message;
                log.error('RCEC001', 'Excepción: ' + e.message);
            }

            return JSON.stringify(respuesta);
        }

        return {
            post: doPost
        };

    });

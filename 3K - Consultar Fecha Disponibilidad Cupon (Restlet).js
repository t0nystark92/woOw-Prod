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

                    var informacion = JSON.parse(requestBody);
                    if (informacion != null && informacion != "") {


                        var fechaIni = informacion.fechaIni;
                        var fechaFin = informacion.fechaFin;

                        if (!utilities.isEmpty(fechaIni) && !utilities.isEmpty(fechaFin)) {

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

                            var objResultSet = utilities.searchSavedPro('customsearch_3k_cupones_log_fech_disp', arraySearchParams);
                            if (objResultSet.error) {
                                return objResultSet;
                            }

                            var resultCupones = objResultSet.objRsponseFunction.array;

                            if (!utilities.isEmpty(resultCupones) && resultCupones.length > 0) {

                                for (var i = 0; i < resultCupones.length; i++) {
                                    var obj = new Object({});
                                    obj.idCupon = resultCupones[i].internalid;
                                    obj.fechaDisp = resultCupones[i]["Nuevo valor"];
                                    obj.fecha = resultCupones[i]["Fecha"];

                                    var filterArray = arrayCupones.filter(function(o) {
                                        return (o.idCupon == obj.idCupon && o.fechaDisp == obj.fechaDisp);
                                    });

                                    if (!utilities.isEmpty(filterArray) && filterArray.length > 0) {
                                        continue;
                                    } else {
                                        arrayCupones.push(obj);
                                    }
                                }

                                respuesta.cupones = arrayCupones;
                            }

                        } else {
                            var mensaje = 'No se recibio la siguiente informacion requerida para realizar la consulta de Fecha de Disponibilidad de Cupones : ';
                            if (utilities.isEmpty(fechaIni)) {
                                mensaje = mensaje + " Fecha Inicio / ";
                            }
                            if (utilities.isEmpty(fechaFin)) {
                                mensaje = mensaje + " Fecha Fin / ";
                            }

                            respuesta.error = true;
                            objetoRespuesta.error = true;
                            objrespuestaParcial = new Object({});
                            objrespuestaParcial.codigo = 'RCFC004';
                            objrespuestaParcial.mensaje = mensaje;
                            respuesta.detalle.push(objrespuestaParcial);
                            log.error('RCFC004', mensaje);

                        }

                    } else {
                        respuesta.error = true;
                        objetoRespuesta.error = true;
                        objrespuestaParcial = new Object({});
                        objrespuestaParcial.codigo = 'RCFC003';
                        objrespuestaParcial.mensaje = 'Error al parsear parametro con informacion a realizar';
                        respuesta.detalle.push(objrespuestaParcial);
                        log.error('RCFC003', 'Error al parsear parametro con informacion a realizar');
                    }

                } else {

                    respuesta.error = true;
                    objrespuestaParcial = new Object({});
                    objrespuestaParcial.codigo = 'RCFC002';
                    objrespuestaParcial.mensaje = 'No se recibio parametro con informacion a realiza';
                    respuesta.detalle.push(objrespuestaParcial);
                    log.error('RCFC002', 'No se recibio parametro con informacion a realiza');
                }

            } catch (e) {
                respuesta.error = true;
                objrespuestaParcial = new Object({});
                objrespuestaParcial.codigo = 'RCFC001';
                objrespuestaParcial.mensaje = 'Excepción: ' + e.message;
                respuesta.detalle.push(objrespuestaParcial);
                log.error('RCFC001', 'Excepción: ' + e.message);
            }

            return JSON.stringify(respuesta);
        }

        return {
            post: doPost
        };

    });

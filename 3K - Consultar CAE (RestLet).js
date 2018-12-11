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

define(['N/error', 'N/record', 'N/search', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function(error, record, search, utilities, funcionalidades) {


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
            respuesta.informacionCAE = [];
            //respuesta.tieneCAE = false;

            try {
                log.audit('Consultar CAE', 'INCIO CONSULTAR CAE');

                if (!utilities.isEmpty(requestBody)) {

                    var body = isJSON(requestBody);
                    if (!body.error) {
                        var informacion = body.json;

                        /*var arrayFacturas = [];
                        for(var j= 0; j<informacion.length; j++){
                            arra
                        }*/

                        var arraySearchParams = [];
                        var objParam = new Object({});
                        objParam.name = 'internalid';
                        objParam.operator = 'ANYOF';
                        objParam.values = informacion.idFacturas;
                        arraySearchParams.push(objParam);

                        var objResultSet = utilities.searchSavedPro('customsearch_3k_consultar_cae', arraySearchParams);
                        if (objResultSet.error) {
                            return objResultSet;
                        }

                        var informacionFacturas = objResultSet.objRsponseFunction.array;

                        for (var i = 0; i < informacion.idFacturas.length; i++) {

                            var facturasFilter = informacionFacturas.filter(function(ob) {
                                return (ob.internalid == informacion.idFacturas[i]);
                            });

                            log.debug('Consultar CAE', 'facturasFilter: '+ JSON.stringify(facturasFilter));

                            var respuestaCAE = new Object({});
                            respuestaCAE.idFacturaNS = facturasFilter[0].internalid;
                            respuestaCAE.tieneCAE = false;
                            respuestaCAE.respuestaDGI = facturasFilter[0].custbody_l598_cae_respuesta_dgi;
                            
                            if (!utilities.isEmpty(facturasFilter[0].custbody_l598_cae)) {

                                respuestaCAE.tieneCAE = true;
                                respuestaCAE.tipoDocumento = facturasFilter[0].Nombre;
                                respuestaCAE.serie = facturasFilter[0].custbody_l598_codigo_serie;
                                respuestaCAE.tipoComprobante = facturasFilter[0].custbody_l598_cod_tipo_comprobante;
                                respuestaCAE.numero = facturasFilter[0].custbody_l598_cae_nro;
                                respuestaCAE.total = facturasFilter[0].fxamount;
                                respuestaCAE.codigoSeguridad = facturasFilter[0].custbody_l598_codigo_seguridad;

                                var objCAE = new Object({});
                                objCAE.fecha = facturasFilter[0].trandate;
                                objCAE.numeroResolucion = facturasFilter[0].custbody_l598_codigo_seguridad;
                                objCAE.numeroAutorizacion = facturasFilter[0].custbody_l598_cae;
                                objCAE.desde = facturasFilter[0].custbody_l598_cae_nro_inicial;
                                objCAE.hasta = facturasFilter[0].custbody_l598_cae_nro_final;
                                objCAE.fechaVencimiento = facturasFilter[0].custbody_l598_cae_vto;

                                respuestaCAE.CAE = objCAE;
                                

                            }

                            respuesta.informacionCAE.push(respuestaCAE);
                        }


                    } else {
                        respuesta.error = true;
                        objrespuestaParcial = new Object({});
                        objrespuestaParcial.codigo = 'RCAE003';
                        objrespuestaParcial.mensaje += 'Excepción: ' + body.excepcion;
                        respuesta.detalle.push(objrespuestaParcial);
                    }

                } else {
                    respuesta.error = true;
                    objrespuestaParcial = new Object({});
                    objrespuestaParcial.codigo = 'RCAE002';
                    objrespuestaParcial.mensaje += 'No se recibió request Body.';
                    respuesta.detalle.push(objrespuestaParcial);
                }

                log.audit('Consultar CAE', 'FIN CONSULTAR CAE');
            } catch (e) {
                respuesta.error = true;
                objrespuestaParcial = new Object({});
                objrespuestaParcial.codigo = 'RCAE001';
                objrespuestaParcial.mensaje += 'Excepción: ' + e;
                respuesta.detalle.push(objrespuestaParcial);
            }

            return JSON.stringify(respuesta);
        }

        function isJSON(body) {
            //var isJSON = true;
            var respuesta = new Object({});

            try {
                respuesta.json = JSON.parse(body);
                //return respuesta;
            } catch (e) {
                //isJSON=false;
                respuesta.error = true;
                respuesta.excepcion = e;

            }

            return respuesta;
        }



        return {

            post: doPost

        };

    });

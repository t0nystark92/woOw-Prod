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

define(['N/error', 'N/record', 'N/search', 'N/task', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function(error, record, search, task, utilities, funcionalidades) {

        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPost(requestBody) {
            var objRespuesta = new Object();
            objRespuesta.idOV = '';
            objRespuesta.idDeposito = '';
            objRespuesta.cupones = new Array();
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();

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
                                break;

                                //Modificar
                            case "M":
                                break;
                            default:
                                objRespuesta.error = true;
                                respuestaParcial = new Object();
                                respuestaParcial.codigo = 'RDEP001';
                                respuestaParcial.mensaje = 'Tipo de Operación no válida.';
                                respuesta.detalle.push(respuestaParcial);
                                log.error('RDEP001', 'Tipo de Operación no válida.');

                                break;
                        }

                    } else {
                        objRespuesta.error = true;
                        respuestaParcial = new Object();
                        respuestaParcial.codigo = 'RDEP002';
                        respuestaParcial.mensaje = 'Variable Operación vacía';
                        respuesta.detalle.push(respuestaParcial);
                        log.error('RDEP002', 'Variable Operación vacía');
                    }

                } else {
                    objRespuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'RDEP003';
                    respuestaParcial.mensaje = 'No se puede parsear objectJSON.';
                    respuesta.detalle.push(respuestaParcial);
                    log.error('RDEP003', 'No se puede parsear objectJSON');
                }

            } else {
                objRespuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'RDEP004';
                respuestaParcial.mensaje = 'No se recibio parametro con informacion a realizar';
                respuesta.detalle.push(respuestaParcial);
                log.error('RDEP004', 'No se recibio parametro con informacion a realizar');
            }

            return JSON.stringify(objRespuesta);

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

                        var respuestaCrearDepositos = funcionalidades.crearDepositos(informacion.carrito,informacion.cliente,informacion.pago);
                        if (respuestaCrearDepositos.error){
                            return JSON.stringify(respuestaCrearDepositos);
                        }

                        respuesta = respuestaCrearDepositos;
                        
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



        return {
            post: doPost
        };

    });

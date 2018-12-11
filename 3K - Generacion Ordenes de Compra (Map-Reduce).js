/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */

/*require.config({
baseUrl: '/SuiteScripts',
paths: {
'3K/utilities' : '/SuiteScripts/3K - Utilities'
}
});*/

define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/format', 'N/runtime'],
    /**
     * @param {record} record
     */
    function(search, record, email, runtime, error, format, runtime) {

        function isEmpty(value) {
            if (value === '') {
                return true;
            }

            if (value === null) {
                return true;
            }

            if (value === undefined) {
                return true;
            }
            return false;
        }

        function enviarEmail(autor, destinatario, titulo, mensaje) {
            log.debug('Generar Ordenes de Compras', 'SUMMARIZE - INICIO ENVIO EMAIL - ID AUTOR : ' + autor + ' - ID DESTINATARIO : ' + destinatario + ' - TITULO : ' + titulo + ' - MENSAJE : ' + mensaje);

            if (!isEmpty(autor) && !isEmpty(destinatario) && !isEmpty(titulo) && !isEmpty(mensaje)) {
                email.send({
                    author: autor,
                    recipients: destinatario,
                    subject: titulo,
                    body: mensaje
                });
            } else {
                var detalleError = 'No se recibio la siguiente informacion necesaria para realizar el envio del Email : ';
                if (isEmpty(autor)) {
                    detalleError = detalleError + ' ID del Autor del Email / ';
                }
                if (isEmpty(destinatario)) {
                    detalleError = detalleError + ' ID del Destinatario del Email / ';
                }
                if (isEmpty(titulo)) {
                    detalleError = detalleError + ' ID del Titulo del Email / ';
                }
                if (isEmpty(mensaje)) {
                    detalleError = detalleError + ' ID del Mensaje del Email / ';
                }
                log.error('Generar Ordenes de Compras', 'SUMMARIZE - Error Envio Email - Error : ' + detalleError);
            }
            log.debug('Generar Ordenes de Compras', 'SUMMARIZE - FIN ENVIO EMAIL');
        }

        function handleErrorAndSendNotification(e, stage) {
            log.error('Estado : ' + stage + ' Error', e);

            var author = runtime.getCurrentUser().id;
            var recipients = runtime.getCurrentUser().id;
            var subject = 'Proceso de Generacion de Ordenes de Compras ' + runtime.getCurrentScript().id + ' Error en Estado : ' + stage;
            var body = 'Ocurrio un error con la siguiente informacion : \n' +
                'Codigo de Error: ' + e.name + '\n' +
                'Mensaje de Error: ' + e.message;

            email.send({
                author: author,
                recipients: recipients,
                subject: subject,
                body: body
            });
        }

        function handleErrorIfAny(summary) {
            var inputSummary = summary.inputSummary;
            var mapSummary = summary.mapSummary;
            var reduceSummary = summary.reduceSummary;

            if (inputSummary.error) {
                var e = error.create({
                    name: 'INPUT_STAGE_FAILED',
                    message: inputSummary.error
                });
                handleErrorAndSendNotification(e, 'getInputData');
            }

            handleErrorInStage('map', mapSummary);
            handleErrorInStage('reduce', reduceSummary);
        }

        function handleErrorInStage(stage, summary) {
            var errorMsg = [];
            summary.errors.iterator().each(function(key, value) {
                var msg = 'Error: ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
                errorMsg.push(msg);
                return true;
            });
            if (errorMsg.length > 0) {
                var e = error.create({
                    name: 'ERROR_CUSTOM',
                    message: JSON.stringify(errorMsg)
                });
                handleErrorAndSendNotification(e, stage);
            }
        }

        function getParams() {
            try {
                var informacion = new Object();
                var currScript = runtime.getCurrentScript();
                var st = JSON.stringify(currScript);
                informacion.idRegistrosProcesar = currScript.getParameter('custscript_generar_oc_id');

                return informacion;
            } catch (excepcion) {
                log.error('Generar Ordenes de Compras', 'INPUT DATA - Excepcion Obteniendo Parametros - Excepcion : ' + excepcion.message.toString());
                return null;
            }
        }

        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         *
         * @typedef {Object} ObjectRef
         * @property {number} id - Internal ID of the record instance
         * @property {string} type - Record type id
         *
         * @return {Array|Object|Search|RecordRef} inputSummary
         * @since 2015.1
         */
        function getInputData() {

            try {

                log.audit('Generar Ordenes de Compras', 'INICIO GET INPUT DATA');

                // INICIO Obtener Parametros
                var informacionProcesar = getParams();
                // FIN Obtener Parametros
                var arrayRegistros = new Array();
                if (!isEmpty(informacionProcesar) && !isEmpty(informacionProcesar.idRegistrosProcesar)) {
                    arrayRegistros = informacionProcesar.idRegistrosProcesar.split(',');
                }

                if (!isEmpty(arrayRegistros) && arrayRegistros.length > 0) {

                    log.debug('Generar Ordenes de Compras', 'INPUT DATA - ID Requisiciones A Procesar : ' + informacionProcesar.idRegistrosProcesar);

                    var arrayRegistros = informacionProcesar.idRegistrosProcesar.split(',');

                    var requisicionesPendientes = search.load({
                        id: 'customsearch_3k_req_compra_pendientes'
                    });

                    var filtroID = search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.ANYOF,
                        values: arrayRegistros
                    });

                    requisicionesPendientes.filters.push(filtroID);

                    log.audit('Generar Ordenes de Compras', 'FIN GET INPUT DATA');
                    return requisicionesPendientes;
                } else {
                    log.error('Generar Ordenes de Compras', 'INPUT DATA - Error Obteniendo ID de Requisiciones A Procesar');
                    log.audit('Generar Ordenes de Compras', 'FIN GET INPUT DATA');
                    return null;
                }

            } catch (excepcion) {
                log.error('Generar Ordenes de Compras', 'INPUT DATA - Excepcion Obteniendo ID de Requisiciones A Procesar - Excepcion : ' + excepcion.message.toString());
                log.audit('Generar Ordenes de Compras', 'FIN GET INPUT DATA');
                return null;
            }

        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {
            /*
             *
             */
            log.audit('Generar Ordenes de Compras', 'INICIO MAP');

            try {

                var searchConfig = search.load({
                    id: 'customsearch_3k_configuracion_ord_trans'
                });

                var resultSearch = searchConfig.run();
                var range = resultSearch.getRange({
                    start: 0,
                    end: 1
                });

                var idConfiguracion = range[0].getValue({ name: 'internalid' });
                var idSubsidiaria = range[0].getValue({ name: 'custrecord_3k_config_ord_transf_sub' });
                var idUbicacionDestino = range[0].getValue({ name: 'custrecord_3k_config_ord_transf_u_dest' });

                if (!isEmpty(idSubsidiaria) && !isEmpty(idUbicacionDestino)) {

                    var resultado = context.value;

                    if (!isEmpty(resultado)) {

                        var resultado = resultado.replace("email.CUSTRECORD_3K_REQ_COMPRA_PROVEEDOR", "emailProveedorPrincipal");
                        var resultado = resultado.replace("custentity_3k_correos_elec_adic.CUSTRECORD_3K_REQ_COMPRA_PROVEEDOR", "emailsProveedorAdicional");

                        var searchResult = JSON.parse(resultado);

                        if (!isEmpty(searchResult)) {

                            var obj = new Object();

                            obj.subsidiaria = idSubsidiaria;
                            obj.ubicacionOrigen = searchResult.values.custrecord_3k_req_compra_ubic_tras.value;

                            obj.ubicacionDestino = idUbicacionDestino;

                            obj.proveedor = searchResult.values.custrecord_3k_req_compra_proveedor.value;
                            obj.moneda = searchResult.values.custrecord_3k_req_compra_moneda.value;
                            obj.articulo = searchResult.values.custrecord_3k_req_compra_articulo.value;
                            obj.cantidad = searchResult.values.custrecord_3k_req_compra_cantidad;
                            obj.precio = searchResult.values.custrecord_3k_req_compra_precio;
                            obj.pila = searchResult.values.custrecord_3k_req_compra_pila.value;
                            obj.ubicacion = searchResult.values.custrecord_3k_req_compra_ubicacion.value;
                            obj.idInternoRequisicion = searchResult.values.internalid.value;
                            obj.idUnico = searchResult.values.formulatext;
                            obj.tipoIngreso = searchResult.values.custrecord_3k_req_compra_tipo_ing.value;
                            obj.sitioWeb = searchResult.values.custrecord_46_cseg_3k_sitio_web_o.value;
                            obj.email = searchResult.values.emailProveedorPrincipal;
                            obj.emailsAdicionales = searchResult.values.emailsProveedorAdicional;
                            obj.fechaOCProv = searchResult.values.custrecord_3k_req_compra_f_entrega;
                            obj.importacion = searchResult.values.custrecord_3k_req_compra_importacion;

                            obj.fechaReparto = searchResult.values.custrecord_3k_req_compra_fecha_reparto;
                            obj.demoraProveedor = searchResult.values.formulanumeric;

                            if (obj.importacion != 'T' || (obj.importacion == 'T' && !isEmpty(obj.ubicacionOrigen))) {


                                var clave = obj.proveedor + '-' + obj.moneda + obj.ubicacion + '-' + obj.importacion;

                                context.write(clave, JSON.stringify(obj));

                            } else {
                                log.error('Generar Ordenes de Compras', 'MAP - Error Obteniendo Resultados de ID de Requisiciones A Procesar');
                            }

                        } else {
                            log.error('Generar Ordenes de Compras', 'MAP - Error Obteniendo Resultados de ID de Requisiciones A Procesar');
                        }

                    } else {
                        log.error('Generar Ordenes de Compras', 'MAP - Error Parseando Resultados de ID de Requisiciones A Procesar');
                    }

                } else {
                    var mensaje = 'MAP - Error Obteniendo Configuracion de Ordenes de Transferencia - No se encuentra configurada la Siguiente Informacion : ';
                    if (isEmpty(idSubsidiaria)) {
                        mensaje = mensaje + ' Subsidiaria A Utilizar en la Orden de Transferencia / ';
                    }
                    if (isEmpty(idUbicacionDestino)) {
                        mensaje = mensaje + ' Ubicacion Destino A Utilizar en la Orden de Transferencia / ';
                    }
                    log.error('Generar Ordenes de Compras', mensaje);
                }

            } catch (excepcion) {
                log.error('Generar Ordenes de Compras', 'MAP - Excepcion Procesando ID de Requisiciones A Procesar - Excepcion : ' + excepcion.message.toString());
            }

            log.audit('Generar Ordenes de Compras', 'FIN MAP');

        }

        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {
            log.audit('Generar Ordenes de Compras', 'INICIO REDUCE - KEY : ' + context.key);
            var fechaEntregaProv = '';

            var idOrdenCompra = null;
            var idOrdenTransferencia = null;

            var idInternosRequisiciones = new Array();
            var articulos = new Array();
            var indiceArticulos = 0;

            var idUnico = 0;
            var idUnicoAnterior = 0;

            var i = 0;

            var registro = "";
            var idProveedor = "";
            var idMoneda = "";
            var idUbicacion = "";
            var tipoIngreso = "";
            var sitioWeb = "";
            var emails = '';

            var importacion = false;
            var subsidiaria = '';
            var ubicacionOrigen = '';
            var ubicacionDestino = '';

            var fechaReparto = '';
            var demoraProveedor = 0;

            var error = false;
            var mensajeError = '';

            if (!isEmpty(context.values) && context.values.length > 0) {
                while (!isEmpty(context.values) && context.values.length > 0 && i < context.values.length && error == false) {
                    registro = JSON.parse(context.values[i]);

                    if (!isEmpty(registro)) {

                        if (i == 0) {
                            idProveedor = registro.proveedor;
                            idMoneda = registro.moneda;
                            idUbicacion = registro.ubicacion;
                            tipoIngreso = registro.tipoIngreso;
                            sitioWeb = registro.sitioWeb;
                            if (!isEmpty(registro.email)) {
                                emails = registro.email;
                            }
                            if (!isEmpty(registro.emailsAdicionales)) {
                                emails = emails + ';' + registro.emailsAdicionales;
                            }
                            if (!isEmpty(registro.fechaOCProv)) {
                                fechaEntregaProv = registro.fechaOCProv;
                            }
                            if (!isEmpty(registro.importacion) && registro.importacion == 'T') {
                                importacion = true;
                            }
                            if (!isEmpty(registro.subsidiaria)) {
                                subsidiaria = registro.subsidiaria;
                            }
                            if (!isEmpty(registro.ubicacionOrigen)) {
                                ubicacionOrigen = registro.ubicacionOrigen;
                            }
                            if (!isEmpty(registro.ubicacionDestino)) {
                                ubicacionDestino = registro.ubicacionDestino;
                            }

                            if (!isEmpty(registro.fechaReparto)) {
                                fechaReparto = registro.fechaReparto;
                            }
                            if (!isEmpty(registro.demoraProveedor)) {
                                demoraProveedor = registro.demoraProveedor;
                            }


                        }

                        idUnico = registro.idUnico;

                        articulos[indiceArticulos] = new Object();
                        articulos[indiceArticulos].idInterno = registro.articulo;
                        articulos[indiceArticulos].precio = registro.precio;
                        articulos[indiceArticulos].pila = registro.pila;
                        articulos[indiceArticulos].cantidad = 0;

                        do {
                            idInternosRequisiciones.push(registro.idInternoRequisicion);

                            articulos[indiceArticulos].cantidad = parseFloat(articulos[indiceArticulos].cantidad, 10) + parseFloat(registro.cantidad, 10);

                            idUnicoAnterior = idUnico;
                            i++;
                            if (i < context.values.length) {
                                registro = JSON.parse(context.values[i]);
                                if (!isEmpty(registro)) {
                                    idUnico = registro.idUnico;
                                } else {
                                    error = true;
                                    mensajeError = "Error No se Recibio Informacion del registro de Requisicion para generar la Orden de Compra";
                                }
                            }
                        } while (i < context.values.length && idUnico == idUnicoAnterior && error == false)

                        indiceArticulos++;

                    } else {
                        error = true;
                        mensajeError = "Error No se Recibio Informacion del registro de Requisicion para generar la Orden de Compra";
                    }
                }

            } else {
                error = true;
                mensajeError = "Error No se Recibio Informacion del registro de Requisicion para generar la Orden de Compras";
            }

            // INICIO - Calcular Fecha de Entrega Proveedor
            var arrayDiasNoLaborables = new Array();
            var respDiasNoLab = consultarDiasNoLoborables();


            if (!isEmpty(respDiasNoLab) && respDiasNoLab.error == false && respDiasNoLab.arrayDiasNoLaborables.length > 0) {
                arrayDiasNoLaborables = respDiasNoLab.arrayDiasNoLaborables;
            } else {
                if (isEmpty(respDiasNoLab)) {
                    log.error('Generar Ordenes de Compras', 'REDUCE - KEY : ' + context.key + ' - Error Obteniendo Calendario de Dias No Laborales - Error : No se Recibio Informacion de la Consulta de Dias No Laborables');
                } else {
                    if (respDiasNoLab.error == true) {
                        log.error('Generar Ordenes de Compras', 'REDUCE - KEY : ' + context.key + ' - Error Obteniendo Calendario de Dias No Laborales - Error : ' + respDiasNoLab.tipoError + ' - Descripcion : ' + respDiasNoLab.mensaje);
                    } else {
                        log.error('Generar Ordenes de Compras', 'REDUCE - KEY : ' + context.key + ' - Error Obteniendo Calendario de Dias No Laborales - Error : No se Recibio Informacion de Array con Dias No Laborables');
                    }
                }
            }

            var objFechaEntrega = calcularFecha(arrayDiasNoLaborables, demoraProveedor);

            if (!isEmpty(objFechaEntrega) && objFechaEntrega.error == false) {
                if (!isEmpty(objFechaEntrega.fechaBaseCalculo)) {
                    fechaEntregaProv = objFechaEntrega.fechaBaseCalculo;
                } else {
                    log.error('Generar Ordenes de Compras', 'REDUCE - KEY : ' + context.key + ' - Error : No se Recibio Informacion de la Fecha de Entrega del Proveedor');
                }
            } else {
                fechaEntregaProv = "";
                if (isEmpty(objFechaEntrega)) {
                    log.error('Generar Ordenes de Compras', 'REDUCE - KEY : ' + context.key + ' - Error : No se recibio objeto de respuesta del proceso de calculo de fecha de entrega');
                } else {
                    log.error('Generar Ordenes de Compras', 'REDUCE - KEY : ' + context.key + ' - Error calculando fecha de entrega  - Tipo Error : ' + objFechaEntrega.tipoError + ' - Descripcion : ' + objFechaEntrega.descripcion);
                }

            }
            // FIN - Calcular Fecha de Entrega Proveedor

            if (importacion != true) {

                // INICIO GENERAR ORDEN DE COMPRAS
                var registroOC = record.create({
                    type: 'purchaseorder',
                    isDynamic: true
                });

                registroOC.setValue({
                    fieldId: 'entity',
                    value: idProveedor
                });

                registroOC.setValue({
                    fieldId: 'currency',
                    value: idMoneda
                });

                if (!isEmpty(idUbicacion)) {
                    registroOC.setValue({
                        fieldId: 'location',
                        value: idUbicacion
                    });
                }

                if (!isEmpty(tipoIngreso)) {
                    registroOC.setValue({
                        fieldId: 'custbody_3k_tipo_ingreso',
                        value: tipoIngreso
                    });
                }

                if (!isEmpty(sitioWeb)) {
                    registroOC.setValue({
                        fieldId: 'custbody_cseg_3k_sitio_web_o',
                        value: sitioWeb
                    });
                }

                if (!isEmpty(fechaEntregaProv)) {
                    var fechaEntregaProvDate = format.parse({
                        value: fechaEntregaProv,
                        type: format.Type.DATE,
                    });
                    registroOC.setValue({
                        fieldId: 'custbody_3k_fecha_entrega_prov',
                        value: fechaEntregaProvDate
                    });
                }

                var currScript = runtime.getCurrentScript();
                var enviarEmailProv = currScript.getParameter('custscript_generar_oc_email');
                if (!isEmpty(enviarEmailProv) && enviarEmailProv == 'T') {
                    /*var emailProveedor = search.lookupFields({
                                type: 'vendor',
                                id: idProveedor,
                                columns: ['email']
                            });*/
                    /*var emailProveedor = registroOC.getValue({
                        fieldId: 'email',
                    });
                    if (!isEmpty(emailProveedor)) {
                        registroOC.setValue({
                            fieldId: 'tobeemailed',
                            value: true
                        });
                    }*/
                    if (!isEmpty(emails)) {
                        registroOC.setValue({
                            fieldId: 'tobeemailed',
                            value: true
                        });
                        registroOC.setValue({
                            fieldId: 'email',
                            value: emails
                        });
                    }
                }

                // INICIO RECORRER Y AGREGAR ITEMS
                if (!isEmpty(articulos) && articulos.length > 0) {

                    for (var j = 0; !isEmpty(articulos) && j < articulos.length; j++) {

                        registroOC.selectNewLine({
                            sublistId: 'item'
                        });

                        registroOC.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: articulos[j].idInterno
                        });

                        registroOC.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: articulos[j].cantidad
                        });

                        registroOC.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: articulos[j].precio
                        });

                        if (!isEmpty(articulos[j].pila)) {
                            registroOC.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_pila_stock',
                                value: articulos[j].pila
                            });
                        }

                        registroOC.commitLine({
                            sublistId: 'item'
                        });

                    }

                } else {
                    error = true;
                    mensajeError = "Error No se Recibio Informacion de los Articulos A Incluir en la Orden de Compra";
                    log.error('Generar Ordenes de Compras', mensajeError);
                }
                // FIN RECORRER Y AGREGAR ITEMS

                try {
                    idOrdenCompra = registroOC.save();
                } catch (excepcionOC) {
                    error = true;
                    mensajeError = 'Excepcion Generando Orden de Compra - Excepcion : ' + excepcionOC.message.toString();
                    log.error('Generar Ordenes de Compras', mensajeError);
                }

            } else {
                // INICIO GENERAR ORDEN DE TRANSFERENCIAS
                var registroOT = record.create({
                    type: 'transferorder',
                    isDynamic: true
                });

                registroOT.setValue({
                    fieldId: 'subsidiary',
                    value: subsidiaria
                });

                /*registroOT.setValue({
                    fieldId: 'tosubsidiary',
                    value: 2
                });*/


                registroOT.setValue({
                    fieldId: 'location',
                    value: ubicacionOrigen
                });

                registroOT.setValue({
                    fieldId: 'transferlocation',
                    value: ubicacionDestino
                });

                if (!isEmpty(sitioWeb)) {
                    registroOT.setValue({
                        fieldId: 'custbody_cseg_3k_sitio_web_o',
                        value: sitioWeb
                    });
                }


                // INICIO RECORRER Y AGREGAR ITEMS
                if (!isEmpty(articulos) && articulos.length > 0) {

                    for (var j = 0; !isEmpty(articulos) && j < articulos.length; j++) {

                        registroOT.selectNewLine({
                            sublistId: 'item'
                        });

                        registroOT.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: articulos[j].idInterno
                        });

                        registroOT.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: articulos[j].cantidad
                        });

                        registroOT.commitLine({
                            sublistId: 'item'
                        });

                    }

                } else {
                    error = true;
                    mensajeError = "Error No se Recibio Informacion de los Articulos A Incluir en la Orden de Transferencia";
                    log.error('Generar Ordenes de Compras', mensajeError);
                }
                // FIN RECORRER Y AGREGAR ITEMS

                try {
                    idOrdenTransferencia = registroOT.save();
                } catch (excepcionOT) {
                    error = true;
                    mensajeError = 'Excepcion Generando Orden de Transferencia - Excepcion : ' + excepcionOT.message.toString();
                    log.error('Generar Ordenes de Compras', mensajeError);
                }

            }


            if (error == false) {
                if (!isEmpty(idOrdenCompra) || !isEmpty(idOrdenTransferencia)) {
                    // INICIO ACTUALIZAR REQUISICIONES
                    if (!isEmpty(idInternosRequisiciones) && idInternosRequisiciones.length > 0) {
                        for (var k = 0; !isEmpty(idInternosRequisiciones) && k < idInternosRequisiciones.length && error == false; k++) {
                            try {
                                var idRequisicion = '';
                                if (!isEmpty(idOrdenCompra)) {
                                    var idRequisicion = record.submitFields({
                                        type: 'customrecord_3k_req_compra',
                                        id: idInternosRequisiciones[k],
                                        values: {
                                            custrecord_3k_req_compra_oc: idOrdenCompra
                                        },
                                        options: {
                                            enableSourcing: true,
                                            ignoreMandatoryFields: false
                                        }
                                    });
                                } else {
                                    if (!isEmpty(idOrdenTransferencia)) {
                                        var idRequisicion = record.submitFields({
                                            type: 'customrecord_3k_req_compra',
                                            id: idInternosRequisiciones[k],
                                            values: {
                                                custrecord_3k_req_compra_ot: idOrdenTransferencia
                                            },
                                            options: {
                                                enableSourcing: true,
                                                ignoreMandatoryFields: false
                                            }
                                        });
                                    }
                                }
                                if (isEmpty(idRequisicion)) {
                                    error = true;
                                    mensajeError = 'Error Actualizando Requisiciones - No se recibio el ID de la Requisicion Actualizada';
                                }
                            } catch (excepcionREQ) {
                                error = true;
                                mensajeError = 'Excepcion Actualizando Requisiciones - Excepcion : ' + excepcionREQ.message.toString();
                            }
                        }
                        // FIN ACTUALIZAR REQUISICIONES
                    } else {
                        error = true;
                        mensajeError = "Error No se Recibio ID Interno de las Requisiciones A Actualizar";
                    }
                } else {
                    error = true;
                    mensajeError = 'Error Actualizando Requisiciones - No se recibio el ID de Orden de Compra / Transferencia Generada';
                }
            }

            // FIN GENERAR ORDEN DE COMPRAS

            var respuesta = new Object();
            respuesta.idOrdenTransferencia = idOrdenTransferencia;
            respuesta.idOrdenCompra = idOrdenCompra;
            respuesta.idRequisiciones = idInternosRequisiciones;
            respuesta.error = false;
            respuesta.mensaje = "";

            if (error == true) {
                log.error('Generar Ordenes de Compras', 'REDUCE - ' + error.mensajeError);
                respuesta.error = true;
                respuesta.mensaje = error.mensajeError;
            } else {
                if (!isEmpty(idOrdenCompra)) {
                    respuesta.mensaje = 'La Orden de Compra con ID Interno : ' + idOrdenCompra + ' Se genero correctamente';
                } else {
                    if (!isEmpty(idOrdenTransferencia)) {
                        respuesta.mensaje = 'La Orden de Transferencia con ID Interno : ' + idOrdenTransferencia + ' Se genero correctamente';
                    }
                }
            }

            if (!isEmpty(idOrdenCompra)) {
                log.audit('Generar Ordenes de Compras', 'FIN REDUCE - KEY : ' + context.key + ' ID ORDEN DE COMPRAS GENERADA : ' + idOrdenCompra);
            } else {
                log.audit('Generar Ordenes de Compras', 'FIN REDUCE - KEY : ' + context.key + ' ID ORDEN DE TRANSFERENCIA GENERADA : ' + idOrdenTransferencia);
            }

            context.write(context.key, respuesta);
        }

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {

            var errorGeneral = false;
            var mensajeErrorGeneral = 'El Proceso de Generacion de Ordenes de Compras Finalizo con errores';
            var mensajeOKGeneral = 'El Proceso de Generacion de Ordenes de Compras Finalizo Correctamente';
            var error = false;
            var mensajeError = '';
            var idLog = null;
            log.audit('Generar Ordenes de Compras', 'INICIO SUMMARIZE');

            try {

                // INICIO OBTENER CONFIGURACION DE ORDENES DE COMPRAS
                var errorConfiguracionOC = false;
                var dominio = '';
                var idRTLog = '';
                var idEstadoFinalizado = '';
                var idEstadoError = '';
                var idEstadoCorrecto = '';

                var mySearch = search.load({
                    id: 'customsearch_3k_configuracion_ord_compra'
                });

                var resultSet = mySearch.run();
                var searchResult = resultSet.getRange({
                    start: 0,
                    end: 1
                });

                if (!isEmpty(searchResult) && searchResult.length > 0) {
                    dominio = searchResult[0].getText({
                        name: resultSet.columns[1]
                    });
                    idRTLog = searchResult[0].getValue({
                        name: resultSet.columns[2]
                    });
                    idEstadoFinalizado = searchResult[0].getValue({
                        name: resultSet.columns[3]
                    });
                    idEstadoError = searchResult[0].getValue({
                        name: resultSet.columns[4]
                    });
                    idEstadoCorrecto = searchResult[0].getValue({
                        name: resultSet.columns[5]
                    });

                } else {
                    errorConfiguracionOC = true;
                    log.error('Generar Ordenes de Compras', 'SUMMARIZE - ' + 'No se encuentra realizada la configuracion de las Ordenes de Compras');
                }
                // FIN OBTENER CONFIGURACION DE ORDENES DE COMPRAS

                var fechaServidor = new Date();

                var fechaLocalString = format.format({
                    value: fechaServidor,
                    type: format.Type.DATETIME,
                    timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                });

                var fechaLocal = format.parse({
                    value: fechaLocalString,
                    type: format.Type.DATETIME,
                    timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                });


                // INICIO Generar Cabecera Log
                var registroLOG = record.create({
                    type: 'customrecord_3k_gen_oc_log'
                });

                registroLOG.setValue({
                    fieldId: 'custrecord_3k_gen_oc_log_fecha',
                    value: fechaLocal
                });
                if (!isEmpty(idEstadoFinalizado)) {
                    registroLOG.setValue({
                        fieldId: 'custrecord_3k_gen_oc_log_est',
                        value: idEstadoFinalizado
                    });
                }

                try {
                    idLog = registroLOG.save();
                    if (isEmpty(idLog)) {
                        error = true;
                        mensajeError = 'No se recibio el ID del LOG de Ordenes de Compras Generado';
                    }
                } catch (excepcionLOG) {
                    error = true;
                    mensajeError = 'Excepcion Grabando LOG de Proceso de Generacion de Ordenes de Compras - Excepcion : ' + excepcionLOG.message.toString();
                }
                // FIN Generar Cabecera Log
                // INICIO Generar Detalle Log
                if (error == false) {
                    summary.output.iterator().each(function(key, value) {
                        if (error == false) {
                            if (!isEmpty(value)) {
                                var registro = JSON.parse(value);
                                if (!isEmpty(registro)) {
                                    var idEstado = idEstadoCorrecto;
                                    if (registro.error == true) {
                                        errorGeneral = true;
                                        idEstado = idEstadoError;
                                    }
                                    var registroDLOG = record.create({
                                        type: 'customrecord_3k_gen_oc_logdet'
                                    });

                                    registroDLOG.setValue({
                                        fieldId: 'custrecord_3k_gen_oc_logdet_fecha',
                                        value: fechaLocal
                                    });
                                    if (!isEmpty(idEstado)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_oc_logdet_est',
                                            value: idEstado
                                        });
                                    }
                                    if (!isEmpty(registro.mensaje)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_oc_logdet_desc',
                                            value: registro.mensaje
                                        });
                                    }
                                    if (!isEmpty(registro.idRequisiciones) && registro.idRequisiciones.length > 0) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_oc_logdet_req',
                                            value: registro.idRequisiciones
                                        });
                                    }
                                    if (!isEmpty(registro.idOrdenCompra)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_oc_logdet_oc',
                                            value: registro.idOrdenCompra
                                        });
                                    }
                                    if (!isEmpty(registro.idOrdenTransferencia)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_oc_logdet_ot',
                                            value: registro.idOrdenTransferencia
                                        });
                                    }
                                    if (!isEmpty(idLog)) {
                                        registroDLOG.setValue({
                                            fieldId: 'custrecord_3k_gen_oc_logdet_log',
                                            value: idLog
                                        });
                                    }
                                    try {
                                        idDLog = registroDLOG.save();
                                        if (isEmpty(idDLog)) {
                                            error = true;
                                            mensajeError = 'No se recibio el ID del Detalle de LOG de Ordenes de Compras Generado';
                                        }
                                    } catch (excepcionDLOG) {
                                        error = true;
                                        mensajeError = 'Excepcion Grabando el Detalle de LOG de Proceso de Generacion de Ordenes de Compras - Excepcion : ' + excepcionDLOG.message.toString();
                                    }
                                } else {
                                    error = true;
                                    mensajeError = 'Error Parseando Informacion de Ordenes de Compras Generadas';
                                }
                            } else {
                                error = true;
                                mensajeError = 'Error Obteniendo Informacion de Ordenes de Compras Generadas';
                            }
                        }
                        return true;
                    });
                }
                // FIN Generar Detalle Log

            } catch (excepcion) {

                error = true;
                mensajeError = 'Excepcion Generando LOG de Proceso de Generacion de Ordenes de Compras - Excepcion : ' + excepcion.message.toString();
            }

            if (error == true) {
                errorGeneral = true;
                log.error('Generar Ordenes de Compras', 'SUMMARIZE - ' + mensajeError);
            }
            // INICIO Enviar Email Log
            var autor = runtime.getCurrentUser().id;
            var destinatario = autor;
            var mensajeMail = mensajeOKGeneral;
            if (errorGeneral == true) {
                var mensajeMail = mensajeErrorGeneral;
            }
            var link = '';

            if (!isEmpty(idLog) && !isEmpty(dominio) && !isEmpty(idRTLog)) {
                link = 'Puede Observar el Detalle del procesamiento desde el Siguiente link <br> <a href="' + dominio + '/app/common/custom/custrecordentry.nl?rectype=' + idRTLog + '&id=' + idLog + '"> Informacion Proceso </a>'
            } else {
                if (errorConfiguracionOC == false) {
                    var informacionFaltante = 'No se pudo generar el Link de Acceso al LOG de la Generacion de las Ordenes de Compras debido a que falta la siguiente informacion : ';
                    if (isEmpty(idLog)) {
                        informacionFaltante = informacionFaltante + ' ID del Registro de LOG Generado / ';
                    }
                    if (isEmpty(dominio)) {
                        informacionFaltante = informacionFaltante + ' Configuracion del Dominio de NetSuite en el Panel de Configuracion de Ordenes de Compras / ';
                    }
                    if (isEmpty(idRTLog)) {
                        informacionFaltante = informacionFaltante + ' Configuracion del ID del RecordType de LOG en el Panel de Configuracion de Ordenes de Compras / ';
                    }
                    log.error('Generar Ordenes de Compras', 'SUMMARIZE - ' + informacionFaltante);
                }
            }

            var titulo = 'Proceso Generacion de Ordenes de Compras';

            var mensaje = '<html><head></head><body><br>' + mensajeMail + '<br>' + link + '</body></html>';

            enviarEmail(autor, destinatario, titulo, mensaje);
            // FIN Enviar Email Log

            log.audit('Generar Ordenes de Compras', 'FIN SUMMARIZE');

            handleErrorIfAny(summary);
        }

        function calcularFecha(arrayDiasNoLaborales, demoraProveedor) {

            log.audit('Calcular Fecha Entrega', 'INICIO Proceso');

            var objRespuesta = new Object();
            objRespuesta.fechaBaseCalculo = '';
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();

            try {

                var fechaServidor = new Date();

                var fechaString = format.format({
                    value: fechaServidor,
                    type: format.Type.DATE,
                    timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                });

                var fechaActual = format.parse({
                    value: fechaString,
                    type: format.Type.DATE
                });

                var fechaBaseCalculo = fechaActual;

                var diasTotales = 0;
                for (var b = 1; b <= parseInt(demoraProveedor); b++) {
                    var fechaRecorrida = new Date(fechaBaseCalculo.getTime());

                    fechaRecorrida.setDate(fechaBaseCalculo.getDate() + (diasTotales + 1));

                    var resultFilter = arrayDiasNoLaborales.filter(function(obj) {
                        return (obj.fecha.getTime() == fechaRecorrida.getTime());
                    });

                    if (!isEmpty(resultFilter) && resultFilter.length > 0) {
                        b--;

                    }

                    diasTotales++;
                }

                fechaBaseCalculo.setDate(fechaBaseCalculo.getDate() + parseInt(diasTotales, 10));

                objRespuesta.fechaBaseCalculo = fechaBaseCalculo;

            } catch (e) {
                objRespuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'CALC001';
                objRespuestaParcial.mensaje = 'function calcularFecha: ' + e.message;
                objRespuesta.detalle.push(objRespuestaParcial);
                log.error('CALC001', 'function calcularFecha: ' + e.message);
            }

            log.audit('Calcular Fecha Entrega', 'FIN Proceso');

            return objRespuesta;
        }

        function consultarDiasNoLoborables() {
            var respuesta = new Object();
            respuesta.error = false;
            //respuesta.tipoError = '';
            //respuesta.mensaje = '';
            respuesta.arrayDiasNoLaborables = new Array();
            respuesta.detalle = new Array();

            // INICIO - Obtener Array de Dias No Laborable
            var objResultSet = searchSaved('customsearch_3k_calendario_dias_no_lab');
            if (objResultSet.error) {
                respuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'SROV018';
                objRespuestaParcial.mensaje = 'Error Obteniendo Calendario de Dias No Laborables - Tipo Error : ' + objResultSet.tipoError + ' - Descripcion : ' + objResultSet.descripcion;;
                respuesta.detalle.push(objRespuestaParcial);
                //respuesta.tipoError = 'SROV018';
                //respuesta.mensaje = 'Error Obteniendo Calendario de Dias No Laborables - Tipo Error : ' + objResultSet.tipoError + ' - Descripcion : ' + objResultSet.descripcion;;
                return respuesta;
            }

            var resultSet = objResultSet.objRsponseFunction.result;
            var resultSearch = objResultSet.objRsponseFunction.search;

            for (var l = 0; !isEmpty(resultSet) && l < resultSet.length; l++) {

                var obj = new Object();
                obj.indice = l;
                obj.idInterno = resultSet[l].getValue({
                    name: resultSearch.columns[0]
                });
                obj.nombre = resultSet[l].getValue({
                    name: resultSearch.columns[1]
                });
                obj.fecha = resultSet[l].getValue({
                    name: resultSearch.columns[2]
                });

                if (!isEmpty(obj.fecha)) {
                    obj.fecha = format.parse({
                        value: obj.fecha,
                        type: format.Type.DATE,
                    });
                }

                respuesta.arrayDiasNoLaborables.push(obj);
            }

            return respuesta;

            // FIN - Obtener Array de Dias No Laborables
        }

        function searchSaved(idSavedSearch, objParams) {
            var objRespuesta = new Object();
            objRespuesta.error = false;
            try {
                var savedSearch = search.load({
                    id: idSavedSearch
                });


                if (!isEmpty(objParams)) {
                    var operator;
                    var name = objParams.name;
                    var param = new Array();
                    param = objParams.values;


                    operator = operadorBusqueda(objParams.operator);


                    var filtroID = search.createFilter({
                        name: name,
                        operator: operator,
                        values: param
                    });
                    savedSearch.filters.push(filtroID);

                }


                var resultSearch = savedSearch.run();
                var completeResultSet = [];
                var resultIndex = 0;
                var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
                var resultado; // temporary variable used to store the result set
                //log.audit('searchSaved', 'resultSearch typeof: '+typeof(resultSearch));

                do {
                    // fetch one result set
                    resultado = resultSearch.getRange({
                        start: resultIndex,
                        end: resultIndex + resultStep
                    });
                    //log.audit('searchSaved', 'resultSearch: '+resultado.length);
                    if (!isEmpty(resultado) && resultado.length > 0) {
                        if (resultIndex == 0)
                            completeResultSet = resultado;
                        else
                            completeResultSet = completeResultSet.concat(resultado);
                    }

                    // increase pointer
                    resultIndex = resultIndex + resultStep;

                } while (!isEmpty(resultado) && resultado.length > 0)

                objRsponseFunction = new Object();
                objRsponseFunction.result = completeResultSet;
                objRsponseFunction.search = resultSearch;

                objRespuesta.objRsponseFunction = objRsponseFunction;
                //return objRsponseFunction;
            } catch (e) {
                objRespuesta.error = true;
                objRespuesta.tipoError = 'RORV007';
                objRespuesta.descripcion = 'function searchSaved: ' + e.message;
                log.error('RORV007', 'funtion searchSaved: ' + e.message);
            }
            return objRespuesta;
        }


        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });
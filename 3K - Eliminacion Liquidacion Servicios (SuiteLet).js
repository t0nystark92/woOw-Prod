/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/

define(['N/ui/serverWidget', 'N/https', 'N/record', 'N/error', 'N/search', 'N/format', 'N/task', '3K/utilities'],

    function(serverWidget, https, record, error, search, format, task, utilities) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            log.audit('Eliminacion Liquidaciones Servicios REST', 'INICIO Proceso - Metodo : ' + context.request.method + ' Liquidacion : ' + context.request.parameters.liquidacion);

            try {

                var form = serverWidget.createForm({
                    title: 'Eliminacion de Liquidaciones de Servicios'
                });

                //form.clientScriptFileId = 6026;
                form.clientScriptModulePath = './3K - Eliminacion Liquidacion Servicios (Cliente).js'

                var grupoFiltros = form.addFieldGroup({
                    id: 'filtros',
                    label: 'Criterios de Busqueda de Liquidacion A Eliminar'
                });

                var grupoDatos = form.addFieldGroup({
                    id: 'inforequisiciones',
                    label: 'Informacion Cupones Asociados A Liquidacion'
                });

                var tabDetalle = form.addTab({
                    id: 'tabdetalle',
                    label: 'Detalle'
                });

                var subTabCupones = form.addSubtab({
                    id: 'tabcupones',
                    label: 'Cupones Asociados A Liquidacion',
                    tab: 'tabdetalle'
                });

                var subTabAjustes = form.addSubtab({
                    id: 'tabajustes',
                    label: 'Ajustes Asociados A Liquidacion',
                    tab: 'tabdetalle'
                });

                // INICIO CAMPOS
                var btnAccion = form.addField({
                    id: 'custpage_accion',
                    label: 'Accion:',
                    type: serverWidget.FieldType.TEXT,
                    container: 'filtros'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                // FIN CAMPOS

                // INICIO FILTROS
                var liquidacion = form.addField({
                    id: 'liquidacion',
                    label: 'Liquidacion',
                    type: serverWidget.FieldType.SELECT,
                    source: 'customrecord_3k_liquidacion_emp',
                    container: 'filtros'
                });

                if (!utilities.isEmpty(context.request.parameters.liquidacion)) {
                    liquidacion.defaultValue = context.request.parameters.liquidacion;
                }

                // FIN FILTROS

                // INICIO SUBLISTA
                var sublistCupones = form.addSublist({
                    id: 'cupones',
                    type: serverWidget.SublistType.LIST,
                    label: 'Cupones Asociados A Liquidacion',
                    tab: 'tabcupones'
                });

                /*sublistCupones.addField({
                    id: 'procesar',
                    label: 'Procesar',
                    type: serverWidget.FieldType.CHECKBOX
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });*/

                sublistCupones.addField({
                    id: 'fecha',
                    label: 'Fecha',
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'empresa',
                    label: 'Empresa',
                    type: serverWidget.FieldType.SELECT,
                    source: 'vendor'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'cupon',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Cupon',
                    source: 'customrecord_3k_cupones'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'moneda',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Moneda',
                    source: 'currency'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'tipocambio',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Tipo de Cambio'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'importecupon',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Importe Cupon'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'porcentajefacturar',
                    type: serverWidget.FieldType.PERCENT,
                    label: 'Porcentaje Facturacion'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'importefacturar',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Importe Facturar'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'porcentajeliquidar',
                    type: serverWidget.FieldType.PERCENT,
                    label: 'Porcentaje Liquidacion'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'importeliquidar',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Importe Liquidar'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'sitio',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Sitio Web',
                    source: 'customrecord_cseg_3k_sitio_web_o'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistCupones.addField({
                    id: 'idinternos',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ID Internos'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                //sublistCupones.addMarkAllButtons();
                // FIN SUBLISTA

                var sublistAjustes = form.addSublist({
                    id: 'ajustes',
                    type: serverWidget.SublistType.LIST,
                    label: 'Ajustes Asociados A Liquidacion',
                    tab: 'tabajustes'
                });

                /*sublistAjustes.addField({
                    id: 'procesar',
                    label: 'Procesar',
                    type: serverWidget.FieldType.CHECKBOX
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });*/

                sublistAjustes.addField({
                    id: 'fecha',
                    label: 'Fecha',
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistAjustes.addField({
                    id: 'empresa',
                    label: 'Empresa',
                    type: serverWidget.FieldType.SELECT,
                    source: 'vendor'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistAjustes.addField({
                    id: 'cupon',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Cupon',
                    source: 'customrecord_3k_cupones'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistAjustes.addField({
                    id: 'moneda',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Moneda',
                    source: 'currency'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistAjustes.addField({
                    id: 'tipocambio',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Tipo de Cambio'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistAjustes.addField({
                    id: 'importecupon',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Importe Cupon'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistAjustes.addField({
                    id: 'importefacturar',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Importe Facturar'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistAjustes.addField({
                    id: 'importeliquidar',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Importe Liquidar'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistAjustes.addField({
                    id: 'sitio',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Sitio Web',
                    source: 'customrecord_cseg_3k_sitio_web_o'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublistAjustes.addField({
                    id: 'idinternos',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'ID Internos'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                //sublistAjustes.addMarkAllButtons();

                form.addSubmitButton({
                    label: 'Buscar Informacion Liquidacion'
                });

                form.addButton({
                    id: 'custpage_btgenliq',
                    label: 'Eliminar Liquidacion Servicios',
                    functionName: "eliminarLiquidacion"
                });

                var infoResultado = form.addField({
                    id: 'custpage_resultado',
                    label: 'Resultados',
                    type: serverWidget.FieldType.INLINEHTML
                });

                if (context.request.method === 'GET') {
                    log.audit('Eliminacion Liquidaciones Servicios REST', 'FIN Proceso');
                    context.response.writePage(form);
                } else {
                    var sAccion = utilities.isEmpty(context.request.parameters.custpage_accion) ? context.request.parameters.submitter : context.request.parameters.custpage_accion;

                    switch (sAccion) {
                        case 'ELIMINARLIQ':
                            var mensaje = "La Anulacion de la Liquidacion se realizo de forma correcta";
                            var resultado = eliminarLiquidaciones(sublistCupones, sublistAjustes, context.request);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                mensaje = resultado.mensaje;
                                log.error('Eliminacion Liquidaciones Servicios REST', 'Error Eliminacion Liquidacion - Error : ' + mensaje);
                            }
                            infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            log.audit('Eliminacion Liquidaciones Servicios REST', 'FIN Proceso');
                            context.response.writePage(form);
                            break;
                        case 'Buscar Informacion Liquidacion':
                            var resultado = cargarLiquidaciones(sublistCupones, sublistAjustes, context.request);
                            if (!utilities.isEmpty(resultado) && resultado.error == true) {
                                var mensaje = resultado.mensaje;
                                log.error('Eliminacion Liquidaciones Servicios REST', 'Error Consulta Informacion de Liquidacion - Error : ' + mensaje);
                                infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                            }
                            log.audit('Eliminacion Liquidaciones Servicios REST', 'FIN Proceso');
                            context.response.writePage(form);
                            break;
                    }
                }
            } catch (excepcion) {
                log.error('Eliminacion Liquidaciones Servicios REST', 'Excepcion Proceso Generacion de Liquidaciones de Servicios - Excepcion : ' + excepcion.message);
            }
        }

        function eliminarLiquidaciones(sublistCupones, sublistAjustes, request) {
            log.audit('Eliminacion Liquidaciones Servicios REST', 'INICIO Consulta Liquidaciones A Procesar');

            var idCuponesProcesar = new Array();
            var idAjustesProcesar = new Array();
            var existenLiquidacionesSeleccionadas = false;
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";
            respuesta.estado = "";

            try {
                if (!utilities.isEmpty(request.parameters.cuponesdata) || !utilities.isEmpty(request.parameters.ajustesdata)) {
                    var delimiterCampos = /\u0001/;
                    var delimiterArray = /\u0002/;

                    var idRegistroLiquidacion = '';
                    if (!utilities.isEmpty(request.parameters.liquidacion)) {
                        idRegistroLiquidacion = request.parameters.liquidacion;
                    }

                    if (!utilities.isEmpty(idRegistroLiquidacion)) {

                        if (!utilities.isEmpty(request.parameters.cuponesdata)) {

                            var sublistaCupones = request.parameters.cuponesdata.split(delimiterArray);

                            if (!utilities.isEmpty(sublistaCupones) && sublistaCupones.length > 0) {

                                for (var i = 0; respuesta.error == false && i < sublistaCupones.length; i++) {
                                    if (!utilities.isEmpty(sublistaCupones[i])) {

                                        var columnas = sublistaCupones[i].split(delimiterCampos);

                                        if (!utilities.isEmpty(sublistaCupones) && sublistaCupones.length > 0) {
                                            //var procesar = columnas[0];

                                            //if (procesar == 'T') { //solo si est� marcado para enviar
                                            existenLiquidacionesSeleccionadas = true;

                                            var idInternoCupones = columnas[13];

                                            if (!utilities.isEmpty(idInternoCupones)) {

                                                try {
                                                    var idRecord = record.submitFields({
                                                        type: 'customrecord_3k_cupones',
                                                        id: idInternoCupones,
                                                        values: {
                                                            custrecord_3k_cupon_liquidado: false,
                                                            custrecord_3k_cupon_reg_liquidacion: null
                                                        },
                                                        options: {
                                                            enableSourcing: true,
                                                            ignoreMandatoryFields: false
                                                        }
                                                    });

                                                    if (utilities.isEmpty(idRecord)) {
                                                        respuesta.error = true;
                                                        var mensaje = 'Error Desvinculando Cupon con ID Interno : ' + idInternoCupones + ' - Error : No se recibio ID del Registro de Cupon desvinculado';
                                                        log.error('Eliminacion Liquidaciones', mensaje);
                                                        respuesta.mensaje = mensaje;
                                                    }
                                                } catch (excepcionDesvinculacion) {
                                                    respuesta.error = true;
                                                    var mensaje = 'Excepcion en Proceso de Desvinculacion de Cupon con ID Interno : ' + idInternoCupones + ' - Excepcion : ' + excepcionDesvinculacion.message;
                                                    log.error('Eliminacion Liquidaciones', mensaje);
                                                    respuesta.mensaje = mensaje;
                                                }
                                            } else {
                                                //Error Obteniendo ID Interno de la Liquidacion a procesar
                                                respuesta.error = true;
                                                respuesta.mensaje = "No se pudo Obtener el ID Interno de los Cupones a procesar";
                                            }
                                            //}
                                        } else {
                                            //Error Obteniendo Columnas de Sublista
                                            respuesta.error = true;
                                            respuesta.mensaje = "No se pudo Obtener las columnas de la sublista de Cupones a procesar";
                                        }
                                    } else {
                                        //Error Obteniendo Contenido de Sublista
                                        respuesta.error = true;
                                        respuesta.mensaje = "No se pudo Obtener el contenido de la sublista de Cupones a procesar";
                                    }

                                }

                            } else {
                                respuesta.error = true;
                                respuesta.mensaje = "No se pudo obtener registros de la sublista de Cupones a procesar";
                            }
                        }

                        if (!utilities.isEmpty(request.parameters.ajustesdata) && respuesta.error == false) {

                            var sublistaAjustes = request.parameters.ajustesdata.split(delimiterArray);

                            if (!utilities.isEmpty(sublistaAjustes) && sublistaAjustes.length > 0) {

                                for (var i = 0; respuesta.error == false && i < sublistaAjustes.length; i++) {
                                    if (!utilities.isEmpty(sublistaAjustes[i])) {

                                        var columnas = sublistaAjustes[i].split(delimiterCampos);

                                        if (!utilities.isEmpty(sublistaAjustes) && sublistaAjustes.length > 0) {
                                            //var procesar = columnas[0];

                                            //if (procesar == 'T') { //solo si est� marcado para enviar
                                            existenLiquidacionesSeleccionadas = true;

                                            var idInternoAjustes = columnas[11];

                                            if (!utilities.isEmpty(idInternoAjustes)) {

                                                try {
                                                    var idRecord = record.submitFields({
                                                        type: 'customrecord_3k_ajustes_liq_emp',
                                                        id: idInternoAjustes,
                                                        values: {
                                                            custrecord_3k_ajustes_liq_emp_liq: false,
                                                            custrecord_3k_ajustes_liq_emp_reg_liq: null
                                                        },
                                                        options: {
                                                            enableSourcing: true,
                                                            ignoreMandatoryFields: false
                                                        }
                                                    });

                                                    if (utilities.isEmpty(idRecord)) {
                                                        respuesta.error = true;
                                                        var mensaje = 'Error Desvinculando Ajuste con ID Interno : ' + idInternoAjustes + ' - Error : No se recibio ID del Registro del Ajuste desvinculado';
                                                        log.error('Eliminacion Liquidaciones', mensaje);
                                                        respuesta.mensaje = mensaje;
                                                    }
                                                } catch (excepcionDesvinculacion) {
                                                    respuesta.error = true;
                                                    var mensaje = 'Excepcion en Proceso de Desvinculacion de Ajuste con ID Interno : ' + idInternoAjustes + ' - Excepcion : ' + excepcionDesvinculacion.message;
                                                    log.error('Eliminacion Liquidaciones', mensaje);
                                                    respuesta.mensaje = mensaje;
                                                }
                                            } else {
                                                //Error Obteniendo ID Interno de la Liquidacion a procesar
                                                respuesta.error = true;
                                                respuesta.mensaje = "No se pudo Obtener el ID Interno de los Ajustes a procesar";
                                            }
                                            //}
                                        } else {
                                            //Error Obteniendo Columnas de Sublista
                                            respuesta.error = true;
                                            respuesta.mensaje = "No se pudo Obtener las columnas de la sublista de Ajustes a procesar";
                                        }
                                    } else {
                                        //Error Obteniendo Contenido de Sublista
                                        respuesta.error = true;
                                        respuesta.mensaje = "No se pudo Obtener el contenido de la sublista de Ajustes a procesar";
                                    }

                                }

                            } else {
                                respuesta.error = true;
                                respuesta.mensaje = "No se pudo obtener registros de la sublista de Ajustes a procesar";
                            }

                        }

                        // INICIO - Anular Ajuste por Liquidacion Negativa
                        if (respuesta.error == false) {
                            var objFieldLookUp = search.lookupFields({
                                type: 'customrecord_3k_liquidacion_emp',
                                id: idRegistroLiquidacion,
                                columns: [
                                    'custrecord_3k_liq_emp_ajust_esp'
                                ]
                            });
                            var idAjusteEspecial = objFieldLookUp.custrecord_3k_liq_emp_ajust_esp[0].value;
                            //var idAjusteEspecial = objFieldLookUp["custrecord_3k_liq_emp_ajust_esp"];
                            log.debug('Eliminacion Liquidacion', 'ID Ajuste Especial : ' + idAjusteEspecial);
                            if (!utilities.isEmpty(idAjusteEspecial)) {
                                var objRecordAjusteNuevo = record.copy({
                                    type: 'customrecord_3k_ajustes_liq_emp',
                                    id: idAjusteEspecial,
                                    isDynamic: true,
                                });
                                if (!utilities.isEmpty(objRecordAjusteNuevo)) {
                                    objRecordAjusteNuevo.setValue({
                                        fieldId: 'name',
                                        value: 'Ajuste Automatico por Anulacion de Liquidacion Negativa'
                                    });
                                    var importeLiquidacion = objRecordAjusteNuevo.getValue({
                                        fieldId: 'custrecord_3k_ajustes_liq_emp_imp_pag'
                                    });
                                    log.debug('Eliminacion Liquidacion', 'Ajuste Especial - Importe Liquidacion : ' + importeLiquidacion);
                                    if (!utilities.isEmpty(importeLiquidacion) && !isNaN(importeLiquidacion) && parseFloat(importeLiquidacion, 10) < 0.00) {
                                        objRecordAjusteNuevo.setValue({
                                            fieldId: 'custrecord_3k_ajustes_liq_emp_imp_pag',
                                            value: (parseFloat(importeLiquidacion, 10) * -1).toFixed(2)
                                        });
                                    }
                                    var importeFacturacion = objRecordAjusteNuevo.getValue({
                                        fieldId: 'custrecord_3k_ajustes_liq_emp_imp_fact'
                                    });
                                    log.debug('Eliminacion Liquidacion', 'Ajuste Especial - Importe Facturacion : ' + importeFacturacion);
                                    if (!utilities.isEmpty(importeFacturacion) && !isNaN(importeFacturacion) && parseFloat(importeFacturacion, 10) < 0.00) {
                                        objRecordAjusteNuevo.setValue({
                                            fieldId: 'custrecord_3k_ajustes_liq_emp_imp_fact',
                                            value: (parseFloat(importeFacturacion, 10) * -1).toFixed(2)
                                        });
                                    }
                                    try {
                                        var recId = objRecordAjusteNuevo.save();
                                    } catch (excepcionSave) {
                                        log.error('Eliminacion Liquidacion', 'Excepcion Proceso Creacion de Ajuste por Liquidacion Negativa - Excepcion : ' + excepcionSave.message.toString());
                                        var error = new Object();
                                        if (!isEmpty(excepcionSave.message) && excepcionSave.message.indexOf('Error') >= 0) {
                                            var excepcionObj = JSON.parse(excepcionSave.message);
                                            error.name = excepcionObj.name;
                                            error.message = excepcionObj.message;
                                        } else {
                                            error.name = 'SCUP024';
                                            error.message = excepcionSave.message;
                                        }

                                        respuesta.error = true;
                                        respuesta.mensaje = error.message;
                                    }

                                } else {
                                    respuesta.error = true;
                                    respuesta.mensaje = "Error Generando Anulación de Ajuste Especial por Liquidacion Negativa";
                                }
                            }
                        }
                        // INICIO - Anular Ajuste por Liquidacion Negativa

                        if (respuesta.error == false && existenLiquidacionesSeleccionadas == false) {
                            respuesta.error = true;
                            respuesta.mensaje = "No se encontraron registros de Cupones/Ajustes para procesar";
                        }

                        if (respuesta.error == false) {

                            // INICIO - Anular Registro de Liquidacion
                            try {
                                var idRecord = record.submitFields({
                                    type: 'customrecord_3k_liquidacion_emp',
                                    id: idRegistroLiquidacion,
                                    values: {
                                        custrecord_3k_liq_emp_anulada: true
                                    },
                                    options: {
                                        enableSourcing: true,
                                        ignoreMandatoryFields: false
                                    }
                                });

                                if (utilities.isEmpty(idRecord)) {
                                    respuesta.error = true;
                                    var mensaje = 'Error Anulando Liquidacion con ID Interno : ' + idRegistroLiquidacion + ' - Error : No se recibio ID del Registro de Liquidacion Anulado';
                                    log.error('Eliminacion Liquidaciones', mensaje);
                                    respuesta.mensaje = mensaje;
                                }
                            } catch (excepcionAnulando) {
                                respuesta.error = true;
                                var mensaje = 'Excepcion en Proceso de Anulacion de Liquidacion con ID Interno : ' + idRegistroLiquidacion + ' - Excepcion : ' + excepcionAnulando.message;
                                log.error('Eliminacion Liquidaciones', mensaje);
                                respuesta.mensaje = mensaje;
                            }
                            // FIN - Anular Registro de Liquidacion

                        }

                    } else {
                        respuesta.error = true;
                        respuesta.mensaje = "No se recibio el Registro de Liquidacion A Anular";
                    }
                } else {
                    respuesta.error = true;
                    respuesta.mensaje = "No se pudo obtener sublista de Liquidaciones a procesar";
                }

            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Liquidaciones A Procesar - Excepcion : " + excepcion.message;

                log.error('Eliminacion Liquidaciones Servicios REST', 'Consulta Liquidaciones A Procesar - Excepcion Consultando Liquidaciones A Procesar - Excepcion : ' + excepcion.message);
            }
            log.audit('Eliminacion Liquidaciones Servicios REST', 'FIN Consulta Liquidaciones A Procesar');
            return respuesta;
        }

        function cargarLiquidaciones(sublistCupones, sublistAjustes, request) {
            log.audit('Eliminacion Liquidaciones Servicios REST', 'INICIO Consulta Liquidaciones Pendientes');
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";

            try {

                var cuponesAsociados = search.load({
                    id: 'customsearch_3k_cupones_asoc_liq'
                });

                var ajustesAsociados = search.load({
                    id: 'customsearch_3k_ajustes_asoc_liq'
                });

                if (!utilities.isEmpty(request.parameters.liquidacion)) {

                    var filtroLiquidacion = search.createFilter({
                        name: 'custrecord_3k_cupon_reg_liquidacion',
                        operator: search.Operator.ANYOF,
                        values: request.parameters.liquidacion
                    });

                    cuponesAsociados.filters.push(filtroLiquidacion);

                    var filtroLiquidacion = search.createFilter({
                        name: 'custrecord_3k_ajustes_liq_emp_reg_liq',
                        operator: search.Operator.ANYOF,
                        values: request.parameters.liquidacion
                    });

                    ajustesAsociados.filters.push(filtroLiquidacion);

                }

                // INICIO - Consulta Cupones Asociados

                var resultSet = cuponesAsociados.run();

                var completeResultSetCupones = null;

                log.debug('Eliminacion Liquidaciones Servicios REST', 'INICIO Consulta Busqueda Cupones Asociados');

                var resultIndex = 0;
                var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
                var resultado; // temporary variable used to store the result set
                do {
                    // fetch one result set
                    resultado = resultSet.getRange({
                        start: resultIndex,
                        end: resultIndex + resultStep
                    });

                    if (!utilities.isEmpty(resultado) && resultado.length > 0) {
                        if (resultIndex == 0)
                            completeResultSetCupones = resultado;
                        else
                            completeResultSetCupones = completeResultSetCupones.concat(resultado);
                    }

                    // increase pointer
                    resultIndex = resultIndex + resultStep;

                    // once no records are returned we already got all of them
                } while (!utilities.isEmpty(resultado) && resultado.length > 0)

                log.debug('Eliminacion Liquidaciones Servicios REST', 'FIN Consulta Busqueda Cupones Asociados');

                if (!utilities.isEmpty(completeResultSetCupones)) {
                    log.debug('Eliminacion Liquidaciones Servicios REST', 'FIN Consulta Busqueda Cupones Asociados - Cantidad Registros Encontrados : ' + completeResultSetCupones.length);

                    for (var i = 0; !utilities.isEmpty(completeResultSetCupones) && completeResultSetCupones.length > 0 && i < completeResultSetCupones.length; i++) {

                        var idInterno = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[0]
                        });

                        var fecha = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[1]
                        });

                        var idEmpresa = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[2]
                        });

                        var idCupon = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[3]
                        });

                        /*var idMoneda = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[4]
                        });*/

                        var idMoneda = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[13]
                        });

                        var tipoCambio = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[5]
                        });

                        var importeCupon = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[6]
                        });

                        var porcentajeFacturacion = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[7]
                        });

                        var importeFacturacion = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[8]
                        });

                        var porcentajeLiquidacion = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[9]
                        });

                        var importeLiquidacion = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[10]
                        });

                        var sitio = completeResultSetCupones[i].getValue({
                            name: resultSet.columns[11]
                        });


                        sublistCupones.setSublistValue({
                            id: 'fecha',
                            line: i,
                            value: fecha
                        });

                        sublistCupones.setSublistValue({
                            id: 'empresa',
                            line: i,
                            value: idEmpresa
                        });

                        sublistCupones.setSublistValue({
                            id: 'cupon',
                            line: i,
                            value: idInterno
                        });

                        sublistCupones.setSublistValue({
                            id: 'moneda',
                            line: i,
                            value: idMoneda
                        });

                        sublistCupones.setSublistValue({
                            id: 'tipocambio',
                            line: i,
                            value: tipoCambio
                        });

                        sublistCupones.setSublistValue({
                            id: 'importecupon',
                            line: i,
                            value: importeCupon
                        });

                        sublistCupones.setSublistValue({
                            id: 'porcentajefacturar',
                            line: i,
                            value: porcentajeFacturacion
                        });

                        sublistCupones.setSublistValue({
                            id: 'importefacturar',
                            line: i,
                            value: importeFacturacion
                        });

                        sublistCupones.setSublistValue({
                            id: 'porcentajeliquidar',
                            line: i,
                            value: porcentajeLiquidacion
                        });

                        sublistCupones.setSublistValue({
                            id: 'importeliquidar',
                            line: i,
                            value: importeLiquidacion
                        });

                        sublistCupones.setSublistValue({
                            id: 'sitio',
                            line: i,
                            value: sitio
                        });

                        sublistCupones.setSublistValue({
                            id: 'idinternos',
                            line: i,
                            value: idInterno.toString()
                        });

                    } //for
                } //if

                // FIN - Consulta Cupones Asociados

                // INICIO - Consulta Ajustes Asociados

                var resultSet = ajustesAsociados.run();

                var completeResultSetAjustes = null;

                log.debug('Eliminacion Liquidaciones Servicios REST', 'INICIO Consulta Busqueda Ajustes Asociados');

                var resultIndex = 0;
                var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
                var resultado; // temporary variable used to store the result set
                do {
                    // fetch one result set
                    resultado = resultSet.getRange({
                        start: resultIndex,
                        end: resultIndex + resultStep
                    });

                    if (!utilities.isEmpty(resultado) && resultado.length > 0) {
                        if (resultIndex == 0)
                            completeResultSetAjustes = resultado;
                        else
                            completeResultSetAjustes = completeResultSetAjustes.concat(resultado);
                    }

                    // increase pointer
                    resultIndex = resultIndex + resultStep;

                    // once no records are returned we already got all of them
                } while (!utilities.isEmpty(resultado) && resultado.length > 0)

                log.debug('Eliminacion Liquidaciones Servicios REST', 'FIN Consulta Busqueda Ajustes Asociados');

                if (!utilities.isEmpty(completeResultSetAjustes)) {
                    log.debug('Eliminacion Liquidaciones Servicios REST', 'FIN Consulta Busqueda Ajustes Asociados - Cantidad Registros Encontrados : ' + completeResultSetAjustes.length);

                    for (var i = 0; !utilities.isEmpty(completeResultSetAjustes) && completeResultSetAjustes.length > 0 && i < completeResultSetAjustes.length; i++) {

                        var idInterno = completeResultSetAjustes[i].getValue({
                            name: resultSet.columns[0]
                        });

                        var fecha = completeResultSetAjustes[i].getValue({
                            name: resultSet.columns[1]
                        });

                        var idEmpresa = completeResultSetAjustes[i].getValue({
                            name: resultSet.columns[2]
                        });

                        var idCupon = completeResultSetAjustes[i].getValue({
                            name: resultSet.columns[9]
                        });

                        var idMoneda = completeResultSetAjustes[i].getValue({
                            name: resultSet.columns[3]
                        });

                        var tipoCambio = completeResultSetAjustes[i].getValue({
                            name: resultSet.columns[4]
                        });

                        var importeCupon = completeResultSetAjustes[i].getValue({
                            name: resultSet.columns[11]
                        });

                        var importeFacturacion = completeResultSetAjustes[i].getValue({
                            name: resultSet.columns[5]
                        });

                        var importeLiquidacion = completeResultSetAjustes[i].getValue({
                            name: resultSet.columns[6]
                        });

                        var sitio = completeResultSetAjustes[i].getValue({
                            name: resultSet.columns[7]
                        });


                        sublistAjustes.setSublistValue({
                            id: 'fecha',
                            line: i,
                            value: fecha
                        });

                        sublistAjustes.setSublistValue({
                            id: 'empresa',
                            line: i,
                            value: idEmpresa
                        });

                        if (!utilities.isEmpty(idCupon)) {

                            sublistAjustes.setSublistValue({
                                id: 'cupon',
                                line: i,
                                value: idCupon
                            });

                        }

                        sublistAjustes.setSublistValue({
                            id: 'moneda',
                            line: i,
                            value: idMoneda
                        });

                        sublistAjustes.setSublistValue({
                            id: 'tipocambio',
                            line: i,
                            value: tipoCambio
                        });

                        if (!utilities.isEmpty(importeCupon)) {

                            sublistAjustes.setSublistValue({
                                id: 'importecupon',
                                line: i,
                                value: importeCupon
                            });

                        }

                        sublistAjustes.setSublistValue({
                            id: 'importefacturar',
                            line: i,
                            value: importeFacturacion
                        });

                        sublistAjustes.setSublistValue({
                            id: 'importeliquidar',
                            line: i,
                            value: importeLiquidacion
                        });

                        sublistAjustes.setSublistValue({
                            id: 'sitio',
                            line: i,
                            value: sitio
                        });

                        sublistAjustes.setSublistValue({
                            id: 'idinternos',
                            line: i,
                            value: idInterno.toString()
                        });

                    } //for
                } //if

                // FIN - Consulta Ajustes Asociados

                if (utilities.isEmpty(completeResultSetCupones) && utilities.isEmpty(completeResultSetAjustes)) {
                    respuesta.error = true;
                    respuesta.mensaje = "No se encontraron Registros Asociados A la Liquidacion";
                    log.audit('Eliminacion Liquidaciones Servicios REST', 'FIN Consulta Busqueda Liquidaciones Asociadas - No se encontraron Registros Asociados A la Liquidacion');
                }

                /*else {
                    respuesta.error = true;
                    respuesta.mensaje = "No se encontraron Registros Asociados A la Liquidacion";
                    log.audit('Eliminacion Liquidaciones Servicios REST', 'FIN Consulta Busqueda Liquidaciones Pendientes - No se encontraron Liquidaciones Pendientes');
                }*/
            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Consultando Registros Asociados A la Liquidacion - Excepcion : " + excepcion.message;
                log.error('Eliminacion Liquidaciones Servicios REST', 'Consulta Busqueda Registros Asociados - Excepcion Consultando Registros Asociados A la Liquidacion - Excepcion : ' + excepcion.message);
            }

            log.audit('Eliminacion Liquidaciones Servicios REST', 'FIN Registros Asociados A la Liquidacion');
            return respuesta;
        }

        /*function createAndSubmitMapReduceJob(idScript, parametros) {
            log.audit('Eliminacion Liquidaciones Servicios REST', 'INICIO Invocacion Script MAP/REDUCE');
            var respuesta = new Object();
            respuesta.error = false;
            respuesta.mensaje = "";
            respuesta.estado = "";
            try {
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: idScript,
                    params: parametros
                });
                var mrTaskId = mrTask.submit();
                var taskStatus = task.checkStatus(mrTaskId);
                respuesta.estado = taskStatus;
            } catch (excepcion) {
                respuesta.error = true;
                respuesta.mensaje = "Excepcion Invocando A Script MAP/REDUCE - Excepcion : " + excepcion.message;
                log.error('Eliminacion Liquidaciones Servicios REST', 'Eliminacion Liquidaciones - Excepcion Invocando A Script MAP/REDUCE - Excepcion : ' + excepcion.message);
            }
            log.audit('Eliminacion Liquidaciones Servicios REST', 'FIN Invocacion Script MAP/REDUCE');
            return respuesta;
        }*/

        return {
            onRequest: onRequest
        };

    });
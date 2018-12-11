/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/
define(['N/error', 'N/record', 'N/search', 'N/format', '3K/utilities'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function(error, record, search, format, utilities) {

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            var respuesta = new Object({});
            respuesta.error = false;
            respuesta.detalle = [];

            try {

                if (scriptContext.fieldId == 'custrecord_3k_cupon_nivel_accion_1') {
                    var rec = scriptContext.currentRecord;

                    var nivelAccion = rec.getValue({
                        fieldId: scriptContext.fieldId
                    });
                    log.debug('fieldChanged', 'nivelAccion: ' + nivelAccion);
                    alert('nivelAccion: ' + nivelAccion);
                    if (!utilities.isEmpty(nivelAccion)) {

                        var diasImpactoObj = search.lookupFields({
                            type: 'customrecord_3k_niveles_accion',
                            id: nivelAccion,
                            columns: ['custrecord_3k_niveles_accion_dias_impact']
                        });

                        log.debug('fieldChanged', 'diasImpactoObj: ' + JSON.stringify(diasImpactoObj));
                        alert('diasImpactoObj: ' + JSON.stringify(diasImpactoObj));

                        var diasImpacto = diasImpactoObj.custrecord_3k_niveles_accion_dias_impact;

                        if (!utilities.isEmpty(diasImpacto) && diasImpacto > 0) {
                            log.debug('fieldChanged', 'diasImpacto: ' + diasImpacto);
                            alert('diasImpacto: ' + JSON.stringify(diasImpacto));

                            var fechaDisponibilidadCliente = rec.getValue({
                                fieldId: 'custrecord_3k_cupon_fecha_dis_cliente'
                            });

                            log.debug('fieldChanged', 'fechaDisponibilidadCliente: ' + fechaDisponibilidadCliente);
                            alert('fechaDisponibilidadCliente: ' + fechaDisponibilidadCliente);

                            if (!utilities.isEmpty(fechaDisponibilidadCliente)) {


                                var fechaParse = format.parse({
                                    value: fechaDisponibilidadCliente,
                                    type: format.Type.DATE,
                                    //timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                                });

                                var newFechaDisponibilidad = fechaParse;

                                var arrayDiasNoLaborales = [];

                                arrayDiasNoLaborables = consultarDiasNoLoborables();

                                var diasTotales = 1;
                                for (var i = 1; i <= diasImpacto; i++) {
                                    var fechaRecorrida = newFechaDisponibilidad;

                                    fechaRecorrida.setDate(newFechaDisponibilidad.getDate() + diasTotales);

                                    var resultFilter = arrayDiasNoLaborales.filter(function(obj) {
                                        return (obj.fecha.getTime() == fechaRecorrida.getTime());
                                    });

                                    if(!utilities.isEmpty(resultFilter) && resultFilter.length>0){
                                        i--;
                                    }

                                    diasTotales++;
                                }

                                newFechaDisponibilidad.setDate(newFechaDisponibilidad.getDate() + parseInt(diasTotales, 10));

                                log.debug('fieldChanged', 'newFechaDisponibilidad: ' + newFechaDisponibilidad);
                                alert('newFechaDisponibilidad: ' + newFechaDisponibilidad);

                                rec.setValue({
                                    fieldId: 'custrecord_3k_cupon_fecha_dis_cliente',
                                    value: newFechaDisponibilidad
                                });
                            }
                        }

                    }
                }

            } catch (e) {
                respuesta.error = true;
                respuestaParcial = new Object({});
                respuestaParcial.codigo = 'CVOL001';
                respuestaParcial.mensaje = 'Excepcion calculando Totales peso y tamaño : ' + e.message;
                respuesta.detalle.push(respuestaParcial);

                throw utilities.crearError('fielChanged Netsuite', 'Excepción: ' + JSON.stringify(respuesta));


            }

        }

        function consultarDiasNoLoborables() {
            var respuesta = new Object();
            respuesta.error = false;
            //respuesta.tipoError = '';
            //respuesta.mensaje = '';
            respuesta.arrayDiasNoLaborables = new Array();
            respuesta.detalle = new Array();

            // INICIO - Obtener Array de Dias No Laborable
            var objResultSet = utilities.searchSaved('customsearch_3k_calendario_dias_no_lab');
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

            for (var l = 0; !utilities.isEmpty(resultSet) && l < resultSet.length; l++) {

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

                if (!utilities.isEmpty(obj.fecha)) {
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



        return {
            fieldChanged: fieldChanged

        };

    });

/**
 * @NApiVersion 2.x
 * @NAmdConfig ./configuration.json
 * @NScriptType UserEventScript
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
  function (error, record, search, format, utilities) {
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {
      if (scriptContext.type == 'edit') {
        var respuesta = {};
        respuesta.error = false;
        respuesta.detalle = [];
        log.audit('Niveles de Acción', 'INCIO NIVELES DE ACCION');

        var newRecordOV = scriptContext.newRecord;
        var oldRecordOV = scriptContext.oldRecord;
        if (newRecordOV.getLineCount({
            sublistId: 'item'
          }) == oldRecordOV.getLineCount({
            sublistId: 'item'
          })) {
          var lineasAplicar = [];
          for (var i = 0; i < newRecordOV.getLineCount({
              sublistId: 'item'
            }); i++) {
            var cantNivelesNew = newRecordOV.getSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_3k_niveles_accion_aplicados',
              line: i
            });
            log.debug('cantNivelesNew', cantNivelesNew);
            var cantNivelesOld = oldRecordOV.getSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_3k_niveles_accion_aplicados',
              line: i
            });
            log.debug('cantNivelesOld', cantNivelesOld);
            if (cantNivelesNew !== cantNivelesOld) {
              var nivelNew = newRecordOV.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_3k_nivel_accion_vigente',
                line: i
              });
              lineasAplicar.push({
                linea: i,
                nivel: nivelNew
              });
            }
          }
          if (lineasAplicar.length > 0) {
            //Solo si hay líneas a aplicar: busco los niveles de acción con días de impacto y los días no laborables
            var ssNivelesAccion = utilities.searchSavedPro('customsearch_3k_niveles_acc_dias_impacto').objRsponseFunction;
            var resultArrDias = consultarDiasNoLaborables();
            if (resultArrDias.error) {
              log.error('Niveles Accion', 'Error: ' + resultArrDias);
            }
            var arrayDiasNoLaborables = resultArrDias.arrayDiasNoLaborables;
            try {
              log.debug('Niveles de Acción', 'Setear niveles de acción en línea - Inicio');
              for (var i = 0; i < lineasAplicar.length; i++) {
                log.debug('Níveles de Acción', 'Línea: ' + lineasAplicar[i].linea + ' - Nivel: ' + lineasAplicar[i].nivel);
                //Busco los días de impacto del nuevo nivel de acción de la línea
                var diasImpacto = ssNivelesAccion.result.filter(function (obj) {
                  return obj.getValue('internalid') == lineasAplicar[i].nivel;
                })[0];

                diasImpacto = diasImpacto.getValue('custrecord_3k_niveles_accion_dias_impact');
                log.debug('Niveles de Acción', 'diasImpacto: ' + diasImpacto);

                if (!utilities.isEmpty(diasImpacto) && diasImpacto > 0) {
                  log.debug('Niveles de Acción', 'diasImpacto: ' + diasImpacto);

                  var fechaDisponibilidadCliente = newRecordOV.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_3k_fecha_disponibiliad',
                    line: lineasAplicar[i].linea
                  });
                  var fechaEntrega = newRecordOV.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_3k_fecha_entrega',
                    line: lineasAplicar[i].linea
                  });

                  log.debug('Niveles de Acción', 'fechaDisponibilidadCliente: ' + fechaDisponibilidadCliente);
                  log.debug('Niveles de Acción', 'fechaEntrega: ' + fechaEntrega);

                  if (!utilities.isEmpty(fechaDisponibilidadCliente)) {

                    // FECHA DISPONIBILIDAD
                    log.debug('Niveles de Acción', 'Calculando FechaDisponibilidad para la línea: ' + lineasAplicar[i].linea);
                    var newFechaDisponibilidad = calcularFechaCondiasNoLab(arrayDiasNoLaborables, diasImpacto, fechaDisponibilidadCliente).fechaCalculada;
                    log.debug('Niveles de Acción', 'newFechaDisponibilidad calculada: ' + newFechaDisponibilidad);
                    newRecordOV.setSublistValue({
                      sublistId: 'item',
                      fieldId: 'custcol_3k_fecha_disponibiliad',
                      line: lineasAplicar[i].linea,
                      value: newFechaDisponibilidad
                    });

                    // FECHA ENTREGA
                    log.debug('Niveles de Acción', 'Calculando FechaEntrega para la línea: ' + lineasAplicar[i].linea);
                    var newFechaEntrega = calcularFechaCondiasNoLab(arrayDiasNoLaborables, diasImpacto, fechaEntrega).fechaCalculada;
                    log.debug('Niveles de Acción', 'newFechaEntrega calculada: ' + newFechaEntrega);
                    newRecordOV.setSublistValue({
                      sublistId: 'item',
                      fieldId: 'custcol_3k_fecha_entrega',
                      line: lineasAplicar[i].linea,
                      value: newFechaEntrega
                    });

                    //ACTUALIZAR FECHA EN LA OV
                    var fechaClienteCabecera = newRecordOV.getValue({
                      fieldId: 'custbody_3k_fecha_cliente'
                    });
                    var fechaClienteLínea = newRecordOV.getSublistValue({
                      sublistId: 'item',
                      fieldId: 'custcol_3k_fecha_disponibiliad',
                      line: lineasAplicar[i].linea
                    });
                    if (new Date(fechaClienteLínea) > new Date(fechaClienteCabecera)) {
                      log.debug('FechaCliente Mayor', 'La fecha cliente de esta línea es mayor que la de cabecera, por lo tanto se sustituirá');
                      var newFechaClienteCabecera = format.parse({
                        value: fechaClienteLínea,
                        type: format.Type.DATE
                        //timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                      });
                      //newFechaClienteCabecera = format.format({
                      //  value: newFechaClienteCabecera,
                      //  type: format.Type.DATE,
                      //timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
                      //});
                      newRecordOV.setValue({
                        fieldId: 'custbody_3k_fecha_cliente',
                        value: newFechaClienteCabecera
                      });
                    }
                  } else {
                    log.debug('Niveles de Acción', 'Sin fecha disponibilidad cliente en la línea: ' + lineasAplicar[i].linea);
                  }
                } else {
                  log.debug('Niveles de Acción', 'Sin días de impacto para la línea: ' + lineasAplicar[i].linea + ' - Nivel: ' + lineasAplicar[i].nivel);
                }
              }
              log.debug('Niveles de Acción', 'Setear niveles de acción en línea - Fin');

              log.debug('Niveles de Acción', 'Setear fecha ultimo nivel de acción - INICIO');
              var fechaUltimoNivel = new Date();
              fechaUltimoNivel = format.parse({
                value: fechaUltimoNivel,
                type: format.Type.DATE
                //timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
              });
              //fechaUltimoNivel = format.format({
              //  value: fechaUltimoNivel,
              //  type: format.Type.DATE,
              //timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
              //});
              newRecordOV.setValue({
                fieldId: 'custbody_3k_fecha_ult_cambio_nivel_acc',
                value: fechaUltimoNivel
              });
              log.debug('Niveles de Acción', 'Setear fecha ultimo nivel de acción - FIN');
              log.audit('Niveles de Acción', 'FIN NIVELES DE ACCION');
            } catch (e) {
              respuesta.error = true;
              objrespuestaParcial = new Object({});
              objrespuestaParcial.codigo = 'RCCE001';
              objrespuestaParcial.mensaje += 'Excepción: ' + e;
              respuesta.detalle.push(objrespuestaParcial);
              log.error('Niveles Acción', 'Excepción: ' + JSON.stringify(respuesta));
            }
          } else {
            log.audit('Niveles de Acción', 'FIN NIVELES DE ACCION - NO APLICADOS. No hay niveles de Acción para aplicar');
          }
        } else {
          log.audit('Niveles de Acción', 'FIN NIVELES DE ACCION - NO APLICADOS. La cantidad de líneas ha cambiado');
        }
      }
    }

    function consultarDiasNoLaborables() {
      var respuesta = {};
      respuesta.error = false;
      //respuesta.tipoError = '';
      //respuesta.mensaje = '';
      respuesta.arrayDiasNoLaborables = [];
      respuesta.detalle = [];

      // INICIO - Obtener Array de Dias No Laborable
      var objResultSet = utilities.searchSaved('customsearch_3k_calendario_dias_no_lab');
      if (objResultSet.error) {
        respuesta.error = true;
        objRespuestaParcial = {};
        objRespuestaParcial.codigo = 'SROV018';
        objRespuestaParcial.mensaje = 'Error Obteniendo Calendario de Dias No Laborables - Tipo Error : ' + objResultSet.tipoError + ' - Descripcion : ' + objResultSet.descripcion;
        respuesta.detalle.push(objRespuestaParcial);
        //respuesta.tipoError = 'SROV018';
        //respuesta.mensaje = 'Error Obteniendo Calendario de Dias No Laborables - Tipo Error : ' + objResultSet.tipoError + ' - Descripcion : ' + objResultSet.descripcion;;
        return respuesta;
      }

      var resultSet = objResultSet.objRsponseFunction.result;
      var resultSearch = objResultSet.objRsponseFunction.search;

      for (var l = 0; !utilities.isEmpty(resultSet) && l < resultSet.length; l++) {

        var obj = {};
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

    function calcularFechaCondiasNoLab(arrayDiasNoLaborables, diasImpacto, newRecFecha) {
      var diasTotales = 0;
      var fechaCalculada = format.parse({
        value: newRecFecha,
        type: format.Type.DATE
        //timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
      });
      for (var i = 1; i <= diasImpacto; i++) {
        var fechaRecorrida = new Date(fechaCalculada.getTime());

        fechaRecorrida.setDate(fechaCalculada.getDate() + diasTotales);

        log.debug('NIVELES', 'diasTotales: ' + diasTotales);
        log.debug('NIVELES', 'fechaCalculada: ' + fechaCalculada);
        log.debug('NIVELES', 'fechaRecorrida: ' + fechaRecorrida);
        //log.debug('NIVELES', 'fechaParse: ' + fechaParse);
        log.debug('NIVELES', 'i: ' + i);

        var resultFilter = arrayDiasNoLaborables.filter(function (obj) {
          return (obj.fecha.getTime() == fechaRecorrida.getTime());
        });

        if (!utilities.isEmpty(resultFilter) && resultFilter.length > 0) {
          i--;
        }
        diasTotales++;
      }
      fechaCalculada.setDate(fechaCalculada.getDate() + parseInt(diasTotales, 10));
      var fechaString = format.format({
        value: fechaCalculada,
        type: format.Type.DATE,
        //timezone : format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
      });
      var obj = {
        fechaCalculada: fechaCalculada,
        fechaString: fechaString
      };
      return obj;
    }

    return {
      beforeSubmit: beforeSubmit
    };

  });
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
    function afterSubmit(scriptContext) {
      var respuesta = new Object();
      respuesta.idRemito = '';
      respuesta.error = false;
      respuesta.detalle = new Array();

      try {
        log.audit('Inicio Grabar Remito', 'AfterSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);
        var idFactura = scriptContext.newRecord.getValue({
          fieldId: 'custbody_3k_factura_generada'
        });
        var shipStatus = scriptContext.newRecord.getValue({
          fieldId: 'shipstatus'
        });
        var idOrdenVenta = scriptContext.newRecord.getValue({
          fieldId: 'createdfrom'
        });
        var searchTravelServicio = search.lookupFields({
          type: SALES_ORDER,
          id: idOrdenVenta,
          columns: [
            'custbody_3k_ov_servicio', 'custbody_3k_ov_travel'
          ]
        });
        var esProducto = !(searchTravelServicio.custbody_3k_ov_servicio || searchTravelServicio.custbody_3k_ov_travel) || false;
        if (( /*scriptContext.type == 'create' ||*/ scriptContext.type == 'edit') && (shipStatus.toLowerCase() == 'b' || shipStatus.toLowerCase() == 'c') && utilities.isEmpty(idFactura) && esProducto) {
          var idRemito = scriptContext.newRecord.id;
          var tipoTransaccion = scriptContext.newRecord.type;
          if (!utilities.isEmpty(idRemito) && !utilities.isEmpty(tipoTransaccion)) {
            respuesta.idRemito = idRemito;
            var remRecord = record.load({
              type: tipoTransaccion,
              id: idRemito,
              isDynamic: true,
            });
            if (!utilities.isEmpty(remRecord)) {

              var fechaRemito = remRecord.getValue({
                fieldId: 'trandate'
              });

              var fechaRemitoDate = format.parse({
                value: fechaRemito,
                type: format.Type.DATE,
              });

              var fechaRemitoString = format.format({
                value: fechaRemitoDate,
                type: format.Type.DATE,
              });



              if (!utilities.isEmpty(idOrdenVenta)) {

                // Obtener Tipo Comprobante CreatedFrom

                var tipoTransaccion = '';

                var objParam = new Object();
                objParam.name = 'internalid';
                objParam.operator = 'IS';
                objParam.values = idOrdenVenta;

                var searchTipoTransaccion = utilities.searchSaved('customsearch_3k_tipos_transacciones', objParam);
                if (!utilities.isEmpty(searchTipoTransaccion) && searchTipoTransaccion.error == false) {
                  if (!utilities.isEmpty(searchTipoTransaccion.objRsponseFunction.result) && searchTipoTransaccion.objRsponseFunction.result.length > 0) {

                    var resultSet = searchTipoTransaccion.objRsponseFunction.result;
                    var resultSearch = searchTipoTransaccion.objRsponseFunction.search;

                    tipoTransaccion = resultSet[0].getValue({
                      name: resultSearch.columns[1]
                    });

                    if (utilities.isEmpty(tipoTransaccion)) {
                      respuesta.error = true;
                      respuestaParcial = new Object();
                      respuestaParcial.codigo = 'SREM022';
                      respuestaParcial.mensaje = 'Error Consultando Tipo de Transaccion Origen del Remito con ID Interno : ' + respuesta.idRemito + ' - Error : No se Recibio el Tipo de Transaccion';
                      respuesta.detalle.push(respuestaParcial);
                    }

                  } else {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SREM019';
                    respuestaParcial.mensaje = 'Error Consultando Tipo de Transaccion Origen del Remito con ID Interno : ' + respuesta.idRemito + ' - Error : No se encontro la transaccion';
                    respuesta.detalle.push(respuestaParcial);
                  }
                } else {
                  if (utilities.isEmpty(searchRequisiciones)) {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SREM020';
                    respuestaParcial.mensaje = 'Error Consultando Tipo de Transaccion Origen del Remito con ID Interno : ' + respuesta.idRemito + ' - Error : No se Recibio Objeto de Respuesta';
                    respuesta.detalle.push(respuestaParcial);
                  } else {
                    respuesta.error = true;
                    respuestaParcial = new Object();
                    respuestaParcial.codigo = 'SREM021';
                    respuestaParcial.mensaje = 'Error Consultando Tipo de Transaccion Origen del Remito con ID Interno : ' + respuesta.idRemito + ' - Tipo Error : ' + searchTipoTransaccion.tipoError + ' - Descripcion : ' + searchTipoTransaccion.descripcion;
                    respuesta.detalle.push(respuestaParcial);
                  }
                }

                // Fin Obtener Tipo Comprobante CreatedFrom

                log.audit('Inicio Grabar Remito', 'AfterSubmit - Tipo Transaccion Created From : ' + tipoTransaccion);

                if (respuesta.error == false) {
                  // Solo Genera la Factura si el Remito se genera desde una Orden de Venta
                  if (tipoTransaccion == 'salesorder') {
                    var cantidadLineasRemito = remRecord.getLineCount({
                      sublistId: 'item'
                    });
                    var informacionRemito = new Array();
                    var idOrdenes = new Array();
                    for (var i = 0; i < cantidadLineasRemito && respuesta.error == false; i++) {

                      var idArtOV = remRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                      });

                      var cantidad = remRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                      });

                      if (!utilities.isEmpty(idArtOV)) {
                        if (!utilities.isEmpty(cantidad) && !isNaN(cantidad) && cantidad > 0) {
                          var infoLinea = new Object();
                          var idArticulos = [];
                          infoLinea.idArtOV = idArtOV;
                          infoLinea.cantidad = cantidad;
                          informacionRemito.push(infoLinea);
                          idArticulos.push(idArtOV);
                        } else {
                          if ((utilities.isEmpty(cantidad) || isNaN(cantidad) || cantidad <= 0)) {
                            var mensaje = 'Error Obteniendo información de la Linea del Remito - No se encontro la siguiente informacion : ';
                            if (utilities.isEmpty(cantidad)) {
                              mensaje = mensaje + ' Cantidad de Articulos de la Linea / ';
                            }
                            if (!utilities.isEmpty(cantidad) && isNaN(cantidad)) {
                              mensaje = mensaje + ' Cantidad de Articulos No Numerica / ';
                            }
                            if (!utilities.isEmpty(cantidad) && isNaN(cantidad)) {
                              mensaje = mensaje + ' Cantidad de Articulos Negativa / ';
                            }
                            respuesta.error = true;
                            respuestaParcial = new Object();
                            respuestaParcial.codigo = 'SREM005';
                            respuestaParcial.mensaje = 'Error Facturando Remito para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
                            respuesta.detalle.push(respuestaParcial);
                          }
                        }
                      }
                    }
                    //CREAR LA FACTURA A PARTIR DE LA SALES ORDER
                    if (respuesta.error == false) {
                      var factRecord = record.transform({
                        fromType: record.Type.SALES_ORDER,
                        fromId: idOrdenVenta,
                        toType: record.Type.INVOICE,
                        isDynamic: true
                      });
                      var totalOV = factRecord.getValue({
                        fieldId: 'total'
                      });
                      //CAMBIAR LA FECHA DE LA FACTURA POR LA DEL REMITO
                      log.debug('Cambiar Fecha Factura', 'Cambiando Fecha de Factura por Fecha de Remito');
                      factRecord.setValue({
                        fieldId: 'trandate',
                        value: fechaRemitoDate
                      });

                      //DEJAR UNICAMENTE LAS LÍNEAS QUE HAYAN SIDO PACKEADAS EN EL REMITO
                      log.debug('Dejando líneas del remito', 'Dejando solo las lineas packed');
                      var lineasFactura = factRecord.getLineCount({
                        sublistId: 'item'
                      });
                      log.debug('lineasFactura', lineasFactura);
                      for (var i = lineasFactura - 1; i > -1 && respuesta.error == false; i--) {
                        log.debug('Validando Línea', 'Linea: ' + i);
                        factRecord.selectLine({
                          sublistId: 'item',
                          line: i
                        });
                        var idArtFact = factRecord.getCurrentSublistValue({
                          sublistId: 'item',
                          fieldId: 'item'
                        });
                        var importeEnvioOV = factRecord.getCurrentSublistValue({
                          sublistId: 'item',
                          fieldId: 'shippingcost'
                        });
                        var cantidadOV = factRecord.getCurrentSublistValue({
                          sublistId: 'item',
                          fieldId: 'quantity'
                        });
                        log.debug('idArtFact', idArtFact);
                        var packed = informacionRemito.filter(function (obj) {
                          return obj.idArtOV == idArtFact;
                        });
                        log.debug('packed', packed);
                        if (packed.length == 1) {
                          factRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: packed[0].cantidad,
                            ignoreFieldChange: true
                          });
                          if (importeEnvioOV > 0) {
                            var importeEnvioFact = (parseFloat(packed[0].cantidad) * parseFloat(importeEnvioOV)) / parseFloat(cantidadOV);
                            factRecord.setCurrentSublistValue({
                              sublistId: 'item',
                              fieldId: 'shippingcost',
                              value: importeEnvioFact
                            });
                          }
                          factRecord.commitLine({
                            sublistId: 'item'
                          });
                          //Si no es la última línea de la FC, se verifica si tiene descuento
                          //var verificarDescuento = (i + 1 < lineasFactura);
                          //log.debug('verificarDescuento', verificarDescuento);
                          //var lineasDescuento = 1;
                          //while (verificarDescuento) {
                          //factRecord.selectLine({
                          //sublistId: 'item',
                          //line: i + 1
                          //});
                          //var esDescuento = factRecord.getCurrentSublistValue({
                          //sublistId: 'item',
                          //fieldId: 'custcol_3k_tipo_item'
                          //}) == '8'; //Es descuento si el Tipo de Item es 8 OJO: PODRÍA CAMBIAR
                          //log.debug('esDescuento', esDescuento);
                          //i += (esDescuento) ? 1 : 0;
                          ////Si no es la última línea de la FC, se verifica si tiene descuento
                          //var verificarDescuento = (esDescuento && (i + 1 < lineasFactura));
                          //}
                        } else if (packed.length > 1) {
                          mensaje = "Existen 2 o más copias del mismo artículo en la OV";
                          respuesta.error = true;
                          respuestaParcial = new Object();
                          respuestaParcial.codigo = 'SREM005';
                          respuestaParcial.mensaje = 'Error Facturando Remito para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
                          respuesta.detalle.push(respuestaParcial);
                        } else {
                          var esDescuento = factRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_tipo_item'
                          }) == '8';
                          var esRedondeo = factRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_es_redondeo'
                          });
                          if (!esDescuento && !utilities.isEmpty(idArtFact) && !esRedondeo) {
                            log.debug('No está en el remito', 'La línea: ' + i + ' no está en el remito, se removerá');
                            factRecord.removeLine({
                              sublistId: 'item',
                              line: i
                            });
                            log.debug('Linea removida', 'Linea removida: ' + i);
                            //i--;
                            //lineasFactura = factRecord.getLineCount({
                            //  sublistId: 'item'
                            //});;
                          }
                          /*else if (esRedondeo){
                                                     log.debug('Recalcular Redondeo','Hay redondeo, se recalculará');
                                                     var montoRedondeo = factRecord.getCurrentSublistValue({
                                                       sublistId: 'item',
                                                       fieldId: 'grossamount'
                                                     });*/

                        }
                      }
                    }
                  }
                  log.audit('Todos los datos completados', 'Guardando Factura para el remito con ID Interno: ' + idRemito);
                  var idFactGenerada = factRecord.save();
                  if (!utilities.isEmpty(idFactGenerada)) {
                    log.debug('Seteando ID de Factura')
                    remRecord.setValue({
                      fieldId: 'custbody_3k_factura_generada',
                      value: idFactGenerada
                    });
                    record.submitFields({
                      type: record.Type.ITEM_FULFILLMENT,
                      id: remRecord.id,
                      values: {
                        'custbody_3k_factura_generada': idFactGenerada
                      },
                      options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: false
                      }
                    })
                  }
                  log.audit('Factura Guardada', 'Generada Factura con ID Interno: ' + idFactGenerada + '. Para el Remito con ID Interno: ' + idRemito);
                }
              }
            }
          } else {
            var mensaje = 'Error cargando Registro de Remito';
            respuesta.error = true;
            respuestaParcial = new Object();
            respuestaParcial.codigo = 'SREM004';
            respuestaParcial.mensaje = 'Error Generando Factura para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
            respuesta.detalle.push(respuestaParcial);
          }
        } //else {
        //var mensaje = 'Error obteniendo la siguiente informacion del Remito : ';
        //if (utilities.isEmpty(idRemito)) {
        //mensaje = mensaje + " ID Interno del Remito / ";
        //}
        //if (utilities.isEmpty(tipoTransaccion)) {
        //mensaje = mensaje + " Tipo de transaccion / ";
        //}
        //respuesta.error = true;
        //respuestaParcial = new Object();
        //respuestaParcial.codigo = 'SREM003';
        //respuestaParcial.mensaje = 'Error Generando Factura para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
        //respuesta.detalle.push(respuestaParcial);
        //}

      } catch (excepcionGeneral) {
        respuesta.error = true;
        respuestaParcial = new Object();
        respuestaParcial.codigo = 'SREM002';
        respuestaParcial.mensaje = 'Excepcion Generando Factura para el Remito con ID Interno : ' + respuesta.idRemito + ' - Excepcion : ' + excepcionGeneral.message.toString();
        respuesta.detalle.push(respuestaParcial);
      }

      log.debug('Grabar Remito', 'Respuesta : ' + JSON.stringify(respuesta));

      if (respuesta.error == true && !utilities.isEmpty(respuesta.detalle) && respuesta.detalle.length > 0) {
        log.error('Grabar Remito', 'Error Grabado el Remito con ID Interno : ' + respuesta.idRemito + ' Error : ' + JSON.stringify(respuesta));
        throw utilities.crearError('SREM001', 'Error Generando Factura para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + JSON.stringify(respuesta));
      }

      log.audit('Fin Grabar Remito', 'AfterSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);

    }

    return {
      afterSubmit: afterSubmit
    };

  });
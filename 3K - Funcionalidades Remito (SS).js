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

      var estadoEnviadoCupon = '';
      try {
        log.audit('Inicio Grabar Remito', 'AfterSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);
        var shipStatus = scriptContext.newRecord.getValue({
          fieldId: 'shipstatus'
        });
        if ((scriptContext.type == 'create' || scriptContext.type == 'edit') && shipStatus.toLowerCase() == 'c') {
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

              var idOrdenVenta = remRecord.getValue({
                fieldId: 'createdfrom'
              });

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
                    var ssConfigVoucher = utilities.searchSavedPro('customsearch_3k_configuracion_voucher_ss').objRsponseFunction;
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
                        isDynamic: true,
                      });
                      //CAMBIAR LA FECHA DE LA FACTURA POR LA DEL REMITO
                      factRecord.setValue({
                        fieldId: 'trandate',
                        value: fechaRemitoString
                      });

                      //DEJAR UNICAMENTE LAS LÍNEAS QUE HAYAN SIDO SHIPPEADAS EN EL REMITO
                      var lineasFactura = factRecord.getLineCount({
                        sublistId: 'item'
                      });
                      var vouchers = []; //Para guardar los vouchers de descuento y crear las líneas luego crear las líneas
                      for (var i = 0; i < lineasFactura && respuesta.error != false; i++) {
                        factRecord.selectSublistLine({
                          sublistId: 'item',
                          line: i
                        });
                        var idArtFact = factRecord.getCurrentSublistValue({
                          sublistId: 'item',
                          fieldId: 'item'
                        });
                        var shipped = infoLinea.filter(function (obj) {
                          return obj.idArtOV == idArtFact;
                        });
                        var idVoucher = factRecord.getCurrentSublistValue({
                          sublistId: 'item',
                          fieldId: 'custcol_3k_voucher'
                        });
                        if (shipped.length == 1) {
                          if (!utilities.isEmpty(idVoucher)) {
                            var accionVoucher = factRecord.getCurrentSublistValue({
                              sublistId: 'item',
                              fieldId: 'custcol_3k_cod_accion_voucher'
                            });
                            //Si no es voucher de devolución, se toma la info para luego colocar una línea de descuento
                            if (accionVoucher != '2') {
                              var cantTotal = factRecord.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity'
                              });
                              var importeVoucher = factRecord.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_importe_voucher'
                              });
                              var cantShipped = shipped[0].cantidad;
                              var importeVoucherAplicado = (parseFloat(cantShipped) * parseFloat(importeVoucher)) / parseFloat(cantTotal);
                              factRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_3k_importe_voucher',
                                value: importeVoucherAplicado
                              });
                              vouchers.push({
                                linea: i,
                                idVoucher: idVoucher,
                                importeVoucherAplicado: importeVoucherAplicado
                              });
                            }
                          }
                          factRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: shipped[0].cantidad
                          });
                          factRecord.commitLine({
                            sublistId: 'item'
                          });
                        } else if (shipped.length > 1) {
                          mensaje = "Existen 2 o más copias del mismo artículo en la OV";
                          respuesta.error = true;
                          respuestaParcial = new Object();
                          respuestaParcial.codigo = 'SREM005';
                          respuestaParcial.mensaje = 'Error Facturando Remito para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
                          respuesta.detalle.push(respuestaParcial);
                        } else {
                          log.debug('No está en el remito', 'La línea: ' + i + ' no está en el remito, se removerá');
                          factRecord.removeLine({
                            sublistId: 'item',
                            line: i
                          });
                          i--;
                          lineasFactura--;
                        }
                      }
                      if (respuesta.error == false && vouchers.length > 0) {
                        //Agrego las líneas de descuento por voucher
                        var artDescuentoVoucher = ssConfigVoucher.result.getValue('custrecord_3k_configvou_articulo');
                        for (var i = 0; respuesta.error == false && i < vouchers.length; i++) {
                          log.debug('Agregando Voucher', vouchers[i]);
                          factRecord.selectNewLine({
                            sublistId: 'item'
                          });
                          factRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: artDescuentoVoucher
                          });
                          factRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_voucher',
                            value: vouchers[i].idVoucher
                          })
                          factRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'grossamount',
                            value: parseFloat(vouchers[i].importeVoucherAplicado)
                          });
                          factRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_3k_linea_voucher',
                            value: true
                          });
                          factRecord.commitLine();
                          log.debug('Voucher agregado', vouchers[i]);
                        }
                      }
                      log.audit('Todos los datos completados', 'Guardando Factura para el remito con ID Interno: ' + idRemito);
                      var idFactGenerada = factRecord.save();
                      log.audit('Factura Guardada','Generada Factura con ID Interno: '+ idFactGenerada + '. Para el Remito con ID Interno: '+ idRemito);
                    }
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
          } else {
            var mensaje = 'Error obteniendo la siguiente informacion del Remito : ';
            if (utilities.isEmpty(idRemito)) {
              mensaje = mensaje + " ID Interno del Remito / ";
            }
            if (utilities.isEmpty(tipoTransaccion)) {
              mensaje = mensaje + " Tipo de transaccion / ";
            }
            respuesta.error = true;
            respuestaParcial = new Object();
            respuestaParcial.codigo = 'SREM003';
            respuestaParcial.mensaje = 'Error Generando Factura para el Remito con ID Interno : ' + respuesta.idRemito + ' - Error : ' + mensaje;
            respuesta.detalle.push(respuestaParcial);
          }
        }

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
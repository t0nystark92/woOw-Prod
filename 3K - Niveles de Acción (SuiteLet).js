/**
 * @NApiVersion 2.x
 * @NAmdConfig ./configuration.json
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/
//
define(['N/ui/serverWidget', 'N/https', 'N/record', 'N/error', 'N/search', 'N/format', 'N/task', '3K/utilities'],

  function (serverWidget, https, record, error, search, format, task, utilities) {

    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
      log.audit('Niveles de Acción OV', 'INICIO Proceso');
      //+ ' Fecha : ' + context.request.parameters.fechapedido);

      try {

        var form = serverWidget.createForm({
          title: 'Asignar Niveles de Acción OV'
        });

        //form.clientScriptFileId = 6026;
        form.clientScriptModulePath = './3K - Niveles Accion Suitelet (Cliente).js';

        var grupoFiltros = form.addFieldGroup({
          id: 'filtros',
          label: 'Criterios de Busqueda de Líneas OV'
        });

        /*var grupoDatos = form.addFieldGroup({
            id: 'inforequisiciones',
            label: 'Informacion Requisiciones de Compras'
        });*/

        var grupoDatos = form.addFieldGroup({
          id: 'infoov',
          label: 'Informacion Líneas OV'
        });

        var tabDetalle = form.addTab({
          id: 'tabdetalle',
          label: 'Detalle'
        });

        var subTab = form.addSubtab({
          id: 'tabbusqueda',
          label: 'Órdenes de Venta',
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
        var fechaDesde = form.addField({
          id: 'fechaentregadesde',
          type: serverWidget.FieldType.DATE,
          label: 'Fecha Entrega desde:',
          container: 'filtros'
        });

        var fechaHasta = form.addField({
          id: 'fechaentregahasta',
          type: serverWidget.FieldType.DATE,
          label: 'Fecha Entrega hasta:',
          container: 'filtros'
        });

        var articulo = form.addField({
          id: 'articulo',
          label: 'Articulo',
          type: serverWidget.FieldType.MULTISELECT,
          source: 'item',
          container: 'filtros'
        });

        var ordenVenta = form.addField({
          id: 'ordenventa',
          label: 'Orden de Venta',
          type: serverWidget.FieldType.MULTISELECT,
          source: 'salesorder',
          container: 'filtros'
        });

        var ordenCompra = form.addField({
          id: 'ordencompra',
          label: 'Orden de Compra',
          type: serverWidget.FieldType.MULTISELECT,
          source: 'purchaseorder',
          container: 'filtros'
        });

        //FIN FILTROS

        // INICIO SUBLISTA
        var sublist = form.addSublist({
          id: 'lineasov',
          type: serverWidget.SublistType.LIST,
          label: 'Órdenes de Venta',
          tab: 'tabbusqueda'
        });

        /*sublist.addField({
            id: 'procesar',
            label: 'Procesar',
            type: serverWidget.FieldType.CHECKBOX
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY
        });*/

        sublist.addField({
          id: 'proveedor',
          label: 'Proveedor',
          type: serverWidget.FieldType.SELECT,
          source: 'vendor'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });
        sublist.addField({
          id: 'idlinea',
          label: 'ID Linea',
          type: serverWidget.FieldType.TEXT
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN
        });
        sublist.addField({
          id: 'articulo',
          type: serverWidget.FieldType.SELECT,
          label: 'Articulo',
          source: 'item'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        sublist.addField({
          id: 'descripcion',
          type: serverWidget.FieldType.TEXT,
          label: 'Descripción'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        sublist.addField({
          id: 'estado',
          type: serverWidget.FieldType.SELECT,
          label: 'Estado',
          source: 'customrecord_3k_estado_orden'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });
        /*sublist.addField({
            id: 'lugarretiro',
            type: serverWidget.FieldType.SELECT,
            label: 'Lugar Retiro',
            source: 'customrecord_3k_destinos_envio'
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
        });*/

        sublist.addField({
          id: 'ordenventa',
          type: serverWidget.FieldType.SELECT,
          label: 'Orden Venta',
          source: 'salesorder'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });
        /*sublist.addField({
            id: 'ordendetalle',
            type: serverWidget.FieldType.SELECT,
            label: 'Orden Detalle',
            source: 'customrecord_3k_det_linea_ov'
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
        });*/
        sublist.addField({
          id: 'ordencompra',
          type: serverWidget.FieldType.SELECT,
          label: 'Orden Compra',
          source: 'purchaseorder'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });
        sublist.addField({
          id: 'fecha',
          type: serverWidget.FieldType.DATE,
          label: 'Fecha Pedido'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });
        sublist.addField({
          id: 'fechaentrega',
          type: serverWidget.FieldType.DATE,
          label: 'Fecha Entrega'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });
        sublist.addField({
          id: 'fechaclienteinicial',
          type: serverWidget.FieldType.DATE,
          label: 'Fecha Cliente Inicial'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });
        sublist.addField({
          id: 'fechacliente',
          type: serverWidget.FieldType.DATE,
          label: 'Fecha Cliente'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });
        sublist.addField({
          id: 'nivelaccionvigente',
          type: serverWidget.FieldType.SELECT,
          label: 'Nivel Acción Vigente',
          source: 'customrecord_3k_niveles_accion'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        sublist.addField({
          id: 'nivelesaplicados',
          type: serverWidget.FieldType.INTEGER,
          label: 'Niveles de Acción Aplicados'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        /*sublist.addField({
            id: 'cantidadcambios',
            type: serverWidget.FieldType.INTEGER,
            label: 'Cambiar Nro Niveles Aplicados'
        });*/

        //cambiarNivelesAplicados.defaultValue = 0;

        sublist.addField({
          id: 'nivelaccion',
          type: serverWidget.FieldType.SELECT,
          label: 'Niveles Acción',
          source: 'customrecord_3k_niveles_accion'
        });

        //nivelaccion.defaultValue = null;


        sublist.addMarkAllButtons();
        // FIN SUBLISTA

        form.addSubmitButton({
          label: 'Buscar OV'
        });

        form.addButton({
          id: 'custpage_btaplicar',
          label: 'Aplicar Niveles de Acción',
          functionName: "aplicar"
        });

        var infoResultado = form.addField({
          id: 'custpage_resultado',
          label: 'Resultados',
          type: serverWidget.FieldType.INLINEHTML
        });

        if (context.request.method === 'GET') {
          log.audit('Aplicar Niveles Accion OV', 'FIN Proceso - Generar Form');
          context.response.writePage(form);
        } else {
          var sAccion = utilities.isEmpty(context.request.parameters.custpage_accion) ? context.request.parameters.submitter : context.request.parameters.custpage_accion;

          switch (sAccion) {
            case 'APLICAR':
              var mensaje = "Se proceso su solicitud. Recibira una notificacion al finalizar por email";
              var resultado = aplicarNivelesAccion(sublist, context.request);
              if (!utilities.isEmpty(resultado) && resultado.error == true) {
                mensaje = resultado.mensaje;
                log.error('Aplicar Niveles Accion', 'Error Consulta Órdenes de Venta - Error : ' + mensaje);
              }
              infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
              log.audit('Aplicar Niveles Accion OV', 'FIN Proceso - Aplicar Niveles de Acción');
              context.response.writePage(form);
              break;
            case 'Buscar OV':
              var resultado = cargarLineasOV(sublist, context.request);
              if (!utilities.isEmpty(resultado) && resultado.error == true) {
                var mensaje = resultado.mensaje;
                log.error('Aplicar Niveles Accion', 'Error Consulta Órdenes de Venta - Error : ' + mensaje);
                infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
              }
              log.audit('Aplicar Niveles Accion', 'FIN Proceso - Buscar Órdenes de Venta');
              context.response.writePage(form);
              break;
          }
        }
      } catch (excepcion) {
        log.error('Aplicar Niveles Accion', 'Excepcion Aplicar Niveles Accion : ' + excepcion.message);
      }
    }

    function aplicarNivelesAccion(sublist, request) {
      log.audit('Aplicar Niveles Accion', 'INICIO Aplicar Niveles Accion');

      var idOVsProcesar = new Array();
      var existenOVsAplicar = false;
      var respuesta = new Object();
      respuesta.error = false;
      respuesta.mensaje = "";
      respuesta.estado = "";
      log.debug('Aplicar Niveles Accion', 'mensaje : ' + JSON.stringify(request.parameters.lineasovdata));
      try {
        if (!utilities.isEmpty(request.parameters.lineasovdata)) {
          var delimiterCampos = /\u0001/;
          var delimiterArray = /\u0002/;

          /*var idInternosRequis = request.parameters.custpage_idinterno;
          log.debug('generar OC', 'idInternosRequis: ' + idInternosRequis);*/

          var enviarEmail = 'F';
          if (!utilities.isEmpty(request.parameters.enviaremail) && request.parameters.enviaremail == 'T') {
            enviarEmail = 'T';
          }

          log.debug('Aplicar Niveles Accion', 'mensaje : ' + JSON.stringify(request.parameters.lineasovdata));


          var sublista = request.parameters.lineasovdata.split(delimiterArray);

          log.debug('sublista', sublista);

          if (!utilities.isEmpty(sublista) && sublista.length > 0) {

            for (var i = 0; respuesta.error == false && i < sublista.length; i++) {
              if (!utilities.isEmpty(sublista[i])) {

                var columnas = sublista[i].split(delimiterCampos);

                log.debug('Aplicar Niveles Accion', 'columnas: ' + JSON.stringify(columnas));

                if (!utilities.isEmpty(sublista) && sublista.length > 0) {
                  //var procesar = columnas[0];

                  //var newNroAplicados = columnas[16];
                  var newNivelAccion = columnas[17];

                  var objAplicar = new Object({});

                  if (!utilities.isEmpty(newNivelAccion)) { //solo si est� marcado para enviar
                    existenOVsAplicar = true;

                    var idArtAplicar = columnas[4];
                    var idInternoOV = columnas[8];

                    log.debug('Aplicar Niveles Accion SUITELET', 'Tamano Array columna : ' + columnas.length);

                    log.debug('Aplicar Niveles Accion SUITELET', 'Contador : ' + (i + 1) + ' - idArtAplicar: ' + idArtAplicar);
                    log.debug('Aplicar Niveles Accion SUITELET', 'Contador : ' + (i + 1) + ' - idInternoOV: ' + idInternoOV);
                    log.debug('Aplicar Niveles Accion SUITELET', 'Contador : ' + (i + 1) + ' - newNivelAccion: ' + newNivelAccion);

                    if (!utilities.isEmpty(idArtAplicar)) {

                      objAplicar.iOV = idInternoOV;
                      objAplicar.iArt = idArtAplicar;
                      objAplicar.nAccion = newNivelAccion;
                      log.debug('objAplicar', objAplicar);
                      idOVsProcesar.push(objAplicar);

                    } else {
                      //Error Obteniendo ID Interno de la Requisicion a procesar
                      respuesta.error = true;
                      respuesta.mensaje = "No se pudo Obtener el ID Interno de la línea a procesar";
                    }
                  }
                } else {
                  //Error Obteniendo Columnas de Sublista
                  respuesta.error = true;
                  respuesta.mensaje = "No se pudo Obtener las columnas de la sublista de OV a procesar";
                }
              } else {
                //Error Obteniendo Contenido de Sublista
                respuesta.error = true;
                respuesta.mensaje = "No se pudo Obtener el contenido de la sublista de OV a procesar";
              }

            }

            if (respuesta.error == false && existenOVsAplicar == false) {
              respuesta.error = true;
              respuesta.mensaje = "No se selecciono ninguna OV para procesar";
            }

            /*if (respuesta.error == false && utilities.isEmpty(idInternosRequis)) {
                respuesta.error = true;
                respuesta.mensaje = "No se selecciono ninguna requisicion para procesar";
            }*/

            if (respuesta.error == false) {

              // Objeto de ID a Enviar por Parametro
              parametros = new Object({});
              parametros.custscript_3k_aplicar_ovs_json = JSON.stringify(idOVsProcesar);

              log.debug('Aplicar Niveles Accion', 'Aplicar Niveles Accion - Parametro de órdenes de venta a Aplicar : ' + parametros.custscript_3k_aplicar_ovs_json);

              log.debug('Aplicar Niveles Accion', 'Aplicar Niveles Accion - INICIO llamada Script MAP/REDUCE');

              respuesta = createAndSubmitMapReduceJob('customscript_3k_niveles_accion_ov_mr', parametros);

              var mensajeEstado = "";
              if (!utilities.isEmpty(respuesta) && !utilities.isEmpty(respuesta.estado)) {
                mensajeEstado = respuesta.estado.status;
              }

              log.debug('Aplicar Niveles Accion', 'Aplicar Niveles Accion - /REDUCE - Estado : ' + mensajeEstado);

            }
          } else {
            respuesta.error = true;
            respuesta.mensaje = "No se pudo obtener registros de la sublista de órdenes de venta a procesar";
          }
        } else {
          respuesta.error = true;
          respuesta.mensaje = "No se pudo obtener sublista de órdenes de venta a procesar";
        }

      } catch (excepcion) {
        respuesta.error = true;
        respuesta.mensaje = "Excepcion Consultando Órdenes de Venta A Procesar - Excepcion : " + excepcion.message;

        log.error('Aplicar Niveles Accion', 'Consulta Órdenes de Venta A Procesar - Excepcion Consultando Órdenes de Venta A Procesar - Excepcion : ' + excepcion.message);
      }
      log.audit('Aplicar Niveles Accion', 'FIN Consulta Órdenes de Venta A Procesar');
      return respuesta;
    }

    function cargarLineasOV(sublist, request) {
      log.audit('Aplicar Niveles de Acción OV', 'INICIO Busqueda Órdenes de Venta');
      var respuesta = new Object();
      respuesta.error = false;
      respuesta.mensaje = "";

      try {

        var separadorMultiSelect = /\u0005/;
        var params = [];
        /*var ovNivelAccion = search.load({
            id: 'customsearch_3k_ov_asignar_niveles_acc'
        });

        if (!utilities.isEmpty(request.parameters.idordendetalle)) {
            var ordenesSeleccionadas = request.parameters.idordendetalle.split(separadorMultiSelect);
            if (!utilities.isEmpty(ordenesSeleccionadas) && ordenesSeleccionadas.length > 0) {
                var filtroOrden = search.createFilter({
                    name: 'custrecord_3k_cupon_id_orden',
                    operator: search.Operator.ANYOF,
                    values: ordenesSeleccionadas
                });

                ovNivelAccion.filters.push(filtroOrden);
            }
        }

        if (!utilities.isEmpty(request.parameters.retiro)) {
            var retiroSeleccionadas = request.parameters.retiro.split(separadorMultiSelect);
            if (!utilities.isEmpty(retiroSeleccionadas) && retiroSeleccionadas.length > 0) {
                var filtroRetiro = search.createFilter({
                    name: 'custrecord_3k_cupon_lugar_retiro',
                    operator: search.Operator.ANYOF,
                    values: retiroSeleccionadas
                });

                ovNivelAccion.filters.push(filtroRetiro);
            }

        }*/
        if (!utilities.isEmpty(request.parameters.fechaentregadesde)) {
          var fechaEDesde = request.parameters.fechaentregadesde;
          if (!utilities.isEmpty(fechaEDesde) && fechaEDesde.length > 0) {
            log.debug('fechaEDesde', fechaEDesde);
            var filtroFechaEDesde = {
              name: 'custcol_3k_fecha_entrega',
              operator: 'ONORAFTER',
              values: fechaEDesde
            };
            log.debug('filtroFechaEDesde', filtroFechaEDesde);
            params.push(filtroFechaEDesde);
          }

        }
        if (!utilities.isEmpty(request.parameters.fechaentregahasta)) {
          var fechaEHasta = request.parameters.fechaentregahasta;
          log.debug('fechaEHasta', fechaEHasta);
          if (!utilities.isEmpty(fechaEHasta) && fechaEHasta.length > 0) {
            var filtroFechaEHasta = {
              name: 'custcol_3k_fecha_entrega',
              operator: 'ONORBEFORE',
              values: fechaEHasta
            };
            log.debug('filtroFechaEHasta', filtroFechaEHasta);
            params.push(filtroFechaEHasta);
          }

        }
        if (!utilities.isEmpty(request.parameters.ordenventa)) {
          var ordenventaSeleccionados = request.parameters.ordenventa.split(separadorMultiSelect);
          if (!utilities.isEmpty(ordenventaSeleccionados) && ordenventaSeleccionados.length > 0) {
            var filtroOrdenVenta = {
              name: 'internalid',
              operator: 'ANYOF',
              values: ordenventaSeleccionados
            };
            log.debug('filtroOrdenVenta', filtroOrdenVenta);
            params.push(filtroOrdenVenta);
          }

        }

        if (!utilities.isEmpty(request.parameters.articulo)) {
          var articulosSeleccionados = request.parameters.articulo.split(separadorMultiSelect);
          if (!utilities.isEmpty(articulosSeleccionados) && articulosSeleccionados.length > 0) {
            var filtroArticulo = {
              name: 'item',
              operator: 'ANYOF',
              values: articulosSeleccionados
            };
            log.debug('filtroArticulo', filtroArticulo);
            params.push(filtroArticulo);
          }

        }

        if (!utilities.isEmpty(request.parameters.ordencompra)) {
          var ordencompraSeleccionados = request.parameters.ordencompra.split(separadorMultiSelect);
          if (!utilities.isEmpty(ordencompraSeleccionados) && ordencompraSeleccionados.length > 0) {
            var filtroOrdenCompra = {
              name: 'custrecord_3k_req_compra_oc',
              operator: 'ANYOF',
              values: ordencompraSeleccionados,
              join: 'custrecord_3k_req_compra_ov'
            };
            log.debug('filtroOrdenCompra', filtroOrdenCompra);
            params.push(filtroOrdenCompra);
          }

        }


        log.debug('Aplicar Niveles de Acción OV', 'INICIO Busqueda Órdenes de Venta');

        var ss = utilities.searchSavedPro('customsearch_3k_ov_asignar_niveles_acc', params);
        var ssOV = {
          result: ss.objRsponseFunction.result,
          columns: ss.objRsponseFunction.search.columns
        };

        log.debug('Aplicar Niveles de Acción OV', 'FIN Busqueda Órdenes de Venta');

        //var j = 0;

        if (!utilities.isEmpty(ssOV.result) && ssOV.result.length > 0) {
          log.debug('Aplicar Niveles de Acción OV', 'FIN Busqueda Órdenes de Venta - Cantidad Registros Encontrados : ' + ssOV.result.length);

          var idUnico = 0;
          var idUnicoAnterior = 0;
          var idInternosTotal = [];

          //var i = 0;
          for (var j = 0; j < ssOV.result.length; j++) {

            var idProveedor = ssOV.result[j].getValue({
              name: ssOV.columns[0]
            });

            var idLinea = ssOV.result[j].getValue({
              name: ssOV.columns[1]
            });
            var idArticulo = ssOV.result[j].getValue({
              name: ssOV.columns[2]
            });

            var descripcion = ssOV.result[j].getValue({
              name: ssOV.columns[3]
            });

            var idInternoOV = ssOV.result[j].getValue({
              name: ssOV.columns[4]
            });

            var idInternoOC = ssOV.result[j].getValue({
              name: ssOV.columns[5]
            });

            var fechaPedido = ssOV.result[j].getValue({
              name: ssOV.columns[6]
            });

            var fechaEntrega = ssOV.result[j].getValue({
              name: ssOV.columns[7]
            });


            var fechaCliente = ssOV.result[j].getValue({
              name: ssOV.columns[8]
            });

            var nivelAccionVigente = ssOV.result[j].getValue({
              name: ssOV.columns[9]
            });

            var nivelesAccionAplicados = ssOV.result[j].getValue({
              name: ssOV.columns[10]
            });

            if (!utilities.isEmpty(idProveedor)) {
              sublist.setSublistValue({
                id: 'proveedor',
                line: j,
                value: idProveedor
              });
            }

            if (!utilities.isEmpty(idLinea)) {
              sublist.setSublistValue({
                id: 'idlinea',
                line: j,
                value: idLinea
              });
            }

            if (!utilities.isEmpty(idArticulo)) {
              sublist.setSublistValue({
                id: 'articulo',
                line: j,
                value: idArticulo
              });
            }

            if (!utilities.isEmpty(descripcion)) {
              sublist.setSublistValue({
                id: 'descripcion',
                line: j,
                value: descripcion
              });
            }
            //SIEMPRE SE COMPLETA EL ID DE LA OV
            //if (!utilities.isEmpty(idInternoOV)) { 

            sublist.setSublistValue({
              id: 'ordenventa',
              line: j,
              value: idInternoOV
            });
            //}

            if (!utilities.isEmpty(idInternoOC)) {
              sublist.setSublistValue({
                id: 'ordencompra',
                line: j,
                value: idInternoOC
              });
            }

            if (!utilities.isEmpty(fechaPedido)) {

              sublist.setSublistValue({
                id: 'fecha',
                line: j,
                value: fechaPedido
              });
            }

            if (!utilities.isEmpty(fechaEntrega)) {

              sublist.setSublistValue({
                id: 'fechaentrega',
                line: j,
                value: fechaEntrega
              });
            }


            if (!utilities.isEmpty(fechaCliente)) {

              sublist.setSublistValue({
                id: 'fechacliente',
                line: j,
                value: fechaCliente
              });
            }

            if (!utilities.isEmpty(nivelAccionVigente)) {

              sublist.setSublistValue({
                id: 'nivelaccionvigente',
                line: j,
                value: nivelAccionVigente
              });
            }

            if (!utilities.isEmpty(nivelesAccionAplicados)) {

              sublist.setSublistValue({
                id: 'nivelesaplicados',
                line: j,
                value: nivelesAccionAplicados
              });
            }
            /*
            sublist.setSublistValue({
              id: 'idinterno',
              line: j,
              value: idInterno
            });
            
            if (!utilities.isEmpty(fechaPickUp)) {

              sublist.setSublistValue({
                id: 'fechapickup',
                line: j,
                value: fechaPickUp
              });
            }
            if (!utilities.isEmpty(nivelAccionVigente)) {

                sublist.setSublistValue({
                    id: 'nivelaccionvigente',
                    line: j,
                    value: nivelAccionVigente
                });
            }

            if (!utilities.isEmpty(nroAplicados)) {

                sublist.setSublistValue({
                    id: 'nivelesaplicados',
                    line: j,
                    value: nroAplicados
                });
            }

            if (!utilities.isEmpty(skuProveedor)) {

                sublist.setSublistValue({
                    id: 'skuproveedor',
                    line: j,
                    value: skuProveedor
                });
            }

            if (!utilities.isEmpty(descripcion)) {

                sublist.setSublistValue({
                    id: 'descripcion',
                    line: j,
                    value: descripcion
                });
            }*/

            /*sublist.setSublistValue({
                id: 'nivelaccion',
                line: j,
                value: ''
            });*/

            /*sublist.setSublistValue({
                id: 'cantidadcambios',
                line: j,
                value: '0'
            });*/



            //j++;
          } //for

          //form.defaultValue = idInternosTotal.toString();
        } //if
        else {
          respuesta.error = true;
          respuesta.mensaje = "No se encontraron Órdenes de venta ";
          log.audit('Aplicar Niveles de Accion', 'FIN Busqueda Órdenes de Venta - No se encontraron Órdenes de venta ');
        }
      } catch (excepcion) {
        respuesta.error = true;
        respuesta.mensaje = "Excepcion Consultando Órdenes de venta  - Excepcion : " + excepcion.message;
        log.error('Aplicar Niveles de Accion', 'Busqueda Órdenes de Venta - Excepcion : ' + excepcion.message);
      }

      log.audit('Aplicar Niveles de Accion', 'FIN Consulta Órdenes de venta ');
      return respuesta;
    }

    function createAndSubmitMapReduceJob(idScript, parametros) {
      log.audit('Aplicar Niveles Accion', 'INICIO Invocacion Script MAP/REDUCE');
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
        log.error('Aplicar Niveles Accion', 'Aplicar Niveles Accion - Excepcion Invocando A Script MAP/REDUCE - Excepcion : ' + excepcion.message);
      }
      log.audit('Aplicar Niveles Accion', 'FIN Invocacion Script MAP/REDUCE');
      return respuesta;
    }

    return {
      onRequest: onRequest
    };

  });
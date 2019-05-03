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
      log.audit('Generacion Pagos Servicios', 'INICIO Proceso - Metodo : ' + context.request.method + ' Empresa : ' + context.request.parameters.empresa + ' Fecha Inicio : ' + context.request.parameters.fechaInicio + ' Fecha Fin : ' + context.request.parameters.fechafin);

      try {

        var form = serverWidget.createForm({
          title: 'Pago de Servicios'
        });

        //form.clientScriptFileId = 6026;
        form.clientScriptModulePath = './3K - Generacion de Pagos de Servicios (Cliente).js'

        var grupoFiltros = form.addFieldGroup({
          id: 'filtros',
          label: 'Criterios de Busqueda'
        });
        if (!utilities.isEmpty(context.request.parameters.submitter)) {
          var grupoPago = form.addFieldGroup({
            id: 'infopago',
            label: 'Informacion Pago'
          });
        }
        var grupoDatos = form.addFieldGroup({
          id: 'infoComisiones',
          label: 'Informacion Comisiones A Pagar'
        });

        var tabDetalle = form.addTab({
          id: 'tabdetalle',
          label: 'Detalle'
        });

        var subtabCustInvc = form.addSubtab({
          id: 'tabcustinvc',
          label: 'Facturas Cliente',
          tab: 'tabdetalle'
        });
        var subtabCustCred = form.addSubtab({
          id: 'tabcustcred',
          label: 'NC Cliente',
          tab: 'tabdetalle'
        });
        var subTabVendBill = form.addSubtab({
          id: 'tabvendbill',
          label: 'Facturas Proveedor',
          tab: 'tabdetalle'
        });
        var subTabVendCred = form.addSubtab({
          id: 'tabvendcred',
          label: 'NC Proveedor',
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
        var sitioWeb = form.addField({
          id: 'sitioweb',
          label: 'Sitio Web',
          type: serverWidget.FieldType.MULTISELECT,
          source: 'customrecord_cseg_3k_sitio_web_o',
          container: 'filtros'
        });

        if (!utilities.isEmpty(context.request) && !utilities.isEmpty(context.request.parameters.sitioweb)) {
          sitioWeb.defaultValue = context.request.parameters.sitioweb;
        }

        var empresa = form.addField({
          id: 'empresa',
          label: 'Empresa Proveedor',
          type: serverWidget.FieldType.MULTISELECT,
          source: 'vendor',
          container: 'filtros'
        });

        if (!utilities.isEmpty(context.request) && !utilities.isEmpty(context.request.parameters.sitioweb)) {
          empresa.defaultValue = context.request.parameters.empresa;
        }

        var fechaInicio = form.addField({
          id: 'fechainicio',
          label: 'Fecha Desde',
          type: serverWidget.FieldType.DATE,
          container: 'filtros'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN
        });
        //fechaInicio.isMandatory = true;

        var fechaFin = form.addField({
          id: 'fechafin',
          label: 'Fecha Hasta',
          type: serverWidget.FieldType.DATE,
          container: 'filtros'
        });
        fechaFin.isMandatory = true;

        // Por defecto la Fecha Actual
        var fechaServidor = new Date();

        var fechaLocal = format.format({
          value: fechaServidor,
          type: format.Type.DATE,
          timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
        });

        var fechaLocalDate = format.parse({
          value: fechaLocal,
          type: format.Type.DATE,
          timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
        });

        if (!utilities.isEmpty(context.request.parameters.fechafin)) {
          fechaFin.defaultValue = context.request.parameters.fechafin;
        } else {
          if (!utilities.isEmpty(fechaLocal)) {
            //fechaInicio.defaultValue = fechaLocal;
            fechaFin.defaultValue = fechaLocal;
          }
        }

        /*var enviarEmailProveedor = form.addField({
            id: 'enviaremail',
            label: 'Enviar Factura Comision por Email',
            type: serverWidget.FieldType.CHECKBOX,
            container: 'filtros'
        });
        enviarEmailProveedor.defaultValue = 'T';*/

        // FIN FILTROS

        // INICIO DATOS PAGO
        if (!utilities.isEmpty(context.request.parameters.submitter)) {
          var formaPago = form.addField({
            id: 'formapago',
            label: 'Forma de Pago',
            type: serverWidget.FieldType.SELECT,
            source: 'customrecord_3k_forma_de_pago',
            container: 'infopago'
          });

          if (!utilities.isEmpty(context.request.parameters.formapago)) {
            formaPago.defaultValue = context.request.parameters.formapago;
          }

          var formularioImpresion = form.addField({
            id: 'formimp',
            label: 'Formulario Impresion Cheques',
            type: serverWidget.FieldType.SELECT,
            source: 'customlist3k_formulario_de_impresion',
            container: 'infopago'
          });

          if (!utilities.isEmpty(context.request.parameters.formimp)) {
            formularioImpresion.defaultValue = context.request.parameters.formimp;
          }

          var fechaDiferida = form.addField({
            id: 'fechadif',
            label: 'Fecha Cheque Diferido',
            type: serverWidget.FieldType.DATE,
            container: 'infopago'
          });

          if (!utilities.isEmpty(context.request.parameters.fechadif)) {
            fechaDiferida.defaultValue = context.request.parameters.fechadif;
          }

          var imprimirCheque = form.addField({
            id: 'impcheque',
            label: 'Cheque Para Imprimir',
            type: serverWidget.FieldType.CHECKBOX,
            container: 'infopago'
          });

          if (!utilities.isEmpty(context.request.parameters.impcheque)) {
            imprimirCheque.defaultValue = context.request.parameters.impcheque;
          } else {
            imprimirCheque.defaultValue = 'T';
          }

          // INICIO CARGAR COMBO CUENTAS CONTABLES
          log.debug('GENERACION DE PAGOS DE SERVICIOS', ' CARGAR COMBO CUENTAS CONTABLES - INICIO');
          var cuentasContables = search.load({
            id: 'customsearch_3k_cuentas_proc_pago_liq'
          });
          log.debug('cuentasContables', cuentasContables);
          var resultSet = cuentasContables.run();

          var completeResultSet = null;

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
                completeResultSet = resultado;
              else
                completeResultSet = completeResultSet.concat(resultado);
            }

            // increase pointer
            resultIndex = resultIndex + resultStep;

            // once no records are returned we already got all of them
          } while (!utilities.isEmpty(resultado) && resultado.length > 0)

          var cuentaBanco = form.addField({
            id: 'cuentabanco',
            label: 'Cuenta Banco Origen',
            type: serverWidget.FieldType.SELECT,
            container: 'infopago'
          });

          cuentaBanco.isMandatory = true;

          cuentaBanco.addSelectOption({
            value: 0,
            text: ' ',
            isSelected: true
          });

          if (!utilities.isEmpty(completeResultSet) && completeResultSet.length > 0) {

            for (var i = 0; !utilities.isEmpty(completeResultSet) && completeResultSet.length > 0 && i < completeResultSet.length; i++) {
              var idCuenta = completeResultSet[i].getValue({
                name: resultSet.columns[0]
              });
              var nombreCuenta = completeResultSet[i].getValue({
                name: resultSet.columns[1]
              });

              if (!utilities.isEmpty(idCuenta) && !utilities.isEmpty(nombreCuenta)) {
                cuentaBanco.addSelectOption({
                  value: idCuenta,
                  text: nombreCuenta
                });
              } else {
                var mensaje = 'No se pudo obtener la siguiente informacion de las Cuentas Contables para cargar el combo de Cuenta Banco : ';
                if (utilities.isEmpty(idCuenta)) {
                  mensaje = mensaje + ' ID Interno de la Cuenta / ';
                }
                if (utilities.isEmpty(nombreCuenta)) {
                  mensaje = mensaje + ' Nombre de la Cuenta / ';
                }
                log.error('Generacion Pagos Servicios', 'Suitelet Generacion Pantalla - Error : ' + mensaje);
              }
            }
          } else {
            log.error('Generacion Pagos Servicios', 'Suitelet Generacion Pantalla - Error : No se Encontraron Cuentas Contables');
          }
          log.debug('GENERACION DE PAGOS DE SERVICIOS', ' CARGAR COMBO CUENTAS CONTABLES - FIN');
          // FIN CARGAR COMBO CUENTAS CONTABLES

          if (!utilities.isEmpty(context.request.parameters.cuentabanco)) {
            cuentaBanco.defaultValue = context.request.parameters.cuentabanco;
          }

          var fechaPago = form.addField({
            id: 'fechapago',
            label: 'Fecha Pago',
            type: serverWidget.FieldType.DATE,
            container: 'infopago'
          });

          if (!utilities.isEmpty(context.request.parameters.fechapago)) {
            fechaPago.defaultValue = context.request.parameters.fechapago;
          } else {
            if (!utilities.isEmpty(fechaLocal)) {
              //fechaInicio.defaultValue = fechaLocal;
              fechaPago.defaultValue = fechaLocal;
            }
          }

          //var numeroLiquidacion = form.addField({ NO ES NECESARIO: SE USABA EN EL PROCESO ANTERIOR
          //    id: 'numliq',
          //    label: 'Numero de Referencia',
          //    type: serverWidget.FieldType.TEXT,
          //    container: 'infopago'
          //});

          //if (!utilities.isEmpty(context.request.parameters.numliq)) {
          //numeroLiquidacion.defaultValue = context.request.parameters.numliq;
          //}
          //
          //if (context.request.method === 'POST') {
          //fechaPago.isMandatory = true;
          //numeroLiquidacion.isMandatory = true;
          //}

          // FIN DATOS PAGO

          ////////////////////////////////////////////////////////////////

          // INICIO CARGAR DATOS BANCARIOS PROVEEDORES
          log.debug('GENERACION DE PAGOS DE SERVICIOS', ' CARGAR DATOS BANCARIOS PROVEEDORES - INICIO');
          var informacionBancariaProveedores = new Array();

          var datosBancariosProveedores = search.load({
            id: 'customsearch_3k_datos_banc_prov_com'
          });
          log.debug('datosBancariosProveedores', datosBancariosProveedores);
          var resultSet = datosBancariosProveedores.run();

          var completeResultSetDatosBancarios = null;

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
                completeResultSetDatosBancarios = resultado;
              else
                completeResultSetDatosBancarios = completeResultSetDatosBancarios.concat(resultado);
            }

            // increase pointer
            resultIndex = resultIndex + resultStep;

            // once no records are returned we already got all of them
          } while (!utilities.isEmpty(resultado) && resultado.length > 0)

          if (!utilities.isEmpty(completeResultSetDatosBancarios) && completeResultSetDatosBancarios.length > 0) {

            for (var i = 0; !utilities.isEmpty(completeResultSetDatosBancarios) && completeResultSetDatosBancarios.length > 0 && i < completeResultSetDatosBancarios.length; i++) {
              var infoBancaria = new Object();
              infoBancaria.idProveedor = completeResultSetDatosBancarios[i].getValue({
                name: resultSet.columns[2]
              });
              infoBancaria.idMoneda = completeResultSetDatosBancarios[i].getValue({
                name: resultSet.columns[3]
              });
              infoBancaria.idBanco = completeResultSetDatosBancarios[i].getValue({
                name: resultSet.columns[4]
              });

              if (!utilities.isEmpty(infoBancaria.idProveedor) && !utilities.isEmpty(infoBancaria.idMoneda) && !utilities.isEmpty(infoBancaria.idBanco)) {
                informacionBancariaProveedores.push(infoBancaria);
              }
            }
          }

          var bancoProv = form.addField({
            id: 'bancoprov',
            label: 'Banco Pago A Proveedor',
            type: serverWidget.FieldType.SELECT,
            source: 'customrecord_3k_bancos',
            container: 'infopago'
          });

          if (!utilities.isEmpty(context.request.parameters.bancoprov)) {
            bancoProv.defaultValue = context.request.parameters.bancoprov;
          }

          log.debug('GENERACION DE PAGOS DE SERVICIOS', ' CARGAR DATOS BANCARIOS PROVEEDORES - FIN');
          //var bancoEmisorPago = form.addField({
          //id: 'bancoemisorpago',
          //label: 'Banco Emisor Pago',
          //type: serverWidget.FieldType.SELECT,
          //source: 'customrecord_3k_bancos',
          //container: 'infopago'
          //});
          //
          //if (!utilities.isEmpty(context.request.parameters.bancoemisorpago)) {
          //bancoEmisorPago.defaultValue = context.request.parameters.bancoemisorpago;
          //}
          //bancoEmisorPago.isMandatory = true;
          // FIN CARGAR DATOS BANCARIOS PROVEEDORES


          //INICIO - CARGAR LISTADO DE BANCOS EMISORES DE PAGO****************************
          //var dataBancoEmisor = search.load({
          //id: 'customsearch_3k_banco_emisor_pago_prov'
          //});
          //log.audit('dataBancoEmisor', dataBancoEmisor);
          //var resultSet = dataBancoEmisor.run();
          //var completeResultSet = null;
          //var resultIndex = 0;
          //var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
          //var resultado; // temporary variable used to store the result set
          //do {
          //resultado = resultSet.getRange({
          //start: resultIndex,
          //end: resultIndex + resultStep
          //});
          //
          //if (!utilities.isEmpty(resultado) && resultado.length > 0) {
          //if (resultIndex == 0)
          //completeResultSet = resultado;
          //else
          //completeResultSet = completeResultSet.concat(resultado);
          //}
          //
          //// increase pointer
          //resultIndex = resultIndex + resultStep;
          //// once no records are returned we already got all of them
          //} while (!utilities.isEmpty(resultado) && resultado.length > 0)
          //
          //if (!utilities.isEmpty(completeResultSet)) {
          //var i = 0;
          //while (!utilities.isEmpty(completeResultSet) && completeResultSet.length > 0 && i < completeResultSet.length) {
          //var idBanco = completeResultSet[i].getValue({
          //name: resultSet.columns[0]
          //});
          //
          //var nameBanco = completeResultSet[i].getValue({
          //name: resultSet.columns[1]
          //});
          //
          //bancoEmisorPago.addSelectOption({
          //value: idBanco,
          //text: nameBanco
          //});
          //i++;
          //}
          //}
          //FIN - CARGAR LISTADO DE BANCOS EMISORES DE PAGO****************************

        }
        //////////////////////////////////////////////////////////////////

        // INICIO SUBLISTAS
        var sublistComisionesCustInvc = form.addSublist({
          id: 'comisiones_custinvc',
          type: serverWidget.SublistType.LIST,
          label: 'FC de Comisiones Pendientes de Cobrar',
          tab: 'tabcustinvc'
        });
        var sublistComisionesCustCred = form.addSublist({
          id: 'comisiones_custcred',
          type: serverWidget.SublistType.LIST,
          label: 'NC de Comisiones Pendientes de Cobrar',
          tab: 'tabcustcred'
        });
        var sublistComisionesVendBill = form.addSublist({
          id: 'comisiones_vendbill',
          type: serverWidget.SublistType.LIST,
          label: 'FC de Comisiones Pendientes de Pagar',
          tab: 'tabvendbill'
        });
        var sublistComisionesVendCred = form.addSublist({
          id: 'comisiones_vendcred',
          type: serverWidget.SublistType.LIST,
          label: 'NC de Comisiones Pendientes de Pagar',
          tab: 'tabvendcred'
        });
        var sublistas = {
          custinvc: sublistComisionesCustInvc,
          custcred: sublistComisionesCustCred,
          vendbill: sublistComisionesVendBill,
          vendcred: sublistComisionesVendCred
        };
        var tipoSublista = ['custinvc', 'custcred', 'vendbill', 'vendcred'];
        for (var i = 0; i < 4; i++) {
          sublistas[tipoSublista[i]].addField({
            id: 'procesar_' + tipoSublista[i],
            label: 'Procesar',
            type: serverWidget.FieldType.CHECKBOX
          }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY
          });

          sublistas[tipoSublista[i]].addField({
            id: 'ulid_' + tipoSublista[i],
            label: 'ULID Servicios',
            type: serverWidget.FieldType.TEXT
          }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
          });

          sublistas[tipoSublista[i]].addField({
            id: 'id_' + tipoSublista[i],
            label: 'Documento',
            type: serverWidget.FieldType.SELECT,
            source: 'transaction'
          }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
          });

          sublistas[tipoSublista[i]].addField({
            id: 'fecha_' + tipoSublista[i],
            label: 'Fecha',
            type: serverWidget.FieldType.TEXT
          }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
          });

          sublistas[tipoSublista[i]].addField({
            id: 'empresa_' + tipoSublista[i],
            label: 'Empresa',
            type: serverWidget.FieldType.SELECT,
            source: 'vendor'
          }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
          });

          sublistas[tipoSublista[i]].addField({
            id: 'moneda_' + tipoSublista[i],
            type: serverWidget.FieldType.SELECT,
            label: 'Moneda',
            source: 'currency'
          }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
          });

          sublistas[tipoSublista[i]].addField({
            id: 'sitio_' + tipoSublista[i],
            type: serverWidget.FieldType.SELECT,
            label: 'Sitio Web',
            source: 'customrecord_cseg_3k_sitio_web_o'
          }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
          });

          sublistas[tipoSublista[i]].addField({
            id: 'importe_' + tipoSublista[i],
            type: serverWidget.FieldType.CURRENCY,
            label: 'Importe'
          }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
          });

          sublistas[tipoSublista[i]].addMarkAllButtons();
        }
        // FIN SUBLISTAS

        form.addSubmitButton({
          label: 'Buscar Comisiones Pendientes de Pago'
        });

        form.addButton({
          id: 'custpage_btgenpagoliq',
          label: 'Generar Pagos de Comisiones',
          functionName: "generarPagos"
        });

        var infoResultado = form.addField({
          id: 'custpage_resultado',
          label: 'Resultados',
          type: serverWidget.FieldType.INLINEHTML
        });

        if (context.request.method === 'GET') {
          log.audit('Generacion Pagos Servicios', 'FIN Proceso');
          context.response.writePage(form);
        } else {
          var sAccion = utilities.isEmpty(context.request.parameters.custpage_accion) ? context.request.parameters.submitter : context.request.parameters.custpage_accion;

          switch (sAccion) {
            case 'GENERARPAGO':
              var mensaje = "Se proceso su solicitud. Recibira una notificacion al finalizar por email";
              var resultado = generarPagos(sublistas, context.request);
              if (!utilities.isEmpty(resultado) && resultado.error == true) {
                mensaje = resultado.mensaje;
                log.error('Generacion Pagos Servicios', 'Error Consulta Comisiones A Procesar - Error : ' + mensaje);
              }
              infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
              log.audit('Generacion Pagos Servicios', 'FIN Proceso');
              context.response.writePage(form);
              break;
            case 'Buscar Comisiones Pendientes de Pago':
              var resultado = cargarPendientes(sublistas, context.request, informacionBancariaProveedores);
              if (!utilities.isEmpty(resultado) && resultado.error == true) {
                var mensaje = resultado.mensaje;
                log.error('Generacion Pagos Servicios', 'Error Consulta Comisiones Pendientes - Error : ' + mensaje);
                infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
              }
              log.audit('Generacion Pagos Servicios', 'FIN Proceso');
              context.response.writePage(form);
              break;
          }
        }
      } catch (excepcion) {
        log.error('Generacion Pagos Servicios', 'Excepcion Proceso Generacion de Pagos de Comisiones de Servicios - Excepcion : ' + excepcion.message);
      }
    }

    function cargarPendientes(sublistas, request, informacionBancariaProveedores) {
      log.audit('Generacion Pagos Servicios', 'INICIO Consulta Comisiones Pendientes');
      var respuesta = new Object();
      respuesta.error = false;
      respuesta.mensaje = "";

      try {

        var separadorMultiSelect = /\u0005/;
        var ssParams = [];
        var comisionesPendientesCobrarSearch = search.load('customsearch_3k_comisiones_pend_cobro');
        var comisionesPendientesPagarSearch = search.load('customsearch_3k_comisiones_pend_pago');

        //if (!utilities.isEmpty(request.parameters.cuentabanco)) {
        //var objRecord = record.load({
        //type: record.Type.ACCOUNT,
        //id: request.parameters.cuentabanco,
        //isDynamic: true
        //});
        //
        //var monedaCuenta = objRecord.getValue({
        //fieldId: 'currency'
        //});
        //
        //if (!utilities.isEmpty(monedaCuenta)) {
        //var filtroMoneda = search.createFilter({
        //name: 'custrecord_3k_liq_emp_moneda',
        //operator: search.Operator.ANYOF,
        //values: monedaCuenta
        //});
        //
        //comisionesPendientes.filters.push(filtroMoneda);
        //
        //}
        //}

        if (!utilities.isEmpty(request.parameters.sitioweb)) {
          var sitiosSeleccionados = request.parameters.sitioweb.split(separadorMultiSelect);
          if (!utilities.isEmpty(sitiosSeleccionados) && sitiosSeleccionados.length > 0) {
            var filtroSitio = search.createFilter({
              name: 'custbody_cseg_3k_sitio_web_o',
              operator: 'ANYOF',
              values: sitiosSeleccionados
            });

            ssParams.push(filtroSitio);

          }
        }

        if (!utilities.isEmpty(request.parameters.empresa)) {
          var empresasSeleccionadas = request.parameters.empresa.split(separadorMultiSelect);
          if (!utilities.isEmpty(empresasSeleccionadas) && empresasSeleccionadas.length > 0) {
            var clientesRelacionados = obtenerClientesRelacionados(empresasSeleccionadas);
            var filtroEmpresaP = search.createFilter({
              name: 'entity',
              operator: 'ANYOF',
              values: empresasSeleccionadas
            });
            var filtroEmpresaC = search.createFilter({
              name: 'entity',
              operator: 'ANYOF',
              values: clientesRelacionados
            });

            comisionesPendientesCobrarSearch.filters.push(filtroEmpresaC);
            comisionesPendientesPagarSearch.filters.push(filtroEmpresaP);

          }
        }

        if (!utilities.isEmpty(request.parameters.fechainicio)) {
          var filtroFechaInicio = search.createFilter({
            name: 'trandate',
            operator: 'ONORAFTER',
            values: request.parameters.fechainicio
          });

          ssParams.push(filtroFechaInicio);

        }

        if (!utilities.isEmpty(request.parameters.fechafin)) {
          var filtroFechaFin = search.createFilter({
            name: 'trandate',
            operator: 'ONORBEFORE',
            values: request.parameters.fechafin
          });

          ssParams.push(filtroFechaFin);

        }
        log.debug('ssParams', ssParams);

        comisionesPendientesCobrarSearch.filters = comisionesPendientesCobrarSearch.filters.concat(ssParams);
        comisionesPendientesPagarSearch.filters = comisionesPendientesPagarSearch.filters.concat(ssParams);

        // INICIO - Consulta Comisiones Pendientes
        log.debug('Generacion Pagos Servicios', 'INICIO Consulta Busqueda Comisiones Pendientes');

        var ssComCobrar = correrSearch(comisionesPendientesCobrarSearch);

        var ssComPagar = correrSearch(comisionesPendientesPagarSearch);
        log.debug('Generacion Pagos Servicios', 'FIN Consulta Busqueda Comisiones Pendientes');
        var lineasVenta = (ssComCobrar.result == null) ? 0 : ssComCobrar.result.length;
        var lineasCompra = (ssComPagar.result == null) ? 0 : ssComPagar.result.length;
        if (!utilities.isEmpty(ssComCobrar.result) || !utilities.isEmpty(ssComPagar.result)) {
          log.debug('Generacion Pagos Servicios', 'FIN Consulta Busqueda Comisiones Pendientes - Cantidad Registros Encontrados : ' + (lineasVenta + lineasCompra));

          var indiceSublista = {
            custinvc: 0,
            custcred: 0,
            vendbill: 0,
            vendcred: 0
          };
          for (var i = 0, j = 0; (lineasCompra + lineasVenta) > 0 && i < (lineasCompra + lineasVenta); i++) {
            if (i >= lineasVenta) {
              if (i == lineasVenta) {
                j = 0;
              }
              var ss = ssComPagar;
            } else {
              var ss = ssComCobrar;
            }
            var idInterno = ss.result[j].getValue({
              name: ss.columns[0]
            });

            var ulid = ss.result[j].getValue({
              name: ss.columns[7]
            });

            var tipoDoc = ss.result[j].getValue({
              name: ss.columns[1]
            }).toLowerCase();

            var fecha = ss.result[j].getValue({
              name: ss.columns[2]
            });

            var idEmpresa = ss.result[j].getValue({
              name: ss.columns[3]
            });

            var idMoneda = ss.result[j].getValue({
              name: ss.columns[4]
            });

            var sitio = ss.result[j].getValue({
              name: ss.columns[5]
            });

            var importe = ss.result[j].getValue({
              name: ss.columns[6]
            });

            var incluirEnsublista = true;

            //EXCLUIDO: AL MOMENTO DE CONSULTAR NO HAY CAMPO BANCOPROV
            //if (!utilities.isEmpty(request.parameters.bancoprov)) {
            //if (!utilities.isEmpty(informacionBancariaProveedores) && informacionBancariaProveedores.length > 0) {
            //var objDetalleBancario = informacionBancariaProveedores.filter(function (obj) {
            //return (obj.idProveedor == idEmpresa && obj.idMoneda == idMoneda && obj.idBanco == request.parameters.bancoprov);
            //});
            //if (!utilities.isEmpty(objDetalleBancario) && objDetalleBancario.length > 0) {
            //incluirEnsublista = true;
            //} else {
            //incluirEnsublista = false;
            //}
            //} else {
            //incluirEnsublista = false;
            //}
            //}

            if (incluirEnsublista == true) {

              sublistas[tipoDoc].setSublistValue({
                id: 'id_' + tipoDoc,
                line: indiceSublista[tipoDoc],
                value: idInterno
              });


              sublistas[tipoDoc].setSublistValue({
                id: 'fecha_' + tipoDoc,
                line: indiceSublista[tipoDoc],
                value: fecha
              });

              sublistas[tipoDoc].setSublistValue({
                id: 'ulid_' + tipoDoc,
                line: indiceSublista[tipoDoc],
                value: ulid
              });

              if (!utilities.isEmpty(idEmpresa)) {
                sublistas[tipoDoc].setSublistValue({
                  id: 'empresa_' + tipoDoc,
                  line: indiceSublista[tipoDoc],
                  value: idEmpresa
                });
              }

              if (!utilities.isEmpty(idMoneda)) {
                sublistas[tipoDoc].setSublistValue({
                  id: 'moneda_' + tipoDoc,
                  line: indiceSublista[tipoDoc],
                  value: idMoneda
                });
              }

              sublistas[tipoDoc].setSublistValue({
                id: 'importe_' + tipoDoc,
                line: indiceSublista[tipoDoc],
                value: importe
              });

              if (!utilities.isEmpty(sitio)) {

                sublistas[tipoDoc].setSublistValue({
                  id: 'sitio_' + tipoDoc,
                  line: indiceSublista[tipoDoc],
                  value: sitio
                });

              }

              //if (!utilities.isEmpty(informacionPago)) {
              //sublistas[tipoDoc].setSublistValue({
              //id: 'informaci+tipoDoconpago',
              //line: indiceSublista[tipoDoc],
              //value: informacionPago
              //});
              //}
              indiceSublista[tipoDoc]++;
              j++;

            }

          } //for
        } //if

        // FIN - Consulta Comisiones Pendientes

        if (lineasVenta == 0 && lineasCompra == 0) {
          respuesta.error = true;
          respuesta.mensaje = "No se encontraron Comisiones Pendientes";
          log.audit('Generacion Pagos Servicios', 'FIN Consulta Busqueda Comisiones Pendientes - No se encontraron Comisiones Pendientes');
        }

      } catch (excepcion) {
        log.error('Excepcion Consultando Comisiones Pendientes',excepcion);
        respuesta.error = true;
        respuesta.mensaje = "Excepcion Consultando Comisiones Pendientes - Excepcion : " + excepcion.message;
        log.error('Generacion Pagos Servicios', 'Consulta Busqueda Comisiones Pendientes - Excepcion Consultando Comisiones - Excepcion : ' + excepcion.message);
      }

      log.audit('Generacion Pagos Servicios', 'FIN Consulta Comisiones Pendientes');
      return respuesta;
    }

    function correrSearch(ss) {
      var resultSet = ss.run();

      var completeResultSet = null;

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
            completeResultSet = resultado;
          else
            completeResultSet = completeResultSet.concat(resultado);
        }

        // increase pointer
        resultIndex = resultIndex + resultStep;

        // once no records are returned we already got all of them
      } while (!utilities.isEmpty(resultado) && resultado.length > 0)
      return {
        result: completeResultSet,
        columns: resultSet.columns
      };
    }

    function generarPagos(sublistAjustes, request) {
      log.audit('Generacion Pagos Servicios', 'INICIO Consulta Comisiones A Procesar');

      var idDocsProcesar = new Array();
      var existenDocumentosSeleccionados = false;
      var respuesta = new Object();
      respuesta.error = false;
      respuesta.mensaje = "";
      respuesta.estado = "";

      var nombreSublista = [
        'comisiones_custinvcdata',
        'comisiones_custcreddata',
        'comisiones_vendbilldata',
        'comisiones_vendcreddata',
      ];

      try {
        for (n = 0; n < nombreSublista.length; n++) {
          if (!utilities.isEmpty(request.parameters[nombreSublista[n]])) {
            var delimiterCampos = /\u0001/;
            var delimiterArray = /\u0002/;

            /*var enviarEmail = 'F';
            if (!utilities.isEmpty(request.parameters.enviaremail) && request.parameters.enviaremail == 'T') {
                enviarEmail = 'T';
            }*/
            log.debug('nombreSublista[n] (912)', nombreSublista[n]);

            if (!utilities.isEmpty(request.parameters[nombreSublista[n]])) {
              log.debug('request.parameters[nombreSublista[n]] (915)', request.parameters[nombreSublista[n]]);
              var sublistaComisiones = request.parameters[nombreSublista[n]].split(delimiterArray);

              if (!utilities.isEmpty(sublistaComisiones) && sublistaComisiones.length > 0) {
                var i = 0;
                log.debug('i, sublistaComisiones.length, respuesta.error (919)', i + ', ' + sublistaComisiones.length + ', ' + respuesta.error);
                for (i = 0; respuesta.error == false && i < sublistaComisiones.length; i++) {
                  if (!utilities.isEmpty(sublistaComisiones[i])) {

                    var columnas = sublistaComisiones[i].split(delimiterCampos);
                    log.debug('Columnas (924)', columnas);
                    if (!utilities.isEmpty(sublistaComisiones) && sublistaComisiones.length > 0) {
                      var procesar = columnas[0];

                      if (procesar == 'T') { //solo si esta marcado para enviar
                        existenDocumentosSeleccionados = true;

                        var idInternoComisiones = columnas[3];

                        if (!utilities.isEmpty(idInternoComisiones)) {

                          idDocsProcesar.push(idInternoComisiones);
                          log.debug('idDocsProcesar', idDocsProcesar);
                        } else {
                          //Error Obteniendo ID Interno de la Comision a procesar
                          respuesta.error = true;
                          respuesta.mensaje = "No se pudo Obtener el ID Interno de las Comisiones a procesar: " + nombreSublista[n];
                        }
                      }
                    } //else {
                      ////Error Obteniendo Columnas de Sublista
                      //respuesta.error = true;
                      //respuesta.mensaje = "No se pudo Obtener las columnas de la sublista de Comisiones a procesar: " + nombreSublista[n];
                    //}
                  } //else {
                    ////Error Obteniendo Contenido de Sublista
                    //respuesta.error = true;
                    //respuesta.mensaje = "No se pudo Obtener el contenido de la sublista de Comisiones a procesar: " + nombreSublista[n];
                  //}

                }

              } else {
                respuesta.error = true;
                respuesta.mensaje = "No se pudo obtener registros de la sublista de Comisiones a procesar";
              }
            }
          } else if ((n == (nombreSublista.length - 1)) && existenDocumentosSeleccionados == false) {
            respuesta.error = true;
            respuesta.mensaje = "No se obtuvieron los elementos a procesar";
          }
        }
        if (respuesta.error == false && existenDocumentosSeleccionados == false) {
          respuesta.error = true;
          respuesta.mensaje = "No se selecciono ninguna Comision para procesar";
        }
        if (respuesta.error == false) {

          // INCIO - Invocar Script de Pagos

          parametros = new Object();
          parametros.custscript_generar_pago_id_doc = idDocsProcesar.toString();
          parametros.custscript_generar_pagos_forma_pago = request.parameters.formapago;
          parametros.custscript_generar_pagos_fecha_pago = request.parameters.fechapago;
          parametros.custscript_generar_pagos_cta_orig = request.parameters.cuentabanco;
          parametros.custscript_generar_pagos_form_imp = request.parameters.formimp;
          parametros.custscript_generar_pagos_fecha_dif = request.parameters.fechadif;
          parametros.custscript_generar_pagos_imprimir = request.parameters.impcheque;
          parametros.custscript_generar_pagos_banco_emisor = request.parameters.bancoemisorpago;

          log.debug('Generacion Pagos Servicios', 'Generacion Pagos - ID Comisiones A Procesar : ' + parametros.custscript_generar_pago_id_doc);

          log.debug('Generacion Pagos Servicios', 'Generacion Pagos - Cuenta de Banco Origen : ' + parametros.custscript_generar_pagos_cta_orig);

          log.debug('Generacion Pagos Servicios', 'Generacion Pagos - INICIO llamada Script MAP/REDUCE');

          log.debug('Generacion Pagos Servicios', 'Parametros: ' + JSON.stringify(parametros));

          respuesta = createAndSubmitMapReduceJob('customscript_3k_generar_pago_servicio_mr', parametros);

          var mensajeEstado = "";
          if (!utilities.isEmpty(respuesta) && !utilities.isEmpty(respuesta.estado)) {
            mensajeEstado = respuesta.estado.status;
          }

          log.debug('Generacion Pagos Servicios', 'Generacion Pagos - /REDUCE - Estado : ' + mensajeEstado);

          // FIN - Invicar Script de Pagos

        }
      } catch (excepcion) {
        respuesta.error = true;
        respuesta.mensaje = "Excepcion Consultando Comisiones A Procesar - Excepcion : " + excepcion.message;

        log.error('Generacion Pagos Servicios', 'Consulta Comisiones A Procesar - Excepcion Consultando Comisiones A Procesar - Excepcion : ' + excepcion.message);
      }
      log.audit('Generacion Pagos Servicios', 'FIN Consulta Comisiones A Procesar');
      return respuesta;
    }
    function obtenerClientesRelacionados(empresasSeleccionadas){
      var clientesRelacionados = [];
      var ss = search.create({
        type: 'customer',
        filters: [
          search.createFilter({
            name: 'custentity_3k_prov_asociado',
            operator:'ANYOF',
            values: empresasSeleccionadas
          })
        ],
        columns: [
          search.createColumn({name: 'internalid'})
        ]
      });
      var ssClientes = correrSearch(ss);
      for(var z = 0; z < ssClientes.result.length; z++){
        var coincidencias = clientesRelacionados.filter(function(ids){
          return ids == ssClientes.result[z].getValue('internalid');
        });
        if (coincidencias.length == 0){
          clientesRelacionados.push(ssClientes.result[z].getValue('internalid'));
        }
      }
      return clientesRelacionados;
      
    }
    function createAndSubmitMapReduceJob(idScript, parametros) {
      log.audit('Generacion Pagos Servicios REST', 'INICIO Invocacion Script MAP/REDUCE');
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
        log.error('Generacion Pagos Servicios REST', 'Generacion Facturas Liquidaciones - Excepcion Invocando A Script MAP/REDUCE - Excepcion : ' + excepcion.message);
      }
      log.audit('Generacion Pagos Servicios REST', 'FIN Invocacion Script MAP/REDUCE');
      return respuesta;
    }
    return {
      onRequest: onRequest
    };
  });
/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NAmdConfig ./configuration.json
 *@NModuleScope Public
 */
define(['N/search', 'N/record', 'N/ui/serverWidget', 'N/format', 'N/task', '3K/utilities'],
  function (search, record, serverWidget, format, task, utilities) {

    function onRequest(context) {

      log.audit('SUITELET AUDIT', 'INICIO SUITELET')
      try {

        var form = serverWidget.createForm({
          title: 'Reembolso Servicios'
        });

        //form.clientScriptFileId = 6026;
        form.clientScriptModulePath = './3K - Reembolso Servicios (Cliente).js'

        var grupoFiltros = form.addFieldGroup({
          id: 'filtros',
          label: 'Criterios de Busqueda de Ordenes'
        });

        var grupoDatos = form.addFieldGroup({
          id: 'infodepositos',
          label: 'Informacion para Reembolso'
        });

        var tabDetalle = form.addTab({
          id: 'tabdetalle',
          label: 'Detalle'
        });

        var subTab = form.addSubtab({
          id: 'tabbusqueda',
          label: 'Ordenes',
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

        /*INICIO FILTROS*/
        var customer = form.addField({
          id: 'customer',
          label: 'Cliente',
          type: serverWidget.FieldType.SELECT,
          source: 'customer',
          container: 'filtros'
        });
        if(!utilities.isEmpty(context.request)&&!utilities.isEmpty(context.request.parameters)&&!utilities.isEmpty(context.request.parameters.customer)){
          customer.defaultValue = context.request.parameters.customer;
        }

        customer.isMandatory = true;

        var moneda = form.addField({
          id: 'moneda',
          label: 'Moneda',
          type: serverWidget.FieldType.SELECT,
          source: 'currency',
          container: 'filtros'
        });
        if(!utilities.isEmpty(context.request)&&!utilities.isEmpty(context.request.parameters)&&!utilities.isEmpty(context.request.parameters.moneda)){
          moneda.defaultValue = context.request.parameters.moneda;
        }

        moneda.isMandatory = true;

        var fechaDesde = form.addField({
          id: 'fechadesde',
          label: 'Fecha Desde',
          type: serverWidget.FieldType.DATE,
          container: 'filtros'
        });
        if(!utilities.isEmpty(context.request)&&!utilities.isEmpty(context.request.parameters)&&!utilities.isEmpty(context.request.parameters.fechadesde)){
          fechaDesde.defaultValue = context.request.parameters.fechadesde;
        }

        var infoResultado = form.addField({
          id: 'custpage_resultado',
          label: 'Resultados',
          type: serverWidget.FieldType.INLINEHTML
        });

        /*INICIO CAMPOS PARA COMPLETAR POR EL CLIENTE*/
        if (!utilities.isEmpty(context.request.parameters.submitter)) {
          var tipoCambio = form.addField({
            id: 'tipocambio',
            label: 'Tipo Cambio',
            type: serverWidget.FieldType.CURRENCY,
            container: 'infodepositos'
          });
          if(!utilities.isEmpty(context.request)&&!utilities.isEmpty(context.request.parameters)&&!utilities.isEmpty(context.request.parameters.tipoCambio)){
            tipoCambio.defaultValue = context.request.parameters.tipoCambio;
          }

          var devolucionCredito = form.addField({
            id: 'devolucioncredito',
            label: 'Devolución Crédito',
            type: serverWidget.FieldType.CHECKBOX,
            container: 'infodepositos'
          });
          if(!utilities.isEmpty(context.request)&&!utilities.isEmpty(context.request.parameters)&&!utilities.isEmpty(context.request.parameters.devolucionCredito)){
            devolucionCredito.defaultValue = context.request.parameters.devolucionCredito;
          }

          var departamento = form.addField({
            id: 'departamento',
            label: 'Departamento',
            type: serverWidget.FieldType.SELECT,
            source: 'department',
            container: 'infodepositos'
          });
          if(!utilities.isEmpty(context.request)&&!utilities.isEmpty(context.request.parameters)&&!utilities.isEmpty(context.request.parameters.departamento)){
            departamento.defaultValue = context.request.parameters.departamento;
          }

          var sitio = form.addField({
            id: 'sitio',
            label: 'Sitio',
            type: serverWidget.FieldType.SELECT,
            source: 'class',
            container: 'infodepositos'
          });
          if(!utilities.isEmpty(context.request)&&!utilities.isEmpty(context.request.parameters)&&!utilities.isEmpty(context.request.parameters.sitio)){
            sitio.defaultValue = context.request.parameters.sitio;
          }

          var sitioweb = form.addField({
            id: 'sitioweb',
            label: 'Sitio Web',
            type: serverWidget.FieldType.SELECT,
            source: 'customrecord_cseg_3k_sitio_web_o',
            container: 'infodepositos'
          });
          if(!utilities.isEmpty(context.request)&&!utilities.isEmpty(context.request.parameters)&&!utilities.isEmpty(context.request.parameters.sitioweb)){
            sitioweb.defaultValue = context.request.parameters.sitioweb;
          }

          var account = form.addField({
            id: 'account',
            label: 'Cuenta',
            type: serverWidget.FieldType.SELECT,
            source: 'account',
            container: 'infodepositos'
          });
          if(!utilities.isEmpty(context.request)&&!utilities.isEmpty(context.request.parameters)&&!utilities.isEmpty(context.request.parameters.account)){
            account.defaultValue = context.request.parameters.account;
          }

          customer.isMandatory = false;
          moneda.isMandatory = false;
        }
        /*FIN CAMPOS PARA COMPLETAR POR EL CLIENTE*/

        // INICIO SUBLISTA
        var sublist = form.addSublist({
          id: 'depositos',
          type: serverWidget.SublistType.LIST,
          label: 'Depositos Pendientes',
          tab: 'tabbusqueda'
        });

        sublist.addField({
          id: 'reembolsar',
          label: 'Reembolsar',
          type: serverWidget.FieldType.CHECKBOX
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.ENTRY
        });

        sublist.addField({
          id: 'ordenventa',
          type: serverWidget.FieldType.SELECT,
          label: 'Orden Venta',
          source: 'salesorder'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        sublist.addField({
          id: 'ulid',
          type: serverWidget.FieldType.TEXT,
          label: 'ULID Servicios'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        //sublist.addField({
          //id: 'nrodocumento',
          //type: serverWidget.FieldType.TEXT,
          //label: 'Número de Documento'
        //}).updateDisplayType({
          //displayType: serverWidget.FieldDisplayType.DISABLED
        //});

        sublist.addField({
        id: 'articulo',
        type: serverWidget.FieldType.SELECT,
        label: 'Articulo',
        source: 'item'
        }).updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED
        });

        sublist.addField({
          id: 'cliente',
          type: serverWidget.FieldType.SELECT,
          label: 'Cliente',
          source: 'customer'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        sublist.addField({
          id: 'proveedor',
          type: serverWidget.FieldType.SELECT,
          label: 'Proveedor',
          source: 'vendor'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        sublist.addField({
          id: 'importefacturar',
          type: serverWidget.FieldType.CURRENCY,
          label: 'Importe a Facturar'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        sublist.addField({
          id: 'deudapagar',
          type: serverWidget.FieldType.CURRENCY,
          label: 'Deuda a Pagar'
        }).updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        form.addSubmitButton({
          label: 'Buscar Depositos Pendientes'
        });

        form.addButton({
          id: 'custpage_btdevolver',
          label: 'Reembolsar',
          functionName: "reembolsar"
        });

        //var infoResultado = form.addField({
          //id: 'custpage_resultado',
          //label: 'Resultados',
          //type: serverWidget.FieldType.INLINEHTML
        //});

        if (context.request.method === 'GET') {
          log.audit('Generacion Reembolso Servicios', 'FIN Proceso');
          context.response.writePage(form);
        } else {
          var sAccion = utilities.isEmpty(context.request.parameters.custpage_accion) ? context.request.parameters.submitter : context.request.parameters.custpage_accion;

          switch (sAccion) {

            case 'Buscar Depositos Pendientes':
              var resultado = cargarPendientes(sublist, context.request);
              if (!utilities.isEmpty(resultado) && resultado.error == true) {
                var mensaje = resultado.mensaje;
                log.error('Generacion Reembolso Servicios', 'Error Consulta Depositos Pendientes - Error : ' + mensaje);
                infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
              }
              context.response.writePage(form);
              log.debug('sublist #253',sublist);
              log.audit('Generacion Reembolso Servicios', 'FIN Proceso');
              break;

            case 'REEMBOLSAR':
              log.debug('Funcion Reembolsar','Iniciada');
              var mensaje = "Se proceso su solicitud. Recibira una notificacion al finalizar por email";
              var resultado = generarReembolsos(sublist, context.request);
              log.debug('resultado de generarReembolsos',resultado);
              if (!utilities.isEmpty(resultado) && resultado.error == true) {
                mensaje = resultado.mensaje;
                log.error('Generacion Reembolso Servicios', 'Error Reembolsando Servicios - Error : ' + mensaje);
              }
              infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
              log.audit('Generacion Reembolso Servicios', 'FIN Proceso');
              context.response.writePage(form);
              break;

          }
        }



      } catch (e) {
        log.error('ERROR CATCH SUITELET', e.message);
      }
      log.audit('SUITELET AUDIT', 'FIN SUITELET');
    }

    function cargarPendientes(sublist, request) {
      log.audit('Generacion Reembolso Servicios', 'INICIO Consulta Servicios con Reembolsos Pendientes');
      var respuesta = new Object();
      respuesta.error = false;
      respuesta.mensaje = "";

      try {
        var separadorMultiSelect = /\u0005/;
        var ssParams = [];

        if (!utilities.isEmpty(request.parameters.customer)) {
          var customerSelect = request.parameters.customer.split(separadorMultiSelect);
          if (!utilities.isEmpty(customerSelect) && customerSelect.length > 0) {
            var filtroCliente = {
              name: 'entity',
              operator: 'ANYOF',
              values: customerSelect
            };
            ssParams.push(filtroCliente);
          }
        }

        if (!utilities.isEmpty(request.parameters.currency)) {
          var currencySelect = request.parameters.currency.split(separadorMultiSelect);
          if (!utilities.isEmpty(currencySelect) && currencySelect.length > 0) {
            var filtroMoneda = {
              name: 'currency',
              operator: 'ANYOF',
              values: currencySelect
            };
            ssParams.push(filtroMoneda);
          }
        }

        if (!utilities.isEmpty(request.parameters.fechadesde)) {
          var filtroFechaDesde = search.createFilter({
            name: 'trandate',
            operator: 'ONORAFTER',
            values: request.parameters.fechadesde
          });
          ssParams.push(filtroFechaDesde);
        }
        var ss = utilities.searchSavedPro('customsearch_reembolso_serv_ov_2', ssParams);
        log.debug('ss #321',ss);
        if(!utilities.isEmpty(ss) && ss.error == false){
          ssTrans = {
            result: ss.objRsponseFunction.result,
            columns: ss.objRsponseFunction.search.columns
          };

          for(var i = 0; i < ssTrans.result.length; i++){
            var ordenVenta = ssTrans.result[i].getValue(ssTrans.columns[0]);
            var ulid = ssTrans.result[i].getValue(ssTrans.columns[2]);
            var item = ssTrans.result[i].getValue(ssTrans.columns[3]);
            var cliente = ssTrans.result[i].getValue(ssTrans.columns[4]);
            var proveedor = ssTrans.result[i].getValue(ssTrans.columns[5]);
            var importeFacturar = ssTrans.result[i].getValue(ssTrans.columns[6]);
            var deudaPagar = ssTrans.result[i].getValue(ssTrans.columns[7]);
            //log.debug('ordenVenta',ordenVenta);
            //log.debug('ulid',ulid);
            //log.debug('item',item);
            //log.debug('cliente',cliente);
            //log.debug('proveedor',proveedor);
            //log.debug('importeFacturar',importeFacturar);
            //log.debug('deudaPagar',deudaPagar);

            sublist.setSublistValue({
              id: 'ordenventa',
              line:i,
              value: ordenVenta
            });

            sublist.setSublistValue({
              id: 'ulid',
              line: i,
              value:ulid
            });

            sublist.setSublistValue({
              id: 'articulo',
              line: i,
              value:item
            });

            sublist.setSublistValue({
              id: 'cliente',
              line: i,
              value:cliente
            });

            sublist.setSublistValue({
              id: 'proveedor',
              line: i,
              value:proveedor
            });

            sublist.setSublistValue({
              id: 'importefacturar',
              line: i,
              value:importeFacturar
            });

            sublist.setSublistValue({
              id: 'deudapagar',
              line: i,
              value:deudaPagar
            });
          }
          if(ssTrans.result.length == 0){
            respuesta.error = true;
            respuesta.mensaje = "No se encontraron Servicios con Reembolsos Pendientes";
            log.audit('Generacion Reembolso Servicios', 'FIN Consulta Busqueda Servicios con Reembolsos Pendientes - No se encontraron Servicios con Reembolsos Pendientes');
          }
        }
      } catch (excepcion) {
        log.error('Excepcion Consultando Servicios con Reembolsos Pendientes', excepcion);
        respuesta.error = true;
        respuesta.mensaje = "Excepcion Consultando Servicios con Reembolsos Pendientes - Excepcion : " + excepcion.message;
        log.error('Generacion Reembolso Servicios', 'Consulta Busqueda Servicios con Reembolsos Pendientes - Excepcion Consultando Servicios con Reembolsos - Excepcion : ' + excepcion.message);
      }
      log.audit('Generacion Reembolso Servicios', 'FIN Consulta Servicios con Reembolsos Pendientes');
      return respuesta;
    }

    function generarReembolsos(sublist, request) {
      var respuesta = {};
      respuesta.error = false;
      respuesta.mensaje = '';
      var ulidsProcesar = [];
      var existenDocsSeleccionados = false;
      try{
        var delimiterCampos = /\u0001/;
        var delimiterArray = /\u0002/;

        /*var enviarEmail = 'F';
        if (!utilities.isEmpty(request.parameters.enviaremail) && request.parameters.enviaremail == 'T') {
            enviarEmail = 'T';
        }*/
        log.debug('request.parameters.depositosdata', request.parameters.depositosdata);
        if (!utilities.isEmpty(request.parameters.depositosdata)) {
          var sublistaDepositos = request.parameters.depositosdata.split(delimiterArray);
          
          if (!utilities.isEmpty(sublistaDepositos) && sublistaDepositos.length > 0) {
            var i = 0;
            log.debug('i, sublistaDepositos.length, respuesta.error (919)', i + ', ' + sublistaDepositos.length + ', ' + respuesta.error);
            for (i = 0; respuesta.error == false && i < sublistaDepositos.length; i++) {
              if (!utilities.isEmpty(sublistaDepositos[i])) {

                var columnas = sublistaDepositos[i].split(delimiterCampos);
                log.debug('Columnas (924)', columnas);
                if (!utilities.isEmpty(columnas) && columnas.length > 0) {
                  var procesar = columnas[0];

                  if (procesar == 'T') { //solo si esta marcado para enviar
                    existenDocsSeleccionados = true;
                    var idLinea = columnas[3];
                    if (!utilities.isEmpty(idLinea)) {
                      ulidsProcesar.push(idLinea);
                      log.debug('ulidsProcesar', ulidsProcesar);
                    } else {
                      //Error Obteniendo ID Interno de la Comision a procesar
                      respuesta.error = true;
                      respuesta.mensaje = "No se pudo Obtener el ID Interno de las Líneas de OV a reembolsar.";
                    }
                  }
                } else {
                //Error Obteniendo Columnas de Sublista
                  respuesta.error = true;
                  respuesta.mensaje = "No se pudo Obtener las columnas de la sublista de Reembolsos a procesar.";
                }
              } else {
              //Error Obteniendo Contenido de Sublista
                respuesta.error = true;
                respuesta.mensaje = "No se pudo Obtener el contenido de la sublista de Reembolsos a procesar.";
              }
            }
            if (existenDocsSeleccionados == false){
              respuesta.error = true;
              respuesta.mensaje = "No se seleccionó ninguna línea para reembolsar.";
            }
          } else {
            respuesta.error = true;
            respuesta.mensaje = "No se pudo obtener registros de la sublista de Reembolsos a procesar";
          }

          if (respuesta.error == false) {
          // INCIO - Invocar Script de Reembolsos
            parametros = {};
            parametros.custscript_reembolso_serv_ulids = ulidsProcesar.toString();
            parametros.custscript_reembolso_serv_tc = request.parameters.tipoCambio;
            parametros.custscript_reembolso_serv_dev_cred = request.parameters.devolucionCredito;
            parametros.custscript_reembolso_serv_dep = request.parameters.departamento;
            parametros.custscript_reembolso_serv_sitio = request.parameters.sitio;
            parametros.custscript_reembolso_serv_sitio_web = request.parameters.sitioweb;
            parametros.custscript_reembolso_serv_cuenta = request.parameters.account;

            log.debug('Generacion Reembolsos Servicios', 'Generacion Reembolsos - ULIDs A Reembolsar : ' + parametros.custscript_reembolso_serv_ulids);

            log.debug('Generacion Reembolsos Servicios', 'Generacion Reembolsos - Cuenta : ' + parametros.custscript_reembolso_serv_cuenta);

            log.debug('Generacion Reembolsos Servicios', 'Generacion Reembolsos - INICIO llamada Script MAP/REDUCE');

            log.debug('Generacion Reembolsos Servicios', 'Parametros: ' + JSON.stringify(parametros));

            respuesta = createAndSubmitMapReduceJob('customscript_3k_reembolso_servicios_mr', parametros);

            var mensajeEstado = "";
            if (!utilities.isEmpty(respuesta) && !utilities.isEmpty(respuesta.estado)) {
              mensajeEstado = respuesta.estado.status;
            }

            log.debug('Generacion Reembolsos Servicios', 'Generacion Reembolsos - /REDUCE - Estado : ' + mensajeEstado);

            // FIN - Invicar Script de Reembolsos
          }
        }
      }catch(e){
        log.error('Error Intentando llamada al Map/Reduce',JSON.stringify(e));
        respuesta.error = true;
        respuesta.mensaje = 'Error: '+JSON.stringify(e);
      }
      return respuesta;
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
        log.error('Generacion Reembolsos Servicios', 'Generacion Asientos de Reembolso - Excepcion Invocando A Script MAP/REDUCE - Excepcion : ' + excepcion.message);
      }
      log.audit('Generacion Reembolsos Servicios', 'FIN Invocacion Script MAP/REDUCE');
      return respuesta;
    }

    return {
      onRequest: onRequest
    }
  });
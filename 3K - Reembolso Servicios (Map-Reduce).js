/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *@NAmdConfig ./configuration.json
 *@NModuleScope Public
 */

define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/format', 'N/runtime', 'N/http', 'N/file', 'N/encode', 'N/render', '3K/utilities'],
  /**
   * @param {record} record
   */
  function (search, record, email, runtime, error, format, runtime, http, file, encode, render,utilities) {
    function enviarEmail(autor, destinatario, titulo, mensaje, adjuntos) {
      log.debug('Generacion Reembolsos Servicios', 'SUMMARIZE - INICIO ENVIO EMAIL - ID AUTOR : ' + autor + ' - ID DESTINATARIO : ' + destinatario + ' - TITULO : ' + titulo + ' - MENSAJE : ' + mensaje);

      if (!utilities.isEmpty(autor) && !utilities.isEmpty(destinatario) && !utilities.isEmpty(titulo) && !utilities.isEmpty(mensaje)) {
        log.debug('Proceso de Envio de mail', 'Enviando');
        attachments = adjuntos || undefined;
        email.send({
          author: autor,
          recipients: destinatario,
          subject: titulo,
          body: mensaje,
          attachments: attachments
        });
        log.debug('Proceso de Envio de mail', 'Enviado');
      } else {
        var detalleError = 'No se recibio la siguiente informacion necesaria para realizar el envio del Email : ';
        if (utilities.isEmpty(autor)) {
          detalleError = detalleError + ' ID del Autor del Email / ';
        }
        if (utilities.isEmpty(destinatario)) {
          detalleError = detalleError + ' ID del Destinatario del Email / ';
        }
        if (utilities.isEmpty(titulo)) {
          detalleError = detalleError + ' ID del Titulo del Email / ';
        }
        if (utilities.isEmpty(mensaje)) {
          detalleError = detalleError + ' ID del Mensaje del Email / ';
        }
        log.error('Generacion Reembolsos Servicios', 'SUMMARIZE - Error Envio Email - Error : ' + detalleError);
      }
      log.debug('Generacion Reembolsos Servicios', 'SUMMARIZE - FIN ENVIO EMAIL');
    }

    function handleErrorAndSendNotification(e, stage) {
      log.error('Estado : ' + stage + ' Error', e);

      var author = runtime.getCurrentUser().id;
      var recipients = runtime.getCurrentUser().id;
      var subject = 'Proceso de Pago Comisiones de Servicios ' + runtime.getCurrentScript().id + ' Error en Estado : ' + stage;
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
      summary.errors.iterator().each(function (key, value) {
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
        var informacion = {};
        var currScript = runtime.getCurrentScript();
        var st = JSON.stringify(currScript);
        //informacion.ulidsProcesar = currScript.getParameter('custscript_reembolso_serv_ulids');
        informacion.tipoCambio = currScript.getParameter('custscript_reembolso_serv_tc');
        informacion.devolucionCredito = currScript.getParameter('custscript_reembolso_serv_dev_cred');
        informacion.departamento = currScript.getParameter('custscript_reembolso_serv_dep');
        informacion.sitio = currScript.getParameter('custscript_reembolso_serv_sitio');
        informacion.sitioWeb = currScript.getParameter('custscript_reembolso_serv_sitio_web');
        informacion.account = currScript.getParameter('custscript_reembolso_serv_cuenta');
        return informacion;
      } catch (excepcion) {
        log.error('Generacion Reembolsos Servicios', 'GET INPUT DATA - Excepcion Obteniendo Parametros - Excepcion : ' + excepcion.message.toString());
        return null;
      }
    }
      function getInputData(){
        log.audit('Generacion Reembolsos Servicios', 'INICIO GET INPUT DATA');
        var errorG = false;
        var mensaje = '';
        var currScript = runtime.getCurrentScript();
        var ulidsProcesar = currScript.getParameter('custscript_reembolso_serv_ulids');
        var ssConfigCtas = utilities.searchSavedPro('customsearch_3k_config_ctas_cupones');
        if (ssConfigCtas.error == false){
          ssCfg = {
            result: ssConfigCtas.objRsponseFunction.result,
            columns: ssConfigCtas.objRsponseFunction.search.columns
          };
        }else{
          errorG= true
          mensaje= 'Error buscando configuracion de cuentas: '+ssConfigCtas.descripcion;
        }
        //Busco la información de las OV que tienen los ULIDS guardados
        var arrayUlids = ulidsProcesar.split(',');
        var filtroUlids = search.createFilter({
          name: 'formulanumeric',
          operator: search.Operator.EQUALTO,
          formula: 'CASE WHEN {lineuniquekey} IN (' + ulidsProcesar + ') THEN 1 ELSE 0 END',
          values: 1,
        });
        var ssOVSearch = search.load('customsearch_reembolso_serv_ov_2');
        ssOVSearch.filters.push(filtroUlids);
        log.debug('ssOVSearch', ssOVSearch);
        var ssOV = correrSearch(ssOVSearch);
        //var params = [{
          //name: 'lineuniquekey',
          //operator: 'IS',
          //values: arrayUlids
        //}];
        //var ssOVSearch = utilities.searchSavedPro('customsearch_reembolso_serv_ov_2', params);
        
        //Guardo los ID de las OV en un array
        if (!utilities.isEmpty(ssOV) && /*ssOVSearch.error == false &&*/ errorG == false) {
          //ssOV = {
            //result: ssOVSearch.objRsponseFunction.result,
            //columns: ssOVSearch.objRsponseFunction.search.columns
          //};
          log.debug('arrayUlids',arrayUlids);
          log.debug('ssOV',ssOV);
          var arrayIdOV = [];
          for(var i = 0; i < ssOV.result.length; i++){
            arrayIdOV.push(ssOV.result[i].getValue(ssOV.columns[0]));
          }
        }
        else{
          errorG = true;
          mensaje = utilities.isEmpty(ssOVSearch)? 'No se ha encontrado información de la búsqueda guardada de OVs.' : ssOVSearch.descripcion;
        }

        //Busco la informacion de depósitos aplicados a las OV
        if(!utilities.isEmpty(arrayIdOV) && arrayIdOV.length > 0){
          params = [{
            name: 'appliedtotransaction',
            operator: 'ANYOF',
            values: arrayIdOV
          }];
          var ssDepSearch = utilities.searchSavedPro('customsearch_3k_deposit_reembolso_serv', params);
          
          if (!utilities.isEmpty(ssDepSearch) && ssDepSearch.error == false){
            ssDep = {
              result: ssDepSearch.objRsponseFunction.result,
              columns: ssDepSearch.objRsponseFunction.search.columns
            };
          } else{
            errorG = true;
            mensaje = 'No hay resultados de depositos aplicados a las OV seleccionadas.';
          }
        }else{
          errorG = true;
          mensaje = 'No se guardaron Ids de ninguna OV para buscar depósitos.'
        }

        if (errorG == false){
          var infoDepOV = [];
          for(var i = 0; i < ssOV.result.length; i++){
            var infoDeposito = ssDep.result.filter(function(lineaDep){
              return lineaDep.getValue(ssDep.columns[0]) == ssOV.result[i].getValue(ssOV.columns[0]);
            });
            //log.debug('ssOV',ssOV);
            //log.debug('ssDep', ssDep);
            //log.debug('ssCfg', ssCfg);
            var cfgCuenta = ssCfg.result.filter(function(cfg){
              return cfg.getValue(ssCfg.columns[1]) == ssOV.result[i].getValue(ssOV.columns[8]);
            })
            if(infoDeposito.length > 0){
              var objInfoDepOV = {
                idOrden: ssOV.result[i].getValue(ssOV.columns[0]),
                ulid: ssOV.result[i].getValue(ssOV.columns[2]),
                clienteLiq: ssOV.result[i].getValue(ssOV.columns[4]),
                ingresoConfirmar:ssOV.result[i].getValue(ssOV.columns[6]),
                cuentaIngreso: cfgCuenta[0].getValue(ssCfg.columns[3]),
                proveedorLiq: ssOV.result[i].getValue(ssOV.columns[5]),
                deudaPagar:ssOV.result[i].getValue(ssOV.columns[7]),
                cuentaDeuda: cfgCuenta[0].getValue(ssCfg.columns[4]),
                moneda: ssOV.result[i].getValue(ssOV.columns[8]),
                subsidiaria: ssOV.result[i].getValue(ssOV.columns[9]),
                clienteDep: infoDeposito[0].getValue(ssDep.columns[2]),
                cuentaDep: infoDeposito[0].getValue(ssDep.columns[3])
              };
              infoDepOV.push(objInfoDepOV);
            }else{
              errorG == true;
              mensaje = 'No se encontraron depósitos para la OV id: ' + ssOV.result[i].getValue(ssOV.columns[0]);
            }
          }
        }
        if (errorG == true){
          log.error('Generacion Reembolsos Servicios','ERROR EN GET INPUT DATA: '+mensaje);
          return null;
        }
        log.audit('Generacion Reembolsos Servicios', 'FIN GET INPUT DATA');
        return infoDepOV;
      }
      function map(context){
        log.audit('Generacion Reembolsos Servicios', 'INICIO MAP');

        var resultado = context.value;
        if (!utilities.isEmpty(resultado)) {
          var searchResult = JSON.parse(resultado);

          if (!utilities.isEmpty(searchResult)) {
            var params = getParams();
            var obj = {};
            obj.idOrden = searchResult.idOrden;
            obj.ulid = searchResult.ulid;
            obj.clienteLiq = searchResult.clienteLiq;
            obj.ingresoConfirmar = searchResult.ingresoConfirmar;
            obj.cuentaIngreso = searchResult.cuentaIngreso;
            obj.proveedorLiq = searchResult.proveedorLiq;
            obj.deudaPagar = searchResult.deudaPagar;
            obj.cuentaDeuda = searchResult.cuentaDeuda;
            obj.moneda = searchResult.moneda;
            obj.subsidiaria = searchResult.subsidiaria;
            obj.clienteDep = searchResult.clienteDep;
            obj.cuentaDep = searchResult.cuentaDep;
            obj.tipoCambio = params.tipoCambio;
            obj.devolucionCredito = params.devolucionCredito;
            obj.departamento = params.departamento;
            obj.sitio = params.sitio;
            obj.sitioweb = params.sitioWeb;
            obj.account = params.account;

            var clave = obj.ulid;
            context.write(clave, JSON.stringify(obj));
          } else {
            log.error('Generacion Reembolsos Servicios', 'MAP - Error Obteniendo Resultados de ID de Transacciones A Reembolsar');
          }

          } else {
            log.error('Generacion Reembolsos Servicios', 'MAP - Error Parseando Resultados de ID de Transacciones A Reembolsar');
          }
        log.audit('Generacion Reembolsos Servicios - MAP', 'FIN MAP');
      }

      function reduce(context){
        log.audit('Generacion Reembolsos Servicios - REDUCE', 'INICIO REDUCE - KEY : ' + context.key);
        var respuesta = {};
        var registro = JSON.parse(context.values[0]);
        var asiento = record.create({
          type: record.Type.JOURNAL_ENTRY,
          isDynamic: true
        });
        
        //Completar cabecera del asiento
        asiento.setValue({
          fieldId: 'subsidiary',
          value: registro.subsidiaria
        });

        asiento.setValue({
          fieldId: 'currency',
          value: registro.moneda
        });
        
        asiento.setValue({
          fieldId: 'custbody_cseg_3k_sitio_web_o',
          value: registro.sitioWeb
        });

        asiento.setValue({
          fieldId: 'custbody_3k_devolucion_creditos',
          value: (registro.devolucionCredito == 'T' || registro.devolucionCredito == true)? true:false
        });

        //asiento.setValue({
          //fieldId: 'custbody_3k_cuenta_creditos',
          //value: registro.account
        //});

        asiento.setValue({
          fieldId: 'custbody_3k_ulid_servicios',
          value: registro.ulid
        });

        asiento.setValue({
          fieldId: 'memo',
          value: 'Reembolso por ULID Servicios: ' + registro.ulid
        });

        if(!utilities.isEmpty(registro.tipoCambio)){
          asiento.setValue({
            fieldId: 'exchangerate',
            value: registro.tipoCambio
          });
        }
        
        //Lineas de Asiento
        for(var i = 0; i < 3; i++){
          if (i==0){
            var nombre = registro.clienteLiq;
            var debito = parseFloat(registro.ingresoConfirmar);
            var credito = 0;
            var cuenta = registro.cuentaIngreso;
          }
          else if(i==1){
            var nombre = registro.proveedorLiq;
            var debito = parseFloat(registro.deudaPagar);
            var credito = 0;
            var cuenta = registro.cuentaDeuda;
          }
          else if (i==2){
            var nombre = registro.clienteDep;
            var debito = 0;
            var credito = parseFloat(registro.ingresoConfirmar) + parseFloat(registro.deudaPagar);
            var cuenta = registro.cuentaDep;
          }
          asiento.selectNewLine({sublistId: 'line'});
          asiento.setCurrentSublistValue({sublistId: 'line', fieldId:'account', value:cuenta});
          asiento.setCurrentSublistValue({sublistId: 'line', fieldId:'entity', value:nombre});
          asiento.setCurrentSublistValue({sublistId: 'line', fieldId:'debit', value:debito});
          asiento.setCurrentSublistValue({sublistId: 'line', fieldId:'credit', value:credito});
          asiento.setCurrentSublistValue({sublistId: 'line', fieldId:'department', value:registro.departamento});
          asiento.setCurrentSublistValue({sublistId: 'line', fieldId:'class', value:registro.sitio});
          asiento.commitLine({sublistId: 'line'});
        }

        try{
          respuesta.idAsiento = asiento.save();
          respuesta.error = false;
          respuesta.mensaje = 'Asiento generado correctamente';
        }catch(e){
          respuesta.idAsiento = null;
          respuesta.error = true;
          respuesta.mensaje = 'ERROR GENERANDO ASIENTO: '+JSON.stringify(e);
          log.error('Generacion Reembolsos Servicios- REDUCE','ERROR AL GUARDAR ASIENTO: '+JSON.stringify(e));
        }

        if(!utilities.isEmpty(respuesta.idAsiento)){
          var ov = record.load({
            type: record.Type.SALES_ORDER,
            id: registro.idOrden,
            isDynamic: true
          });
          var linea = ov.findSublistLineWithValue({sublistId: 'item',fieldId: 'lineuniquekey',value: registro.ulid });
          ov.selectLine({ sublistId: 'item',line: linea });
          ov.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_3k_reembolsado',value: true });
          ov.commitLine({sublistId: 'item'})
          try {
            respuesta.idOrden = ov.save();
            respuesta.error = false;
            respuesta.mensaje = 'Asiento generado correctamente y OV actualizada';
          } catch (e) {
            respuesta.idAsiento = null;
            respuesta.error = true;
            respuesta.mensaje = 'ERROR ACTUALIZANDO OV DEL ASIENTO: ' + JSON.stringify(e);
            log.error('Generacion Reembolsos Servicios- REDUCE', 'ERROR AL ACTUALIZAR OV DEL ASIENTO: ' + JSON.stringify(e));
          }
        }
        context.write(context.key, JSON.stringify(respuesta));
        log.audit('Generacion Reembolsos Servicios - REDUCE', 'FIN REDUCE - KEY : ' + context.key + ' - ID DE ASIENTO GENERADO: ' + respuesta.idAsiento);
      }

    function summarize(summary) {

      var errorGeneral = false;
      var mensajeErrorGeneral = 'El Proceso de Reembolso de Servicios Finalizo con errores';
      var mensajeOKGeneral = 'El Proceso de Reembolso de Servicios Finalizo Correctamente';
      var error = false;
      var mensajeError = '';
      var idLog = null;
      var empresas = [];
      var transaccionesEnviar = [];
      log.audit('Generacion Reembolsos Servicios - SUMMARIZE', 'INICIO SUMMARIZE');
      try {

        // INICIO OBTENER CONFIGURACION DE LIQUIDACIONES
        var errorConfiguracionLIQ = false;
        var idRTLog = '';
        var idInternoRTLog = '';
        var idRTDetLog = '';
        var dominio = '';
        var idEstadoFinalizado = '';
        var idEstadoError = '';
        var idEstadoCorrecto = '';

        var cfgLog = search.lookupFields({
          type: 'customrecord_3k_config_reem_serv',
          id: '1',
          columns: [
            'custrecord_3k_config_reem_serv_id_log',
            'custrecord_3k_config_reem_serv_intid_log',
            'custrecord_3k_config_reem_serv_id_logdet',
            'custrecord_3k_config_reem_serv_dominio',
            'custrecord_3k_config_reem_serv_est_cor',
            'custrecord_3k_config_reem_serv_est_fin',
            'custrecord_3k_config_reem_serv_est_err'
          ]
        }) || "";

        if (!utilities.isEmpty(cfgLog)) {
          idRTLog = cfgLog.custrecord_3k_config_reem_serv_id_log;
          idInternoRTLog = cfgLog.custrecord_3k_config_reem_serv_intid_log.value;
          idRTDetLog = cfgLog.custrecord_3k_config_reem_serv_id_logdet;
          dominio = cfgLog.custrecord_3k_config_reem_serv_dominio;
          idEstadoFinalizado = cfgLog.custrecord_3k_config_reem_serv_est_cor.value;
          idEstadoError = cfgLog.custrecord_3k_config_reem_serv_est_fin.value;
          idEstadoCorrecto = cfgLog.custrecord_3k_config_reem_serv_est_err.value;

        } else {
          errorConfiguracionLIQ = true;
          log.error('Generacion Reembolso Servicios', 'SUMMARIZE - ' + 'No se encuentra realizada la configuracion de los Reembolsos');
        }
        // FIN OBTENER CONFIGURACION DE LIQUIDACIONES

        // INICIO Generar Cabecera Log
        var registroLOG = record.create({
          type: idRTLog
        });

        if (!utilities.isEmpty(idEstadoFinalizado)) {
          registroLOG.setValue({
            fieldId: 'custrecord_3k_reem_serv_log_est',
            value: idEstadoFinalizado
          });
        }

        try {
          idLog = registroLOG.save();
          if (utilities.isEmpty(idLog)) {
            error = true;
            mensajeError = 'No se recibio el ID del LOG de Reembolso de Servicios Generado';
          }
        } catch (excepcionLOG) {
          error = true;
          mensajeError = 'Excepcion Grabando LOG de Proceso de Generacion de Reembolsos - Excepcion : ' + excepcionLOG.message.toString();
        }
        // FIN Generar Cabecera Log
        // INICIO Generar Detalle Log
        if (error == false) {
          summary.output.iterator().each(function (key, value) {
            if (error == false) {
              if (!utilities.isEmpty(value)) {
                var registro = JSON.parse(value);
                log.debug('Generacion Reembolso Servicios', 'Registro : ' + JSON.stringify(registro));
                if (!utilities.isEmpty(registro.idAsiento)) {
                  var idEstado = idEstadoCorrecto;
                  if (registro.error == true) {
                    errorGeneral = true;
                    idEstado = idEstadoError;
                  }
                  var registroDLOG = record.create({
                    type: idRTDetLog
                  });

                  if (!utilities.isEmpty(idEstado)) {
                    registroDLOG.setValue({
                      fieldId: 'custrecord_3k_reem_serv_logdet_est',
                      value: idEstado
                    });
                  }
                  if (!utilities.isEmpty(registro.mensaje)) {
                    registroDLOG.setValue({
                      fieldId: 'custrecord_3k_reem_serv_logdet_desc',
                      value: registro.mensaje
                    });
                  }
                  if (!utilities.isEmpty(registro.idAsiento) && registro.idAsiento != 0) {
                    registroDLOG.setValue({
                      fieldId: 'custrecord_3k_reem_serv_logdet_asiento',
                      value: registro.idAsiento
                    });
                  }

                  if (!utilities.isEmpty(idLog)) {
                    registroDLOG.setValue({
                      fieldId: 'custrecord_3k_reem_serv_logdet_log',
                      value: idLog
                    });
                  }

                  try {
                    idDLog = registroDLOG.save();
                    if (utilities.isEmpty(idDLog)) {
                      error = true;
                      mensajeError = 'No se recibio el ID del Detalle de LOG de Reembolso de Servicios Generado';
                    }
                  } catch (excepcionDLOG) {
                    error = true;
                    mensajeError = 'Excepcion Grabando el Detalle de LOG de Proceso de Generacion de Reembolso de Servicios - Excepcion : ' + excepcionDLOG.message.toString();
                  }
                } else {
                  error = true;
                  mensajeError = 'Error Parseando Informacion de Asiento de Reembolso de Servicios Generada';
                }
              } else {
                error = true;
                mensajeError = 'Error Obteniendo Informacion de Asiento de Reembolso de Servicios Generada';
              }
            }

            return true;
          });
        }
        // FIN Generar Detalle Log

      } catch (excepcion) {

        error = true;
        mensajeError = 'Excepcion Generando LOG de Proceso de Generacion de Reembolsos de Servicios - Excepcion : ' + excepcion.message.toString();
      }

      if (error == true) {
        errorGeneral = true;
        log.error('Generacion Reembolso Servicios', 'SUMMARIZE - ' + mensajeError);
      }
      // INICIO Enviar Email Log
      var autor = runtime.getCurrentUser().id;
      var destinatario = autor;
      var mensajeMail = mensajeOKGeneral;
      if (errorGeneral == true) {
        var mensajeMail = mensajeErrorGeneral;
      }
      var link = '';

      if (!utilities.isEmpty(idLog) && !utilities.isEmpty(dominio) && !utilities.isEmpty(idRTLog)) {
        link = 'Puede Observar el Detalle del procesamiento desde el Siguiente link <br> <a href="' + dominio + '/app/common/custom/custrecordentry.nl?rectype=' + idInternoRTLog + '&id=' + idLog + '"> Informacion Proceso </a>';
      } else {
        if (errorConfiguracionLIQ == false) {
          var informacionFaltante = 'No se pudo generar el Link de Acceso al LOG de la Generacion de los Reembolsos de Servicios debido a que falta la siguiente informacion : ';
          if (utilities.isEmpty(idLog)) {
            informacionFaltante = informacionFaltante + ' ID del Registro de LOG Generado / ';
          }
          if (utilities.isEmpty(dominio)) {
            informacionFaltante = informacionFaltante + ' Configuracion del dominio de NetSuite en el Panel de Configuracion de Reembolsos de Servicios / ';
          }
          if (utilities.isEmpty(idInternoRTLog)) {
            informacionFaltante = informacionFaltante + ' Configuracion del ID del RecordType de LOG en el Panel de Configuracion de Reembolsos de Servicios / ';
          }
          log.error('Generacion Reembolsos Servicios', 'SUMMARIZE - ' + informacionFaltante);
        }
      }

      var titulo = 'Proceso Generacion de Reembolsos Servicios';

      var mensaje = '<html><head></head><body><br>' + mensajeMail + '<br>' + link + '</body></html>';

      enviarEmail(autor, destinatario, titulo, mensaje);
      // FIN Enviar Email Log



      log.audit('Generacion Reembolsos Servicios', 'FIN SUMMARIZE');

      handleErrorIfAny(summary);
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
    return {
      getInputData: getInputData,
      map: map,
      reduce: reduce,
      summarize: summarize
    };
  });
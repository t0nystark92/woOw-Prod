/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */

/*require.config({
    paths: {
        '3K/funcionalidadesOV': './3K - Funcionalidades OV'
    }
});*/

define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/format', 'N/runtime', 'N/http', 'N/file', 'N/encode', 'N/render'],
  /**
   * @param {record} record
   */
  function (search, record, email, runtime, error, format, runtime, http, file, encode, render) {

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

    function enviarEmail(autor, destinatario, titulo, mensaje,adjuntos) {
      log.debug('Pago Comisiones Servicios', 'SUMMARIZE - INICIO ENVIO EMAIL - ID AUTOR : ' + autor + ' - ID DESTINATARIO : ' + destinatario + ' - TITULO : ' + titulo + ' - MENSAJE : ' + mensaje);

      if (!isEmpty(autor) && !isEmpty(destinatario) && !isEmpty(titulo) && !isEmpty(mensaje)) {
        log.debug('Proceso de Envio de mail','Enviando');
        attachments = adjuntos || undefined;
        email.send({
          author: autor,
          recipients: destinatario,
          subject: titulo,
          body: mensaje,
          attachments: attachments
        });
        log.debug('Proceso de Envio de mail','Enviado');
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
        log.error('Pago Comisiones Servicios', 'SUMMARIZE - Error Envio Email - Error : ' + detalleError);
      }
      log.debug('Pago Comisiones Servicios', 'SUMMARIZE - FIN ENVIO EMAIL');
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
        informacion.idRegistrosComisionesProcesar = currScript.getParameter('custscript_generar_pago_id_doc');
        informacion.formaPago = currScript.getParameter('custscript_generar_pagos_forma_pago');
        informacion.fechaPago = currScript.getParameter('custscript_generar_pagos_fecha_pago');
        informacion.cuentaOrigen = currScript.getParameter('custscript_generar_pagos_cta_orig');
        informacion.formularioImpresion = currScript.getParameter('custscript_generar_pagos_form_imp');
        informacion.fechaChequeDiferido = currScript.getParameter('custscript_generar_pagos_fecha_dif');
        informacion.imprimirCheque = currScript.getParameter('custscript_generar_pagos_imprimir');
        informacion.bancoEmisorPago = currScript.getParameter('custscript_generar_pagos_banco_emisor');

        return informacion;
      } catch (excepcion) {
        log.error('Pago Comisiones Servicios', 'INPUT DATA - Excepcion Obteniendo Parametros - Excepcion : ' + excepcion.message.toString());
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

        log.audit('Pago Comisiones Servicios', 'INICIO GET INPUT DATA');

        var infProcesar = [];

        // INICIO Obtener Parametros
        var informacionProcesar = getParams();
        // FIN Obtener Parametros
        var arrayRegistrosComisiones = [];
        if (!isEmpty(informacionProcesar) && !isEmpty(informacionProcesar.idRegistrosComisionesProcesar)) {
          arrayRegistrosComisiones = informacionProcesar.idRegistrosComisionesProcesar.split(',');
        }

        var formaPago = informacionProcesar.formaPago;
        var fechaPago = informacionProcesar.fechaPago;
        var cuentaOrigen = informacionProcesar.cuentaOrigen;
        var formularioImpresion = informacionProcesar.formularioImpresion;
        var fechaChequeDiferido = informacionProcesar.fechaChequeDiferido;
        var imprimirCheque = informacionProcesar.imprimirCheque;
        var bancoEmisorPago = informacionProcesar.bancoEmisorPago;
        //log.debug('Pago Comisiones Servicios','BancoEmisorPago: '+bancoEmisorPago);

        // INICIO - Consultar Cuentas de Pago
        var arrayInfoCuentas = [];
        var searchInfoCuentas = searchSavedPro('customsearch_3k_config_ctas_cupones');

        if (!isEmpty(searchInfoCuentas) && !searchInfoCuentas.error) {
          if (!isEmpty(searchInfoCuentas.objRsponseFunction.result) && searchInfoCuentas.objRsponseFunction.result.length > 0) {
            var resultSet = searchInfoCuentas.objRsponseFunction.result;
            var resultSearch = searchInfoCuentas.objRsponseFunction.search;
            for (var q = 0; q < resultSet.length; q++) {
              var infoCuenta = new Object({});
              infoCuenta.moneda = resultSet[q].getValue({
                name: resultSearch.columns[1]
              });
              infoCuenta.cuentaPago = resultSet[q].getValue({
                name: resultSearch.columns[6]
              });
              infoCuenta.cuentaCobro = resultSet[q].getValue({
                name: resultSearch.columns[7]
              });
              arrayInfoCuentas.push(infoCuenta);
            }
          } else {
            log.error('Pago Comisiones Servicios', 'INPUT DATA - Error Cuentas de Pago de Comisiones');
            log.audit('Pago Comisiones Servicios', 'FIN GET INPUT DATA');
            return null;
          }
        } else {
          log.error('Pago Comisiones Servicios', 'INPUT DATA - Error Cuentas de Pago de Comisiones');
          log.audit('Pago Comisiones Servicios', 'FIN GET INPUT DATA');
          return null;
        }
        log.debug('Pago Comisiones Servicios', 'INPUT DATA - Cuentas de comisiones: ' + arrayInfoCuentas);
        // FIN - Consultar Cuentas de Pago

        // INICIO - Consultar Datos Bancarios Proveedores Comisionistas
        var arrayDatosBancarios = [];
        var searchDatosBancarios = searchSavedPro('customsearch_3k_datos_banc_prov_com');

        if (!isEmpty(searchDatosBancarios) && !searchDatosBancarios.error) {
          if (!isEmpty(searchDatosBancarios.objRsponseFunction.result) && searchDatosBancarios.objRsponseFunction.result.length > 0) {
            var resultSet = searchDatosBancarios.objRsponseFunction.result;
            var resultSearch = searchDatosBancarios.objRsponseFunction.search;
            for (var q = 0; q < resultSet.length; q++) {
              var infoDatoBancario = new Object({});
              infoDatoBancario.idInterno = resultSet[q].getValue({
                name: resultSearch.columns[0]
              });
              infoDatoBancario.proveedor = resultSet[q].getValue({
                name: resultSearch.columns[2]
              });
              infoDatoBancario.moneda = resultSet[q].getValue({
                name: resultSearch.columns[3]
              });
              arrayDatosBancarios.push(infoDatoBancario);
            }
          }
          /*else {
                                 log.error('Pago Comisiones Servicios', 'INPUT DATA - Error Datos Bancarios Proveedores');
                                 log.audit('Pago Comisiones Servicios', 'FIN GET INPUT DATA');
                                 return null;
                             }*/
        } else {
          log.error('Pago Comisiones Servicios', 'INPUT DATA - Error Datos Bancarios Proveedores');
          log.audit('Pago Comisiones Servicios', 'FIN GET INPUT DATA');
          return null;
        }
        // INICIO - Consultar Datos Bancarios Proveedores Comisionistas

        if ((!isEmpty(arrayRegistrosComisiones) && arrayRegistrosComisiones.length > 0)) {

          log.debug('Pago Comisiones Servicios', 'INPUT DATA - ID Transacciones A Procesar : ' + informacionProcesar.idRegistrosComisionesProcesar);

          if ((!isEmpty(arrayRegistrosComisiones) && arrayRegistrosComisiones.length > 0)) {
            // INICIO Consultar Liquidaciones A Pagar
            var comisionesPendientes = search.load({
              id: 'customsearch_3k_com_pend_pago'
            });

            var filtroID = search.createFilter({
              name: 'internalid',
              operator: search.Operator.ANYOF,
              values: arrayRegistrosComisiones
            });

            comisionesPendientes.filters.push(filtroID);

            var resultSearch = comisionesPendientes.run();
            var completeResultSet = [];
            var resultIndex = 0;
            var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
            var resultado; // temporary variable used to store the result set

            do {
              // fetch one result set
              resultado = resultSearch.getRange({
                start: resultIndex,
                end: resultIndex + resultStep
              });
              if (!isEmpty(resultado) && resultado.length > 0) {
                if (resultIndex == 0) completeResultSet = resultado;
                else completeResultSet = completeResultSet.concat(resultado);
              }
              // increase pointer
              resultIndex = resultIndex + resultStep;
              // once no records are returned we already got all of them
            } while (!isEmpty(resultado) && resultado.length > 0);

            for (var i = 0; !isEmpty(completeResultSet) && i < completeResultSet.length; i++) {
              var obj = {};

              obj.idCuenta = '';
              obj.idDatosBancarios = '';

              obj.formaPago = formaPago;
              obj.fechaPago = fechaPago;
              obj.cuentaOrigen = cuentaOrigen;

              obj.formularioImpresion = formularioImpresion;
              obj.fechaChequeDiferido = fechaChequeDiferido;
              obj.imprimirCheque = imprimirCheque;

              obj.idInternoDocComision = completeResultSet[i].getValue({
                name: resultSearch.columns[0]
              });

              obj.idProvCli = completeResultSet[i].getValue({
                name: resultSearch.columns[1]
              });

              obj.tipoDoc = completeResultSet[i].getValue({
                name: resultSearch.columns[2]
              }).toLowerCase();

              obj.empresa = completeResultSet[i].getValue({
                name: resultSearch.columns[4]
              });

              obj.moneda = completeResultSet[i].getValue({
                name: resultSearch.columns[5]
              });

              if (!isEmpty(obj.moneda)) {

                var objCuenta = arrayInfoCuentas.filter(function (objeto) {
                  return (objeto.moneda == obj.moneda);
                });

                //if (!isEmpty(objCuenta) && objCuenta.length > 0) {
                  //if (obj.tipoDoc == 'vendbill' || obj.tipoDoc == 'vendcred') {
                    //obj.idCuenta = objCuenta[0].cuentaPago;
                  //}
                //}

                var objDatosBancarios = arrayDatosBancarios.filter(function (objeto) {
                  return (objeto.proveedor == obj.empresa && objeto.moneda == obj.moneda);
                });

                if (!isEmpty(objDatosBancarios) && objDatosBancarios.length > 0) {
                  if (!isEmpty(objDatosBancarios[0].idInterno)) {
                    obj.idDatosBancarios = objDatosBancarios[0].idInterno;
                  }
                }

              }
              if (obj.tipoDoc == 'custinvc' || obj.tipoDoc == 'custcred' || isEmpty(obj.idCuenta)) {
                obj.idCuenta = completeResultSet[i].getValue({
                  name: resultSearch.columns[9]
                });;
              }
              obj.importePago = completeResultSet[i].getValue({
                name: resultSearch.columns[7]
              });
              obj.sitio = completeResultSet[i].getValue({
                name: resultSearch.columns[6]
              });


              obj.bancoEmisorPago = bancoEmisorPago;
              log.debug('obj', obj);
              infProcesar.push(obj);
            }
            //  FIN Consultar Liquidaciones A Pagar

          }


          log.audit('Pago Comisiones Servicios', 'FIN GET INPUT DATA');
          return infProcesar;
        } else {
          log.error('Pago Comisiones Servicios', 'INPUT DATA - Error Obteniendo ID de Transacciones de Comisiones A Procesar');
          log.audit('Pago Comisiones Servicios', 'FIN GET INPUT DATA');
          return null;
        }

      } catch (excepcion) {
        log.error('Pago Comisiones Servicios', 'INPUT DATA - Excepcion Obteniendo ID de Transacciones de Comisiones A Procesar - Excepcion : ' + excepcion.message.toString());
        log.audit('Pago Comisiones Servicios', 'FIN GET INPUT DATA');
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
      log.audit('Pago Comisiones Servicios', 'INICIO MAP');

      try {

        var resultado = context.value;

        if (!isEmpty(resultado)) {

          var searchResult = JSON.parse(resultado);

          if (!isEmpty(searchResult)) {

            //var fechaServidor = new Date();

            /*var fechaLocalString = format.format({
                value: fechaServidor,
                type: format.Type.DATETIME,
                timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
            });*/

            /*var fechaLocal = format.parse({
                value: fechaLocalString,
                type: format.Type.DATETIME,
                timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
            });*/

            var obj = {};

            obj.idCuenta = searchResult.idCuenta;
            obj.idDatosBancarios = searchResult.idDatosBancarios;
            obj.idInternoDocComision = searchResult.idInternoDocComision;
            obj.idProvCli = searchResult.idProvCli;
            obj.tipoDoc = searchResult.tipoDoc;
            obj.empresa = searchResult.empresa;
            obj.moneda = searchResult.moneda;
            
            obj.importePago = searchResult.importePago;
            obj.sitio = searchResult.sitio;
            //obj.fecha = fechaLocal;
            obj.formaPago = searchResult.formaPago;
            obj.fechaPago = searchResult.fechaPago;
            obj.cuentaOrigen = searchResult.cuentaOrigen;

            obj.formularioImpresion = searchResult.formularioImpresion;
            obj.fechaChequeDiferido = searchResult.fechaChequeDiferido;
            obj.imprimirCheque = searchResult.imprimirCheque;
            obj.bancoEmisorPago = searchResult.bancoEmisorPago;

            //var clave = obj.sitio + '-' + obj.empresa + '-' + obj.moneda;
            var clave = obj.idProvCli + '-' + obj.moneda +'-'+obj.idCuenta;

            context.write(clave, JSON.stringify(obj));

          } else {
            log.error('Pago Comisiones Servicios', 'MAP - Error Obteniendo Resultados de ID de Transacciones de Comisiones A Procesar');
          }

        } else {
          log.error('Pago Comisiones Servicios', 'MAP - Error Parseando Resultados de ID de Transacciones de Comisiones A Procesar');
        }

      } catch (excepcion) {
        log.error('Pago Comisiones Servicios', 'MAP - Excepcion Procesando ID de Transacciones de Comisiones A Procesar - Excepcion : ' + excepcion.message.toString());
      }

      log.audit('Pago Comisiones Servicios', 'FIN MAP');

    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
      log.audit('Pago Comisiones Servicios', 'INICIO REDUCE - KEY : ' + context.key);

      var idPago = null;

      var registro = JSON.parse(context.values[0]);
      if (registro.tipoDoc == 'custinvc' || registro.tipoDoc == 'custcred') {

        log.audit('Pago Comisiones Servicios - REDUCE', 'Ejecutando Funcion de Generar Pago de Cliente');

        var respuestaF = generarPagoCliente(context.values);

        log.audit('Pago Comisiones Servicios - REDUCE', 'Funcion para Generar Pago de Cliente Ejecutada');

      }
      
      else if (registro.tipoDoc == 'vendbill' || registro.tipoDoc == 'vendcred') {

        log.audit('Pago Comisiones Servicios - REDUCE', 'Ejecutando Funcion de Generar Pago de Proveedor');

        var respuestaF = generarPagoProveedor(context.values);

        log.audit('Pago Comisiones Servicios - REDUCE', 'Funcion para Generar Pago de Proveedor Ejecutada');

      }
      // FIN GENERAR PAGO LIQUIDACION

      var respuesta = {};
      respuesta.idPago = respuestaF.idPago;
      respuesta.error = false;
      respuesta.mensaje = "";

      if (respuestaF.error == true) {
        log.error('Generacion Pago Comision', 'REDUCE - ' + respuestaF.mensaje);
        respuesta.error = true;
        respuesta.mensaje = respuestaF.mensaje;
      } else {
        respuesta.mensaje = 'El Pago con ID Interno : ' + respuestaF.idPago + ' Se genero correctamente Asociado a las transacciones : ' + JSON.stringify(respuestaF.transacciones);
        respuesta.transacciones = respuestaF.transacciones;
      }

      log.audit('Generacion Pago Comision', 'FIN REDUCE - KEY : ' + context.key + ' ID PAGO GENERADO : ' + respuestaF.idPago);

      context.write(context.key, JSON.stringify(respuesta));
    }

    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {

      var errorGeneral = false;
      var mensajeErrorGeneral = 'El Proceso de Pago de Comisiones Servicios Finalizo con errores';
      var mensajeOKGeneral = 'El Proceso de Pago de Comisiones Servicios Finalizo Correctamente';
      var error = false;
      var mensajeError = '';
      var idLog = null;
      var empresas = [];
      var transaccionesEnviar = [];
      log.audit('Generacion Pagos Comisiones', 'INICIO SUMMARIZE');


      try {

        // INICIO OBTENER CONFIGURACION DE LIQUIDACIONES
        var errorConfiguracionLIQ = false;
        var dominio = '';
        var idRTLog = '';
        var idEstadoFinalizado = '';
        var idEstadoError = '';
        var idEstadoCorrecto = '';
        

        var mySearch = search.load({
          id: 'customsearch_3k_config_pago_liq'
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
          errorConfiguracionLIQ = true;
          log.error('Generacion Pago Liquidacion', 'SUMMARIZE - ' + 'No se encuentra realizada la configuracion de los Pagos de Liquidaciones');
        }
        // FIN OBTENER CONFIGURACION DE LIQUIDACIONES

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
          type: 'customrecord_3k_gen_pago_liq_log'
        });

        registroLOG.setValue({
          fieldId: 'custrecord_3k_gen_pago_liq_log_fecha',
          value: fechaLocal
        });
        if (!isEmpty(idEstadoFinalizado)) {
          registroLOG.setValue({
            fieldId: 'custrecord_3k_gen_pago_liq_log_est',
            value: idEstadoFinalizado
          });
        }

        try {
          idLog = registroLOG.save();
          if (isEmpty(idLog)) {
            error = true;
            mensajeError = 'No se recibio el ID del LOG de Pago de Liquidacion Generado';
          }
        } catch (excepcionLOG) {
          error = true;
          mensajeError = 'Excepcion Grabando LOG de Proceso de Generacion de Pagos de Liquidaciones - Excepcion : ' + excepcionLOG.message.toString();
        }
        // FIN Generar Cabecera Log
        // INICIO Generar Detalle Log
        if (error == false) {
          summary.output.iterator().each(function (key, value) {
            if (error == false) {
              if (!isEmpty(value)) {
                var registro = JSON.parse(value);
                log.debug('Generacion Pago Liquidacion', 'Registro : ' + JSON.stringify(registro));
                if (!isEmpty(registro)) {
                  var idEstado = idEstadoCorrecto;
                  if (registro.error == true) {
                    errorGeneral = true;
                    idEstado = idEstadoError;
                  }
                  var registroDLOG = record.create({
                    type: 'customrecord_3k_gen_pago_liq_logdet'
                  });

                  registroDLOG.setValue({
                    fieldId: 'custrecord_3k_gen_pago_liq_logdet_fecha',
                    value: fechaLocal
                  });
                  if (!isEmpty(idEstado)) {
                    registroDLOG.setValue({
                      fieldId: 'custrecord_3k_gen_pago_liq_logdet_est',
                      value: idEstado
                    });
                  }
                  if (!isEmpty(registro.mensaje)) {
                    registroDLOG.setValue({
                      fieldId: 'custrecord_3k_gen_pago_liq_logdet_desc',
                      value: registro.mensaje
                    });
                  }
                  if (!isEmpty(registro.idPago) && registro.idPago != 0) {
                    registroDLOG.setValue({
                      fieldId: 'custrecord_3k_gen_pago_liq_logdet_pliq',
                      value: registro.idPago
                    });
                  }
                  if (!isEmpty(registro.idLiquidacion)) {
                    registroDLOG.setValue({
                      fieldId: 'custrecord_3k_gen_pago_liq_logdet_liq',
                      value: registro.idLiquidacion
                    });
                  }
                  if (!isEmpty(idLog)) {
                    registroDLOG.setValue({
                      fieldId: 'custrecord_3k_gen_pago_liq_logdet_log',
                      value: idLog
                    });
                  }
                  
                  for(var i = 0; i < registro.transacciones.length; i++){
                    var empresaGuardada = empresas.filter(function (empid) {
                      return empid == registro.transacciones[i].empresa
                    });
                    if (!isEmpty(empresaGuardada) && empresaGuardada.length == 0) {
                      empresas.push(registro.transacciones[i].empresa);
                    }
                    transaccionesEnviar.push(registro.transacciones[i].id);
                  }
                  log.debug('671 empresas', empresas);
                  try {
                    idDLog = registroDLOG.save();
                    if (isEmpty(idDLog)) {
                      error = true;
                      mensajeError = 'No se recibio el ID del Detalle de LOG de Pago de Liquidacion Generado';
                    }
                  } catch (excepcionDLOG) {
                    error = true;
                    mensajeError = 'Excepcion Grabando el Detalle de LOG de Proceso de Generacion de Pago de Liquidacion - Excepcion : ' + excepcionDLOG.message.toString();
                  }
                } else {
                  error = true;
                  mensajeError = 'Error Parseando Informacion de Pago de Liquidacion Generada';
                }
              } else {
                error = true;
                mensajeError = 'Error Obteniendo Informacion de Pago de Liquidacion Generada';
              }
            }

            return true;
          });
        }
        // FIN Generar Detalle Log
        
      } catch (excepcion) {

        error = true;
        mensajeError = 'Excepcion Generando LOG de Proceso de Generacion de Pago de Liquidacion - Excepcion : ' + excepcion.message.toString();
      }

      // INICIO ACTUALIZAR LINEAS LIQUIDADAS
      if (error == false) {
        log.audit('Pago Comisiones Servicios - SUMMARIZE', 'Marcando líneas liquidadas');
        var transaccionesMarcadas = [];
        var ssTransLiquidadas = search.load('customsearch_3k_trans_liquidadas');
        var filtroID = search.createFilter({
          name: 'internalid',
          operator: search.Operator.ANYOF,
          values: transaccionesEnviar
        });
        ssTransLiquidadas.filters.push(filtroID);
        ssTransLiq = correrSearch(ssTransLiquidadas);
        log.debug('ssTransLiq', ssTransLiq);
        for (var k = 0; k < ssTransLiq.result.length; i++){
          var idOV = ssTransLiq.result[k].getValue(ssTransLiq.columns[3]);
          log.debug('idOV', idOV);
          var existeTrans = transaccionesMarcadas.filter(function(trans){
            return trans == idOV;
          });
          log.debug('existeTrans', existeTrans);
          if (existeTrans.length == 0){
            var ulidsMarcar = ssTransLiq.result.filter(function (trans) {
              return trans.getValue(ssTransLiq.columns[3]) == idOV;
            });
            log.debug('ulidsMarcar', ulidsMarcar);
            var ovMarcar = record.load({
              type: record.Type.SALES_ORDER,
              id: idOV,
              isDynamic: true
            });
            for(var l = 0; l < ulidsMarcar.length; l++){
              var linea = ovMarcar.findSublistLineWithValue({
                sublistId: 'item',
                fieldId: 'lineuniquekey',
                value: ulidsMarcar[l].getValue('custbody_3k_ulid_servicios')
              });
              log.debug('linea',linea);
              if (!isEmpty(linea) && linea >=0){
                ovMarcar.selectLine({
                  sublistId: 'item',
                  line: linea
                });
                ovMarcar.setCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_3k_servicio_liquidado',
                  value: true
                });
                ovMarcar.commitLine({
                  sublistId: 'item'
                });
              }else{
                log.error('Error', 'No hay línea en la OV con el ULID: ' + ulidsMarcar[l].getValue('custbody_3k_ulid_servicios'));
              }
            }
            try{
              ovMarcar.save();
              log.audit('Pago Comisiones Servicios - SUMMARIZE', 'Línea: ' + ulidsMarcar[l].getValue('custbody_3k_ulid_servicios') + ' OV: ' + idOV + ' OK');
            }catch(e){
              error = true;
              log.error('Pago Comisiones Servicios - SUMMARIZE','ERROR - '+e);
            }
          }
        }
        log.audit('Pago Comisiones Servicios - SUMMARIZE', 'Líneas liquidadas marcadas');
      }
      // FIN ACTUALIZAR LINEAS LIQUIDADAS

      if (error == true) {
        errorGeneral = true;
        log.error('Generacion Pago Liquidacion', 'SUMMARIZE - ' + mensajeError);
      }

      //INICIO Generar Mail de Liquidacion
      if (error == false){
        try {
        var ssGeneralTransaccionesVentaSearch = search.load('customsearch_3k_fc_nc_imprimir_pago_serv');
        var ssDetalleTransaccionesSearch = search.load('customsearch_3k_detalle_servicios_pagos');
        ssDetalleTransaccionesSearch.filters.push(filtroID);
        ssGeneralTransaccionesVentaSearch.filters.push(filtroID);
        var ssDetTrans = correrSearch(ssDetalleTransaccionesSearch);
        log.debug('721 ssDetTrans', ssDetTrans);
        var ssGenTransVent = correrSearch(ssGeneralTransaccionesVentaSearch);
        log.debug('723 ssGenTransVent', ssGenTransVent);
        if (!isEmpty(ssDetTrans) && ssDetTrans.result.length > 0) {
          for (var m = 0; m < empresas.length; m++) {

             //GENERAR XLS - INICIO

            var ssXLS = ssDetTrans.result.filter(function (obj) {
              return obj.getValue(ssDetTrans.columns[2]) == empresas[m];
            });

            var contenidoXLS = '';

            //OJO: SI NO SE SELECCIONA NINGUNA FACTURA CLIENTE DE LA MISMA EMPRESA-MONEDA PARA LA LIQUIDACIÓN
            //HABRÁ DATOS FALTANTES EN EL .XLS
            for (var o = 0; o < ssXLS.length && ssXLS.length > 0; o++) {
              if (o == 0) {
                var fechaProceso = new Date();
                var fechaString = fechaProceso.getDate() + '-' + (fechaProceso.getMonth() + 1) + '-' + fechaProceso.getFullYear();
                var proveedor = search.lookupFields({
                  type: 'vendor',
                  id: empresas[m],
                  columns: [
                    'entityid',
                    'companyname',
                    'email'
                  ]
                });
                contenidoXLS = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
                contenidoXLS += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"   xmlns:o="urn:schemas-microsoft-com:office:office"   xmlns:x="urn:schemas-microsoft-com:office:excel"   xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"   xmlns:html="http://www.w3.org/TR/REC-html40">';
                contenidoXLS += '  <Worksheet ss:Name="Liquidacion">';
                contenidoXLS += '<Table>';
                contenidoXLS += '      <Row>';
                contenidoXLS += '         <Cell><Data ss:Type="String"> Detalle Pago Comisiones ' + proveedor.entityid+ ' ' + proveedor.companyname + ' ' + fechaString + ' </Data></Cell>';
                contenidoXLS += '      </Row>';
                contenidoXLS += '      <Row>';
                contenidoXLS += '          <Cell><Data ss:Type="String">Orden</Data></Cell>';
                contenidoXLS += '          <Cell><Data ss:Type="String">Descripcion</Data></Cell>';
                contenidoXLS += '          <Cell><Data ss:Type="String">Fecha</Data></Cell>';
                contenidoXLS += '          <Cell><Data ss:Type="String">Moneda</Data></Cell>';
                contenidoXLS += '          <Cell><Data ss:Type="String">Importe de la Orden</Data></Cell>';
                contenidoXLS += '          <Cell><Data ss:Type="String">Importe a Pagar</Data></Cell>';
                contenidoXLS += '          <Cell><Data ss:Type="String">Devoluciones Aplicadas (A pagar)</Data></Cell>';
                contenidoXLS += '          <Cell><Data ss:Type="String">Neto Comision</Data></Cell>';
                contenidoXLS += '          <Cell><Data ss:Type="String">Devoluciones Aplicadas (Comision)</Data></Cell>';
                contenidoXLS += '      </Row>';
              }
              contenidoXLS += '      <Row>';
              contenidoXLS += '          <Cell><Data ss:Type="String">' + ssXLS[o].getValue(ssDetTrans.columns[0]) + '</Data></Cell>';
              contenidoXLS += '          <Cell><Data ss:Type="String">' + ssXLS[o].getValue(ssDetTrans.columns[3]) + '</Data></Cell>';
              contenidoXLS += '          <Cell><Data ss:Type="String">' + ssXLS[o].getValue(ssDetTrans.columns[4]) + '</Data></Cell>';
              contenidoXLS += '          <Cell><Data ss:Type="String">' + ssXLS[o].getValue(ssDetTrans.columns[5]) + '</Data></Cell>';
              contenidoXLS += '          <Cell><Data ss:Type="String">' + ssXLS[o].getValue(ssDetTrans.columns[6]) + '</Data></Cell>';
              contenidoXLS += '          <Cell><Data ss:Type="String">' + ssXLS[o].getValue(ssDetTrans.columns[7]) + '</Data></Cell>';
              contenidoXLS += '          <Cell><Data ss:Type="String">' + ssXLS[o].getValue(ssDetTrans.columns[9]) + '</Data></Cell>';
              contenidoXLS += '          <Cell><Data ss:Type="String">' + ssXLS[o].getValue(ssDetTrans.columns[8]) + '</Data></Cell>';
              contenidoXLS += '          <Cell><Data ss:Type="String">' + ssXLS[o].getValue(ssDetTrans.columns[10]) + '</Data></Cell>';
              contenidoXLS += '      </Row>';
            }
            contenidoXLS += '   </Table>';
            contenidoXLS += '  </Worksheet>';
            contenidoXLS += '</Workbook>';
            
            var contenidoFile = encode.convert({
              string: contenidoXLS,
              inputEncoding: encode.Encoding.UTF_8,
              outputEncoding: encode.Encoding.BASE_64
            });
            var fileXLS = file.create({
              name: 'Pago Comisiones ' + proveedor.entityid + ' ' + proveedor.companyname + ' ' + fechaString + '.xls',
              fileType: file.Type.EXCEL,
              contents: contenidoFile,
              encoding: file.Encoding.BASE_64 //,
              //folder: '-15' 
            });
            //try {
              //var archivo = fileXLS.save();
            //} catch (err) {
              //log.error('Error guardando archivo de Liquidación', err.message);
            //}
            //GENERAR XLS - FIN

            //GENERAR Invoices y CreditMemos - INICIO
            if (!isEmpty(ssGenTransVent.result) && ssGenTransVent.result.length > 0){
              var ssPDFGenerar = ssGenTransVent.result.filter(function (obj) {
                return obj.getValue(ssGenTransVent.columns[3]) == empresas[m];
              });
              var arrayPDF = [];
              if (ssPDFGenerar.length > 0){
                for (var n = 0; n < ssPDFGenerar.length; n++){
                  var idT = ssPDFGenerar[n].getValue(ssGenTransVent.columns[0]);
                  var idForm = ssPDFGenerar[n].getValue(ssGenTransVent.columns[2]);
                  var docPDF = render.transaction({
                    entityId: parseInt(idT,10),
                    printMode: render.PrintMode.PDF,
                    formId: parseInt(idForm,10),
                    inCustLocale:false
                  });
                  arrayPDF.push(docPDF);
                }
              }else{
                log.audit('SIN TRANSACCIONES DE VENTA', 'No se generaron pagos de transacciones de venta para la empresa: ' + proveedor.entityid);
              }
            } else {
              log.audit('SIN TRANSACCIONES DE VENTA', 'No se generaron pagos de transacciones de venta para ninguna empresa');
            }
            //GENERAR Invoices y CreditMemos - FIN

            var autor = runtime.getCurrentUser().id;
            var msj = 'A continuación se le adjunta el detalle de pagos de comisiones y las facturas asociadas generados el día de hoy ' + fechaString;
            var mensajeMail = '<html><head></head><body><br>' + msj + '</body></html>';
            var destinatario = empresas[m];
            try{
              var archivos;
              if (!isEmpty(arrayPDF) && !isEmpty(fileXLS)) archivos = [fileXLS].concat(arrayPDF);
              
              else if (!isEmpty(arrayPDF)) archivos = arrayPDF;
              
              else if (!isEmpty(fileXLS)) archivos = [fileXLS];
              //log.debug('SUMMARIZE', 'Enviando mail con archivos de detalle');
              //email.send({
                //author: autor,
                //recipients: destinatario,
                //subject: 'Detalle de Pagos de Comisiones',
                //body: mensajeMail,
                //attachments: archivos
              //});
              //log.debug('SUMMARIZE', 'Mail con archivos de detalle enviado');
            }catch(xerror){
              log.error('Error','Error enviando mail de detalle de comisiones, error: '+xerror);
            }
            enviarEmail(autor, destinatario, 'Detalle de Pagos de Comisiones', mensajeMail, archivos);
            } 
          }
        } catch (e) {
          error = true;
          log.debug('Error Generando mail de detalle LIQ', e);
        }
      }
      //FIN Generar Mail de Liquidacion


      // INICIO Enviar Email Log
      var autor = runtime.getCurrentUser().id;
      var destinatario = autor;
      var mensajeMail = mensajeOKGeneral;
      if (errorGeneral == true) {
        var mensajeMail = mensajeErrorGeneral;
      }
      var link = '';

      if (!isEmpty(idLog) && !isEmpty(dominio) && !isEmpty(idRTLog)) {
        link = 'Puede Observar el Detalle del procesamiento desde el Siguiente link <br> <a href="' + dominio + '/app/common/custom/custrecordentry.nl?rectype=' + idRTLog + '&id=' + idLog + '"> Informacion Proceso </a>';
      } else {
        if (errorConfiguracionLIQ == false) {
          var informacionFaltante = 'No se pudo generar el Link de Acceso al LOG de la Generacion de los Pagos de Comisiones debido a que falta la siguiente informacion : ';
          if (isEmpty(idLog)) {
            informacionFaltante = informacionFaltante + ' ID del Registro de LOG Generado / ';
          }
          if (isEmpty(dominio)) {
            informacionFaltante = informacionFaltante + ' Configuracion del Dominio de NetSuite en el Panel de Configuracion de Pagos Liquidaciones / ';
          }
          if (isEmpty(idRTLog)) {
            informacionFaltante = informacionFaltante + ' Configuracion del ID del RecordType de LOG en el Panel de Configuracion de Pagos Liquidaciones / ';
          }
          log.error('Generacion Pago Servicios', 'SUMMARIZE - ' + informacionFaltante);
        }
      }

      var titulo = 'Proceso Generacion de Pagos de Servicios';

      var mensaje = '<html><head></head><body><br>' + mensajeMail + '<br>' + link + '</body></html>';

      enviarEmail(autor, destinatario, titulo, mensaje);
      // FIN Enviar Email Log

  

      log.audit('Generacion Pago Servicios', 'FIN SUMMARIZE');

      handleErrorIfAny(summary);
    }

    function searchSavedPro(idSavedSearch, arrayParams) {
      var objRespuesta = {};
      objRespuesta.error = false;
      try {
        var savedSearch = search.load({
          id: idSavedSearch
        });

        if (!isEmpty(arrayParams) && arrayParams.length > 0) {

          for (var i = 0; i < arrayParams.length; i++) {
            var nombre = arrayParams[i].name;
            arrayParams[i].operator = operadorBusqueda(arrayParams[i].operator);
            var join = arrayParams[i].join;
            if (isEmpty(join)) {
              join = null;
            }
            var value = arrayParams[i].values;
            if (!Array.isArray(value)) {
              value = [value];
            }
            var filtroID = '';
            if (!isEmpty(join)) {
              filtroID = search.createFilter({
                name: nombre,
                operator: arrayParams[i].operator,
                join: join,
                values: value
              });
            } else {
              filtroID = search.createFilter({
                name: nombre,
                operator: arrayParams[i].operator,
                values: value
              });
            }
            savedSearch.filters.push(filtroID);
          }
        }
        var resultSearch = savedSearch.run();
        var completeResultSet = [];
        var resultIndex = 0;
        var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
        var resultado; // temporary variable used to store the result set

        do {
          // fetch one result set
          resultado = resultSearch.getRange({
            start: resultIndex,
            end: resultIndex + resultStep
          });
          if (!isEmpty(resultado) && resultado.length > 0) {
            if (resultIndex == 0) completeResultSet = resultado;
            else completeResultSet = completeResultSet.concat(resultado);
          }
          // increase pointer
          resultIndex = resultIndex + resultStep;
          // once no records are returned we already got all of them
        } while (!isEmpty(resultado) && resultado.length > 0)
        objRsponseFunction = {};
        objRsponseFunction.result = completeResultSet;
        objRsponseFunction.search = resultSearch;
        var r = armarArreglosSS(completeResultSet, resultSearch);
        objRsponseFunction.array = r.array;
        objRespuesta.objRsponseFunction = objRsponseFunction;
      } catch (e) {
        objRespuesta.error = true;
        objRespuesta.tipoError = 'RORV007';
        objRespuesta.descripcion = 'function searchSavedPro: ' + e.message;
        log.error('RORV007', 'function searchSavedPro: ' + e.message);
      }
      return objRespuesta;
    }

    function armarArreglosSS(resultSet, resultSearch) {
      var array = [];
      var respuesta = new Object({});
      respuesta.error = false;
      respuesta.msj = "";
      //log.debug('armarArreglosSS', 'resultSet: ' + JSON.stringify(resultSet));
      //log.debug('armarArreglosSS', 'resultSearch: ' + JSON.stringify(resultSearch));
      try {

        for (var i = 0; i < resultSet.length; i++) {
          var obj = new Object({});
          obj.indice = i;
          for (var j = 0; j < resultSearch.columns.length; j++) {
            var nombreColumna = resultSearch.columns[j].name;
            //log.debug('armarArreglosSS','nombreColumna inicial: '+ nombreColumna);
            if (nombreColumna.indexOf("formula") !== -1 || !isEmpty(resultSearch.columns[j].join)) {
              nombreColumna = resultSearch.columns[j].label;

              //if (nombreColumna.indexOf("Formula"))
            }
            //log.debug('armarArreglosSS','nombreColumna final: '+ nombreColumna);
            if (Array.isArray(resultSet[i].getValue({
                name: resultSearch.columns[j]
              }))) {
              //log.debug('armarArreglosSS', 'resultSet[i].getValue({ name: nombreColumna }): ' + JSON.stringify(resultSet[i].getValue({ name: nombreColumna })));
              var a = resultSet[i].getValue({
                name: resultSearch.columns[j]
              });
              //log.debug('armarArreglosSS', 'a: ' + JSON.stringify(a));
              obj[nombreColumna] = a[0].value;
            } else {
              //log.debug('armarArreglosSS', 'resultSet[i].getValue({ name: nombreColumna }): ' + JSON.stringify(resultSet[i].getValue({ name: nombreColumna })));
              obj[nombreColumna] = resultSet[i].getValue({
                name: resultSearch.columns[j]
              });
            }

            /*else {

                if (Array.isArray(resultSet[i].getValue({ name: nombreColumna }))) {
                    //log.debug('armarArreglosSS', 'resultSet[i].getValue({ name: nombreColumna }): ' + JSON.stringify(resultSet[i].getValue({ name: nombreColumna })));
                    var a = resultSet[i].getValue({ name: nombreColumna });
                    //log.debug('armarArreglosSS', 'a: ' + JSON.stringify(a));
                    obj[nombreColumna] = a[0].value;
                } else {
                    //log.debug('armarArreglosSS', 'resultSet[i].getValue({ name: nombreColumna }): ' + JSON.stringify(resultSet[i].getValue({ name: nombreColumna })));
                    obj[nombreColumna] = resultSet[i].getValue({ name: nombreColumna });
                }
            }*/
          }
          //log.debug('armarArreglosSS', 'obj: ' + JSON.stringify(obj));
          array.push(obj);
        }
        //log.debug('armarArreglosSS', 'arrayArmado cantidad: ' + array.length);
        respuesta.array = array;

      } catch (e) {
        respuesta.error = true;
        respuesta.tipoError = "RARR001";
        respuesta.msj = "Excepción: " + e;
        log.error('RARR001', 'armarArreglosSS Excepción: ' + e);
      }

      return respuesta;
    }

    function operadorBusqueda(operadorString) {
      var operators = {
        'IS': search.Operator.IS,
        'AFTER': search.Operator.AFTER,
        'ALLOF': search.Operator.ALLOF,
        'ANY': search.Operator.ANY,
        'ANYOF': search.Operator.ANYOF,
        'BEFORE': search.Operator.BEFORE,
        'BETWEEN': search.Operator.BETWEEN,
        'CONTAINS': search.Operator.CONTAINS,
        'DOESNOTCONTAIN': search.Operator.DOESNOTCONTAIN,
        'DOESNOTSTARTWITH': search.Operator.DOESNOTSTARTWITH,
        'EQUALTO': search.Operator.EQUALTO,
        'GREATERTHAN': search.Operator.GREATERTHAN,
        'GREATERTHANOREQUALTO': search.Operator.GREATERTHANOREQUALTO,
        'HASKEYWORDS': search.Operator.HASKEYWORDS,
        'ISEMPTY': search.Operator.ISEMPTY,
        'ISNOT': search.Operator.ISNOT,
        'ISNOTEMPTY': search.Operator.ISNOTEMPTY,
        'LESSTHAN': search.Operator.LESSTHAN,
        'LESSTHANOREQUALTO': search.Operator.LESSTHANOREQUALTO,
        'NONEOF': search.Operator.NONEOF,
        'NOTAFTER': search.Operator.NOTAFTER,
        'NOTALLOF': search.Operator.NOTALLOF,
        'NOTBEFORE': search.Operator.NOTBEFORE,
        'NOTBETWEEN': search.Operator.NOTBETWEEN,
        'NOTEQUALTO': search.Operator.NOTEQUALTO,
        'NOTGREATERTHAN': search.Operator.NOTGREATERTHAN,
        'NOTGREATERTHANOREQUALTO': search.Operator.NOTGREATERTHANOREQUALTO,
        'NOTLESSTHAN': search.Operator.NOTLESSTHAN,
        'NOTLESSTHANOREQUALTO': search.Operator.NOTLESSTHANOREQUALTO,
        'NOTON': search.Operator.NOTON,
        'NOTONORAFTER': search.Operator.NOTONORAFTER,
        'NOTONORBEFORE': search.Operator.NOTONORBEFORE,
        'NOTWITHIN': search.Operator.NOTWITHIN,
        'ON': search.Operator.ON,
        'ONORAFTER': search.Operator.ONORAFTER,
        'ONORBEFORE': search.Operator.ONORBEFORE,
        'STARTSWITH': search.Operator.STARTSWITH,
        'WITHIN': search.Operator.WITHIN,
      }
      return operators[operadorString];
    }

    function generarPagoCliente(records) {
      var ssConfigLiq = search.load('customsearch_3k_config_liquidaciones');
      var ssCfg = correrSearch(ssConfigLiq);
      var cuentaCustPmt = ssCfg.result[0].getValue(ssCfg.columns[16]);
      if (!isEmpty(records) && records.length > 0) {
        var idPago = null;
        var error = false;
        var mensajeError = '';
        var importePago = 0;
        var idEmpresa = '';
        var idCliente = '';
        var idMoneda = '';
        //var fecha = null;
        var idCuenta = '';
        var idDatosBancarios = '';
        var idSitio = '';
        var fechaPago = '';
        var cuentaOrigen = '';
        var formularioImpresion = '';
        var fechaChequeDiferido = '';
        var imprimirCheque = false;
        var bancoEmisorPago = null;

        var error = false;

        var registro = JSON.parse(records[0]);

        if (!isEmpty(registro)) {
          idCuenta = registro.idCuenta;
          idDatosBancarios = registro.idDatosBancarios;
          idEmpresa = registro.empresa;
          idCliente = registro.idProvCli;
          tipoDoc = registro.tipoDoc;
          idMoneda = registro.moneda;
          //fecha = registro.fecha;
          idSitio = registro.sitio;
          fechaPago = registro.fechaPago;
          formaPago = registro.formaPago;
          cuentaOrigen = registro.cuentaOrigen;
          formularioImpresion = registro.formularioImpresion;
          fechaChequeDiferido = registro.fechaChequeDiferido;
          if (!isEmpty(registro.imprimirCheque) && registro.imprimirCheque == 'T') {
            imprimirCheque = true;
          }
          bancoEmisorPago = registro.bancoEmisorPago;
        } else {
          error = true;
          mensajeError = "Error No se Recibio Informacion del registro para generar el Pago";
        }

      } else {
        error = true;
        mensajeError = "Error No se Recibio Informacion del registro para generar el Pago";
      }
      if (error == false) {

        if (error == false && !isEmpty(idEmpresa) && !isEmpty(idMoneda) && !isEmpty(cuentaOrigen) && !isEmpty(idCuenta) /*&& !isEmpty(idSitio) && !isEmpty(idLiquidacion)*/ ) {

          var esTransferencia = false;
          // INICIO GENERAR PAGO
          var registroPago = record.create({
            type: record.Type.CUSTOMER_PAYMENT,
            isDynamic: true,
          });

          log.debug('Pago Comisiones Servicios', 'REDUCE - Fecha Pago : ' + fechaPago);

          registroPago.setValue({
            fieldId: 'customer',
            value: idCliente,
            ignoreFieldChange: false
          });

          registroPago.setValue({
            fieldId: 'currency',
            value: idMoneda,
            ignoreFieldChange: false
          });

          registroPago.setValue({
            fieldId: 'custbody_cseg_3k_sitio_web_o',
            value: idSitio,
            ignoreFieldChange: false
          });

          registroPago.setValue({
            fieldId: 'account',
            value: cuentaCustPmt,
            ignoreFieldChange: false
          });

          registroPago.setValue({
            fieldId: 'aracct',
            value: idCuenta,
            ignoreFieldChange: false
          });

          if (!isEmpty(fechaPago)) {
            var fechaPagoDate = format.parse({
              value: fechaPago,
              type: format.Type.DATE,
              timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
            });

            log.debug('Pago Comisiones Servicios', 'REDUCE - Fecha Pago : ' + fechaPagoDate);

            //registroPago.setValue({
            //fieldId: 'custbody_3k_fecha_pago',
            //value: fechaPagoDate
            //});

            registroPago.setValue({
              fieldId: 'trandate',
              value: fechaPagoDate
            });
          }

          //INICIO - MARCAR FACTURAS Y NC APLICADAS
          var transaccionesAplicadas = [];
          for (var i = 0; !isEmpty(records) && records.length > 0 && i < records.length && error == false; i++) {
            var registro = JSON.parse(records[i]);
            if (registro.tipoDoc == 'custinvc'){
              var sublista = 'apply';
            }
            else if (registro.tipoDoc == 'custcred'){
              var sublista = 'credit';
            }

            var linea = registroPago.findSublistLineWithValue({
              sublistId: sublista,
              fieldId: 'internalid',
              value: registro.idInternoDocComision
            });
            
            registroPago.selectLine({
              sublistId: sublista,
              line: 0
            });
            log.debug('internalid linea 0',registroPago.getCurrentSublistValue({sublistId: 'apply', fieldId:'internalid'}));

            registroPago.selectLine({
              sublistId: sublista,
              line: linea
            });
            registroPago.setCurrentSublistValue({
              sublistId: sublista,
              fieldId: 'apply',
              value: true
            });
            transaccionesAplicadas.push({
              tipoDoc: registro.tipoDoc,
              id: registro.idInternoDocComision,
              empresa: idEmpresa
            });
            registroPago.commitLine({
              sublistId: sublista
            });
          }
          //FIN - MARCAR FACTURAS Y NC APLICADAS
          try {
            idPago = registroPago.save();
          } catch (excepcionPago) {
            error = true;
            mensajeError = 'Excepcion Generando Pago de Comisiones - Excepcion : ' + excepcionPago.message.toString();
            log.error('Pago Comisiones Servicios', 'REDUCE - Excepcion : ' + mensajeError);
          }
          if (isEmpty(idPago)) {
            error = true;
            mensajeError = 'Error Generando Pago de Comisiones - Error : No se recibio el ID Interno del Pago';
          }
        } else {
          if (error == false) {
            error = true;
            var mensaje = 'No se Recibio la Siguiente Informacion requerida del Registro de Comisión : ';
            //if (isEmpty(idCuentaIngreso)) {
            //mensaje = mensaje + ' Cuenta de Ingresos A Utilizar para realizar el Pago de la Comisión / ';
            //}

            if (isEmpty(cuentaOrigen)) {
              mensaje = mensaje + ' Cuenta de Origen A Utilizar para realizar el Pago de las Comisiones / ';
            }

            //if (isEmpty(idSitio)) {
              //mensaje = mensaje + ' Sitio A Utilizar para realizar el Pago de las Comisiones / ';
            //}

            if (isEmpty(idEmpresa)) {
              mensaje = mensaje + ' Empresa (Proveedor) / ';
            }
            if (isEmpty(idMoneda)) {
              mensaje = mensaje + ' Moneda / ';
            }
            if (isEmpty(fechaPago)) {
              mensaje = mensaje + ' Fecha / ';
            }
            if (isEmpty(idCuenta)) {
              mensaje = mensaje + ' Cuenta del Pago (Factura/NC)';
            }
            mensajeError = mensaje;
          }
        }
      }
      return {
        error: error,
        mensaje: mensajeError,
        idPago: idPago,
        transacciones: transaccionesAplicadas
      };
    }

    function generarPagoProveedor(records) {
      if (!isEmpty(records) && records.length > 0) {
        var idPago = null;
        var idLiquidacion = null;
        var error = false;
        var mensajeError = '';
        var idEmpresa = '';
        var idProveedor = '';
        var idMoneda = '';
        //var fecha = null;
        var idCuenta = '';
        var idDatosBancarios = '';
        var idSitio = '';
        var fechaPago = '';
        var cuentaOrigen = '';
        var formularioImpresion = '';
        var fechaChequeDiferido = '';
        var imprimirCheque = false;
        var bancoEmisorPago = null;
        
        var error = false;

        var registro = JSON.parse(records[0]);

        if (!isEmpty(registro)) {
            idCuenta = registro.idCuenta;
            idDatosBancarios = registro.idDatosBancarios;
            idEmpresa = registro.empresa;
            idProveedor = registro.idProvCli;
            tipoDoc = registro.tipoDoc;
            idMoneda = registro.moneda;
            //fecha = registro.fecha;
            idSitio = registro.sitio;
            fechaPago = registro.fechaPago;
            formaPago = registro.formaPago;
            cuentaOrigen = registro.cuentaOrigen;
            formularioImpresion = registro.formularioImpresion;
            fechaChequeDiferido = registro.fechaChequeDiferido;
            if (!isEmpty(registro.imprimirCheque) && registro.imprimirCheque == 'T') {
              imprimirCheque = true;
            }
            bancoEmisorPago = registro.bancoEmisorPago;
          } else {
          error = true;
          mensajeError = "Error No se Recibio Informacion del registro para generar el Pago";
        }

      } else {
        error = true;
        mensajeError = "Error No se Recibio Informacion del registro para generar el Pago";
      }

      if (error == false) {

        if (error == false && !isEmpty(idEmpresa) && !isEmpty(idMoneda) && !isEmpty(cuentaOrigen) /*&& !isEmpty(idCuenta) && !isEmpty(idSitio) && !isEmpty(idLiquidacion)*/) {

          var esTransferencia = false;
          // INICIO GENERAR PAGO
          var registroPago = record.create({
            type: record.Type.VENDOR_PAYMENT,
            isDynamic: true
          });

          log.debug('Pago Comisiones Servicios', 'REDUCE - Fecha Pago : ' + fechaPago);

          /*var fechaServidor = new Date();

              var fechaLocalString = format.format({
                  value: fechaServidor,
                  type: format.Type.DATETIME,
                  timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
              });

              var fechaLocal = format.parse({
                  value: fechaLocalString,
                  type: format.Type.DATETIME,
                  timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
              });*/

          //log.error('Pago Comisiones Servicios', 'REDUCE - Fecha Cheque Date : ' + fechaLocal);

          /*registroPago.setValue({
              fieldId: 'date',
              value: fechaLocal
          });*/

          registroPago.setValue({
            fieldId: 'entity',
            value: idProveedor,
            ignoreFieldChange: false
          });
          
          registroPago.setValue({
            fieldId: 'apacct',
            value: idCuenta
          });
          
          registroPago.setValue({
            fieldId: 'account',
            value: cuentaOrigen
          });

          registroPago.setValue({
            fieldId: 'currency',
            value: idMoneda,
            ignoreFieldChange: false
          });

          registroPago.setValue({
            fieldId: 'custbody_cseg_3k_sitio_web_o',
            value: idSitio
          });


          if (!isEmpty(idDatosBancarios)) {
            registroPago.setValue({
              fieldId: 'custbody_3k_datos_bancarios',
              value: idDatosBancarios,
            });
          }

          if (!isEmpty(formaPago)) {
            registroPago.setValue({
              fieldId: 'custbody_3k_forma_de_pago_prov',
              value: formaPago
            });

            var objFieldLookUpFormaPago = search.lookupFields({
              type: 'customrecord_3k_forma_de_pago',
              id: formaPago,
              columns: [
                'custrecord_3k_forma_de_pago_transf'
              ]
            });

            if (!isEmpty(objFieldLookUpFormaPago) && objFieldLookUpFormaPago.custrecord_3k_forma_de_pago_transf == true) {
              esTransferencia = true;
            }
          }

          if (!isEmpty(fechaPago)) {
            var fechaPagoDate = format.parse({
              value: fechaPago,
              type: format.Type.DATE,
              timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
            });

            log.debug('Pago Comisiones Servicios', 'REDUCE - Fecha Pago : ' + fechaPagoDate);

            //registroPago.setValue({
              //fieldId: 'custbody_3k_fecha_pago',
              //value: fechaPagoDate
            //});

            registroPago.setValue({
              fieldId: 'trandate',
              value: fechaPagoDate
            });
          }


          if (!isEmpty(fechaChequeDiferido)) {
            var fechaChequeDiferidoDate = format.parse({
              value: fechaChequeDiferido,
              type: format.Type.DATE,
              timezone: format.Timezone.AMERICA_MONTEVIDEO // Montevideo - Uruguay
            });

            log.error('Pago Comisiones Servicios', 'REDUCE - Fecha Diferida : ' + fechaChequeDiferidoDate);

            registroPago.setValue({
              fieldId: 'custbody_3k_fecha_diferida',
              value: fechaChequeDiferidoDate
            });
          }

          if (!isEmpty(formularioImpresion)) {

            registroPago.setValue({
              fieldId: 'custbody3k_formulario_de_impresion',
              value: formularioImpresion
            });
          }

          if (!isEmpty(bancoEmisorPago)) {

            registroPago.setValue({
              fieldId: 'custbody_3k_banco',
              value: bancoEmisorPago
            });
          }

          if (!isEmpty(imprimirCheque) && imprimirCheque == true && esTransferencia == false) {

            registroPago.setValue({
              fieldId: 'tobeprinted',
              value: true
            });
          } else {
            registroPago.setValue({
              fieldId: 'tobeprinted',
              value: false
            });
          }

          if (esTransferencia == true) {
            registroPago.setValue({
              fieldId: 'tobeprinted',
              value: true
            });
          }
          /*EL ANTERIOR NO ANDA*/
          registroPago.setValue({
            fieldId: 'account',
            value: cuentaOrigen
          });
          log.debug('ACCOUNT - intento',registroPago.getValue('account'));
          //INICIO - MARCAR FACTURAS Y NC APLICADAS
          var transaccionesAplicadas = [];
          for (var i = 0; !isEmpty(records) && records.length > 0 && i < records.length && error == false; i++) {
            var registro = JSON.parse(records[i]);

            registroPago.selectLine({
              sublistId: 'apply',
              line: 0
            });
            log.debug('internalid linea 0', registroPago.getCurrentSublistValue({
              sublistId: 'apply',
              fieldId: 'internalid'
            }));

            var linea = registroPago.findSublistLineWithValue({
              sublistId: 'apply',
              fieldId: 'internalid',
              value: registro.idInternoDocComision
            });
            registroPago.selectLine({
              sublistId: 'apply',
              line: linea
            });
            registroPago.setCurrentSublistValue({
              sublistId: 'apply',
              fieldId:'apply',
              value: true
            });
            transaccionesAplicadas.push({
              tipoDoc: registro.tipoDoc,
              id: registro.idInternoDocComision,
              empresa: idEmpresa
            });
            registroPago.commitLine({sublistId: 'apply'});
          }
          //FIN - MARCAR FACTURAS Y NC APLICADAS
          try {
            idPago = registroPago.save();
          } catch (excepcionPago) {
            error = true;
            mensajeError = 'Excepcion Generando Pago de Comisiones - Excepcion : ' + excepcionPago.message.toString();
            log.error('Pago Comisiones Servicios', 'REDUCE - Excepcion : ' + mensajeError);
          }
          if (isEmpty(idPago)) {
            error = true;
            mensajeError = 'Error Generando Pago de Comisiones - Error : No se recibio el ID Interno del Pago';
          } else {
            if (esTransferencia == true) {
              try {
                var idPagoActualizado = record.submitFields({
                  type: record.Type.VENDOR_PAYMENT,
                  id: idPago,
                  values: {
                    tobeprinted: false,
                    tranid: ''
                  },
                  options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                  }
                });

              } catch (excepcionPagoActualizar) {
                error = true;
                mensajeError = 'Excepcion Generando Pago de Comisión - Excepcion : ' + excepcionPagoActualizar.message.toString();
              }
            }
          }
        } else {
          if (error == false) {
            error = true;
            var mensaje = 'No se Recibio la Siguiente Informacion requerida del Registro de Comisión : ';
            //if (isEmpty(idCuentaIngreso)) {
              //mensaje = mensaje + ' Cuenta de Ingresos A Utilizar para realizar el Pago de la Comisión / ';
            //}

            if (isEmpty(cuentaOrigen)) {
              mensaje = mensaje + ' Cuenta de Origen A Utilizar para realizar el Pago de las Comisiones / ';
            }

            //if (isEmpty(idSitio)) {
              //mensaje = mensaje + ' Sitio A Utilizar para realizar el Pago de las Comisiones / ';
            //}

            if (isEmpty(idEmpresa)) {
              mensaje = mensaje + ' Empresa (Proveedor) / ';
            }
            if (isEmpty(idMoneda)) {
              mensaje = mensaje + ' Moneda / ';
            }
            if (isEmpty(fechaPago)) {
              mensaje = mensaje + ' Fecha / ';
            }
            mensajeError = mensaje;
          }
        }
      }
      return { error: error, mensaje: mensajeError, idPago: idPago, transacciones: transaccionesAplicadas};
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
        if (!isEmpty(resultado) && resultado.length > 0) {
          if (resultIndex == 0)
            completeResultSet = resultado;
          else
            completeResultSet = completeResultSet.concat(resultado);
        }
        // increase pointer
        resultIndex = resultIndex + resultStep;
        // once no records are returned we already got all of them
      } while (!isEmpty(resultado) && resultado.length > 0)
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
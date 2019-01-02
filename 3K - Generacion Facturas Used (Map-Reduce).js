/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */

/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities',
        '3K/funcionalidadesOV': './3K - Funcionalidades OV'
    }
});*/

define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/format', 'N/runtime', '3K/utilities', '3K/funcionalidadesOV'],
  /**
   * @param {record} record
   */
  function (search, record, email, runtime, error, format, runtime, utilities, funcionalidades) {

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

    function enviarEmail(autor, destinatario, titulo, mensaje) {
      log.debug('Generar Facturas', 'SUMMARIZE - INICIO ENVIO EMAIL - ID AUTOR : ' + autor + ' - ID DESTINATARIO : ' + destinatario + ' - TITULO : ' + titulo + ' - MENSAJE : ' + mensaje);

      if (!isEmpty(autor) && !isEmpty(destinatario) && !isEmpty(titulo) && !isEmpty(mensaje)) {
        email.send({
          author: autor,
          recipients: destinatario,
          subject: titulo,
          body: mensaje
        });
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
        log.error('Generar Facturas', 'SUMMARIZE - Error Envio Email - Error : ' + detalleError);
      }
      log.debug('Generar Facturas', 'SUMMARIZE - FIN ENVIO EMAIL');
    }

    function handleErrorAndSendNotification(e, stage) {
      log.error('Estado : ' + stage + ' Error', e);

      var author = runtime.getCurrentUser().id;
      var recipients = runtime.getCurrentUser().id;
      var subject = 'Proceso de Generacion de Facturas ' + runtime.getCurrentScript().id + ' Error en Estado : ' + stage;
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

        log.audit('Generar Facturas', 'INICIO GET INPUT DATA');

        var facturasPendientes = search.load({
          id: 'customsearch_3k_remitos_sin_facturar'
        });
        //log.debug('searchResult',JSON.stringify(facturasPendientes));
        //return false;
        log.audit('Generar Facturas', 'FIN GET INPUT DATA');
        return facturasPendientes;

      } catch (excepcion) {
        log.error('Generar Facturas', 'INPUT DATA - Excepcion Obteniendo Facturas A Procesar - Excepcion : ' + excepcion.message.toString());
        log.audit('Generar Facturas', 'FIN GET INPUT DATA');
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
      log.audit('Generar Facturas', 'INICIO MAP');

      try {
        var resultado = context.value;

        if (!isEmpty(resultado)) {

          //log.debug('searchResult', JSON.stringify(resultado));

          var searchResult = JSON.parse(resultado);

          if (!isEmpty(searchResult)) {

            var obj = new Object();

            //log.debug('Generar Factura','Informacion : ' + JSON.stringify(searchResult));

            obj.idOrdenVenta = searchResult.values.createdfrom.value;
            //obj.idOrden = searchResult.values.custrecord_3k_cupon_id_orden.value;
            //obj.idCupon = searchResult.values.internalid.value;
            obj.fechaRemito = searchResult.values.trandate;
            obj.estadoRemito = searchResult.values.statusref.value;
            obj.idRemito = searchResult.values.internalid.value;

            var clave = obj.idRemito;

            context.write(clave, JSON.stringify(obj));

          } else {
            log.error('Generar Facturas', 'MAP - Error Obteniendo Resultados de ID de Cupones A Procesar');
          }

        } else {
          log.error('Generar Facturas', 'MAP - Error Parseando Resultados de ID de Cupones A Procesar');
        }

      } catch (excepcion) {
        log.error('Generar Facturas', 'MAP - Excepcion Procesando ID de Cupones A Procesar - Excepcion : ' + excepcion.message.toString());
      }

      log.audit('Generar Facturas', 'FIN MAP');

    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
      log.audit('Generar Facturas', 'INICIO REDUCE - KEY : ' + context.key);

      //var i = 0;
      var respuesta = new Object({});
      var error = false;
      var mensajeError = '';
      var estadoUpdate = [];

      log.audit('reduce - content:', JSON.stringify(context.values));

      if (!isEmpty(context.values) && context.values.length > 0) {
        for (var i = 0; i < context.values.length && error == false; i++) {
          registro = JSON.parse(context.values[i]);

          if (!isEmpty(registro)) {

            //var j = 0;
            log.audit('estadoRemito', registro.estadoRemito + ' idRemito: ' + registro.idRemito);
            //INICIO ENVIAR SHIP REMITO

            if (registro.estadoRemito != 'C' && !isEmpty(registro.idRemito)) {

              log.audit('Actualizando remito a shipped', registro.idRemito);
              try {
                //var updateRem = record.load({
                  //type: record.Type.ITEM_FULFILLMENT,
                  //id: registro.idRemito
                //});
                //updateRem.setValue({
                  //fieldId: shipstatus,
                  //value: 'C'
                //});
                //var remUpdated = updateRem.save();
                var remUpdated = record.submitFields({
                  type: record.Type.ITEM_FULFILLMENT,
                  id: registro.idRemito,
                  values: {
                    shipstatus: 'C'
                  },
                  options: {
                    enableSourcing: true,
                    ignoreMandatoryFields: false
                  }
                }) || '';
                
              } catch (e) {
                log.error('Error', 'Error actualizando estado del Remito, error: ' + e.message);
                error = true;
                mensajeError = e.message;
              }
            }
          } else {
            error = true;
            mensajeError = "Error No se Recibio Informacion del registro de Remito para generar la Factura";
          }
        }

      } else {
        error = true;
        mensajeError = "Error No se Recibio Informacion del registro de Remito para generar la Factura";
      }
      if (error == true) {
        log.error('Generar Facturas', 'REDUCE - ' + mensajeError);
        respuesta.error = true;
        respuesta.mensaje = mensajeError;
      }
      context.write(context.key, respuesta);
    }

    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {

      log.audit('Generar Facturas', 'INICIO SUMMARIZE');

      log.audit('Generar Facturas', 'FIN SUMMARIZE');

      handleErrorIfAny(summary);
    }

    return {
      getInputData: getInputData,
      map: map,
      reduce: reduce,
      summarize: summarize
    };

  });
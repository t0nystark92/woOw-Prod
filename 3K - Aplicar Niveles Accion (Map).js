/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */

/*require.config({
baseUrl: '/SuiteScripts',
paths: {
'3K/utilities' : '/SuiteScripts/3K - Utilities'
}
});*/

define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/format', 'N/runtime'],
  /**
   * @param {record} record
   */
  function (search, record, email, runtime, error, format, runtime) {

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
      log.debug('Funcionalidades OV', 'SUMMARIZE - INICIO ENVIO EMAIL - ID AUTOR : ' + autor + ' - ID DESTINATARIO : ' + destinatario + ' - TITULO : ' + titulo + ' - MENSAJE : ' + mensaje);

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
        log.error('Generar Ordenes de Compras', 'SUMMARIZE - Error Envio Email - Error : ' + detalleError);
      }
      log.debug('Funcionalidades OV', 'SUMMARIZE - FIN ENVIO EMAIL');
    }

    function handleErrorAndSendNotification(e, stage) {
      log.error('Estado : ' + stage + ' Error', e);

      var author = runtime.getCurrentUser().id;
      var recipients = runtime.getCurrentUser().id;
      var subject = 'Proceso Funcionalidades Cupon ' + runtime.getCurrentScript().id + ' Error en Estado : ' + stage;
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
        var currScript = runtime.getCurrentScript();
        var informacion = currScript.getParameter('custscript_3k_aplicar_ovs_json');
        //informacion.numeroDespacho = currScript.getParameter('custscript_3k_numero_despacho');

        return informacion;
      } catch (excepcion) {
        log.error('getParams', 'INPUT DATA - Excepcion Obteniendo Parametros - Excepcion : ' + excepcion.message.toString());
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

        log.audit('Aplicar Niveles Accion', 'INICIO GET INPUT DATA');

        // INICIO Obtener Parametros
        var informacionProcesar = getParams();
        // FIN Obtener Parametros
        var arrayOvs = [];
        log.debug('Aplicar Niveles Accion', 'INPUT DATA - ID Órdenes de Venta A Procesar : ' + informacionProcesar);
        if (!isEmpty(informacionProcesar)) {

          arrayOvs = JSON.parse(informacionProcesar);

          /*for (var i = 0; i < arrayOvs.length; i++) {
              var objCupones = new Object({});
              objCupones.idCupon = arrayOvs[i].i;
              //objCupones.numeroDespacho = informacionProcesar.numeroDespacho;
              objCupones.nivelAccion = arrayOvs[i].n;
              arrayRegistros.push(objCupones);
          }*/

        }


        return arrayOvs;


      } catch (excepcion) {
        log.error('Aplicar Niveles Accion', 'INPUT DATA - Excepcion Obteniendo ID de Órdenes de Venta A Procesar - Excepcion : ' + excepcion.message.toString());
        log.audit('Aplicar Niveles Accion', 'FIN GET INPUT DATA');
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
      log.audit('Aplicar Niveles Accion', 'INICIO MAP');

      try {

        var resultado = context.value;

        if (!isEmpty(resultado)) {

          var searchResult = JSON.parse(resultado);

          if (!isEmpty(searchResult)) {

            var obj = new Object({});

            obj.idInternoOV = searchResult.iOV;
            obj.idOrden = searchResult.iOrden;
            obj.nivelAccion = searchResult.nAccion;

            var clave = obj.idInternoOV;

            context.write(clave, JSON.stringify(obj));

          } else {
            log.error('Aplicar Niveles Accion', 'MAP - Error Obteniendo Resultados de ID de OVs A Procesar');
          }

        } else {
          log.error('Aplicar Niveles Accion', 'MAP - Error Parseando Resultados de ID de OVs A Procesar');
        }

      } catch (excepcion) {
        log.error('Aplicar Niveles Accion', 'MAP - Excepcion Procesando ID de OVs A Procesar - Excepcion : ' + excepcion.message.toString());
      }

      log.audit('Aplicar Niveles Accion', 'FIN MAP');

    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
      log.audit('Aplicar Niveles Accion', 'INICIO REDUCE - KEY : ' + context.key);

      var error = false;
      var mensajeError = '';

      if (!isEmpty(context.values) && context.values.length > 0) {
        var idInternoOV = context.key;
        // INICIO - Agregar nivel de acción
        var objRecord = record.load({
          type: 'salesorder',
          id: idInternoOV,
          isDynamic: true,
        });
        for (var i = 0; !isEmpty(context.values) && context.values.length > 0 && i < context.values.length; i++) {
          registro = JSON.parse(context.values[i]);
          log.audit('idOV, idOrden, NivelAccion', registro);
          if (!isEmpty(registro)) {
            var idOrden = registro.idOrden;
            var nivelAccion = registro.nivelAccion;

            var linea = objRecord.findSublistLineWithValue({
              sublistId: 'item',
              fieldId: 'custcol_3k_id_orden',
              value: idOrden
            });
            objRecord.selectLine({
              sublistId: 'item',
              line: linea
            });
            var nivelesAplicados = objRecord.getCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_3k_niveles_accion_aplicados'
            }) || 0;

            objRecord.setCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_3k_niveles_accion_aplicados',
              value: parseInt(nivelesAplicados, 10) + 1
            });
            objRecord.setCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_3k_nivel_accion_vigente',
              value: nivelAccion
            });
            objRecord.commitLine({
              sublistId: 'apply'
            });
          }
        }
        var idRegistroOV = '';
        try {
          idRegistroOV = objRecord.save();
          log.debug('map-reduce ov', 'idRegistroOV: ' + idRegistroOV);
        } catch (excepcionOV) {
          error = true;
          mensajeError = 'Excepcion Grabando Orden de Venta con ID Interno : ' + idInternoOV + ' - Excepcion : ' + excepcionOV.message.toString();
        }
        if (isEmpty(idRegistroOV) && !error) {
          error = true;
          mensajeError = 'Error Grabando Orden de Venta con ID Interno : ' + idInternoOV + ' - Error : No se recibio el ID Interno de la OV Actualizada';
        }

        // FIN - Agregar nivel de acción


        var respuesta = new Object();
        respuesta.idInternoOV = idInternoOV;
        respuesta.error = false;
        respuesta.mensaje = "";

        if (error == true) {
          log.error('Generar Ordenes de Venta Envio', 'REDUCE - ' + mensajeError);
          respuesta.error = true;
          respuesta.mensaje = mensajeError;
        } else {
          respuesta.mensaje = 'El OV con ID Interno : ' + idInternoOV + ' Se actualizo correctamente';
        }

        log.audit('Generar Ordenes de Venta Envio', 'FIN REDUCE - KEY : ' + context.key + ' ID IV ACTUALIZO : ' + idInternoOV);

        context.write(context.key, respuesta);
      } else {
        error = true;
        mensajeError = "Error No se Recibio Informacion del registro de Cupon para Generar Ordenes de Venta Envio";
      }
    }

    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {

      log.audit('Aplicar Niveles Accion', 'INICIO SUMMARIZE');

      log.audit('Aplicar Niveles Accion', 'FIN SUMMARIZE');

      handleErrorIfAny(summary);
    }

    return {
      getInputData: getInputData,
      map: map,
      reduce: reduce,
      summarize: summarize
    };

  });
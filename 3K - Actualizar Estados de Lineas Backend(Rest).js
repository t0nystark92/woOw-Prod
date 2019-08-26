/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType Restlet
 * @NModuleScope Public
 */
/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities',
        '3K/funcionalidadesOV': './3K - Funcionalidades OV'
    }
});*/

define(['N/error', 'N/record', 'N/search', 'N/runtime', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function(error, record, search, runtime, utilities, funcionalidades) {

        function doPost(requestBody) {
          var objRespuesta = {};
          objRespuesta.error = false;
          objRespuesta.msj = "";
          var errorProceso = false;
          var mensajeError = "";
          log.debug('requestBody', requestBody);
          var informacion = requestBody;//JSON.parse(requestBody);
          log.debug('informacion', informacion);
          log.audit('doPost', 'INICIO');
          if (utilities.isEmpty(informacion)){
            errorProceso = true;
            mesnajeError = "No se recibio informacion para iniciar el proceso."
          }
          if (errorProceso == false && (utilities.isEmpty(informacion.idOV) || utilities.isEmpty(informacion.idItem) || utilities.isEmpty(informacion.idStatus))) {
            log.error('Faltan Datos', 'Faltan datos para completar la operacion');
            errorProceso = true;
            mensajeError = "Faltan datos necesarios para completar la operacion: ";
            mensajeError += (utilities.isEmpty(informacion.idOV)) ? 'ID de Orden de Venta - ' : '';
            mensajeError += (utilities.isEmpty(informacion.idItem)) ? 'ID de Artículo - ' : '';
            mensajeError += (utilities.isEmpty(informacion.idStatus)) ? 'ID de Nuevo Estado - ' : '';
          }
          if (errorProceso == false){
            log.debug('doPost cargar OV','Cargar OV - INICIO');
            try{
              var rec = record.load({
                type: 'salesorder',
                id: informacion.idOV,
                isDynamic: true
              });
              var esServicio = rec.getValue({
                fieldId: 'custbody_3k_ov_servicio'
              });
              if ((typeof esServicio == 'boolean' && esServicio == false) || (typeof esServicio == 'string' && esServicio == 'T')) {
                throw error.create('EROV001','El ID: '+informacion.idOV+' no corresponde a una Orden de Venta de Servicios');
              }
            }catch(e){
              errorProceso = true;
              mensajeError = JSON.stringify(e);
              log.error('Error cargando OV', mensajeError);
            }
            log.debug('doPost cargar OV', 'Cargar OV - FIN');
            if (errorProceso == false) {
              log.debug('doPost - Validar item', 'Verificar que el item existe en la OV - INICIO');
              var lineaItem = rec.findSublistLineWithValue({
                sublistId: 'item',
                fieldId: 'item',
                value: informacion.idItem
              });
              if (lineaItem == -1){
                errorProceso = true;
                mensajeError = "El artículo referido no se encuentra en la Orden de Venta especificada";
              }
              log.debug('doPost - Validar item', 'Verificar que el item existe en la OV - FIN');
            }
            if (errorProceso == false){
              log.debug('doPost - Colocar estado serv', 'Cambiar estado de servicio de línea - INICIO');
              var cantLineas = rec.getLineCount('item');
              for (var i = 0; i < cantLineas; i++){
                rec.selectLine({
                  sublistId: 'item',
                  line: i
                });
                var item = rec.getCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'item'
                });
                if (item == informacion.idItem){
                  rec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_3k_estados_servicios',
                    value: informacion.idStatus
                  });
                  rec.commitLine({
                    sublistId: 'item'
                  });
                }
              }
              try{
                rec.save();
              } catch (e) {
                errorProceso = true;
                mensajeError = JSON.stringify(e);
                log.error('Error guardando OV', mensajeError);
              }
              log.debug('doPost - Colocar estado serv', 'Cambiar estado de servicio de línea - FIN');
            }
          }
          if (errorProceso == false) {
            objRespuesta.error = false;
            objRespuesta.msj = "Órden de Venta " + informacion.idOV + " modificada satisfactoriamente";
          } else {
            objRespuesta.error = true;
            objRespuesta.msj = mensajeError;
            //AGREGAR NOTAS DEL SISTEMA EN CASO DE ERROR.
            var currScript = runtime.getCurrentScript();
            var tipoNota = currScript.getParameter('custscript_3k_tipo_nota_estados_lineas');
            var crearNotaError = funcionalidades.crearNota(informacion.idOV, 'Actualizando estado de línea - Excepcion', tipoNota, mensajeError);
            log.debug('Resultado de crearNotaError', crearNotaError);
          }
          log.audit('doPost', 'FIN');
          
          return objRespuesta;
        }

        return {
          post: doPost
        }
      });
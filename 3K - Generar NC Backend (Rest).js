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

define(['N/error', 'N/record', 'N/search', 'N/format', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function(error, record, search, format, utilities, funcionalidades) {

        function doPost(requestBody) {
          var objRespuesta = {};
          objRespuesta.error = false;
          objRespuesta.msj = "";
          var errorProceso = false;
          var mensajeError = "";
          var informacion = requestBody;
          log.audit('doPost', 'INICIO');
          if (utilities.isEmpty(informacion)){
            errorProceso = true;
            mesnajeError = "No se recibio informacion para iniciar el proceso."
          }
          if (errorProceso === false && utilities.isEmpty(informacion.idInv)) {
            errorProceso = true;
            mensajeError = "Faltan datos necesarios para completar la operacion: ";
            mensajeError += (utilities.isEmpty(informacion.idInv)) ? 'ID de Factura - ' : '';
          }
          
          //Generar Autorizacion de Devolucion
          if(errorProceso === false){
            log.audit('doPost', 'INICIO - Autorizacion de Devolucion');
            var returnAuth = record.transform({
              fromType: record.Type.INVOICE,
              fromId: informacion.idInv,
              toType: record.Type.RETURN_AUTHORIZATION,
              isDynamic: true
            });
            returnAuth.setValue({
              fieldId: 'orderstatus',
              value: 'B'
            });
            try{
              var idRetAuth = returnAuth.save();
            }catch (e){
              errorProceso = true;
              mensajeError = JSON.stringify(e);
              log.error('Error creando autorizacion',mensajeError);
            }
             if (errorProceso === false && utilities.isEmpty(idRetAuth)) {
               errorProceso = true;
               mensajeError = "Ocurrió un error desconocido y no se obtuvo el ID de la Autorización de Devolucion generada.";
             }
            log.audit('doPost', 'FIN - Autorizacion de Devolucion');
          }

          //Generar Nota de Crédito
          if (errorProceso === false) {
            log.audit('doPost', 'INICIO - Nota de Credito');
            var custCred = record.transform({
              fromType: record.Type.RETURN_AUTHORIZATION,
              fromId: idRetAuth,
              toType: record.Type.CREDIT_MEMO,
              isDynamic: true
            });
            try {
              var idCustCred = custCred.save();
            } catch (e) {
              errorProceso = true;
              mensajeError = JSON.stringify(e);
              log.error('Error creando autorizacion', mensajeError);
            }
            if (errorProceso === false && utilities.isEmpty(custCred)) {
              errorProceso = true;
              mensajeError = "Ocurrió un error desconocido y no se obtuvo el ID de la Nota de Crédito generada.";
            }
            log.audit('doPost', 'FIN - Nota de Credito');
          }

          if (errorProceso === false){
            objRespuesta.idCustCred = parseInt(idCustCred,10);
            objRespuesta.idRetAuth = parseInt(idRetAuth,10);
            objRespuesta.msj = "Reembolso procesado correctamente."
          } else{
            objRespuesta.error = true;
            objRespuesta.msj = mensajeError;
            //AGREGAR NOTAS DEL SISTEMA EN CASO DE ERROR.
            var currScript = runtime.getCurrentScript();
            var tipoNota = currScript.getParameter('custscript_3k_tipo_nota_nc_back');
            var crearNotaError = funcionalidades.crearNota(informacion.idInv, 'Actualizando estado de línea - Excepcion', tipoNota, mensajeError);
          }

          return objRespuesta;
        }

        return {
          post: doPost
        }
      });
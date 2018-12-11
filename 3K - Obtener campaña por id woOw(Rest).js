/**
* @NApiVersion 2.x
* @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
* @NScriptType Restlet
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
function(error, record, search, format, utilities) {

    function doPost(requestBody) {

        log.audit('doPost', 'INCIO OBTENER CAMPAÑA');
        var objRespuesta = new Object({});
        objRespuesta.error = false;
        objRespuesta.msj = "";
        objRespuesta.campaigns = [];
        //objRespuesta.detalle = new Array();
        //var fechaUso = null;
		
        try {

            if (!utilities.isEmpty(requestBody)) {

                informacion = JSON.parse(requestBody);
              	var values = [];
              	for (var i = 0; i < informacion.length; i++) {
                  	values.push(informacion[i]);
                }
              	var objJSON = new Object({});

                objJSON = informacion[i];
                //busqueda de todos los cupones que no tienen estado consumido
                var arrayParam = [];
              	var objParam = new Object({});
                objParam.name = 'externalid';
                objParam.operator = 'IS';
                //objParam.values = [objJSON.id];
              	objParam.values = values;
                arrayParam.push(objParam);

                var result = utilities.searchSavedPro('customsearch_woow_obtener_campana', arrayParam);
              	//result.objRsponseFunction.result[0].external_id = 'Test';
                return result.objRsponseFunction.result;

            }

        } catch (e) {
            objRespuesta.error = true;
            objRespuesta = new Object();
            objRespuesta.codigo = "RCAM002";
            objRespuesta.mensaje = "Excepción: " + e;
            objRespuesta.detalle.push(objRespuestaParcial);
            //objRespuesta.tipoError = "RCAM002";
            //objRespuesta.msj = "Excepción: " + e;
            log.error('RCAM002', 'Obtener campaña doPost Excepción: ' + e);
        }
        log.audit('doPost', 'FIN OBTENER CAMPAÑA');
        return JSON.stringify(objRespuesta);

    }

    return {
        post: doPost
    };
});

/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/

define(['N/error', 'N/record', 'N/search', 'N/ui/dialog', 'N/ui/message', '3K/utilities'],
/**
 * @param {error} error
 * @param {record} record
 * @param {search} search
 */

function(error, record, search , dialog, message, utilities) {
	
    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
    	try{
	    	log.audit('Inicio Grabar Configuracion Etiquetas Envio','Submit - Tipo : Configuracion Etiquetas Envio');
	    	var recId = scriptContext.currentRecord.id;
            var sitio = scriptContext.currentRecord.getValue({fieldId:'custrecord_77_cseg_3k_sitio_web_o'});

	    	var mySearch = search.load({
	            id: 'customsearch_3k_configuracion_etiq_env'
	        });
        	
	    	if(!utilities.isEmpty(recId)){
	        	var filtroID=search.createFilter({
	                name: 'internalid',
	                operator: search.Operator.NONEOF,
	                values: [recId]
		          });
		        
	        	mySearch.filters.push(filtroID);
    		}
        	
            if(!utilities.isEmpty(sitio)){
                var filtroSitio=search.createFilter({
                    name: 'custrecord_77_cseg_3k_sitio_web_o',
                    operator: search.Operator.ANYOF,
                    values: [sitio]
                  });
                
                mySearch.filters.push(filtroSitio);
            }

			var resultSet = mySearch.run();
	        var searchResult = resultSet.getRange({
	            start: 0,
	            end: 1000
	            });

	        if(!utilities.isEmpty(searchResult) && searchResult.length>0){
	    		alert('Solo puede cargar una configuraci' + '\u00f3' + 'n de Etiquetas Envio por Sitio. Verifique.');
	    		return false;
	    	}
	    	return true;
		        
    }
    catch(excepcion){
    	log.error('Grabar Configuracion Etiquetas Envio','Submit - Excepcion Grabando Configuracion Etiquetas Envio - Excepcion : ' + excepcion.message);
    }
    log.audit('Fin Grabar Configuracion Etiquetas Envio','Submit - Tipo : Configuracion Etiquetas Envio');
    return true;
    }

    return {
        saveRecord: saveRecord
    };
    
});

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
	    	log.audit('Inicio Grabar Configuracion de Stock Propio','Submit - Tipo : Configuracion Stock Propio');
	    	var recId = scriptContext.currentRecord.id;
            var sitio = scriptContext.currentRecord.getValue({fieldId:'custrecord_3k_config_stkp_sitio'});

	    	var mySearch = search.load({
	            id: 'customsearch_3k_configuracion_stock_prop'
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
                    name: 'custrecord_3k_config_stkp_sitio',
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
	    		alert('Solo puede cargar una configuraci' + '\u00f3' + 'n de Stock Propio. Verifique.');
	    		return false;
	    	}
	    	return true;
		        
    }
    catch(excepcion){
    	log.error('Grabar Configuracion de Stock Propio','Submit - Excepcion Grabando Configuracion de Stock Propio - Excepcion : ' + excepcion.message);
    }
    log.audit('Fin Grabar Configuracion de Stock Propio','Submit - Tipo : Configuracion Stock Propio');
    return true;
    }

    return {
        saveRecord: saveRecord
    };
    
});

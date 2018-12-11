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
	    	log.audit('Inicio Grabar Configuracion Unidad Indexada','Submit - Tipo : Configuracion Unidad Indexada');
	    	var recId = scriptContext.currentRecord.id;

	    	var mySearch = search.load({
	            id: 'customsearch_3k_configuracion_uni_index'
	        });
        	
	    	if(!utilities.isEmpty(recId)){
	        	var filtroID=search.createFilter({
	                name: 'internalid',
	                operator: search.Operator.NONEOF,
	                values: [recId]
		          });
		        
	        	mySearch.filters=[filtroID];
    		}
        	
			var resultSet = mySearch.run();
	        var searchResult = resultSet.getRange({
	            start: 0,
	            end: 1000
	            });

	        if(!utilities.isEmpty(searchResult) && searchResult.length>0){
	    		alert('Solo puede cargar una configuraci' + '\u00f3' + 'n de Unidad Indexada. Verifique.');
	    		return false;
	    	}
	    	return true;
		        
    }
    catch(excepcion){
    	log.error('Grabar Configuracion Unidad Indexada','Submit - Excepcion Grabando Configuracion Unidad Indexada - Excepcion : ' + excepcion.message);
    }
    log.audit('Fin Grabar Configuracion Unidad Indexada','Submit - Tipo : Configuracion Unidad Indexada');
    return true;
    }

    return {
        saveRecord: saveRecord
    };
    
});

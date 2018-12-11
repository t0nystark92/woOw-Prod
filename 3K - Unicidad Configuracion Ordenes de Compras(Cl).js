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
	    	log.audit('Inicio Grabar Configuracion Ordenes de Compras','Submit - Tipo : Configuracion Orden de Compra');
	    	var recId = scriptContext.currentRecord.id;

	    	var mySearch = search.load({
	            id: 'customsearch_3k_configuracion_ord_compra'
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
	    		alert('Solo puede cargar una configuraci' + '\u00f3' + 'n de Orden de Compra. Verifique.');
	    		return false;
	    	}
	    	return true;
		        
    }
    catch(excepcion){
    	log.error('Grabar Configuracion Ordenes de Compras','Submit - Excepcion Grabando Configuracion de Orden de Compra - Excepcion : ' + excepcion.message);
    }
    log.audit('Fin Grabar Configuracion Ordenes de Compras','Submit - Tipo : Configuracion Orden de Compra');
    return true;
    }

    return {
        saveRecord: saveRecord
    };
    
});

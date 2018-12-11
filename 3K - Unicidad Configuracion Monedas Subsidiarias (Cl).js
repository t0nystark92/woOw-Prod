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
	    	log.audit('Inicio Grabar Configuracion Monedas Subsidiarias','Submit - Tipo : Configuracion Monedas Subsidiarias');
	    	var recId = scriptContext.currentRecord.id;
            var subsidiaria = scriptContext.currentRecord.getValue({fieldId:'custrecord_3k_configuracion_mon_sub_s'});

	    	var mySearch = search.load({
	            id: 'customsearch_3k_configuracion_mon_sub'
	        });
        	
	    	if(!utilities.isEmpty(recId)){
	        	var filtroID=search.createFilter({
	                name: 'internalid',
	                operator: search.Operator.NONEOF,
	                values: [recId]
		          });
		        
	        	mySearch.filters.push(filtroID);
    		}
        	
            if(!utilities.isEmpty(subsidiaria)){
                var filtroSubsidiaria=search.createFilter({
                    name: 'custrecord_3k_configuracion_mon_sub_s',
                    operator: search.Operator.ANYOF,
                    values: [subsidiaria]
                  });
                
                mySearch.filters.push(filtroSubsidiaria);
            }

			var resultSet = mySearch.run();
	        var searchResult = resultSet.getRange({
	            start: 0,
	            end: 1000
	            });

	        if(!utilities.isEmpty(searchResult) && searchResult.length>0){
	    		alert('Solo puede cargar una configuraci' + '\u00f3' + 'n de Moneda Subsidiaria por Subsidiaria. Verifique.');
	    		return false;
	    	}
	    	return true;
		        
    }
    catch(excepcion){
    	log.error('Grabar Configuracion Monedas Subsidiarias','Submit - Excepcion Grabando Configuracion Monedas Subsidiarias - Excepcion : ' + excepcion.message);
    }
    log.audit('Fin Grabar Configuracion Monedas Subsidiarias','Submit - Tipo : Configuracion Monedas Subsidiarias');
    return true;
    }

    return {
        saveRecord: saveRecord
    };
    
});

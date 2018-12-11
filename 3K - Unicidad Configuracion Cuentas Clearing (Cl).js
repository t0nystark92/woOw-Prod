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
	    	log.audit('Inicio Grabar Configuracion Cuentas Clearing','Submit - Tipo : Configuracion Cuentas Clearing');
	    	var recId = scriptContext.currentRecord.id;
            var subsidiaria = scriptContext.currentRecord.getValue({fieldId:'custrecord_3k_config_ctas_clearing_sub'});
            var moneda = scriptContext.currentRecord.getValue({fieldId:'custrecord_3k_config_ctas_clearing_mon'});

	    	var mySearch = search.load({
	            id: 'customsearch_3k_configuracion_ctas_clear'
	        });
        	
	    	if(!utilities.isEmpty(recId)){
	        	var filtroID=search.createFilter({
	                name: 'internalid',
	                operator: search.Operator.NONEOF,
	                values: [recId]
		          });
		        
	        	mySearch.filters=[filtroID];
    		}

            if(!utilities.isEmpty(subsidiaria)){
                var filtroSubsidiaria=search.createFilter({
                    name: 'custrecord_3k_config_ctas_clearing_sub',
                    operator: search.Operator.ANYOF,
                    values: [subsidiaria]
                  });
                
                mySearch.filters.push(filtroSubsidiaria);
            }

            if(!utilities.isEmpty(moneda)){
                var filtroMoneda=search.createFilter({
                    name: 'custrecord_3k_config_ctas_clearing_mon',
                    operator: search.Operator.ANYOF,
                    values: [moneda]
                  });
                
                mySearch.filters.push(filtroMoneda);
            }
        	
			var resultSet = mySearch.run();
	        var searchResult = resultSet.getRange({
	            start: 0,
	            end: 1000
	            });

	        if(!utilities.isEmpty(searchResult) && searchResult.length>0){
	    		alert('Solo puede cargar una configuraci' + '\u00f3' + 'n de Cuentas Clearing por moneda. Verifique.');
	    		return false;
	    	}
	    	return true;
		        
    }
    catch(excepcion){
    	log.error('Grabar Configuracion Cuentas Clearing','Submit - Excepcion Grabando Configuracion Cuentas Clearing - Excepcion : ' + excepcion.message);
    }
    log.audit('Fin Grabar Configuracion Cuentas Clearing','Submit - Tipo : Configuracion Cuentas Clearing');
    return true;
    }

    return {
        saveRecord: saveRecord
    };
    
});

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
	    	log.audit('Inicio Grabar Configuracion Tipos IVA','Submit - Tipo : Configuracion Tipos IVA');
	    	var recId = scriptContext.currentRecord.id;
	    	var alicuota = scriptContext.currentRecord.getValue({fieldId:'custrecord_3k_tipos_iva_alicuota'});
	    	var idProgramaFiscal = scriptContext.currentRecord.getValue({fieldId:'custrecord_3k_tipos_iva_prog_fisc'});
	    	
	    	var mySearch = search.load({
	            id: 'customsearch_3k_tipos_iva'
	        });
	    	
	    	var filtros =  new Array();
	    	var indiceFiltros=0;
        	
	    	if(!utilities.isEmpty(recId)){
	        	var filtroID=search.createFilter({
	                name: 'internalid',
	                operator: search.Operator.NONEOF,
	                values: [recId]
		          });
		        
	        	filtros[indiceFiltros++]=filtroID;
    		}   	
	    	
	    	mySearch.filters=filtros;
	    
			var resultSet = mySearch.run();
	        var searchResult = resultSet.getRange({
	            start: 0,
	            end: 1000
	            });
	        var encontrado=false;
	        if(!utilities.isEmpty(searchResult) && searchResult.length>0){
	        	for(var i=0 ; i<searchResult.length && encontrado==false ; i++)
                {
                  var programaFiscal=searchResult[i].getValue({
		        		name: resultSet.columns[1]});
                  var porcentajeAlicuota=searchResult[i].getValue({
		        		name: resultSet.columns[2]});
                  if(programaFiscal==idProgramaFiscal || porcentajeAlicuota==alicuota){
                         encontrado=true;
                         alert('Solo puede cargar una configuraci' + '\u00f3' + 'n de Tipos IVA por Alicuota y Programa Fiscal. Verifique.');
                      return false;
                      }
                }
	    	}
	    	return true;
		        
    }
    catch(excepcion){
    	log.error('Grabar Configuracion Tipos IVA','Submit - Excepcion Grabando Configuracion Tipos IVA - Excepcion : ' + excepcion.message);
    }
    log.audit('Fin Grabar Configuracion Tipos IVA','Submit - Tipo : Configuracion Tipos IVA');
    return true;
    }

    return {
        saveRecord: saveRecord
    };
    
});

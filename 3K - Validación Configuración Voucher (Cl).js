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
      log.audit('Inicio Grabar Configuracion Voucher','Submit - Tipo : Configuracion Voucher');
      var recId = scriptContext.currentRecord.id;

      /*var obj = new Object();
      obj.name = 'internalid';
      obj.operator = search.Operator.NONEOF;
      obj.values = [recId];*/

      //var objResult = utilities.searchSaved('customsearch_3k_configuracion_voucher_ss',obj);
      var mySearch = search.load({
             id: 'customsearch_3k_configuracion_voucher_ss'
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

             //log.audit('saveRecord', 'o')

         if(!utilities.isEmpty(searchResult) && searchResult.length>0){
       alert('Solo puede cargar una configuraci' + '\u00f3' + 'n de Voucher. Verifique.');
       return false;
      }
      /*log.audit('Configuracion Voucher','id: '+recId.toString());
      if (!utilities.isEmpty(recId)){
          alert('Solo puede cargar una configuraci' + '\u00f3' + 'n de Voucher. Verifique.');
          return false;
      }*/
      return true;
          
    }
    catch(excepcion){
     log.error('Grabar Configuracion Voucher','Submit - Excepcion Grabando Configuracion Voucher - Excepcion : ' + excepcion.message);
    }
    log.audit('Fin Grabar Configuracion Voucher','Submit - Tipo : Configuracion Voucher');
    return true;
    }

    return {
        saveRecord: saveRecord
    };
    
});
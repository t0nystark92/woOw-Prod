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

define(['N/error', 'N/record', '3K/utilities'],
/**
 * @param {error} error
 * @param {record} record
 * @param {search} search
 */
function(error, record, utilities) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {

    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {
    	
    	/**
    	 * @Titulo: Validación PROC002 - REQ007.1
    	 * @Descripcion: Al agregar una Línea nueva se deberá completar el campo “Fecha Creación” con la fecha actual del sistema.
    	 * @Autor: Antony Aguilera
    	 * @Fecha: 13-12-2016
    	 */
    	try{
    	log.audit('Validar Linea Transacción','Inicio el proceso');
    	
        var sublistID = scriptContext.sublistId;
        
        log.audit('Orden de Venta (Cl)','sublist: '+sublistID);
        
        var record = scriptContext.currentRecord;
        var fecha = new Date();
        
        //log.audit('DEBUG','fechaActual: '+fecha + 'typeof: '+ typeof(fecha));
        
        var recordObject = new Object();
    	recordObject.fechaCreacion = record.getCurrentSublistValue({
    		sublistId: sublistID,
    		fieldId: 'custcol_3k_fecha_creacion' 
    	});
        
    	//log.audit('DEBUG','fcehaLinea: '+recordObject.fechaCreacion + 'typeof: '+ typeof(recordObject.fechaCreacion));
    	
        if (utilities.isEmpty(recordObject.fechaCreacion)){
        	//log.audit('Orden de Venta (Cl)', 'Entró Crear Fecha')
    	    record.setCurrentSublistValue({
    	    	sublistId: sublistID,
    	    	fieldId: 'custcol_3k_fecha_creacion',
    	    	value: fecha
    	    });
        }
        
        record.setCurrentSublistValue({
        	 sublistId: sublistID,
        	fieldId: 'custcol_3k_fecha_modificacion',
        	value: fecha
        });

    }catch(e){
            log.error('CORV001', 'funtion validateLine: ' + e.message);
            return false;

    }
        
        log.audit('Validar Linea Transacción','Finalizó el proceso');
        
        return true;
    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    
    
    
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

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

    }

    return {
        
        validateLine: validateLine
      
    };
    
});

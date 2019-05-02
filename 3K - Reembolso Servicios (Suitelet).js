/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/search', 'N/record', 'N/ui/serverWidget'], function(search, record, serverWidget) {

    function onRequest(context) {

        log.audit('SUITELET AUDIT', 'INICIO SUITELET')
        try{

            var form = serverWidget.createForm({
                title: 'Reembolso Servicios'
            });

            //form.clientScriptFileId = 6026;
            form.clientScriptModulePath = './3K - Reembolso Servicios (Cliente).js'

            var grupoFiltros = form.addFieldGroup({
                id: 'filtros',
                label: 'Criterios de Busqueda de Depositos'
            });

            var grupoDatos = form.addFieldGroup({
                id: 'infordepositos',
                label: 'Informacion Depositos'
            });

            var tabDetalle = form.addTab({
                id: 'tabdetalle',
                label: 'Detalle'
            });

            var subTab = form.addSubtab({
                id: 'tabbusqueda',
                label: 'Depositos',
                tab: 'tabdetalle'
            });

            

        }catch(e){
            log.error('ERROR CATCH SUITELET', e.message)
        }

        log.audit('SUITELET AUDIT', 'FIN SUITELET')
        
    }

    return {
        onRequest: onRequest
    }
});

/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/

define(['N/error', 'N/record', 'N/search', '3K/utilities'],

    function(error, record, search, utilities) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {

        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {
            log.audit('Inicio Grabar Stock Terceros', 'Inicio el proceso');

            var record = scriptContext.newRecord;

            try {
                //log.audit('DEBUG ', 'context: '+ JSON.stringify(runtime.executionContext));

                var recordObject = new Object();
                recordObject.id = record.id;
                log.audit('stock Terceros', 'id interno: ' + recordObject.id);
                recordObject.push = record.getValue({ fieldId: 'custrecord_3k_stock_tercero_push' });
                recordObject.fechaIni = record.getValue({ fieldId: 'custrecord_3k_stock_terc_fecha_ini' });
                recordObject.fechaFin = record.getValue({ fieldId: 'custrecord_3k_stock_terc_fecha_fin' });
                recordObject.stockIni = record.getValue({ fieldId: 'custrecord_3k_stock_terc_stock_ini' });
                recordObject.stockConsumido = record.getValue({ fieldId: 'custrecord_3k_stock_terc_stock_cons' });
                recordObject.proveedor = record.getValue({ fieldId: 'custrecord_3k_stock_terc_proveedor' });
                recordObject.articulo = record.getValue({ fieldId: 'custrecord_3k_stock_terc_articulo' });


                //log.audit('DEBUG ', 'push: '+ recordObject.push+ ' typeof: '+typeof(recordObject.push));
                //log.audit('DEBUG ', 'fecha ini: '+ recordObject.fechaIni);
                //log.audit('DEBUG ', 'fecha fin: '+ recordObject.fechaFin);

                /**
                 * @Titulo: Validación PROC001 - REQ003.1 
                 * @Descripción: Valida que si la casilla de verificación push is true la fecha de inicio y fin no vengan vacías 
                 * @Autor: Antony Aguilera
                 * @Fecha: 07-12-2016
                 */

                if (recordObject.push && (utilities.isEmpty(recordObject.fechaIni) || utilities.isEmpty(recordObject.fechaFin))) {

                    //alert('Completar campo de fecha de inicio o fecha fin.');
                    log.error('SSTK001', 'Validación: Push is true y tiene alguna fecha vacía');
                    throw utilities.crearError('SSTK001', 'Completar campo de fecha de inicio o fecha fin.')
                        //return false;
                }

                /**
                 * @Titulo: Validación PROC001 - REQ003.2
                 * @Descripcion: Valida que el stock consumido no sea mayor que el stock inicial
                 * @Autor: Antony Aguilera
                 * @Fecha: 12-12-2016
                 */

                /*if (recordObject.stockIni < recordObject.stockConsumido) {
                    //alert('Stock inicial menor que stock consumido.');
                    log.error('SSTK002', 'Validación: Stock Inicial menor que stock Consumido');
                    throw utilities.crearError('SSTK002', 'Stock inicial menor que stock consumido.');

                    //return false;
                }*/

                /**
                 * @Titulo: Validación PROC001 - REQ003.3
                 * @Descripcion: Validar que un Registro con Push sea único por Proveedor para un determinado rango de Fechas (Rango comprendido entre Fecha de Inicio y Fecha de Fin).
                 * @Autor: Antony Aguilera
                 * @Fecha: 12-12-2016
                 */
                var stockTercerosPushSS = search.load({
                    id: 'customsearch_3k_stock_ter_push'
                });




                /*var filtros =  new Array();
        //var indiceFiltros=0;
        
        filtros = [
                  ['custrecord_3k_stock_terc_proveedor', 'is', [recordObject.proveedor]]
              ]
        //stockTercerosPushSS.filters.push = filtros;
        
        filtros = [
                   ['custrecord_3k_stock_terc_proveedor', 'is', [recordObject.proveedor]],
                   'and', ['custrecord_3k_stock_terc_fecha_ini', 'onorafter', [recordObject.fechaIni]],
                   'and', ['custrecord_3k_stock_terc_fecha_fin', 'onorbefore', [recordObject.fechaIni]]
               ]
        
        */
                if (utilities.isEmpty(recordObject.id)) {
                    if (!utilities.isEmpty(recordObject.proveedor)) {
                        var filtroID = search.createFilter({
                            name: 'custrecord_3k_stock_terc_proveedor',
                            operator: search.Operator.IS,
                            values: [recordObject.proveedor]
                        });


                    }
                    stockTercerosPushSS.filters.push(filtroID);

                    if (!utilities.isEmpty(recordObject.articulo)) {
                        var filtroArticulo = search.createFilter({
                            name: 'custrecord_3k_stock_terc_articulo',
                            operator: search.Operator.IS,
                            values: [recordObject.articulo]
                        });


                    }
                    stockTercerosPushSS.filters.push(filtroArticulo);

                    //mySearch.filters=filtros;


                    var resultSearch = stockTercerosPushSS.run();
                    var rangeResult = resultSearch.getRange({
                        start: 0,
                        end: 1000
                    });

                    //log.audit('DEBUG','rangeResult: '+rangeResult.length);

                    if (rangeResult.length > 0) {

                        var objectSS = new Object();

                        for (var i = 0; i < rangeResult.length; i++) {

                            //var proveedor = rangeResult[i].getValue({name: resultSearch.columns[3]});
                            objectSS.fechaIni = rangeResult[i].getValue({ name: resultSearch.columns[0] });
                            objectSS.fechaFin = rangeResult[i].getValue({ name: resultSearch.columns[1] });
                            //var push = resultSearch[i].getValue({name: 'Push'});
                            /*
                            log.audit('DEBUG','objfechaIni: '+objectSS.fechaIni+ ' typeof: '+typeof(objectSS.fechaIni));
                            log.audit('DEBUG','objfechaFin: '+objectSS.fechaFin+ ' typeof: '+typeof(objectSS.fechaFin));
                            */
                            var splitFechaIni = objectSS.fechaIni.split(" ");
                            var splitIni = splitFechaIni[0].split("/");
                            var añoIni = splitIni[2];
                            var mesIni = splitIni[0]
                            var diaIni = splitIni[1]
                            var fechaIni = new Date(añoIni, mesIni - 1, diaIni);

                            var splitFechaFin = objectSS.fechaFin.split(" ");
                            var splitFin = splitFechaFin[0].split("/");
                            var añoFin = splitFin[2];
                            var mesFin = splitFin[0]
                            var diaFin = splitFin[1]
                            var fechaFin = new Date(añoFin, mesFin - 1, diaFin);

                            /*
                            log.audit('DEBUG','fechaIni: '+fechaIni+ ' typeof: '+typeof(fechaIni));
                            log.audit('DEBUG','fechaFin: '+fechaFin+ ' typeof: '+typeof(fechaFin));
                
                            log.audit('DEBUG','recordPush: '+recordObject.push+ ' typeof: '+typeof(recordObject.push));
                            log.audit('DEBUG','recordfechaIni: '+recordObject.fechaIni+ ' typeof: '+typeof(recordObject.fechaIni));
                            log.audit('DEBUG','recordfechaFin: '+recordObject.fechaFin+ ' typeof: '+typeof(recordObject.fechaFin));
                            */

                            if (recordObject.push && ((recordObject.fechaIni >= fechaIni && recordObject.fechaIni <= fechaFin) || (recordObject.fechaFin >= fechaIni && recordObject.fechaFin <= fechaFin))) {
                                //alert('Ya existe un push para este proveedor en el rango de fecha seleccionado');
                                log.error('SSTK003', 'Validación: Ya existe un push para el proveedor y articulo en el rango de fecha seleccionado');
                                throw utilities.crearError('SSTK003', 'Ya existe un push para este proveedor y articulo en el rango de fecha seleccionado');
                                //return false;
                            }
                        }
                    }
                }
            } catch (e) {
                log.error('SSTK001', 'function saveRecord: ' + e.message);
                throw utilities.crearError('SSTK001', 'function saveRecord: ' + e.message);
                //return false
            }

            log.audit('Fin Grabar Stock Terceros', 'Finalizó el proceso');
            return true;
        }



        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {

        }

        return {
            beforeSubmit: beforeSubmit
        };

    });

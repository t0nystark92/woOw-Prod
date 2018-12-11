/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities',
        '3K/funcionalidadesOV': './3K - Funcionalidades OV'
    }
});*/
define(['N/error', 'N/record', 'N/search', '3K/utilities', '3K/funcionalidadesOV'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function(error, record, search, utilities, funcionalidades) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {

            var respuesta = new Object({});
            respuesta.error = false;
            respuesta.detalle = [];

            try {

                if (!utilities.isEmpty(context.request)) {
                    var informacion = JSON.parse(context.request.body);

                    if (!utilities.isEmpty(informacion)) {

                        log.debug('Suitelet', 'informacion: ' + JSON.stringify(informacion));

                        //BUSQUEDA COMPONENTES DE ARTICULOS
                        var arraySearchParams = [];
                        var objParam = new Object({});
                        objParam.name = 'internalid';
                        objParam.operator = 'ANYOF';
                        objParam.values = informacion.articulos;
                        arraySearchParams.push(objParam);

                        var objResultSet = utilities.searchSavedPro('customsearch_3k_componentes_art', arraySearchParams);
                        if (objResultSet.error) {
                            context.response.write(JSON.stringify(objResultSet));
                        }

                        var articulo = objResultSet.objRsponseFunction.array; //array que contiene los articulos que vienen en la orden de venta
                        //BUSQUEDA STOCK DE COMPONENTES
                        var arrayComponentes = [];

                        for (var j = 0; j < articulo.length; j++) {
                            arrayComponentes.push(articulo[j]["ID Articulo Componente"]);
                        }

                        var arraySearchParams = [];
                        var objParam = new Object({});
                        objParam.name = 'custrecord_3k_stock_terc_articulo';
                        objParam.operator = 'ANYOF';
                        objParam.values = arrayComponentes;
                        arraySearchParams.push(objParam);

                        var objParam1 = new Object({});
                        objParam1.name = 'custrecord_3k_stock_terc_sitio';
                        objParam1.operator = 'ANYOF';
                        objParam1.values = [informacion.sitio];
                        arraySearchParams.push(objParam1);

                        var objResultSet = utilities.searchSavedPro('customsearch_3k_stock_terceros', arraySearchParams);
                        if (objResultSet.error) {
                            context.response.write(JSON.stringify(objResultSet));
                        }

                        var stockTerceros = objResultSet.objRsponseFunction.array;

                        var arraySearchParams = [];
                        var objParam = new Object({});
                        objParam.name = 'internalid';
                        objParam.operator = 'ANYOF';
                        objParam.values = arrayComponentes;
                        arraySearchParams.push(objParam);

                        var objParam1 = new Object({});
                        objParam1.name = 'inventorylocation';
                        objParam1.operator = 'IS';
                        objParam1.values = [informacion.ubicacion];
                        arraySearchParams.push(objParam1);

                        var objResultSet = utilities.searchSavedPro('customsearch_3k_articulo_disponible', arraySearchParams);
                        if (objResultSet.error) {
                            context.response.write(JSON.stringify(objResultSet));
                        }

                        var stockComponentes = objResultSet.objRsponseFunction.array;

                        respuesta.articulo = articulo;
                        respuesta.stockTerceros = stockTerceros;
                        respuesta.stockComponentes = stockComponentes;


                    } else {

                        respuesta.error = true;
                        objrespuestaParcial = new Object({});
                        objrespuestaParcial.codigo = 'SAOV003';
                        objrespuestaParcial.mensaje += 'Error parseando body json.';
                        respuesta.detalle.push(objrespuestaParcial);

                    }
                } else {
                    respuesta.error = true;
                    objrespuestaParcial = new Object({});
                    objrespuestaParcial.codigo = 'SAOV002';
                    objrespuestaParcial.mensaje += 'No se recibió request Body.';
                    respuesta.detalle.push(objrespuestaParcial);
                }
            } catch (e) {
                respuesta.error = true;
                objrespuestaParcial = new Object({});
                objrespuestaParcial.codigo = 'SAOV001';
                objrespuestaParcial.mensaje += 'Excepción: ' + e;
                respuesta.detalle.push(objrespuestaParcial);
            }

            log.debug('Suitelet', 'response respueta: ' + JSON.stringify(respuesta));

            context.response.write(JSON.stringify(respuesta));

        }

        return {
            onRequest: onRequest
        };

    });

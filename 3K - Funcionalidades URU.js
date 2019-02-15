/**
 * @NApiVersion 2.0
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NModuleScope Public
 */

/*require.config({
    paths: {
        '3K/utilities': './3K - Utilities'
    }
});*/

define(['N/error', 'N/record', 'N/search', '3K/utilities'],
    /**
     * @param {error} error
     * @param {record} record
     * @param {search} search
     */
    function (error, record, search, utilities) {

        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */

        function l598esOneworld() {

            var mySS = search.create({
                type: 'customrecord_l598_datos_impositivos_emp',
                columns: [{
                    name: 'internalid'
                }]
            });

            var arraySearchParams = [];

            var objParam = new Object({});
            objParam.name = 'isinactive';
            objParam.operator = search.Operator.IS;
            objParam.values = ['F'];
            arraySearchParams.push(objParam);

            var objParam2 = new Object({});
            objParam2.name = 'custrecord_l598_dat_imp_es_oneworld';
            objParam2.operator = search.Operator.IS;
            objParam2.values = ['T'];
            arraySearchParams.push(objParam2);

            var filtro = '';

            for (var i = 0; i < arraySearchParams.length; i++) {
                filtro = search.createFilter({
                    name: arraySearchParams[i].name,
                    operator: arraySearchParams[i].operator,
                    values: arraySearchParams[i].values
                });
                mySS.filters.push(filtro);
            }

            //mySS.filters.push(filtro);

            var searchresults = mySS.runPaged();
            log.debug('esOneWorld', 'searchresults: ' + JSON.stringify(searchresults));
            /*var filters = [new nlobjSearchFilter('isinactive', null, 'is', 'F'),
                new nlobjSearchFilter('custrecord_l598_dat_imp_es_oneworld', null, 'is', 'T')];
            var searchresults = new nlapiSearchRecord("customrecord_l598_datos_impositivos_emp", null, filters, null);*/

            //if (searchresults != null && searchresults.length > 0)
            if (searchresults != null && searchresults.count > 0)
                return true;
            else
                return false;
        }

        function letras(c, d, u) {
            var centenas,
                decenas,
                decom;
            var lc = "";
            var ld = "";
            var lu = "";
            centenas = eval(c);
            decenas = eval(d);
            decom = eval(u);

            switch (centenas) {

                case 0:
                    lc = "";
                    break;
                case 1:
                    {
                        if (decenas == 0 && decom == 0)
                            lc = "CIEN";
                        else
                            lc = "CIENTO ";
                    }
                    break;
                case 2:
                    lc = "DOSCIENTOS ";
                    break;
                case 3:
                    lc = "TRESCIENTOS ";
                    break;
                case 4:
                    lc = "CUATROCIENTOS ";
                    break;
                case 5:
                    lc = "QUINIENTOS ";
                    break;
                case 6:
                    lc = "SEISCIENTOS ";
                    break;
                case 7:
                    lc = "SETECIENTOS ";
                    break;
                case 8:
                    lc = "OCHOCIENTOS ";
                    break;
                case 9:
                    lc = "NOVECIENTOS ";
                    break;
            }

            switch (decenas) {

                case 0:
                    ld = "";
                    break;
                case 1:
                    {
                        switch (decom) {

                            case 0:
                                ld = "DIEZ";
                                break;
                            case 1:
                                ld = "ONCE";
                                break;
                            case 2:
                                ld = "DOCE";
                                break;
                            case 3:
                                ld = "TRECE";
                                break;
                            case 4:
                                ld = "CATORCE";
                                break;
                            case 5:
                                ld = "QUINCE";
                                break;
                            case 6:
                                ld = "DIECISEIS";
                                break;
                            case 7:
                                ld = "DIECISIETE";
                                break;
                            case 8:
                                ld = "DIECIOCHO";
                                break;
                            case 9:
                                ld = "DIECINUEVE";
                                break;
                        }
                    }
                    break;
                case 2:
                    ld = "VEINTE";
                    break;
                case 3:
                    ld = "TREINTA";
                    break;
                case 4:
                    ld = "CUARENTA";
                    break;
                case 5:
                    ld = "CINCUENTA";
                    break;
                case 6:
                    ld = "SESENTA";
                    break;
                case 7:
                    ld = "SETENTA";
                    break;
                case 8:
                    ld = "OCHENTA";
                    break;
                case 9:
                    ld = "NOVENTA";
                    break;
            }
            switch (decom) {

                case 0:
                    lu = "";
                    break;
                case 1:
                    lu = "UN";
                    break;
                case 2:
                    lu = "DOS";
                    break;
                case 3:
                    lu = "TRES";
                    break;
                case 4:
                    lu = "CUATRO";
                    break;
                case 5:
                    lu = "CINCO";
                    break;
                case 6:
                    lu = "SEIS";
                    break;
                case 7:
                    lu = "SIETE";
                    break;
                case 8:
                    lu = "OCHO";
                    break;
                case 9:
                    lu = "NUEVE";
                    break;
            }

            if (decenas == 1) {

                return lc + ld;
            }
            if (decenas == 0 || decom == 0) {

                //return lc+" "+ld+lu;
                return lc + ld + lu;
            } else {

                if (decenas == 2) {

                    ld = "VEINTI";
                    return lc + ld + lu.toLowerCase();
                } else {

                    return lc + ld + " Y " + lu
                }
            }
        }

        function getNumberLiteral(n) {
            log.audit('Inicio getNumberLiteral', 'Execute');
            var m0,
                cm,
                dm,
                um,
                cmi,
                dmi,
                umi,
                ce,
                de,
                un,
                hlp,
                decimal;

            if (isNaN(n)) {

                alert("La Cantidad debe ser un valor Numérico.");
                return null;
            }
            m0 = parseInt(n / 1000000000000);
            rm0 = n % 1000000000000;
            m1 = parseInt(rm0 / 100000000000);
            rm1 = rm0 % 100000000000;
            m2 = parseInt(rm1 / 10000000000);
            rm2 = rm1 % 10000000000;
            m3 = parseInt(rm2 / 1000000000);
            rm3 = rm2 % 1000000000;
            cm = parseInt(rm3 / 100000000);
            r1 = rm3 % 100000000;
            dm = parseInt(r1 / 10000000);
            r2 = r1 % 10000000;
            um = parseInt(r2 / 1000000);
            r3 = r2 % 1000000;
            cmi = parseInt(r3 / 100000);
            r4 = r3 % 100000;
            dmi = parseInt(r4 / 10000);
            r5 = r4 % 10000;
            umi = parseInt(r5 / 1000);
            r6 = r5 % 1000;
            ce = parseInt(r6 / 100);
            r7 = r6 % 100;
            de = parseInt(r7 / 10);
            r8 = r7 % 10;
            un = parseInt(r8 / 1);

            //r9=r8%1;
            //999123456789
            if (n < 1000000000000 && n >= 1000000000) {

                tmp = n.toString();
                s = tmp.length;
                tmp1 = tmp.slice(0, s - 9)
                tmp2 = tmp.slice(s - 9, s);

                tmpn1 = getNumberLiteral(tmp1);
                tmpn2 = getNumberLiteral(tmp2);

                if (tmpn1.indexOf("Un") >= 0)
                    pred = " BILLÓN ";
                else
                    pred = " BILLONES ";

                return tmpn1 + pred + tmpn2;
            }

            if (n < 10000000000 && n >= 1000000) {

                mldata = letras(cm, dm, um);
                log.debug('letras', 'mldata: ' + mldata);
                hlp = mldata.replace("UN", "*");
                if (hlp.indexOf("*") < 0 || hlp.indexOf("*") > 3) {

                    mldata = mldata.replace("UNO", "UN");
                    mldata += " MILLONES ";
                } else
                    mldata = "UN MILLÓN ";

                mdata = letras(cmi, dmi, umi);
                cdata = letras(ce, de, un);
                log.debug('letras', 'mdata1: ' + mdata);
                log.debug('letras', 'cdata1: ' + cdata);
                if (mdata != "  ") {
                    if (n == 1000000)
                        mdata = mdata.replace("UNO", "UN") + "DE";
                    else
                        mdata = mdata.replace("UNO", "UN") + " MIL ";
                }

                return (mldata + mdata + cdata);
            }
            if (n < 1000000 && n >= 1000) {

                mdata = letras(cmi, dmi, umi);
                cdata = letras(ce, de, un);
                log.debug('letras', 'mdata2: ' + mdata);
                log.debug('letras', 'cdata2: ' + cdata);
                hlp = mdata.replace("UN", "*");
                if (hlp.indexOf("*") < 0 || hlp.indexOf("*") > 3) {

                    mdata = mdata.replace("UNO", "UN");
                    return (mdata + " MIL " + cdata);
                } else
                    return ("UN MIL " + cdata);
            }
            if (n < 1000 && n >= 1)
                return (letras(ce, de, un));

            if (n == 0)
                return " CERO";

            return "NO DISPONIBLE";
        }


        function getNumeroEnLetras(numero, subsidiaria) {
            log.audit('Inicio getNumeroEnLetras', 'Execute');

            var mySS = search.create({
                type: 'customrecord_l598_datos_impositivos_emp',
                columns: [{
                    name: 'custrecord_l598_dat_imp_usar_d_mont'
                }]
            });

            var arraySearchParams = [];
            var objParam = new Object({});
            objParam.name = 'isinactive';
            objParam.operator = search.Operator.IS;
            objParam.values = ['F'];
            arraySearchParams.push(objParam);

            var objParam1 = new Object({});
            objParam1.name = 'custrecord_l598_dat_imp_subsidiaria';
            objParam1.operator = search.Operator.IS;
            objParam1.values = [subsidiaria];
            arraySearchParams.push(objParam1);

            var filtro = '';

            for (var i = 0; i < arraySearchParams.length; i++) {
                filtro = search.createFilter({
                    name: arraySearchParams[i].name,
                    operator: arraySearchParams[i].operator,
                    values: arraySearchParams[i].values
                });
                mySS.filters.push(filtro);
            }

            var searchRun = mySS.run();
            var completeResultSet = [];
            var resultIndex = 0;
            var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
            var searchresults; // temporary variable used to store the result set

            do {
                // fetch one result set
                searchresults = searchRun.getRange({
                    start: resultIndex,
                    end: resultIndex + resultStep
                });
                if (!utilities.isEmpty(searchresults) && searchresults.length > 0) {
                    if (resultIndex == 0) completeResultSet = searchresults;
                    else completeResultSet = completeResultSet.concat(searchresults);
                }
                // increase pointer
                resultIndex = resultIndex + resultStep;
                // once no records are returned we already got all of them
            } while (!utilities.isEmpty(searchresults) && searchresults.length > 0)

            var usarDecimales = null;
            if (completeResultSet != null && completeResultSet.length > 0) {
                usarDecimales = completeResultSet[0].getValue('custrecord_l598_dat_imp_usar_d_mont');
            }

            if (!utilities.isEmpty(numero)) {

                if (usarDecimales == false) {

                    //Se redondea el numero para no usar los decimales.
                    var parteEntera = Math.round(numero);

                    var parteEnteraLetras = '';

                    // convierto la parte entera en letras
                    parteEnteraLetras = getNumberLiteral(parteEntera);
                    // le hago un TRIM a la parte entera en letras
                    parteEnteraLetras = parteEnteraLetras.replace(/^\s*|\s*$/g, "");

                    var numeroEnLetras = 'Son ' + parteEnteraLetras;

                    // dejo toda la palabra en mayusculas
                    numeroEnLetras = numeroEnLetras.toUpperCase();

                    return numeroEnLetras;
                } else { //hay que usar decimales
                    numero = parseFloat(numero, 10);
                    numero = numero.toFixed(2);
                    var partes = numero.split('.');
                    log.debug('getNumeroEnLetras', 'numero: ' + numero);
                    log.debug('getNumeroEnLetras', 'partes: ' + JSON.stringify(partes));
                    var parteEntera = partes[0];
                    var parteDecimal = partes[1];
                    var parteEnteraLetras = '';

                    // convierto la parte entera en letras
                    parteEnteraLetras = getNumberLiteral(parteEntera);
                    // le hago un TRIM a la parte entera en letras
                    parteEnteraLetras = parteEnteraLetras.replace(/^\s*|\s*$/g, "");

                    var numeroEnLetras = 'Son ' + parteEnteraLetras + ' con ' + parteDecimal;

                    // dejo toda la palabra en mayusculas
                    numeroEnLetras = numeroEnLetras.toUpperCase();

                    // le agrego MN (Moneda Nacional) al final
                    numeroEnLetras = numeroEnLetras + '/100';

                    return numeroEnLetras;
                }
            }
            return NULL;
        }

        function obtenerTipoTransaccionLocal(tipoTransNS, esND, subsidiaria) {
            log.audit('Inicio obtenerTipoTransaccionLocal', 'Execute');
            var objTipoTransLocal = new Object({});
            objTipoTransLocal.error = false;
            objTipoTransLocal.mensaje = "";
            objTipoTransLocal.tipoTransaccionLocal = "";
            objTipoTransLocal.idTipoTransNS = "";

            if (!utilities.isEmpty(tipoTransNS)) {

                var idTipoTransNS = obtenerIDTipoTransNS(tipoTransNS);
                log.debug('obtenerTipoTransaccionLocal', 'idTipoTransNS: ' + JSON.stringify(idTipoTransNS));

                if (!utilities.isEmpty(idTipoTransNS)) {

                    objTipoTransLocal.idTipoTransNS = idTipoTransNS;

                    /*var i=0;
                    var j=0;
                    
                    var filters = new Array();
                    filters[i++] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
                    filters[i++] = new nlobjSearchFilter('custrecord_l598_tipo_trans_loc_tipo_ns', null, 'is', idTipoTransNS);
                    if (!utilities.isEmpty(esND))
                        filters[i++] = new nlobjSearchFilter('custrecord_l598_tipo_trans_loc_es_nd', null, 'is', esND);
                    else
                        filters[i++] = new nlobjSearchFilter('custrecord_l598_tipo_trans_loc_es_nd', null, 'is', 'F');
                    
                    var columns = [new nlobjSearchColumn("internalid")];

                    var results = nlapiSearchRecord('customrecord_l598_tipo_trans_loc', null, filters, columns);*/

                    var esND_aux;

                    if (!utilities.isEmpty(esND) && esND)
                        esND_aux = 'T';
                    else
                        esND_aux = 'F';

                    var mySS = search.create({
                        type: 'customrecord_l598_tipo_trans_loc',
                        columns: [{
                            name: 'internalid'
                        }]
                    });

                    var arraySearchParams = [];

                    var objParam = new Object({});
                    objParam.name = 'isinactive';
                    objParam.operator = search.Operator.IS;
                    objParam.values = ['F'];
                    arraySearchParams.push(objParam);

                    var objParam1 = new Object({});
                    objParam1.name = 'custrecord_l598_tipo_trans_loc_es_nd';
                    objParam1.operator = search.Operator.IS;
                    objParam1.values = [esND_aux];
                    arraySearchParams.push(objParam1);

                    var objParam2 = new Object({});
                    objParam2.name = 'custrecord_l598_tipo_trans_loc_tipo_ns';
                    objParam2.operator = search.Operator.IS;
                    objParam2.values = [idTipoTransNS];
                    arraySearchParams.push(objParam2);

                    var filtro = '';

                    for (var i = 0; i < arraySearchParams.length; i++) {
                        filtro = search.createFilter({
                            name: arraySearchParams[i].name,
                            operator: arraySearchParams[i].operator,
                            values: arraySearchParams[i].values
                        });
                        mySS.filters.push(filtro);
                    }

                    var searchRun = mySS.run();
                    var completeResultSet = [];
                    var resultIndex = 0;
                    var resultStep = 1000;
                    var searchresults;

                    do {
                        searchresults = searchRun.getRange({
                            start: resultIndex,
                            end: resultIndex + resultStep
                        });

                        if (!utilities.isEmpty(searchresults) && searchresults.length > 0) {
                            if (resultIndex == 0) completeResultSet = searchresults;
                            else completeResultSet = completeResultSet.concat(completeResultSet);
                        }
                        resultIndex = resultIndex + resultStep;
                    } while (!utilities.isEmpty(searchresults) && searchresults.length > 0)


                    if (completeResultSet != null && completeResultSet.length > 0) {

                        var idTipoTransLocal = completeResultSet[0].getValue('internalid');
                        if (!utilities.isEmpty(idTipoTransLocal)) {
                            objTipoTransLocal.tipoTransaccionLocal = idTipoTransLocal;
                        } else {
                            objTipoTransLocal.error = true;
                            objTipoTransLocal.mensaje = "No se encontro la configuración del Tipo de Transacción Local para el Tipo de Transacción NetSuite: " + tipoTransNS + " Es Nota de Debito : " + esND;
                        }
                    } else {
                        objTipoTransLocal.error = true;
                        objTipoTransLocal.mensaje = "No se encontro la configuración del Tipo de Transacción Local para el Tipo de Transacción NetSuite: " + tipoTransNS + " Es Nota de Debito : " + esND;
                    }
                } else {
                    objTipoTransLocal.error = true;
                    objTipoTransLocal.mensaje = "No se encontro la configuración del Tipo de Transacción NetSuite para el Tipo de Transacción : " + tipoTransNS;
                }
            } else {
                objTipoTransLocal.error = true;
                objTipoTransLocal.mensaje = "No se recibio el Tipo de Transaccion de NetSuite";
            }

            return objTipoTransLocal;
        }


        function obtenerIDTipoTransNS(tipoTransNS) {
            log.audit('Inicio obtenerIDTipoTransNS', 'Execute');
            var idTipoTransNS = "";
            if (!utilities.isEmpty(tipoTransNS)) {
                var i = 0;
                var j = 0;

                /*var filters = new Array();
                filters[i++] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
                filters[i++] = new nlobjSearchFilter('custrecord_l598_tipo_trans_ns_cod', null, 'is', tipoTransNS);

                var columns = [new nlobjSearchColumn("internalid")];

                var results = nlapiSearchRecord('customrecord_l598_tipo_trans_ns', null, filters, columns);*/

                var mySS = search.create({
                    type: 'customrecord_l598_tipo_trans_ns',
                    columns: [{
                        name: 'internalid'
                    }]
                });

                var arraySearchParams = [];

                var objParam = new Object({});
                objParam.name = 'isinactive';
                objParam.operator = 'is';
                objParam.values = 'F';
                arraySearchParams.push(objParam);

                var objParam1 = new Object({});
                objParam1.name = 'custrecord_l598_tipo_trans_ns_cod';
                objParam1.operator = 'is';
                objParam1.values = tipoTransNS;
                arraySearchParams.push(objParam1);

                var filtro = '';

                for (var i = 0; i < arraySearchParams.length; i++) {
                    filtro = search.createFilter({
                        name: arraySearchParams[i].name,
                        operator: arraySearchParams[i].operator,
                        values: arraySearchParams[i].values
                    });
                    mySS.filters.push(filtro);
                }

                var searchRun = mySS.run();
                var completeResultSet = [];
                var resultIndex = 0;
                var resultStep = 1000;
                var searchresults;

                do {
                    searchresults = searchRun.getRange({
                        start: resultIndex,
                        end: resultIndex + resultStep
                    });
                    if (!utilities.isEmpty(searchresults) && searchresults.length > 0) {
                        if (resultIndex == 0) completeResultSet = searchresults;
                        else completeResultSet = completeResultSet.concat(searchresults);
                    }
                    resultIndex = resultIndex + resultStep;
                } while (!utilities.isEmpty(searchresults) && searchresults.length > 0)

                if (completeResultSet != null && completeResultSet.length > 0) {

                    var idTipoTransaccion = completeResultSet[0].getValue('internalid');
                    if (!utilities.isEmpty(idTipoTransaccion)) {
                        idTipoTransNS = idTipoTransaccion;
                    }
                }
            }
            return idTipoTransNS;
        }


        function obtenerTipoComprobanteFE(tipoTransLocal, esExportacion, compContingencia, compCuentaAjena, esTicket) {
            log.audit('Inicio obtenerTipoComprobanteFE', 'Execute');
            var objTipoComprobanteFE = new Object();
            objTipoComprobanteFE.error = false;
            objTipoComprobanteFE.mensaje = "";
            objTipoComprobanteFE.tipoComprobanteFE = "";

            if (!utilities.isEmpty(tipoTransLocal)) {
                var i = 0;
                var j = 0;

                var comprobanteExoportacion = 'F';
                var comprobanteCuentaAjena = 'F';
                var comprobanteContingencia = 'F';
                var comprobanteTicket = 'F';

                if (!utilities.isEmpty(esExportacion) && esExportacion == true) {
                    comprobanteExoportacion = 'T';
                }

                if (!utilities.isEmpty(compContingencia) && compContingencia == true) {
                    comprobanteContingencia = 'T';
                }

                if (!utilities.isEmpty(compCuentaAjena) && compCuentaAjena == true) {
                    comprobanteCuentaAjena = 'T';
                }

                if (!utilities.isEmpty(esTicket) && esTicket == true) {
                    comprobanteTicket = 'T';
                }

                var mySS = search.create({
                    type: 'customrecord_l598_tipos_comprobantes',
                    columns: [{
                        name: 'internalid'
                    }]
                });

                var arraySearchParams = [];

                var objParam = new Object({});
                objParam.name = 'isinactive';
                objParam.operator = search.Operator.IS;
                objParam.values = ['F'];
                arraySearchParams.push(objParam);

                var objParam1 = new Object({});
                objParam1.name = 'custrecord_l598_tipos_comprobantes_trans';
                objParam1.operator = search.Operator.IS;
                objParam1.values = [tipoTransLocal];
                arraySearchParams.push(objParam1);

                var objParam2 = new Object({});
                objParam2.name = 'custrecord_l598_tipos_comprobantes_exp';
                objParam2.operator = search.Operator.IS;
                objParam2.values = [comprobanteExoportacion];
                arraySearchParams.push(objParam2);

                var objParam3 = new Object({});
                objParam3.name = 'custrecord_l598_tipos_comprobantes_con';
                objParam3.operator = search.Operator.IS;
                objParam3.values = [comprobanteContingencia];
                arraySearchParams.push(objParam3);

                var objParam4 = new Object({});
                objParam4.name = 'custrecord_l598_tipos_comprobantes_aje';
                objParam4.operator = search.Operator.IS;
                objParam4.values = [comprobanteCuentaAjena];
                arraySearchParams.push(objParam4);

                var objParam5 = new Object({});
                objParam5.name = 'custrecord_l598_tipos_comprobantes_tick';
                objParam5.operator = search.Operator.IS;
                objParam5.values = [comprobanteTicket];
                arraySearchParams.push(objParam5);

                var filtro = '';

                for (var i = 0; i < arraySearchParams.length; i++) {
                    filtro = search.createFilter({
                        name: arraySearchParams[i].name,
                        operator: arraySearchParams[i].operator,
                        values: arraySearchParams[i].values
                    });
                    mySS.filters.push(filtro);
                }

                var searchRun = mySS.run();
                var completeResultSet = [];
                var resultIndex = 0;
                var resultStep = 1000;
                var searchresults;

                do {
                    searchresults = searchRun.getRange({
                        start: resultIndex,
                        end: resultIndex + resultStep
                    });
                    if (!utilities.isEmpty(searchresults) && searchresults.length > 0) {
                        if (resultIndex == 0) completeResultSet = searchresults;
                        else completeResultSet = completeResultSet.concat(searchresults);
                    }
                    resultIndex = resultIndex + resultStep;
                } while (!utilities.isEmpty(searchresults) && searchresults.length > 0)


                if (completeResultSet != null && completeResultSet.length > 0) {
                    var tipoCompFE = completeResultSet[0].getValue('internalid');
                    if (!utilities.isEmpty(tipoCompFE)) {
                        objTipoComprobanteFE.tipoComprobanteFE = tipoCompFE;
                    } else {
                        objTipoComprobanteFE.error = true;
                        objTipoComprobanteFE.mensaje = "No se encontro la Configuracion de Tipos de Comprobantes de Factura Electronica para el Tipo de Transaccion Local con ID Interno : " + tipoTransLocal;
                    }
                } else {
                    objTipoComprobanteFE.error = true;
                    objTipoComprobanteFE.mensaje = "No se encontro la Configuracion de Tipos de Comprobantes de Factura Electronica para el Tipo de Transaccion Local con ID Interno : " + tipoTransLocal;
                }
            } else {
                objTipoComprobanteFE.error = true;
                objTipoComprobanteFE.mensaje = "No se Recibio el Tipo de Transaccion Local";
            }

            return objTipoComprobanteFE;
        }

        function obtenerSucursal(objTransaccion) {
            log.audit('Inicio obtenerSucursal', 'Execute');
            if (l598esOneworld()) {

                var subsidiaria = objTransaccion.getValue({
                    fieldId: 'subsidiary'
                });
                log.debug('obtenerSucursal', 'subsidiaria1: ' + subsidiaria)
            } else {
                var subsidiaria = null;
            }

            var categoriaSucursal = null;

            //var locationId = nlapiGetFieldValue('location');
            var locationId = objTransaccion.getValue({
                fieldId: 'location'
            });

            if (!utilities.isEmpty(locationId)) {
                var objFieldLookUpCatSucursal = search.lookupFields({
                    type: 'location',
                    id: locationId,
                    columns: [
                        'custrecord_l598_categoria_sucursal'
                    ]
                });
                //categoriaSucursal = nlapiLookupField('location', locationId, 'custrecord_l598_categoria_sucursal');
                categoriaSucursal = objFieldLookUpCatSucursal.custrecord_l598_categoria_sucursal;
            }

            var informacionSucursal = new Object();
            informacionSucursal.sucursal = 1; // Sucursal default: 1
            informacionSucursal.serie = 1; // Serie default: 1 - A

            log.debug('obtenerSucursal', 'subsidiaria2: ' + subsidiaria)

            var infoSucursal = getSucursal(subsidiaria, categoriaSucursal);
            if (!utilities.isEmpty(infoSucursal)) {
                informacionSucursal.sucursal = infoSucursal.sucursal;
                informacionSucursal.serie = infoSucursal.serie;
            }

            return informacionSucursal;
        }

        function getSucursal(subsidiaria, categoriaSucursal) {
            log.audit('Inicio getSucursal', 'Execute');
            var informacionSucursal = new Object();
            informacionSucursal.sucursal = 1; // Sucursal default: 1
            informacionSucursal.serie = 1; // Serie default: 1 - A

            var i = 0;

            // Obtengo la Sucursal
            /*var filters = new Array();
            filters[i++] = new nlobjSearchFilter('isinactive', null, 'is', 'F');

            if (!utilities.isEmpty(subsidiaria))
                filters[i++] = new nlobjSearchFilter('custrecord_l598_sucursales_subsidiaria', null, 'is', subsidiaria);*/

            //Si la empresa utiliza Sucursal por location, filtro categoria de Sucursal
            var objSucursalxLocation = getSucursalxLocation(subsidiaria);
            if (objSucursalxLocation != null) {
                if (!utilities.isEmpty(objSucursalxLocation.sucursalDefault)) {
                    informacionSucursal.sucursal = objSucursalxLocation.sucursalDefault;
                }
                if (!utilities.isEmpty(objSucursalxLocation.serieDefault)) {
                    informacionSucursal.serie = objSucursalxLocation.serieDefault;
                }
                if (objSucursalxLocation.porLocation == true) {
                    if (!utilities.isEmpty(categoriaSucursal))
                        categoriaSucursal = '@NONE@';
                } else {
                    categoriaSucursal = '@NONE@';
                }
            } else {
                categoriaSucursal = '@NONE@';
            }

            /*filters[i++] = new nlobjSearchFilter('custrecord_l598_sucursales_categoria', null, 'is', categoriaSucursal);

            var columns = [new nlobjSearchColumn("internalid")];

            var results = new nlapiSearchRecord("customrecord_l598_sucursales", null, filters, columns);*/

            var mySS = search.create({
                type: 'customrecord_l598_sucursales',
                columns: [{
                    name: 'internalid'
                }]
            });

            var arraySearchParams = [];

            var objParam = new Object({});
            objParam.name = 'isinactive';
            objParam.operator = search.Operator.IS;
            objParam.values = ['F'];
            arraySearchParams.push(objParam);

            var objParam1 = new Object({});
            objParam1.name = 'custrecord_l598_sucursales_subsidiaria';
            objParam1.operator = search.Operator.IS;
            objParam1.values = [subsidiaria];
            arraySearchParams.push(objParam1);

            var objParam2 = new Object({});
            objParam2.name = 'custrecord_l598_sucursales_categoria';
            objParam2.operator = search.Operator.IS;
            objParam2.values = [categoriaSucursal];
            arraySearchParams.push(objParam2);

            var columns = ['internalid'];
            var filtro = '';

            for (var i = 0; i < arraySearchParams.length; i++) {
                filtro = search.createFilter({
                    name: arraySearchParams[i].name,
                    operator: arraySearchParams[i].operator,
                    values: arraySearchParams[i].values
                });
                mySS.filters.push(filtro);
            }

            var searchRun = mySS.run();
            var completeResultSet = [];
            var resultIndex = 0;
            var resultStep = 1000;
            var searchresults;

            do {
                searchresults = searchRun.getRange({
                    start: resultIndex,
                    end: resultIndex + resultStep
                });
                if (!utilities.isEmpty(searchresults) && searchresults.length > 0) {
                    if (resultIndex == 0) completeResultSet = searchresults;
                    else completeResultSet = completeResultSet.concat(searchresults);
                }
                resultIndex = resultIndex + resultStep;
            } while (!utilities.isEmpty(searchresults) && searchresults.length > 0)


            if (completeResultSet != null && completeResultSet.length > 0) {
                idSucursal = completeResultSet[0].getValue('internalid');
                if (!utilities.isEmpty(idSucursal)) {
                    informacionSucursal.sucursal = idSucursal;
                }

            }
            return informacionSucursal;
        }


        function getSucursalxLocation(subsidiaria) {
            log.audit('Inicio getSucursalxLocation', 'Execute');
            var sucursarxLocation = new Object();

            sucursarxLocation.porLocation = false;
            sucursarxLocation.sucursalDefault = 1;
            sucursarxLocation.serieDefault = 1;

            var i = 0;
            var j = 0;
            /*var filters = new Array();
            filters[i++] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
            
            if(!utilities.isEmpty(subsidiaria)){
                filters[i++] = new nlobjSearchFilter('custrecord_l598_dat_imp_subsidiaria', null, 'is', subsidiaria);
            }*/

            /*var columns = new Array();
            columns[j++] = new nlobjSearchColumn("custrecord_l598_dat_imp_num_location");
            columns[j++] = new nlobjSearchColumn("custrecord_l598_dat_imp_suc_default");
            columns[j++] = new nlobjSearchColumn("custrecord_l598_dat_imp_serie_default");*/

            var mySS = search.create({
                type: 'customrecord_l598_datos_impositivos_emp',
                columns: [{
                    name: 'custrecord_l598_dat_imp_num_location'
                }, {
                    name: 'custrecord_l598_dat_imp_suc_default'
                }, {
                    name: 'custrecord_l598_dat_imp_serie_default'
                }]
            });

            var arraySearchParams = [];

            var objParam = new Object({});
            objParam.name = 'isinactive';
            objParam.operator = search.Operator.IS;
            objParam.values = ['F'];
            arraySearchParams.push(objParam);

            log.debug('beforeSubmit', 'subsidiaria: ' + subsidiaria);

            var objParam2 = new Object({});
            objParam2.name = 'custrecord_l598_dat_imp_subsidiaria';
            objParam2.operator = search.Operator.IS;
            objParam2.values = [subsidiaria];
            arraySearchParams.push(objParam2);

            var filtro = '';

            for (var i = 0; i < arraySearchParams.length; i++) {
                filtro = search.createFilter({
                    name: arraySearchParams[i].name,
                    operator: arraySearchParams[i].operator,
                    values: arraySearchParams[i].values
                });
                mySS.filters.push(filtro);
            }

            var searchRun = mySS.run();
            var completeResultSet = [];
            var resultIndex = 0;
            var resultStep = 1000;
            var searchresults;

            do {
                searchresults = searchRun.getRange({
                    start: resultIndex,
                    end: resultIndex + resultStep
                });
                if (!utilities.isEmpty(searchresults) && searchresults.length > 0) {
                    if (resultIndex == 0) completeResultSet = searchresults;
                    else completeResultSet = completeResultSet.concat(searchresults);
                }
                resultIndex = resultIndex + resultStep;
            } while (!utilities.isEmpty(searchresults) && searchresults.length > 0)

            //var searchresults = new nlapiSearchRecord("customrecord_l598_datos_impositivos_emp", null, filters, columns);

            log.debug('sucursarxLocation', 'LINEA 1022');

            if (completeResultSet != null && completeResultSet.length > 0) {
                var sucPorLocation = completeResultSet[0].getValue('custrecord_l598_dat_imp_num_location');
                var sucDefault = completeResultSet[0].getValue('custrecord_l598_dat_imp_suc_default');
                var serieDefault = completeResultSet[0].getValue('custrecord_l598_dat_imp_serie_default');

                if (!utilities.isEmpty(sucPorLocation) && sucPorLocation == 'T') {
                    sucursarxLocation.porLocation = true;
                }
                // Asignar Sucursal Por Defecto
                if (!utilities.isEmpty(sucDefault)) {
                    sucursarxLocation.sucursalDefault = sucDefault;
                }
                // Asignar Serie Por Defecto
                if (!utilities.isEmpty(serieDefault)) {
                    sucursarxLocation.serieDefault = serieDefault;
                }
            }

            return sucursarxLocation;
        }

        function l598beforeSubmitTransaction(type, objTransaccion) {
            try {
                /*var objTransaccion = new Object({});
                objTransaccion = registro;*/

                var objRespuesta = new Object({});
                objRespuesta.error = false;
                objRespuesta.detalle = new Array();

                var idTransaccion = objTransaccion.id;
                // INICIO - Consultar Sucursal por Defecto
                log.audit('Inicio l598beforeSubmitTransaction', 'ID Transaccion: ' + idTransaccion);
                var serie = objTransaccion.getValue({
                    fieldId: 'custbody_l598_serie_comprobante'
                });
                var sucursal = objTransaccion.getValue({
                    fieldId: 'custbody_l598_sucursal'
                });
                var caja = objTransaccion.getValue({
                    fieldId: 'custbody_l598_caja'
                });

                if (utilities.isEmpty(sucursal) || utilities.isEmpty(serie)) {
                    var infoSucursal = obtenerSucursal(objTransaccion);
                    log.debug('beforeSubmit', 'infoSucursal: ' + JSON.stringify(infoSucursal));
                    if (!utilities.isEmpty(infoSucursal)) {
                        if (!utilities.isEmpty(infoSucursal.sucursal) && utilities.isEmpty(sucursal)) {
                            objTransaccion.setValue({
                                fieldId: 'custbody_l598_sucursal',
                                value: infoSucursal.sucursal
                            });
                        }
                        if (!utilities.isEmpty(infoSucursal.serie) && utilities.isEmpty(serie)) {
                            objTransaccion.setValue({
                                fieldId: 'custbody_l598_serie_comprobante',
                                value: infoSucursal.serie
                            });
                        }
                    } else {
                        objRespuesta.error = true;
                        objRespuestaParcial = new Object({});
                        objRespuestaParcial.codigo = 'SURU001';
                        objRespuestaParcial.mensaje = 'URU-Asignacion Indicador Facturacion - Error Obteniendo la Serie y Sucursal por Defecto';
                        objRespuesta.detalle.push(objRespuestaParcial);
                        log.error('SURU001', objRespuestaParcial.mensaje);
                    }
                }

                if (utilities.isEmpty(caja)) {
                    // Obtener Caja Preferida de la Sucursal
                    var idSucursal = '';
                    if (!utilities.isEmpty(sucursal)) {
                        idSucursal = sucursal;
                    } else {
                        if (!utilities.isEmpty(infoSucursal)) {
                            if (!utilities.isEmpty(infoSucursal.sucursal)) {
                                idSucursal = infoSucursal.sucursal;
                            }
                        }
                    }
                    if (!utilities.isEmpty(idSucursal)) {
                        var objFieldLookUpSucursal = search.lookupFields({
                            type: 'customrecord_l598_sucursales',
                            id: idSucursal,
                            columns: [
                                'custrecord_l598_sucursales_caja_pref'
                            ]
                        });

                        log.debug('beforeSubmit', 'objFieldLookUpSucursal: ' + JSON.stringify(objFieldLookUpSucursal));

                        //var cajaPreferida = nlapiLookupField('customrecord_l598_sucursales', idSucursal, 'custrecord_l598_sucursales_caja_pref');
                        //var cajaPreferida = objFieldLookUpSucursal.custrecord_l598_sucursales_caja_pref;
                        var cajaPreferida = objFieldLookUpSucursal.custrecord_l598_sucursales_caja_pref[0].value;

                        if (!utilities.isEmpty(cajaPreferida)) {
                            //nlapiSetFieldValue('custbody_l598_caja', cajaPreferida);
                            objTransaccion.setValue({
                                fieldId: 'custbody_l598_caja',
                                value: cajaPreferida
                            });
                        }
                    }
                }

                // FIN - consultar Sucursal por Defecto
                // INICIO - Asignar indicador de Facturacion por lineas

                var comprobanteExportacion = objTransaccion.getValue({
                    fieldId: 'custbody_l598_trans_exportacion'
                });

                var camposImpuestos = ['custrecordcustitem_l598_ind_facturacion', 'custrecord_l598_codigo_percepcion'];
                //cantidadItems = nlapiGetLineItemCount('item');
                cantidadItems = objTransaccion.getLineCount({
                    sublistId: 'item'
                });

                for (var i = 0; i < cantidadItems; i++) {
                    var resultadosImpuestos = null;
                    //var transCodImpuesto = nlapiGetLineItemValue('item', 'taxcode',i);
                    var transCodImpuesto = objTransaccion.getSublistValue({ sublistId: 'item', fieldId: 'taxcode', line: i });
                    log.debug('beforeSubmit', 'transCodImpuesto: ' + transCodImpuesto);
                    //var transCodImpuestoStr = nlapiGetLineItemText('item', 'taxcode',i);
                    var transCodImpuestoStr = objTransaccion.getSublistText({ sublistId: 'item', fieldId: 'taxcode', line: i });

                    if (!utilities.isEmpty(transCodImpuesto)) {

                        var objFieldLookUpResulImpuestos = search.lookupFields({
                            type: 'salestaxitem',
                            id: transCodImpuesto,
                            columns: camposImpuestos

                        });
                        //resultadosImpuestos = nlapiLookupField('salestaxitem', transCodImpuesto, camposImpuestos);
                        var resultadosImpuestos = objFieldLookUpResulImpuestos;
                        log.debug('beforeSubmit', 'resultadosImpuestos: ' + JSON.stringify(resultadosImpuestos));
                        if (!utilities.isEmpty(resultadosImpuestos)) {
                            var esPercepcionRetencion = false;
                            var indicadorFacturacion = resultadosImpuestos.custrecordcustitem_l598_ind_facturacion[0].value;
                            log.debug('beforeSubmit', 'indicadorFacturacion: ' + JSON.stringify(indicadorFacturacion));
                            var codigoPercRetCred = resultadosImpuestos.custrecord_l598_codigo_percepcion;
                            var esIndicadorExportacion = false;
                            if (!utilities.isEmpty(indicadorFacturacion)) {

                                var objFieldLookUpIndFact = search.lookupFields({
                                    type: 'customrecord_l598_ind_fact_det',
                                    id: indicadorFacturacion,
                                    columns: [
                                        'custrecord_l598_ind_fact_det_exp_asim',
                                        'custrecord_l598_ind_fact_det_perc_ret'
                                    ]
                                });
                                //infoIndFact=nlapiLookupField('customrecord_l598_ind_fact_det', indicadorFacturacion, ['custrecord_l598_ind_fact_det_exp_asim','custrecord_l598_ind_fact_det_perc_ret']);
                                infoIndFact = objFieldLookUpIndFact;
                                log.debug('beforeSubmit', 'infoIndFact: ' + JSON.stringify(infoIndFact));
                                esIndExp = "";
                                esPercRet = "";
                                if (!utilities.isEmpty(infoIndFact)) {
                                    esIndExp = infoIndFact.custrecord_l598_ind_fact_det_exp_asim;
                                    esPercRet = infoIndFact.custrecord_l598_ind_fact_det_perc_ret;
                                    if (!utilities.isEmpty(esIndExp) && esIndExp == true) {
                                        esIndicadorExportacion = true;
                                    }
                                    if (!utilities.isEmpty(esPercRet) && esPercRet == true) {
                                        esPercepcionRetencion = true;
                                    }
                                    if (comprobanteExportacion == true && esIndicadorExportacion == false) {
                                        objRespuesta.error = true;
                                        objRespuestaParcial = new Object();
                                        objRespuestaParcial.codigo = 'SURU002';
                                        objRespuestaParcial.mensaje = 'URU-Asignacion Indicador Facturacion - El Indicador de Facturacion no se corresponde con un indicador de Facturacion de Exportacion y Asimiladas';
                                        objRespuesta.detalle.push(objRespuestaParcial);
                                        log.error('SURU002', objRespuestaParcial.mensaje);
                                    }
                                    //nlapiSetLineItemValue('item', 'custcol_l598_ind_facturacion' , i , indicadorFacturacion , true , true);
                                    objTransaccion.selectLine({
                                        sublistId: 'item',
                                        line: i
                                    });
                                    objTransaccion.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_l598_ind_facturacion',
                                        value: indicadorFacturacion,
                                        ignoreFieldChange: false
                                    });

                                    objTransaccion.commitLine({
                                        sublistId: 'item'
                                    });
                                } else {
                                    objRespuesta.error = true;
                                    objRespuestaParcial = new Object();
                                    objRespuestaParcial.codigo = 'SURU003';
                                    objRespuestaParcial.mensaje = 'URU-Asignacion Indicador Facturacion - No se pudo Obtener la Informacion Adicional del Indicador de Facturacion';
                                    objRespuesta.detalle.push(objRespuestaParcial);
                                    log.error('SURU003', objRespuestaParcial.mensaje);
                                }
                            } else {
                                objRespuesta.error = true;
                                objRespuestaParcial = new Object();
                                objRespuestaParcial.codigo = 'SURU004';
                                objRespuestaParcial.mensaje = 'URU-Asignacion Indicador Facturacion - No se pudo Obtener la Informacion Adicional del Indicador de Facturacion ';
                                objRespuesta.detalle.push(objRespuestaParcial);
                                log.error('SURU004', objRespuestaParcial.mensaje);
                            }
                            if (!utilities.isEmpty(codigoPercRetCred)) {
                                //nlapiSetLineItemValue('item', 'custcol_l598_cod_perc_ret_cred' , i , codigoPercRetCred , false , false);
                                objTransaccion.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_l598_cod_perc_ret_cred',
                                    line: i,
                                    value: codigoPercRetCred
                                });
                            } else {
                                if (esPercepcionRetencion == true) {
                                    objRespuesta.error = true;
                                    objRespuestaParcial = new Object();
                                    objRespuestaParcial.codigo = 'SURU005';
                                    objRespuestaParcial.mensaje = 'URU-Asignacion Indicador Facturacion - No se Encuentra Configurado el Codigo de Percepcion/Retencion - ID Interno Transaccion : ' + idTransaccion;
                                    objRespuesta.detalle.push(objRespuestaParcial);
                                    log.error('SURU005', objRespuestaParcial.mensaje);
                                }
                            }
                        }
                    }
                }
                // FIN - Asignar indicador de Facturacion por lineas

                //var esND = nlapiGetFieldValue('custbody_l598_nd');
                var esND = objTransaccion.getValue({
                    fieldId: 'custbody_l598_nd'
                });

                //var tipoTransStr = nlapiGetRecordType();
                var tipoTransStr = objTransaccion.type;
                //var recId = nlapiGetRecordId();
                var recId = objTransaccion.id;

                var comprobanteContingencia = 'F';
                var comprobanteCuentaAjena = 'F';

                //var esExportacion = nlapiGetFieldValue('custbody_l598_trans_exportacion');
                var esExportacion = objTransaccion.getValue({
                    fieldId: 'custbody_l598_trans_exportacion'
                });
                //var esETicket = nlapiGetFieldValue('custbody_l598_trans_eticket');
                var esETicket = objTransaccion.getValue({
                    fieldId: 'custbody_l598_trans_eticket'
                });

                if (l598esOneworld()) {
                    //var subsidiaria = nlapiGetFieldValue('subsidiary');
                    var subsidiaria = objTransaccion.getValue({
                        fieldId: 'subsidiary'
                    });
                } else {
                    var subsidiaria = null;
                }

                // Generar MontoEscrito
                //var total = nlapiGetFieldValue('total');
                var total = objTransaccion.getValue({
                    fieldId: 'total'
                });
                var numeroEnLetras = getNumeroEnLetras(total.toString(), subsidiaria);

                if (!utilities.isEmpty(numeroEnLetras)) {
                    objTransaccion.setValue({
                        fieldId: 'custbody_l598_monto_escrito',
                        value: numeroEnLetras
                    });
                    //nlapiSetFieldValue("custbody_l598_monto_escrito", numeroEnLetras);
                } else {
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'SURU006';
                    objRespuestaParcial.mensaje = 'Error grabando Transaccion (' + type + ') - Error Generando MontoEscrito';
                    objRespuesta.detalle.push(objRespuestaParcial);
                    log.error('SURU006', objRespuestaParcial.mensaje);
                }

                log.debug('beforeSubmit', 'tipoTransStr: ' + tipoTransStr + ' esND: ' + esND + ' subsidiaria: ' + subsidiaria);

                var tipoTransLocal = obtenerTipoTransaccionLocal(tipoTransStr, esND, subsidiaria);

                log.debug('beforeSubmit', 'tipoTransLocal: ' + JSON.stringify(tipoTransLocal));

                if (tipoTransLocal != null && tipoTransLocal.error != true) {
                    log.debug('beforeSubmit', 'tipoTransStr: ' + tipoTransStr + ' esExportacion: ' + esExportacion + ' comprobanteContingencia: ' + comprobanteContingencia + ' esETicket: ' + esETicket);
                    var tipoComprobanteFE = obtenerTipoComprobanteFE(tipoTransLocal.tipoTransaccionLocal, esExportacion, comprobanteContingencia, comprobanteCuentaAjena, esETicket);
                    log.debug('beforeSubmit', 'tipoComprobanteFE: ' + JSON.stringify(tipoComprobanteFE));
                    if (tipoComprobanteFE != null && tipoComprobanteFE.error != true) {
                        // Configurar el Tipo de Comprobante de Factura Electronica
                        //nlapiSetFieldValue('custbody_l598_tipo_comprobante',tipoComprobanteFE.tipoComprobanteFE);
                        objTransaccion.setValue({
                            fieldId: 'custbody_l598_tipo_comprobante',
                            value: tipoComprobanteFE.tipoComprobanteFE
                        })
                    } else {
                        objRespuesta.error = true;
                        objRespuestaParcial = new Object();
                        objRespuestaParcial.codigo = 'SURU007';
                        objRespuestaParcial.mensaje = 'Error grabando Transaccion (' + type + ')  Error Obteniendo el Tipo de Comprobante de Factura Electronica - Error : ' + tipoComprobanteFE.mensaje;
                        objRespuesta.detalle.push(objRespuestaParcial);
                        log.error('SURU007', objRespuestaParcial.mensaje);
                    }
                } else {
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'SURU008';
                    objRespuestaParcial.mensaje = 'Error grabando Transaccion (' + type + ')  Error : ' + tipoTransLocal.mensaje;
                    objRespuesta.detalle.push(objRespuestaParcial);
                    log.error('SURU008', objRespuestaParcial.mensaje);
                }

            } catch (e) {
                objRespuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'SURU008';
                objRespuestaParcial.mensaje = 'Excepcion NS beforeSubmit funcionalidades URU: ' + e.message;
                objRespuesta.detalle.push(objRespuestaParcial);
                log.error('ERROR', 'Excepcion NS beforeSubmit funcionalidades URU: ' + e.message);
            }

            return objRespuesta;
        }


        function l598afterSubmitTransaction(tipoTransaccion, idTransaccion) {
            try {
                var objRespuesta = new Object();
                objRespuesta.error = false;
                objRespuesta.detalle = new Array();

                if (!utilities.isEmpty(idTransaccion) && !utilities.isEmpty(tipoTransaccion)) {
                    /*nlapiSubmitField(tipoTransStr, recId, 'custbody_l598_nro_comprobante', recId, {
                                                    disabletriggers : true,
                                                    enablesourcing : false
                                                });*/
                    record.submitFields({
                        type: tipoTransaccion,
                        id: idTransaccion,
                        values: {
                            custbody_l598_nro_comprobante: idTransaccion
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true //Revisar: Ignora los campos obligatorios
                        }
                    });
                }

            } catch (e) {
                objRespuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'SURU008';
                objRespuestaParcial.mensaje = 'Excepcion NS afterSubmit funcionalidades URU: ' + e.message;
                objRespuesta.detalle.push(objRespuestaParcial);
                log.error('ERROR', 'Excepcion NS afterSubmit funcionalidades URU: ' + e.message);
            }

            return objRespuesta;
        }

        function afterSubmitWithMonto(tipoTransaccion, idTransaccion, subsidiaria, total) {

            var objRespuesta = new Object();
            objRespuesta.error = false;
            objRespuesta.detalle = new Array();

            try {

                log.audit('afterSubmitWithMonto', 'INICIO');

                var numeroEnLetras = getNumeroEnLetras(total.toString(), subsidiaria);

                if (!utilities.isEmpty(numeroEnLetras)) {
                    numeroEnLetras = numeroEnLetras;
                } else {
                    numeroEnLetras = '';
                    objRespuesta.error = true;
                    objRespuestaParcial = new Object();
                    objRespuestaParcial.codigo = 'SURU009';
                    objRespuestaParcial.mensaje = 'Error grabando Transaccion (' + idTransaccion + ') - Error Generando MontoEscrito';
                    objRespuesta.detalle.push(objRespuestaParcial);
                    log.error('SURU009', objRespuestaParcial);
                }

                if (!utilities.isEmpty(idTransaccion) && !utilities.isEmpty(tipoTransaccion)) {

                    record.submitFields({
                        type: tipoTransaccion,
                        id: idTransaccion,
                        values: {
                            custbody_l598_nro_comprobante: idTransaccion,
                            custbody_l598_monto_escrito: numeroEnLetras
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                }


                log.audit('afterSubmitWithMonto', 'FIN');

            } catch (excepcion) {
                objRespuesta.error = true;
                objRespuestaParcial = new Object();
                objRespuestaParcial.codigo = 'SURU010';
                objRespuestaParcial.mensaje += excepcion;
                objRespuesta.detalle.push(objRespuestaParcial);
                log.error('afterSubmitWithMonto', 'SURU010 - Excepcion : ' + excepcion);
            }

            return objRespuesta;

        }

        return {
            beforeSubmit: l598beforeSubmitTransaction,
            afterSubmit: l598afterSubmitTransaction,
            afterSubmitWithMonto: afterSubmitWithMonto,
            l598esOneworld: l598esOneworld
        };

    });

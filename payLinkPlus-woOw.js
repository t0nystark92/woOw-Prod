String.prototype.rpad = function(padString, length) {
    var str = this;
    while (str.length < length)
		str = str + padString;
    return str;
}


String.prototype.lpad = function(padString, length) {
    var str = this;
    while (str.length < length)
		str = padString + str;
    return str;
}


function isEmpty(value){
	return (typeof value == 'undefined' || value == null || value == '');	
}


function paylinkPlus_santander(request,response) {
	nlapiLogExecution('DEBUG', 'paylinkPlus_santander', 'Inicio');
	var user        = nlapiGetUser();
	var form        = nlapiCreateForm('Generacion de Archivo Para Pago de Proveedores - Banco Santander', false);	
	var grupoFiltro = form.addFieldGroup('filtros','Criterios');
	var tabDetalle  = form.addTab('tabdetalle','Detalle');
	var subTab      = form.addSubTab('custpage_tabbusqueda','Busqueda','tabdetalle');
	
	form.setScript('customscript_3k_paylinkplus_cliente');
	
	var sublist = form.addSubList('custpage_pagos', 'list', 'Pagos','custpage_tabbusqueda'); //list
	
	sublist.addField('custpage_procesar', 'checkbox', 'Exportar');
	sublist.addField('custpage_internalid', 'text', 'internalid', 'InternalID').setDisplayType('hidden');
	sublist.addField('custpage_recordtype', 'text', 'recordtype', 'RecordType').setDisplayType('hidden');
	sublist.addField('custpage_ruc_proveedor', 'text', 'RUC Proveedor', 'RUC Proveedor');
	sublist.addField('custpage_proveedor', 'text', 'Proveedor', 'Proveedor');
	sublist.addField('custpage_pago_tranid', 'text', 'ID Transacción', 'ID Transacción');
	sublist.addField('custpage_fecha_emision', 'text', 'Fecha de Emisión', 'Fecha de Emisión');
	sublist.addField('custpage_nro_dcto', 'text', 'Número de Documento', 'Número de Documento');
	sublist.addField('custpage_importe', 'text', 'Importe', 'Importe');
	
	sublist.addMarkAllButtons();

	var fechaDesde  = form.addField('custpage_filtro_fdesde','date', 'Fecha Desde:',null, 'filtros');
	var fechaHasta  = form.addField('custpage_filtro_fhasta','date', 'Fecha Hasta:',null, 'filtros');
	var tipoPago    = form.addField('custpage_filtro_tipo_pago','select','Tipo de Pago:',null,'filtros');
	var sinExportar = form.addField('custpage_filtro_solopendientes','checkbox','Pendientes de Exportación',null,'filtros');
	var banco       = form.addField('custpage_filtro_banco','text', 'Banco:',null, 'filtros').setDisplayType('hidden');
	var btnAccion   = form.addField('custpage_accion','text','Accion:',null,'filtros').setDisplayType('hidden');
	var nroCuenta   = form.addField('custpage_filtro_nrocuenta','text', 'Número de Cuenta:',null, 'filtros');	
	var monedaCC    = form.addField('custpage_filtro_monedacc','select','Moneda Cuenta Contable:','currency','filtros');	
	var cuentaCont  = form.addField('custpage_filtro_ctacontable','select','Cuenta Contable:',null,'filtros');

	banco.setDefaultValue('SANTANDER');
	sinExportar.setDefaultValue('T');
	nroCuenta.setMandatory(true);
	monedaCC.setMandatory(true);
	cuentaCont.setMandatory(true);
	
	cargarCombo(tipoPago,'customsearch_3k_forma_pago_plp_santander',true);
	//cargarCombo(monedaCC,'currencylist',true);
	cargarCombo(cuentaCont,'customsearch_3k_cuenta_contable_plp_std',true);
		
	var infoResultado = form.addField('custpage_resultado','inlinehtml', 'Resultados', null, null);		
	
	if(!isEmpty(request.getParameter('custpage_filtro_tipo_pago')))
		tipoPago.setDefaultValue(request.getParameter('custpage_filtro_tipo_pago'));
		
	if(!isEmpty(request.getParameter('custpage_filtro_fdesde')))
		fechaDesde.setDefaultValue(request.getParameter('custpage_filtro_fdesde'));
	
	if(!isEmpty(request.getParameter('custpage_filtro_fhasta')))
		fechaHasta.setDefaultValue(request.getParameter('custpage_filtro_fhasta'));
	
	if(!isEmpty(request.getParameter('custpage_filtro_solopendientes')))
		sinExportar.setDefaultValue(request.getParameter('custpage_filtro_solopendientes'));

	if(!isEmpty(request.getParameter('custpage_filtro_nrocuenta')))
		nroCuenta.setDefaultValue(request.getParameter('custpage_filtro_nrocuenta'));	

	if(!isEmpty(request.getParameter('custpage_filtro_monedacc')))
		monedaCC.setDefaultValue(request.getParameter('custpage_filtro_monedacc'));	

	if(!isEmpty(request.getParameter('custpage_filtro_ctacontable')))
		cuentaCont.setDefaultValue(request.getParameter('custpage_filtro_ctacontable'));	
			
	form.addSubmitButton('Buscar');

	form.addButton('custpage_btngenerartxt','Generar archivo TXT','exportar_txt();');

	if (request.getMethod() == 'POST') {
		//Por la limitacion que no se pueden mostrar 2 botones submit, si es el BUSCAR viene el valor en submitter, sino viene en la accion
		var sAccion=isEmpty(request.getParameter('custpage_accion'))?request.getParameter('submitter'):request.getParameter('custpage_accion');

		switch(sAccion) {
			case 'GENERAR_TXT':
				//ENCOLAR
				generarTXT(request);
				infoResultado.setDefaultValue('<font color="red">Se procesó su pedido. Recibirá una notificación al finalizar por email</font>');
				
				response.writePage(form);
				break;
			case 'Buscar':
				cargarPagos(sublist,request);
				response.writePage(form);
				break;
		}
				
	}//POST
	else {
		//Primera carga
		sinExportar.setDefaultValue('T');
		response.writePage(form);
	}
	nlapiLogExecution('DEBUG', 'paylinkPlus_santander', 'Fin');
}


function cargarPagos(sublist,request) {

	var filtro = new Array();
	var i      = 0;

	if(!isEmpty(request.getParameter('custpage_filtro_fdesde')))
		filtro[i++] = new nlobjSearchFilter('trandate', null, 'onorafter', nlapiStringToDate(request.getParameter('custpage_filtro_fdesde')));
		
	if(!isEmpty(request.getParameter('custpage_filtro_fhasta')))
		filtro[i++] = new nlobjSearchFilter('trandate', null, 'onorbefore', nlapiStringToDate(request.getParameter('custpage_filtro_fhasta')));

	if(!isEmpty(request.getParameter('custpage_filtro_solopendientes'))) {
		if(request.getParameter('custpage_filtro_solopendientes')=='T')
			filtro[i++] = new nlobjSearchFilter('custbody_3k_fecha_exportacion_banco', null, 'isempty', null);
	}	
	
	if(!isEmpty(request.getParameter('custpage_filtro_tipo_pago')))
		filtro[i++] = new nlobjSearchFilter('custbody_3k_forma_de_pago_prov', null, 'anyof', request.getParameter('custpage_filtro_tipo_pago'));

	if(!isEmpty(request.getParameter('custpage_filtro_monedacc')))
		filtro[i++] = new nlobjSearchFilter('currency', null, 'anyof', request.getParameter('custpage_filtro_monedacc'));

	if(!isEmpty(request.getParameter('custpage_filtro_ctacontable')))
		filtro[i++] = new nlobjSearchFilter('account', null, 'anyof', request.getParameter('custpage_filtro_ctacontable'));	

	nlapiLogExecution('DEBUG', 'cargarPagos', 'line 145. cargarPagos - request.getParameter(custpage_filtro_monedacc): '+request.getParameter('custpage_filtro_monedacc'));
	nlapiLogExecution('DEBUG', 'cargarPagos', 'line 146. cargarPagos - request.getParameter(custpage_filtro_ctacontable): '+request.getParameter('custpage_filtro_ctacontable'));
	/*if(!isEmpty(request.getParameter('custpage_filtro_ctacontable')))
		filtro[i++] = new nlobjSearchFilter('currency', null, 'anyof', request.getParameter('custpage_filtro_ctacontable'));*/

	/*if(!isEmpty(request.getParameter('custpage_filtro_nrocuenta')))
		nroCuenta.setDefaultValue(request.getParameter('custpage_filtro_nrocuenta'));	

	if(!isEmpty(request.getParameter('custpage_filtro_monedacc')))
		monedaCC.setDefaultValue(request.getParameter('custpage_filtro_monedacc'));	

	if(!isEmpty(request.getParameter('custpage_filtro_ctacontable')))
		cuentaCont.setDefaultValue(request.getParameter('custpage_filtro_ctacontable'));*/
		
	var search = new nlapiLoadSearch('transaction', 'customsearch_3k_santander_plp_2');
	search.addFilters(filtro);
	
	var searchResults = search.runSearch();
	
	var completeResultSet;
		
	// resultIndex points to record starting current "resultado" in the entire results array 
	var resultIndex = 0; 
	var resultStep  = 1000; // Number of records returned in one step (maximum is 1000)
	var resultado; // temporary variable used to store the result set
	do 
	{
		// fetch one result set
		resultado = searchResults.getResults(resultIndex, resultIndex + resultStep);
		
		if(resultado.length > 0) {
			if(resultIndex == 0) 
				completeResultSet=resultado; //Primera ve inicializa
			else
				completeResultSet = completeResultSet.concat(resultado);
		}
		
		// increase pointer
		resultIndex = resultIndex + resultStep;

		// once no records are returned we already got all of them
	} while (resultado.length > 0) 
	
			
	j=1;
	
	if(!isEmpty(completeResultSet)) {

		for(i=0; i<completeResultSet.length; i++) {
			var result  = completeResultSet[i];
			var columns = result.getAllColumns();
			sublist.setLineItemValue('custpage_pr_type', j,'SKU');
			sublist.setLineItemValue('custpage_internalid', j, result.getValue(columns[0]));
			sublist.setLineItemValue('custpage_ruc_proveedor', j, result.getValue(columns[1]));
			sublist.setLineItemValue('custpage_proveedor', j, result.getValue(columns[2]));
			sublist.setLineItemValue('custpage_pago_tranid', j, result.getValue(columns[3]));
			sublist.setLineItemValue('custpage_fecha_emision', j, result.getValue(columns[4]));
			sublist.setLineItemValue('custpage_nro_dcto', j, result.getValue(columns[5]));
			sublist.setLineItemValue('custpage_importe', j, result.getValue(columns[6]));
			sublist.setLineItemValue('custpage_recordtype', j, result.getValue(columns[7]));		
			j++;
		} //for
	} //if
}


function checkGovernance() {
 	var context   = nlapiGetContext();
	var remaining = context.getRemainingUsage();

 	if ( remaining < 100) {
 		var state = nlapiYieldScript();
 		if (state.status == 'FAILURE') {
 			nlapiLogExecution("ERROR", "Failed to yield script, exiting: Reason = " + state.reason + " / Size = " + state.size);
 			throw "Failed to yield script";
 		}
		else if (state.status == 'RESUME') {
 				nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason + ".  Size = " + state.size); 				// state.status will never be SUCCESS because a success would imply a yield has occurred.  The equivalent response would be yield
 		}
 	}
}

function cargarCombo(campo,busqueda,agregaOpcionVacia) {	
	var filtro = new Array();
	var i      = 0;
		
	var search = new nlapiLoadSearch(null, busqueda);
	
	var searchResults = search.runSearch();
	
	var completeResultSet;
		
	// resultIndex points to record starting current "resultado" in the entire results array 
	var resultIndex = 0; 
	var resultStep  = 1000; // Number of records returned in one step (maximum is 1000)
	var resultado; // temporary variable used to store the result set
	do 
	{
		// fetch one result set
		resultado = searchResults.getResults(resultIndex, resultIndex + resultStep);
		
		if(resultado.length > 0) {
			if(resultIndex == 0) 
				completeResultSet = resultado; //Primera ve inicializa
			else
				completeResultSet = completeResultSet.concat(resultado);
		}
		
		// increase pointer
		resultIndex = resultIndex + resultStep;

		// once no records are returned we already got all of them
	} while (resultado.length > 0) 
	
			
	j=1;
	
	if(agregaOpcionVacia)
		campo.addSelectOption('', '');
	
	if(!isEmpty(completeResultSet)) {
		for (var i = 0; i<completeResultSet.length; i++) {
			var result  = completeResultSet[i];
			var columns = result.getAllColumns();
			campo.addSelectOption(result.getValue(columns[0]), result.getValue(columns[1]));
		}
	}
}


function cargarComboMoneda(campo) {	
	campo.addSelectOption('', '');
	campo.addSelectOption('1', 'US.D');//Dolar Americano
	campo.addSelectOption('5', 'URGP');//Peso Uruguayo
}


function exportar_txt() {
	var objPagos=new Object();
	nlapiSetFieldValue('custpage_accion','GENERAR_TXT');
	document.forms['main_form'].submitter.click()
}


function generarTXT(request) {

	nlapiLogExecution('DEBUG', 'generarTXT', 'Inicio');

	//Armo array con los marcados
	var objParams          = new Object();
	objParams.listadoPagos = new Array();

	//Marco como Enviado
	var j=0;
	for (var i=0; i<request.getLineItemCount('custpage_pagos'); i++) {
		if(request.getLineItemValue('custpage_pagos', 'custpage_procesar', i+1) =='T'){ //solo si está marcado para enviar
			var informacionObj = new Object();
			informacionObj.id = request.getLineItemValue('custpage_pagos','custpage_internalid',i+1);
			informacionObj.tipo = request.getLineItemValue('custpage_pagos','custpage_recordtype',i+1);
			objParams.listadoPagos[j++] = informacionObj;
		}
	}

	objParams.custpage_filtro_fdesde    = request.getParameter('custpage_filtro_fdesde');
	objParams.custpage_filtro_fhasta    = request.getParameter('custpage_filtro_fhasta');
	objParams.custpage_filtro_tipo_pago = request.getParameter('custpage_filtro_tipo_pago');
	objParams.custpage_filtro_monedacc  = request.getParameter('custpage_filtro_monedacc');
	objParams.custpage_filtro_ctacontable  = request.getParameter('custpage_filtro_ctacontable');
	objParams.custpage_filtro_nrocuenta  = request.getParameter('custpage_filtro_nrocuenta');


	nlapiLogExecution('DEBUG', 'generarTXT', 'generarTXT - line 311. request.getParameter(custpage_filtro_monedacc): '+request.getParameter('custpage_filtro_monedacc'));
	nlapiLogExecution('DEBUG', 'generarTXT', 'generarTXT - line 312. request.getParameter(custpage_filtro_ctacontable): '+request.getParameter('custpage_filtro_ctacontable'));
	nlapiLogExecution('DEBUG', 'generarTXT', 'generarTXT - line 313. request.getParameter(custpage_filtro_nrocuenta): '+request.getParameter('custpage_filtro_nrocuenta'));	
	/*nlapiLogExecution('DEBUG', 'generarTXT', 'request.getParameter(custpage_filtro_tipo_pago): '+request.getParameter('custpage_filtro_tipo_pago'));
	nlapiLogExecution('DEBUG', 'generarTXT', 'objParams.custpage_filtro_fdesde: '+objParams.custpage_filtro_fdesde);
	nlapiLogExecution('DEBUG', 'generarTXT', 'objParams.custpage_filtro_fhasta: '+objParams.custpage_filtro_fhasta);
	nlapiLogExecution('DEBUG', 'generarTXT', 'objParams.custpage_filtro_tipo_pago: '+objParams.custpage_filtro_tipo_pago);*/
			
	//Llamo al programado
	var params = new Array();			

	if (request.getParameter('custpage_filtro_banco') == 'ITAU')
	{
		// Objeto de pagos con todos los parametros
		params['custscript_3k_objeto_info_pago_itau'] = JSON.stringify(objParams);
		var status= nlapiScheduleScript('customscript_3k_plp_itau_genera_txt', null, params);
	}else{
		// Objeto de pagos con todos los parametros
		params['custscript_3k_objeto_info_pago_std'] = JSON.stringify(objParams);
		var status= nlapiScheduleScript('customscript_3k_plp_santander_genera_txt', null, params);
	}
	
	nlapiLogExecution('DEBUG', 'generarTXT', 'Fin');
	
}


function generarTXT_programadoStd() {
	nlapiLogExecution("DEBUG", "generarTXT_programadoStd", 'Inicio');

	try{
		var context   = nlapiGetContext();
		var infoPagos = JSON.parse(context.getSetting('SCRIPT', 'custscript_3k_objeto_info_pago_std'));

nlapiLogExecution("DEBUG", "generarTXT_programadoItau", 'infoPagos.custpage_filtro_nrocuenta: '+infoPagos.custpage_filtro_nrocuenta);			
		var filtro = new Array();
		var i      = 0;
			
		if(!isEmpty(infoPagos.listadoPagos)){
			var arryaID = new Array();
			for(var qq= 0 ; qq<infoPagos.listadoPagos.length ; qq++){
				arryaID.push(infoPagos.listadoPagos[qq].id);
			}
			if(arryaID.length>0){
				filtro[i++] = new nlobjSearchFilter('internalid', null, 'anyof', arryaID);
			}
		}
		
		var search      = new nlapiLoadSearch('transaction', 'customsearch_3k_santander_plp');
		search.addFilters(filtro);

		var searchResults = search.runSearch();

		var completeResultSet;

		// resultIndex points to record starting current "resultado" in the entire results array
		var resultIndex = 0;
		var resultStep  = 1000; // Number of records returned in one step (maximum is 1000)
		var resultado; // temporary variable used to store the result set
		do {
			// fetch one result set
			resultado = searchResults.getResults(resultIndex, resultIndex + resultStep);

			if (resultado.length > 0) {
				if (resultIndex == 0)
					completeResultSet = resultado; //Primera ve inicializa
				else
					completeResultSet = completeResultSet.concat(resultado);
			}

			// increase pointer
			resultIndex = resultIndex + resultStep;

			// once no records are returned we already got all of them
		} while (resultado.length > 0)
		
		
		var infoCSV = '';
		var totalUSD = 0;
		var totalUYU = 0;
		var totalBRL = 0;
		var totalARS = 0;
		
		if(!isEmpty(completeResultSet)) {
					
			var idAnt         = 1;
			var idAct         = 0;
			var cantPagos     = 0;
			var montoPagar    = 0.0;
			var cabeceraLimit = 28;
									
			for(i=0; i<completeResultSet.length; i++) {

				/*
				#SECCION DE DETALLE
				POSICIÓN	NOMBRE DEL CAMPO	 				LONGITUD
				1-3     	Identificador de seccion
				3-10    	Número de cliente Banco santander
				10-18   	Fecha de Generacion del archivo
				18-24   	Valor desconocido ->'0000'
				24-32   	Cta.Deb USD
				32-36   	Suc.Deb UY USD
				36-40   	Valor desconocido ->'0000'
				40-48   	Cta.Deb UY
				48-52   	Suc.Deb UY
				*/	

				var result = completeResultSet[i];
				var columns = result.getAllColumns();
						
				if(idAnt!=idAct) { //Primer registro	

					//Se arman la linea de la cabecera
					for (var j=22; j<cabeceraLimit; j++) {

						if (j==26){
							infoCSV+= '0'+infoPagos.custpage_filtro_nrocuenta;
						}else{
							//REGISTRO DE PAGO
							infoCSV+=result.getValue(columns[j]);
						}

						idAct = 1;
					}//for lineas de cabecera
					infoCSV+='\r\n';//Salto de linea
				}
				
				var detalleLimit=22;

				//Se arman las lineas de Detalle
				for (var j=0; j<detalleLimit; j++) {					
					
					infoCSV+= result.getValue(columns[j]);
								
					//Columna que contiene el código de la moneda
					if (j==21){

						/*
						#SECCION DE DETALLE
						POSICIÓN	NOMBRE DEL CAMPO	 			LONGITUD
						1-3     	Identificador de seccion
						3-18    	Ruc Proveedor*
						18-83   	Nombre Proveedor*
						83-108  	Valor desconocido ->'0'
						108-128 	Valor desconocido ->'0'
						128-138 	Valor desconocido ->'0'
						138-148 	Valor desconocido ->'0'
						148-158 	Valor desconocido ->'0'
						158-178 	Valor desconocido ->'0'
						178-243 	Valor desconocido ->'0'
						243-246 	Banco (Código)*
						246-249 	Codigo de la sucursal
						249-251 	Tipo de operación
						251-262 	Número de operación
						262-263 	Forma de pago
						263-265 	Tipo
						265-268 	Valor desconocido ->'0'
						268-279 	Número de documento
						279-295 	Importe
						295-303 	Fecha de emision
						303-311 	Fecha de pago
						311-313 	Moneda
						*/
						//Dolar Estadounidense (USD)
						if (result.getValue(columns[21]) == '02'){
							totalUSD  = parseFloat(totalUSD) + parseFloat(result.getValue(columns[18]));
						}
						//Peso Uruguayo (UYU)
						if (result.getValue(columns[21]) == '01'){
							totalUYU  = parseFloat(totalUYU) + parseFloat(result.getValue(columns[18]));
						}
						//REAL (BRL)
						if (result.getValue(columns[21]) == '06'){
							totalBRL  = parseFloat(totalBRL) + parseFloat(result.getValue(columns[18]));
						}
						//Peso Argentino (ARS)
						if (result.getValue(columns[21]) == '07'){
							totalARS  = parseFloat(totalARS) + parseFloat(result.getValue(columns[18]));
						}
					}

				}//for lineas Detalle
				
				infoCSV += '\r\n';//Salto de linea			
										
			}

			var idSeccion = '03';
			var idMoneda;		

			/*
			#SECCION DE PIE DE PAGINA
			POSICIÓN	NOMBRE DEL CAMPO	 			LONGITUD
			1-3     	Identificador de seccion
			3-5     	Moneda del monto total 
			5-21    	Monto total por moneda
			*/

			//Dolar Estadounidense (USD)

			if (totalUSD > 0)
			{
				idMoneda = '02';
				infoCSV += idSeccion + idMoneda + totalUSD.toString().lpad('0',16);
				totalUSD = 0;
				infoCSV += '\r\n';//Salto de linea						
			}
			//Peso Uruguayo (UYU)
			if (totalUYU > 0)
			{
				idMoneda = '01';
				infoCSV += idSeccion + idMoneda + totalUYU.toString().lpad('0',16);
				totalUYU = 0;
				infoCSV += '\r\n';//Salto de linea							
			}
			//REAL (BRL)
			if (totalBRL > 0)
			{
				idMoneda = '06';
				infoCSV += idSeccion + idMoneda + totalBRL.toString().lpad('0',16);
				totalUYU = 0;
				infoCSV += '\r\n';//Salto de linea			
			}
			//Peso Argentino (ARS)
			if (totalARS > 0)
			{
				idMoneda = '07';
				infoCSV += idSeccion + idMoneda + totalARS.toString().lpad('0',16);
				totalUYU = 0;
				infoCSV += '\r\n';//Salto de linea			
			}

		} 		
		var fechaAct       = new Date();
		var codigoTipoPago = infoPagos.custpage_filtro_tipo_pago;	
		var csvFileName    = '';

		if(!isEmpty(codigoTipoPago))
		{
			codigoTipoPago = nlapiLookupField('customrecord_3k_forma_de_pago',codigoTipoPago,'name');
			csvFileName    = 'SANTANDER_' + codigoTipoPago.toUpperCase() + '_' + fechaAct.toJSON() + '.txt';
		}
		else
		{
			codigoTipoPago = '';
			csvFileName    = 'SANTANDER_' + fechaAct.toJSON() + '.txt';
		}

		//Nombre del archivo
		var archAdj     = nlapiCreateFile(csvFileName, 'CSV', infoCSV);
		
		//Se busca la folder en la cual va a quedar el TXT generado.
		archAdj.setFolder(nlapiLookupField('customrecord_3k_form_control_pago_txt',1,'custrecord_3k_folder_id_exportacion'));
		var idFile   = nlapiSubmitFile(archAdj);
		var fechaExp = nlapiDateToString(new Date(),'datetimetz');
		
		var recLog = nlapiCreateRecord('customrecord_3k_log_ejecucion_plp');
		recLog.setFieldValue('custrecord_3k_exportado','T');
		recLog.setFieldValue('custrecord_3k_usuario',nlapiGetContext().user);
		recLog.setFieldValue('custrecord_3k_archivo',idFile);
		recLog.setFieldValue('custrecord_3k_detalle_estado','TXT Exportado: ' + csvFileName);
		recLog.setFieldValue('custrecord_3k_fecha',fechaExp, false);

		var recLogId = nlapiSubmitRecord(recLog);

		for(var h = 0; h<infoPagos.listadoPagos.length; h++) {		
			//nlapiLogExecution("DEBUG", "generarTXT_programadoStd", 'Tipo : '+infoPagos.listadoPagos[h].tipo + ' - ID : '+infoPagos.listadoPagos[h].id);
			var recPAGO = nlapiLoadRecord(infoPagos.listadoPagos[h].tipo,infoPagos.listadoPagos[h].id);
			recPAGO.setFieldValue('custbody_3k_fecha_exportacion_banco',fechaExp);
			nlapiSubmitRecord(recPAGO);
			checkGovernance();
		}

		recLog = nlapiLoadRecord('customrecord_3k_log_ejecucion_plp',recLogId);
		recLog.setFieldValue('custrecord_3k_finalizado','T');
		recLog.setFieldValue('custrecord_3k_detalle_estado','Finalizó sin errores');
		nlapiSubmitRecord(recLog);

		var bancoEmail = 'Santander';
		enviarEmail(csvFileName,bancoEmail,false);	
	}
	catch(e) {
		enviarEmail('','',true);
		nlapiLogExecution("DEBUG", "generarTXT_programadoStd", 'Error: '+e.message);
	}		
	nlapiLogExecution("DEBUG", "generarTXT_programadoStd", 'Fin');	
}


function paylinkPlus_itau(request,response) {	
	nlapiLogExecution('DEBUG', 'paylinkPlus_itau', 'Inicio');

	var user        = nlapiGetUser();	
	var form        = nlapiCreateForm('Generacion de Archivo Para Pago de Proveedores - Banco Itaú', false);	
	var grupoFiltro = form.addFieldGroup('filtros','Criterios');
	var tabDetalle  = form.addTab('tabdetalle','Detalle');
	var subTab      = form.addSubTab('custpage_tabbusqueda','Busqueda','tabdetalle');
	
	form.setScript('customscript_3k_paylinkplus_cliente');
	
	var sublist = form.addSubList('custpage_pagos', 'list', 'Pagos','custpage_tabbusqueda'); //list
	
	sublist.addField('custpage_procesar', 'checkbox', 'Exportar');
	sublist.addField('custpage_internalid', 'text', 'internalid', 'InternalID').setDisplayType('hidden');
	sublist.addField('custpage_recordtype', 'text', 'recordtype', 'RecordType').setDisplayType('hidden');
	sublist.addField('custpage_ruc_proveedor', 'text', 'RUC Proveedor', 'RUC Proveedor');
	sublist.addField('custpage_proveedor', 'text', 'Proveedor', 'Proveedor');
	sublist.addField('custpage_pago_tranid', 'text', 'ID Transacción', 'ID Transacción');
	sublist.addField('custpage_fecha_emision', 'text', 'Fecha de Emisión', 'Fecha de Emisión');
	sublist.addField('custpage_nro_dcto', 'text', 'Número de Documento', 'Número de Documento');
	sublist.addField('custpage_importe', 'text', 'Importe', 'Importe');
	
	sublist.addMarkAllButtons();

	var fechaDesde  = form.addField('custpage_filtro_fdesde','date', 'Fecha Desde:',null, 'filtros');
	var fechaHasta  = form.addField('custpage_filtro_fhasta','date', 'Fecha Hasta:',null, 'filtros');
	/*var tipoPago   = form.addField('custpage_filtro_tipo_pago','select','Tipo de Pago:',null,'filtros');*/
	var moneda      = form.addField('custpage_filtro_moneda','select','Moneda de Pago:',null,'filtros');
	var banco       = form.addField('custpage_filtro_banco','text', 'Banco:',null, 'filtros').setDisplayType('hidden');
	var fechaDif    = form.addField('custpage_filtro_fdiferida','date', 'Fecha Diferida:',null, 'filtros');
	var sinExportar = form.addField('custpage_filtro_solopendientes','checkbox','Pendientes de Exportación',null,'filtros');
	var btnAccion   = form.addField('custpage_accion','text','Accion:',null,'filtros').setDisplayType('hidden');
	banco.setDefaultValue('ITAU');
	moneda.setMandatory(true);
	fechaDif.setMandatory(true);
	
	/*cargarCombo(tipoPago,'customsearch_3k_forma_pago_plp_santander',true);*/
	cargarComboMoneda(moneda);
		
	var infoResultado = form.addField('custpage_resultado','inlinehtml', 'Resultados', null, null);		
			
	if(!isEmpty(request.getParameter('custpage_filtro_fdesde')))
		fechaDesde.setDefaultValue(request.getParameter('custpage_filtro_fdesde'));
	
	if(!isEmpty(request.getParameter('custpage_filtro_fhasta')))
		fechaHasta.setDefaultValue(request.getParameter('custpage_filtro_fhasta'));

	if(!isEmpty(request.getParameter('custpage_filtro_moneda')))
		moneda.setDefaultValue(request.getParameter('custpage_filtro_moneda'));	

	if(!isEmpty(request.getParameter('custpage_filtro_solopendientes')))
		sinExportar.setDefaultValue(request.getParameter('custpage_filtro_solopendientes'));	

	if(!isEmpty(request.getParameter('custpage_filtro_fdiferida')))
		fechaDif.setDefaultValue(request.getParameter('custpage_filtro_fdiferida'));

	form.addSubmitButton('Buscar');

	form.addButton('custpage_btngenerartxt','Generar archivo TXT','exportar_txt();');

	if (request.getMethod() == 'POST') {
		//Por la limitacion que no se pueden mostrar 2 botones submit, si es el BUSCAR viene el valor en submitter, sino viene en la accion
		var sAccion = isEmpty(request.getParameter('custpage_accion'))?request.getParameter('submitter'):request.getParameter('custpage_accion');

		switch(sAccion)
		{
			case 'GENERAR_TXT':
				generarTXT(request);
				infoResultado.setDefaultValue('<font color="red">Se procesó su pedido. Recibirá una notificación al finalizar por email</font>');				
				response.writePage(form);
				break;
			case 'Buscar':
				cargarPagosItau(sublist,request);
				response.writePage(form);
				break;
		}
				
	}//POST
	else {
		//Primera carga
		sinExportar.setDefaultValue('T');
		response.writePage(form);
	}
	nlapiLogExecution('DEBUG', 'paylinkPlus_itau', 'Fin');	
}

function cargarPagosItau(sublist,request) {

	var filtro = new Array();
	var i      = 0;

	if(!isEmpty(request.getParameter('custpage_filtro_fdesde')))
		filtro[i++] = new nlobjSearchFilter('trandate', null, 'onorafter', nlapiStringToDate(request.getParameter('custpage_filtro_fdesde')));
		
	if(!isEmpty(request.getParameter('custpage_filtro_fhasta')))
		filtro[i++] = new nlobjSearchFilter('trandate', null, 'onorbefore', nlapiStringToDate(request.getParameter('custpage_filtro_fhasta')));

	if(!isEmpty(request.getParameter('custpage_filtro_moneda')))
		filtro[i++] = new nlobjSearchFilter('currency', null, 'IS', request.getParameter('custpage_filtro_moneda'));

	if(!isEmpty(request.getParameter('custpage_filtro_solopendientes')))
	{
		if(request.getParameter('custpage_filtro_solopendientes') =='T')
			filtro[i++] = new nlobjSearchFilter('custbody_3k_fecha_exportacion_banco', null, 'isempty', null);
	}	

	/*if(!isEmpty(request.getParameter('custpage_filtro_nrocuenta')))
		nroCuenta.setDefaultValue(request.getParameter('custpage_filtro_nrocuenta'));	

	if(!isEmpty(request.getParameter('custpage_filtro_monedacc')))
		monedaCC.setDefaultValue(request.getParameter('custpage_filtro_monedacc'));	

	if(!isEmpty(request.getParameter('custpage_filtro_ctacontable')))
		cuentaCont.setDefaultValue(request.getParameter('custpage_filtro_ctacontable'));*/		
nlapiLogExecution('DEBUG','LINE 721','request.getParameter(custpage_filtro_fdiferida): '+request.getParameter('custpage_filtro_fdiferida'));
	if(!isEmpty(request.getParameter('custpage_filtro_fdiferida')))
		filtro[i++] = new nlobjSearchFilter('custbody_3k_fecha_diferida', null, 'on', nlapiStringToDate(request.getParameter('custpage_filtro_fdiferida')));
		
	var search = new nlapiLoadSearch('transaction', 'customsearch_3k_itau_plp_2');
	search.addFilters(filtro);
	
	var searchResults = search.runSearch();
	
	var completeResultSet;
		
	// resultIndex points to record starting current "resultado" in the entire results array 
	var resultIndex = 0; 
	var resultStep  = 1000; // Number of records returned in one step (maximum is 1000)
	var resultado; // temporary variable used to store the result set
	do 
	{
		// fetch one result set
		resultado = searchResults.getResults(resultIndex, resultIndex + resultStep);
		
		if(resultado.length > 0) {
			if(resultIndex == 0) 
				completeResultSet = resultado; //Primera ve inicializa
			else
				completeResultSet = completeResultSet.concat(resultado);
		}
		
		// increase pointer
		resultIndex = resultIndex + resultStep;

		// once no records are returned we already got all of them
	} while (resultado.length > 0) 
	
	j = 1;
	
	if(!isEmpty(completeResultSet)) {

		for(i=0; i<completeResultSet.length; i++) {
			var result  = completeResultSet[i];
			var columns = result.getAllColumns();
			sublist.setLineItemValue('custpage_pr_type', j,'SKU');
			sublist.setLineItemValue('custpage_internalid', j, result.getValue(columns[0]));
			sublist.setLineItemValue('custpage_ruc_proveedor', j, result.getValue(columns[1]));
			sublist.setLineItemValue('custpage_proveedor', j, result.getValue(columns[2]));
			sublist.setLineItemValue('custpage_pago_tranid', j, result.getValue(columns[3]));
			sublist.setLineItemValue('custpage_fecha_emision', j, result.getValue(columns[4]));
			sublist.setLineItemValue('custpage_nro_dcto', j, result.getValue(columns[5]));
			sublist.setLineItemValue('custpage_importe', j, result.getValue(columns[6]));
			sublist.setLineItemValue('custpage_recordtype', j, result.getValue(columns[7]));		
			j++;
		} //for
	} //if
}


function generarTXT_programadoItau() {
	nlapiLogExecution("DEBUG", "generarTXT_programadoItau", 'Inicio');

	try {
		var context   = nlapiGetContext();	
		var infoPagos = JSON.parse(context.getSetting('SCRIPT', 'custscript_3k_objeto_info_pago_itau'));

		var filtro = new Array();
		var i = 0;

		if(!isEmpty(infoPagos.listadoPagos)){
			var arryaID = new Array();
			for(var qq= 0 ; qq<infoPagos.listadoPagos.length ; qq++){
				arryaID.push(infoPagos.listadoPagos[qq].id);
			}
			if(arryaID.length>0){
				filtro[i++] = new nlobjSearchFilter('internalid', null, 'anyof', arryaID);
			}
		}
		
		var search      = new nlapiLoadSearch('transaction', 'customsearch_3k_itau_plp_3');
		search.addFilters(filtro);

		var searchResults = search.runSearch();

		var completeResultSet;

		// resultIndex points to record starting current "resultado" in the entire results array
		var resultIndex = 0;
		var resultStep  = 1000; // Number of records returned in one step (maximum is 1000)
		var resultado; // temporary variable used to store the result set
		do {
			// fetch one result set
			resultado = searchResults.getResults(resultIndex, resultIndex + resultStep);

			if (resultado.length > 0) {
				if (resultIndex == 0)
					completeResultSet = resultado; //Primera ve inicializa
				else
					completeResultSet = completeResultSet.concat(resultado);
			}

			//Increase pointer
			resultIndex = resultIndex + resultStep;

			// once no records are returned we already got all of them
		} while (resultado.length > 0)
		
		
		var infoCSV = '';
		var moneda  = '';
		
		if(!isEmpty(completeResultSet)) {

			var cantPagos     = 0;
			var montoPagar    = 0.0;
			var cabeceraLimit = 31;
									
			for(i=0; i<completeResultSet.length; i++)
			{
				var result  = completeResultSet[i];
				var columns = result.getAllColumns();
				
				var detalleLimit = 22;

				/*
				POSICIÓN	NOMBRE DEL CAMPO	 			LONGITUD
				1-8 		Número de Cuenta
				8-23		Complemento espacios en blanco
				23-27		Moneda
				27-43		Monto a Pagar
				43-75		Nombre Beneficiario
				75-89		Número de Beneficiario
				89-159		Referencia
				*/

				//Se arman las lineas de Detalle
				for (var j = 0; j<=detalleLimit; j++)
				{					
					infoCSV += result.getValue(columns[j]);
				}//for lineas Detalle

				moneda = result.getValue(columns[2]);	
				infoCSV+='\r\n';//Salto de linea			
			}
		} 
		
		var fechaAct = new Date();
		
		//Nombre del archivo
		var csvFileName = 'ITAU_' + moneda + '_' + fechaAct.toJSON() + '.dat';
		var archAdj     = nlapiCreateFile(csvFileName, 'CSV', infoCSV);
		
		//Se busca la folder en la cual va a quedar el TXT generado.
		archAdj.setFolder(nlapiLookupField('customrecord_3k_form_control_pago_txt',1,'custrecord_3k_folder_id_exportacion'));
		var idFile   = nlapiSubmitFile(archAdj);
		var fechaExp = nlapiDateToString(new Date(),'datetimetz');		
		var recLog   = nlapiCreateRecord('customrecord_3k_log_ejecucion_plp');
		recLog.setFieldValue('custrecord_3k_exportado','T');
		recLog.setFieldValue('custrecord_3k_usuario',nlapiGetContext().user);
		recLog.setFieldValue('custrecord_3k_archivo',idFile);
		recLog.setFieldValue('custrecord_3k_detalle_estado','TXT Exportado: ' + csvFileName);
		recLog.setFieldValue('custrecord_3k_fecha',fechaExp, false);
		
		var recLogId = nlapiSubmitRecord(recLog);
			
		for(var h = 0; h<infoPagos.listadoPagos.length; h++) {		

			var recPAGO = nlapiLoadRecord(infoPagos.listadoPagos[h].tipo,infoPagos.listadoPagos[h].id);
			recPAGO.setFieldValue('custbody_3k_fecha_exportacion_banco',fechaExp);
			nlapiSubmitRecord(recPAGO);
			checkGovernance();
		}

		recLog = nlapiLoadRecord('customrecord_3k_log_ejecucion_plp',recLogId);
		recLog.setFieldValue('custrecord_3k_finalizado','T');
		recLog.setFieldValue('custrecord_3k_detalle_estado','Finalizó sin errores');
		nlapiSubmitRecord(recLog);
		
		var bancoEmail = 'Itaú';
		enviarEmail(csvFileName,bancoEmail,false);
	}
	catch(e) {
		enviarEmail('','',true);
		nlapiLogExecution("DEBUG", "generarTXT_programadoItau", 'Error: '+e.message);
	}
	nlapiLogExecution("DEBUG", "generarTXT_programadoItau", 'Fin');	
}


function enviarEmail(nombreTxt, banco, error){

	var recEmployee   = nlapiLoadRecord('employee',nlapiGetContext().user);
	var emailEmployee = recEmployee.getFieldValue('email');	
	var mensaje       = '';

	if (error) {
		mensaje      = '<html><head></head><body><br>';
		mensaje     += 'Ocurrió un problema durante la generación del archivo.';
		mensaje     += '<br>';
		mensaje     += '</body></html>';
	}
	else{
		mensaje	     = '<html><head></head><body><br>';
		mensaje     += 'Archivo generado con éxito. Nombre del archivo: ' + nombreTxt;
		mensaje     += '<br>';
		mensaje     += '</body></html>';		
	}
	nlapiSendEmail(nlapiGetContext().user, emailEmployee, 'NetSuite - Archivo Para Pago de Proveedores (TXT) - Banco ' + banco, mensaje);
}
/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteBundles/Bundle 158453/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
/*require.config({
	baseUrl: '/SuiteBundles/Bundle 158453',
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

    function(error, record, search, utilities) {


        function afterSubmit(scriptContext) {
            try {
                log.audit('Inicio Grabar Cliente', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);
                if (scriptContext.type == 'create' || scriptContext.type == 'edit') {
                    var idCliente = scriptContext.newRecord.id;
                    if(scriptContext.type == 'edit'){
                        idCliente = scriptContext.oldRecord.id;
                    }
                    log.audit('Inicio Grabar Cliente', 'AftereSubmit - ID Cliente : ' + idCliente);
                    var idProveedor = '';
                    if (!utilities.isEmpty(idCliente)) {
                        // INICIO - Obtener Tipo de Cliente y Proveedor Asociado
                        var clienteComisionista = scriptContext.newRecord.getValue({ fieldId: 'custentity_3k_comisionista' });
                        var proveedorAsociado = scriptContext.newRecord.getValue({ fieldId: 'custentity_3k_prov_asociado' });

                        log.audit('Inicio Grabar Cliente', 'AftereSubmit - Cliente Comisionista : ' + clienteComisionista + ' - Proveedor Asociado : ' + proveedorAsociado);

                        if (clienteComisionista == true && utilities.isEmpty(proveedorAsociado)) {

                            // INICIO - Cargar el Cliente y Obtener la informacion
                            var objRecordCliente = record.load({
                                type: record.Type.CUSTOMER,
                                id: idCliente,
                                isDynamic: true
                            });

                            var objRecordProveedor = record.create({
                                type: record.Type.VENDOR,
                                isDynamic: true
                            });


                            if (!utilities.isEmpty(objRecordCliente)) {
                                objRecordProveedor.setValue({ fieldId: 'companyname', value: objRecordCliente.getValue({ fieldId: 'companyname' }) });
                                objRecordProveedor.setValue({ fieldId: 'url', value: nvl(objRecordCliente.getValue({ fieldId: 'url' }),'') });
                                objRecordProveedor.setValue({ fieldId: 'comments', value: nvl(objRecordCliente.getValue({ fieldId: 'comments' }),'') });
                                objRecordProveedor.setValue({ fieldId: 'email', value: objRecordCliente.getValue({ fieldId: 'email' }) });
                                objRecordProveedor.setValue({ fieldId: 'phone', value: nvl(objRecordCliente.getValue({ fieldId: 'phone' }),'') });
                                objRecordProveedor.setValue({ fieldId: 'subsidiary', value: objRecordCliente.getValue({ fieldId: 'subsidiary' }) });

                                var monedaPrincipal = objRecordCliente.getValue({ fieldId: 'currency' });

                                objRecordProveedor.setValue({ fieldId: 'currency', value: objRecordCliente.getValue({ fieldId: 'currency' }) });
                                objRecordProveedor.setValue({ fieldId: 'custentity_l598_tipo_documento', value: objRecordCliente.getValue({ fieldId: 'custentity_l598_tipo_documento' }) });
                                objRecordProveedor.setValue({ fieldId: 'custentity_l598_es_ruc', value: objRecordCliente.getValue({ fieldId: 'custentity_l598_es_ruc' }) });
                                objRecordProveedor.setValue({ fieldId: 'custentity_l598_nro_documento', value: objRecordCliente.getValue({ fieldId: 'custentity_l598_nro_documento' }) });
                                objRecordProveedor.setValue({ fieldId: 'vatregnumber', value: objRecordCliente.getValue({ fieldId: 'custentity_l598_nro_documento' }) });
                                objRecordProveedor.setValue({ fieldId: 'custentity_l598_pais_origen', value: objRecordCliente.getValue({ fieldId: 'custentity_l598_pais_origen' }) });
                                objRecordProveedor.setValue({ fieldId: 'custentity_l598_nombre_legal', value: objRecordCliente.getValue({ fieldId: 'custentity_l598_nombre_legal' }) });
                                objRecordProveedor.setValue({ fieldId: 'legalname', value: objRecordCliente.getValue({ fieldId: 'custentity_l598_nombre_legal' }) });
                                objRecordProveedor.setValue({ fieldId: 'custentity_3k_ejec_cuentas', value: objRecordCliente.getValue({ fieldId: 'custentity_3k_ejec_cuentas' }) });
                                objRecordProveedor.setValue({ fieldId: 'custentity_3k_ejec_ventas', value: objRecordCliente.getValue({ fieldId: 'custentity_3k_ejec_ventas' }) });
                                objRecordProveedor.setValue({ fieldId: 'custentity_l598_es_ruc', value: objRecordCliente.getValue({ fieldId: 'custentity_l598_es_ruc' }) });
                                objRecordProveedor.setValue({ fieldId: 'custentity_3k_rubro', value: objRecordCliente.getValue({ fieldId: 'custentity_3k_rubro' }) });
                                objRecordProveedor.setValue({ fieldId: 'custentity_3k_fecha_nacimient', value: objRecordCliente.getValue({ fieldId: 'custentity_3k_fecha_nacimient' }) });
                                objRecordProveedor.setValue({ fieldId: 'custentity_3k_sexo_masc', value: objRecordCliente.getValue({ fieldId: 'custentity_3k_sexo_masc' }) });
                                objRecordProveedor.setValue({ fieldId: 'custentity_3k_sexo_fem', value: objRecordCliente.getValue({ fieldId: 'custentity_3k_sexo_fem' }) });
                                objRecordProveedor.setValue({ fieldId: 'custentity_3k_comisionista', value: true });
                                objRecordProveedor.setValue({ fieldId: 'custentity_3k_cliente_asociado', value: idCliente });


                                // INICIO Obtener Informacion de Direccion

                                var cantidadLineasDireccion = objRecordCliente.getLineCount({
                                    sublistId: 'addressbook'
                                });

                                if (cantidadLineasDireccion > 0) {
                                    for (var i = 0; i < cantidadLineasDireccion; i++) {

                                        var lineNum = objRecordCliente.selectLine({
                                            sublistId: 'addressbook',
                                            line: i
                                        });

                                        var objSubrecord = objRecordCliente.getCurrentSublistSubrecord({
                                            sublistId: 'addressbook',
                                            fieldId: 'addressbookaddress'
                                        });

                                        objRecordProveedor.selectNewLine({
                                            sublistId: 'addressbook'
                                        });

                                        objRecordProveedor.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling', value: objRecordCliente.getCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling' })});
                                        objRecordProveedor.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultshipping', value: objRecordCliente.getCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultshipping' })});

                                        subrecordAddress = objRecordProveedor.getCurrentSublistSubrecord({
                                            sublistId: 'addressbook',
                                            fieldId: 'addressbookaddress'
                                        });

                                        subrecordAddress.setValue({sublistId: 'addressbookaddress',fieldId: 'addressee',value: objSubrecord.getValue({ fieldId: 'addressee' })});
                                        subrecordAddress.setValue({sublistId: 'addressbookaddress',fieldId: 'addr1',value: objSubrecord.getValue({ fieldId: 'addr1' })});
                                        subrecordAddress.setValue({sublistId: 'addressbookaddress',fieldId: 'state',value: objSubrecord.getValue({ fieldId: 'state' })});
                                        subrecordAddress.setValue({sublistId: 'addressbookaddress',fieldId: 'city',value: objSubrecord.getValue({ fieldId: 'city' })});
                                        subrecordAddress.setValue({sublistId: 'addressbookaddress',fieldId: 'zip',value: objSubrecord.getValue({ fieldId: 'zip' })});

                                        objRecordProveedor.commitLine({
                                            sublistId: 'addressbook'
                                        });

                                    }
                                }

                                // FIN Obtener Informacion de Direccion

                                // INICIO Obtener Informacion de Monedas

                                var cantidadLineasMoneda = objRecordCliente.getLineCount({
                                    sublistId: 'currency'
                                });

                                if (cantidadLineasMoneda > 0) {
                                    for (var i = 0; i < cantidadLineasMoneda; i++) {

                                        var lineNum = objRecordCliente.selectLine({
                                            sublistId: 'currency',
                                            line: i
                                        });

                                        var monedaLinea = objRecordCliente.getCurrentSublistValue({ sublistId: 'currency', fieldId: 'currency' });

                                        if(monedaLinea!=monedaPrincipal){

                                            objRecordProveedor.selectNewLine({
                                                sublistId: 'currency'
                                            });

                                            objRecordProveedor.setCurrentSublistValue({ sublistId: 'currency', fieldId: 'currency', value: objRecordCliente.getCurrentSublistValue({ sublistId: 'currency', fieldId: 'currency' }) });

                                            objRecordProveedor.commitLine({
                                                sublistId: 'currency'
                                            });

                                        }

                                    }
                                }

                                // FIN Obtener Informacion de Monedas

                                // INICIO - Crear Proveedor
                                try {
                                    idProveedor = objRecordProveedor.save();
                                    if (utilities.isEmpty(idProveedor)) {
                                        log.error('Grabar Cliente', 'AfterSubmit - Error Grabando Proveedor Asociado - Error : No se recibio ID del Proveedor Generado');
                                        throw utilities.crearError('SCLI001', 'Error Grabando Proveedor Asociado - Error : No se recibio ID del Proveedor Generado');
                                    } else {

                                        log.audit('Inicio Grabar Cliente', 'AftereSubmit - ID Proveedor Generado : ' + idProveedor);

                                        objRecordCliente.setValue({ fieldId: 'custentity_3k_proveedor_relacionado', value: idProveedor });
                                        objRecordCliente.setValue({ fieldId: 'custentity_3k_prov_asociado', value: idProveedor });

                                        try {
                                            idCliente = objRecordCliente.save();
                                            if (utilities.isEmpty(idCliente)) {
                                                log.error('Grabar Cliente', 'AfterSubmit - Error Grabando Campos de Cliente - Error : No se recibio ID de Cliente Actualizado');
                                                throw utilities.crearError('SCLI002', 'Error Grabando Campos de Cliente - Error : No se recibio ID de Cliente Actualizado');
                                            }
                                        } catch (exepcionSubmitCliente) {
                                            log.error('Grabar Cliente', 'AfterSubmit - Excepcion Actualizando Cliente - Excepcion : ' + exepcionSubmitCliente.message);
                                            throw utilities.crearError('SCLI003', 'Excepcion Actualizando Cliente - Excepcion : ' + exepcionSubmitCliente.message);
                                        }
                                    }
                                } catch (exepcionSubmitProveedor) {
                                    log.error('Grabar Cliente', 'AfterSubmit - Excepcion Grabando Proveedor Asociado - Excepcion : ' + exepcionSubmitProveedor.message);
                                    throw utilities.crearError('SCLI004', 'Excepcion Grabando Proveedor Asociado - Excepcion : ' + exepcionSubmitProveedor.message);
                                }
                                // FIN - Crear Proveedor
                            } else {
                                // Error Cargando Registro Cliente
                                log.error('Grabar Cliente', 'AfterSubmit - Error Cargando Registro Cliente');
                                throw utilities.crearError('SCLI005', 'Error Cargando Registro Cliente');
                            }
                        }
                    } else {
                        // Error Obteniendo ID de Cliente
                        var mensaje = "Error Obteniendo la siguiente Informacion del Cliente : ";
                        if (utilities.isEmpty(idCliente)) {
                            mensaje = mensaje + "ID Interno del Cliente";
                        }

                        log.error('Grabar Cliente', 'AfterSubmit - Error Grabando Cliente - Error : ' + mensaje);
                        throw utilities.crearError('SCLI006', 'Error Grando Cliente - Error : ' + mensaje);
                    }
                }
            } catch (excepcion) {
                log.error('Grabar Cliente', 'AfterSubmit - Excepcion Grabando Cliente - Excepcion : ' + excepcion.message);
                throw utilities.crearError('SCLI007', 'Excepcion Grabando Cliente - Excepcion : ' + excepcion.message);
            }
            log.audit('Fin Grabar Cliente', 'AftereSubmit - Tipo : Servidor - Evento : ' + scriptContext.type);
        }

        function nvl(valor, valorDefault) {
            if (utilities.isEmpty(valor))
                return valorDefault;
            else
                return valor;
        }

        return {
            afterSubmit: afterSubmit
        };

    });
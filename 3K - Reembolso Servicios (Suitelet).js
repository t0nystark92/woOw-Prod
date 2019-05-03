/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/search', 'N/record', 'N/ui/serverWidget'], function (search, record, serverWidget) {

    function onRequest(context) {

        log.audit('SUITELET AUDIT', 'INICIO SUITELET')
        try {

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
                id: 'infodepositos',
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

            // INICIO CAMPOS
            var btnAccion = form.addField({
                id: 'custpage_accion',
                label: 'Accion:',
                type: serverWidget.FieldType.TEXT,
                container: 'filtros'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            /*INICIO FILTROS*/
            var customer = form.addField({
                id: 'customer',
                label: 'Cliente',
                type: serverWidget.FieldType.SELECT,
                source: 'customer',
                container: 'filtros'
            });

            customer.isMandatory = true;

            var moneda = form.addField({
                id: 'moneda',
                label: 'Moneda',
                type: serverWidget.FieldType.SELECT,
                source: 'currency',
                container: 'filtros'
            });

            moneda.isMandatory = true;

            var fechaDesde = form.addField({
                id: 'fechadesde',
                label: 'Fecha Desde',
                type: serverWidget.FieldType.DATE,
                container: 'filtros'
            });

            /*INICIO CAMPOS PARA COMPLETAR POR EL CLIENTE*/

            var tipoCambio = form.addField({
                id: 'tipocambio',
                label: 'Tipo Cambio',
                type: serverWidget.FieldType.CURRENCY,
                container: 'infodepositos'
            });

            var devolucionCredito = form.addField({
                id: 'devolucioncredito',
                label: 'Devolución Crédito',
                type: serverWidget.FieldType.CHECKBOX,
                container: 'infodepositos'
            });

            var departamento = form.addField({
                id: 'departamento',
                label: 'Departamento',
                type: serverWidget.FieldType.SELECT,
                source: 'department',
                container: 'infodepositos'
            });

            var sitio = form.addField({
                id: 'sitio',
                label: 'Sitio',
                type: serverWidget.FieldType.SELECT,
                source: 'class',
                container: 'infodepositos'
            });

            var sitioweb = form.addField({
                id: 'sitioweb',
                label: 'Sitio Web',
                type: serverWidget.FieldType.SELECT,
                source: 'customrecord_cseg_3k_sitio_web_o',
                container: 'infodepositos'
            });

            var account = form.addField({
                id: 'account',
                label: 'Cuenta',
                type: serverWidget.FieldType.SELECT,
                source: 'account',
                container: 'infodepositos'
            });


            // INICIO SUBLISTA
            var sublist = form.addSublist({
                id: 'depositos',
                type: serverWidget.SublistType.LIST,
                label: 'Depositos Pendientes',
                tab: 'tabbusqueda'
            });

            sublist.addField({
                id: 'ordenventa',
                type: serverWidget.FieldType.SELECT,
                label: 'Orden Venta',
                source: 'salesorder'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'articulo',
                type: serverWidget.FieldType.SELECT,
                label: 'Articulo',
                source: 'item'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            sublist.addField({
                id: 'ulid',
                type: serverWidget.FieldType.TEXT,
                label: 'ULID Servicios'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            form.addSubmitButton({
                label: 'Buscar Depositos Pendientes'
            });

            form.addButton({
                id: 'custpage_btdevolver',
                label: 'Reembolsar',
                functionName: "reembolsar"
            });

            var infoResultado = form.addField({
                id: 'custpage_resultado',
                label: 'Resultados',
                type: serverWidget.FieldType.INLINEHTML
            });

            if (context.request.method === 'GET') {
                log.audit('Generacion Reembolso Servicios', 'FIN Proceso');
                context.response.writePage(form);
            } else {
                var sAccion = utilities.isEmpty(context.request.parameters.custpage_accion) ? context.request.parameters.submitter : context.request.parameters.custpage_accion;

                switch (sAccion) {

                    case 'Buscar Depositos Pendientes':
                        if (!utilities.isEmpty(resultado) && resultado.error == true) {
                            var mensaje = resultado.mensaje;
                            log.error('Generacion Reembolso Servicios', 'Error Consulta Depositos Pendientes - Error : ' + mensaje);
                            infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                        }
                        log.audit('Generacion Reembolso Servicios', 'FIN Proceso');
                        context.response.writePage(form);
                        break;

                    case 'REEMBOLSAR':
                    
                        if (!utilities.isEmpty(resultado) && resultado.error == true) {
                            mensaje = resultado.mensaje;
                            log.error('Generacion Reembolso Servicios', 'Error Reembolsando Servicios - Error : ' + mensaje);
                        }
                        infoResultado.defaultValue = '<font color="red">' + mensaje + '</font>';
                        log.audit('Generacion Reembolso Servicios', 'FIN Proceso');
                        context.response.writePage(form);
                        break;

                }
            }



        } catch (e) {
            log.error('ERROR CATCH SUITELET', e.message)
        }

        log.audit('SUITELET AUDIT', 'FIN SUITELET')

    }

    return {
        onRequest: onRequest
    }
});
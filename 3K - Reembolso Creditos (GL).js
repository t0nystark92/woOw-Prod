function customizeGlImpact(transactionRecord, standardLines, customLines, book) {

    try {
        //var rectype = transactionRecord.getRecordType();
        var recid = transactionRecord.getId();
        //var porDevolucion = nlapiLookupField('itemreceipt', recid,'custbody_3k_por_devolucion');
        var devolucion = transactionRecord.getFieldValue('custbody_3k_devolucion_creditos');
        var cuentaDevolucion = transactionRecord.getFieldValue('custbody_3k_cuenta_creditos');
        var account = transactionRecord.getFieldValue('account');
        var sitioWebOrigen = transactionRecord.getFieldValue('custbody_cseg_3k_sitio_web_o');
        var sistema = transactionRecord.getFieldValue('custbody_cseg_3k_sistema');
        var proceso = 'Ajuste de Impacto - Devolución Créditos';

        if (devolucion == 'T' && !isEmpty(cuentaDevolucion)) {

            nlapiLogExecution('AUDIT', proceso, 'INICIO - id Reembolso: ' + recid);
            nlapiLogExecution('AUDIT', proceso, 'INICIO - account: ' + account);

            var lineaEncontrada = false;
            var objAcct = {};
            var cantLineas = standardLines.getCount();


            for (var i = 0; i < cantLineas; i++) {

                //get the value of NetSuite's GL posting
                var line = standardLines.getLine(i);

                objAcct.cuentaLM = line.getAccountId().toString();

                if (objAcct.cuentaLM == account) {
                    lineaEncontrada = true;

                    objAcct.importeDebito = parseFloat(line.getDebitAmount(), 10);
                    objAcct.importeCredito = parseFloat(line.getCreditAmount(), 10);
                    objAcct.nombre = line.getEntityId();
                    objAcct.sitioWeb = line.getClassId();
                    objAcct.ubicacion = line.getLocationId();
                    objAcct.departament = line.getDepartmentId();
                    objAcct.subsidiary = line.getSubsidiaryId();

                    break;

                    //nlapiLogExecution('DEBUG', proceso, JSON.stringify(objAcct));
                }

            }

            nlapiLogExecution('AUDIT', proceso, 'INICIO - objAcct: ' + JSON.stringify(objAcct));

            if (lineaEncontrada && objAcct.importeCredito > 0 && objAcct.importeDebito == 0) {

                //Debito sobre la cuenta de compra por facturar
                var newLine1 = customLines.addNewLine();
                //nlapiLogExecution('AUDIT', proceso, 'INICIO - newAcctLine1: ' + JSON.stringify(newAcctLine1));
                newLine1.setDebitAmount(objAcct.importeCredito);
                newLine1.setAccountId(parseInt(account));
                
                if (!isEmpty(objAcct.nombre)) newLine1.setEntityId(objAcct.nombre);
                if (!isEmpty(objAcct.sitioWeb)) newLine1.setClassId(objAcct.sitioWeb);
                if (!isEmpty(objAcct.ubicacion)) newLine1.setLocationId(objAcct.ubicacion);
                if (!isEmpty(objAcct.departament)) newLine1.setDepartmentId(objAcct.departament);
                //if (!isEmpty(objAcct.subsidiary)) newAcctLine1.setEntityId(objAcct.subsidiary);
                if (!isEmpty(sitioWebOrigen)) newLine1.setSegmentValueId('cseg_3k_sitio_web_o',parseInt(sitioWebOrigen));
                if (!isEmpty(sistema)) newLine1.setSegmentValueId('cseg_3k_sistema',parseInt(sistema));
                //nlapiLogExecution('AUDIT', proceso, 'INICIO - newAcctLine1: ' + JSON.stringify(newAcctLine1));

                //Credito sobre la cuenta de reclasificacion
                var newLine2 = customLines.addNewLine();
                newLine2.setAccountId(parseInt(cuentaDevolucion));
                newLine2.setCreditAmount(objAcct.importeCredito);
                if (!isEmpty(objAcct.nombre)) newLine2.setEntityId(objAcct.nombre);
                if (!isEmpty(objAcct.sitioWeb)) newLine2.setClassId(objAcct.sitioWeb);
                if (!isEmpty(objAcct.ubicacion)) newLine2.setLocationId(objAcct.ubicacion);
                if (!isEmpty(objAcct.departament)) newLine2.setDepartmentId(objAcct.departament);
                //if (!isEmpty(objAcct.subsidiary)) newAcctLine1.setEntityId(objAcct.subsidiary);
                if (!isEmpty(sitioWebOrigen)) newLine2.setSegmentValueId('cseg_3k_sitio_web_o',parseInt(sitioWebOrigen));
                if (!isEmpty(sistema)) newLine2.setSegmentValueId('cseg_3k_sistema',parseInt(sistema));


                //nlapiLogExecution('AUDIT', proceso, 'INICIO - newAcctLine2: ' + JSON.stringify(newAcctLine2));

            } else {
                throw nlapiCreateError('ERR', 'No se cumplen las condiciones para modificar el Impacto.', false);
            }

            nlapiLogExecution('AUDIT', proceso, 'FIN - idRecepcion: ' + recid);

        }

    } catch (e) {
        throw nlapiCreateError('ERR', 'suiteGL - ' + e.message.toString(), false);
    }
}


function isEmpty(value) {

    return (typeof value == 'undefined' || value == null || value == '');

}
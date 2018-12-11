/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define(['N/currentRecord'],
    function (currentRecord) {
    function calcularVolumetrico() {
            var respuesta = new Object({});
            respuesta.error = false;
            respuesta.detalle = [];

            //alert('1');

            try {

                var rec = currentRecord.get();
                var numLines = rec.getLineCount({
                    sublistId: 'item'
                });

                //alert('Numero Lineas : ' + numLines);

                var totalVolumentrico = 0;
                var totalPeso = 0;
                var totalCantidad = 0;

                for (var i = 0; i < numLines; i++) {

                    //alert('Numero LineasSSSSSSSSSSSSSSSSS : ' + numLines);

                    var pesoTotalLine = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_peso_total',
                        line: i
                    });

                    //alert('Numero LineasSSSSSSSSSSSSSSSSS : ' + numLines);

                    var tamanoTotalLine = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_3k_tam_vol_total',
                        line: i
                    });

                    var quantity = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    });

                    //alert('Numero Lineas : ' + numLines);

                    /*totalVolumentrico += parseFloat(tamanoTotalLine,10);
                    totalPeso += parseFloat(pesoTotalLine,10);
                    totalCantidad += parseInt(quantity,10);*/
                    if(!isEmpty(tamanoTotalLine) && isNaN(tamanoTotalLine))
                        totalVolumentrico += parseFloat(tamanoTotalLine,10);

                    if(!isEmpty(pesoTotalLine) && isNaN(pesoTotalLine))
                        totalPeso += parseFloat(pesoTotalLine,10);

                    if(!isEmpty(quantity) && isNaN(quantity))
                        totalCantidad += parseInt(quantity,10);

                    //alert('Tam : ' + totalVolumentrico);
                }

                rec.setValue({
                    fieldId: 'custbody_3k_peso_total',
                    value: totalPeso.toFixed(2).toString()
                });

                rec.setValue({
                    fieldId: 'custbody_3k_tam_vol_total',
                    value: totalVolumentrico.toFixed(2).toString()
                });

                rec.setValue({
                    fieldId: 'custbody_3k_cant_unidades_total',
                    value: totalCantidad.toString()
                });

                alert('Calculo de dimensiones totales realizado sin exito');

                //var idRec = rec.save();

                respuesta.rec = rec;



            } catch (e) {
                respuesta.error = true;
                respuestaParcial = new Object();
                respuestaParcial.codigo = 'CVOL001';
                respuestaParcial.mensaje = 'Excepcion calculando Totales peso y tamaño : ' + e.message;
                respuesta.detalle.push(respuestaParcial);
            }

            //return respuesta;
        }

        function isEmpty(value) {
            if (value === '') {
                return true;
            }

            if (value === null) {
                return true;
            }

            if (value === undefined) {
                return true;
            }
            return false;
        }

    return {
        calcularVolumetrico : calcularVolumetrico
    };
});

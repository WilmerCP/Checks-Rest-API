//Dependencias

const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');
const path = require('path');
const fs = require('fs');

//Archivo que va a constar de una serie de funciones utiles que usaremos a lo largo del programa

let helpers = {};

//Converts from text to JSON without throwing

helpers.convertToJSON = function (texto) {

    try {

        miJSON = JSON.parse(texto);

        return miJSON;

    } catch (err) {

        return {};

    }

}

//Funcion para encriptar las claves de los usuarios

helpers.encriptar = function (contra) {

    if (typeof (contra) == 'string' && contra.length > 0) {

        hashedString = crypto.createHmac('sha256', config.hashingSecret).update(contra).digest('hex');
        return hashedString;

    } else {

        return false;

    }
}

//Funcion para generar tokens aleatorios

helpers.getRandomToken = function (digitos) {

    if (typeof (digitos) == 'number' && digitos > 0) {

        let caracteresPosibles = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';

        for (let i = 1; i <= digitos; i++) {

            let newChar = caracteresPosibles.charAt(Math.floor(Math.random() * caracteresPosibles.length));
            token += newChar;

        }

        return token;

    } else {

        return false;

    }
}

//Function that sends sms messages with twilio

helpers.sendMessage = function (phone, msg, callback) {

    phone = typeof (phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof (msg) == 'string' && msg.trim().length <= 1600 ? msg.trim() : false;

    if (phone && msg) {

        let payload = {

            'From': config.twilio.fromPhone,
            'To': '+90' + phone,
            'Body': msg

        }

        let stringPayload = querystring.stringify(payload);

        let requestDetails = {

            'protocol': 'https:',
            'method': 'POST',
            'hostname': 'api.twilio.com',
            'path': '/2010-04-01/Accounts/' + config.twilio.SID + '/Messages.json',
            'auth': config.twilio.SID + ':' + config.twilio.authToken,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }

        }

        let request = https.request(requestDetails, (res) => {

            let statuscode = res.statusCode;

            if (statuscode == 200 || statuscode == 201) {

                callback(false);

            } else {

                callback('Status code returned was ' + statuscode);

            }

        });

        request.on('error', (e) => {

            callback(e);

        });

        request.write(stringPayload);

        request.end();


    } else {

        callback('El numero y/o mensaje no es valido');

    }

}

helpers.bringTemplate = function (nombreArchivo, callback) {

    nombreArchivo = typeof (nombreArchivo) == 'string' && nombreArchivo.length > 0 ? nombreArchivo : false;
    let directorio = path.join(__dirname, '..', 'assets');

    if (nombreArchivo) {

        fs.readFile(directorio + '/' + nombreArchivo + '.html', 'utf-8', (err, data) => {

            if (!err && data && data.length > 0) {


                callback(false, data);


            } else {

                callback('Hubo un error al leer el contenido');
            }


        });

    } else {

        callback('No se especifico un nombre del asset a traer');

    }

}

//Funcion que se encarga de recibir un texto html y un objeto con data dinamica para reemplazar
//en las variables denotadas con {nombre_variable} en el documento

helpers.interpolar = function (str, data) {

    str = typeof (str) == "string" && str.length > 0 ? str : '';
    data = typeof (data) == 'object' && data !== null ? data : {};

    //Agregar las variables globales al objeto de variables dinamicas
    for (var nombreElemento in config.templateGlobals) {
        if (config.templateGlobals.hasOwnProperty(nombreElemento)) {

            data['global_' + nombreElemento] = config.templateGlobals[nombreElemento]

        }
    }

    //Interpolar el contenido dinamico
    for (var nombreVariable in data) {
        if (data.hasOwnProperty(nombreVariable) && typeof (data[nombreVariable] == 'string')) {

            let replace = data[nombreVariable];
            let find = '{' + nombreVariable + '}';

            while (str.includes(find)) {
                str = str.replace(find, replace);
            }
        }

    }

    return str;
}

//Prepara la plantilla uniendola con el footer,header y los datos dinamicos para enviarla al usuario
helpers.prepareTemplate = function (nombreArchivo, data, callback) {

    helpers.bringTemplate(nombreArchivo, (err, str) => {

        if (!err && typeof (str) == 'string' && str.length > 0) {

            //Traer header y footer
            helpers.bringTemplate('_header', (err, header) => {

                if (!err && typeof (header) == 'string' && header.length > 0) {

                    helpers.bringTemplate('_footer', (err, footer) => {

                        if (!err && typeof (footer) == 'string' && footer.length > 0) {

                            let plantilla = header + str + footer;

                            let plantillaFinal = helpers.interpolar(plantilla, data);

                            callback(false, plantillaFinal);

                        } else {

                            console.log('Error al acceder al template: _footer');

                        }



                    });


                } else {

                    callback('Error al acceder al template: _header');

                }

            });


        } else {

            callback('Error al acceder al template:' + nombreArchivo);

        }

    });

}

module.exports = helpers;
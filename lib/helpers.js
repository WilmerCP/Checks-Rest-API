//Dependencias

const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');

//Archivo que va a constar de una serie de funciones utiles que usaremos a lo largo del programa

let helpers = {};

//Converts from text to JSON without throwing

helpers.convertToJSON = function(texto){

    try{

        miJSON = JSON.parse(texto);

        return miJSON;

    }catch(err){

        return {};

    }

}

//Funcion para encriptar las claves de los usuarios

helpers.encriptar = function(contra){

    if(typeof(contra) == 'string' && contra.length > 0){

        hashedString = crypto.createHmac('sha256',config.hashingSecret).update(contra).digest('hex');
        return hashedString;

    }else{

        return false;

    }
}

//Funcion para generar tokens aleatorios

helpers.getRandomToken = function(digitos){

    if(typeof(digitos) == 'number' && digitos > 0){

        let caracteresPosibles = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';

        for (let i = 1; i <= digitos; i++) {

            let newChar = caracteresPosibles.charAt(Math.floor(Math.random()*caracteresPosibles.length));
            token += newChar;

        }

        return token;

    }else{

        return false;

    }
}

    //Function that sends sms messages with twilio

helpers.sendMessage = function(phone,msg,callback){

    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim().length <= 1600 ? msg.trim() : false;

    if(phone && msg){

        let payload = {

            'From': config.twilio.fromPhone,
            'To': '+90'+phone,
            'Body': msg

        }

        console.log(payload);

        let stringPayload = querystring.stringify(payload);

        let requestDetails = {

            'protocol' : 'https:',
            'method' : 'POST',
            'hostname' : 'api.twilio.com',
            'path' : '/2010-04-01/Accounts/'+config.twilio.SID+'/Messages.json',
            'auth' : config.twilio.SID+':'+config.twilio.authToken,
            'headers':{
                'Content-Type':'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }

        }

        let request = https.request(requestDetails,(res)=>{

            let statuscode = res.statusCode;

            if(statuscode == 200 || statuscode == 201){

                callback(false);

            }else{

                callback('Status code returned was ' + statuscode);

            }

        });

        request.on('error',(e)=>{

            callback(e);

        });

        request.write(stringPayload);


    }else{

        callback('El numero y/o mensaje no es valido');

    }

}

/*
helpers.sendMessage("5058266309","Hi how are you",(e)=>{

    if(e){

        console.log(e);

    }else{

        console.log('todo fino');

    }

});
*/

module.exports = helpers;
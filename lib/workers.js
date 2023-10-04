
let http = require('http');
let https = require('https');
let _data = require('./data');
let helpers = require('./helpers');
let _logs = require('./logs');
let util = require('util');
let debug = util.debuglog('workers');

let workers = {};

//Notificamos al usuario a traves de SMS

workers.notifyUser = function(newCheckData){

    let mensaje = "Alerta: Su chequeo " + newCheckData.metodo.toUpperCase() + " para la url: " + newCheckData.url + " obtuvo el estado: \"" + newCheckData.state + "\"";

    helpers.sendMessage(newCheckData.numero,mensaje,(err)=>{

        if(!err){

            debug("Un usuario ha sido alertado de un cambio de estatus en el check: " + newCheckData.id);

        }else{

            debug("Ha habido un error al alertar al usuario en el check: " + newCheckData.id);

        }

    });


}

//Revisamos que sucedio con el chequeo

workers.processCheckOutcome = function(originalCheckdata,checkOutcome){

    let status = !checkOutcome.error && checkOutcome.responseCode && originalCheckdata.validCodes.includes(checkOutcome.responseCode) ? 'up' : 'down';
    let corresponde = originalCheckdata.state !== status && originalCheckdata.lastChecked ? true : false;

    let newCheckData = originalCheckdata;

    let timeOfCheck = Date.now();

    workers.log(originalCheckdata,checkOutcome,status,corresponde,timeOfCheck);

    newCheckData.state = status;
    newCheckData.lastChecked = timeOfCheck;

    //Actualizamos la info del check

    _data.update('checks',newCheckData.id,newCheckData,(err)=>{

        if(!err){

            if(corresponde){

                workers.notifyUser(newCheckData);

            }else{

                debug('Check Status hasnt changed, no need to tell the user');

            }

        }else{

            debug('Error actualizando la informacion de un check');

        }

    });

}

//Chequeamos la url de la manera especificada

workers.performCheck = function(originalCheckdata){

    let checkOutcome = {

        'error': false,
        'responseCode': false,

    }

    let OutcomeSent = false;

    try{

    let myUrl = new URL(originalCheckdata.protocolo + '://' + originalCheckdata.url);

    let requestDetails ={

        'protocol': originalCheckdata.protocolo + ':',
        'method': originalCheckdata.metodo.toUpperCase(),
        'host': myUrl.host,
        'path': myUrl.href,
        'timeout': originalCheckdata.timeoutSeconds * 1000,
    }

    let moduleToUse = originalCheckdata.protocolo == "http" ? http : https;

    let req = moduleToUse.request(requestDetails,(res)=>{

        let codigo = res.statusCode;
        checkOutcome.responseCode = codigo;

        if(!OutcomeSent){

            workers.processCheckOutcome(originalCheckdata,checkOutcome);

            OutcomeSent = true;

        }

    });

    req.on('error',(err)=>{

        checkOutcome.error = {

            'error': true,
            'value': err,

        }

        if(!OutcomeSent){

            workers.processCheckOutcome(originalCheckdata,checkOutcome);

            OutcomeSent = true;

        }

    });

    req.on('timeout',(err)=>{

        checkOutcome.error = {

            'error': true,
            'value': 'timeout',

        }

        if(!OutcomeSent){

            workers.processCheckOutcome(originalCheckdata,checkOutcome);

            OutcomeSent = true;

        }

    });

    req.end();

}catch(err){

    debug("La url proporcionada no es valida");

}

}

//Recibimos los datos del check y verificamos que tenga el formato necesario

workers.validateCheckData = function(originalCheckdata){

    originalCheckdata = typeof(originalCheckdata) == 'object' && originalCheckdata !== null ? originalCheckdata : {};
    originalCheckdata.protocolo = typeof (originalCheckdata.protocolo) == "string" && ['http', 'https'].includes(originalCheckdata.protocolo) ? originalCheckdata.protocolo : false;
    originalCheckdata.url = typeof (originalCheckdata.url) == "string" && originalCheckdata.url.trim().length >= 1 ? originalCheckdata.url.trim() : false;
    originalCheckdata.timeoutSeconds = typeof (originalCheckdata.timeoutSeconds) == "number" && originalCheckdata.timeoutSeconds >= 1 && originalCheckdata.timeoutSeconds <= 5 ? originalCheckdata.timeoutSeconds : false;
    originalCheckdata.validCodes = typeof (originalCheckdata.validCodes) == "object" && originalCheckdata.validCodes instanceof Array && originalCheckdata.validCodes.length > 0 ? originalCheckdata.validCodes : false;
    originalCheckdata.metodo = typeof (originalCheckdata.metodo) == "string" && ['get', 'post', 'put', 'delete'].includes(originalCheckdata.metodo) ? originalCheckdata.metodo : false;
    originalCheckdata.numero = typeof(originalCheckdata.numero) == "string" && originalCheckdata.numero.trim().length == 10 ? originalCheckdata.numero.trim() : false;
    originalCheckdata.id = typeof(originalCheckdata.id) == "string" && originalCheckdata.id.trim().length == 20 ? originalCheckdata.id.trim() : false;

    originalCheckdata.lastChecked = typeof (originalCheckdata.lastChecked) == "number" ? originalCheckdata.lastChecked : false;
    originalCheckdata.state = typeof (originalCheckdata.state) == "string" && ['up', 'down'].includes(originalCheckdata.state) ? originalCheckdata.state : 'down';

    if(originalCheckdata.protocolo
        && originalCheckdata.url
        && originalCheckdata.timeoutSeconds
        && originalCheckdata.validCodes
        && originalCheckdata.metodo
        && originalCheckdata.numero
        && originalCheckdata.id ){

            workers.performCheck(originalCheckdata);

        }else{

            debug('Uno de los checks no posee todos los campos necesarios: ' + originalCheckdata.id);

        }

};

//Obtenemos una lista con los checks a comprobar y se llaman a las otras funciones de este proceso

workers.gatherChecks = function(){

    _data.list("checks",(err,lista)=>{

        if(!err && lista && lista.length > 0){

            lista.forEach(checkName => {
                
                _data.read('checks',checkName,(err,originalCheckdata)=>{

                    if(!err && originalCheckdata){

                        workers.validateCheckData(originalCheckdata);

                    }else{

                        debug("Se encontro un error al leer el check de nombre: " + checkName);
                        debug(err);

                    }


                });


            });


        }else{

            debug("No se pudo encontrar ningun check");

        }

    });

};

workers.log = function(originalCheckdata,checkOutcome,state,corresponde,timeOfCheck){

    let logData = {

        'Check': originalCheckdata,
        'Outcome': checkOutcome,
        'Status': state,
        'Alert': corresponde,
        'Time': timeOfCheck

    }

    let logString = JSON.stringify(logData);

    let filename = originalCheckdata.id;

    _logs.append(filename,logString,(err)=>{

        if(!err){

            debug('Successfully logged data to file');

        }else{

            debug(err);
        }

    });

}

//Funcion que toma la informacion de los logs, la guarda en un archivo comprimido ordenado por fecha
//Y borra el contenido del archico original para dar espacio a nuevos logs

workers.rotateLogs = function(){

    _logs.list(false,(err,logs)=>{

        if(!err && logs && logs.length > 0){

            logs.forEach(function(logFile){

                let fecha = Date.now();

                let nuevoArchivo = logFile + '-' + fecha;

                _logs.comprimir(logFile,nuevoArchivo,function(err){

                    if(!err){

                        _logs.truncar(logFile + '.log',(err)=>{

                            if(!err){

                                debug('Se han rotado los logs satisfactoriamente');

                            }else{

                                debug('Error al borrar el contenido de un archivo de logs');
                                debug(err);

                            }

                        });

                    }else{

                        debug('Error al comprimir un archivo:' + err);

                    }

                });


            });

        }else{

            debug("Aviso: No se encontraron logs para comprimir");

        }

    });

}


//Cada 24 horas se deben comprimir los logs

workers.rotationLoop = function(){

    setInterval(workers.rotateLogs,1000*60*60*24);

}

//Cada minuto se deben verificar los checks

workers.loop = function(){

    setInterval(workers.gatherChecks,1000*60);

}

workers.init = function(){

    workers.gatherChecks();

    workers.loop();

    workers.rotateLogs();

    workers.rotationLoop();

    console.log('\x1b[33m%s\x1b[0m','Workers inicializados');

};

module.exports = workers;
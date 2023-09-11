//Dependencias

const http = require('http');
const { StringDecoder } = require('string_decoder');
const config = require('./lib/config');
const https = require('https');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

//Handlers intermediarios para identificar cual conexion es http y cual https

let handlerHttp = function (req, res) {

    comportamiento(req, res, 'http');

}

let handlerHttps = function (req, res) {

    comportamiento(req, res, 'https');

}

//Creando el servidor http y le decimos que tiene que hacer cuando reciba peticiones

var servidorHttp = http.createServer(handlerHttp);

//Objeto de configuracion para el certificado SSL

let configHttps = {

    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')

}

//Creando el servidor https con su configuracion extra

var servidorHttps = https.createServer(configHttps, handlerHttps);


//Comportamiendo para el servidor cada vez que reciba una peticion

let comportamiento = function (req, res, protocolo) {

    //Obtenemos la informacion de la URL 
    let myUrl = new URL(protocolo + '://' + req.headers.host + req.url);
    myUrl.pathname = myUrl.pathname.replace(/\/+$/, '');
    myUrl.pathname = myUrl.pathname.toLowerCase();

    //Obtenemos el metodo y los headers
    let method = req.method.toLowerCase();
    let headers = req.headers;

    //Obtenemos el payload en caso de recibir alguno
    let decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data', (chunk) => {

        buffer += decoder.write(chunk);

    });

    //Se termina de recibir toda la data
    req.on('end', () => {

        let datos = {

            'url': myUrl,
            'metodo': method,
            'headers': headers,
            'contenido': helpers.convertToJSON(buffer),

        }

        let currentHandler = typeof (router[datos.url.pathname]) !== 'undefined' ? router[datos.url.pathname] : handlers.NotFound;

        currentHandler(datos, (statuscode, payload) => {

            statuscode = typeof (statuscode) == 'number' ? statuscode : 200;

            payload = typeof (payload) == 'object' ? payload : {};

            let payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statuscode);
            res.end(payloadString);

        });

    });

}

//Router que sirve para comprobar los posibles handlers y redirigir al adecuado

var router = {

    '/ping': handlers.ping,
    'NotFound': handlers.NotFound,
    '/users': handlers.users,
    '/tokens': handlers.tokens,
    '/checks': handlers.checks

}

//Ponemos los servidores a trabajar en el puerto indicado y le decimos que deben de hacer
//una vez este ya en funcionamiento

servidorHttp.listen(config.httpPort, function () {

    console.log('Server listening on port ' + config.httpPort + ' on the environment ' + config.envName);

});

servidorHttps.listen(config.httpsPort, function () {

    console.log('Server listening on port ' + config.httpsPort + ' on the environment ' + config.envName);

});


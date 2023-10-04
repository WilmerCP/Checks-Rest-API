//Dependencias

const http = require('http');
const { StringDecoder } = require('string_decoder');
const config = require('./config');
const https = require('https');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');

let server = {};

//Handlers intermediarios para identificar cual conexion es http y cual https

let handlerHttp = function (req, res) {

    server.comportamiento(req, res, 'http');

}

let handlerHttps = function (req, res) {

    server.comportamiento(req, res, 'https');

}

//Creando el servidor http y le decimos que tiene que hacer cuando reciba peticiones

server.servidorHttp = http.createServer(handlerHttp);

//Objeto de configuracion para el certificado SSL

server.configHttps = {

    'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))

}

//Creando el servidor https con su configuracion extra

server.servidorHttps = https.createServer(server.configHttps, handlerHttps);


//Comportamiendo para el servidor cada vez que reciba una peticion

server.comportamiento = function (req, res, protocolo) {

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

        let currentHandler = typeof (server.router[datos.url.pathname]) !== 'undefined' ? server.router[datos.url.pathname] : handlers.NotFound;

        currentHandler(datos, (statuscode, payload,contentType) => {

            statuscode = typeof (statuscode) == 'number' ? statuscode : 200;

            //The paylod to send the requester can be html document or JSON (default);
            contentType = typeof(contentType) == 'string' ? contentType : 'json';

            if(contentType == 'json'){

                payload = typeof (payload) == 'object' ? payload : {};
                var payloadString = JSON.stringify(payload);
                res.setHeader('Content-Type', 'application/json');              
            }

            if(contentType == 'html'){

                payloadString = typeof (payload) == 'string' ? payload : '';
                res.setHeader('Content-Type', 'text/html');         
            }       

            res.writeHead(statuscode);
            res.end(payloadString);

        });

    });

}

//Router que sirve para comprobar los posibles handlers y redirigir al adecuado

server.router = {

    '/ping': handlers.ping,
    'NotFound': handlers.NotFound,
    '/api/users': handlers.users,
    '/api/tokens': handlers.tokens,
    '/api/checks': handlers.checks,
    '/': handlers.index,

}

server.init = function(){

//Ponemos los servidores a trabajar en el puerto indicado y le decimos que deben de hacer
//una vez este ya en funcionamiento

server.servidorHttp.listen(config.httpPort, function () {

    console.log('\x1b[34m%s\x1b[0m','Server listening on port ' + config.httpPort + ' on the environment ' + config.envName);

});

server.servidorHttps.listen(config.httpsPort, function () {

    console.log('\x1b[34m%s\x1b[0m','Server listening on port ' + config.httpsPort + ' on the environment ' + config.envName);
    
});

}

module.exports = server;
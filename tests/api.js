//Tests for the api

let http = require('http');
let app = require('./../index');
let config = require('./../lib/config');
let assert = require('assert');

let apiTests = {}

let makeRequest = function(path,callback){

    let requestDetails = {

        'protocol': 'http:',
        'hostname':'localhost',
        'port': config.httpPort,
        'path': path,
        'method': 'GET',
        'headers': {

            'content-type': 'application/json'

        }

    }

    let request = http.request(requestDetails,(res)=>{

        callback(res);

    });

    request.end();

}

apiTests['The application should start without throwing'] = function(done){

    try {

        assert.doesNotThrow(function(){

            app.init(()=>{
    
                done(false);
        
            });
    
        },Error);
        
    } catch (error) {

        done(error);
        
    }
    
}

apiTests['/ping should return 200 status code'] = function(done){

    makeRequest('/ping',(res)=>{

        try {

            assert.equal(res.statusCode,400);
            done(false);

            
        } catch (error) {

            done(error);
            
        }

    });
    
}

module.exports = apiTests;
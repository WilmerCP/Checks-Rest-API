/*
* This module defines the environment in which the app is working
*
*/

//Delete this line and use your own twilio variables
const private = require('./private');

let environments = {}

environments.staging = {

    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'hashingSecret' : 'Venezuela libre',
    'twilio' : {

        'authToken' : private.authToken,
        'SID' : private.SID,
        'fromPhone' : private.fromPhone

    },
    'maxChecks' : 5,
    'templateGlobals': {

        'nombreApp': 'Arepita',
        'baseUrl': 'http://localhost:3000',
        'fechaCreacion': '2024',
        'autor': 'Wilmer Cuevas'

    }
}

environments.production = {

    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    'hashingSecret' : 'This phrase will be used in the encrypting process',
    'twilio' : {

        'authToken' : private.authToken,
        'SID' : private.SID,
        'fromPhone' : private.fromPhone

    },
    'maxChecks' : 5,
    'templateGlobals': {

        'nombreApp': 'Arepita',
        'baseUrl': 'http://localhost:5000',
        'fechaCreacion': '2024',
        'autor':'Wilmer Cuevas'

    }
}

let currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

let envToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = envToExport;
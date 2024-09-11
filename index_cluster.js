const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');
const cluster = require('cluster');
const os = require('os');

let app = {};

app.init = function(callback){

    if(cluster.isMaster){

        workers.init();

        setTimeout(function(){
    
            cli.init();
            callback();
    
        },50);


        //Fork the process and create worker threads that will share the total work load of the server requests
        for(var i = 0 ; i<os.cpus().length ; i++){

            cluster.fork();

        }


    }else{

        server.init();

    }

}

if(require.main == module){

    app.init(function(){});

}

module.exports = app;
const server = require('./lib/server');
const workers = require('./lib/workers');

let app = {};

app.init = function(){

    server.init();
    workers.init();

}

app.init();

module.exports = app;
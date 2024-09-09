//Command line interface for admins

const readline = require('readline');
const util = require('util');
const events = require('events');
const os = require('os');
const v8 = require('v8');
const _data = require('./data');
const _log = require('./logs')
const helpers = require('./helpers');


class _events extends events{};
let e = new _events();

let interface = null;
let toDelete = "";

let validCommands = [ 

    'man',
    'help',
    'exit',
    'stats',
    'list users',
    'user info',
    'list checks',
    'check info',
    'list logs',
    'log info',
    'user delete'
]

let descriptions = {

    'man':'Shows this manual of available commands',
    'help':'Alias of man command',
    'exit':'Ends the process of this app and server',
    'stats':'Prints statistics about resource consumption and operating system',
    'list users':'Provides a list of all registered users',
    'user info {id}':'Obtains the data of a specific user',
    'user delete {id}':'Deletes a specific user from database',
    'list checks --up/down':'Provides a list of all active checks',
    'check info {id}':'Shows the detail of a specific check',
    'list logs':'Provides a list of all compressed logs files',
    'log info {id}':'Prints the specific log file'

}

let cli = {};

//Presentation related functions

cli.verticalSpace = function(n){

    n = typeof(n) == 'number' && n >0 ? n : 1;

    while(n>0){

        console.log('');
        n--;

    }

}

cli.printLine = function(){

    let width = process.stdout.columns;

    let line = '';

    while(width>0){

        line += '-';

        width--;

    }
    console.log(line);

}

cli.centered = function(text){

    let width = process.stdout.columns;

    let padding = Math.floor((width - text.length)/2);

    let line = '';

    while(padding>0){

        line += ' ';

        padding--;
    }

    line += text;

    console.log(line);

}

//Command event handlers:

e.on('man',function(str){

    cli.responders.help();

});

e.on('help',function(str){

    cli.responders.help();

});

e.on('exit',function(str){
    
    cli.responders.exit();

})

e.on('stats',function(str){

    cli.responders.stats();

});

e.on('list users',function(str){

    cli.responders.listUsers();

});

e.on('user info',function(str){

    cli.responders.userInfo(str);

});

e.on('list checks',function(str){

    cli.responders.listChecks(str);

});

e.on('check info',function(str){

    cli.responders.checkInfo(str);

});

e.on('list logs',function(str){

    cli.responders.listLogs();

});

e.on('log info',function(str){

    cli.responders.logInfo(str);

});

e.on('user delete',function(str){

    cli.responders.userDelete(str);

});

//Responder functions:

cli.responders = {};

cli.responders.logInfo = function(str){

    let words = str.split(" ");
    cli.verticalSpace();

    let filename = typeof words[2] == "string" && words[2].length > 20 ? words[2] : false;

    if(filename){

        _log.decomprimir(filename,(error,text)=>{

            if(!error && text){

                let logs = text.split('\n');

                logs.forEach((log)=>{

                    let logObject = helpers.convertToJSON(log);

                    if(logObject && JSON.stringify(logObject) != '{}'){

                        console.dir(logObject,{colors:true});
                        cli.verticalSpace();

                    }


                });


            }

        });

    }else{

        console.log("The syntax used is not correct, try the command help");
        cli.verticalSpace();
        //Reactivate the prompt to receive new commands
        interface.prompt();

    }


}

cli.responders.checkInfo = function(str){

    let words = str.split(" ");
    cli.verticalSpace();

    let id = typeof words[2] == "string" && words[2].length == 20 ? words[2] : false;

    if(id){

        _data.read('checks',id,(error,checkInfo)=>{

            if(!error && checkInfo){

                console.dir(checkInfo,{ colors: true});
                cli.verticalSpace();

                //Reactivate the prompt to receive new commands
                interface.prompt();


            }else{

                console.log("No information was found for this check id");
                cli.verticalSpace();
                //Reactivate the prompt to receive new commands
                interface.prompt();

            }

        });

    }else{

        console.log("The syntax used is not correct, try the command help");
        cli.verticalSpace();
        //Reactivate the prompt to receive new commands
        interface.prompt();

    }


}

cli.responders.userDelete = function(str){

    let words = str.split(" ");
    cli.verticalSpace();

    let id = typeof words[2] == "string" && words[2].length == 10 ? words[2] : false;

    if(id){

        console.log('Are you sure you want to delete this user?');
        interface.removeListener('line',lineListener);
        interface.on('line',confirmationListener);
        interface.prompt();
        toDelete = id;


    }else{

        console.log("The syntax used is not correct, try the command help");
        cli.verticalSpace();
        //Reactivate the prompt to receive new commands
        interface.prompt();

    }


}

cli.responders.userInfo = function(str){

    let words = str.split(" ");
    cli.verticalSpace();

    let id = typeof words[2] == "string" && words[2].length == 10 ? words[2] : false;

    if(id){

        _data.read('users',id,(error,userInfo)=>{

            if(!error && userInfo){

                delete userInfo.hashedPassword;

                console.dir(userInfo,{ colors: true});
                cli.verticalSpace();

                //Reactivate the prompt to receive new commands
                interface.prompt();


            }else{

                console.log("No information was found for this user id");
                cli.verticalSpace();
                //Reactivate the prompt to receive new commands
                interface.prompt();

            }

        });

    }else{

        console.log("The syntax used is not correct, try the command help");
        cli.verticalSpace();
        //Reactivate the prompt to receive new commands
        interface.prompt();

    }


}

cli.responders.listLogs = function(){

    _log.list(true,(error,logList)=>{

        cli.verticalSpace();

        if(!error && logList && logList.length > 0){

            let counter = logList.length;

            logList.forEach(filename => {
                
                if(filename.includes('-')){

                    console.log(filename);
                    cli.verticalSpace();

                }
                
                counter--;

                if(counter == 0){

                    //Reactivate the prompt to receive new commands
                    interface.prompt();

                }

            });
        }

    });


}

cli.responders.listChecks = function(str){

    _data.list('checks',(error,checksList)=>{

        cli.verticalSpace();

        if(!error && checksList && checksList.length > 0){

            let counter = checksList.length;

            checksList.forEach(id => {
                
                _data.read('checks',id,(error,checkData)=>{

                    if(!error && checkData){

                        let line = "ID: "+checkData.id+" "+checkData.metodo.toUpperCase()+" "+checkData.protocolo+ "://"+checkData.url+" State: ";

                        let state = typeof(checkData.state) == "string" ? checkData.state : 'unknown';

                        let lowerCaseString = str.toLowerCase();

                        line += state;

                        if(lowerCaseString.indexOf('--'+state) > -1 || lowerCaseString.indexOf('--up') == -1 && lowerCaseString.indexOf('--down') == -1){

                            console.log(line);
                            cli.verticalSpace(1);

                        }

                        counter--;

                        if(counter == 0){

                            //Reactivate the prompt to receive new commands
                            interface.prompt();

                        }

                    }

                });

            });
        }

    });


}

cli.responders.listUsers = function(){

    _data.list('users',(error,userList)=>{

        cli.verticalSpace();

        if(!error && userList && userList.length > 0){

            let counter = userList.length;

            userList.forEach(id => {
                
                _data.read('users',id,(error,userData)=>{

                    if(!error && userData){

                        let line = "Name: "+userData.nombre+" "+userData.apellido+" Phone: "+userData.numero + " Checks: ";
                        let checksAmount = Array.isArray(userData.checks) && userData.checks.length > 0 ? userData.checks.length : 0;
                        line += checksAmount;

                        console.log(line);
                        cli.verticalSpace(1);
                        counter--;

                        if(counter == 0){

                            //Reactivate the prompt to receive new commands
                            interface.prompt();

                        }

                    }

                });

            });

        }

    });

}

cli.responders.stats = function(){

    let stats = {

        'Load Average':os.loadavg().join(' '),
        'CPU Count':os.cpus().length,
        'Free Memory':os.freemem() + ' bytes',
        'Current Mallocated Memory':v8.getHeapStatistics().malloced_memory + ' bytes',
        'Peak Mallocated Memory':v8.getHeapStatistics().peak_malloced_memory + ' bytes',
        'Allocated Heap Used (%)':Math.round(v8.getHeapStatistics().used_heap_size*100/v8.getHeapStatistics().total_heap_size),
        'Available Heap Allocated (%)':Math.round(v8.getHeapStatistics().total_heap_size*100/v8.getHeapStatistics().heap_size_limit),
        'Uptime':os.uptime()+' seconds',
    
    }

    cli.printLine();
    cli.centered('SYSTEM STATISTICS');
    cli.printLine();
    cli.verticalSpace(2);

    for (let stat in stats) {
        if (stats.hasOwnProperty(stat)){

            let line = ' \x1b[33m'+stat+'\x1b[0m';

            let padding = 40 - line.length;

            while(padding>0){

                line+=' ';
                padding--;

            }

            line += stats[stat];

            console.log(line);

            cli.verticalSpace(1);
            
            
        }
    }

    cli.printLine();

    //Reactivate the prompt to receive new commands
    interface.prompt();

}

cli.responders.help = function(){

    cli.printLine();
    cli.centered('CLI Manual');
    cli.printLine();
    cli.verticalSpace(2);

    for (let command in descriptions) {
        if (descriptions.hasOwnProperty(command)){

            let line = ' \x1b[33m'+command+'\x1b[0m';

            let padding = 35 - line.length;

            while(padding>0){

                line+=' ';
                padding--;

            }

            line += descriptions[command];

            console.log(line);

            cli.verticalSpace(1);
            
            
        }
    }

    cli.printLine();
    //Reactivate the prompt to receive new commands
    interface.prompt();

}

cli.responders.exit = function(){

    process.exit(0);

}

cli.processInput = function(str){

    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : false;
    let matchFound = false;

    if(str){

        for(let command of validCommands) {
            
            if(str.toLowerCase().indexOf(command) == 0){

                e.emit(command,str);
                matchFound = true;
                break;

            }

        }

        if(!matchFound){

            cli.verticalSpace();
            console.log('This command is not recognized');
            cli.verticalSpace();

        }


    }
}

let lineListener = function(str){

    cli.processInput(str);

}

let confirmationListener = function(str){

    if(str == 'yes'){

        cli.verticalSpace();

        let id = typeof toDelete == "string" && toDelete.length == 10 ? toDelete : false;

        _data.read('users', id, (err, usuario) => {

            if (!err) {

                _data.delete('users', id, (err) => {

                    if (!err) {

                        let checks = typeof (usuario.checks) == "object" && usuario.checks instanceof Array ? usuario.checks : [];
                        let aBorrar = checks.length;
                        let errores = 0;

                        if (aBorrar > 0) {

                            for (let index = 0; index < aBorrar; index++) {

                                _data.delete('checks', checks[index], (err) => {

                                    if (err) {

                                        errores += 1;

                                    }

                                    if (index == aBorrar - 1) {

                                        if (errores == 0) {

                                            console.log('The user '+usuario.nombre+' was deleted');
                                            interface.removeListener('line',confirmationListener);
                                            interface.on('line',lineListener);
                                            interface.prompt();

                                        } else {

                                            console.log('The user '+usuario.nombre+' was deleted but all checks associated might not be totally deleted');
                                            interface.removeListener('line',confirmationListener);
                                            interface.on('line',lineListener);
                                            interface.prompt();

                                        }

                                    }

                                });

                            }

                        } else {

                            console.log('The user '+usuario.nombre+' was deleted');
                            interface.removeListener('line',confirmationListener);
                            interface.on('line',lineListener);
                            interface.prompt();

                        }

                    } else {

                        console.log('There was an error while deleting the user');
                        interface.removeListener('line',confirmationListener);
                        interface.on('line',lineListener);
                        interface.prompt();

                    }

                });

            } else {

                console.log('An user was not found for this id');
                interface.removeListener('line',confirmationListener);
                interface.on('line',lineListener);
                interface.prompt();

            }

        });


    }else{

        console.log('The user was not deleted');
        interface.removeListener('line',confirmationListener);
        interface.on('line',lineListener);
        interface.prompt();

    }

}

cli.init = function(){

    console.log('\x1b[35m%s\x1b[0m','The CLI is running');

    interface = readline.createInterface({

        input:process.stdin,
        output:process.stdout,
        prompt:">"

    });

    //Open the prompt to receive the first command
    interface.prompt();

    interface.on('line',lineListener);

    //Kill the process if the user stops the CLI
    interface.on('close',function(){

        process.exit(0);

    });



}


module.exports = cli;
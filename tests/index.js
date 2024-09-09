//Test Runner

let _app = {}

_app.tests = {}

_app.tests.unit = require('./unit');

_app.verticalSpace = function(n){

    n = typeof(n) == 'number' && n >0 ? n : 1;

    while(n>0){

        console.log('');
        n--;

    }

}

_app.printLine = function(){

    let width = process.stdout.columns;

    let line = '';

    while(width>0){

        line += '-';

        width--;

    }
    console.log(line);

}

_app.centered = function(text){

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


_app.countTests = function(){

    let count = 0;
    
    for (const key in _app.tests) {
        if (_app.tests.hasOwnProperty(key)) {
            
            for (const test in _app.tests[key]) {
                if (_app.tests[key].hasOwnProperty(test)) {
                    
                    count++;
             
                }
            }
            
        }
    }

    return count;

}

_app.printReport = function(successes,errors,amount){

    let errorCount = errors.length;

    _app.verticalSpace();
    _app.printLine();
    _app.centered('TEST REPORT');
    _app.printLine();
    _app.verticalSpace();

    console.log('Amount of tests executed: '+amount);
    console.log('Tests passed: '+successes);
    console.log('Tests failed: '+errorCount);

    if(errorCount>0){

        _app.verticalSpace();
        _app.printLine();
        _app.centered('ERRORS');
        _app.verticalSpace();

        errors.forEach(element => {

            console.log('\x1b[31m%s\x1b[0m',element.test);
            console.log(element.msg);
            
        });

    }




}

_app.runTests = function(){

    let amount = _app.countTests();
    let counter = 0;
    let errors = [];
    let successes = 0;

    _app.verticalSpace();
    
    for (const key in _app.tests) {
        if(_app.tests.hasOwnProperty(key)){
            
            let subCategory = _app.tests[key];

            for (const testName in subCategory) {
                if (subCategory.hasOwnProperty(testName)) {
                    
                    (function(){

                        try{
                            subCategory[testName](()=>{

                                console.log('\x1b[32m%s\x1b[0m',testName);
                                successes++;
                                counter++;

                                if(counter == amount){

                                    _app.printReport(successes,errors,amount);

                                }

                            });
                        }catch(e){

                            let error = {

                                test: testName,
                                msg: e

                            }

                            errors.push(error);

                            console.log('\x1b[31m%s\x1b[0m',testName);
                            counter++;

                            if(counter == amount){

                                _app.printReport(successes,errors,amount);

                            }

                        }

                    })();
                    
                }
            }

        }
    }




}

_app.runTests();
// Unit Tests

let assert = require('assert');
let helpers = require('./../lib/helpers');
let _data = require('./../lib/data');

let unit = {}

unit['helpers.getRandomToken should return a string of specified length'] = function(done){

    try {

        let value = helpers.getRandomToken(10);
        assert.equal(typeof(value),'string');
        assert.equal(value.length,10);
        done(false);
        
    } catch (error) {

        done(error);
        
    }

}

unit['helpers.convertToJSON should return an object regardless of the parameter'] = function(done){

    try {

        let value = helpers.convertToJSON(10);

        assert.equal(typeof(value),'object');
        assert.ok(!(value instanceof Array));
        done(false);
        
    } catch (error) {

        done(error);
        
    }

}

unit['data.list should return a false error and an array'] = function(done){

    _data.list('users',(error,fileNames)=>{

        try {

            assert.ok(!error);
            assert.ok(Array.isArray(fileNames));

            done(false);
            
        } catch (e) {
            
            done(e);

        }


    });

}


module.exports = unit;
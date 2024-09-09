// Unit Tests

let assert = require('assert');
let helpers = require('./../lib/helpers');

let unit = {}

unit['helpers.getRandomToken should return a string of specified length'] = function(done){

    let value = helpers.getRandomToken(10);
    assert.equal(typeof(value),'string');
    assert.equal(value.length,10);
    done();

}

unit['helpers.convertToJSON should return an object regardless of the parameter'] = function(done){

    let value = helpers.convertToJSON(10);

    assert.equal(typeof(value),'object');
    assert.ok(!(value instanceof Array));
    done();

}


module.exports = unit;
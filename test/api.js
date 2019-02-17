/*
 * API tests
 *
 */

// Dependencies
const app = require("./../index");
const assert = require("assert");
const http = require("http");
const config = require("./../lib/config");

// Holder for Tests
const api = {};

// Helpers
const helpers = {};
helpers.makeGetRequest = function(path, callback) {
  // Configure the request details
  const requestDetails = {
    protocol: "http:",
    hostname: "localhost",
    port: config.httpPort,
    method: "GET",
    path: path,
    headers: {
      "Content-Type": "application/json"
    }
  };

  // Send the request
  const req = http.request(requestDetails, function(res) {
    callback(res);
  });
  req.end();
};

// The main init() function should be able to run without throwing.
api["app.init should start without throwing"] = function(done) {
  assert.doesNotThrow(function() {
    app.init(function(err) {
      done();
    });
  }, TypeError);
};

// Make request to /ping

api['/ping should respond to GET with 200'] = function(done){
  helpers.makeGetRequest('/api/ping',function(res){
    assert.equal(res.statusCode,200);
    done();
  });
};

// Make a request to /api/users
api['/api/users should respond to GET with 400'] = function(done){
  helpers.makeGetRequest('/api/users',function(res){
    assert.equal(res.statusCode,400);
    done();
  });
};

// Make a request to a random path
api['A random path should respond to GET with 404'] = function(done){
  helpers.makeGetRequest('/this/path/shouldnt/exist',function(res){
    assert.equal(res.statusCode,404);
    done();
  });
};

// Export
module.exports = api;

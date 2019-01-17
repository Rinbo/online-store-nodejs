/*
 * Request Handlers
 *
 */

// Instantiate request handlers object
const handlers = {};

// Define the ping handler
handlers.ping = function(data, callback) {
  callback(200);
};

// Define noFound handler
handlers.notFound = function(data, callback) {
  callback(404);
};

// Define users handler
handlers.users = function(data, callback) {
  callback(200);
};

module.exports = handlers;

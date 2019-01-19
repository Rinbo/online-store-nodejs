/*
 * Request Handlers
 *
 */

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");
const config = require("./config");

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
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all users CRUD actions
handlers._users = {};

// Users - post
// Required data: firstName, lastName, email, password, streetAddress
// Optional data: none
handlers._users.post = function(data, callback) {
  // Check that all required fields are filled out
  const firstName =  
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 0 &&
    data.payload.email.indexOf("@") > -1
      ? data.payload.email.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  const streetAddress =
    typeof data.payload.streetAddress == "string" &&
    data.payload.streetAddress.trim().length > 0
      ? data.payload.streetAddress.trim()
      : false;

  if (firstName && lastName && email && password && streetAddress) {
    // Check to make sure that the user does not already exist
    _data.read("users", email, function(err, data) {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          const userObject = {
            firstName,
            lastName,
            email,
            hashedPassword,
            streetAddress
          };

          // Create the user object
          _data.create("users", email, userObject, function(err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: "Could not create the user" });
            }
          });
        } else {
          console.log(firstName)
          callback(500, { Error: "Could not hash the user's password." });
        }
      } else {
        // User already exists
        callback(400, {
          Error: "A user with that email address already exists"
        });
      }
    });
  } else {
    callback(400, { Error: "There is an error with one of your input fields. Check spelling etc and make sure to provide all the required fields." });
  }
};

module.exports = handlers;

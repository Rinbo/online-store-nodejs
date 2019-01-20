/*
 * Request Handlers
 *
 */

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");

// Instantiate request handlers object
const handlers = {};

// Define the ping handler
handlers.ping = function(data, callback) {
  callback(200);
};

// Define noFound handler
handlers.notFound = function(data, callback) {
  callback(404, { Error: "Handler not found!" });
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
          console.log(firstName);
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
    callback(400, {
      Error:
        "There is an error with one of your input fields. Check spelling etc and make sure to provide all the required fields."
    });
  }
};

// Get action
// Required data: email
// Optional data: none

handlers._users.get = function(data, callback) {
  // Validate email param
  const email =
    typeof data.queryStringObject.email == "string" &&
    data.queryStringObject.email.trim().length > 0 &&
    data.queryStringObject.email.trim().indexOf("@") > -1
      ? data.queryStringObject.email.trim()
      : false;
  if (email) {
    // @TODO check for token first
    _data.read("users", email, function(err, data) {
      if (!err && data) {
        // Remove hashedPassword before sending back user object
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404, {
          Error: "Could not open that users file or it does not exist"
        });
      }
    });
  } else {
    callback(
      400,
      "Something is wrong with that email address. Check it and try again"
    );
  }
};

// Update action
// Required fields: email
// Optional fields: All the rest

handlers._users.put = function(data, callback) {
  // Validate fields
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

  // First check that we have an email address
  if (email) {
    // Check to see if there is anything to update
    if (firstName || lastName || password || streetAddress) {
      // @TODO Check for token

      // Look up the user
      _data.read("users", email, function(err, userData) {
        if (!err && userData) {
          // Update the provided fields
          if (userData.firstName) {
            userData.firstName = firstName;
          }

          if (userData.lastName) {
            userData.lastName = lastName;
          }

          if (userData.password) {
            userData.hashedPassword = helpers.hash(password);
          }

          if (userData.streetAddress) {
            userData.streetAddress = streetAddress;
          }

          // Update the new values
          _data.update("users", email, userData, function(err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: "Error updating user. Sorry." });
            }
          });
        } else {
          callback(404, { Error: "Could not find that user" });
        }
      });
    } else {
      callback(400, { Error: "Dude, nothing to update" });
    }
  } else {
    callback(400, {
      Error: "Missing email address or it is miss-spelled or something"
    });
  }
};

// Destroy action
// Require field: email

handlers._users.delete = function(data, callback) {
  // Validate params
  const email =
    typeof data.queryStringObject.email == "string" &&
    data.queryStringObject.email.trim().length > 0 &&
    data.queryStringObject.email.trim().indexOf("@") > -1
      ? data.queryStringObject.email.trim()
      : false;

  if (email) {
    // @TODO Add token validation

    // Look up the user
    _data.read("users", email, function(err, data) {
      if (!err && data) {
        _data.delete("users", email, function(err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Could not delete the user" });
          }
        });
      } else {
        callback(400, { Error: "Error reading the user" });
      }
    });
  } else {
    callback(400, {
      Error:
        "Something is wrong with your input. Did you spell your email address correctly?"
    });
  }
};

// Function to divert tokens call to the proper CRUD action
handlers.tokens = function(data, callback) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Instantiate tokens helper object
handlers._tokens = {};

// POST token
// Required data: email, password
// Optional data: none

handlers._tokens.post = function(data, callback) {
  // Validate request parameters
  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 0 &&
    data.payload.email.trim().indexOf("@") > -1
      ? data.payload.email.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  if (email && password) {
    // Look up the user who matches the provided email
    _data.read("users", email, function(err, userData) {
      if (!err && userData) {
        // Hash the sent password, and compare it to the password stored in the user object
        if (helpers.hash(password) == userData.hashedPassword) {
          // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
          const tokenId = helpers.generateRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;

          // Define tokenObject to save to file
          const tokenObject = {
            email,
            id: tokenId,
            expires
          };

          // Attempt to save it to file
          _data.create("tokens", tokenId, tokenObject, function(err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: "Could not save to file :(" });
            }
          });
        } else {
          callback(400, {
            Error: "The password provided did not match the users password"
          });
        }
      } else {
        callback(400, "Could not find a user with that email");
      }
    });
  } else {
    callback(400, "Missing required fields");
  }
};

// GET token
// Required data: id
// Optional data: none
handlers._tokens.get = function(data, callback) {
  // Validate input
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // Try to look up this id
    _data.read("tokens", id, function(err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(400, { Error: "Error reading this token. Does it exist?" });
      }
    });
  } else {
    callback(400, { Error: "Token is falsey in some way. Check your input" });
  }
};

// UPDATE token
// Required data: id, extend
handlers._tokens.put = function(data, callback) {
  // Validate input
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  const extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? true
      : false;
  if (id && extend) {
    // Attempt to read the file associated with the provided id
    _data.read("tokens", id, function(err, tokenData) {
      if (!err && tokenData) {
        // Extend the expirey date if it is not outside bounds
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Attempt to update the token object
          _data.update("tokens", id, tokenData, function(err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                Error:
                  "Unable to update the token object with the new expiry date :("
              });
            }
          });
        } else {
          callback(401, {
            Error: "The expiration time of this token has been blown"
          });
        }
      } else {
        callback(400, {
          Error: "Could not find a token with that id. Does it exist?"
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required inputs or they were falsey" });
  }
};

// DELETE tokens
// Required data: id
// Optional data: none

handlers._tokens.delete = function(data, callback) {
  // Validate input
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  if (id) {
    // Attempt to read the token object
    _data.read("tokens", id, function(err, tokenData) {
      if (!err && tokenData) {
        // Attempt to delete the object
        _data.delete("tokens", id, function(err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Unable to delete the token. Sorry :(" });
          }
        });
      } else {
        callback(400, {
          Error: "Unable to open this token object. Maybe it doesn't exist?"
        });
      }
    });
  } else {
    callback(400, { Error: "Check your input. Is the token format valid?" });
  }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, email, callback) {
  // Attempt to read the token
  _data.read("tokens", id, function(err, tokenData) {
    if (!err && tokenData) {
      // Check that the token is for the given user and that it has not expired
      if (tokenData.email == email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

module.exports = handlers;

/*
 * Request Handlers
 *
 */

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");
const menu = require("./menu");

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
    // Get token from headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // Validate the token
    handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
      if (tokenIsValid) {
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
        callback(403, {
          Error: "The token is invalid or it is missing in header"
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
      // Lookup the token in the headers
      const token =
        typeof data.headers.token == "string" && data.headers.token.length == 20
          ? data.headers.token
          : false;

      // Verify the token for this user
      handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
        if (tokenIsValid) {
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
          callback(403, {
            Error: "Token is invalid or it is missing in the headers"
          });
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
    // Get token from headers
    const token =
      typeof data.headers.token == "string" && data.headers.token.length == 20
        ? data.headers.token
        : false;

    // Verify this token for the given user
    handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
      if (tokenIsValid) {
        // Look up the user
        _data.read("users", email, function(err, userData) {
          if (!err && userData) {
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
        callback(403, { Error: "Token is invalid or missing in headers" });
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

// Instantiate the menu handler
handlers.menu = function(data, callback) {
  const acceptableMethods = ["get"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._menu[data.method](data, callback);
  } else {
    callback(405, {
      Error: "The only acceptable method for this route is GET"
    });
  }
};

// Instantiate the menu CRUD action object (only get in this case)
handlers._menu = {};

// GEt menu
// Required data - email and token
handlers._menu.get = function(data, callback) {
  // Validate email field
  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 0 &&
    data.payload.email.trim().indexOf("@") > -1
      ? data.payload.email.trim()
      : false;
  if (email) {
    // Get token from headers
    const token =
      typeof data.headers.token == "string" && data.headers.token.length == 20
        ? data.headers.token
        : false;

    // Verify the token for this email address
    handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
      if (tokenIsValid) {
        callback(200, menu);
      } else {
        callback(403, { Error: "Token is invalid or missing in headers" });
      }
    });
  } else {
    callback(400, { Error: "Check the spelling of the email address" });
  }
};

// Declare the carts handler and route it to proper CRUD action
handlers.carts = function(data, callback) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._carts[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Declare the carts CRUD actions helper object
handlers._carts = {};

// Determine the number of pizzas on the menu
const numberOfPizzaTypes = Object.values(menu).length;

// CREATE carts
// Required data: email
// Optional data: pizzas, amounts
// Required header: token
handlers._carts.post = function(data, callback) {
  // Instantiate and validate email, and check if there are pizzas and how many
  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 0 &&
    data.payload.email.trim().indexOf("@") > -1
      ? data.payload.email.trim()
      : false;
  let pizzas =
    typeof data.payload.pizzas == "object" &&
    data.payload.pizzas instanceof Array &&
    data.payload.pizzas.length > 0 &&
    Math.max.apply(null, data.payload.pizzas) <= numberOfPizzaTypes
      ? data.payload.pizzas
      : false;
  let amounts =
    typeof data.payload.amounts == "object" &&
    data.payload.amounts instanceof Array &&
    data.payload.amounts.length > 0
      ? data.payload.amounts
      : false;

  if (email) {
    // Check that nothing is wrong with the pizza input
    if (pizzas && amounts) {
      // Get token from headers
      const token =
        typeof data.headers.token == "string" && data.headers.token.length == 20
          ? data.headers.token
          : false;

      // Verify the token
      handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
        if (tokenIsValid) {
          // Create an Id for the carts file
          const cartId = helpers.generateRandomString(20);

          // If the number of diffrent pizza type doesn't have a corresponding amount default them to zero
          if (pizzas.length !== amounts.length) {
            pizzas = [];
            amounts = [];
          }

          // Make a cart object
          const cartData = {
            email,
            pizzas,
            amounts
          };

          // Attempt to Create a cart
          _data.create("carts", cartId, cartData, function(err) {
            if (!err) {
              // Get an instance of that users data object to store an active cart
              _data.read("users", email, function(err, userData) {
                if (!err && userData) {
                  // Store the cartId in the user object
                  userData.activeCart = cartId;
                  _data.update("users", email, userData, function(err) {
                    if (!err) {
                      callback(200, cartData);
                    } else {
                      callback(500, { Error: "Faild to save the user data" });
                    }
                  });
                } else {
                  callback(400, {
                    Error: "Unable to find a user with this email"
                  });
                }
              });
            } else {
              callback(500, { Error: "Could not create the cart" });
            }
          });
        } else {
          callback(403, { Error: "Token is invalid or it missing in headers" });
        }
      });
    } else {
      callback(400, {
        Error:
          "Something is wrong with your pizza inputs. Make sure you picked a pizza from the menu"
      });
    }
  } else {
    callback(400, {
      Error: "Missing required field. Did you provide an email addres?"
    });
  }
};

// GET carts
// Required data: email
// Required header: token

handlers._carts.get = function(data, callback) {
  // Validate email
  const email =
    typeof data.queryStringObject.email == "string" &&
    data.queryStringObject.email.trim().length > 0 &&
    data.queryStringObject.email.trim().indexOf("@") > -1
      ? data.queryStringObject.email.trim()
      : false;

  if (email) {
    // Get token from headers
    const token =
      typeof data.headers.token == "string" && data.headers.token.length == 20
        ? data.headers.token
        : false;
    // Verify the token for the given user
    handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
      if (tokenIsValid) {
        // Attempt get the userdata to find if there is an active cart
        _data.read("users", email, function(err, userData) {
          if (!err && userData) {
            // Get activeCart from the user object and try to open that cart
            const activeCart =
              typeof userData.activeCart == "string" &&
              userData.activeCart.trim().length > 0
                ? userData.activeCart.trim()
                : false;
            if (activeCart) {
              // Open the active cart and get its data
              _data.read("carts", activeCart, function(err, cartData) {
                if (!err && cartData) {
                  callback(200, cartData);
                } else {
                  callback(500, { Error: "Unable to open the cart :(" });
                }
              });
            } else {
              callback(400, {
                Error: "There are no active carts for this user"
              });
            }
          } else {
            callback(400, { Error: "Unable to find a user with that email" });
          }
        });
      } else {
        callback(403, { Error: "Token is invalid or missing from headers" });
      }
    });
  } else {
    callback(400, { Error: "Check your input for spelling mistakes" });
  }
};

// PUT carts
// Required fields: email, pizzas, amounts
// Required headers: token

handlers._carts.put = function(data, callback) {
  // Validations
  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 0 &&
    data.payload.email.trim().indexOf("@") > -1
      ? data.payload.email.trim()
      : false;
  let pizzas =
    typeof data.payload.pizzas == "object" &&
    data.payload.pizzas instanceof Array &&
    data.payload.pizzas.length > 0 &&
    Math.max.apply(null, data.payload.pizzas) <= numberOfPizzaTypes
      ? data.payload.pizzas
      : false;
  let amounts =
    typeof data.payload.amounts == "object" &&
    data.payload.amounts instanceof Array &&
    data.payload.amounts.length > 0
      ? data.payload.amounts
      : false;
  if (email) {
    if (pizzas && amounts && pizzas.length == amounts.length) {
      // Get token from headers
      const token =
        typeof data.headers.token == "string" && data.headers.token.length == 20
          ? data.headers.token
          : false;
      // Verify the token for the given user
      handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
        if (tokenIsValid) {
          // Open user object to see if there is an active cart
          _data.read("users", email, function(err, userData) {
            if (!err && userData) {
              // See if there is an active cart
              const activeCart =
                typeof userData.activeCart == "string" &&
                userData.activeCart.trim().length > 0
                  ? userData.activeCart.trim()
                  : false;
              if (activeCart) {
                // Open the cart and pull out the data
                _data.read("carts", activeCart, function(err, cartData) {
                  if (!err && cartData) {
                    // Store the updated values
                    cartData.pizzas = pizzas;
                    cartData.amounts = amounts;
                    _data.update("carts", activeCart, cartData, function(err) {
                      if (!err) {
                        callback(200, cartData);
                      } else {
                        callback(500, { Error: "Unable to save the cart :(" });
                      }
                    });
                  } else {
                    callback(500, {
                      Error: "Unable to open the cart for reading :("
                    });
                  }
                });
              } else {
                callback(404, {
                  Error: "There is no active cart for this user"
                });
              }
            } else {
              callback(500, {
                Error: "Unable to read from the user data. Sorry :("
              });
            }
          });
        } else {
          callback(403, {
            Error: "Invalid token or token missing from headers"
          });
        }
      });
    } else {
      callback(400, {
        Error:
          "There is nothing to update or you did not specify an amount for each pizza"
      });
    }
  } else {
    callback(400, {
      Error:
        "Something appears to be wrong with the way you entered your email. Check it please"
    });
  }
};

// DELETE carts
// Required data: email
// Required header: token

handlers._carts.delete = function(data, callback) {
  // Validations
  const email =
    typeof data.queryStringObject.email == "string" &&
    data.queryStringObject.email.trim().length > 0 &&
    data.queryStringObject.email.trim().indexOf("@") > -1
      ? data.queryStringObject.email.trim()
      : false;

  if (email) {
    // Get token from headers
    const token =
      typeof data.headers.token == "string" && data.headers.token.length == 20
        ? data.headers.token
        : false;
    // Verify the token for the given user
    handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
      if (tokenIsValid) {
        // Open the user object
        _data.read("users", email, function(err, userData) {
          if (!err && userData) {
            // Pull out the active cart
            const activeCart =
              typeof userData.activeCart == "string" &&
              userData.activeCart.trim().length > 0
                ? userData.activeCart.trim()
                : false;
            if (activeCart) {
              // Attempt to delete the cart
              _data.delete("carts", activeCart, function(err) {
                if (!err) {
                  // Delete the active Cart from the user object
                  userData.activeCart = "";

                  // Update the user object
                  _data.update("users", email, userData, function(err) {
                    if (!err) {
                      callback(200);
                    } else {
                      callback(500, { Error: "Unable to update the user" });
                    }
                  });
                } else {
                  callback(500, { Error: "Sorry, could not delete the cart" });
                }
              });
            } else {
              callback(400, {
                Error: "There was no active cart for this user"
              });
            }
          } else {
            callback(400, { Error: "Sorry, couldn't read from that user" });
          }
        });
      } else {
        callback(403, {
          Error: "Invalid token or it is missing from the headers"
        });
      }
    });
  } else {
    callback(400, { Error: "Something is wrong with your email mate" });
  }
};

// Order Handler

handlers.order = function(data, callback) {
  const acceptableMethods = ["post"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._order[data.method](data, callback);
  } else {
    callback(405, { Error: "Cant't do that friend" });
  }
};

// Order handler helper function

handlers._order = {};

// POST order
// required data: email, cardToken
// optional data: description

handlers._order.post = function(data, callback) {
  // Validations - only acccepting visa and mastercard
  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 0 &&
    data.payload.email.trim().indexOf("@") > -1
      ? data.payload.email.trim()
      : false;
  const cardToken =
    typeof data.payload.cardToken == "string" &&
    ["tok_visa", "tok_mastercard"].indexOf(data.payload.cardToken) > -1
      ? data.payload.cardToken.trim()
      : false;
  const description =
    typeof data.payload.description == "string"
      ? data.payload.description.trim()
      : "";

  if (email && cardToken) {
    // Get token from headers
    const token =
      typeof data.headers.token == "string" && data.headers.token.length == 20
        ? data.headers.token
        : false;
    // Verify the token for the given user
    handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
      if (tokenIsValid) {
        // Get the user object
        _data.read("users", email, function(err, userData) {
          if (!err && userData) {
            // See if there is an active cart
            const activeCart =
              typeof userData.activeCart == "string" &&
              userData.activeCart.trim().length > 0
                ? userData.activeCart.trim()
                : false;
            if (activeCart) {
              // Read from the cart
              _data.read("carts", activeCart, function(err, cartData) {
                if (!err && cartData) {
                  // Place an calculate the price
                  helpers.calculatePrice(cartData, function(price) {
                    if (typeof price == "number") {
                      // Place order
                      helpers.makePayment(
                        cardToken,
                        price,
                        description,
                        function(err) {
                          if (!err) {
                            callback(200, {
                              response: `Success! Order placed for a total amount of ${price /
                                100} USD`
                            });
                            // TODO: Email receipt
                          } else {
                            callback(500, { Error: err });
                          }
                        }
                      );
                    } else {
                      // Couldn't calculate price
                      callback(500, { Error: "Could not calculate the price" });
                    }
                  });
                } else {
                  callback(500, { Error: "Could not read from the cart :(" });
                }
              });
            } else {
              callback(400, {
                Error: "There is no active cart dude. Gotta add some pizzas!"
              });
            }
          } else {
            callback(400, {
              Error: "Error error! Could not read from the user object"
            });
          }
        });
      } else {
        callback(403, {
          Error: "Invalid token or it might be missing from the headers"
        });
      }
    });
  } else {
    callback(400, {
      Error: "That did not work. Perhaps you miss-spelled your email address?"
    });
  }
};

module.exports = handlers;

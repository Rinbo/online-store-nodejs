// File containing helper functions

// Dependencies
const crypto = require("crypto");
const config = require("./config");
const https = require("https");
const querystring = require("querystring");
const menu = require("./menu");

const helpers = {};

helpers.parseJsonToObject = function(str) {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (err) {
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = function(str) {
  if (typeof str == "string" && str.length > 0) {
    const hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

helpers.generateRandomString = function(strLength) {
  strLength = typeof strLength == "number" && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define which characters are valid for the string
    const validChars = "abcdefghijklmnopqrstuvwxyz0123456789";

    // Initiate a new string and randomize strLength characters
    let str = "";
    for (i = 1; i <= strLength; i++) {
      let randomChar =
        validChars[Math.floor(Math.random() * validChars.length)];
      str += randomChar;
    }
    return str;
  } else {
    return false;
  }
};

helpers.makePayment = function(source, amount, description, callback) {
  amount = typeof amount == "number" && amount > 50 ? amount : false;
  source =
    typeof source == "string" &&
    source.trim().length > 0 &&
    ["tok_visa", "tok_mastercard"].indexOf(source) > -1
      ? source.trim()
      : false;
  description =
    typeof description == "string" && description.trim().length > 0
      ? description.trim()
      : "";

  if (amount && source && description) {
    // Configure the request payload
    // NOTE: Amount is in cents!
    const payload = {
      amount,
      currency: "usd",
      source,
      description
    };
    const stringPayload = querystring.stringify(payload);

    // Configure the request details
    const requestDetails = {
      protocol: "https:",
      hostname: "api.stripe.com",
      method: "POST",
      path: "/v1/charges",
      auth: config.stripe.key,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload)
      }
    };

    // Instantiate the request object
    const req = https.request(requestDetails, function(res) {
      // Grab the status of the sent request
      var status = res.statusCode;
      // Callback successfully if the request went through
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback("Status code returned was " + status);
      }
    });

    // Bind to the error event so it doesn't get thrown
    req.on("error", function(e) {
      callback(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();
  } else {
    callback(
      "Could not make a stripe post request. Something is wrong with the input fields."
    );
  }
};

// Calculate price of cart contents in cents

helpers.calculatePrice = function(cartData, callback) {
  const { pizzas, amounts } = cartData;
  let price = 0;
  if (pizzas && amounts) {
    pizzas.forEach(
      (pizza, index) => (price += menu[pizza].price * amounts[index] * 100)
    );
    callback(price);
  } else {
    callback("Could not calculate price");
  }
};

module.exports = helpers;

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

// Send mail function

helpers.sendReceipt = function(cartData, price, callback) {
  // Validations
  price = typeof price == "number" && price > 0.5 ? price : false;
  const email =
    typeof cartData.email == "string" &&
    cartData.email.trim().length > 0 &&
    cartData.email.trim().indexOf("@") > -1
      ? cartData.email.trim()
      : false;
  pizzas =
    typeof cartData.pizzas == "object" &&
    cartData.pizzas instanceof Array &&
    cartData.pizzas.length > 0
      ? cartData.pizzas
      : false;
  amounts =
    typeof cartData.amounts == "object" &&
    cartData.pizzas instanceof Array &&
    cartData.amounts.length > 0
      ? cartData.amounts
      : false;

  if (email && price && pizzas && amounts) {
    // Configure the request payload
    // NOTE: Amount is in cents!

    //componse the message to be sent
    let message = "You have made an order for: \r\n ";
    pizzas.forEach((pizza, index) => {
      message += `${amounts[index]} ${menu[pizza].name} at a price of ${
        menu[pizza].price
      } USD each \r\n `;
    });
    // Cap it off
    message +=
      "Your pizzas will arrive in less than 30 minutes. Thank you for ordering from us!";

    const payload = {
      from:
        "Mailgun Sandbox <postmaster@sandbox60664471b66b4ed785a5b3be8f19414b.mailgun.org>",
      to: email,
      subject: "Your pizzas are on their way!",
      text: message
    };
    const stringPayload = querystring.stringify(payload);

    // Configure the request details
    const requestDetails = {
      protocol: "https:",
      hostname: "api.mailgun.net",
      method: "POST",
      path: "/v3/sandbox60664471b66b4ed785a5b3be8f19414b.mailgun.org/messages",
      auth: "api:" + config.mailgun.key,
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
    callback("Unable to send mail. Something is wrong with the input fields.");
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

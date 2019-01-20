// File containing helper functions

// Dependencies
const crypto = require("crypto");
const config = require("./config");

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

module.exports = helpers;

/*
 * Library for storing and editing data
 *
 */

// Dependencies
var fs = require("fs");
var path = require("path");

// Container for module
const lib = {};

lib.baseDir = path.join(__dirname, "/../.data");

// Export lib object
module.exports = lib;

// Write data to file
lib.create = function(dir, file, data, callback) {
  // Open file for writing
  fs.open(`${lib.baseDir}/${dir}/${file}.json`, "wx", function(
    err,
    fileDesciptor
  ) {
    if (!err && fileDesciptor) {
      // Stringify data
      const stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDesciptor, stringData, function(err) {
        if (!err) {
          fs.close(fileDesciptor, function(err) {
            if (!err) {
              callback(false);
            } else {
              callback("Could not close the file");
            }
          });
        } else {
          callback("Error writing to file");
        }
      });
    } else {
      callback("Could not create a new file. Might it already exist?");
    }
  });
};

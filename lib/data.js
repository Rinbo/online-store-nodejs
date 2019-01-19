/*
 * Library for storing and editing data
 *
 */

// Dependencies
const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");

// Container for module
const lib = {};

lib.baseDir = path.join(__dirname, "/../.data");

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

// Read data from a file
lib.read = function(dir, file, callback) {
  fs.readFile(`${lib.baseDir}/${dir}/${file}.json`, "utf8", function(
    err,
    data
  ) {
    if (!err && data) {
      const parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else callback(err, data);
  });
};

// Update a file with new data
lib.update = function(dir, file, data, callback) {
  // Open file for writing
  fs.open(`${lib.baseDir}/${dir}/${file}.json`, "r+", function(
    err,
    fileDesciptor
  ) {
    if (!err && fileDesciptor) {
      // Convert data to string
      const stringData = JSON.stringify(data);

      // Truncate the file
      fs.ftruncate(fileDesciptor, function(err) {
        if (!err) {
          fs.writeFile(fileDesciptor, stringData, function(err) {
            if (!err) {
              fs.close(fileDesciptor, function(err) {
                if (!err) {
                  callback(false);
                } else {
                  callback("Error closing the file");
                }
              });
            } else {
              callback("Could not write to file");
            }
          });
        } else {
          callback("Error truncating the file");
        }
      });
    } else {
      callback("Could not open the file for updating, it may not exist");
    }
  });
};

lib.delete = function(dir, file, callback) {
  // Unlink the file from the filesystem
  fs.unlink(`${lib.baseDir}/${dir}/${file}.json`, function(err) {
    callback(err);
  });
};

lib.list = function(dir, callback) {
  fs.readdir(`${lib.baseDir}/${dir}/`, function(err, data) {
    if (!err && data && data.length > 0) {
      const trimmedFileNames = [];
      data.forEach(fileName => {
        trimmedFileNames.push(fileName.replace(".json", ""));
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
};

// Export lib object
module.exports = lib;

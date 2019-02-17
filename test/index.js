/*
 * Test runner
 *
 */

// Override the NODE_ENV variable
process.env.NODE_ENV = "testing";

// Logic for testrunner
_app = {};

// Container for the tests

_app.tests = {};

// Add the unit tests
_app.tests.unit = require("./unit");
_app.tests.api = require("./api");

// Count all  the tests
_app.countTests = function() {
  let counter = 0;
  for (let key in _app.tests) {
    if (_app.tests.hasOwnProperty(key)) {
      const subTests = _app.tests[key];
      for (let testName in subTests) {
        if (subTests.hasOwnProperty(testName)) {
          counter++;
        }
      }
    }
  }
  return counter;
};

// Run all the tests collecting the errors and successes
_app.runTests = function() {
  const errors = [];
  let successes = 0;
  const limit = _app.countTests();
  var counter = 0;
  for (let key in _app.tests) {
    if (_app.tests.hasOwnProperty(key)) {
      const subTests = _app.tests[key];
      for (let testName in subTests) {
        if (subTests.hasOwnProperty(testName)) {
          (function() {
            let tmpTestName = testName;
            let testValue = subTests[testName];
            // call the test
            try {
              testValue(function() {
                // If it calls back without trowing then i succeeded, so log it in greend
                console.log("\x1b[32m%s\x1b[0m", tmpTestName);
                counter++;
                successes++;
                if (counter == limit) {
                  _app.produceTestReport(limit, successes, errors);
                }
              });
            } catch (e) {
              // if it throws then it failed, so capture the error thronw and log it in red
              errors.push({
                name: testName,
                error: e
              });
              console.log("\x1b[31m%s\x1b[0m", tmpTestName);
              counter++;
              if (counter == limit) {
                _app.produceTestReport(limit, successes, errors);
              }
            }
          })();
        }
      }
    }
  }
};

// Producee a test outcome report
_app.produceTestReport = function(limit, successes, errors) {
  console.log("");
  console.log("----------BEGIN TEST REPORT----------");
  console.log("");
  console.log("Total Tests: ", limit);
  console.log("pass: ", successes);
  console.log("Fail ", errors.length);
  console.log("");

  // if there are errors print them in detail
  if (errors.length > 0) {
    console.log("----------BEGIN ERROR DETAILS----------");
    errors.forEach(testError => {
      console.log("\x1b[31m%s\x1b[0m", testError.name);
      console.log(testError.error);
      console.log("");
    });
    console.log("----------END ERROR DETAILS----------");
  }
  console.log("");
  console.log("----------END TEST REPORT----------");
  process.exit(0);
};

// Run the test

_app.runTests();

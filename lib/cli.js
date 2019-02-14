/*
 * CLI tasks
 *
 */

// Dependencies
const readline = require("readline");
const util = require("util");
const debug = util.debuglog("cli");
const events = require("events");
class _events extends events {}
const e = new _events();
const os = require("os");
const v8 = require("v8");
const _data = require("./data");
const helpers = require("./helpers");
const menu = require("./menu");

// Instantiate the cli module object
const cli = {};

// Input handlers
e.on("man", function(str) {
  cli.responders.help();
});

e.on("help", function(str) {
  cli.responders.help();
});

e.on("exit", function(str) {
  cli.responders.exit();
});

e.on("menu", function(str) {
  cli.responders.menu();
});

e.on("stats", function(str) {
  cli.responders.stats();
});

e.on("list recent orders", function(str) {
  cli.responders.recentOrders();
});

e.on("more order info", function(str) {
  cli.responders.moreOrderInfo(str);
});

e.on("list new users", function(str) {
  cli.responders.listNewUsers();
});

e.on("list user", function(str) {
  cli.responders.listUser(str);
});

// Responders object
cli.responders = {};

// Help / Man
cli.responders.help = function() {
  // Codify the commands and their explanations
  const commands = {
    exit: "Kill the CLI (and the rest of the application)",
    man: "Show this help page",
    help: 'Alias of the "man" command',
    menu: "List the current menu",
    stats:
      "Get statistics on the underlying operating system and resource utilization",
    "List recent orders":
      "Show a list of the orders that have been placed in the last 24 hours",
    "More order info --{orderId}": "Show details for a specific order",
    "List new users":
      "Show a list of users that signed up in the last 24 hours",
    "Kist user --{email}": "Show details of a specified user"
  };

  // Show a header for the help page that is as wide as the screen
  cli.horizontalLine();
  cli.centered("CLI MANUAL");
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Show each command, followed by its explanation, in white and yellow respectively
  for (var key in commands) {
    if (commands.hasOwnProperty(key)) {
      var value = commands[key];
      var line = "      \x1b[33m " + key + "      \x1b[0m";
      var padding = 60 - line.length;
      for (i = 0; i < padding; i++) {
        line += " ";
      }
      line += value;
      console.log(line);
      cli.verticalSpace();
    }
  }
  cli.verticalSpace(1);

  // End with another horizontal line
  cli.horizontalLine();
};

// Create a vertical space
cli.verticalSpace = function(lines) {
  lines = typeof lines == "number" && lines > 0 ? lines : 1;
  for (i = 0; i < lines; i++) {
    console.log("");
  }
};

// Create a horizontal line across the screen
cli.horizontalLine = function() {
  // Get the available screen size
  const width = process.stdout.columns;

  // Put in enough dashes to go across the screen
  let line = "";
  for (i = 0; i < width; i++) {
    line += "-";
  }
  console.log(line);
};

// Create centered text on the screen
cli.centered = function(str) {
  str = typeof str == "string" && str.trim().length > 0 ? str.trim() : "";

  // Get the available screen size
  const width = process.stdout.columns;

  // Calculate the left padding there should be
  const leftPadding = Math.floor((width - str.length) / 2);

  // Put in left padded spaces before the string itself
  let line = "";
  for (i = 0; i < leftPadding; i++) {
    line += " ";
  }
  line += str;
  console.log(line);
};

// Exit
cli.responders.exit = function() {
  process.exit(0);
};

// Stats
cli.responders.stats = function() {
  // Compile an object of stats
  const stats = {
    "Load Average": os.loadavg().join(" "),
    "CPU Count": os.cpus().length,
    "Free Memory": os.freemem(),
    "Current Malloced Memory": v8.getHeapStatistics().malloced_memory,
    "Peak Malloced Memory": v8.getHeapStatistics().peak_malloced_memory,
    "Allocated Heap Used (%)": Math.round(
      (v8.getHeapStatistics().used_heap_size /
        v8.getHeapStatistics().total_heap_size) *
        100
    ),
    "Available Heap Allocated (%)": Math.round(
      (v8.getHeapStatistics().total_heap_size /
        v8.getHeapStatistics().heap_size_limit) *
        100
    ),
    Uptime: os.uptime() + " Seconds"
  };

  // Create a header for the stats
  cli.horizontalLine();
  cli.centered("SYSTEM STATISTICS");
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Log out each stat
  for (let key in stats) {
    if (stats.hasOwnProperty(key)) {
      let value = stats[key];
      let line = "\x1b[33m " + key + "\x1b[0m";
      let padding = 60 - line.length;
      for (i = 0; i < padding; i++) {
        line += " ";
      }
      line += value;
      console.log(line);
      cli.verticalSpace();
    }
  }

  // Create a footer for the stats
  cli.verticalSpace();
  cli.horizontalLine();
};

// Menu
cli.responders.menu = function() {
  cli.horizontalLine();
  cli.centered("MENU");

  Object.values(menu).forEach(item => {
    let name = item.name;
    let price = `\x1b[33m $${item.price} \x1b[0m`;
    let padding = 40 - name.length;
    for (i = 0; i < padding; i++) {
      name += " ";
    }
    name += price;
    console.log(name);
    cli.verticalSpace();
  });
};

// List orders
cli.responders.recentOrders = function() {
  _data.list("orders", function(err, orderIds) {
    if (!err && orderIds && orderIds.length > 0) {
      cli.verticalSpace();
      orderIds.forEach(function(userId) {
        _data.read("orders", userId, function(err, orderData) {
          if (!err && orderData) {
            const createdAt =
              typeof orderData.createdAt == "number" && orderData.createdAt > 0
                ? orderData.createdAt
                : 0;
            // Conditional for only picking orders that was created less than 24 hours ago
            if (createdAt > Date.now() - 3600 * 24 * 1000) {
              console.log(userId);
              cli.verticalSpace();
            }
          }
        });
      });
    }
  });
};

// Display all info for a given order
cli.responders.moreOrderInfo = function(str) {
  // Get ID from string
  const arr = str.split("--");
  const orderId =
    typeof arr[1] == "string" && arr[1].trim().length > 0
      ? arr[1].trim()
      : false;
  if (orderId) {
    // Lookup the order
    _data.read("orders", orderId, function(err, orderData) {
      if (!err && orderData) {
        // Print their JSON object with text highlighting
        cli.verticalSpace();
        console.dir(orderData, { colors: true });
        cli.verticalSpace();
      }
    });
  }
};

// List new users (last 24 hours)
cli.responders.listNewUsers = function() {
  _data.list("users", function(err, emails) {
    if (!err && emails && emails.length > 0) {
      cli.verticalSpace();
      emails.forEach(function(email) {
        _data.read("users", email, function(err, userData) {
          if (!err && userData) {
            const createdAt =
              typeof userData.createdAt == "number" && userData.createdAt > 0
                ? userData.createdAt
                : 0;

            // Conditional for only picking users that was created less than 24 hours ago
            if (createdAt > Date.now() - 3600 * 24 * 1000) {
              console.log(email);
              cli.verticalSpace();
            }
          }
        });
      });
    }
  });
};

// Display all info on a given user
cli.responders.listUser = function(str) {
  // Get ID from string
  const arr = str.split("--");
  const email =
    typeof arr[1] == "string" && arr[1].trim().length > 0
      ? arr[1].trim()
      : false;
  if (email) {
    // Lookup the user
    _data.read("users", email, function(err, userData) {
      if (!err && userData) {
        // Remove the hashed password
        delete userData.hashedPassword;

        // Print their JSON object with text highlighting
        cli.verticalSpace();
        console.dir(userData, { colors: true });
        cli.verticalSpace();
      }
    });
  }
};

// Input processor
cli.processInput = function(str) {
  str = typeof str == "string" && str.trim().length > 0 ? str.trim() : false;
  // Only process the input if the user actually wrote something, otherwise ignore it
  if (str) {
    // Codify the unique strings that identify the different unique questions allowed be the asked
    const uniqueInputs = [
      "man",
      "help",
      "exit",
      "menu",
      "stats",
      "list recent orders",
      "more order info",
      "list new users",
      "list user"
    ];

    // Go through the possible inputs, emit event when a match is found
    let matchFound = false;
    uniqueInputs.some(function(input) {
      if (str.toLowerCase().indexOf(input) > -1) {
        matchFound = true;
        // Emit event matching the unique input, and include the full string given
        e.emit(input, str);
        return true;
      }
    });

    // If no match is found, tell the user to try again
    if (!matchFound) {
      console.log("Sorry, try again");
    }
  }
};

// Init script
cli.init = function() {
  // Send to console, in gold
  console.log("\x1b[33m%s\x1b[0m", "The CLI is running");

  // Start the interface
  const _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ">> "
  });

  // Create an initial prompt
  _interface.prompt();

  // Handle each line of input separately
  _interface.on("line", function(str) {
    // Send to the input processor
    cli.processInput(str);

    // Re-initialize the prompt afterwards
    _interface.prompt();
  });

  // If the user stops the CLI, kill the associated process
  _interface.on("close", function() {
    process.exit(0);
  });
};

// Export the module
module.exports = cli;

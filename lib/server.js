/*
 * Server-related tasks
 *
 */

// Dependencies
const http = require("http");
const https = require("https");
const environment = require("./config");
const fs = require("fs");
const path = require("path");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const handlers = require("./handlers");
const helpers = require("./helpers");

// Instantiate the server module object
const server = {};

// Add https config file
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pem"))
};

// Instantiate HTTPS server
server.httpsServer = https.createServer(httpsOptions, function(req, res) {
  server.unifiedServer(req, res);
});

// Instantiate the HTTP server
server.httpServer = http.createServer(function(req, res) {
  server.unifiedServer(req, res);
});

// Create unifiedSever function that contains all the common server logic
server.unifiedServer = function(req, res) {
  // Parse the rul
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get the queryString as an object
  const queryStringObject = parsedUrl.query;

  // Get the HTTP method
  const method = req.method.toLowerCase();

  // Get the headers
  const headers = req.headers;

  // Get the payload
  const decoder = new StringDecoder("utf-8");
  let buffer = "";
  req.on("data", function(data) {
    buffer += decoder.write(data);
  });

  req.on("end", function() {
    buffer += decoder.end();

    // Check the router for a matching route in the url to send to a corresponding handler. If there is no match send it to the notFound handler
    const chosenHandler =
      typeof server.router[trimmedPath] !== "undefined"
        ? server.router[trimmedPath]
        : handlers.notFound;

    // Define the data object to send to the handler

    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer)
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, function(statusCode, payload) {
      // Use the status code of the given handler or default to 200
      statusCode = typeof statusCode == "number" ? statusCode : 200;

      // Use the payload returned from the handler or defualt to an empty object
      payload = typeof payload == "object" ? payload : {};

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader = ("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);

      // If the respone is 200 print green, otherwise print red

      if (statusCode == 200) {
        console.log(
          "\x1b[32m%s\x1b[0m",
          method.toUpperCase() + " /" + trimmedPath + " " + statusCode
        );
      } else {
        console.log(
          "\x1b[31m%s\x1b[0m",
          method.toUpperCase() + " /" + trimmedPath + " " + statusCode
        );
        console.log(payload);
      }
    });
  });
};

// Define the router

server.router = {
  users: handlers.users,
  ping: handlers.ping,
  tokens: handlers.tokens,
  menu: handlers.menu,
  carts: handlers.carts,
  posts: handlers.order
};

// Create the init function for the https and http servers and console log a message that the server is started
server.init = function() {
  server.httpServer.listen(environment.httpPort, function() {
    console.log(
      "\x1b[35m%s\x1b[0m",
      "The HTTP-sever is running on port " + environment.httpPort
    );
  });

  server.httpsServer.listen(environment.httpsPort, function() {
    console.log(
      "\x1b[36m%s\x1b[0m",
      "The HTTPS-server is running on port " + environment.httpsPort
    );
  });
};

module.exports = server;

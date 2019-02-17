/*
 * Create and export configuration variables
 *
 */

// Dependencies
const keys = require("./keys");

// Container for all environments
const environments = {};

environments.staging = {
  httpPort: 3000,
  httpsPort: 5000,
  envName: "staging",
  hashingSecret: "Zzzecret",
  stripe: {
    key: keys.stripe_secret_key
  },
  mailgun: {
    key: keys.mailgun
  },
  templateGlobals: {
    appName: "AwesomePizza",
    companyName: "AwesomePizzaCompany, Inc.",
    yearCreated: "2019",
    baseUrl: "http://localhost:3000/"
  }
};

environments.production = {
  httpPort: 3001,
  httpsPort: 5001,
  envName: "production",
  hashingSecret: "Zzzecret",
  stripe: {
    key: keys.stripe_secret_key
  },
  mailgun: {
    key: keys.mailgun
  },
  templateGlobals: {
    appName: "AwesomePizza",
    companyName: "AwesomePizzaCompany, Inc.",
    yearCreated: "2019",
    baseUrl: "http://localhost:5000/"
  }
};

// Testing environment

environments.staging = {
  httpPort: 4000,
  httpsPort: 4001,
  envName: "testing",
  hashingSecret: "Zzzecret",
  stripe: {
    key: keys.stripe_secret_key
  },
  mailgun: {
    key: keys.mailgun
  },
  templateGlobals: {
    appName: "AwesomePizza",
    companyName: "AwesomePizzaCompany, Inc.",
    yearCreated: "2019",
    baseUrl: "http://localhost:3000/"
  }
};

// Find out which enviroment was passed when starting up program
const currentEnvironment =
  typeof process.env.NODE_ENV == "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

// Default to staging if environemnt psssed does not match any of the ones defined above

const enviromentToExport =
  typeof environments[currentEnvironment] == "object"
    ? environments[currentEnvironment]
    : environments.staging;

// Export the correct environment
module.exports = enviromentToExport;

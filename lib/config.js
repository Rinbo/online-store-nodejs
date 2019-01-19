/*
 * Create and export configuration variables
 *
 */

// Container for all environments
const environments = {};

environments.staging = {
  httpPort: 3000,
  httpsPort: 5000,
  envName: "staging",
  hashingSecret: "Zzzecret"
};

environments.production = {
  httpPort: 3001,
  httpsPort: 5001,
  envName: "production",
  hashingSecret: "Zzzecret"
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

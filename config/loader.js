const Nconf = require("nconf");
const path = require("path");
const debug = require("debug");
const env = process.env.NODE_ENV || "development";

/**
 *
 * @param {object} options
 * @returns {Nconf.Provider}
 */
function loadNConf(options) {
  debug("config start");
  options = options || {};

  const baseConfigPath = options.baseConfigPath || __dirname;
  const nconf = new Nconf.Provider();

  // Load config
  //command line arguments take precedence, then environment variables
  nconf.argv();
  nconf.env({ separator: "_", parseValues: true });

  //Now load various config json files, for now we load our default config file
  nconf.file("defaults", path.join(baseConfigPath, "defaults.json"));

  //manually set env value
  nconf.set("env", env);

  //wrap this in a check, because nconf.get() is executed unnecessarily
  //To output this, use DEBUG=task-tacker:*, task-tacker-config
  if (debug.enabled("task-tracker-config")) {
    debug(nconf.get());
  }

  debug("config end");
  return nconf;
}

module.exports.loadNConf = loadNConf;

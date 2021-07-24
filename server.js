const config = require("./config");
const debug = require("debug")("server");
const errors = require("./errors");
const logging = require("pino")();
const moment = require("moment");
const stoppable = require("stoppable");

/**
 * @class TaskTrackerServer
 * @description Bootstraps our server and sets up everything before the server can start.
 */
class TaskTrackerServer {
  constructor() {
    this.rootApp = null;
    this.httpServer = null;

    //Expose config module for external use.
    this.config = config;

    //Tasks that should be run before the server exits.
    this.cleanupTasks = [];

    this.port = config.get("server").port;
    this.host = config.get("server").host;
    this.url = `http://${this.host}:${this.port}/v1/api`;
    this.env = config.get("env");

    this.messages = {
      cantTouchThis: "Can't touch this",
      taskTrackerIsRunning: "TaskTracker is running...",
      yourApiIsAvailableOn: `Your task tracker api is now available on ${this.url}`,
      ctrlCToShutDown: "Ctrl+C to shut down",
      taskTrackerIsRunningIn: `TaskTracker is running in ${this.env}...`,
      listeningOn: `Listening on: ${this.host}:${this.port}`,
      urlConfiguredAs: `Url configured as: ${this.url}`,
      taskTrackerIsShuttingDown: "TaskTracker is shutting down",
      taskTrackerHasShutdown: "TaskTracker has shut down",
      yourApiIsNowOffline: "Your API is now offline",
      taskTrackerWasRunningFor: "TaskTracker was running for",
      addressInUse: {
        error: "(EADDRINUSE) Cannot start TaskTracker.",
        context: `Port ${this.port} is already in use by another program.`,
        help: "Is another TaskTracker instance already running?",
      },
      otherError: {
        error: `(Code: ${this.errorNumber})`,
        context: "There was an error starting your server.",
        help: "Please use the error code above to search for a solution.",
      },
    };
  }

  /**
   * @name start - Public API Mehods
   * @description Starts the task-tracker server listening on the configured port.
   *              Requires an express app to be passed in.
   *
   * @param {Object} rootApp - Required express app instance.
   * @returns {Promise} Resolves once TaskTracker has started.
   */
  start(rootApp) {
    debug("Starting...");
    const self = this;
    self.rootApp = rootApp;

    return new Promise(function (resolve, reject) {
      self.httpServer = rootApp.listen(self.port, self.host);

      self.httpServer.on("error", function (error) {
        let taskTrackerError;

        if (error.code === "EADDRINUSE") {
          taskTrackerError = new errors.TaskTrackerError({
            message: self.messages.addressInUse.error,
            context: self.messages.addressInUse.context,
            help: self.messages.addressInUse.help,
          });
        } else {
          this.errorNumber = error.errno;
          taskTrackerError = new errors.TaskTrackerError({
            message: self.messages.otherError.error,
            context: self.messages.otherError.context,
            help: self.messages.otherError.help,
          });
        }
        debug("Server started (error)");
        return reject(taskTrackerError);
      });

      self.httpServer.on("listening", function () {
        debug("...Started");
        self._logStartMessages();

        // Debug logs output in testmode only
        if (config.get("server:testmode")) {
          self._startTestMode();
        }

        debug("Server ready (success)");
        return resolve(self);
      });

      stoppable(self.httpServer, config.get("server:shutdownTimeout"));

      //Ensure that task tracker exists correctly on Ctrl+C and
      process
        .removeAllListeners("SIGINT")
        .on("SIGINT", self.shutdown.bind(self))
        .removeAllListeners("SIGTERM")
        .on("SIGTERM", self.shutdown.bind(self));
    });
  }

  /**
   * @name shutdown
   * @param {number} code  - Exit code
   * @description Performs a full shutdown. Stops the server, handles cleanup and exits the process.
   * Called on SIGINT or SIGTERM.
   */
  async shutdown(code = 0) {
    try {
      logging.warn(this.messages.taskTrackerIsShuttingDown);
      await this.stop();
      setTimeout(() => {
        process.exit(code);
      }, 100);
    } catch (error) {
      logging.error(error);
      setTimeout(() => {
        process.exit(1);
      }, 100);
    }
  }

  /**
   * @name stop
   * @description Stops the server and handles cleanup but does not exit the process
   * Used in tests for quick start/stop actions
   * Called by shutdown to handle server stop and cleanup before exiting
   * @returns {Promise} Resolves once TaskTracker has stopped.
   */
  async stop() {
    try {
      //If we never fully started there is nothing to stop
      if (this.httpServer && this.httpServer.listening) {
        //We stop the server first so that no new long running requests or processes can be started.
        await this._stopServer();
      }
      //Do all of the cleanup tasks
      await this._cleanup();
    } finally {
      //Wrap up
      this.httpServer = null;
      this._logStopMessages();
    }
  }

  /**
   * @name registerCleanupTask
   * @param {function} task - A function that accomplishes a unit of work.
   * @description Add a task that should be called on shutdown.
   */
  registerCleanupTask(task) {
    this.cleanupTasks.push(task);
  }

  /**
   * @description Dees the work of stopping the server using stoppable
   * @returns {Promise} Resolves once TaskTracker stops successfully. Rejects otherwise.
   */
  async _stopServer() {
    return new Promise((resolve, reject) => {
      this.httpServer.stop((error, status) => {
        if (error) {
          return reject(error);
        }
        return resolve(status);
      });
    });
  }

  /**
   * @name cleanup
   * @description Waits until all tasks have finished.
   */
  async _cleanup() {
    //wait for all cleanup tasks to finish
    await Promise.all(this.cleanupTasks.map((task) => task()));
  }

  /**
   * @description Log start messages
   */
  _logStartMessages() {
    logging.info(this.messages.taskTrackerIsRunningIn);

    //Message for production mode.
    if (this.env === "production") {
      logging.info(this.messages.yourApiIsAvailableOn);
    } else {
      logging.info(this.messages.listeningOn);
      logging.info(this.messages.urlConfiguredAs);
    }

    logging.info(this.messages.ctrlCToShutDown);
  }

  /**
   *  @name startTestMode
   */
  _startTestMode() {
    const connectionInterval = setInterval(
      () =>
        this.httpServer.getConnections((err, connections) =>
          logging.warn(`${connections} connections currently open`)
        ),
      5000
    );

    //Output a notice when the server closes
    this.httpServer.on("close", function () {
      clearInterval(connectionInterval);
      logging.warn("Server has fully closed");
    });
  }

  /**
   * @description Log stop messages
   */
  _logStopMessages() {
    logging.warn(this.messages.taskTrackerHasShutdown);

    if (config.get("env") === "production") {
      logging.warn(this.messages.yourApiIsNowOffline);
    }

    let uptime = moment.duration(process.uptime(), "seconds").humanize();
    //Always output uptime
    logging.warn(`${this.messages.taskTrackerWasRunningFor} ${uptime}`);
  }
}

module.exports = TaskTrackerServer;

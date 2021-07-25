const debug = require("debug")("boot");

/**
 * @description Helper class to create consistent log
 *
 * @param {Object} logging - Pino logger instance
 * @param {number} startTime - Time bootlogger was instantiated
 */
class BootLogger {
  constructor(logging, startTime) {
    this.logging = logging;
    this.startTime = startTime;
  }

  log(message) {
    let { logging, startTime } = this;
    logging.info(
      `Task Tracker ${message} in ${(Date.now() - startTime) / 1000}s`
    );
  }
}
/**
 * @description initCore registers/starts all core services which we cannot do without.
 * @param {Object}  taskTrackerServer - Our main server instance
 *
 */
async function initCore(taskTrackerServer) {
  debug("Begin: initCore");
  debug("Begin: Job Service");
  const JobService = require("./services/jobs");
  const jobs = new JobService();
  taskTrackerServer.registerCleanupTask(async () => {
    await jobs.shutdown();
  });
  debug("End: Job service");
  debug("End: initCore");
}
// async function initDatabase({config,logging}){
//   /**Pull in all the database setup, migration code in  here and setup the database here */
//   await somefunctionToMakeDatabaseAvailable()
// }

/**
 * @param {Object} app - Express app
 *
 * @returns {Promise<object>} taskTrackerServer
 */
async function bootTaskTracker(app) {
  //Metrics
  const startTime = Date.now();
  debug("Begin Boot");

  //We need access to these variables in both the try and catch block
  let bootLogger;
  let config;
  let taskTrackerServer;
  let logging;

  try {
    //Step 0 Load config and logging - fundamental required dependencies
    debug("Begin: Load config");
    config = require("./config");
    debug("End: Load config");

    debug("Begin: Load logging");
    logging = require("pino")();
    bootLogger = new BootLogger(logging, startTime);
    debug("End: Load logging");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  try {
    debug("Begin: load server");
    const TaskTrackerServer = require("./server");
    taskTrackerServer = new TaskTrackerServer({
      url: `${config.get("server").host}:${config.get("server").port}`,
    });
    await taskTrackerServer.start(app);
    bootLogger.log("server started");
    debug("End: load server");

    debug("Begin: Load core services");
    await initCore(taskTrackerServer);
    debug("End: Load core services");

    // We return the server purely for testing purposes
    debug("End Boot: Returning TaskTracker Server");
    return taskTrackerServer;
  } catch (error) {
    //Neeed to check instance of error and output the corrct error,also we don't want to output critical error message to the terminal. Some error messages need to be redacted or generalized to avoid breaches.
    logging.error(error);

    //If tasktracker was started and something else went wrong, we shut it down.
    if (taskTrackerServer) {
      taskTrackerServer.shutdown(2);
    } else {
      //Task tracker server failed to start, set a timeout o give logging a chance to finish.
      setTimeout(() => {
        process.exit(2);
      }, 100);
    }
  }
}

module.exports = bootTaskTracker;

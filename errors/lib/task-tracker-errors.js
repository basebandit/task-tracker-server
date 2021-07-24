const uuid = require("uuid");
const isString = require("../../helpers");

class TaskTrackerError extends Error {
  constructor(options) {
    options = options || {};

    if (isString(options)) {
      throw new Error(
        "Please instantiate Errors with the option pattern. e.g. new errors.TaskTrackerError({message: ...})"
      );
    }

    super();

    //defaults
    this.statusCode = 500;
    this.errorType = "InternalServerError";
    this.level = "normal";
    this.message = "The server has encountered an error.";
    this.id = uuid.v1();

    /**
     * custom overrides
     */
    this.id = options.id || this.id;
    this.statusCode = options.statusCode || this.statusCode;
    this.level = options.level || this.level;
    this.context = options.context || this.context;
    this.help = options.help || this.help;
    this.errorType = this.name = options.errorType || this.errorType;
    this.errorDetails = option.errorDetails;
    this.code = options.code || null;
    this.property = options.property || null;
    this.redirect = options.redirect || null;

    this.message = options.message || this.message;
    this.hideStack = options.hideStack;

    if (options.err) {
      //some third party libs return error string instead of an error instance
      if (isString(options.err)) {
        options.err = new Error(options.err);
      }

      Object.getOwnPropertyNames(options.err).forEach((property) => {
        if (
          ["errorType", "name", "statusCode", "message", "level"].indexOf(
            property
          ) !== -1
        ) {
          return;
        }

        switch (property) {
          case "code":
            this[property] = this[property] || options.err[property];
            return;
          case "stack":
            this[property] += "\n\n" + options.err[property];
            return;
          default:
            this[property] = options.err[property] || this[property];
        }
      });
    }
  }
}

/**
 * @name default error classes.
 * @constructor
 */
const errors = {
  InternalServerError: class InternalServerError extends TaskTrackerError {
    /**
     * @param {Object} options - Custom  object to override the default error values.
     * @param {number} options.statusCode - custom http status code.
     * @param {string} options.level - custom error level.
     * @param {string} options.context - custom error context.
     * @param {string} options.help - custom error help string.
     * @param {string} [options.errorType="InternalServerError"] - custom error type string.
     * @param {string} options.errorDetails - custom error details.
     * @param {number} options.code - custom system error code.
     * @param {string} options.property - custom error property value for internal use.
     * @param {string} options.redirect - custom error redirect url
     * @param {string} [options.message="The server has encountered an error."] - custom error message
     * @param {boolean} options.hidestack - should hide error stack trace.
     *
     */
    constructor(options) {
      super({
        statusCode: 500,
        level: "critical",
        errorType: "InternalServerError",
        message: "The server has encountered an error.",
        ...options,
      });
    }
  },
  IncorrectUsageError: class IncorrectUsageError extends TaskTrackerError {
    constructor(options) {
      super({
        statusCode: 400,
        level: "critical",
        errorType: "IncorrectUsageError",
        message: "We detected a misuse. Please read the stack trace.",
        ...options,
      });
    }
  },
  NotFoundError: class NotFoundError extends TaskTrackerError {
    constructor(options) {
      super({
        statusCode: 404,
        errorType: "NotFoundError",
        message: "Resource could not be found.",
        ...options,
      });
    }
  },
  BadRequestError: class BadRequestError extends TaskTrackerError {
    constructor(options) {
      super({
        statusCode: 400,
        errorType: "BadRequestError",
        message: "The request could not be understood.",
        ...options,
      });
    }
  },
  UnauthorizedError: class UnauthorizedError extends TaskTrackerError {
    constructor(options) {
      super({
        statusCode: 401,
        errorType: "UnauthorizedError",
        message: "You are not authorised to make this request.",
        ...options,
      });
    }
  },
  PasswordResetRequiredError: class PasswordResetRequiredError extends TaskTrackerError {
    constructor(options) {
      super({
        statusCode: 401,
        errorType: "PasswordResetRequiredError",
        message:
          'As a security precaution, your password must be reset. Click "Forgot?" to receive an email with instructions.',
        ...options,
      });
    }
  },
  NoPermissionError: class NoPermissionError extends TaskTrackerError {
    constructor(options) {
      super({
        statusCode: 403,
        errorType: "NoPermissionError",
        message: "You do not have permission to perform this request.",
        ...options,
      });
    }
  },
  ValidationError: class ValidationError extends TaskTrackerError {
    constructor(options) {
      super({
        statusCode: 422,
        errorType: "ValidationError",
        message: "The request failed validation.",
        ...options,
      });
    }
  },
  UnsupportedMediaTypeError: class UnsupportedMediaTypeError extends TaskTrackerError {
    constructor(options) {
      super({
        statusCode: 415,
        errorType: "UnsupportedMediaTypeError",
        message: "The media in the request is not supported by the server.",
        ...options,
      });
    }
  },
  TooManyRequestsError: class TooManyRequestsError extends TaskTrackerError {
    constructor(options) {
      super({
        statusCode: 429,
        errorType: "TooManyRequestsError",
        message:
          "Server has received too many similar requests in a short space of time.",
        ...options,
      });
    }
  },
  MaintenanceError: class MaintenanceError extends TaskTrackerError {
    constructor(options) {
      super({
        statusCode: 503,
        errorType: "MaintenanceError",
        message: "The server is temporarily down for maintenance.",
        ...options,
      });
    }
  },
  MethodNotAllowedError: class MethodNotAllowedError extends TaskTrackerError {
    constructor(options) {
      super({
        statusCode: 405,
        errorType: "MethodNotAllowedError",
        message: "Method not allowed for resource.",
        ...options,
      });
    }
  },
  RequestEntityTooLargeError: class RequestEntityTooLargeError extends TaskTrackerError {
    constructor(options) {
      super({
        statusCode: 413,
        errorType: "RequestEntityTooLargeError",
        message: "Request was too big for the server to handle.",
        ...options,
      });
    }
  },
  TokenRevocationError: class TokenRevocationError extends TaskTrackerError {
    constructor(options) {
      super({
        statusCode: 503,
        errorType: "TokenRevocationError",
        message: "Token is no longer available.",
        ...options,
      });
    }
  },
  VersionMismatchError: class VersionMismatchError extends TaskTrackerError {
    constructor(options) {
      super({
        statusCode: 400,
        errorType: "VersionMismatchError",
        message: "Requested version does not match server version.",
        ...options,
      });
    }
  },
};

module.exports = errors;
module.exports.TaskTrackerError = TaskTrackerError;

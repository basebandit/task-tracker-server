//Don't allow NODE_ENV to be null.\
process.env.NODE_ENV = process.env.NODE_ENV || "development";

// const argv = process.argv;
const express = require("express");
const app = express();

require("./boot")(app);

const cron = require("node-cron");
const express = require("express");
const fs = require("fs");

app = express();

// schedule tasks to be run on the server
cron.schedule("* * * * 1", function () {
    console.log("---------------------");
    
});
"use strict";

const path = require("path"),
	runUtil = require("../index").run;

console.log("Should take 10 seconds...");
runUtil.run(path.join(__dirname, "delayTenSeconds.sh"), [], runUtil.SILENT, () => console.log("Done!"));

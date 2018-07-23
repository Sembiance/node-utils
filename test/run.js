"use strict";

const base = require("@sembiance/xbase"),
	path = require("path"),
	runUtil = require("../index").run;

//console.log("Should take 10 seconds...");
//runUtil.run(path.join(__dirname, "delayTenSeconds.sh"), [], runUtil.SILENT, () => console.log("Done!"));

runUtil.run(path.join(__dirname, "delayTenSeconds.sh"), [], {silent : true, timeout : 2000}, () => console.log(arguments));

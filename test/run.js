"use strict";

var assert = require("assert"),
	tiptoe = require("tiptoe"),
	path = require("path"),
	runUtil = require("../index").run;

console.log("Should take 10 seconds...");
runUtil.run(path.join(__dirname, "delayTenSeconds.sh"), [], {silent:true}, function(err)
{
	console.log("Done!");
});

"use strict";

const path = require("path"),
	fs = require("fs"),
	fileUtil = require("../index").file,
	webUtil = require("../index").web;

const SCREENSHOT_PATH = path.join(__dirname, "web-screenshot.png");

if(fileUtil.existsSync(SCREENSHOT_PATH))
	fs.unlinkSync(SCREENSHOT_PATH);

webUtil.captureScreenshot("http://worldofsolitaire.com", {width : 1024, height : 768, delay : 2000}, (err, ss) =>
{
	if(err)
	{
		console.error(err);
		process.exit(1);
	}

	fs.writeFile(SCREENSHOT_PATH, ss, () =>
	{
		console.log("Examine %s to see if it worked, should be a screenshot of worldofsolitaire.com", path.basename(SCREENSHOT_PATH));
		process.exit(0);
	});
});

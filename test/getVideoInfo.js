"use strict";

const tiptoe = require("tiptoe"),
	path = require("path"),
	printUtil = require("../index").print,
	videoUtil = require("../index").video;

tiptoe(
	function getVideoInfo()
	{
		videoUtil.getInfo(process.argv[2], this);
	},
	function generateThumbnail(videoInfo)
	{
		printUtil.log("%J", videoInfo);
		
		videoUtil.generateThumbnail(__dirname, "00:00:" + (videoInfo.duration<40 ? Math.floor(Math.floor(videoInfo.duration)/2) : 30), path.resolve(__dirname, path.basename(process.argv[2]) + ".thumb.png"), 400, 600, this);
	},
	function returnResult(err)
	{
		if(err)
			console.error(err);

		process.exit(0);
	}
);

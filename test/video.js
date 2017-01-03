"use strict";

var assert = require("assert"),
	tiptoe = require("tiptoe"),
	path = require("path"),
	fs = require("fs"),
	videoUtil = require("../index").video;

var VIDEO_PATH = path.join(__dirname, "video.mp4");
var VIDEO_THUMBNAIL_PATH = path.join(__dirname, "video.mp4.thumb.png");

tiptoe(
	function getVideoInfo()
	{
		assert(fs.existsSync(VIDEO_PATH));

		videoUtil.getInfo(VIDEO_PATH, this);
	},
	function generateThumbnail(videoInfo)
	{
		videoUtil.generateThumbnail(VIDEO_PATH, "00:00:" + (videoInfo.duration<40 ? Math.floor(Math.floor(videoInfo.duration)/2) : 30), VIDEO_PATH + ".thumb.png", 400, 600, this);
	},
	function removeThumbnail()
	{
		assert(fs.existsSync(VIDEO_THUMBNAIL_PATH));
		fs.unlink(VIDEO_THUMBNAIL_PATH, this);
	},
	function returnResult(err)
	{
		if(err)
			console.error(err);

		assert(!err);
		process.exit(0);
	}
);
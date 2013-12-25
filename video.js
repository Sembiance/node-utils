"use strict";

var base = require("xbase"),
	tiptoe = require("tiptoe"),
	path = require("path"),
	fs = require("fs"),
	runUtil = require("./run.js"),
	rimraf = require("rimraf"),
	fileUtil = require("./file.js");

var	COMMAND_MPLAYER = "/usr/bin/mplayer";
var	COMMAND_MOGRIFY = "/usr/bin/mogrify";

exports.generateThumbnail = function generateThumbnail(videoPath, startTime, thumbnailPath, thumbnailWidth, thumbnailHeight, cb)
{
	tiptoe(
		function createTempDirectory()
		{
			this.data.tempDir = fileUtil.generateTempFilePath();
			fs.mkdir(this.data.tempDir, this);
		},
		function grabFrames()
		{
			runUtil.run(COMMAND_MPLAYER, ["-msglevel", "all=0", "-ss", startTime, "-frames", "1", "-ao", "null", "-vo", "png", "--", videoPath], {silent:true, cwd:this.data.tempDir}, this);
		},
		function generateImage()
		{
			runUtil.run(COMMAND_MOGRIFY, ["-scale", thumbnailWidth + "x" + thumbnailHeight, path.join(this.data.tempDir, "00000001.png")], {silent:true}, this);
		},
		function moveImage()
		{
			fileUtil.copy(path.join(this.data.tempDir, "00000001.png"), thumbnailPath, this);
		},
		function removeTempDirectory()
		{
			rimraf(this.data.tempDir, this);
		},
		function finish(err)
		{
			cb(err);
		}
	);
};

exports.getInfo = function getInfo(videoPath, cb)
{
	tiptoe(
		function runIdentify()
		{
			runUtil.run(COMMAND_MPLAYER, ["-frames", "0", "-identify", "--", videoPath], {silent:true}, this);
		},
		function processData(data)
		{
			var info = {};

			var lines = data.split("\n");
			lines.forEach(function(line)
			{
				if(!line.contains("="))
					return;

				var parts = line.split("=");
				if(parts.length!==2)
					return;

				if(parts[0]==="ID_LENGTH")
					info.duration = +parts[1];
				if(parts[0]==="ID_VIDEO_BITRATE")
					info.bitrate = +parts[1];
				if(parts[0]==="ID_VIDEO_WIDTH")
					info.width = +parts[1];
				if(parts[0]==="ID_VIDEO_HEIGHT")
					info.height = +parts[1];
				if(parts[0]==="ID_VIDEO_FPS")
					info.framesPerSecond = +parts[1];
				if(parts[0]==="ID_VIDEO_ASPECT")
					info.aspectRatio = +parts[1];
				if(parts[0]==="ID_VIDEO_FORMAT")
					info.format = parts[1];
			});

			info.mimeType = "video/avi";
			if(info.format)
			{
				var formatLow = info.format.toLowerCase();
				
				if(formatLow==="h264")
					info.mimeType = "video/h264";
				else if(formatLow==="divx" || formatLow==="dx5")
					info.mimeType = "video/divx";
				else if(formatLow.startsWith("wmv"))
					info.mimeType = "video/x-ms-wmv";
			}

			return info;
		},
		function finish(err, info) { cb(err, info); }
	);
};

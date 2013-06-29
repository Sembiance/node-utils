"use strict";

var base = require("base"),
	tiptoe = require("tiptoe"),
	path = require("path"),
	fs = require("fs"),
	runUtils = require("./run-utils.js"),
	rimraf = require("rimraf"),
	fileUtils = require("./file-utils.js");

var	COMMAND_MPLAYER = "/usr/bin/mplayer";
var	COMMAND_MOGRIFY = "/usr/bin/mogrify";

exports.generateThumbnail = function generateThumbnail(videoPath, startTime, thumbnailPath, thumbnailWidth, thumbnailHeight, cb)
{
	tiptoe(
		function createTempDirectory()
		{
			this.data.tempDir = fileUtils.generateTempFilePath();
			fs.mkdir(this.data.tempDir, this);
		},
		function grabFrames()
		{
			runUtils.run(COMMAND_MPLAYER, ["-ss", startTime, "-frames", "1", "-ao", "null", "-vo", "png", "--", videoPath], {"redirect-stderr" : true, silent:true, cwd:this.data.tempDir}, this);
		},
		function generateImage()
		{
			runUtils.run(COMMAND_MOGRIFY, ["-scale", thumbnailWidth + "x" + thumbnailHeight, path.join(this.data.tempDir, "00000001.png")], {"redirect-stderr" : true, silent:true}, this);
		},
		function moveImage()
		{
			fileUtils.copy(path.join(this.data.tempDir, "00000001.png"), thumbnailPath, this);
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
			runUtils.run(COMMAND_MPLAYER, ["-frames", "0", "-identify", "--", videoPath], {"redirect-stderr" : true, silent:true}, this);
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

"use strict";

const base = require("@sembiance/xbase"),
	tiptoe = require("tiptoe"),
	path = require("path"),
	fs = require("fs"),
	runUtil = require("./runUtil.js"),
	rimraf = require("rimraf"),
	fileUtil = require("./fileUtil.js");

const	COMMAND_MPLAYER = "/usr/bin/mplayer";
const	COMMAND_MOGRIFY = "/usr/bin/mogrify";

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
			runUtil.run(COMMAND_MPLAYER, ["-msglevel", "all=0", "-ss", startTime, "-frames", "1", "-ao", "null", "-vo", "png", "--", videoPath], {silent : true, cwd : this.data.tempDir}, this);
		},
		function generateImage()
		{
			runUtil.run(COMMAND_MOGRIFY, ["-scale", thumbnailWidth + "x" + thumbnailHeight, path.join(this.data.tempDir, "00000001.png")], runUtil.SILENT, this);
		},
		function moveImage()
		{
			fileUtil.copy(path.join(this.data.tempDir, "00000001.png"), thumbnailPath, this);
		},
		function removeTempDirectory()
		{
			rimraf(this.data.tempDir, this);
		},
		cb
	);
};

exports.getInfo = function getInfo(videoPath, cb)
{
	tiptoe(
		function runIdentify()
		{
			runUtil.run(COMMAND_MPLAYER, ["-frames", "0", "-identify", "--", videoPath], runUtil.SILENT, this);
		},
		function processData(data)
		{
			const info = {};

			const lines = data.split("\n");
			lines.forEach(line =>
			{
				if(!line.contains("="))
					return;

				const parts = line.split("=");
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
				const formatLow = info.format.toLowerCase();
				
				if(formatLow==="h264")
					info.mimeType = "video/h264";
				else if(formatLow==="divx" || formatLow==="dx5")
					info.mimeType = "video/divx";
				else if(formatLow.startsWith("wmv"))
					info.mimeType = "video/x-ms-wmv";
			}

			return info;
		},
		cb
	);
};

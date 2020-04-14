"use strict";

const XU = require("@sembiance/xu"),
	tiptoe = require("tiptoe"),
	path = require("path"),
	fs = require("fs"),
	runUtil = require("./runUtil.js"),
	fileUtil = require("./fileUtil.js");

const COMMAND_MPLAYER = "/usr/bin/mplayer";
const COMMAND_MOGRIFY = "/usr/bin/mogrify";
const COMMAND_CONVERT = "/usr/bin/convert";

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
			const args = ["-msglevel", "all=0", "-ss", startTime, "-frames", "1", "-ao", "null", "-vo", "jpeg", "--", path.resolve(videoPath)];
			if(videoPath.endsWith(".m2ts"))
				args.splice(0, 0, "-demuxer", "lavf");

			runUtil.run(COMMAND_MPLAYER, args, {verbose : true, cwd : this.data.tempDir}, this);
		},
		function generateImage()
		{
			runUtil.run(COMMAND_MOGRIFY, ["-scale", thumbnailWidth + "x" + thumbnailHeight, path.join(this.data.tempDir, "00000001.jpg")], runUtil.SILENT, this);
		},
		function convertOrCopy()
		{
			if(thumbnailPath.endsWith(".png"))
				runUtil.run(COMMAND_CONVERT, [path.join(this.data.tempDir, "00000001.jpg"), thumbnailPath], runUtil.SILENT, this);
			else
				fileUtil.copy(path.join(this.data.tempDir, "00000001.png"), thumbnailPath, this);
		},
		function removeTempDirectory()
		{
			fileUtil.unlink(this.data.tempDir, this);
		},
		cb
	);
};

exports.getInfo = function getInfo(videoPath, cb)
{
	tiptoe(
		function runIdentify()
		{
			const args = ["-frames", "0", "-identify", "--", videoPath];
			if(videoPath.endsWith(".m2ts"))
				args.splice(0, 0, "-demuxer", "lavf");

			runUtil.run(COMMAND_MPLAYER, args, {silent : true, timeout : XU.MINUTE}, this);
		},
		function processData(data)
		{
			const info = {};

			const lines = data.split("\n");
			lines.forEach(line =>
			{
				if(!line.includes("="))
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
				if(parts[0]==="ID_VIDEO_CODEC")
					info.codec = parts[1];
				if(parts[0]==="ID_DEMUXER")
					info.demuxer = parts[1];
			});

			if(info.format)
			{
				const formatLow = info.format.toLowerCase();
				
				if(formatLow==="h264")
					info.mimeType = "video/h264";
				else if(formatLow==="divx" || formatLow==="dx5")
					info.mimeType = "video/divx";
				else if(formatLow.startsWith("wmv"))
					info.mimeType = "video/x-ms-wmv";
				else
					info.mimeType = "video/avi";
			}

			return info;
		},
		cb
	);
};

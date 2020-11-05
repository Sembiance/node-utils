"use strict";

const XU = require("@sembiance/xu"),
	tiptoe = require("tiptoe"),
	path = require("path"),
	fs = require("fs"),
	imageUtil = require("./imageUtil.js"),
	runUtil = require("./runUtil.js"),
	fileUtil = require("./fileUtil.js");

const COMMAND_MPLAYER = "/usr/bin/mplayer";
const COMMAND_MOGRIFY = "/usr/bin/mogrify";
const COMMAND_CONVERT = "/usr/bin/convert";

// Will trim solid frames off the start or end of the video. Options:
// color		What solid color to find and trim, (default: black)
// trimStart	Set to true to trim frames from the start of the video (default: true)
// trimEnd		Set to true to trim frames from the end of the video (default: true)
// fps			How precise should the cutting be based on frames per second (default: 10)
// fuzz			How much variance can there be from the color to be considered a solid frame. (default: 10%)
exports.trimSolidFrames = function trimSolidFrames(srcFilePath, destFilePath, _options, _cb)
{
	const {options, cb} = XU.optionscb(_options, _cb, {color : "#000000", trimStart : true, trimEnd : true, fuzz : "10%", fps : 10});
	const tmpWorkDir = fileUtil.generateTempFilePath("/mnt/ram/tmp");
	if(!fileUtil.existsSync(srcFilePath))
		return setImmediate(cb);

	tiptoe(
		function createWorkDirAndGetInfo()
		{
			exports.getInfo(srcFilePath, this.parallel());
			fs.mkdir(tmpWorkDir, {recursive : true}, this.parallel());
		},
		function generateFrames(srcVidInfo)
		{
			this.data.srcVidInfo = srcVidInfo;
			runUtil.run("ffmpeg", ["-i", srcFilePath, "-vf", `fps=${options.fps}`, "frame-%09d.png"], {cwd : tmpWorkDir, silent : true}, this);
		},
		function getFrameList()
		{
			fileUtil.glob(tmpWorkDir, "*.png", this);
		},
		function findSolidFrames(frameFilePaths)
		{
			const cropOptions = {cropColor : options.color};
			if(options.fuzz)
				cropOptions.fuzz = options.fuzz;

			frameFilePaths.parallelForEach((frameFilePath, subcb) => imageUtil.getAutoCropDimensions(frameFilePath, cropOptions, subcb), this);
		},
		function performTrimming(framesCropInfo)
		{
			const frameDuration = 1000/options.fps;
			let startTrimDuration = 0;
			let endTrimDuration = 0;

			if(options.trimStart)
			{
				framesCropInfo.some(frameCropInfo =>
				{
					if(frameCropInfo.trimAll)
						startTrimDuration+=frameDuration;
					
					return !frameCropInfo.trimAll;
				});
			}

			if(options.trimEnd)
			{
				framesCropInfo.reverse().some(frameCropInfo =>
				{
					if(frameCropInfo.trimAll)
						endTrimDuration+=frameDuration;
					
					return !frameCropInfo.trimAll;
				});
			}

			// If no trimming to take place, just copy the src to the destination
			if(startTrimDuration===0 && endTrimDuration===0)
				return fs.copyFile(srcFilePath, destFilePath, this), undefined;

			const ffmpegArgs = ["-i", srcFilePath];
			if(startTrimDuration>0)
				ffmpegArgs.push("-ss", `${startTrimDuration}ms`);
			if(endTrimDuration>0)
				ffmpegArgs.push("-t", `${((this.data.srcVidInfo.duration*1000)-(endTrimDuration+startTrimDuration))}ms`);

			ffmpegArgs.push("-y", "-c:v", "libx264rgb", "-crf", "0", "-preset", "ultrafast", destFilePath);
			runUtil.run("ffmpeg", ffmpegArgs, runUtil.SILENT, this);
		},
		function cleanup()
		{
			fileUtil.unlink(tmpWorkDir, this);
		},
		cb
	);
};

// Will automatically crop the given video at srcFilePath and save it at destFilePath. Options:
// cropColor		What color to crop. (default: black)
// numSampleFrames	How many frames over the video to check to see what min size to crop to. (default: 30)
// fuzz				How much variance from the cropColor should be considered a match. (default: 0)
exports.autocrop = function autocrop(srcFilePath, destFilePath, _options, _cb)
{
	const {options, cb} = XU.optionscb(_options, _cb, {cropColor : "#000000", numSampleFrames : 30});
	const tmpWorkDir = fileUtil.generateTempFilePath("/mnt/ram/tmp");

	tiptoe(
		function createWorkDir()
		{
			fs.mkdir(tmpWorkDir, {recursive : true}, this);
		},
		function generateFrames()
		{
			runUtil.run("extractVideoFrames", [srcFilePath, options.numSampleFrames], {cwd : tmpWorkDir, silent : true}, this);
		},
		function getFramesCropDimensions()
		{
			const autoCropOptions = {cropColor : options.cropColor};
			if(options.fuzz)
				autoCropOptions.fuzz = options.fuzz;

			[].pushSequence(1, options.numSampleFrames).parallelForEach((frameNum, subcb) => imageUtil.getAutoCropDimensions(path.join(tmpWorkDir, `frame-${`${frameNum}`.padStart(9, "0")}.png`), autoCropOptions, subcb), this);
		},
		function performCropping(framesCropInfo)
		{
			if(!framesCropInfo || framesCropInfo.length===0 || framesCropInfo.filterEmpty().length===0)
				return this();

			const sums = {};
			framesCropInfo.forEach(frameCropInfo =>
			{
				if(frameCropInfo.trimAll)
					return;

				const cropid = `${frameCropInfo.w}x${frameCropInfo.h}+${frameCropInfo.x}+${frameCropInfo.y}`;
				if(!sums.hasOwnProperty(cropid))
					sums[cropid] = {count : 0, frameCropInfo};
				
				sums[cropid].count++;
			});

			if(Object.keys(sums).length===0)
				return this.jump(-1);

			const cropInfo = Object.entries(sums).multiSort(([, v]) => v.count, true)[0][1].frameCropInfo;
			if(!cropInfo)
				return this.jump(-1);
			
			runUtil.run("ffmpeg", ["-i", srcFilePath, "-vf", `crop=${cropInfo.w}:${cropInfo.h}:${cropInfo.x}:${cropInfo.y}`, "-y", "-c:v", "libx264rgb", "-crf", "0", "-preset", "ultrafast", destFilePath], runUtil.SILENT, this);
		},
		function cleanup()
		{
			fileUtil.unlink(tmpWorkDir, this);
		},
		cb
	);
};

// Will convert the video at srcFilePath to outFilePath
exports.convert = function convert(srcFilePath, outFilePath, _options, _cb)
{
	const {options, cb} = XU.optionscb(_options, _cb, {method : "HEAD"});

	tiptoe(
		function getCropInfoIfNeeded()
		{
			if(!options.autocrop)
				return this();
			
			runUtil.run("ffmpeg", ["-i", srcFilePath, "-t", "1", "-vf", "cropdetect", "-f", "null", "-"], runUtil.SILENT, this);
		},
		function performConversion(cropInfoRaw)
		{
			const convertArgs = [];
			if(options.ffmpegFormat)
				convertArgs.push("-f", options.ffmpegFormat);

			convertArgs.push("-i", srcFilePath);

			// Should we auto-crop?
			if(options.autocrop && cropInfoRaw)
			{
				const cropProps = cropInfoRaw.toString("utf8").trim().split("\n").reverse().find(line => line.match(/crop=[^\n]+/));
				if(cropProps && cropProps.length===1)
					convertArgs.push("-vf", cropProps[0].trim());
			}

			if(options.browserFriendly)	// These args sometimes cause the conversion to fail: "-pix_fmt", "yuv420p"
				convertArgs.push("-c:v", "libx264", "-crf", "1", "-preset", "veryslow", outFilePath);	// Browser compatible color space (YUV420 instead of YUV444) and spend more CPU time compressing
			else
				convertArgs.push("-c:v", "libx264rgb", "-crf", "0", "-preset", "ultrafast", outFilePath);	// Pixel perfect, very fast

			runUtil.run("ffmpeg", convertArgs, runUtil.SILENT, this);
		},
		cb
	);
};

// Generates a thumbnail for the given video at videoPath starting at startTime with the target thumbnailWidth and thumbnailHeight
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
				args.unshift("-demuxer", "lavf");

			runUtil.run(COMMAND_MPLAYER, args, {silent : true, cwd : this.data.tempDir}, this);
		},
		function generateImage()
		{
			runUtil.run(COMMAND_MOGRIFY, ["-scale", `${thumbnailWidth}x${thumbnailHeight}`, path.join(this.data.tempDir, "00000001.jpg")], runUtil.SILENT, this);
		},
		function convertOrCopy()
		{
			if(thumbnailPath.endsWith(".png"))
				runUtil.run(COMMAND_CONVERT, [path.join(this.data.tempDir, "00000001.jpg"), thumbnailPath], runUtil.SILENT, this);
			else
				fs.copyFile(path.join(this.data.tempDir, "00000001.png"), thumbnailPath, this);
		},
		function removeTempDirectory()
		{
			fileUtil.unlink(this.data.tempDir, this);
		},
		cb
	);
};

// Returns info about the given video at videoPath including duration, bitrate, width, height, etc
exports.getInfo = function getInfo(videoPath, cb)
{
	tiptoe(
		function runIdentify()
		{
			const args = ["-frames", "0", "-identify", "--", videoPath];
			if(videoPath.endsWith(".m2ts"))
				args.unshift("-demuxer", "lavf");

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
					info.fps = +parts[1];
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

// Will extract a single frame from videoFilePath at the 'frameLoc' point and save to frameFilePath
exports.extractFrame = function extractFrame(videoFilePath, frameFilePath, frameLoc, cb)
{
	tiptoe(
		function getInfo()
		{
			exports.getInfo(videoFilePath, this);
		},
		function extract(vidInfo)
		{
			const fromEndProps = (frameLoc.match(/^-(?<ms>\d+)$/) || {}).groups;
			const percentageProps = (frameLoc.match(/^(?<percent>\d+)%$/) || {}).groups;
			const loc = fromEndProps ? (vidInfo.duration*XU.SECOND)-(+fromEndProps.ms) : Math.floor((vidInfo.duration*XU.SECOND)*((+percentageProps.percent)/100));
			const ss = ("" + Math.floor(loc/XU.HOUR)).padStart(2, "0") + ":" + ("" + Math.floor((loc%XU.HOUR)/XU.MINUTE)).padStart(2, "0") + ":" + ("" + Math.floor((loc%XU.MINUTE)/XU.SECOND)).padStart(2, "0");	// eslint-disable-line prefer-template

			runUtil.run("ffmpeg", ["-i", videoFilePath, "-ss", ss, "-vframes", "1", frameFilePath], runUtil.SILENT, this);
		},
		cb
	);
};

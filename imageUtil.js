"use strict";

const XU = require("@sembiance/xu"),
	fileUtil = require("./fileUtil.js"),
	fs = require("fs"),
	runUtil = require("./runUtil.js"),
	tiptoe = require("tiptoe");

// Will return [width, height] of the image at imageFilePath
exports.getWidthHeight = function getWidthHeight(imageFilePath, cb)
{
	tiptoe(
		function getSize()
		{
			runUtil.run("identify", ["-quiet", imageFilePath], runUtil.SILENT, this);
		},
		function processSizes(err, result)
		{
			if(err)
				return cb(err);

			const matches = result.trim().match(/[^ ]+ [^ ]+ (?<width>\d+)x(?<height>\d+) .*/);
			if(!matches || matches.length<3 || !matches.groups)
				return cb(new Error("Invalid image: " + imageFilePath));
			
			cb(null, [+matches.groups.width, +matches.groups.height]);
		}
	);
};

// Will crop the given image at inputFilePath randomly to targetWidth x targetHeight
exports.randomCrop = function randomCrop(inputFilePath, outputFilePath, targetWidth, targetHeight, cb)
{
	tiptoe(
		function measure()
		{
			exports.getWidthHeight(inputFilePath, this);
		},
		function calcOffsetsAndCrop(dimensions)
		{
			if(targetWidth===dimensions[0] && targetHeight===dimensions[1])
				return fs.copyFile(inputFilePath, outputFilePath, this), undefined;
				
			const xOffset = (targetWidth<dimensions[0]) ? Math.randomInt(0, (dimensions[0]-targetWidth)) : 0;
			const yOffset = (targetHeight<dimensions[1]) ? Math.randomInt(0, (dimensions[1]-targetHeight)) : 0;

			runUtil.run("convert", [inputFilePath, "-crop", targetWidth + "x" + targetHeight + "+" + xOffset + "+" + yOffset, "+repage", outputFilePath], runUtil.SILENT, this);
		},
		cb
	);
};

// Will try and auto-detect what the crop dimensions are and return {w, h, x, y}. Options:
// cropColor	What color to crop. (default: black)
// fuzz			How much variance from the cropColor to be considered a match (default: 0)
exports.getAutoCropDimensions = function getAutoCropDimensions(inputFilePath, _options, _cb)
{
	const {options, cb} = XU.optionscb(_options, _cb, {cropColor : "#000000"});

	tiptoe(
		function runTrim()
		{
			const convertArgs = [inputFilePath, "-bordercolor", options.cropColor, "-border", "1x1"];
			if(options.fuzz)
				convertArgs.push("-fuzz", options.fuzz);
			convertArgs.push("-trim", "info:-");
			runUtil.run("convert", convertArgs, runUtil.SILENT, this);
		},
		function returnResults(cropInfoRaw)
		{
			if(cropInfoRaw.trim().includes("geometry does not contain image"))
				return {trimAll : true};

			const cropInfoMatch = cropInfoRaw.trim().match(/(?<w>\d+)x(?<h>\d+) \d+x\d+\+(?<x>\d+)\+(?<y>\d+)/);
			if(!cropInfoMatch)
				throw new Error("Failed to get crop info for image [" + inputFilePath + "] with results: "+ cropInfoRaw.trim());

			this(undefined, Object.map(cropInfoMatch.groups, (k, v) => ((+v)-(["x", "y"].includes(k) ? 1 : 0))));
		},
		cb
	);
};

// Will compress the given image at inputFilePath to outputFilePath. If lossy is true then it will reduce image quality as needed to achieve higher compression
exports.compress = function compress(inputFilePath, outputFilePath, fileType, lossy, cb)
{
	if(!(["jpg", "png", "gif"]).includes(fileType))
		throw new Error("Unsupported image type: " + fileType);

	const tmpInputFilePath = fileUtil.generateTempFilePath("/mnt/ram/tmp", "." + fileType);
	const tmpOutputFilePath = fileUtil.generateTempFilePath("/mnt/ram/tmp", "." + fileType);

	tiptoe(
		function prepare()
		{
			fs.copyFile(inputFilePath, tmpInputFilePath, this);
		},
		function performCompression()
		{
			if(fileType==="png")
			{
				if(lossy)
					runUtil.run("pngquant", ["--speed=1", "--strip", "--output", tmpOutputFilePath, tmpInputFilePath], runUtil.SILENT, this);
				else
					runUtil.run("zopflipng", ["-m", tmpInputFilePath, tmpOutputFilePath], runUtil.SILENT, this);
			}
			else if(fileType==="jpg")
			{
				if(lossy)
					runUtil.run("guetzli", ["--quality", "90", tmpInputFilePath, tmpOutputFilePath], runUtil.SILENT, this);
				else
					runUtil.run("jpegtran", ["-progressive", "-copy", "none", "-optimize", "-perfect", "-outfile", tmpOutputFilePath, tmpInputFilePath], runUtil.SILENT, this);
			}
			else if(fileType==="gif")
			{
				runUtil.run("gifsicle", ["--optimize=3", tmpInputFilePath, "-o", tmpOutputFilePath], runUtil.SILENT, this);
			}
		},
		function cleanup()
		{
			if(fileUtil.existsSync(tmpOutputFilePath))
				fileUtil.move(tmpOutputFilePath, outputFilePath, this.parallel());
			fileUtil.unlink(tmpInputFilePath, this.parallel());
		},
		cb
	);
};

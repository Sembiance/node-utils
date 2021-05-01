"use strict";
const XU = require("@sembiance/xu"),
	fs = require("fs"),
	path = require("path"),
	runUtil = require("./runUtil.js"),
	tiptoe = require("tiptoe");

// Returns a bunch of info about the given image
exports.getInfo = function getInfo(imageFilePath, _options, _cb)
{
	const {options, cb} = XU.optionscb(_options, _cb);

	// Available properties: https://imagemagick.org/script/escape.php
	const PROPS =
	{
		height             : "%h",
		colorCount         : "%k",
		format             : "%[magick]",
		width              : "%w",
		canvasHeight       : "%H",
		canvasWidth        : "%W",
		size               : "%B",
		compressionType    : "%C",
		//compressionQuality : "%Q",	// Often is just '92' for most images and formats
		opaque             : "%[opaque]"
	};

	const NUMS = ["width", "height", "canvasWidth", "canvasHeight", "colorCount", "size", "compressionQuality", "entropy"];
	const BOOLS = ["opaque"];

	tiptoe(
		function runIdentifiers()
		{
			// Calculating colorCount takes FOREVER but is a useful metric, so we try it, but only give it a small amount of time to calculate
			const RUN_OPTIONS = {timeout : XU.MINUTE*5, silent : true, killSignal : "SIGTERM", cwd : path.dirname(imageFilePath)};	// imageMagick needs a TERM to kill when identifying an image, otherwise it runs like, forever on huge images
			runUtil.run("identify", ["-format", Object.entries(PROPS).map(([k, v]) => `${k}:${v}`).join("\\n"), `./${path.basename(imageFilePath)}`], {...RUN_OPTIONS, timeout : (options.timeout || RUN_OPTIONS.timeout)}, this.parallel());
			runUtil.run("identify", ["-format", "width:%w\\nheight:%h", `./${path.basename(imageFilePath)}`], RUN_OPTIONS, this.parallel());
		},
		function parseResults(imResultsRaw, whRaw)
		{
			let imResults = (imResultsRaw || "").trim();
			if(imResults.length===0 || imResults.includes("corrupt image") || imResults.toLowerCase().startsWith("error: command failed"))
				imResults = (whRaw || "").trim();
			
			const imLines = imResults.split("\n");
			if(imLines.length===0)
				return this();
			
			const imageInfo = {};
			imLines.forEach(imgLine =>
			{
				const lineProps = (imgLine.match(/(?<propName>[^:]+):(?<propValue>.*)$/) || {}).groups;
				if(!lineProps || !Object.keys(PROPS).includes(lineProps.propName))
					return;
				
				const propValue = NUMS.includes(lineProps.propName) ? +lineProps.propValue : (BOOLS.includes(lineProps.propName) ? lineProps.propValue.toLowerCase()==="true" : lineProps.propValue);
				if(propValue==="Undefined")
					return;
				
				imageInfo[lineProps.propName] = propValue;
			});
			
			this(undefined, Object.keys(imageInfo).length===0 ? undefined : imageInfo);
		},
		cb
	);
};

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
				return cb(new Error(`Invalid image: ${imageFilePath}`));
			
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

			runUtil.run("convert", [inputFilePath, "-crop", `${targetWidth}x${targetHeight}+${xOffset}+${yOffset}`, "+repage", outputFilePath], runUtil.SILENT, this);
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
				return this.finish();

			this(undefined, Object.map(cropInfoMatch.groups, (k, v) => ((+v)-(["x", "y"].includes(k) ? 1 : 0))));
		},
		cb
	);
};

// Will compress the given image at inputFilePath to outputFilePath. If lossy is true then it will reduce image quality as needed to achieve higher compression
exports.compress = function compress({src, dest, type, lossy, max, threads=10}, cb)
{
	if(!src || !dest)
		throw new Error(`imageUtil.compress requires both src and dest options`);
	
	if(!["png", "jpg", "gif"].includes(type))
		throw new Error(`Unsupported image type: ${type}`);

	if(type==="gif")
		return runUtil.run("gifsicle", ["--optimize=3", src, "-o", dest], runUtil.SILENT, cb), undefined;

	if(type==="png" && lossy)
		runUtil.run("pngquant", ["--speed=1", "--strip", "--output", dest, src], runUtil.SILENT, cb);
	else if(type==="png")
		runUtil.run("oxipng", ["--opt", "3", "--strip", "all", "--threads", threads.toString(), ...(max ? ["--zopfli"] : []), "--out", dest, src], runUtil.SILENT, cb);
	
	if(type==="jpg" && lossy)
		runUtil.run("guetzli", ["--quality", "90", src, dest], runUtil.SILENT, cb);
	else if(type==="jpg")
		runUtil.run("jpegtran", ["-progressive", "-copy", "none", "-optimize", "-perfect", "-outfile", dest, src], runUtil.SILENT, cb);
};

// Creates a webp version of png src saving it to dest
exports.png2webp = function png2webp(src, dest, cb)
{
	runUtil.run("cwebp", ["-mt", "-z", "9", src, "-o", dest], runUtil.SILENT, cb);
};

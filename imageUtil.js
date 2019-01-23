"use strict";

const base = require("@sembiance/xbase"),
	path = require("path"),
	fileUtil = require("./fileUtil.js"),
	runUtil = require("./runUtil.js"),
	tiptoe = require("tiptoe");

exports.getWidthHeight = function getWidthHeight(file, cb)
{
	tiptoe(
		function getSize()
		{
			runUtil.run("identify", ["-quiet", file], runUtil.SILENT, this);
		},
		function processSizes(err, result)
		{
			if(err)
				return cb(err);

			const matches = result.trim().match(/[^ ]+ [^ ]+ ([0-9]+)x([0-9]+) .*/);
			if(!matches || matches.length<3)
				return cb(new Error("Invalid image: " + file));
			
			cb(null, [+matches[1], +matches[2]]);
		}
	);
};

exports.randomCrop = function randomCrop(inputPath, outputPath, targetWidth, targetHeight, cb)
{
	tiptoe(
		function measure()
		{
			exports.getWidthHeight(inputPath, this);
		},
		function calcOffsetsAndCrop(dimensions)
		{
			if(targetWidth===dimensions[0] && targetHeight===dimensions[1])
				return fileUtil.copy(inputPath, outputPath, this), undefined;
				
			const xOffset = (targetWidth<dimensions[0]) ? Math.randomInt(0, (dimensions[0]-targetWidth)) : 0;
			const yOffset = (targetHeight<dimensions[1]) ? Math.randomInt(0, (dimensions[1]-targetHeight)) : 0;

			runUtil.run("convert", [inputPath, "-crop", targetWidth + "x" + targetHeight + "+" + xOffset + "+" + yOffset, "+repage", outputPath], runUtil.SILENT, this);
		},
		cb
	);
};

exports.compress = function compress(input, output, lossy, cb)
{
	const extension = path.extname(input).toLowerCase().substring(1);
	if(!(["jpg", "jpeg", "png", "gif"]).includes(extension))
		throw new Error("Unsupported image extension: " + extension);

	const tmpFile = fileUtil.generateTempFilePath();
	let deleteInput = false;

	tiptoe(
		function checkIfInputOutputMatch()
		{
			if(input===output)
			{
				const inputTMP = fileUtil.generateTempFilePath();
				fileUtil.copy(input, inputTMP, this);
				input = inputTMP;	// eslint-disable-line no-param-reassign
				deleteInput = true;
			}
			else
			{
				this();
			}
		},
		function prepare()
		{
			if(extension==="png")
				fileUtil.copy(input, tmpFile, this);
			else
				this();
		},
		function convert()
		{
			if(extension==="png")
			{
				if(lossy)
					runUtil.run("pngquant", ["--speed=1", "--strip", "--output", output, input], runUtil.SILENT, this);
				else
					runUtil.run("zopflipng", ["-y", "--splitting=3", "--filters=01234mepb", tmpFile, output], runUtil.SILENT, this);
			}
			else if(extension==="jpg" || extension==="jpeg")
			{
				if(lossy)
					runUtil.run("guetzli", ["-quality", "95%", input, output], runUtil.SILENT, this);
				else
					runUtil.run("jpegtran", ["-progressive", "-copy", "none", "-optimize", "-perfect", "-outfile", output, input], runUtil.SILENT, this);
			}
			else if(extension==="gif")
			{
				runUtil.run("gifsicle", ["-O3", input, "-o", output], runUtil.SILENT, this);
			}
			else
			{
				this();
			}
		},
		function cleanup()
		{
			if(deleteInput)
				fileUtil.unlink(input, this.parallel());
			
			this();
		},
		cb
	);
};

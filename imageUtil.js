"use strict";

const base = require("@sembiance/xbase"),
	path = require("path"),
	fileUtil = require("./fileUtil.js"),
	runUtil = require("./runUtil.js"),
	tiptoe = require("tiptoe");

exports.getWidthHeight = getWidthHeight;
function getWidthHeight(file, cb)
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
				return cb(new Error("Invalid image"));
			
			cb(null, [+matches[1], +matches[2]]);
		}
	);
}


exports.compress = compress;
function compress(input, output, lossy, cb)
{
	const extension = path.extname(input).toLowerCase().substring(1);
	if(!(["jpg", "jpeg", "png", "gif"]).contains(extension))
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
			{
				if(lossy)
					fileUtil.copy(input, tmpFile, this);
				else
					fileUtil.copy(input, output, this);
			}
			else
			{
				this();
			}
		},
		function convert()
		{
			if(extension==="png")
			{
				if(lossy)
					runUtil.run("pngquant", ["--speed", "1", tmpFile], runUtil.SILENT, this);
				else
					runUtil.run("advpng", ["-z", "-4", output], runUtil.SILENT, this);
			}
			else if(extension==="jpg" || extension==="jpeg")
			{
				if(lossy)
					runUtil.run("convert", [input, "-quality", "80%", output], runUtil.SILENT, this);
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
			
			if(extension==="png" && lossy)
			{
				fileUtil.unlink(tmpFile, this.parallel());
				fileUtil.move(tmpFile + "-fs8.png", output, this.parallel());
			}
			else
			{
				this();
			}
		},
		cb
	);
}

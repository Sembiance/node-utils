"use strict";

var base = require("@sembiance/xbase"),
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
			runUtil.run("identify", ["-quiet", file], {silent:true}, this);
		},
		function processSizes(err, result)
		{
			if(err)
				return cb(err);

			var matches = result.trim().match(/[^ ]+ [^ ]+ ([0-9]+)x([0-9]+) .*/);
			if(!matches || matches.length<3)
				cb(new Error("Invalid image"));
			else
				cb(null, [+matches[1], +matches[2]]);
		}
	);
}


exports.compress = compress;
function compress(input, output, lossy, cb)
{
	var extension = path.extname(input).toLowerCase().substring(1);
	if(!(["jpg", "jpeg", "png", "gif"]).contains(extension))
		throw new Error("Unsupported image extension: " + extension);

	var tmpFile = fileUtil.generateTempFilePath();
	var deleteInput = false;

	tiptoe(
		function checkIfInputOutputMatch()
		{
			if(input===output)
			{
				var inputTMP = fileUtil.generateTempFilePath();
				fileUtil.copy(input, inputTMP, this);
				input = inputTMP;
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
					runUtil.run("pngquant", ["--speed", "1", tmpFile], {silent:true}, this);
				else
					runUtil.run("advpng", ["-z", "-4", output], {silent:true}, this);
			}
			else if(extension==="jpg" || extension==="jpeg")
			{
				if(lossy)
					runUtil.run("convert", [input, "-quality", "80%", output], {silent:true}, this);
				else
					runUtil.run("jpegtran", ["-progressive", "-copy", "none", "-optimize", "-perfect", "-outfile", output, input], {silent:true}, this);
			}
			else if(extension==="gif")
			{
				runUtil.run("gifsicle", ["-O3", input, "-o", output], {silent:true}, this);
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
		function finish(err)
		{
			return setImmediate(function() { cb(err); });
		}
	);
}
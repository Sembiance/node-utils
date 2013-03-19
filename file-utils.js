"use strict";

var base = require("node-base"),
	fs = require("fs"),
	path = require("path"),
	util = require("util"),
	uuid = require("node-uuid"),
	tiptoe = require("tiptoe");

exports.searchReplace = searchReplace;
function searchReplace(file, match, replace, cb)
{
	tiptoe(
		function loadFile()
		{
			fs.readFile(file, "utf8", this);
		},
		function replaceAndSave(data)
		{
			fs.writeFile(file, data.replace(new RegExp(match, "g"), replace), "utf8", this);
		},
		function handleErrors(err) { cb(err); }
	);
}

exports.concat = concat;
function concat(files, dest, options, cb)
{
	if(!cb && typeof(options)==="function")
	{
		cb = options;
		options = {};
	}

	var writeSeperator = 1;

	files = files.slice();

	base.info("Combining to [%s] files: %s", dest, files.join(" "));

	var output = fs.createWriteStream(dest);

	var first = true;
	function concatNext()
	{
		if(first && options.prefix)
			output.write(options.prefix);

		if(options.filePrefixes && files.length)
			output.write(options.filePrefixes[writeSeperator-1]);

		first = false;

		if(options.seperator && (writeSeperator%2)===0)
			output.write(options.seperator);

		writeSeperator++;

		if(!files.length)
		{
			if(options.suffix)
				output.write(options.suffix);

			output.end();
			return cb();
		}

		var input = fs.createReadStream(files.shift());
		input.pipe(output, { end : false });
		input.on("end", concatNext);
	}

	concatNext();
}

exports.copy = copy;
function copy(src, dest, cb)
{
	var cbCalled = false;

	var rd = fs.createReadStream(src);
	rd.on("error", function(err) { done(err); });

	var wr = fs.createWriteStream(dest);
	wr.on("error", function(err) { done(err); });

	wr.on("close", function(ex) { done(); });
	rd.pipe(wr);

	function done(err)
	{
		if(!cbCalled)
		{
			cb(err);
			cbCalled = true;
		}
	}
}

exports.generateTempFilePath = generateTempFilePath;
function generateTempFilePath()
{
	var tempFilePath;
	var existsSync = fs.existsSync ? fs.existsSync : path.existsSync;

	do
	{
		tempFilePath = path.join("/", "tmp", uuid.v4() + ".tmp");
	} while(existsSync(tempFilePath));

	return tempFilePath;
}

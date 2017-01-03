"use strict";

var base = require("@sembiance/xbase"),
	fs = require("fs"),
	path = require("path"),
	uuid = require("uuid"),
	rimraf = require("rimraf"),
	tiptoe = require("tiptoe");

exports.searchReplace = searchReplace;
function searchReplace(file, match, replace, cb)
{
	tiptoe(
		function loadFile()
		{
			fs.readFile(file, {encoding:"utf8"}, this);
		},
		function replaceAndSave(data)
		{
			fs.writeFile(file, data.replace(new RegExp(match, "g"), replace), {encoding:"utf8"}, this);
		},
		function handleErrors(err) { setImmediate(function() { cb(err); }); }
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

exports.move = move;
function move(src, dest, cb)
{
	tiptoe(
		function checkExisting()
		{
			exports.exists(dest, this);
		},
		function removeExisting(exists)
		{
			if(exists)
				fs.unlink(dest, this);
			else
				this();
		},
		function tryRename()
		{
			this.capture();
			fs.rename(src, dest, this);
		},
		function copyFile(err)
		{
			if(!err)
				return this.finish();

			copy(src, dest, this);
		},
		function removeFile()
		{
			fs.unlink(src, this);
		},
		function handleErrors(err) { setImmediate(function() { cb(err); }); }
	);
}

exports.generateTempFilePath = generateTempFilePath;
function generateTempFilePath(prefix, suffix)
{
	var tempFilePath;
	var existsSync = fs.existsSync ? fs.existsSync : path.existsSync;
	prefix = prefix || "/tmp";

	do
	{
		tempFilePath = path.join(prefix, uuid() + (typeof suffix==="undefined" ? ".tmp" : suffix));
	} while(existsSync(tempFilePath));

	return tempFilePath;
}

exports.exists = exists;
function exists(target, cb)
{
	fs.access(target, fs.F_OK, function(err)
	{
		return cb(undefined, err ? false : true);
	});
}

exports.existsSync = existsSync;
function existsSync(target)
{
	try
	{
		fs.accessSync(target, fs.F_OK);
	}
	catch(err)
	{
		return false;
	}

	return true;
}

exports.unlink = unlink;
function unlink(target, cb)
{
	fs.exists(target, function(exists)
	{
		if(!exists)
			return setImmediate(cb);

		fs.stat(target, function(err, stats)
		{
			if(stats.isDirectory())
				rimraf(target, cb);
			else
				fs.unlink(target, cb);
		});
	});
}

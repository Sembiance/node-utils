"use strict";

const XU = require("@sembiance/xu"),
	fs = require("fs"),
	path = require("path"),
	uuid = require("uuid/v4"),
	os = require("os"),
	rimraf = require("rimraf"),
	tiptoe = require("tiptoe");

exports.generateTempFilePath = function generateTempFilePath(prefix="", suffix=".tmp")
{
	let tempFilePath = null;

	do
		tempFilePath = path.join(prefix.startsWith("/") ? "" : os.tmpdir(), prefix, uuid() + suffix);
	while(exports.existsSync(tempFilePath));

	if(!tempFilePath)
		throw new Error("Failed to create temp file path.");

	return tempFilePath;
};

exports.searchReplace = function searchReplace(file, match, replace, cb)
{
	tiptoe(
		function loadFile()
		{
			fs.readFile(file, XU.UTF8, this);
		},
		function replaceAndSave(data)
		{
			fs.writeFile(file, data.toString("utf8").replace(new RegExp(match, "g"), replace), XU.UTF8, this);
		},
		cb
	);
};

// Concatenates the _files array to dest
exports.concat = function concat(_files, dest, _options, _cb)
{
	let options = _options;
	let cb = _cb;

	if(!cb && typeof options==="function")
	{
		cb = options;
		options = {};
	}

	let writeSeperator = 1;

	const files = _files.slice();

	if(options.verbose)
		console.log("Combining to [%s] files: %s", dest, files.join(" "));

	const output = fs.createWriteStream(dest);

	let first = true;
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

		const input = fs.createReadStream(files.shift());
		input.pipe(output, { end : false });
		input.on("end", concatNext);
	}

	concatNext();
};

// Copies a file from src to dest
exports.copy = function copy(src, dest, cb)
{
	if(src===dest)
		return cb(new Error("src and dest are identical: " + src));

	let cbCalled = false;

	const rd = fs.createReadStream(src);
	rd.on("error", done);

	const wr = fs.createWriteStream(dest);
	wr.on("error", done);

	wr.on("close", () => done());
	rd.pipe(wr);

	function done(err)
	{
		if(!cbCalled)
		{
			cbCalled = true;
			return cb(err);
		}
	}
};

// Moves a file from src to dest, works even across disks
exports.move = function move(src, dest, cb)
{
	if(src===dest)
		return cb(new Error("src and dest are identical: " + src));

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

			exports.copy(src, dest, this);
		},
		function removeFile()
		{
			fs.unlink(src, this);
		},
		cb
	);
};

// Returns true if the target exists
exports.existsSync = function existsSync(target)
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
};

// Calls cb(err, true) if the target exists
exports.exists = function exists(target, cb)
{
	fs.access(target, fs.F_OK, err => cb(undefined, !err));
};

// Deletes the target from disk, if it's a directory, will remove the entire directory and all sub directories and files
exports.unlink = function unlink(target, cb)
{
	exports.exists(target, (ignored, exists) =>
	{
		if(!exists)
			return setImmediate(cb);

		fs.stat(target, (err, stats) =>
		{
			if(stats.isDirectory())
				rimraf(target, cb);
			else
				fs.unlink(target, cb);
		});
	});
};

// Returns the first letter of a file that can be used for dir breaking up
exports.getFirstLetterDir = function getFirstLetterDir(filePath)
{
	const firstLetter = filePath.charAt(0).toLowerCase();

	// Return the first letter if it's 'a' through 'z'
	if([].pushSequence(97, 122).map(v => String.fromCharCode(v)).includes(firstLetter))
		return firstLetter;
	
	// If the first letter is a number, return '0'
	if([].pushSequence(0, 9).map(v => ("" + v)).includes(firstLetter))
		return "0";
	
	// Otherwise return underscore
	return "_";
};

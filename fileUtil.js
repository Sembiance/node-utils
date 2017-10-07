"use strict";

const base = require("@sembiance/xbase"),
	fs = require("fs"),
	path = require("path"),
	uuid = require("uuid"),
	os = require("os"),
	rimraf = require("rimraf"),
	tiptoe = require("tiptoe");

exports.searchReplace = function searchReplace(file, match, replace, cb)
{
	tiptoe(
		function loadFile()
		{
			fs.readFile(file, base.UTF8, this);
		},
		function replaceAndSave(data)
		{
			fs.writeFile(file, data.replace(new RegExp(match, "g"), replace), base.UTF8, this);
		},
		cb
	);
};

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

exports.copy = function copy(src, dest, cb)
{
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

exports.move = function move(src, dest, cb)
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

			exports.copy(src, dest, this);
		},
		function removeFile()
		{
			fs.unlink(src, this);
		},
		cb
	);
};

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

exports.generateTempFilePath = function generateTempFilePath(prefix="", suffix=".tmp")
{
	let tempFilePath = null;

	do
		tempFilePath = path.join(os.tmpdir(), prefix, uuid() + suffix);
	while(exports.existsSync(tempFilePath));

	if(!tempFilePath)
		throw new Error("Failed to create temp file path.");

	return tempFilePath;
};

exports.exists = function exists(target, cb)
{
	fs.access(target, fs.F_OK, err => cb(undefined, !err));
};

exports.unlink = function unlink(target, cb)
{
	exports.exists(target, (na, exists) =>
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

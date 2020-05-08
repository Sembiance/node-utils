"use strict";

const XU = require("@sembiance/xu"),
	fs = require("fs"),
	path = require("path"),
	uuid = require("uuid/v4"),
	os = require("os"),
	runUtil = require("./runUtil.js"),
	progressStream = require("progress-stream"),
	rimraf = require("rimraf"),		// eslint-disable-line
	tiptoe = require("tiptoe");

// Returns an array of possible identifications of this file type based on the output from `trid`
exports.identify = function identify(filePath, cb)
{
	tiptoe(
		function runTrid()
		{
			runUtil.run("file", ["-m", "/usr/share/misc/magic.mgc:/mnt/compendium/sys/magic/my-magic", "-b", filePath], runUtil.SILENT, this.parallel());
			runUtil.run("file", ["-m", "/usr/share/misc/magic.mgc:/mnt/compendium/sys/magic/my-magic", "-b", "--extension", filePath], runUtil.SILENT, this.parallel());
			runUtil.run("tridid", ["--jsonOutput", filePath], runUtil.SILENT, this.parallel());
			runUtil.run("fido", ["-q", "-noextension", "-matchprintf", "%(info.formatname)s", filePath], runUtil.SILENT, this.parallel());
		},
		function parseResults(magicRaw, magicExtensionsRaw, trididRaw, fidoRaw)
		{
			const results = [];

			const magicResult = {magic : magicRaw.trim(), from : "file"};
			if(magicExtensionsRaw && magicExtensionsRaw.length>0 && magicExtensionsRaw.trim()!=="???")
				magicResult.extensions = magicExtensionsRaw.trim().toLowerCase().split("/").map(ext => (ext.charAt(0)==="." ? "" : ".") + ext).filter(ext => ext!==".???");
			results.push(magicResult);

			results.push(...JSON.parse(trididRaw).map(v => { v.from = "trid"; return v; }));

			if(fidoRaw && fidoRaw.trim().length>0)
				results.push({magic : fidoRaw.trim(), from : "fido"});

			return results.multiSort(match => (match.percentage || 0), true);
		},
		cb
	);
};

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

// Creates the given dirPath and all parent directories. If already there, doesn't throw error
exports.mkdirp = function mkdirp(dirPath, cb)
{
	let builtPath = "";

	dirPath.split(path.sep).serialForEach((dirPart, subcb) =>
	{
		builtPath += (builtPath.endsWith(path.sep) ? "" : path.sep) + dirPart;
		exports.exists(builtPath, (err, exists) =>
		{
			if(!exists)
				fs.mkdir(builtPath, () => setImmediate(subcb));
			else
				setImmediate(subcb);
		});
	}, cb);
};

// Creates the given dirPath and all parent directories. If already there, doesn't throw error. Sync version.
exports.mkdirpSync = function mkdirpSync(dirPath)
{
	let builtPath = "";

	dirPath.split(path.sep).forEach(dirPart =>
	{
		builtPath += (builtPath.endsWith(path.sep) ? "" : path.sep) + dirPart;
		if(!exports.existsSync(builtPath))
			fs.mkdirSync(builtPath);
	});
};

// Concatenates the _files array to dest
// suffix : Text to add to end of file
exports.concat = function concat(_files, dest, _options, _cb)
{
	const {options, cb} = XU.optionscb(_options, _cb);

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
				output.write(options.suffix, () => output.end(cb));
			else
				output.end(cb);
			
			return;
		}

		const input = fs.createReadStream(files.shift());
		input.pipe(output, { end : false });
		input.on("end", concatNext);
	}

	concatNext();
};

// Copies a file from src to dest
exports.copy = function copy(src, dest, _options, _cb)
{
	const {options, cb} = XU.optionscb(_options, _cb, {});

	if(src===dest)
		return cb(new Error("src and dest are identical: " + src));

	let cbCalled = false;

	const rd = fs.createReadStream(src);
	rd.on("error", done);

	const wr = fs.createWriteStream(dest);
	wr.on("error", done);

	wr.on("close", () => done());
	if(options.progressBar)
		rd.pipe(progressStream({time : 100}, progress => options.progressBar.tick(progress.delta))).pipe(wr);
	else
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
			if(!stats)
				return setImmediate(cb);
				
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

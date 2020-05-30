"use strict";

const XU = require("@sembiance/xu"),
	fs = require("fs"),
	path = require("path"),
	os = require("os"),
	{performance} = require("perf_hooks"),
	globModule = require("glob"),	// eslint-disable-line node/no-restricted-require
	runUtil = require("./runUtil.js"),
	tiptoe = require("tiptoe");

// Glob has many built in issues, which is probably why the author wants to rewrite it: https://github.com/isaacs/node-glob/issues/405
// This wrapper is an attempt to fix some of the issues that I myself have run into when using glob. sigh.
exports.glob = function glob(baseDirPath, matchPattern, _options, _cb)
{
	const {options, cb} = XU.optionscb(_options, _cb, {});

	// We always set dot to true, because it's not really obvious that it's going to exclude some files just because they start with a period
	// We also set the 'cwd' to the baseDirPath. Without this, if baseDirPath was part of the match pattern many characters would need to be manually escaped like brackets, question marks and other regex-like patterns.
	const globOptions = Object.assign({dot : true, cwd : baseDirPath}, options);
	globModule(matchPattern, globOptions, (err, results) =>
	{
		if(err)
			return setImmediate(() => cb(err));
		
		// Since we changed our cwd, we need to resolve our results relative to that
		cb(undefined, results.map(v => path.resolve(path.join(baseDirPath, v))));
	});
};

// Returns an array of possible identifications of this file type based on the output from `trid`
exports.identify = function identify(filePath, cb)
{
	tiptoe(
		function runIndentifiers()
		{
			runUtil.run("file", ["-m", "/mnt/compendium/sys/magic/my-magic.mgc", "-b", filePath], runUtil.SILENT, this.parallel());
			runUtil.run("tridid", ["--jsonOutput", filePath], runUtil.SILENT, this.parallel());
			runUtil.run("fido", ["-q", "-noextension", "-matchprintf", "%(info.formatname)s", filePath], runUtil.SILENT, this.parallel());
		},
		function parseResults(magicRaw, trididRaw, fidoRaw)
		{
			const results = [{magic : magicRaw.trim(), from : "file"}];

			try { results.push(...JSON.parse(trididRaw).map(v => { v.from = "trid"; return v; })); }
			catch(parseErr) { }

			const fido = (fidoRaw || "").trim();
			if(fido.length>0)
				results.push({magic : fido, from : "fido"});

			return results.multiSort(match => (match.percentage || 0), true);
		},
		cb
	);
};

exports.generateTempFilePath = function generateTempFilePath(prefix="", suffix=".tmp")
{
	let tempFilePath = null;
	const filePathPrefix = path.join(prefix.startsWith("/") ? "" : os.tmpdir(), prefix);

	do
		tempFilePath = path.join(filePathPrefix, ((""+performance.now()).replaceAll(".", "") + Math.randomInt(0, 1000000)) + suffix);
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

// Copies a directory recursively from srcDirPath to destDirPath
exports.copyDirSync = function copyDirSync(srcDirPath, destDirPath)
{
	if(!exports.existsSync(destDirPath))
		fs.mkdirSync(destDirPath);
	
	if(fs.lstatSync(srcDirPath).isDirectory())
	{
		fs.readdirSync(srcDirPath).forEach(subFilename =>
		{
			const srcDirSubFilePath = path.join(srcDirPath, subFilename);
			if(fs.lstatSync(srcDirSubFilePath).isDirectory())
				exports.copyDirSync(srcDirSubFilePath, path.join(destDirPath, subFilename));
			else
				fs.copyFileSync(srcDirSubFilePath, path.join(destDirPath, subFilename));
		});
	}
};

exports.copyDir = function copyDir(srcDirPath, destDirPath, cb)
{
	tiptoe(
		function collectInfo()
		{
			exports.exists(destDirPath, this.parallel());
			fs.lstat(srcDirPath, this.parallel());
		},
		function makeDirIfNeeded(destDirExists, srcDirStat)
		{
			if(!srcDirStat.isDirectory())
				return this.finish();

			if(!destDirExists)
				fs.mkdir(destDirPath, this);
			else
				this();
		},
		function readSrcDir()
		{
			fs.readdir(srcDirPath, this);
		},
		function copyFilesAndDirs(srcDirFilenames)
		{
			srcDirFilenames.serialForEach((srcDirFilename, subcb) =>
			{
				const srcDirSubFilePath = path.join(srcDirPath, srcDirFilename);
				if(fs.lstatSync(srcDirSubFilePath).isDirectory())
					exports.copyDir(srcDirSubFilePath, path.join(destDirPath, srcDirFilename), subcb);
				else
					fs.copyFile(srcDirSubFilePath, path.join(destDirPath, srcDirFilename), subcb);
			}, this);
		},
		cb
	);
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

			fs.copyFile(src, dest, this);
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
				fs.rmdir(target, {recursive : true}, cb);
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

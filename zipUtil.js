"use strict";

const XU = require("@sembiance/xu"),
	tiptoe = require("tiptoe"),
	fs = require("fs"),
	mkdirp = require("mkdirp"),
	fileUtil = require("./fileUtil.js"),
	runUtil = require("./runUtil.js"),
	path = require("path"),
	yauzl = require("yauzl");

// Will read the entries in the given zipFile (Buffer or string path) and call entryChecker(entry) and every time it returns true it will call fileHandler(entry, entryData) and call cb(err, allEntries) when all done
// entryChecker and fileHandler can be null if you don't want to filter out entries or be called for ever file
exports.readZipEntries = function readZipEntries(zipPath, entryChecker, fileHandler, cb)
{
	const zipEntries = [];
	const zipEntriesData = [];

	tiptoe(
		function openZip()
		{
			yauzl[(typeof zipPath==="string" ? "open" : "fromBuffer")](zipPath, { lazyEntries : true }, this);
		},
		function readEntries(zipFile)
		{
			zipFile.once("end", this);
			zipFile.on("entry", entry =>
			{
				if(typeof entryChecker==="function" && !entryChecker(entry))
					return setImmediate(() => zipFile.readEntry());
				
				const chunks = [];
				zipFile.openReadStream(entry, (err, readStream) =>
				{
					if(err)
						return this(err);

					zipEntries.push(entry);
					
					readStream.on("error", readStreamErr => this(readStreamErr));
					readStream.on("data", chunk => chunks.push(chunk));
					readStream.once("end", () =>
					{
						const entryData = Buffer.concat(chunks);
						zipEntriesData.push(entryData);

						if(typeof fileHandler==="function")
							fileHandler(entry, entryData);
						zipFile.readEntry();
					});
					readStream.read(entry.uncompressedSize);
				});
			});

			zipFile.readEntry();
		},
		function returnResult(err)
		{
			cb(err, zipEntries, zipEntriesData);
		}
	);
};

// Unzip a given zip file into the given unzipPath
exports.unzip = function unzip(zipPath, unzipPath, cb)
{
	tiptoe(
		function openZip()
		{
			yauzl[(typeof zipPath==="string" ? "open" : "fromBuffer")](zipPath, { lazyEntries : true }, this);
		},
		function readEntries(zipFile)
		{
			zipFile.once("end", this);
			zipFile.on("entry", entry =>
			{
				zipFile.openReadStream(entry, (err, readStream) =>
				{
					if(err)
						return this(err);
					
					readStream.once("end", () => zipFile.readEntry());

					const entryOutFilePath = path.join(unzipPath, entry.fileName);
					if(entry.uncompressedSize===0)
						return zipFile.readEntry();
						
					mkdirp(path.dirname(entryOutFilePath), suberr =>
					{
						if(suberr)
							this(suberr);
						
						readStream.pipe(fs.createWriteStream(entryOutFilePath, { flags : "w", encoding : "binary" }));
					});
				});
			});

			zipFile.readEntry();
		},
		cb
	);
};

// Will zip the given filePaths into zipPath
// Can rename files on the fly with renameMap and can set the cwd in options as well
exports.zipFiles = function zipFiles(_filePaths, zipPath, options, cb)
{
	if(!cb)
	{
		cb = options;	// eslint-disable-line no-param-reassign
		options = { };	// eslint-disable-line no-param-reassign
	}

	const filePaths = _filePaths.slice();

	tiptoe(
		function createRenameDir()
		{
			if(!options.renameMap)
				return this();

			this.data.tmpRenameDir = fileUtil.generateTempFilePath();

			fs.mkdir(this.data.tmpRenameDir, this);
		},
		function copyFiles()
		{
			if(!options.renameMap)
				return this();
			
			filePaths.parallelForEach((filePath, subcb, i) =>
			{
				const renameTo = options.renameMap[path.basename(filePath)];
				if(!renameTo)
					return setImmediate(subcb);

				const destFilePath = path.join(this.data.tmpRenameDir, renameTo);
				filePaths[i] = destFilePath;
				
				fileUtil.copy(path.join((options.cwd || ""), filePath), destFilePath, subcb);
			}, this);
		},
		function createZip()
		{
			const cwd = options.cwd || path.dirname(filePaths[0]);
			const zipArgs = ["-r"];
			if(options.junkPaths)
				zipArgs.push("-j");
			zipArgs.push(zipPath, ...filePaths);

			runUtil.run("zip", zipArgs, { cwd, silent : true }, this);
		},
		function cleanupTmpDir()
		{
			if(!options.renameMap)
				return this();

			fileUtil.unlink(this.data.tmpRenameDir, this);
		},
		cb
	);
};

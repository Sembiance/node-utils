"use strict";

const XU = require("@sembiance/xu"),
	tiptoe = require("tiptoe"),
	fs = require("fs"),
	fileUtil = require("./fileUtil.js"),
	runUtil = require("./runUtil.js"),
	path = require("path");

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
				
				fs.copyFile(path.join((options.cwd || ""), filePath), destFilePath, subcb);
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

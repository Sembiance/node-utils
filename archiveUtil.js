"use strict";

const XU = require("@sembiance/xu"),
	tiptoe = require("tiptoe"),
	fs = require("fs"),
	fileUtil = require("./fileUtil.js"),
	unicodeUtil = require("./unicodeUtil.js"),
	glob = require("glob"),
	runUtil = require("./runUtil.js"),
	path = require("path");

const RAM_DIR = "/mnt/ram";

function tscompExtract(filePath, extractionPath, cb)
{
	const WORK_DIR = fileUtil.generateTempFilePath(RAM_DIR);

	tiptoe(
		function createWorkDir()
		{
			fileUtil.mkdirp(WORK_DIR, this);
		},
		function copyArchiveToWorkDir()
		{
			fs.writeFile(path.join(WORK_DIR, "list.bat"), ["@echo off", "C:\\TSCOMP -l " + path.basename(filePath), ""].join("\n"), XU.UTF8, this.parallel());
			fileUtil.copy(filePath, path.join(WORK_DIR, path.basename(filePath)), this.parallel());
		},
		function getFilename()
		{
			runUtil.run("dosemu", ["-dumb", "list.bat"], {silent : true, env : {DOSDRIVE_D : WORK_DIR}}, this);
		},
		function saveFilename(tscompOutput)
		{
			this.data.tscompFilename = tscompOutput.split("\n").filter(line => line.trim().startsWith("=>"))[0].trim().substring(2).trim();
			fs.writeFile(path.join(WORK_DIR, "expand.bat"), ["@echo off", "cd D:", "C:\\TSCOMP -d " + path.basename(filePath) + " " + this.data.tscompFilename.toLowerCase(), ""].join("\n"), XU.UTF8, this);
		},
		function performExtraction()
		{
			runUtil.run("dosemu", ["-dumb", "expand.bat"], {silent : true, env : {DOSDRIVE_D : WORK_DIR}}, this);
		},
		function copyToDestination()
		{
			fileUtil.move(path.join(WORK_DIR, this.data.tscompFilename.toLowerCase()), path.join(extractionPath, this.data.tscompFilename), this);
		},
		function cleanup()
		{
			fileUtil.unlink(WORK_DIR, this);
		},
		cb
	);
}

function pcxlibExtract(filePath, extractionPath, cb)
{
	const WORK_DIR = fileUtil.generateTempFilePath(RAM_DIR);

	tiptoe(
		function createWorkDir()
		{
			fileUtil.mkdirp(WORK_DIR, this);
		},
		function copyArchiveToWorkDir()
		{
			fs.writeFile(path.join(WORK_DIR, "expand.bat"), ["@echo off", "C:\\PCXLIB " + path.basename(filePath) + " /X", ""].join("\n"), XU.UTF8, this.parallel());
			fileUtil.copy(filePath, path.join(WORK_DIR, path.basename(filePath)), this.parallel());
		},
		function performExtraction()
		{
			runUtil.run("dosemu", ["-dumb", "expand.bat"], {silent : true, env : {DOSDRIVE_D : WORK_DIR}}, this);
		},
		function removeWorkFiles()
		{
			fileUtil.unlink(path.join(WORK_DIR, "expand.bat"), this.parallel());
			fileUtil.unlink(path.join(WORK_DIR, path.basename(filePath)), this.parallel());
		},
		function findExtractedFiles()
		{
			glob(path.join(WORK_DIR, "*"), this);
		},
		function copyToDestination(extractedFiles)
		{
			(extractedFiles || []).parallelForEach((extractedFile, subcb) => fileUtil.copy(extractedFile, path.join(extractionPath, path.basename(extractedFile)), subcb), this);
		},
		function cleanup()
		{
			fileUtil.unlink(WORK_DIR, this);
		},
		cb
	);
}

function mscompressExtract(filePath, extractionPath, cb)
{
	const WORK_DIR = fileUtil.generateTempFilePath(RAM_DIR);
	const underscoreFilename = path.basename(filePath) + (filePath.endsWith("_") ? "" : "_");
	const noUnderscoreFilename = underscoreFilename.substring(0, underscoreFilename.length-1);

	tiptoe(
		function createWorkDir()
		{
			fileUtil.mkdirp(WORK_DIR, this);
		},
		function copyFileToWorkDirWithUnderscoreSuffix()
		{
			fileUtil.copy(filePath, path.join(WORK_DIR, underscoreFilename), this);
		},
		function performExtraction()
		{
			runUtil.run("msexpand", [path.join(WORK_DIR, underscoreFilename)], runUtil.SILENT, this);
		},
		function moveFiles()
		{
			fileUtil.move(path.join(WORK_DIR, noUnderscoreFilename), path.join(extractionPath, noUnderscoreFilename), this);
		},
		function cleanup()
		{
			fileUtil.unlink(WORK_DIR, this);
		},
		cb
	);
}

// Extracts the files in the given filePath if supported
exports.extract = function extract(archiveType, filePath, extractionPath, cb)
{
	const filenameWithExt = path.basename(filePath);
	const ext = path.extname(filenameWithExt);
	
	tiptoe(
		function getBeforeFiles()
		{
			glob(path.join(extractionPath, "**"), {nodir : true}, this);
		},
		function extractFiles(beforeFiles)
		{
			this.data.beforeFiles = beforeFiles.subtractAll(extractionPath);

			switch(archiveType)
			{
				case "zip":
					runUtil.run("unzip", ["-qod", extractionPath, "-P", "nopasswd", filePath], runUtil.SILENT, this);	// By passing a password to -P it avoids the program hanging when a file requires a password
					break;
				case "iso":
					runUtil.run("uniso", [filePath, extractionPath], runUtil.SILENT, this);
					break;
				case "lha":
					runUtil.run("lha", ["-x", "-w=" + extractionPath, filePath], runUtil.SILENT, this);
					break;
				case "arc":
					runUtil.run("arc", ["x", filePath], {cwd : extractionPath, silent : true}, this);
					break;
				case "lbr":
					runUtil.run("lbrate", [filePath], {cwd : extractionPath, silent : true}, this);
					break;
				case "rar":
					runUtil.run("unrar", ["x", "-p-", filePath, extractionPath], runUtil.SILENT, this);
					break;
				case "mscompress":
					mscompressExtract(filePath, extractionPath, this);
					break;
				case "tscomp":
					tscompExtract(filePath, extractionPath, this);
					break;
				case "pcxlib":
					pcxlibExtract(filePath, extractionPath, this);
					break;
				case "ico":
					runUtil.run("convert", [filePath, path.join(extractionPath, filenameWithExt + ".png")], runUtil.SILENT, this);
					break;
				case "powerpack":
					runUtil.run("ppunpack", [filePath, path.join(extractionPath, (ext===".pp" ? path.basename(filenameWithExt, ext) : (filenameWithExt + ".unpacked")))], runUtil.SILENT, this);
					break;

				default:
					return cb(new Error("Unsuported archive type " + archiveType + " for file: " + filePath));
			}
		},
		function fixPermissions()
		{
			runUtil.run("fixPerms", [], {silent : true, cwd : extractionPath}, this);
		},
		function fixEncodings()
		{
			// Encodings out of archives can often be in something other than UTF-8. So we convert to UTF8 so that glob actually WORKS, as v8 chokes on anything other than UTF8 encoded filenames/dirs
			unicodeUtil.fixDirEncodings(extractionPath, this);
		},
		function getAfterFiles()
		{
			glob(path.join(extractionPath, "**"), {nodir : true}, this);
		},
		function returnResults(err, afterFiles)
		{
			if(err)
				return cb(err);

			cb(undefined, afterFiles.subtractAll([extractionPath, ...this.data.beforeFiles]).map(v => path.relative(extractionPath, v)).filterEmpty());
		}
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

"use strict";

const XU = require("@sembiance/xu"),
	tiptoe = require("tiptoe"),
	fs = require("fs"),
	fileUtil = require("./fileUtil.js"),
	unicodeUtil = require("./unicodeUtil.js"),
	{DOS} = require("./dosUtil.js"),
	runUtil = require("./runUtil.js"),
	path = require("path");

const RAM_DIR = "/mnt/ram";

// Extracts the files in the given filePath if supported
exports.extract = function extract(archiveType, filePath, extractionPath, cb)
{
	const filenameWithExt = path.basename(filePath);
	const filenameWithExtPath = "./" + filenameWithExt;	// We do this to get around problems with files that start with a dash -
	const filenameWithoutExt = path.basename(filenameWithExt, path.extname(filenameWithExt));
	const ext = path.extname(filenameWithExt);
	const runOptions = {silent : true, cwd : path.dirname(filePath), timeout : XU.MINUTE*30};
	const relativeToExtractionPath = [path.relative(runOptions.cwd, extractionPath), extractionPath].multiSort(a => a.length)[0];	// Pick whichever arg is shorter to avoid "argument loo longer" errors
	
	tiptoe(
		function getBeforeFiles()
		{
			fileUtil.glob(extractionPath, "**", {nodir : true}, this);
		},
		function extractFiles(beforeFiles)
		{
			this.data.beforeFiles = beforeFiles.subtractAll(extractionPath);

			switch(archiveType)
			{
				case "zip":
					runUtil.run("unzip", ["-qod", relativeToExtractionPath, "-P", "nopasswd", filenameWithExtPath], runOptions, this);	// By passing a password to -P it avoids the program hanging when a file requires a password
					break;
				case "iso":
					runUtil.run("uniso", [filenameWithExtPath, relativeToExtractionPath], runOptions, this);
					break;
				case "lha":
					runUtil.run("lha", ["-x", "-w=" + relativeToExtractionPath, filenameWithExtPath], runOptions, this);
					break;
				case "arc":
					runUtil.run("arc", ["x", path.relative(extractionPath, filePath)], {cwd : extractionPath, silent : true}, this);
					break;
				case "rsrc":
					runUtil.run("deark", ["-od", relativeToExtractionPath, "-o", path.basename(filePath, path.extname(filePath)), filenameWithExtPath], runOptions, this);	// Can pass this to RAW extract all resources: -opt macrsrc:extractraw
					break;
				case "lbr":
					runUtil.run("lbrate", [path.relative(extractionPath, filePath)], {cwd : extractionPath, silent : true}, this);
					break;
				case "rar":
					runUtil.run("unrar", ["x", "-p-", filenameWithExtPath, relativeToExtractionPath], runOptions, this);
					break;
				case "ico":
					runUtil.run("convert", [filenameWithExtPath, path.join(relativeToExtractionPath, filenameWithExt + ".png")], runOptions, this);
					break;
				case "tar":
					runUtil.run("tar", ["-xf", filenameWithExtPath, "-C", relativeToExtractionPath], runOptions, this);
					break;
				case "ttcomp":
					runUtil.run("ttdecomp", [filenameWithExtPath, path.join(relativeToExtractionPath, filenameWithoutExt)], runOptions, this);
					break;
				case "adfOFS":
					runUtil.run("extract-adf", ["-a", path.relative(extractionPath, filePath)], {cwd : extractionPath, silent : true}, this);
					break;
				case "adfFFS":
					runUtil.run("xdftool", [filenameWithExtPath, "unpack", relativeToExtractionPath], runOptions, this);
					break;
				case "stc":
				case "xpk":
					runUtil.run("amigadepacker", ["-o", path.join(relativeToExtractionPath, (ext===("." + archiveType) ? path.basename(filenameWithExt, ext) : filenameWithoutExt)), filenameWithExtPath], runOptions, this);
					break;
				case "pcxlib":
					runUtil.run("unpcx", [filenameWithExtPath, relativeToExtractionPath], runOptions, this);
					break;
				case "powerpack":	// was before: app-arch/ppunpack  runUtil.run("ppunpack", [filePath, path.join(extractionPath, (ext===".pp" ? path.basename(filenameWithExt, ext) : filenameWithoutExt))], runUtil.SILENT, this);
				case "dms":
				case "lzx":
				case "sit":
					unarExtract(filePath, extractionPath, (archiveType==="powerpack" ? ".pp" : "." + archiveType), this);
					break;
				case "gz":
					extractWithCommandAndSuffix("gunzip", ".gz", filePath, extractionPath, this);
					break;
				case "bz2":
					extractWithCommandAndSuffix("bunzip2", ".bz2", filePath, extractionPath, this);
					break;
				case "mscompress":
					extractWithCommandAndSuffix("msexpand", "_", filePath, extractionPath, this);
					break;
				case "amos":
					amosExtract(filePath, extractionPath, this);
					break;
				case "tscomp":
					tscompExtract(filePath, extractionPath, this);
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
			fileUtil.glob(extractionPath, "**", {nodir : true}, this);
		},
		function returnResults(err, afterFiles)
		{
			if(err)
				return cb(err);

			cb(undefined, afterFiles.subtractAll([extractionPath, ...this.data.beforeFiles]).map(v => path.relative(extractionPath, v)).filterEmpty());
		}
	);
};

// unary doesn't handle filenames with strange characters very well. So we temporarily create a nice boring filename for it to use and then convert it back on the other side
function unarExtract(filePath, extractionPath, extension, cb)
{
	const tmpDirPath = fileUtil.generateTempFilePath("/mnt/ram/archiveUtil-unar");
	const tmpExtractionPath = path.join(tmpDirPath, "out");
	const tmpArchiveName = "wip" + extension;

	tiptoe(
		function mkTmpExtractionPath()
		{
			fs.mkdir(tmpExtractionPath, {recursive : true}, this);
		},
		function copyFileOver()
		{
			fs.copyFile(filePath, path.join(tmpDirPath, tmpArchiveName), this);
		},
		function runUnar()
		{
			runUtil.run("unar", ["-f", "-D", "-o", "out", tmpArchiveName], {silent : true, cwd : tmpDirPath}, this);
		},
		function checkOutputFiles()
		{
			fileUtil.glob(tmpExtractionPath, "**", {nodir : true}, this);
		},
		function renameSingleFileIfNeeded(outFilePaths)
		{
			if(outFilePaths.length>1)
				return this();
			
			const outFilename = path.basename(outFilePaths[0]);
			if(outFilename==="wip")
				fs.rename(path.join(tmpExtractionPath, outFilename), path.join(tmpExtractionPath, path.basename(filePath, path.extname(filePath))), this);
			else if(path.basename(outFilename, path.extname(outFilename))==="wip")
				fs.rename(path.join(tmpExtractionPath, outFilename), path.join(tmpExtractionPath, path.basename(filePath, path.extname(filePath)) + path.extname(outFilename)), this);
			else
				this();
		},
		function copyResultsOver()
		{
			fileUtil.copyDir(tmpExtractionPath, extractionPath, this);
		},
		function cleanup()
		{
			fileUtil.unlink(tmpDirPath, this);
		},
		cb
	);
}

// Extracts SINGLE files only, like gunzip
function extractWithCommandAndSuffix(command, suffix, filePath, extractionPath, cb)
{
	const WORK_DIR = fileUtil.generateTempFilePath(RAM_DIR);
	const filenameWithSuffix = path.basename(filePath) + (filePath.endsWith(suffix) ? "" : suffix);
	const filenameWithSuffixPath = "./" + filenameWithSuffix;
	const filenameWithoutSuffix = path.basename(filenameWithSuffix, suffix);
	
	tiptoe(
		function createWorkDir()
		{
			fs.mkdir(WORK_DIR, {recursive : true}, this);
		},
		function copyFileToWorkDirWithSuffix()
		{
			fs.copyFile(filePath, path.join(WORK_DIR, filenameWithSuffix), this);
		},
		function performExtraction()
		{
			runUtil.run(command, [filenameWithSuffixPath], {silent : true, cwd : WORK_DIR}, this);
		},
		function moveFiles()
		{
			fileUtil.move(path.join(WORK_DIR, filenameWithoutSuffix), path.join(extractionPath, filenameWithoutSuffix), this);
		},
		function cleanup()
		{
			fileUtil.unlink(WORK_DIR, this);
		},
		cb
	);
}

function amosExtract(filePath, extractionPath, cb)
{
	const filename = path.basename(filePath);
	const relativeToFilePath = [path.relative(extractionPath, filePath), filePath].multiSort(v => v.length)[0];
	
	tiptoe(
		function performExtraction()
		{
			runUtil.run("listamos", [relativeToFilePath], {silent : true, cwd : extractionPath}, this.parallel());
			runUtil.run("dumpamos", [relativeToFilePath], {silent : true, cwd : extractionPath}, this.parallel());
		},
		function saveSourceCode(sourceCodeRaw)
		{
			const sourceCode = (sourceCodeRaw || "").trim();
			if(sourceCode.length===0 || sourceCode.endsWith("not an AMOS source file"))
				return this();

			fs.writeFile(path.join(extractionPath, filename + "_sourceCode"), sourceCodeRaw.trim(), XU.UTF8, this);
		},
		cb
	);
}

function tscompExtract(filePath, extractionPath, cb)
{
	const dos = new DOS();
	const safeDOSFile = "COMPRESD.TSC";

	tiptoe(
		function setup()
		{
			dos.setup(this);
		},
		function copyArchiveToHD()
		{
			dos.copyToHD(filePath, path.join("WORK", safeDOSFile), this);
		},
		function prepareListCmd()
		{
			dos.autoExec(["C:\\APP\\TSCOMP.EXE -l C:\\WORK\\" + safeDOSFile + " > C:\\TMP\\TSFILES.TXT"], this);
		},
		function readFileList()
		{
			dos.readFromHD("TMP/TSFILES.TXT", this);
		},
		function prepareExtractCmd(tscompOutput)
		{
			this.data.tscompFilenames = tscompOutput.toString("utf8").split("\n").filter(line => line.trim().startsWith("=>")).map(line => line.trim().substring(2));

			dos.autoExec(["cd WORK", ...this.data.tscompFilenames.map(fn => "C:\\APP\\TSCOMP.EXE -d " + safeDOSFile + " " + fn)], this);
		},
		function copyFileResults()
		{
			dos.copyFromHD(this.data.tscompFilenames.map(fn => path.join("WORK", fn)), extractionPath, this);
		},
		function cleanup()
		{
			dos.teardown(this);
		},
		cb
	);
}

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

"use strict";

const XU = require("@sembiance/xu"),
	tiptoe = require("tiptoe"),
	fs = require("fs"),
	path = require("path"),
	runUtil = require("./runUtil"),
	archiveUtil = require("./archiveUtil"),
	fileUtil = require("./fileUtil");

const WINE_DIR_PATH = path.join(__dirname, "wine");

// AUTOIT DOCS: https://www.autoitscript.com/autoit3/docs/functions.htm

exports.runWine = function runWine({cmd, args, debug, delay=XU.SECOND*5, timeout=XU.MINUTE*10, autoItScript}, cb)
{
	const portNumFilePath = fileUtil.generateTempFilePath("/mnt/ram/tmp");
	const autoItScriptFilePath = fileUtil.generateTempFilePath("/mnt/ram/tmp", ".au3");
	const winePrefixDirPath = fileUtil.generateTempFilePath("/mnt/ram/tmp");

	tiptoe(
		function createWinePrefixDir()
		{
			fs.mkdir(winePrefixDirPath, {recursive : true}, this);
		},
		function extractEnv()
		{
			archiveUtil.extract("tar", path.join(WINE_DIR_PATH, "env.tar"), winePrefixDirPath, this);
		},
		function launchWine()
		{
			const runArgs = {detached : true, virtualX : true, silent : !debug, virtualXPortNumFile : portNumFilePath, timeout, env : {WINEPREFIX : winePrefixDirPath}};
			if(debug)
			{
				runArgs.recordVirtualX = fileUtil.generateTempFilePath("/mnt/ram/tmp", ".mp4");
				XU.log`Saving debug video to: ${runArgs.recordVirtualX}`;
			}

			runUtil.run("wine", [cmd, ...Array.force(args)], runArgs, this);
		},
		function delayActions(wineCP)
		{
			this.data.wineCP = wineCP;

			setTimeout(this, delay);
		},
		function executeAutoItScript()
		{
			if(!autoItScript)
				return this();
			
			fs.writeFileSync(autoItScriptFilePath, autoItScript, XU.UTF8);

			const xPortNum = fs.readFileSync(portNumFilePath, XU.UTF8).trim();

			runUtil.run("wine", [path.join(WINE_DIR_PATH, "AutoIt3", "AutoIt3.exe"), autoItScriptFilePath], {silent : true, env : {"DISPLAY" : ":" + xPortNum, WINEPREFIX : winePrefixDirPath}}, this);
		},
		function waitForProcess()
		{
			this.data.wineCP.on("exit", this);
		},
		function cleanup()
		{
			if(fileUtil.existsSync(autoItScriptFilePath))
				fileUtil.unlink(autoItScriptFilePath, this.parallel());

			fileUtil.unlink(portNumFilePath, this.parallel());
			fileUtil.unlink(winePrefixDirPath, this.parallel());
		},
		cb
	);
};

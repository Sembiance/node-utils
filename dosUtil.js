"use strict";

const XU = require("@sembiance/xu"),
	tiptoe = require("tiptoe"),
	fs = require("fs"),
	runUtil = require("./runUtil"),
	videoUtil = require("./videoUtil"),
	os = require("os"),
	fileUtil = require("./fileUtil"),
	path = require("path");

// Resources for controlling dosbox more via xdotool through xvfb:
// https://unix.stackexchange.com/questions/259294/use-xvfb-to-automate-x-program
// https://stackoverflow.com/questions/5094389/automation-using-xdotool-and-xvfb

const C_DIR_PATH = path.join(__dirname, "dos", "c");

class DOS
{
	constructor({dosCWD=path.join(__dirname, "dos", "msdos622"), autoExec=[], debug=false, recordVideoFilePath=null, timeout=XU.MINUTE*10, tmpDirPath=os.tmpdir()}={})
	{
		this.dosCWD = dosCWD;
		this.tmpDirPath = tmpDirPath;
		this.masterConfigFilePath = path.join(__dirname, "dos", "dosbox.conf");
		this.autoExec = autoExec;
		this.dosBoxCP = null;
		this.autoExecVanilla = null;
		this.exitCallbacks = [];
		this.timeout = timeout;
		this.debug = debug;
		if(recordVideoFilePath)
			this.recordVideoFilePath = recordVideoFilePath;
	}

	// Will create a temporary directory in RAM and copy the master HD image and config file over
	setup(cb)
	{
		this.workDir = fileUtil.generateTempFilePath(this.tmpDirPath);
		this.configFilePath = path.join(this.workDir, path.basename(this.masterConfigFilePath));
		this.portNumFilePath = fileUtil.generateTempFilePath(this.tmpDirPath);

		const self=this;
		tiptoe(
			function mkWorkDir()
			{
				fs.mkdir(self.workDir, {recursive : true}, this);
			},
			function copyConfig()
			{
				fs.copyFile(self.masterConfigFilePath, self.configFilePath, this);
			},
			function addMountAndBootToConfig()
			{
				fs.appendFile(self.configFilePath, [
					"mount C " + C_DIR_PATH,
					"PATH C:\\DOS",
					"SET TEMP=C:\\TMP",
					"SET TMP=C:\\TMP",
					"C:\\CTMOUSE\\CTMOUSE /3",
					"mount E " + self.dosCWD,
					"E:",
					...self.autoExec,
					"REBOOT.COM"].join("\n"), XU.UTF8, this);
			},
			cb
		);
	}

	// Will send the keys to the virtual doesbox window with the given delay then call the cb. Only works if virtualX was set
	sendKeys(keys, _options, _cb)
	{
		const {options, cb} = XU.optionscb(_options, _cb, {interval : XU.SECOND, delay : XU.SECOND*15});
	
		const self=this;
		setTimeout(() =>
		{
			if(!fileUtil.existsSync(self.portNumFilePath))
				return setImmediate(cb);

			const xPortNum = fs.readFileSync(self.portNumFilePath, XU.UTF8).trim();

			Array.force(keys).serialForEach((key, subcb) =>
			{
				if(Object.isObject(key) && key.delay)
					return setTimeout(subcb, key.delay), undefined;

				tiptoe(
					function sendKey()
					{
						runUtil.run("xdotool", ["search", "--class", "dosbox", "windowfocus", Array.isArray(key) ? "key" : "type", "--delay", "100", Array.isArray(key) ? key[0] : key], {silent : true, env : {"DISPLAY" : ":" + xPortNum}}, this);
					},
					function waitDelay()
					{
						if(!options.interval)
							return this();

						setTimeout(this, options.interval);
					},
					subcb
				);
			}, cb);
		}, options.delay);
	}

	// Will start up DOSBox
	start(exitcb)
	{
		if(this.dosBoxCP!==null)
			throw new Error("DOSBox already running!");
		
		const runArgs = {detached : true};
		runArgs.silent = !this.debug;
		runArgs.virtualX = !this.debug;
		runArgs.portNumFilePath = this.portNumFilePath;
		runArgs.timeout = this.timeout;
		runArgs.sync = true;

		if(this.recordVideoFilePath)
			runArgs.recordVideoFilePath = this.recordVideoFilePath;

		this.dosBoxCP = runUtil.run("dosbox", ["-conf", this.configFilePath], runArgs, this);
		this.dosBoxCP.on("exit", this.exitHandler.bind(this));

		this.registerExitCallback(exitcb);
	}

	// Registers a cb to be called when DOSBox exits
	registerExitCallback(cb)
	{
		if(this.dosBoxCP===null)
			return setImmediate(cb);
			
		this.exitCallbacks.push(cb);
	}

	// Called when DOSBox exits
	exitHandler()
	{
		this.dosBoxCP = null;

		this.exitCallbacks.splice(0, this.exitCallbacks.length).forEach(exitCallback => setImmediate(exitCallback));
	}

	// Will stop DOSBox
	stop(cb)
	{
		if(this.dosBoxCP===null)
			throw new Error("DOSBox not running!");
		
		this.exitCallbacks.push(cb);
		this.dosBoxCP.kill();
	}

	// Will remove any files created in workDir
	teardown(cb)
	{
		const self=this;
		tiptoe(
			function removeFiles()
			{
				fileUtil.unlink(self.workDir, this.parallel());
				fileUtil.unlink(self.portNumFilePath, this.parallel());
			},
			cb
		);
	}

	static quickOp({dosCWD, autoExec, keys, keyOpts, timeout, screenshot=null, video=null, debug, tmpDirPath=os.tmpdir()}, cb)
	{
		const quickOpTmpDirPath = fileUtil.generateTempFilePath(this.tmpDirPath);
		const dosArgs = {tmpDirPath, dosCWD, autoExec};
		if(video)
			dosArgs.recordVideoFilePath = video;
		if(screenshot)
			dosArgs.recordVideoFilePath = fileUtil.generateTempFilePath(this.tmpDirPath, ".mp4");
		if(timeout)
			dosArgs.timeout = timeout;
		if(debug)
			dosArgs.debug = debug;

		const dos = new DOS(dosArgs);

		tiptoe(
			function createTmpDir()
			{
				fs.mkdir(quickOpTmpDirPath, {recursive : true}, this);
			},
			function setup()
			{
				dos.setup(this);
			},
			function execCommands()
			{
				dos.start(this.parallel());
				if(keys)
					dos.sendKeys(Array.force(keys), keyOpts || {}, this.parallel());
			},
			function copyScreenshot()
			{
				if(!screenshot)
					return this();

				videoUtil.extractFrame(dosArgs.recordVideoFilePath, screenshot.filePath, "" + screenshot.loc, this);
			},
			function teardown()
			{
				dos.teardown(this);
			},
			function cleanup()
			{
				if(screenshot)
					fileUtil.unlink(dosArgs.recordVideoFilePath, this.parallel());
				fileUtil.unlink(quickOpTmpDirPath, this.parallel());
			},
			cb
		);
	}
}

exports.DOS = DOS;

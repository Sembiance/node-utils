"use strict";
const XU = require("@sembiance/xu"),
	tiptoe = require("tiptoe"),
	fs = require("fs"),
	runUtil = require("./index.js").run,
	videoUtil = require("./index.js").video,
	imageUtil = require("./index.js").image,
	fileUtil = require("./index.js").file,
	streamBuffers = require("stream-buffers"),
	path = require("path");

// Resources for controlling dosbox more via xdotool through xvfb:
// https://unix.stackexchange.com/questions/259294/use-xvfb-to-automate-x-program
// https://stackoverflow.com/questions/5094389/automation-using-xdotool-and-xvfb

const C_DIR_PATH = path.join(__dirname, "dos", "c");

class DOS
{
	constructor({dosCWD=path.join(__dirname, "dos", "msdos622"), autoExec=[], tries=5, verbose=0, debug=false, recordVideoFilePath=null, timeout=XU.MINUTE*10}={})
	{
		this.dosCWD = dosCWD;
		this.masterConfigFilePath = path.join(__dirname, "dos", "dosbox.conf");
		this.autoExec = autoExec;
		this.dosBoxCP = null;
		this.autoExecVanilla = null;
		this.exitCallbacks = [];
		this.timeout = timeout;
		this.debug = debug;
		this.tries = tries;
		this.verbose = verbose;
		if(recordVideoFilePath)
			this.recordVideoFilePath = recordVideoFilePath;
	}

	// Will create a temporary directory in RAM and copy the master HD image and config file over
	setup(cb)
	{
		this.workDir = fileUtil.generateTempFilePath();
		this.configFilePath = path.join(this.workDir, path.basename(this.masterConfigFilePath));
		this.portNumFilePath = fileUtil.generateTempFilePath();

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
					`mount C ${C_DIR_PATH}`,
					"PATH C:\\DOS",
					"SET TEMP=C:\\TMP",
					"SET TMP=C:\\TMP",
					"C:\\CTMOUSE\\CTMOUSE /3",
					`mount E ${self.dosCWD}`,
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
		const {options, cb} = XU.optionscb(_options, _cb, {interval : XU.SECOND, delay : XU.SECOND*10});
	
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
						const xdotoolOptions = {silent : self.verbose<=1, liveOutput : self.verbose>=3, env : {"DISPLAY" : `:${xPortNum}`}};
						runUtil.run("xdotool", ["search", "--class", "dosbox", "windowfocus", Array.isArray(key) ? "key" : "type", "--delay", "100", Array.isArray(key) ? key[0] : key], xdotoolOptions, this);
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
		runArgs.silent = this.verbose<=1 && !this.debug;
		runArgs.liveOutput = this.verbose>=3;
		runArgs.virtualX = !this.debug;
		runArgs.portNumFilePath = this.portNumFilePath;
		runArgs.timeout = this.timeout;

		if(this.recordVideoFilePath)
		{
			runArgs.recordVideoFilePath = this.recordVideoFilePath;
			runArgs.videoProcessedCB = this.exitHandler.bind(this);
		}
			
		this.dosBoxCP = runUtil.run("dosbox", ["-conf", this.configFilePath], runArgs, this);

		this.dosboxOutput = new streamBuffers.WritableStreamBuffer();
		this.dosBoxCP.stdout.on("data", data => this.dosboxOutput.write(data));

		if(!this.recordVideoFilePath)
		{
			if(this.dosBoxCP.exitCode!==null)
				this.exitHandler();
			else
				this.dosBoxCP.once("exit", this.exitHandler.bind(this));
		}

		if(exitcb)
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

		// Often DOSBox will fail to launch correctly. Either it'll just exit with no output, or an error about being unable to open X11 display. Not sure why. So let's uhm, just try again rofl
		const dosboxOutputString = this.dosboxOutput.getContentsAsString("utf8");
		if(!dosboxOutputString || dosboxOutputString.includes("Exit to error: Can't init SDL Couldn't open X11 display"))
		{
			if(this.verbose>=2)
				XU.log`DOSBox Failed to launch. ${this.tries>0 ? `Trying again with ${this.tries} remaining` : ""}`;

			if(this.tries>0)
			{
				this.tries-=1;
				this.start();
				return;
			}
		}

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

	static quickOp({dosCWD, autoExec, keys, keyOpts, timeout, screenshot=null, video=null, debug=false, verbose=0}, cb)
	{
		const quickOpTmpDirPath = fileUtil.generateTempFilePath();
		const dosArgs = {dosCWD, autoExec, verbose, debug};
		if(video)
			dosArgs.recordVideoFilePath = video;
		if(screenshot)
			dosArgs.recordVideoFilePath = fileUtil.generateTempFilePath(undefined, ".mp4");
		if(timeout)
			dosArgs.timeout = timeout;
		
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
					return this.jump(-2);

				videoUtil.extractFrame(dosArgs.recordVideoFilePath, screenshot.filePath, `${screenshot.loc}`, this);
			},
			function getCropDimensions()
			{
				imageUtil.getAutoCropDimensions(screenshot.filePath, {cropColor : "#FFC0CA"}, this);
			},
			function cropIfNeeded(cropInfo)
			{
				if(!cropInfo || !cropInfo.w || !cropInfo.h)
					return this.jump(2);
				
				this.data.croppedScreenshotFilePath = fileUtil.generateTempFilePath(undefined, ".png");
				runUtil.run("convert", [screenshot.filePath, "-crop", `${cropInfo.w}x${cropInfo.h}+${cropInfo.x || 0}+${cropInfo.y || 0}`, "-strip", this.data.croppedScreenshotFilePath], runUtil.SILENT, this);
			},
			function renameCroppedFile()
			{
				fileUtil.move(this.data.croppedScreenshotFilePath, screenshot.filePath, this);
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
			function handleError(err)
			{
				/*if(err)
				{
					console.trace();
					console.error(err);
				}*/

				cb(err);
			}
		);
	}
}

exports.DOS = DOS;

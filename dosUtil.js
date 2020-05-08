"use strict";

const XU = require("@sembiance/xu"),
	tiptoe = require("tiptoe"),
	fs = require("fs"),
	runUtil = require("./runUtil"),
	fileUtil = require("./fileUtil"),
	path = require("path");

// Resources for controlling dosbox more via xdotool through xvfb:
// https://unix.stackexchange.com/questions/259294/use-xvfb-to-automate-x-program
// https://stackoverflow.com/questions/5094389/automation-using-xdotool-and-xvfb

class DOS
{
	constructor(_masterHDFilePath=path.join(__dirname, "dos", "hd.img"), _debug=false)
	{
		this.masterHDFilePath = _masterHDFilePath;
		this.masterConfigFilePath = path.join(__dirname, "dos", "dosbox.conf");
		this.loopNum = null;
		this.setupDone = false;
		this.dosBoxCP = null;
		this.autoExecVanilla = null;
		this.exitCallbacks = [];
		this.debug = _debug;
	}

	// Will create a temporary directory in RAM and copy the master HD image and config file over
	setup(cb)
	{
		if(this.setupDone)
			return;
		
		this.workDir = fileUtil.generateTempFilePath("/mnt/ram/dosutil");
		this.hdFilePath = path.join(this.workDir, path.basename(this.masterHDFilePath));
		this.configFilePath = path.join(this.workDir, path.basename(this.masterConfigFilePath));
		this.hdMountDirPath = path.join(this.workDir, "hd");
		this.mountedAutoExecFilePath = path.join(this.hdMountDirPath, "AUTOEXEC.BAT");

		const self=this;
		tiptoe(
			function mkWorkDir()
			{
				fileUtil.mkdirp(self.workDir, this);
			},
			function copyHDImgAndReadConfig()
			{
				fileUtil.copy(self.masterHDFilePath, self.hdFilePath, this.parallel());
				fileUtil.copy(self.masterConfigFilePath, self.configFilePath, this.parallel());
			},
			function addMountAndBootToConfig()
			{
				fs.appendFile(self.configFilePath, ["imgmount C " + self.hdFilePath + " -size 512,63,16,520 -t hdd -fs fat", "boot -l c"].join("\n"), XU.UTF8, this);
			},
			function recordAsSetup()
			{
				self.setupDone = true;
				this();
			},
			cb
		);
	}

	// Will copy a file to the DOS HD
	copyToHD(srcFilePath, dosFileSubPath, cb)
	{
		if(!this.setupDone)
			throw new Error("Setup hasn't been run yet!");

		const self=this;
		tiptoe(
			function mountHDIfNeeded()
			{
				self.mountHD(this);
			},
			function copyFile(hdMountDirPath, wasAlreadyMounted)
			{
				this.data.wasAlreadyMounted = wasAlreadyMounted;

				fileUtil.copy(srcFilePath, path.join(hdMountDirPath, dosFileSubPath), this);
			},
			function unmountIfNeeded()
			{
				if(this.data.wasAlreadyMounted)
					this();
				else
					self.unmountHD(this);
			},
			cb
		);
	}

	// Will copy a file off the dos HD
	copyFromHD(dosFilesSubPath, destPath, cb)
	{
		if(!this.setupDone)
			throw new Error("Setup hasn't been run yet!");

		const self=this;
		tiptoe(
			function mountHDIfNeeded()
			{
				self.mountHD(this);
			},
			function copyFile(hdMountDirPath, wasAlreadyMounted)
			{
				this.data.wasAlreadyMounted = wasAlreadyMounted;

				if(Array.isArray(dosFilesSubPath))
					dosFilesSubPath.parallelForEach((dosFileSubPath, subcb) => fileUtil.copy(path.join(hdMountDirPath, dosFileSubPath), path.join(destPath, path.basename(dosFileSubPath)), subcb), this);
				else
					fileUtil.copy(path.join(hdMountDirPath, dosFilesSubPath), destPath, this);
			},
			function unmountIfNeeded()
			{
				if(this.data.wasAlreadyMounted)
					this();
				else
					self.unmountHD(this);
			},
			cb
		);
	}

	// Will read a file from the HD
	readFromHD(dosFileSubPath, cb)
	{
		if(!this.setupDone)
			throw new Error("Setup hasn't been run yet!");

		const self=this;
		tiptoe(
			function mountHDIfNeeded()
			{
				self.mountHD(this);
			},
			function copyFile(hdMountDirPath, wasAlreadyMounted)
			{
				this.data.wasAlreadyMounted = wasAlreadyMounted;

				fs.readFile(path.join(hdMountDirPath, dosFileSubPath), this);
			},
			function unmountIfNeeded(dataRaw)
			{
				this.data.dataRaw = dataRaw;

				if(this.data.wasAlreadyMounted)
					this();
				else
					self.unmountHD(this);
			},
			function returnData()
			{
				this(undefined, this.data.dataRaw);
			},
			cb
		);
	}

	// Will mount our HD so we can perform operations on it
	mountHD(cb)
	{
		if(this.loopNum!==null)
			return setImmediate(() => cb(undefined, this.hdMountDirPath, true));

		if(this.dosBoxCP!==null)
			throw new Error("DOSBox currently running!");

		const self=this;
		tiptoe(
			function createMountDir()
			{
				fileUtil.mkdirp(self.hdMountDirPath, this);
			},
			function attachLoopDevice()
			{
				runUtil.run("losetup", ["-Pf", "--show", self.hdFilePath], runUtil.SILENT, this);
			},
			function mountHDImage(rawOut)
			{
				self.loopNum = +rawOut.toString("utf8").trim().match(/^\/dev\/loop(?<loopNum>[0-9]+)/).groups.loopNum;
				
				runUtil.run("sudo", ["mount", "-t", "vfat", "-o", "uid=7777", "/dev/loop" + self.loopNum + "p1", self.hdMountDirPath], runUtil.SILENT, this);
			},
			function returnMountPath(err)
			{
				this(undefined, self.hdMountDirPath, false);
			},
			cb
		);
	}

	// Un mounts our HD
	unmountHD(cb)
	{
		if(this.loopNum===null)
			return setImmediate(cb);
		
		const self=this;
		tiptoe(
			function unmountHDImage()
			{
				runUtil.run("sudo", ["umount", self.hdMountDirPath], runUtil.SILENT, this);
			},
			function detachLoopDevice()
			{
				runUtil.run("losetup", ["-d", "/dev/loop" + self.loopNum], runUtil.SILENT, this);
			},
			function unrecordLoopNum()
			{
				self.loopNum = null;
				this();
			},
			cb
		);
	}

	// Automatically executes the lines and returns when all done
	autoExec(lines, cb)
	{
		const self=this;
		tiptoe(
			function appendLines()
			{
				// Use this to delay X (3) seconds: "choice /N /Ty,3",
				self.appendToAutoExec([...lines, "REBOOT.COM"], this);
			},
			function runEm()
			{
				self.start(undefined, this);
			},
			cb
		);
	}

	// Writes the lines to the autoexec that takes place in the dos config
	appendToAutoExec(lines, cb)
	{
		const self=this;
		tiptoe(
			function mountIfNeeded()
			{
				self.mountHD(this);
			},
			function resetIfNeeded(hdMountDirPath, wasAlreadyMounted)
			{
				this.data.wasAlreadyMounted = wasAlreadyMounted;
				this.data.hdMountDirPath = hdMountDirPath;

				// If we've callde this before, let's reset the autoexec bat to vanilla first
				if(self.autoExecVanilla)
					fs.writeFile(self.mountedAutoExecFilePath, self.autoExecVanilla, XU.UTF8, this);
				else
					fs.readFile(self.mountedAutoExecFilePath, XU.UTF8, this);
			},
			function appendLines(autoExecVanilla)
			{
				if(!self.autoExecVanilla)
					self.autoExecVanilla = autoExecVanilla;

				fs.appendFile(self.mountedAutoExecFilePath, Array.force(lines).join("\r\n"), XU.UTF8, this);
			},
			function unmountIfNeeded()
			{
				if(this.data.wasAlreadyMounted)
					this();
				else
					self.unmountHD(this);
			},
			cb
		);
	}

	// Will start up DOSBox
	start(_cb, exitcb)
	{
		if(this.dosBoxCP!==null)
			throw new Error("DOSBox already running!");
		if(this.loopNum!==null)
			throw new Error("HD currently mounted!");
		
		const cb = _cb || (() => {});

		const self=this;
		tiptoe(
			function runDOSBox()
			{
				runUtil.run("dosbox", ["-conf", self.configFilePath], {virtualX : !self.debug, silent : true, detached : true}, this);
			},
			function recordChildProcess(cp)
			{
				self.dosBoxCP = cp;

				self.dosBoxCP.on("exit", self.exitHandler.bind(self));

				if(exitcb)
					self.registerExitCallback(exitcb);

				this();
			},
			cb
		);
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

		this.exitCallbacks.forEach(exitCallback => setImmediate(exitCallback));
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
			function unmountIfNeeded()
			{
				self.unmountHD(this);
			},
			function mkWorkDir()
			{
				fileUtil.unlink(self.workDir, this);
			},
			cb
		);
	}
}

exports.DOS = DOS;

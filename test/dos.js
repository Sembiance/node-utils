"use strict";

const XU = require("@sembiance/xu"),
	tiptoe = require("tiptoe"),
	assert = require("assert"),
	hashUtil = require("../index").hash,
	fileUtil = require("../index").file,
	path = require("path"),
	{DOS} = require("../index").dos;

const dos = new DOS();
tiptoe(
	function step1()
	{
		dos.setup(this);
	},
	function step2()
	{
		dos.mountHD(this);
	},
	function step3(hdMountDirPath)
	{
		this.data.hdMountDirPath = hdMountDirPath;

		this.capture();
		dos.start();
	},
	function step4(err)
	{
		assert.strictEqual(err.toString(), "Error: HD currently mounted!");
		dos.copyToHD(path.join(__dirname, "files", "TEST.TSC"), "WORK/TEST.TSC", this);
	},
	function step5()
	{
		hashUtil.hashFile("sha1", path.join(this.data.hdMountDirPath, "WORK", "TEST.TSC"), this);
	},
	function step6(hashResult)
	{
		assert.strictEqual(hashResult, "a8a4cbb3c89e4582706fc87d0310f617b91dba82");

		//fs.writeFileSync(path.join(this.data.hdMountDirPath, "WORK", "GO.BAT"), ["C:\\APP\\TSCOMP.EXE -l C:\\WORK\\TEST.TSC > C:\\TMP\\TSFILES.TXT", "CHOICE /TY,5", "REBOOT.COM"].join("\r\n"), XU.UTF8);

		dos.unmountHD(this);
	},
	function step7()
	{
		dos.appendToAutoExec(["C:\\APP\\TSCOMP.EXE -l C:\\WORK\\TEST.TSC > C:\\TMP\\TSFILES.TXT", "REBOOT.COM"], this);
	},
	function step8()
	{
		dos.start(undefined, this);
	},
	function step9()
	{
		dos.copyFromHD("TMP/TSFILES.TXT", path.join("/tmp/tsfiles.txt"), this);
	},
	function step10()
	{
		hashUtil.hashFile("sha1", "/tmp/tsfiles.txt", this);
	},
	function step11(tsFilesHash)
	{
		assert.strictEqual(tsFilesHash, "9d880d46f380a12c4c27f30ff4412cb09ce4bf71");
		
		fileUtil.unlink("/tmp/tsfiles.txt", this.parallel());
		dos.teardown(this.parallel());
	},
	XU.FINISH
);

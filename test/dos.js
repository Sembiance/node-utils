"use strict";

const XU = require("@sembiance/xu"),
	tiptoe = require("tiptoe"),
	assert = require("assert"),
	hashUtil = require("../index").hash,
	fileUtil = require("../index").file,
	fs = require("fs"),
	path = require("path"),
	{DOS} = require("../index").dos;

const dosCWD = fileUtil.generateTempFilePath();

tiptoe(
	function step1()
	{
		fs.mkdir(dosCWD, this);
	},
	function step2()
	{
		fs.symlink(path.join(__dirname, "files", "TSCOMP.EXE"), path.join(dosCWD, "TSCOMP.EXE"), this.parallel());
		fs.symlink(path.join(__dirname, "files", "TWOFILES.TSC"), path.join(dosCWD, "TWOFILES.TSC"), this.parallel());
	},
	function step3()
	{
		DOS.quickOp({dosCWD, autoExec : ["TSCOMP.EXE -l TWOFILES.TSC > TSFILES.TXT"]}, this);
	},
	function step4()
	{
		assert.strictEqual(hashUtil.hash("sha1", fs.readFileSync(path.join(dosCWD, "TSFILES.TXT"), XU.UTF8)), "8b8cfafb54517f3732537294ce0df0bb37475382");

		console.log("SUCCESS");
		
		fileUtil.unlink(dosCWD, this);
	},
	XU.FINISH
);

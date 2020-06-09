"use strict";

const XU = require("@sembiance/xu"),
	assert = require("assert"),
	path = require("path"),
	tiptoe = require("tiptoe"),
	videoUtil = require("../index").video,
	fileUtil = require("../index").file,
	runUtil = require("../index").run;

const FILES_DIR = path.join(__dirname, "files");

// Tests a simple cat
function testSimpleRun(cb)
{
	tiptoe(
		function runCat()
		{
			runUtil.run("cat", [path.join(FILES_DIR, "ab.txt")], {silent : true}, this);
		},
		function verifyCatData(catOutput)
		{
			assert.strictEqual(catOutput, "prefix\nabc\n123\nxyz");

			this();
		},
		cb
	);
}

// Tests live output
function testLiveOutput(cb)
{
	const OUTPUT_VIDEO_FILE_PATH = "/mnt/ram/runUtilYoutube.mp4";
	tiptoe(
		function runYouTubeDL()
		{
			runUtil.run("youtube-dl", ["2QMeGkbdIVw", "-o", OUTPUT_VIDEO_FILE_PATH], {liveOutput : true}, this);
		},
		function cleanup()
		{
			fileUtil.unlink(OUTPUT_VIDEO_FILE_PATH, this);
		},
		cb
	);
}

function testVirtualXRecord(cb)
{
	const OUTPUT_VIDEO_FILE_PATH = fileUtil.generateTempFilePath("/mnt/ram/tmp", ".mp4");
	console.log(OUTPUT_VIDEO_FILE_PATH);
	tiptoe(
		function runProcess()
		{
			runUtil.run("mplayer", [path.join(FILES_DIR, "catvid.mp4")], {silent : true, recordVirtualX : OUTPUT_VIDEO_FILE_PATH, virtualX : true}, this);
		},
		function getOutputVideoInfo()
		{
			videoUtil.getInfo(OUTPUT_VIDEO_FILE_PATH, this);
		},
		function verifyOutputVideoInfo(vidInfo)
		{
			assert.strictEqual(vidInfo.width, 1280);
			assert.strictEqual(vidInfo.height, 720);
			assert(vidInfo.duration>=9.5 && vidInfo.duration<=9.8, vidInfo.duration);
			assert.strictEqual(vidInfo.fps, 60);

			fileUtil.unlink(OUTPUT_VIDEO_FILE_PATH, this);
		},
		cb
	);
}

tiptoe(
	function runTestSimpleRun()
	{
		testSimpleRun(this);
	},
	function runTestLiveOutput()
	{
		testLiveOutput(this);
	},
	function runTestVirtualXRecord()
	{
		testVirtualXRecord(this);
	},
	XU.FINISH
);

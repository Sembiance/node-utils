"use strict";

const assert = require("assert"),
	tiptoe = require("tiptoe"),
	path = require("path"),
	fs = require("fs"),
	hashUtil = require("../index").hash,
	fileUtil = require("../index").file,
	videoUtil = require("../index").video;

const FILES_DIR = path.join(__dirname, "files");

const VIDEO_THUMBNAIL_PATH = path.join(FILES_DIR, "video.mp4.thumb.png");

const VIDEO_PATH = path.join(FILES_DIR, "video.mp4");
const CROP_VIDEO_PATH = path.join(FILES_DIR, "cropme.mp4");

assert(fs.existsSync(VIDEO_PATH));
assert(fs.existsSync(CROP_VIDEO_PATH));

const frameFromEndFilePath = fileUtil.generateTempFilePath("/mnt/ram/tmp", ".png");
const framePercentageEndFilePath = fileUtil.generateTempFilePath("/mnt/ram/tmp", ".png");
const destCroppedVideoPath = fileUtil.generateTempFilePath("/mnt/ram/tmp", ".mp4");
const destTrimmedVideoPath = fileUtil.generateTempFilePath("/mnt/ram/tmp", ".mp4");

tiptoe(
	function extractFrame()
	{
		videoUtil.extractFrame(VIDEO_PATH, frameFromEndFilePath, "-12000", this.parallel());
		videoUtil.extractFrame(VIDEO_PATH, framePercentageEndFilePath, "47%", this.parallel());
	},
	function verifyScreenshot()
	{
		assert.strictEqual(hashUtil.hash("sha1", fs.readFileSync(frameFromEndFilePath)), "bb08673009babc45268f5be3407a4ee85210eb32");
		assert.strictEqual(hashUtil.hash("sha1", fs.readFileSync(framePercentageEndFilePath)), "e48b898fddb84a86f8747260ae283a8653cfe9f8");
		
		fs.unlink(frameFromEndFilePath, this.parallel());
		fs.unlink(framePercentageEndFilePath, this.parallel());
	},
	function getCroppedVideoInfoBefore()
	{
		videoUtil.getInfo(CROP_VIDEO_PATH, this);
	},
	function cropVideo(cropVidInfo)
	{
		assert.strictEqual(cropVidInfo.width, 1920);
		assert.strictEqual(cropVidInfo.height, 1080);
		assert.strictEqual(cropVidInfo.duration, 9.8);
		assert.strictEqual(cropVidInfo.fps, 60);

		videoUtil.autocrop(CROP_VIDEO_PATH, destCroppedVideoPath, {cropColor : "#FFC0CB"}, this);
	},
	function getCroppedVideoInfoAfter()
	{
		videoUtil.getInfo(destCroppedVideoPath, this);
	},
	function trimVideo(trimVidInfo)
	{
		assert.strictEqual(trimVidInfo.width, 1280);
		assert.strictEqual(trimVidInfo.height, 720);
		assert.strictEqual(trimVidInfo.duration, 9.8);
		assert.strictEqual(trimVidInfo.fps, 60);

		videoUtil.trimSolidFrames(destCroppedVideoPath, destTrimmedVideoPath, {color : "#FFC0CB", fuzz : 0, fps : 30}, this);
	},
	function getVideoInfo()
	{
		videoUtil.getInfo(destTrimmedVideoPath, this.parallel());
		videoUtil.getInfo(VIDEO_PATH, this.parallel());
	},
	function generateThumbnail(trimmedVidInfo, videoInfo)
	{
		assert.strictEqual(trimmedVidInfo.width, 1280);
		assert.strictEqual(trimmedVidInfo.height, 720);
		assert.strictEqual(trimmedVidInfo.duration, 9.57);
		assert.strictEqual(trimmedVidInfo.fps, 60);

		videoUtil.generateThumbnail(VIDEO_PATH, `00:00:${(videoInfo.duration<40 ? Math.floor(Math.floor(videoInfo.duration)/2) : 30)}`, `${VIDEO_PATH}.thumb.png`, 400, 600, this);
	},
	function removeThumbnail()
	{
		assert(fs.existsSync(VIDEO_THUMBNAIL_PATH));
		fs.unlink(VIDEO_THUMBNAIL_PATH, this);
	},
	function returnResult(err)
	{
		if(err)
			console.error(err);

		assert(!err);
		process.exit(0);
	}
);

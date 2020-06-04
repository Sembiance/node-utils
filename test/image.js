"use strict";

const tiptoe = require("tiptoe"),
	path = require("path"),
	assert = require("assert"),
	fileUtil = require("../index").file,
	imageUtil = require("../index").image;

const FILES_DIR = path.join(__dirname, "files");
const TEST_COMPRESS = true;

tiptoe(
	function getWH()
	{
		imageUtil.getAutoCropDimensions(path.join(FILES_DIR, "test.png"), {cropColor : "#FFC0CB"}, this.parallel());
		imageUtil.getAutoCropDimensions(path.join(FILES_DIR, "test2.png"), {cropColor : "#FFC0CB"}, this.parallel());
		imageUtil.getWidthHeight(path.join(FILES_DIR, "input.png"), this.parallel());
	},
	function prepare(cropInfo, cropInfo2, wh)
	{
		assert(Object.equals(cropInfo, {w : 1280, h : 720, x : 320, y : 180}));
		assert(Object.equals(cropInfo2, {w : 640, h : 400, x : 0, y : 0}));

		assert.strictEqual(JSON.stringify(wh), JSON.stringify([1487, 1500]));

		if(!TEST_COMPRESS)
			return this.finish();

		fileUtil.unlink(path.join(FILES_DIR, "lossy.png"), this.parallel());
		fileUtil.unlink(path.join(FILES_DIR, "lossless.png"), this.parallel());
		fileUtil.unlink(path.join(FILES_DIR, "lossy.gif"), this.parallel());
		fileUtil.unlink(path.join(FILES_DIR, "lossless.gif"), this.parallel());
		fileUtil.unlink(path.join(FILES_DIR, "lossy.jpg"), this.parallel());
		fileUtil.unlink(path.join(FILES_DIR, "lossless.jpg"), this.parallel());
	},
	function compress()
	{
		imageUtil.compress(path.join(FILES_DIR, "input.png"), path.join(FILES_DIR, "lossless.png"), "png", false, this.parallel());
		imageUtil.compress(path.join(FILES_DIR, "input.png"), path.join(FILES_DIR, "lossy.png"), "png", true, this.parallel());
		
		imageUtil.compress(path.join(FILES_DIR, "input.jpg"), path.join(FILES_DIR, "lossless.jpg"), "jpg", false, this.parallel());
		imageUtil.compress(path.join(FILES_DIR, "input.jpg"), path.join(FILES_DIR, "lossy.jpg"), "jpg", true, this.parallel());

		imageUtil.compress(path.join(FILES_DIR, "input.gif"), path.join(FILES_DIR, "lossless.gif"), "gif", false, this.parallel());
	},
	function finish(err)
	{
		if(err)
		{
			console.error(err);
			process.exit(1);
		}

		if(TEST_COMPRESS)
			console.log("Now examine the files/*loss* files and visually compare to the input* files");

		process.exit(0);
	}
);

"use strict";

const tiptoe = require("tiptoe"),
	path = require("path"),
	assert = require("assert"),
	fileUtil = require("../index").file,
	imageUtil = require("../index").image;

const FILES_DIR = path.join(__dirname, "files");

console.log("This test will take a while.");

tiptoe(
	function getWH()
	{
		imageUtil.getWidthHeight(path.join(FILES_DIR, "input.png"), this);
	},
	function prepare(wh)
	{
		assert.strictEqual(JSON.stringify(wh), JSON.stringify([1487, 1500]));

		fileUtil.unlink(path.join(FILES_DIR, "lossy.png"), this.parallel());
		fileUtil.unlink(path.join(FILES_DIR, "lossless.png"), this.parallel());
		fileUtil.unlink(path.join(FILES_DIR, "lossy.gif"), this.parallel());
		fileUtil.unlink(path.join(FILES_DIR, "lossless.gif"), this.parallel());
		fileUtil.unlink(path.join(FILES_DIR, "lossy.jpg"), this.parallel());
		fileUtil.unlink(path.join(FILES_DIR, "lossless.jpg"), this.parallel());
	},
	function compress()
	{
		imageUtil.compress(path.join(FILES_DIR, "input.png"), path.join(FILES_DIR, "lossless.png"), false, this.parallel());
		imageUtil.compress(path.join(FILES_DIR, "input.png"), path.join(FILES_DIR, "lossy.png"), true, this.parallel());
		
		imageUtil.compress(path.join(FILES_DIR, "input.jpg"), path.join(FILES_DIR, "lossless.jpg"), false, this.parallel());
		imageUtil.compress(path.join(FILES_DIR, "input.jpg"), path.join(FILES_DIR, "lossy.jpg"), true, this.parallel());

		imageUtil.compress(path.join(FILES_DIR, "input.gif"), path.join(FILES_DIR, "lossless.gif"), false, this.parallel());
	},
	function finish(err)
	{
		if(err)
		{
			console.error(err);
			process.exit(1);
		}

		console.log("Now examine the files/*loss* files and visually compare to the input* files");

		process.exit(0);
	}
);

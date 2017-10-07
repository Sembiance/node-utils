"use strict";

const tiptoe = require("tiptoe"),
	path = require("path"),
	fileUtil = require("../index").file,
	imageUtil = require("../index").image;

tiptoe(
	function prepare()
	{
		fileUtil.unlink(path.join(__dirname, "lossy.png"), this.parallel());
		fileUtil.unlink(path.join(__dirname, "lossless.png"), this.parallel());
		fileUtil.unlink(path.join(__dirname, "lossy.gif"), this.parallel());
		fileUtil.unlink(path.join(__dirname, "lossless.gif"), this.parallel());
		fileUtil.unlink(path.join(__dirname, "lossy.jpg"), this.parallel());
		fileUtil.unlink(path.join(__dirname, "lossless.jpg"), this.parallel());
	},
	function compress()
	{
		imageUtil.compress(path.join(__dirname, "input.png"), path.join(__dirname, "lossless.png"), false, this.parallel());
		imageUtil.compress(path.join(__dirname, "input.png"), path.join(__dirname, "lossy.png"), true, this.parallel());
		
		imageUtil.compress(path.join(__dirname, "input.jpg"), path.join(__dirname, "lossless.jpg"), false, this.parallel());
		imageUtil.compress(path.join(__dirname, "input.jpg"), path.join(__dirname, "lossy.jpg"), true, this.parallel());

		imageUtil.compress(path.join(__dirname, "input.gif"), path.join(__dirname, "lossless.gif"), false, this.parallel());
	},
	function finish(err)
	{
		if(err)
		{
			console.error(err);
			process.exit(1);
		}

		process.exit(0);
	}
);

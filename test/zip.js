"use strict";

const XU = require("@sembiance/xu"),
	path = require("path"),
	tiptoe = require("tiptoe"),
	assert = require("assert"),
	zipUtil = require("../index").zip;

tiptoe(
	function unzipZip()
	{
		zipUtil.unzip(path.join(__dirname, "test.zip"), "/tmp/", this);
	},
	function checkResults(results)
	{
		assert(results.equals(["pewpewpew.flac", "subdir/zip_smile.png", "zip_hello.txt"]));

		this();
	},
	function finish(err)
	{
		assert(!err);
		if(err)
		{
			console.error(err);
			process.exit(1);
		}

		process.exit(0);
	}
);


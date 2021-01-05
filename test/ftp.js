"use strict";

const XU = require("@sembiance/xu"),
	assert = require("assert"),
	{performance} = require("perf_hooks"),
	path = require("path"),
	fileUtil = require("../index").file,
	hashUtil = require("../index").hash,
	ftpUtil = require("../index").ftp;

const TEST_FILE_PATH = path.join(undefined, `${performance.now()}.zip`);

ftpUtil.download("ftp://ftp.padua.org/pub/c64/Demos/pal/padua/embryo.zip", TEST_FILE_PATH, err =>
{
	assert(!err, err);
	assert.strictEqual(fileUtil.existsSync(TEST_FILE_PATH), true, `Output file does not exist: ${TEST_FILE_PATH}`);

	hashUtil.hashFile("sha1", TEST_FILE_PATH, (hashErr, shaSum) =>
	{
		assert(!hashErr, hashErr);
		assert.strictEqual(shaSum, "133023dcaeb744d6680bcbf07a9c40debea6740f", "SHA1 sum does not match!");
	});
});

"use strict";

const assert = require("assert"),
	path = require("path"),
	fs = require("fs"),
	hashUtil = require("../index").hash;

const TEST_FILE_PATH = path.join(__dirname, "input.png");
const TEST_FILE_MD5 = "8be8ce12e5e0589d69a54b21b1d4af9e";

hashUtil.hashFile(TEST_FILE_PATH, "md5", (err, hash) =>
{
	assert(!err);
	assert.strictEqual(hash, TEST_FILE_MD5);
});

assert.strictEqual(hashUtil.hash(fs.readFileSync(TEST_FILE_PATH), "md5"), TEST_FILE_MD5);

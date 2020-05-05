"use strict";

const assert = require("assert"),
	path = require("path"),
	fs = require("fs"),
	hashUtil = require("../index").hash;

const FILES_DIR = path.join(__dirname, "files");
const TEST_FILE_PATH = path.join(FILES_DIR, "input.png");
const TEST_FILE_MD5 = "8be8ce12e5e0589d69a54b21b1d4af9e";

hashUtil.hashFile("md5", TEST_FILE_PATH, (err, hash) =>
{
	assert(!err);
	assert.strictEqual(hash, TEST_FILE_MD5);
});

assert.strictEqual(hashUtil.hash("md5", fs.readFileSync(TEST_FILE_PATH)), TEST_FILE_MD5);

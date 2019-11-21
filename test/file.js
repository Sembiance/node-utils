"use strict";

const assert = require("assert"),
	path = require("path"),
	fs = require("fs"),
	fileUtil = require("../index").file;

const UTF8 = { encoding : "utf8" };

assert.strictEqual(fileUtil.existsSync(path.join(__dirname, "file.js")), true);
assert.strictEqual(fileUtil.existsSync(path.join(__dirname, "FILE_DOES_NOT_EXIST")), false);

fileUtil.exists(path.join(__dirname, "file.js"), (err, exists) =>
{
	assert(!err);
	assert.strictEqual(exists, true);
});

fileUtil.exists(path.join(__dirname, "FILE_DOES_NOT_EXIST"), (err, exists) =>
{
	assert(!err);
	assert.strictEqual(exists, false);
});

const DIR_TEST_PATH = "/tmp/file.js_dir_test_removal";
const FILE_TEST_PATH = "/tmp/file.js_file_test_removal";

fs.mkdirSync(DIR_TEST_PATH);
fs.writeFileSync(FILE_TEST_PATH, "hello", UTF8);
assert.strictEqual(fileUtil.existsSync(DIR_TEST_PATH), true);
assert.strictEqual(fileUtil.existsSync(FILE_TEST_PATH), true);
fileUtil.unlink(DIR_TEST_PATH, err =>
{
	assert(!err);
	assert.strictEqual(fileUtil.existsSync(DIR_TEST_PATH), false);
});

fileUtil.unlink(FILE_TEST_PATH, err =>
{
	assert(!err);
	assert.strictEqual(fileUtil.existsSync(FILE_TEST_PATH), false);
});

const CONCAT_DEST_PATH = "/tmp/file.js_file_test_concat.txt";
if(fileUtil.existsSync(CONCAT_DEST_PATH))
	fs.unlinkSync(CONCAT_DEST_PATH);
fileUtil.concat([path.join(__dirname, "a.txt"), path.join(__dirname, "b.txt")], CONCAT_DEST_PATH, { prefix : "prefix\n", suffix : "xyz" }, err =>
{
	assert(!err);
	assert.strictEqual(fs.readFileSync(path.join(__dirname, "ab.txt"), UTF8), fs.readFileSync(CONCAT_DEST_PATH, UTF8));
	fs.unlinkSync(CONCAT_DEST_PATH);
});

"use strict";

const XU = require("@sembiance/xu"),
	assert = require("assert"),
	path = require("path"),
	tiptoe = require("tiptoe"),
	fs = require("fs"),
	glob = require("glob"),
	fileUtil = require("../index").file;

const UTF8 = { encoding : "utf8" };
const FILES_DIR = path.join(__dirname, "files");

// TEST: copyDir && copyDirSync
function testCopyDir(cb)
{
	const expectedFiles = ["/tmp/xutilTestDir","/tmp/xutilTestDir/a.txt","/tmp/xutilTestDir/number","/tmp/xutilTestDir/subdir","/tmp/xutilTestDir/subdir/another","/tmp/xutilTestDir/subdir/another/andMore","/tmp/xutilTestDir/subdir/another/andMore/emptydir","/tmp/xutilTestDir/subdir/another/andMore/hi.txt","/tmp/xutilTestDir/subdir/b.txt","/tmp/xutilTestDir/subdir/c.txt"];	// eslint-disable-line max-len, comma-spacing
	
	tiptoe(
		function prepare()
		{
			fileUtil.unlink("/tmp/xutilTestDir", this);
		},
		function testSync()
		{
			fileUtil.copyDirSync(path.join(__dirname, "files", "dirTest"), "/tmp/xutilTestDir");
			glob("/tmp/xutilTestDir/**", this);
		},
		function verifyAndPrepare(globFiles)
		{
			assert(expectedFiles.equals(globFiles));
			fileUtil.unlink("/tmp/xutilTestDir", this);
		},
		function testAsync()
		{
			fileUtil.copyDir(path.join(__dirname, "files", "dirTest"), "/tmp/xutilTestDir", this);
		},
		function listResultingFiles()
		{
			glob("/tmp/xutilTestDir/**", this);
		},
		function verifyAndCleanup(globFiles)
		{
			assert(expectedFiles.equals(globFiles));
			fileUtil.unlink("/tmp/xutilTestDir", this);
		},
		cb
	);
}

// TEST: existsSync
assert.strictEqual(fileUtil.existsSync(path.join(__dirname, "file.js")), true);
assert.strictEqual(fileUtil.existsSync(path.join(FILES_DIR, "FILE_DOES_NOT_EXIST")), false);


// TEST: exists
function testExists(cb)
{
	tiptoe(
		function runChecks()
		{
			this.capture();
			fileUtil.exists(path.join(__dirname, "file.js"), this.parallel());
			fileUtil.exists(path.join(FILES_DIR, "FILE_DOES_NOT_EXIST"), this.parallel());
		},
		function verifyResults(err, fileExists, otherFileExists)
		{
			assert(!err);
			assert.strictEqual(fileExists, true);
			assert.strictEqual(otherFileExists, false);

			this();
		},
		cb
	);
}

// TEST: generateTempFilePath
const DIR_TEST_PATH = fileUtil.generateTempFilePath();
const FILE_TEST_PATH = fileUtil.generateTempFilePath();
fs.mkdirSync(DIR_TEST_PATH);
fs.writeFileSync(FILE_TEST_PATH, "hello", UTF8);
assert.strictEqual(fileUtil.existsSync(DIR_TEST_PATH), true);
assert.strictEqual(fileUtil.existsSync(FILE_TEST_PATH), true);

// TEST: unlink
function testUnlink(cb)
{
	tiptoe(
		function removeTargets()
		{
			this.capture();
			fileUtil.unlink(DIR_TEST_PATH, this.parallel());
			fileUtil.unlink(FILE_TEST_PATH, this.parallel());
		},
		function verifyExistance(err)
		{
			assert(!err);
			assert.strictEqual(fileUtil.existsSync(DIR_TEST_PATH), false);
			assert.strictEqual(fileUtil.existsSync(FILE_TEST_PATH), false);
			this();
		},
		cb
	);
}

// TEST: concat
function testConcat(cb)
{
	const CONCAT_DEST_PATH = fileUtil.generateTempFilePath();
	if(fileUtil.existsSync(CONCAT_DEST_PATH))
		fs.unlinkSync(CONCAT_DEST_PATH);

	tiptoe(
		function callConcat()
		{
			this.capture();
			fileUtil.concat([path.join(FILES_DIR, "a.txt"), path.join(FILES_DIR, "b.txt")], CONCAT_DEST_PATH, { prefix : "prefix\n", suffix : "xyz" }, this);
		},
		function verifyExistanceAndCleanup(err)
		{
			assert(!err);
			assert.strictEqual(fs.readFileSync(path.join(FILES_DIR, "ab.txt"), UTF8), fs.readFileSync(CONCAT_DEST_PATH, UTF8));
			fileUtil.unlink(CONCAT_DEST_PATH, this);
		},
		cb
	);
}

tiptoe(
	function runTestCopyDir()
	{
		testCopyDir(this);
	},
	function runTestExists()
	{
		testExists(this);
	},
	function runTestUnlink()
	{
		testUnlink(this);
	},
	function runTestConcat()
	{
		testConcat(this);
	},
	XU.FINISH
);

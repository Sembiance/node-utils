"use strict";

const XU = require("@sembiance/xu"),
	assert = require("assert"),
	path = require("path"),
	tiptoe = require("tiptoe"),
	fs = require("fs"),
	fileUtil = require("../index").file;

const FILES_DIR = path.join(__dirname, "files");

// TEST: copyDir && copyDirSync
function testCopyDir(cb)
{
	const expectedFiles = ["/tmp/xutilTestDir/a.txt","/tmp/xutilTestDir/number","/tmp/xutilTestDir/subdir","/tmp/xutilTestDir/subdir/another","/tmp/xutilTestDir/subdir/another/andMore","/tmp/xutilTestDir/subdir/another/andMore/emptydir","/tmp/xutilTestDir/subdir/another/andMore/hi.txt","/tmp/xutilTestDir/subdir/b.txt","/tmp/xutilTestDir/subdir/c.txt"];	// eslint-disable-line max-len, comma-spacing
	
	tiptoe(
		function prepare()
		{
			fileUtil.unlink("/tmp/xutilTestDir", this);
		},
		function testSync()
		{
			fileUtil.copyDirSync(path.join(__dirname, "files", "dirTest"), "/tmp/xutilTestDir");
			fileUtil.glob("/tmp/xutilTestDir", "**", {nodor : true}, this);
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
			fileUtil.glob("/tmp/xutilTestDir", "**", this);
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
fs.mkdirSync(path.join(DIR_TEST_PATH, "subdir"), {recursive : true});
fs.writeFileSync(path.join(DIR_TEST_PATH, "abc.txt"), "abc123", XU.UTF8);
fs.writeFileSync(path.join(DIR_TEST_PATH, "subdir", "subfile.dat"), "DATA\nGOES\nHERE", XU.UTF8);

fs.writeFileSync(FILE_TEST_PATH, "hello", XU.UTF8);
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
			assert.strictEqual(fs.readFileSync(path.join(FILES_DIR, "ab.txt"), XU.UTF8), fs.readFileSync(CONCAT_DEST_PATH, XU.UTF8));
			fileUtil.unlink(CONCAT_DEST_PATH, this);
		},
		cb
	);
}

// TEST: glob
function testGlob(cb)
{
	tiptoe(
		function runGlob()
		{
			fileUtil.glob(path.join(FILES_DIR, "globTest", "A_dir_with[brackets]_and?(parenthesis)"), "**", this.parallel());
			fileUtil.glob(path.join(FILES_DIR, "globTest", "A_dir_with[brackets]_and?(parenthesis)"), "*/*.txt", this.parallel());
			fileUtil.glob(path.join(FILES_DIR, "globTest", "A_dir_with[brackets]_and?(parenthesis)"), "**", {nodir : true}, this.parallel());
			fileUtil.glob(path.join(FILES_DIR, "globTest", "A_dir_with[brackets]_and?(parenthesis)"), "**/", this.parallel());
		},
		function verifyResults(allItems, txtItems, fileItems, dirItems)
		{
			assert(allItems.equals([
				"/mnt/compendium/DevLab/node-modules/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/emptyDir",
				"/mnt/compendium/DevLab/node-modules/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/file1.txt",
				"/mnt/compendium/DevLab/node-modules/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/file2.txt",
				"/mnt/compendium/DevLab/node-modules/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/subdir",
				"/mnt/compendium/DevLab/node-modules/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/subdir/file3.txt"
			]));

			assert(txtItems.equals(["/mnt/compendium/DevLab/node-modules/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/subdir/file3.txt"]));

			assert(fileItems.equals([
				"/mnt/compendium/DevLab/node-modules/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/file1.txt",
				"/mnt/compendium/DevLab/node-modules/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/file2.txt",
				"/mnt/compendium/DevLab/node-modules/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/subdir/file3.txt"
			]));

			assert(dirItems.equals([
				"/mnt/compendium/DevLab/node-modules/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/emptyDir",
				"/mnt/compendium/DevLab/node-modules/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/subdir"
			]));

			this();
		},
		cb
	);
}

tiptoe(
	function runTestGlob()
	{
		testGlob(this);
	},
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

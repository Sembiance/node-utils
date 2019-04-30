"use strict";

const XU = require("@sembiance/xu"),
	path = require("path"),
	fs = require("fs"),
	assert = require("assert"),
	tiptoe = require("tiptoe"),
	fileUtil = require("../index").file,
	zipUtil = require("../index").zip;

function test_readZipEntries(zipFilePath, cb)	// eslint-disable-line camelcase
{
	tiptoe(
		function tests()
		{
			zipUtil.readZipEntries(zipFilePath, () => false, () => assert(!true), this.parallel());
			let seenEntry = false;
			zipUtil.readZipEntries(zipFilePath, entry => entry.fileName==="zip_hello.txt", (entry, entryData) => { seenEntry = true; assert.strictEqual(entryData.toString("utf8"), "This is just a text file"); }, err =>
			{
				assert(!err);
				assert.strictEqual(seenEntry, true);
				this.parallel()();
			});
		},
		function moreTests()
		{
			let seenZipEntry = false;
			let zipEntryData = null;
			zipUtil.readZipEntries(zipFilePath, entry => entry.fileName==="subdir/zip_smile.png", (entry, entryData) =>
			{
				seenZipEntry = true;
				zipEntryData = entryData;
				assert(entryData.equals(fs.readFileSync(path.join(__dirname, "zip_smile.png"))));
			}, (err, zipEntries, zipEntriesData) =>
			{
				assert(!err);
				assert(seenZipEntry);
				assert.strictEqual(zipEntries[0].fileName, "subdir/zip_smile.png");
				assert.strictEqual(zipEntriesData.length, 1);
				assert.strictEqual(zipEntryData, zipEntriesData[0]);

				setImmediate(this);
			});
		},
		cb
	);
}

tiptoe(
	function testExistingZIPFile()
	{
		test_readZipEntries(path.join(__dirname, "test.zip"), this);
	},
	function createZipFile()
	{
		zipUtil.zipFiles(["pewpewpew.flac", "subdir", "zip_hello.txt"], "/tmp/zip_test_test.zip", {cwd : path.join(__dirname, "zip_dir")}, this.parallel());
		zipUtil.zipFiles(["pewpewpew.flac", "subdir", "zip_hello.txt"], "/tmp/zip_test_test_renamed.zip", {junkPaths : true, renameMap : { "zip_hello.txt" : "renamed_hellow.txt" }, cwd : path.join(__dirname, "zip_dir")}, this.parallel());
	},
	function checkMadeZipFileAndRemove()
	{
		test_readZipEntries("/tmp/zip_test_test.zip", this.parallel());
		let seenEntry = false;
		zipUtil.readZipEntries("/tmp/zip_test_test_renamed.zip", entry => entry.fileName==="renamed_hellow.txt", (entry, entryData) => { seenEntry = true; assert.strictEqual(entryData.toString("utf8"), "This is just a text file"); }, err =>
		{
			assert(!err);
			assert.strictEqual(seenEntry, true);
			this.parallel()();
		});
	},
	function sleepSome()
	{
		setTimeout(this, XU.SECOND*3);
	},
	function removeZipFile()
	{
		fileUtil.unlink("/tmp/zip_test_test.zip", this.parallel());
		fileUtil.unlink("/tmp/zip_test_test_renamed.zip", this.parallel());
	},
	function handleErrors(err)
	{
		if(err)
			console.error(err);

		assert(!err);
	}
);

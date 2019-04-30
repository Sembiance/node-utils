"use strict";

const XU = require("@sembiance/xu"),
	path = require("path"),
	fs = require("fs"),
	assert = require("assert"),
	zipUtil = require("../index").zip;

zipUtil.readZipEntries(path.join(__dirname, "test.zip"), () => false, () => assert(!true), err => assert(!err));
zipUtil.readZipEntries(path.join(__dirname, "test.zip"), entry => entry.fileName==="zip_hello.txt", (entry, entryData) => assert.strictEqual(entryData.toString("utf8"), "This is just a text file"), err => assert(!err));

let seenZipEntry = false;
let zipEntryData = null;
zipUtil.readZipEntries(path.join(__dirname, "test.zip"), entry => entry.fileName==="subdir/zip_smile.png", (entry, entryData) =>
{
	seenZipEntry = true;
	zipEntryData = entryData;
	assert(entryData.equals(fs.readFileSync(path.join(__dirname, "zip_smile.png"))));
}, (err, zipEntries) =>
{
	assert(!err);
	assert(seenZipEntry);
	assert.strictEqual(zipEntries.length, 1);
	assert.strictEqual(zipEntryData, zipEntries[0]);
});


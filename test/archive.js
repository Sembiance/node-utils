"use strict";

const XU = require("@sembiance/xu"),
	path = require("path"),
	tiptoe = require("tiptoe"),
	assert = require("assert"),
	fileUtil = require("../index").file,
	hashUtil = require("../index").hash,
	archiveUtil = require("../index").archive;

const TEST_PARAMS =
{
	tscomp     : {archiveFile : "TEST.TSC", filenames : ["INSTALL.EXE"], hash : {filename : "INSTALL.EXE", sum : "f1d79c4cb0821b9609d9f84f36e9b457"}},
	pcxlib     : {archiveFile : "POKER.PCL", filenames : ["asp.pcc", "cards.pcc", "deck.pcx", "emlogo.pcc", "poker.pcc", "welcome.pcc"], hash : {filename : "cards.pcc", sum : "386ef6988fd2bc620dfa186463b76b72"}},
	ico        : {archiveFile : "favicon.ico", filenames : [].pushSequence(0, 5).map(iconNum => ("favicon.ico-" + iconNum + ".png")), hash : {filename : "favicon.ico-1.png", sum : "23566c30f29db0d0c709a2266f36636d"}},
	zip        : {archiveFile : "test.zip", filenames : ["pewpewpew.flac", "subdir/zip_smile.png", "zip_hello.txt"], hash : {filename : "subdir/zip_smile.png", sum : "fe813e1041186ed0b65eb1e4bda01467"}},
	mscompress : {archiveFile : "REGISTER.TXT", filenames : ["REGISTER.TXT"], hash : {filename : "REGISTER.TXT", sum : "108b8cd039bac2bccf045c3cb582cfa2"}},
	rar        : {archiveFile : "cheats.rar", filenames : ["BLOOD3D.RAR", "CHEATS-T.RAR", "MAGIC-G.RAR", "MDKTRAIN.RAR"], hash : {filename : "MDKTRAIN.RAR", sum : "000352ddf886ef7ded10ac1f366f1956"}},
	powerpack  : {archiveFile : "hotachy1.anim.pp", filenames : ["hotachy1.anim"], hash : {filename : "hotachy1.anim", sum : "effe736a9641b42f50e5a4b865687f56"}}
};

Object.entries(TEST_PARAMS).serialForEach(([archiveType, archiveInfo], cb) =>
{
	tiptoe(
		function removeExisting()
		{
			archiveInfo.filenames.parallelForEach((filename, subcb) => fileUtil.unlink(path.join("/tmp", (filename.includes(path.sep) ? path.dirname(filename) : filename)), subcb), this);
		},
		function extract()
		{
			archiveUtil.extract(archiveType, path.join(__dirname, archiveInfo.archiveFile), "/tmp/", this);
		},
		function getOutputHash(extractedFiles)
		{
			assert(extractedFiles.equals(archiveInfo.filenames));
			
			hashUtil.hashFile(path.join("/tmp", archiveInfo.hash.filename), "md5", this);
		},
		function cleanupResults(hashResult)
		{
			assert.strictEqual(hashResult, archiveInfo.hash.sum);
			
			archiveInfo.filenames.parallelForEach((filename, subcb) => fileUtil.unlink(path.join("/tmp", (filename.includes(path.sep) ? path.dirname(filename) : filename)), subcb), this);
		},
		cb
	);
}, XU.FINISH);

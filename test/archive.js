"use strict";

const XU = require("@sembiance/xu"),
	path = require("path"),
	tiptoe = require("tiptoe"),
	assert = require("assert"),
	fileUtil = require("../index").file,
	hashUtil = require("../index").hash,
	archiveUtil = require("../index").archive;

const FILES_DIR = path.join(__dirname, "files");
const OUTPUT_DIR = fileUtil.generateTempFilePath();

/* eslint-disable comma-spacing, max-len */
const TEST_PARAMS =
{
	rsrc       : {archiveFile : "blackfor.rsrc", filenames : ["blackfor.000.icns"], hash : {filename : "blackfor.000.icns", sum : "1120f28a9ed0657c83263583f86825a0"}},
	stc        : {archiveFile : "MA2", filenames : ["MA2"], hash : {filename : "MA2", sum : "446f663a8882fc10f19fcf75a9b3dd1f"}},
	tscomp     : {archiveFile : "TWOFILES.TSC", filenames : ["A.TXT", "B.TXT"], hash : {filename : "B.TXT", sum : "fb59fc0592398f60b5d05299b2bb976f"}},
	lha        : {archiveFile : "hexify.lha", filenames : ["hexify/hexify.c","hexify/hexify.h","hexify/hexify.readme","hexify/LICENSE","hexify/Makefile","hexify/sample","hexify/sample.c"], hash : {filename : "hexify/Makefile", sum : "35f2105b032f4668b1d284e0404cb076"}},
	arc        : {archiveFile : "CHRISTIE.ARC", filenames : ["CHRISTIE.MAC","READMAC.EXE"], hash : {filename : "CHRISTIE.MAC", sum : "653620bafbbf434714bb8bbcb2563499"}},
	pcxlib     : {archiveFile : "POKER.PCL", filenames : ["ASP.PCC", "CARDS.PCC", "DECK.PCX", "EMLOGO.PCC", "POKER.PCC", "WELCOME.PCC"], hash : {filename : "CARDS.PCC", sum : "386ef6988fd2bc620dfa186463b76b72"}},
	ttcomp     : {archiveFile : "quickgif.__d", filenames : ["quickgif"], hash : {filename : "quickgif", sum : "0a34340a86c6a437bb6b7207b48b735a"}},
	sit        : {archiveFile : "blackfor.sit", filenames : ["BlackForest ƒ/BlackFor.rsrc","BlackForest ƒ/BlackForest.AFM","BlackForest ƒ/BlackForest.bmap.rsrc","BlackForest ƒ/Read Me First!!"], hash : {filename : "BlackForest ƒ/BlackFor.rsrc", sum : "4fee556ca486335cf9d0ea5c1165ff73"}},
	iso        : {archiveFile : "test.iso", filenames : ["autorun.inf","INET.exe","README.txt"], hash : {filename : "INET.exe", sum : "fcd64a8ff61ae4fd07fc7b8d3646b6e2"}},
	ico        : {archiveFile : "favicon.ico", filenames : [].pushSequence(0, 5).map(iconNum => ("favicon.ico-" + iconNum + ".png")), hash : {filename : "favicon.ico-1.png", sum : "4ac74e067d8e8851cb1e3204c6f8bffe"}},
	zip        : {archiveFile : "test.zip", filenames : ["pewpewpew.flac", "subdir/zip_smile.png", "zip_hello.txt"], hash : {filename : "subdir/zip_smile.png", sum : "fe813e1041186ed0b65eb1e4bda01467"}},
	mscompress : {archiveFile : "REGISTER.TXT", filenames : ["REGISTER.TXT"], hash : {filename : "REGISTER.TXT", sum : "108b8cd039bac2bccf045c3cb582cfa2"}},
	rar        : {archiveFile : "cheats.rar", filenames : ["BLOOD3D.RAR", "CHEATS-T.RAR", "MAGIC-G.RAR", "MDKTRAIN.RAR"], hash : {filename : "MDKTRAIN.RAR", sum : "000352ddf886ef7ded10ac1f366f1956"}},
	powerpack  : {archiveFile : "hotachy1.anim.pp", filenames : ["hotachy1.anim"], hash : {filename : "hotachy1.anim", sum : "effe736a9641b42f50e5a4b865687f56"}},
	xpk        : {archiveFile : "mod.chiquitomix.xpk", filenames : ["mod.chiquitomix"], hash : {filename : "mod.chiquitomix", sum : "7fd4465095f74dde0ac156afeb73c59d"}},
	tar        : {archiveFile : "sm.tar", filenames : ["sm-if09.jpg"], hash : {filename : "sm-if09.jpg", sum : "c5dd377dec72d6790737ad5209a73017"}},
	gz         : {archiveFile : "sm.tar.gz", filenames : ["sm.tar"], hash : {filename : "sm.tar", sum : "755d39f68c1d4a6323881bc6f0a30eac"}},
	bz2        : {archiveFile : "sm.tar.bz2", filenames : ["sm.tar"], hash : {filename : "sm.tar", sum : "755d39f68c1d4a6323881bc6f0a30eac"}},
	dms        : {archiveFile : "voyager.dms", filenames : ["voyager.adf"], hash : {filename : "voyager.adf", sum : "80562ebeff7cc970c7e7ec8bb6c69767"}},
	lzx        : {archiveFile : "xpk_compress.lzx", hash : {filename : "xpk_compress/xpkRAKE.library", sum : "8e14dd77450c4169721b6a87f4dcd747"}, filenames : ["xpk_compress/xpkBLZW.library","xpk_compress/xpkCBR0.library","xpk_compress/xpkCRM2.library","xpk_compress/xpkCRMS.library","xpk_compress/xpkDHUF.library","xpk_compress/xpkDLTA.library","xpk_compress/xpkENCO.library","xpk_compress/xpkFAST.library","xpk_compress/xpkFEAL.library","xpk_compress/xpkHFMN.library","xpk_compress/xpkHUFF.library","xpk_compress/xpkIDEA.library","xpk_compress/xpkIMPL.library","xpk_compress/xpkLHLB.library","xpk_compress/xpkMASH.library","xpk_compress/xpkNONE.library","xpk_compress/xpkNUKE.library","xpk_compress/xpkPWPK.library","xpk_compress/xpkRAKE.library","xpk_compress/xpkRDCN.library","xpk_compress/xpkRLEN.library","xpk_compress/xpkSHRI.library","xpk_compress/xpkSMPL.library","xpk_compress/xpkSQSH.library"]},
	amos       : {archiveFile : "recuento.amos", hash : {filename : "pic0E.iff", sum : "e3bbddc21e230a3cf744b2357278cbad"}, filenames : ["bank0E.abk","bank0F.abk","bank10.abk","bank11.abk","bank12.abk","pic0E.iff","pic0F.iff","pic10.iff","pic12.iff","recuento.amos_sourceCode","sample01.doble_.8svx","sample02.an____.8svx"]},
	adf        : {archiveFile : "darknews12.adf", hash : {filename : "DARKNEWS #12/MENU", sum : "9e02a3648b265d03fb35461260c26e62"}, filenames : ["DARKNEWS #12.blkdev","DARKNEWS #12.bootcode","DARKNEWS #12.xdfmeta","DARKNEWS #12/c/border","DARKNEWS #12/c/loader","DARKNEWS #12/c/run","DARKNEWS #12/c/txt","DARKNEWS #12/devs/system-configuration","DARKNEWS #12/DKS1","DARKNEWS #12/DKS2","DARKNEWS #12/DKS3","DARKNEWS #12/DKS4","DARKNEWS #12/DKS5","DARKNEWS #12/GEVALIA.info","DARKNEWS #12/MENU","DARKNEWS #12/s/startup-sequence"]}
};
/* eslint-enable comma-spacing, max-len */

tiptoe(
	function createOutDir()
	{
		fileUtil.mkdirp(OUTPUT_DIR, this);
	},
	function runTests()
	{
		Object.entries(TEST_PARAMS).serialForEach(([archiveType, archiveInfo], cb) =>
		{
			tiptoe(
				function removeExisting()
				{
					archiveInfo.filenames.parallelForEach((filename, subcb) => fileUtil.unlink(path.join(OUTPUT_DIR, (filename.includes(path.sep) ? path.dirname(filename) : filename)), subcb), this);
				},
				function extract()
				{
					archiveUtil.extract(archiveType, path.join(FILES_DIR, archiveInfo.archiveFile), OUTPUT_DIR, this);
				},
				function getOutputHash(extractedFiles)
				{
					assert(extractedFiles.equals(archiveInfo.filenames), "For [" + archiveType + "] GOT: " + JSON.stringify(extractedFiles) + "] and EXPECTED: " + JSON.stringify(archiveInfo.filenames) + " in: " + OUTPUT_DIR);
					
					hashUtil.hashFile("md5", path.join(OUTPUT_DIR, archiveInfo.hash.filename), this);
				},
				function verifyHash(hashResult)
				{
					assert.strictEqual(hashResult, archiveInfo.hash.sum);
					this();
				},
				cb
			);
		}, this);
	},
	function removeOutDir()
	{
		fileUtil.unlink(OUTPUT_DIR, this);
	},
	XU.FINISH
);

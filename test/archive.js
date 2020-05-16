"use strict";

const XU = require("@sembiance/xu"),
	path = require("path"),
	tiptoe = require("tiptoe"),
	assert = require("assert"),
	fs = require("fs"),
	fileUtil = require("../index").file,
	hashUtil = require("../index").hash,
	archiveUtil = require("../index").archive;

const FILES_DIR = path.join(__dirname, "files");
const OUTPUT_DIR = fileUtil.generateTempFilePath();

/* eslint-disable comma-spacing, max-len */
const TEST_PARAMS =
{
	adfOFS     : {archiveFile : "AegisSonix1.3.adf", hash : {filename : "Aegis-Sonixix 1.2/Instruments/TFI-001.-=>PB.instr", sum : "2cf6731680a67f1157e503f93e6d2fb3"}, filenames :  ["Aegis-Sonixix 1.2/.info","Aegis-Sonixix 1.2/c/Date","Aegis-Sonixix 1.2/c/Delete","Aegis-Sonixix 1.2/c/Dir","Aegis-Sonixix 1.2/c/echo","Aegis-Sonixix 1.2/c/EndCLI","Aegis-Sonixix 1.2/c/Format","Aegis-Sonixix 1.2/c/Info","Aegis-Sonixix 1.2/c/Install","Aegis-Sonixix 1.2/c/List","Aegis-Sonixix 1.2/c/LoadWB","Aegis-Sonixix 1.2/c/Makedir","Aegis-Sonixix 1.2/c/NewCLI","Aegis-Sonixix 1.2/c/Type","Aegis-Sonixix 1.2/c/WorkBench","Aegis-Sonixix 1.2/CLI","Aegis-Sonixix 1.2/d/ak","Aegis-Sonixix 1.2/d/bs.asm","Aegis-Sonixix 1.2/d/bs.do","Aegis-Sonixix 1.2/d/ck","Aegis-Sonixix 1.2/d/iff","Aegis-Sonixix 1.2/d/IFFCheck","Aegis-Sonixix 1.2/d/mk","Aegis-Sonixix 1.2/d/mp","Aegis-Sonixix 1.2/d/mt","Aegis-Sonixix 1.2/d/sleep","Aegis-Sonixix 1.2/d/sleep.asm","Aegis-Sonixix 1.2/d/sleep.do","Aegis-Sonixix 1.2/d/sst","Aegis-Sonixix 1.2/d/st","Aegis-Sonixix 1.2/d/sx","Aegis-Sonixix 1.2/d/sx.asm","Aegis-Sonixix 1.2/d/sx.do","Aegis-Sonixix 1.2/d/tp.asm","Aegis-Sonixix 1.2/d/tp.do","Aegis-Sonixix 1.2/d/wb","Aegis-Sonixix 1.2/devs/serial.device","Aegis-Sonixix 1.2/devs/system-configuration","Aegis-Sonixix 1.2/Disk.info","Aegis-Sonixix 1.2/Instruments/1.instr","Aegis-Sonixix 1.2/Instruments/12.21.85.instr","Aegis-Sonixix 1.2/Instruments/2.instr","Aegis-Sonixix 1.2/Instruments/AcousticGuitar.instr","Aegis-Sonixix 1.2/Instruments/AcousticGuitar.ss","Aegis-Sonixix 1.2/Instruments/Ardrey.instr","Aegis-Sonixix 1.2/Instruments/Ardrey2.instr","Aegis-Sonixix 1.2/Instruments/Atlantis.instr","Aegis-Sonixix 1.2/Instruments/Banjo.ss","Aegis-Sonixix 1.2/Instruments/Bass1.instr","Aegis-Sonixix 1.2/Instruments/BassDrum.instr","Aegis-Sonixix 1.2/Instruments/Bassdrum.ss","Aegis-Sonixix 1.2/Instruments/BassGuitar.instr","Aegis-Sonixix 1.2/Instruments/BassGuitar.ss","Aegis-Sonixix 1.2/Instruments/bella.instr","Aegis-Sonixix 1.2/Instruments/Bells.instr","Aegis-Sonixix 1.2/Instruments/BowBowBow.instr","Aegis-Sonixix 1.2/Instruments/Cello.instr","Aegis-Sonixix 1.2/Instruments/Clarinet.ss","Aegis-Sonixix 1.2/Instruments/Claves.instr","Aegis-Sonixix 1.2/Instruments/Claves.ss","Aegis-Sonixix 1.2/Instruments/Clavinet.instr","Aegis-Sonixix 1.2/Instruments/Cymbal.instr","Aegis-Sonixix 1.2/Instruments/Cymbal.ss","Aegis-Sonixix 1.2/Instruments/Default.instr","Aegis-Sonixix 1.2/Instruments/DELAY1.instr","Aegis-Sonixix 1.2/Instruments/DistortedGuitar.instr","Aegis-Sonixix 1.2/Instruments/DistortedGuitar.ss","Aegis-Sonixix 1.2/Instruments/Dreamy1.instr","Aegis-Sonixix 1.2/Instruments/Dreamy2.instr","Aegis-Sonixix 1.2/Instruments/DX7-001.-=>PB.instr","Aegis-Sonixix 1.2/Instruments/Echo1.instr","Aegis-Sonixix 1.2/Instruments/Echo2.instr","Aegis-Sonixix 1.2/Instruments/Echo3.instr","Aegis-Sonixix 1.2/Instruments/EchoBells.instr","Aegis-Sonixix 1.2/Instruments/ElectricPiano1.instr","Aegis-Sonixix 1.2/Instruments/ElectricPiano2.instr","Aegis-Sonixix 1.2/Instruments/EnsoniqSnare1.instr","Aegis-Sonixix 1.2/Instruments/EnsoniqSnare2.instr","Aegis-Sonixix 1.2/Instruments/Flute.instr","Aegis-Sonixix 1.2/Instruments/Flute.ss","Aegis-Sonixix 1.2/Instruments/FORM.tech","Aegis-Sonixix 1.2/Instruments/Funny1.instr","Aegis-Sonixix 1.2/Instruments/Funny2.instr","Aegis-Sonixix 1.2/Instruments/Funny3.instr","Aegis-Sonixix 1.2/Instruments/Harpsichord1.instr","Aegis-Sonixix 1.2/Instruments/Harpsichord2.Instr","Aegis-Sonixix 1.2/Instruments/HeavyMetal.instr","Aegis-Sonixix 1.2/Instruments/HeavyMetal.ss","Aegis-Sonixix 1.2/Instruments/HighHat.instr","Aegis-Sonixix 1.2/Instruments/IceBells.instr","Aegis-Sonixix 1.2/Instruments/IceBells2.instr","Aegis-Sonixix 1.2/Instruments/IFF Electric Bass.instr","Aegis-Sonixix 1.2/Instruments/IFF Electric Piano.instr","Aegis-Sonixix 1.2/Instruments/IFF Saxophone.instr","Aegis-Sonixix 1.2/Instruments/IFF Vibes.instr","Aegis-Sonixix 1.2/Instruments/Koto1.instr","Aegis-Sonixix 1.2/Instruments/Koto3.instr","Aegis-Sonixix 1.2/Instruments/Marimba.instr","Aegis-Sonixix 1.2/Instruments/Metal1.instr","Aegis-Sonixix 1.2/Instruments/Metal2.instr","Aegis-Sonixix 1.2/Instruments/MIDI.tech","Aegis-Sonixix 1.2/Instruments/MIDIPatch.instr","Aegis-Sonixix 1.2/Instruments/MisterGONE.-=>PB.instr","Aegis-Sonixix 1.2/Instruments/Orchestra.instr","Aegis-Sonixix 1.2/Instruments/Organ1.instr","Aegis-Sonixix 1.2/Instruments/Organ2.instr","Aegis-Sonixix 1.2/Instruments/Organ3.instr","Aegis-Sonixix 1.2/Instruments/Organ5.instr","Aegis-Sonixix 1.2/Instruments/PipeOrgan.instr","Aegis-Sonixix 1.2/Instruments/PipeOrgan.ss","Aegis-Sonixix 1.2/Instruments/Reed.instr","Aegis-Sonixix 1.2/Instruments/ReverbBells.instr","Aegis-Sonixix 1.2/Instruments/SampledSound.tech","Aegis-Sonixix 1.2/Instruments/sandy.instr","Aegis-Sonixix 1.2/Instruments/Saxophone.instr","Aegis-Sonixix 1.2/Instruments/Saxophone.ss","Aegis-Sonixix 1.2/Instruments/SNARE2.instr","Aegis-Sonixix 1.2/Instruments/SnareDrum.instr","Aegis-Sonixix 1.2/Instruments/SnareDrum.ss","Aegis-Sonixix 1.2/Instruments/SpaceVibes.instr","Aegis-Sonixix 1.2/Instruments/Strings.instr","Aegis-Sonixix 1.2/Instruments/Strings.ss","Aegis-Sonixix 1.2/Instruments/Synth1.instr","Aegis-Sonixix 1.2/Instruments/Synth2.instr","Aegis-Sonixix 1.2/Instruments/SynthBanjo.instr","Aegis-Sonixix 1.2/Instruments/SynthBass1.instr","Aegis-Sonixix 1.2/Instruments/SynthBells.instr","Aegis-Sonixix 1.2/Instruments/Synthesis.tech","Aegis-Sonixix 1.2/Instruments/TFI-001.-=>PB.instr","Aegis-Sonixix 1.2/Instruments/Tibet1.instr","Aegis-Sonixix 1.2/Instruments/TomDrum.instr","Aegis-Sonixix 1.2/Instruments/TomDrum.ss","Aegis-Sonixix 1.2/Instruments/Tomita.instr","Aegis-Sonixix 1.2/Instruments/Trumpet.instr","Aegis-Sonixix 1.2/Instruments/Trumpet.ss","Aegis-Sonixix 1.2/Instruments/Trumpet2.instr","Aegis-Sonixix 1.2/Instruments/Tuba.instr","Aegis-Sonixix 1.2/Instruments/Vibes.ss","Aegis-Sonixix 1.2/Instruments/Violin.instr","Aegis-Sonixix 1.2/libs/icon.library","Aegis-Sonixix 1.2/libs/info.library","Aegis-Sonixix 1.2/Miscellaneous/AmigaKeyboard.code","Aegis-Sonixix 1.2/Miscellaneous/Bootstrap","Aegis-Sonixix 1.2/Miscellaneous/ColortoneKeyboard.code","Aegis-Sonixix 1.2/Miscellaneous/Keyboard.code","Aegis-Sonixix 1.2/Miscellaneous/MIDIKeyboard.code","Aegis-Sonixix 1.2/Miscellaneous/Sonix.code","Aegis-Sonixix 1.2/Miscellaneous/TypeMe","Aegis-Sonixix 1.2/s/startup-sequence","Aegis-Sonixix 1.2/Scores/A View to a Kill.smus","Aegis-Sonixix 1.2/Scores/Abby Road.smus","Aegis-Sonixix 1.2/Scores/Angels Heard on High.smus","Aegis-Sonixix 1.2/Scores/Axel F.smus","Aegis-Sonixix 1.2/Scores/Clam City.smus","Aegis-Sonixix 1.2/Scores/Ghost Busters.smus","Aegis-Sonixix 1.2/Scores/hansel.smus","Aegis-Sonixix 1.2/Scores/Miami Vice.smus","Aegis-Sonixix 1.2/Scores/michi2.smus","Aegis-Sonixix 1.2/Scores/Sonix.smusmus","Aegis-Sonixix 1.2/Scores/Spanish Flea.smus","Aegis-Sonixix 1.2/Scores/YBTTC2.smus","Aegis-Sonixix 1.2/Scores/You Belong to the City.smus","Aegis-Sonixix 1.2/Sonix","Aegis-Sonixix 1.2/Sonix.info","Aegis-Sonixix 1.2/t/ed-backupequence","Aegis-Sonixix 1.2/thewizards"]},
	adfFFS     : {archiveFile : "darknews12.adf", hash : {filename : "DARKNEWS #12/MENU", sum : "9e02a3648b265d03fb35461260c26e62"}, filenames : ["DARKNEWS #12.blkdev","DARKNEWS #12.bootcode","DARKNEWS #12.xdfmeta","DARKNEWS #12/c/border","DARKNEWS #12/c/loader","DARKNEWS #12/c/run","DARKNEWS #12/c/txt","DARKNEWS #12/devs/system-configuration","DARKNEWS #12/DKS1","DARKNEWS #12/DKS2","DARKNEWS #12/DKS3","DARKNEWS #12/DKS4","DARKNEWS #12/DKS5","DARKNEWS #12/GEVALIA.info","DARKNEWS #12/MENU","DARKNEWS #12/s/startup-sequence"]},
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
	amos       : {archiveFile : "recuento.amos", hash : {filename : "pic0E.iff", sum : "e3bbddc21e230a3cf744b2357278cbad"}, filenames : ["bank0E.abk","bank0F.abk","bank10.abk","bank11.abk","bank12.abk","pic0E.iff","pic0F.iff","pic10.iff","pic12.iff","recuento.amos_sourceCode","sample01.doble_.8svx","sample02.an____.8svx"]}
};
/* eslint-enable comma-spacing, max-len */

tiptoe(
	function createOutDir()
	{
		fs.mkdir(OUTPUT_DIR, {recursive : true}, this);
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

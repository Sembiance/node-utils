"use strict";

const assert = require("assert"),
	path = require("path"),
	dustUtil = require("../index").dust;

const FILES_DIR = path.join(__dirname, "files");

const expectedResult = " 123abcWOOT ";
dustUtil.render(FILES_DIR, "test", {abc : 123, letters : ["a", "b", "c"]}, (err, result) => assert.equal(result, expectedResult));

const expectedResultWithWhitespace = " 123\n\tabcWOOT ";
dustUtil.render(FILES_DIR, "test", {abc : 123, letters : ["a", "b", "c"]}, {keepWhitespace : true}, (err, result) => assert.equal(result, expectedResultWithWhitespace));

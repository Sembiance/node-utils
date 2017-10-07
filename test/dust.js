"use strict";

const assert = require("assert"),
	path = require("path"),
	dustUtil = require("../index").dust;

const expectedResult = " 123abcWOOT ";
dustUtil.render(path.join(__dirname), "test", {abc : 123, letters : ["a", "b", "c"]}, (err, result) => assert.equal(result, expectedResult));

const expectedResultWithWhitespace = " 123\n\tabcWOOT ";
dustUtil.render(path.join(__dirname), "test", {abc : 123, letters : ["a", "b", "c"]}, {keepWhitespace : true}, (err, result) => assert.equal(result, expectedResultWithWhitespace));

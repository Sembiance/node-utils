"use strict";

var assert = require("assert"),
	path = require("path"),
	dustUtil = require("../index").dust;

var expectedResult = " 123abcWOOT ";
dustUtil.render(path.join(__dirname), "test", {abc:123, letters : ["a", "b", "c"]}, function(err, result) { assert.equal(result, expectedResult); });

var expectedResultWithWhitespace = " 123\n\tabcWOOT ";
dustUtil.render(path.join(__dirname), "test", {abc:123, letters : ["a", "b", "c"]}, { keepWhitespace : true }, function(err, result) { assert.equal(result, expectedResultWithWhitespace); });


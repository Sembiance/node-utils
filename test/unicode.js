"use strict";

var assert = require("assert"),
	unicodeUtil = require("../index").unicode;

var unicodeText = "ÀÆÇD";
var asciiText = "AAECD";

assert.equal(unicodeUtil.unicodeToAscii(unicodeText), asciiText);

var categoryString = "aÀ8‮5!＇♥ \t";
var categories = [ "letter", "letter", "number", "other", "number", "punctuation", "punctuation", "symbol", "space", "other" ];

assert.equal(unicodeUtil.getCategories(categoryString).join(), categories.join());

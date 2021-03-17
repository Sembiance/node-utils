"use strict";

const assert = require("assert"),
	unicodeUtil = require("../index").unicode;

const unicodeText = "ÀÆÇD";
const asciiText = "AAECD";

assert.equal(unicodeUtil.containsUnicode(unicodeText), true);
assert.equal(unicodeUtil.containsUnicode(asciiText), false);

assert.equal(unicodeUtil.unicodeToAscii(unicodeText), asciiText);

const categoryString = "aÀ8‮5!＇♥ \t";
const categories = ["letter", "letter", "number", "other", "number", "punctuation", "punctuation", "symbol", "space", "other"];

assert.equal(unicodeUtil.getCategories(categoryString).join(), categories.join());

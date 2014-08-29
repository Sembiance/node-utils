"use strict";

var assert = require("assert"),
	httpUtil = require("../index").http;

httpUtil.get("http://telparia.com", function(err, data) { console.log(data.toString("utf8")); });

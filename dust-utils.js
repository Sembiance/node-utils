"use strict";

var base = require("node-base"),
	step = require("step"),
	path = require("path"),
	fs = require("fs");

exports.render = render;
function render(basePath, name, data, cb)
{
	var readDustFile = function(name, cb) { fs.readFile(path.join(basePath, name + (name.endsWith(".dust") ? "" : ".dust")), "utf8", cb); };

	var dust = require("dustjs-linkedin");
	dust.onLoad = readDustFile;

	step(
		function loadTemplate()
		{
			readDustFile(name, this);
		},
		function render(err, template)
		{
			if(err)
				throw err;

			dust.renderSource(template, data, this);
		},
		function returnResult(err, result) { cb(err, result); }
	);
}

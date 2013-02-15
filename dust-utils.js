"use strict";

var base = require("node-base"),
	tiptoe = require("tiptoe"),
	path = require("path"),
	fs = require("fs");

exports.render = render;
function render(basePath, name, data, options, cb)
{
	if(!cb)
	{
		cb = options;
		options = null;
	}

	options = options || {};

	var readDustFile = function(name, cb) { fs.readFile(path.join(basePath, name + (name.endsWith(".dust") ? "" : ".dust")), "utf8", cb); };

	var dust = require("dustjs-linkedin");
	dust.onLoad = readDustFile;

	tiptoe(
		function loadTemplate()
		{
			readDustFile(name, this);
		},
		function render(template)
		{
			dust.optimizers.format = function(ctx, node) { if(options.keepWhitespace) { return node; } };
			dust.renderSource(template, data, this);
		},
		function returnResult(err, result) { cb(err, result); }
	);
}

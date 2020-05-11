"use strict";

const XU = require("@sembiance/xu"),
	tiptoe = require("tiptoe"),
	path = require("path"),
	fs = require("fs");

exports.render = render;
function render(basePath, name, data, _options, _cb)
{
	const {options, cb} = XU.optionscb(_options, _cb);

	const readDustFile = function(n, subcb) { fs.readFile(path.join(basePath, n + (n.endsWith(".dust") ? "" : ".dust")), "utf8", subcb); };

	const dust = require("dustjs-linkedin");	// eslint-disable-line node/global-require

	if(options.disableCache)
		dust.config.cache = false;

	dust.filters.lowercase = value => (typeof value==="string" ? value.toLowerCase() : value);

	dust.helper = require("dustjs-helpers");	// eslint-disable-line node/global-require
	dust.onLoad = readDustFile;

	tiptoe(
		function loadTemplate()
		{
			readDustFile(name, this);
		},
		function performRender(template)
		{
			dust.optimizers.format = function format(ctx, node)
			{
				if(options.keepWhitespace)
					return node;
			};
			dust.renderSource(template, data, this);
		},
		cb
	);
}

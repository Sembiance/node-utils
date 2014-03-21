"use strict";

var base = require("xbase"),
	runUtil = require("./run.js"),
	tiptoe = require("tiptoe");

exports.getWidthHeight = getWidthHeight;
function getWidthHeight(file, cb)
{
    tiptoe(
        function getSize()
        {
            runUtil.run("identify", ["-quiet", file], {silent:true}, this);
        },
        function processSizes(err, result)
        {
            if(err)
                return cb(err);

            var matches = result.trim().match(/[^ ]+ [^ ]+ ([0-9]+)x([0-9]+) .*/);

            cb(null, [+matches[1], +matches[2]]);
        }
    );
}

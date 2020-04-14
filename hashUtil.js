"use strict";

const XU = require("@sembiance/xu"),
	fs = require("fs"),
	tiptoe = require("tiptoe"),
	fileUtil = require("./fileUtil.js"),
	crypto = require("crypto");


exports.hashFile = hashFile;
function hashFile(filePath, algorithm, cb)
{
	tiptoe(
		function checkExistance()
		{
			fileUtil.exists(filePath, this);
		},
		function performHashing(exists)
		{
			if(!exists)
				throw new Error("Unable to access file: " + filePath);
			
			const fd = fs.createReadStream(filePath);
			const h = crypto.createHash(algorithm);
			h.setEncoding("hex");
			fd.on("end", () => { h.end(); this(undefined, h.read()); });
			fd.pipe(h);
		},
		cb
	);
}

exports.hash = hash;
function hash(data, algorithm)
{
	return crypto.createHash(algorithm).update(data).digest("hex");
}

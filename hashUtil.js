"use strict";

const XU = require("@sembiance/xu"),
	fs = require("fs"),
	tiptoe = require("tiptoe"),
	fileUtil = require("./fileUtil.js"),
	crypto = require("crypto");


exports.hashFile = hashFile;
function hashFile(algorithm, filePath, cb)
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
			
			const fileStream = fs.createReadStream(filePath);
			const h = crypto.createHash(algorithm);
			h.setEncoding("hex");
			fileStream.on("end", () => { h.end(); this(undefined, h.read()); });
			fileStream.on("error", err => this(err));
			fileStream.pipe(h);
		},
		cb
	);
}

exports.hash = hash;
function hash(algorithm, data)
{
	return crypto.createHash(algorithm).update(data).digest("hex");
}

"use strict";
const XU = require("@sembiance/xu"),
	fs = require("fs"),
	tiptoe = require("tiptoe"),
	fileUtil = require("./fileUtil.js"),
	runUtil = require("./runUtil.js"),
	crypto = require("crypto");


// Algo list: openssl list -digest-algorithms

exports.hashFile = hashFile;
function hashFile(algorithm, filePath, cb)
{
	if(!cb)
		throw new Error("No callback! Did you forget to include the algorithm?");
	
	if(algorithm==="blake3")
	{
		tiptoe(
			function runB3Sum()
			{
				runUtil.run("b3sum", ["--no-names", "--num-threads", "6", filePath], {silent : true}, this);
			},
			function returnResult(result)
			{
				this(undefined, result.trim());
			},
			cb
		);
	}
	else
	{
		tiptoe(
			function checkExistance()
			{
				fileUtil.exists(filePath, this);
			},
			function performHashing(exists)
			{
				if(!exists)
					return this();
				
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
}

exports.hash = hash;
function hash(algorithm, data)
{
	return crypto.createHash(algorithm).update(data).digest("hex");
}

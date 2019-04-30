"use strict";

const XU = require("@sembiance/xu"),
	tiptoe = require("tiptoe"),
	yauzl = require("yauzl");

// Will read the entries in the given zipFile (Buffer or string path) and call entryChecker(entry) and every time it returns true it will call fileHandler(entry, entryData) and call cb when all done
exports.readZipEntries = function readZipEntries(zipPath, entryChecker, fileHandler, cb)
{
	const zipEntries = [];

	tiptoe(
		function openZip()
		{
			yauzl[(typeof zipPath==="string" ? "open" : "fromBuffer")](zipPath, { lazyEntries : true }, this);
		},
		function readEntries(zipFile)
		{
			zipFile.once("end", this);
			zipFile.on("entry", entry =>
			{
				if(!entryChecker(entry))
					return setImmediate(() => zipFile.readEntry());
				
				const chunks = [];
				zipFile.openReadStream(entry, (err, readStream) =>
				{
					if(err)
						return this(err);
					
					readStream.on("error", readStreamErr => this(readStreamErr));
					readStream.on("data", chunk => chunks.push(chunk));
					readStream.once("end", () =>
					{
						const entryData = Buffer.concat(chunks);
						zipEntries.push(entryData);

						fileHandler(entry, entryData);
						zipFile.readEntry();
					});
					readStream.read(entry.uncompressedSize);
				});
			});

			zipFile.readEntry();
		},
		function returnResult(err)
		{
			cb(err, zipEntries);
		}
	);
};

"use strict";
const XU = require("@sembiance/xu"),
	fs = require("fs"),
	tiptoe = require("tiptoe"),
	FTPClient = require("ftp");

exports.download = function download(targetURL, destinationPath, cb, existingClient)
{
	const c = existingClient || new FTPClient();
	const u = new URL(targetURL);

	tiptoe(
		function connectToServer()
		{
			c.on("error", err => this.finish(err));
			c.on("ready", this);
			if(existingClient)
				return this();

			c.connect({host : u.hostname, p : (u.port ? +u.port : 21)});
		},
		function openDLStream()
		{
			c.get(u.pathname.replaceAll("%23", "#").replaceAll("%20", " "), this);
		},
		function pipeToDisk(stream)
		{
			stream.once("close", this);
			stream.pipe(fs.createWriteStream(destinationPath, {encoding : "binary"}));
		},
		function disconnect()
		{
			if(existingClient)
				return this();

			c.on("end", this);
			c.end();
		},
		cb
	);
};

exports.connect = function connect(host, cb, p=21)
{
	const c = new FTPClient();

	tiptoe(
		function connectToServer()
		{
			c.on("error", err => this.finish(err));
			c.on("ready", this);
			c.connect({host, p});
		},
		function returnClient()
		{
			this(undefined, c);
		},
		cb
	);
};

exports.disconnect = function disconnect(client, cb)
{
	client.on("end", cb);
	client.end();
};

"use strict";
/*global setImmediate: true*/
/* eslint-disable no-param-reassign */

const XU = require("@sembiance/xu"),
	childProcess = require("child_process");

exports.run = function run(command, args, options={}, cb)
{
	if(!options.silent)
		console.log("RUNNING%s: %s %s", (options.cwd ? " (cwd: " + options.cwd + ")": ""), command, args.join(" "));
	if(!options.maxBuffer)
		options.maxBuffer = (1024*1024)*20;	// 20MB Buffer
	if(!options.hasOwnProperty("redirect-stderr"))
		options["redirect-stderr"] = true;
	
	let p = null;
	if(options.detached)
	{
		const cp = childProcess.spawn(command, args, options);
		return setImmediate(() => cb(undefined, cp));
	}

	if(cb)
		p = childProcess.execFile(command, args, options, handler);
	else
		p = childProcess.execFile(command, args, handler);

	if(options.liveOutput)
	{
		p.stdout.pipe(process.stdout);
		p.stderr.pipe(process.stderr);
	}

	if(options.inputData)
		p.stdin.end(options.inputData);

	function handler(err, stdout, stderr)
	{
		if(options["ignore-errors"])
			err = null;
		if(options["ignore-stderr"])
			stderr = null;

		if(stderr)
		{
			stderr = stderr.replace(/Xlib:[ ]+extension "RANDR" missing on display "[^:]*:[^"]+".\n?/, "");
			stderr = stderr.trim();
			if(!stderr.length)
				stderr = null;
		}

		if(options["redirect-stderr"] && (err || stderr))
		{
			if(err)
			{
				stdout = err + stdout;
				err = undefined;
			}

			if(stderr)
			{
				stdout = stderr + stdout;
				stderr = undefined;
			}
		}

		if(options.verbose)
			console.log("%s %s\n%s %s", command, args.join(" "), stdout || "", stderr || "");

		if(cb)
		{
			if(options["redirect-stderr"])
				setImmediate(() => cb(err || stderr, stdout));
			else
				setImmediate(() => cb(err || stderr, stdout, stderr));
		}
		else
		{
			options(err || stderr, stdout, stderr);
		}
	}

	return p;
};

exports.SILENT = {silent : true};
exports.VERBOSE = {verbose : true};

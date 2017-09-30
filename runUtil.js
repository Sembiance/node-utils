"use strict";
/*global setImmediate: true*/

var base = require("@sembiance/xbase"),
	child_process = require("child_process");

exports.run = function run(command, args, options, cb)
{
	options = options || {};
	
	if(!options.silent)
		base.info("RUNNING%s: %s %s", (options.cwd ? " (cwd: " + options.cwd + ")": ""), command, args.join(" "));
	if(!options.maxBuffer)
		options.maxBuffer = (1024*1024)*20;    // 20MB Buffer
	if(!options.hasOwnProperty("redirect-stderr"))
		options["redirect-stderr"] = true;
	
	var p;
	if(cb)
		p = child_process.execFile(command, args, options, handler);
	else
		p = child_process.execFile(command, args, handler);

	if(options.liveOutput)
	{
		p.stdout.pipe(process.stdout);
		p.stderr.pipe(process.stderr);
	}

	function handler(err, stdout, stderr)
	{
		if(options["ignore-errors"])
			err = null;
		if(options["ignore-stderr"])
			stderr = null;

		if(stderr)
		{
			stderr = stderr.replace(/Xlib:[ ]+extension \"RANDR\" missing on display \"[^:]*:[^"]+\".\n?/, "");
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

		if(options["verbose"])
			base.info("%s %s\n%s %s", command, args.join(" "), stdout || "", stderr || "");

		if(cb)
		{
			if(options["redirect-stderr"])
				setImmediate(function() { cb(err || stderr, stdout); });
			else
				setImmediate(function() { cb(err || stderr, stdout, stderr); });
		}
		else
			options(err || stderr, stdout, stderr);
	}
};

exports.SILENT = {silent : true};

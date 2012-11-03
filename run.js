"use strict";

var base = require("node-base"),
	child_process = require("child_process");

exports.run = function run(command, args, options, cb)
{
	if(!options.silent)
		base.info("%G: %Y %s", "RUNNING", command, args.join(" "));
	if(!options.maxBuffer)
		options.maxBuffer = (1024*1024)*20;    // 20MB Buffer
	
	if(cb)
		child_process.execFile(command, args, options, handler);
	else
		child_process.execFile(command, args, handler);

	function handler(err, stdout, stderr)
	{
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

		if(options["verbose"] && (stderr || (stdout && stdout.length)))
			base.info("%G: %Y %s\n", "OUTPUT", command, args.join(" "), (stderr || stdout));

		if(cb)
			cb(err || stderr, stdout, stderr);
		else
			options(err || stderr, stdout, stderr);
	}
};

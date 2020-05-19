"use strict";
/* eslint-disable no-param-reassign */

const XU = require("@sembiance/xu"),
	tiptoe = require("tiptoe"),
	videoUtil = require("./videoUtil.js"),
	fileUtil = require("./fileUtil.js"),
	childProcess = require("child_process");

const xvfbPorts = [].pushSequence(10, 999).shuffle();

// Options include:
//        detached : Set to 'true' and have the cb be called right away, with the childProcess result
//         verbose : Set to 'true' to console.log() the command, stdout and stderr
//          silent : Set to 'true' to not output anything at all
//       maxBuffer : Set maximum buffer size for stdout
//      liveOutput : Set to 'true' to pipe stdout and stderr of the process to the equilivant live stdout/stderr streams
//       inputData : Pass data to 'stdin' of the process
// redirect-stderr : Redirect all stderr content to stdout result
//             env : Pass an object of key/value pairs to set for environment variables
//         timeout : Number of 'ms' to allow the process to run and then terminate it
//        virtualX : Run the program in a 'virtual' X11 buffer
//  recordVirtualX : Record a video of the virtualX display to disk.
exports.run = function run(command, _args, _options, _cb)
{
	// Can't use XU.optionscb because _options and _cb are both optional
	const cb = typeof _cb==="function" ? _cb : (typeof _options==="function" ? _options : (() => {}));
	const options = Object.assign({maxBuffer : (1024*1024)*20, "redirect-stderr" : true}, (typeof _cb==="function" ? _options : (Object.isObject(_options) ? _options : {})));

	if(!options.env)
		options.env = Object.assign({}, process.env);	// eslint-disable-line node/no-process-env
	else
		options.env = Object.assign(Object.assign({}, process.env), options.env);	// eslint-disable-line node/no-process-env
	
	const args = _args.slice();

	const virtualX = {};
	function setupVirtualX(setupcb)
	{
		if(!options.virtualX)
			return setImmediate(setupcb);

		virtualX.port = xvfbPorts.pop();
		xvfbPorts.unshift(virtualX.port);
		options.env.DISPLAY = ":" + virtualX.port;

		tiptoe(
			function startXvfb()
			{
				exports.run("Xvfb", [":" + virtualX.port, "-listen", "tcp", "-nocursor", "-ac", "-screen", "0", "1920x1080x24"], {silent : true, detached : true}, this);
			},
			function setBackgroundPink(xvfbCP)
			{
				virtualX.xvfbCP = xvfbCP;

				// If we are not recording, we don't need a pink background, so we can continue
				if(!options.recordVirtualX)
					return this.finish();
				
				exports.run("xsetroot", ["-solid", "Pink"], {env : {DISPLAY : ":" + virtualX.port}, silent : true, detached : true}, this);
			},
			function startRecording()
			{
				virtualX.vidFilePath = fileUtil.generateTempFilePath("/mnt/ram", ".mp4");
				const ffmpegArgs = ["-f", "x11grab", "-draw_mouse", "0", "-video_size", "1920x1080", "-i", "127.0.0.1:" + virtualX.port, "-y", "-c:v", "libx264rgb", "-crf", "0", "-preset", "ultrafast", "-r", "60", virtualX.vidFilePath];
				exports.run("ffmpeg", ffmpegArgs, {silent : true, detached : true}, this);
			},
			function recordFFMPEGCP(ffmpegCP)
			{
				virtualX.ffmpegCP = ffmpegCP;

				this();
			},
			setupcb
		);
	}

	function cleanupVirtualX(cleanupcb)
	{
		if(!options.virtualX)
			return setImmediate(cleanupcb);
		
		tiptoe(
			function stopFFMPEG()
			{
				if(!options.recordVirtualX)
					return this();

				virtualX.ffmpegCP.on("exit", () => this());
				virtualX.ffmpegCP.kill();
			},
			function stopXvfb()
			{
				virtualX.xvfbCP.on("exit", () => this());
				virtualX.xvfbCP.kill();
			},
			function cropVideo()
			{
				if(!options.recordVirtualX)
					return this.finish();

				virtualX.croppedVideoPath = fileUtil.generateTempFilePath("/mnt/ram", ".mp4");
				videoUtil.autocrop(virtualX.vidFilePath, virtualX.croppedVideoPath, {cropColor : "#FFC0CB"}, this);
			},
			function trimVideo()
			{
				videoUtil.trimSolidFrames(virtualX.croppedVideoPath, options.recordVirtualX, {color : "#FFC0CB", fuzz : 0, fps : 30}, this);
			},
			function removeTmpVideoFiles()
			{
				fileUtil.unlink(virtualX.vidFilePath, this.parallel());
				fileUtil.unlink(virtualX.croppedVideoPath, this.parallel());
			},
			cleanupcb
		);
	}

	const stdout = [];
	const stderr = [];
	let cp = null;

	setupVirtualX(() =>
	{
		if(!options.silent)
			console.log("RUNNING%s: %s %s", (options.cwd ? " (cwd: " + options.cwd + ")": ""), command, args.join(" "));
		
		cp = childProcess.spawn(command, args, options);
		cp.stdout.on("data", v =>
		{
			if(options.liveOutput)
				process.stdout.write(v.toString("utf8"));

			stdout.push(v);
		});
		if(!options["ignore-errors"] && !options["ignore-stderr"])
		{
			cp.stderr.on("data", v =>
			{
				if(options.liveOutput)
					process.stderr.write(v);

				(options["redirect-stderr"] ? stdout : stderr).push(v.toString("utf8"));
			});
		}

		if(options.inputData)
			cp.stdin.end(options.inputData);

		cp.on("exit", exitHandler);
		
		if(options.detached)
			return cb(undefined, cp);
	});

	function exitHandler()
	{
		cleanupVirtualX(() =>
		{
			//if(stderr)
			//	stderr.filterInPlace(line => !line.match(/Xlib: +extension "RANDR" missing on display "[^:]*:[^"]+".\n?/));

			if(options.verbose)
				console.log("%s %s\n%s %s", command, args.join(" "), stdout.join(""), stderr.join(""));

			if(stderr)
				return cb(stderr.join(""), stdout.join(""));
			
			cb(undefined, stdout.join(""));
		});
	}
};

exports.SILENT = {silent : true};
exports.VERBOSE = {verbose : true};
exports.SILENTX = { silent : true, env : { DISPLAY : ":0" } };

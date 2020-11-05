"use strict";
/* eslint-disable no-param-reassign */
const XU = require("@sembiance/xu"),
	path = require("path"),
	os = require("os"),
	fs = require("fs"),
	fileUtil = require("./index.js").file,
	videoUtil = require("./index.js").video,
	tiptoe = require("tiptoe"),
	childProcess = require("child_process");

// Options include:
//            detached : Set to 'true' and have the cb be called right away, with the childProcess result
//             verbose : Set to 'true' to console.log() the command, stdout and stderr
//              silent : Set to 'true' to not output anything at all
//           maxBuffer : Set maximum buffer size for stdout
//          liveOutput : Set to 'true' to pipe stdout and stderr of the process to the equilivant live stdout/stderr streams
//           inputData : Pass data to 'stdin' of the process
//     redirect-stderr : Redirect all stderr content to stdout result
//	   redirect-stdout : Redirect stdout to a given file path
//                 env : Pass an object of key/value pairs to set for environment variables
//             timeout : Number of 'ms' to allow the process to run and then terminate it
//			tmpDirPath : The path to use for temporary files (used in video recording)
//            virtualX : Set to true to run this in a virtual X environment
//     portNumFilePath : If virtualX, record the virtual framebuffer port number to portNumFilePath
// recordVideoFilePath : If virtualX, record the session as a video to recordVideoFilePath
//       dontCropVideo : Set to true to skip cropping of the output video
//    videoProcessedCB : If virtualX and recordVideoFilePath, this is the callback to call once the video is done being processed
exports.run = function run(_command, _args, _options={}, cb=() => {})
{
	const options = XU.clone(_options);
	if(!options.maxBuffer)
		options.maxBuffer = (1024*1024)*20;	// 20MB Buffer
	if(!options.hasOwnProperty("redirect-stderr"))
		options["redirect-stderr"] = true;
	if(options.hasOwnProperty("timeout") && !options.hasOwnProperty("killSignal"))
		options.killSignal = "SIGINT";
	
	const command = _command;
	const args = _args.slice();

	let xvfbCP = null;
	
	const recordedVidFilePath = options.recordVideoFilePath ? fileUtil.generateTempFilePath(options.tmpDirPath || os.tmpdir(), ".mp4") : null;
	const croppedVidFilePath = options.recordVideoFilePath ? fileUtil.generateTempFilePath(options.tmpDirPath || os.tmpdir(), ".mp4") : null;
	const trimmedVidFilePath = options.recordVideoFilePath ? fileUtil.generateTempFilePath(options.tmpDirPath || os.tmpdir(), ".mp4") : null;
	let ffmpegCP = null;

	const finalizeVideo = function finalizeVideo(finalizecb=() => {})
	{
		tiptoe(
			function cropVideo()
			{
				if(options.dontCropVideo)
					fs.symlink(recordedVidFilePath, croppedVidFilePath, this);
				else
					videoUtil.autocrop(recordedVidFilePath, croppedVidFilePath, {cropColor : "#FFC0CB"}, this);
			},
			function trimVideo() { videoUtil.trimSolidFrames(croppedVidFilePath, trimmedVidFilePath, {color : "#FFC0CB", fuzz : 0, fps : 30}, this); },
			function makeBrowserFriendly() { exports.run("ffmpeg", ["-i", trimmedVidFilePath, "-c:v", "libx264", "-crf", "1", "-preset", "slow", options.recordVideoFilePath], exports.SILENT, this); },
			function cleanupVids()
			{
				fileUtil.unlink(recordedVidFilePath, this.parallel());
				fileUtil.unlink(croppedVidFilePath, this.parallel());
				fileUtil.unlink(trimmedVidFilePath, this.parallel());
			},
			finalizecb
		);
	};

	if(options.virtualX)
	{
		const existingSessions = fileUtil.globSync("/tmp/.X11-unix", "X*", {nodir : true}).map(existingSessionFilePath => +path.basename(existingSessionFilePath).substring(1));
		let xPort = Math.randomInt(10, 9999);
		while(existingSessions.includes(xPort))
			xPort = Math.randomInt(10, 9999);

		if(options.portNumFilePath)
			fs.writeFileSync(options.portNumFilePath, `${xPort}`, XU.UTF8);
		
		xvfbCP = exports.run("Xvfb", [`:${xPort}`, "-listen", "tcp", "-nocursor", "-ac", "-screen", "0", "1920x1080x24"], {silent : true, detached : true});
		if(!options.env)
			options.env = {};
		options.env.DISPLAY = `:${xPort}`;

		if(options.recordVideoFilePath)
		{
			exports.run("hsetroot", ["-solid", "#FFC0CB"], {env : {DISPLAY : `:${xPort}`}, silent : true, detached : true}, this);
			const ffmpegArgs = ["-f", "x11grab", "-draw_mouse", "0", "-video_size", "1920x1080", "-i", `127.0.0.1:${xPort}`, "-y", "-c:v", "libx264rgb", "-r", "60", "-qscale", "0", "-crf", "0", "-preset", "ultrafast", recordedVidFilePath];
			ffmpegCP = exports.run("ffmpeg", ffmpegArgs, {silent : true, detached : true});
		}
	}

	if(options.env)
		options.env = Object.assign(Object.assign({}, process.env), options.env);	// eslint-disable-line node/no-process-env

	if(!options.silent)
		XU.log`Running ${command} in cwd ${options.cwd || process.cwd()} with args ${args} and options ${_options}`;

	let p = null;
	if(options.detached)
	{
		const cp = childProcess.spawn(command, args, options);

		if(options.liveOutput)
		{
			cp.stdout.pipe(process.stdout);
			cp.stderr.pipe(process.stderr);
		}

		if(options.timeout)
		{
			let timeoutid = setTimeout(() => { timeoutid = null; cp.kill(); }, options.timeout);
			cp.on("exit", () =>
			{
				if(timeoutid!==null)
				{
					clearTimeout(timeoutid);
					timeoutid = null;
				}
			});
		}

		if(options.virtualX)
		{
			cp.on("exit", () =>
			{
				if(ffmpegCP)
				{
					ffmpegCP.on("exit", () => finalizeVideo(options.videoProcessedCB));
					ffmpegCP.kill();
				}

				xvfbCP.kill();
			});
		}

		return cp;
	}

	if(options["redirect-stdout"])
		options.encoding = "binary";

	p = cb ? childProcess.execFile(command, args, options, handler) : childProcess.execFile(command, args, handler);

	if(options["redirect-stdout"])
	{
		p.stdout.pipe(fs.createWriteStream(options["redirect-stdout"], {encoding : "binary"}));
	}
	else if(options.liveOutput)
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
			stderr = stderr.replace(/Xlib: +extension "RANDR" missing on display "[^:]*:[^"]+".\n?/, "");
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
			XU.log`"${command} ${args.join(" ")}\n${stdout || ""} ${stderr || ""}`;

		if(ffmpegCP)
		{
			ffmpegCP.on("exit", () => finalizeVideo(options.videoProcessedCB));
			ffmpegCP.kill();
		}
			
		if(xvfbCP)
			xvfbCP.kill();

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
exports.SILENTX = { silent : true, env : { DISPLAY : ":0" } };

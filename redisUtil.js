"use strict";
const XU = require("@sembiance/xu"),
	fs = require("fs");

exports.runScript = function runScript(redis, scriptPath, args, cb)
{
	return redis.eval(fs.readFileSync(scriptPath, XU.UTF8), args.length, ...args.map((v, i) => (String.fromCharCode(97+i))), ...args, cb);
};

exports.hmget = function hmget(redis, ...args)
{
	const redisArgs = args.slice(0, -1);

	redis.hmget(redisArgs, (err, data) =>
	{
		if(err)
			return args.last()(err);

		const r = {};
		redisArgs.forEach((redisArg, i) =>
		{
			if(i===0)
				return;

			r[redisArg] = data[(i-1)];
		});

		return args.last()(undefined, r);
	});
};

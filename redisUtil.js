"use strict";

const XU = require("@sembiance/xu");

exports.hmget = function hmget(redis, ...args)
{
	const redisArgs = args.slice(0, args.length-1);

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

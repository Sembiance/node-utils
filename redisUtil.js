"use strict";

var base = require("@sembiance/xbase");

exports.hmget = function()
{
	var args = Array.toArray(arguments);
	var redisArgs = args.slice(1, args.length-1);

	args[0].hmget(redisArgs, function(err, data)
	{
		if(err)
			return args.last()(err);

		var r = {};
		redisArgs.forEach(function(redisArg, i)
		{
			if(i===0)
				return;

			r[redisArg] = data[(i-1)];
		});

		return args.last()(undefined, r);
	});
};

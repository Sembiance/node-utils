"use strict";

const base = require("@sembiance/xbase"),
	CDPW = require("@sembiance/cdpw"),
	tiptoe = require("tiptoe");

exports.captureScreenshot = function captureScreenshot(url, _options, _cb)
{
	const options = _cb ? _options : {};
	const cb = (_cb || _options);

	const cdpw = new CDPW(true, (cdpwErr, client) =>
	{
		if(cdpwErr)
			return cb(cdpwErr);
		
		tiptoe(
			function openSite()
			{
				cdpw.openURL(url, this, {delay : (options.delay || base.SECOND), width : (options.width || 1280), height : (options.height || 1024)});
			},
			function capture()
			{
				client.Page.captureScreenshot({format : "png"}, this);
			},
			function cleanup(ss)
			{
				this.data.ssData = Buffer.from(ss.data, "base64");
				cdpw.destroy(this);
			},
			function resturnResult(err)
			{
				if(err)
					return cb(err);

				cb(undefined, this.data.ssData);
			}
		);
	});
};

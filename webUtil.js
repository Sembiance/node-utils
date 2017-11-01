"use strict";

const base = require("@sembiance/xbase"),
	cdp = require("chrome-remote-interface"),
	tiptoe = require("tiptoe");

// This requires chromium to be running in headless
// 		chromium --headless --hide-scrollbars --remote-debugging-port=9222 --disable-gpu
exports.captureScreenshot = function captureScreenshot(url, _options, _cb)
{
	const options = _cb ? _options : {};
	const cb = (_cb || _options);

	const deviceMetrics = {
		width             : options.width || 1280,
		height            : options.height || 1024,
		deviceScaleFactor : 0,
		mobile            : false,
		fitWindow         : false
	};

	cdp(client =>
	{
		tiptoe(
			function enableParts()
			{
				client.Page.enable(this.parallel());
				client.DOM.enable(this.parallel());
				client.Network.enable(this.parallel());
			},
			function setDeviceMetrics()
			{
				client.Emulation.setDeviceMetricsOverride(deviceMetrics, this);
			},
			function setVisibleSize()
			{
				client.Emulation.setVisibleSize({width : deviceMetrics.width, height : deviceMetrics.height}, this);
			},
			function navigate()
			{
				client.Page.navigate({url}, this);
			},
			function waitForPageToFinish()
			{
				const self=this;
				client.Page.loadEventFired(() => setTimeout(self, (options.delay || base.SECOND)));
			},
			function capture()
			{
				client.Page.captureScreenshot({format : "png"}, this);
			},
			function resturnResult(err, ss)
			{
				if(err)
					return cb(err);

				cb(undefined, Buffer.from(ss.data, "base64"));
			}
		);
	}).on("error", cb);
};

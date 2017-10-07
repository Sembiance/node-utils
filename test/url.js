"use strict";

const urlUtil = require("../index").url;

console.log(urlUtil.setQueryParam("http://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=49&printed=false", "printed", "true"));

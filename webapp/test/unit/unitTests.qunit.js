/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/grilo/classification/com/grilo/classification/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});

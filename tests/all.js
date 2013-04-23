var vows = require('vows')
	, assert = require('assert')
	, events = require('events')
	, DataCollector = require('../lib/datacollector');

function collectorCallback(dc, key) {
	if (key) {
		return function (e, d) {
			dc.collect(key, (e) ? e : d);
		};
	} else return function (e, d) {
		dc.collect((e) ? e : d);
	};
}

vows.describe("DataCollector").addBatch({
	"Given 2 async functions": {
		topic: function () {
			return { first: function (cb) { cb(null, '1st'); }, second: function (cb) { cb(null, '2nd'); }};
		}
		, "when called and collected by name": {
			topic: function (functions) {
				var keys = Object.keys(functions), dc = new DataCollector(keys), t = this;
				dc.on('complete', function (e, d) { t.callback(e, d); });
				keys.forEach(function (k) { functions[k](collectorCallback(dc, k))});
			}
			, "no error must be returned": function (e, d) {
				assert.isNull(e);
			}
			, "result data must be an object": function (e, d) {
				assert.isObject(d);
			}
			, "result data must have both keys": function (e, d) {
				assert.ok(d.hasOwnProperty('first'));
				assert.ok(d.hasOwnProperty('second'));
			}
			, "result data must have both values": function (e, d) {
				assert.equal(d.first, '1st');
				assert.equal(d.second, '2nd');
			}
		}
		, "when called and collected anonymously": {
			topic: function (functions) {
				var keys = Object.keys(functions), dc = new DataCollector(keys.length), t = this;
				dc.on('complete', function (e, d) { t.callback(e, d); });
				keys.forEach(function (k) { functions[k](collectorCallback(dc))});
			}
			, "no error must be returned": function (e, d) {
				assert.isNull(e);
			}
			, "result data must be an Array": function (e, d) {
				assert.isArray(d);
			}
			, "result array must have 2 elements": function (e, d) {
				assert.equal(d.length, 2);
			}
			, "result array must have both values": function (e, d) {
				assert.includes(d, '1st');
				assert.includes(d, '2nd');
			}
		}
		, "when only one function is executed": {
			topic: function (functions) {
				var keys = Object.keys(functions), dc = new DataCollector(keys), t = this;
				dc.on('complete', function (e, d) { t.callback(e, dc); });
				functions.first(collectorCallback(dc, 'first'));
				setTimeout(function () {t.callback(new Error('timeout'), dc)}, 500);
			}
			, "no results must be returned before timeout": function (e, dc) {
				assert.ok(e instanceof Error);
				assert.equal(e.message, 'timeout');
			}
			, "the DataCollector state must be 'collecting'": function (e, dc) {
				assert.equal(dc.state,'collecting')
			}
			, "the DataCollector must have 1 collected element": function (e, dc) {
				assert.equal(Object.keys(dc.items).length, 1);
			}
		}
	}
}).export(module);
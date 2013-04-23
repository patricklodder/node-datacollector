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
				dc.on('complete', this.callback);
				dc.on('complete', console.log)
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
				dc.on('complete', this.callback);
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
				dc.on('complete', this.callback);
				functions.first(collectorCallback(dc, 'first'));
				setTimeout(function () {t.callback(new Error('timeout'), dc)}, 50);
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
		, "when an extra collection is made the 'complete' event": {
			topic: function (functions) {
				var keys = Object.keys(functions)
					, dc = new DataCollector(keys.length)
					, cdc = new DataCollector(2)
					, t = this
					, collected = null;

				dc.on('complete', function (e, d) { collected = d; cdc.collect(true); });
				cdc.on('complete', function (e, d) { t.callback(e, d, collected); });
				keys.forEach(function (k) { functions[k](collectorCallback(dc))});
				functions.first(collectorCallback(dc, 'first'));
				setTimeout(function () { cdc.collect('from_timeout') }, 50);
			}
			, "should not fire a second time": function (e, d, c) {
				assert.isArray(d);
				assert.equal(d[1], 'from_timeout');
			}
		}
		, "when an extra collection is made the 'ready' event": {
			topic: function (functions) {
				var keys = Object.keys(functions)
					, dc = new DataCollector(keys.length)
					, cdc = new DataCollector(2)
					, t = this
					, collected = null;

				dc.on('ready', function (e, d) { collected = d; cdc.collect(true); });
				cdc.on('complete', function (e, d) { t.callback(e, d, collected); });
				keys.forEach(function (k) { functions[k](collectorCallback(dc))});
				functions.first(collectorCallback(dc, 'first'));
				setTimeout(function () { cdc.collect('from_timeout') }, 50);
			}
			, "should not fire a second time": function (e, d, c) {
				assert.isArray(d);
				assert.equal(d[1], 'from_timeout');
			}
		}
		, "when retrieving the first value after collection": {
			topic: function (functions) {
				var keys = Object.keys(functions)
					, dc = new DataCollector(keys)
					, t = this;
				keys.forEach(function (k) { functions[k](collectorCallback(dc, k))});
				dc.get('first', function (e, d) { t.callback(e, d); });
			}
			, "should not return an error": function (e, d) {
				assert.isNull(e);
			}
			, "should return the value": function (e, d) {
				assert.equal(d, '1st');
			}
		}
		, "when retrieving the first value before collection": {
			topic: function (functions) {
				var keys = Object.keys(functions)
					, dc = new DataCollector(keys)
					, t = this;
				dc.get('first', function (e, d) { t.callback(e, d); });
				keys.forEach(function (k) { functions[k](collectorCallback(dc, k))});
			}
			, "should not return an error": function (e, d) {
				assert.isNull(e);
			}
			, "should return the value": function (e, d) {
				assert.equal(d, '1st');
			}
		}
		, "when retrieving the first value on an anonymous collection": {
			topic: function (functions) {
				var keys = Object.keys(functions)
					, dc = new DataCollector(keys.length)
					, t = this;
				dc.get('first', function (e, d) { t.callback(e, d); });
			}
			, "should return an error": function (e, d) {
				assert.ok(e instanceof Error);
			}
			, "should not return the value": function (e, d) {
				assert.ok(d === undefined);
			}
		}
	}
}).addBatch({
	"Given 2 erroring async functions": {
		topic: function () {
			return { first: function (cb) { cb(new Error('1st error'), '1st'); }, second: function (cb) { cb(new Error('2nd error'), '2nd'); }};
		}
		, "when called and collected": {
			topic: function (functions) {
				var keys = Object.keys(functions), dc = new DataCollector(keys), t = this;
				dc.on('complete', this.callback);

				keys.forEach(function (k) { functions[k](collectorCallback(dc, k))});
			}
			, "an error must be returned": function (e, d) {
				assert.ok(e instanceof Error);
			}
			, "result data must be an object": function (e, d) {
				assert.isObject(d);
			}
			, "result data must have no keys": function (e, d) {
				assert.ok(Object.keys(d).length, 0);
			}
		}
		, "when called and collected on 'ready'": {
			topic: function (functions) {
				var keys = Object.keys(functions), dc = new DataCollector(keys), t = this;
				dc.on('ready', function (d) { t.callback(null, d, dc)});
				keys.forEach(function (k) { functions[k](collectorCallback(dc, k))});
			}
			, "no error must be returned": function (e, d) {
				assert.isNull(e);
			}
			, "result data must be an object": function (e, d) {
				assert.isObject(d);
			}
			, "result object must have 2 keys": function (e, d) {
				assert.equal(Object.keys(d).length, 2);
			}
			, "result object must have Errors as both values": function (e, d) {
				assert.ok(d.first instanceof Error);
				assert.ok(d.second instanceof Error);
			}
			, "the DataCollector state must be 'errored_final'": function (e, d, dc) {
				assert.equal(dc.state, 'errored_final');
			}
		}
	}
}).addBatch({
	"Given 1 erroring async function": {
		topic: function () {
			return { first: function (cb) { cb(new Error('1st error'), '1st'); }, second: function (cb) { cb(null, '2nd'); }};
		}
		, "when called and collected": {
			topic: function (functions) {
				var keys = Object.keys(functions), dc = new DataCollector(keys), t = this;
				dc.on('complete', function (e, d) { t.callback(e,d,dc)});

				keys.forEach(function (k) { functions[k](collectorCallback(dc, k))});
			}
			, "an error must be returned": function (e, d) {
				assert.ok(e instanceof Error);
			}
			, "result data must be an object": function (e, d) {
				assert.isObject(d);
			}
			, "result data must have no keys": function (e, d) {
				assert.ok(Object.keys(d).length, 0);
			}
			, "the DataCollector state must be 'errored_final'": function (e, d, dc) {
				assert.equal(dc.state, 'errored_final');
			}
		}
		, "when called and collected on 'ready'": {
			topic: function (functions) {
				var keys = Object.keys(functions), dc = new DataCollector(keys), t = this;
				dc.on('ready', function (d) { t.callback(null, d, dc)});
				keys.forEach(function (k) { functions[k](collectorCallback(dc, k))});
			}
			, "no error must be returned": function (e, d) {
				assert.isNull(e);
			}
			, "result data must be an object": function (e, d) {
				assert.isObject(d);
			}
			, "result object must have 2 keys": function (e, d) {
				assert.equal(Object.keys(d).length, 2);
			}
			, "result object must have an Error as the first value": function (e, d) {
				assert.ok(d.first instanceof Error);
			}
			, "result object must not have an error as the second value": function (e, d) {
				assert.equal(d.second, '2nd');
			}
			, "the DataCollector state must be 'errored_final'": function (e, d, dc) {
				assert.equal(dc.state, 'errored_final');
			}
		}
		, "when an extra collection is made, the 'complete' event": {
			topic: function (functions) {
				var keys = Object.keys(functions)
					, dc = new DataCollector(keys.length)
					, cdc = new DataCollector(2)
					, t = this
					, collected = null;

				dc.on('complete', function (e, d) { collected = d; cdc.collect(true); });
				cdc.on('complete', function (e, d) { t.callback(e, d, collected); });
				keys.forEach(function (k) { functions[k](collectorCallback(dc))});
				functions.first(collectorCallback(dc, 'first'));
				setTimeout(function () { cdc.collect('from_timeout') }, 50);
			}
			, "should not fire a second time": function (e, d, c) {
				assert.isArray(d);
				assert.equal(d[1], 'from_timeout');
			}
		}
		, "when an extra collection is made, the 'ready' event": {
			topic: function (functions) {
				var keys = Object.keys(functions)
					, dc = new DataCollector(keys.length)
					, cdc = new DataCollector(2)
					, t = this
					, collected = null;

				dc.on('ready', function (e, d) { collected = d; cdc.collect(true); });
				cdc.on('complete', function (e, d) { t.callback(e, d, collected); });
				keys.forEach(function (k) { functions[k](collectorCallback(dc))});
				functions.first(collectorCallback(dc, 'first'));
				setTimeout(function () { cdc.collect('from_timeout') }, 50);
			}
			, "should not fire a second time": function (e, d, c) {
				assert.isArray(d);
				assert.equal(d[1], 'from_timeout');
			}
		}
	}
}).export(module);
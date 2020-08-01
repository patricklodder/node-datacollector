var vows = require('vows');
var assert = require('assert');

var test = require('tape');
var parallel = require('../lib/parallel');

test('Parallel Processor', function (t) {
	t.plan(4);
	var p;

	t.doesNotThrow(function () {
		p = parallel({test: function (cb) { cb(null, 1); }});
	}, undefined, 'must not throw any errors');

	t.ok(p instanceof parallel.ParallelProcessor, 'must instantiate a parallel processor');
	t.ok(typeof p.exec, 'function', 'must expose an exec method');
	t.ok(typeof p.add, 'function', 'must expose an add method');

	test('... when executed', function (t) {
		t.plan(3);
		p.exec(function (e, data) {
			t.equal(e, null, 'must not return an error');
			t.equal(typeof data, 'object', 'must return an object');
			t.equal(data.test, 1, 'must return the correct value');
		})
	});

});

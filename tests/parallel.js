var vows = require('vows');
var assert = require('assert');

var parallel = require('../lib/parallel');

vows.describe('Parallel Processor').addBatch({
	"Instantiating a parallel processor": {
		topic: parallel({test: function (cb) { cb(null, 1); }}),
		"must not throw any errors": function (e, pp) {
			assert.isNull(e);
		},
		"must return a ParallelProcessor": function (pp) {
			assert.instanceOf(pp, parallel.ParallelProcessor);
		},
		"must expose an 'exec' method": function (pp) {
			assert.isFunction(pp.exec);
		},
		"must expose an 'add' method": function (pp) {
			assert.isFunction(pp.add);
		},
		"when executed": {
			topic: function (pp) {
				pp.exec(this.callback);
			},
			"must not return an error": function (e, data) {
				assert.isNull(e);
			},
			"must return an object": function (e, data) {
				assert.isObject(data);
			},
			"must have mapped the correct value": function (e, data) {
				assert.strictEqual(data.test, 1);
			}
		}
	}
}).export(module);

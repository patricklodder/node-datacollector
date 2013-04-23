var events = require("events");
var util = require("util");

var DataCollector = function(expected, recordEmpty, recordAll) {
	this.named = (Array.isArray(expected));
	if (!this.named && typeof(expected) !== 'number') throw new Error('First argument must be an Array or number');
	this.expected = (this.named) ? expected.map(function (d) {return d;}) : expected;
	this.recordEmpty = recordEmpty || false;
	this.recordAll = recordAll || false;
	this.items = (this.named) ? {} : [];
	this.state = DataCollector.STATE_COLLECTING;
};

util.inherits(DataCollector, events.EventEmitter);

DataCollector.STATE_ERRORED = 'errored';
DataCollector.STATE_ERRORED_FINAL = 'errored_final';
DataCollector.STATE_COLLECTING = 'collecting';
DataCollector.STATE_FINAL = 'final';

DataCollector.prototype.checkFinal = function () {
	if (this.isFinal()) return null;
	if (this.named) {
		var evLen = this.expected.length;
		for (var i=0;i<evLen;i++) {
			if (typeof(this.items[this.expected[i]]) === 'undefined') return false;
		}
		this.state = (this.hasErrored()) ? DataCollector.STATE_ERRORED_FINAL : DataCollector.STATE_FINAL;
		return true;
	} else if (this.items.length >= this.expected) {
		this.state = (this.hasErrored()) ? DataCollector.STATE_ERRORED_FINAL : DataCollector.STATE_FINAL;
		return true;
	} else return false;
};

DataCollector.prototype.collect = DataCollector.prototype._collect = function(name, value) {

	this.emit('collected', name, value);
	
	var k = (this.named) ? name : this.items.length;
	var val = (this.named) ? value : name;
	
	// report first error
	if (val instanceof Error) {
		this.emit('err', k, val);
		if (!this.hasErrored()) this.emit('complete', val, this.items);
		this.state = DataCollector.STATE_ERRORED;
	} 
	
	if (!this.recordAll && this.named && this.expected.indexOf(k) === -1) {
		// do nothing;
	} else if (typeof(val) !== 'undefined' || this.recordEmpty) {
		this.items[k] = (typeof(val) !== 'undefined') ? val : null;
	} else if (this.named) {
		var idx = this.expected.indexOf(k);
		if (idx !== -1) this.expected.splice(idx, 1);
	} else this.expected--;
	
	if (this.named) this.emit(name, value);

	if (this.checkFinal()) {
		this.emit('ready', this.items);
		if (!this.hasErrored()) this.emit('complete', null, this.items);
	}

};

DataCollector.prototype.hasErrored = function () {
	return (this.state === DataCollector.STATE_ERRORED || this.state === DataCollector.STATE_ERRORED_FINAL);
};

DataCollector.prototype.isFinal = function () {
	return (this.state === DataCollector.STATE_FINAL || this.state === DataCollector.STATE_ERRORED_FINAL);
}

DataCollector.prototype.get = function(name, callback) {
	var cb = function (d) { if (d instanceof Error) { callback(d); } else callback(null, d); };
	if (!this.named) {
		cb(new Error('Can only call [get] on named collectors'));
	} else if (!this.items.hasOwnProperty(name)) {
		this.once(name, cb);
	}  else cb(this.items[name]);
};

module.exports = DataCollector;
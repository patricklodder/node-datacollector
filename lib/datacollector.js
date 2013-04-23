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
DataCollector.STATE_COLLECTING = 'collecting';
DataCollector.STATE_FINISHED = 'finished';

DataCollector.prototype.isFinished = function () {
	if (this.state === DataCollector.STATE_FINISHED) return true;
	if (this.named) {
		var evLen = this.expected.length;
		for (var i=0;i<evLen;i++) {
			if (typeof(this.items[this.expected[i]]) === 'undefined') return false;
		}
		if (this.state !== DataCollector.STATE_ERRORED) this.state = DataCollector.STATE_FINISHED;
		return true;
	} else if (this.items.length >= this.expected) {
		if (this.state !== DataCollector.STATE_ERRORED) this.state = DataCollector.STATE_FINISHED;
		return true;
	} else return false;
};

DataCollector.prototype.collect = DataCollector.prototype._collect = function(name, value) {

	this.emit('collected', name, value);
	
	var k = (this.named) ? name : this.items.length;
	var val = (this.named) ? value : name;
	
	if (val instanceof Error) {
		this.state = DataCollector.STATE_ERRORED;
		this.emit('err', k, val, this);
		this.emit('complete', val, this.items);
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
	if (this.isFinished()) {
		this.emit('ready', this.items);
		if (this.state !== DataCollector.STATE_ERRORED) this.emit('complete', null, this.items);
	}

};

DataCollector.prototype.get = function(name, callback) {
	if (!this.named) {
		callback();
	} else if (!this.items.hasOwnProperty(name)) {
		this.once(name, callback);
	}  else callback(this.items[name]);
};

module.exports = DataCollector;
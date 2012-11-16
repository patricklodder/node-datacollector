var events = require("events");
var util = require("util");

var DataCollector = function(expected, recordEmpty, recordAll) {
	this.named = (Array.isArray(expected));
	this.expected = (this.named) ? expected.map(function (d) {return d;}) : expected;
	this.recordEmpty = recordEmpty || false;
	this.recordAll = recordAll || false;
	this.items = (this.named) ? {} : [];
};
util.inherits(DataCollector, events.EventEmitter);

DataCollector.prototype.isFinished = function() {
	if (this.named) {
		var evLen = this.expected.length;
		for (var i=0;i<evLen;i++) {
			if (typeof(this.items[this.expected[i]]) == 'undefined') return false;
		}
		return true;
	} else return (this.items.length >= this.expected);
};

DataCollector.prototype.collect = function(name, value) {
	this.emit('collected', name, value);
	
	var k = (this.named) ? name : this.items.length;
	var val = (this.named) ? value : name;
	
	if (val instanceof Error) {
		this.emit('err', k, val, this.items);
	} 
	
	if (!this.recordAll && this.named && this.expected.indexOf(k) === -1) {
		// do nothing;
	} else if (typeof(val) !== 'undefined' || this.recordEmpty) {
		this.items[k] = (typeof(val) !== 'undefined') ? val : null;
	} else if (this.named) {
		var idx = this.expected.indexOf(k);
		if (idx !== -1) this.expected.splice(idx, 1);
	} else this.expected--;
	
	this.emit(name, value);
	if (this.isFinished()) this.emit('ready', this.items);

};

DataCollector.prototype.get = function(name, callback) {
	if (!this.named) {
		callback();
	} else if (!this.items.hasOwnProperty(name)) {
		this.once(name, callback);
	}  else callback(this.items[name]);
};

module.exports = DataCollector;
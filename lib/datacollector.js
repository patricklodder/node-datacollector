var events = require("events");
var util = require("util");

var DataCollector = function(expected, recordEmpty) {
	this.expected = expected;
	this.recordEmpty = recordEmpty;
	this.named = (typeof(this.expected) != 'number');
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
	var k = (this.named) ? name : this.items.length;
	var val = (this.named) ? value : name;
	
	if (this.named && !this.expected.hasOwnProperty(k)) {
		// do nothing;
	} else if (val !== undefined || this.recordEmpty) {
		this.items[k] = (val !== undefined) ? val : null;
	} else if (this.named) {
		var idx = this.expected.indexOf(k);
		if (idx !== -1) delete this.expected[idx];
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
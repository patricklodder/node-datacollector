var events = require("events");
var EventEmitter = events.EventEmitter;
var util = require("util");

var DataCollector = function(expectedVars) {
	this.expected = expectedVars;
	this.countedVariables = [];
	this.namedVariables = {};
	//this.on('ready', function(data){console.log('Emitted ready with data: ' + JSON.stringify(data));});
};
util.inherits(DataCollector, EventEmitter);

DataCollector.prototype.isFinished = function() {
	if (typeof(this.expected) == 'number') {
		if (this.countedVariables.length >= this.expected) return true;
		return false;
	} else {
		var evLen = this.expected.length;
		for (var i=0;i<evLen;i++) {
			if (typeof(this.namedVariables[this.expected[i]]) == 'undefined') return false;
		}
	}
	return true;
};

DataCollector.prototype.collect = function(name, value) {
	if (typeof(value) == 'undefined') {
		this.emit('invalid', this.variables);
		return;
	}
	
	if (typeof(this.expected) == 'number') name = this.countedVariables.length;
	//console.log('DataCollector received value \'' + name + '\' with value: ' + JSON.stringify(value));
	
	if (typeof(name) == 'number') {
		this.countedVariables[name] = value;
	} else {
		this.namedVariables[name] = value;
	}
	
	this.emit(name, value);
	if (this.isFinished()) if (typeof(name) == 'number') {
			this.emit('ready', this.countedVariables);
		} else {
			this.emit('ready', this.namedVariables);
		};
};

DataCollector.prototype.get = function(name, callback) {
	if (typeof(this.expectedVariables) == 'number' ){
		callback(null);
		return;
	}
	if (typeof(this.namedVariables[name]) == 'undefined') {
		this.once(name, callback);
	} else {
		callback(this.namedVariables[name]);
	}
};

module.exports = DataCollector;
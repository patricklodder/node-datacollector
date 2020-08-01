var events = require("events");
var util = require("util");

var DataCollector = module.exports = function(expected, recordEmpty, recordAll) {
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
	var that = this;
	if (this.isFinal()) return null;
	return (this.named) ? !(this.expected.some(function (k) { return typeof(that.items[k]) === 'undefined'; })) : (this.items.length >= this.expected);
};

DataCollector.prototype.timeout = function (ms) {
	var self = this;

	if (this.timeout) clearTimeout(this.timeout);

	self.timeout = setTimeout(function () {
		var err = new Error("timed out")
		self.emit("timeout", true);
		self.error(self.named ? undefined : err, self.named ? err : undefined);
	}, ms);

	return self;
}

DataCollector.prototype.collect = DataCollector.prototype._collect = function(name, value) {
	var k = (this.named) ? name : this.items.length;
	var val = (this.named) ? value : name;

	this.emit('collected', k, val);

	// report first error
	if (val instanceof Error) {
		return this.error(name, value);
	}

	this._record(k, val);

};

DataCollector.prototype.error = function(name, error) {
	var k = (this.named) ? name : this.items.length;
	var err = (this.named) ? error : name;
	var hasErroredBefore = this.hasErrored();

	// report first error
	this.emit('err', k, err);
	this.state = DataCollector.STATE_ERRORED;
	if (!hasErroredBefore) this.emit('complete', err, this.items);

	this._record(k, err);

};

DataCollector.prototype._record = function (k, val) {
	var idx;
	if (this.named && this.expected.indexOf(k) === -1 && !this.recordAll) {
		// do nothing;
	} else if (typeof(val) !== 'undefined' || this.recordEmpty) {
		this.items[k] = (typeof(val) !== 'undefined') ? val : null;
	} else if (this.named) {
		idx = this.expected.indexOf(k);
		if (idx !== -1) this.expected.splice(idx, 1);
	} else this.expected--;

	if (this.named) this.emit(k, val);

	if (this.checkFinal()) {
		if (this.timeout) clearTimeout(this.timeout);

		this.emit('ready', this.items);
		if (!this.hasErrored()) this.emit('complete', null, this.items);

		this._finalize();
	}
};

DataCollector.prototype._finalize = function () {
	this.state = (this.hasErrored()) ? DataCollector.STATE_ERRORED_FINAL : DataCollector.STATE_FINAL;
};

DataCollector.prototype.hasErrored = function () {
	return (this.state === DataCollector.STATE_ERRORED || this.state === DataCollector.STATE_ERRORED_FINAL);
};

DataCollector.prototype.isFinal = function () {
	return (this.state === DataCollector.STATE_FINAL || this.state === DataCollector.STATE_ERRORED_FINAL);
};

DataCollector.prototype.get = function(name, callback) {
	var cb = function (d) { if (d instanceof Error) { callback(d); } else callback(null, d); };
	if (!this.named) {
		cb(new Error('Can only call [get] on named collectors'));
	} else if (!this.items.hasOwnProperty(name)) {
		this.once(name, cb);
	}  else cb(this.items[name]);
};

var DataCollector = require('./datacollector');

var parallel = module.exports = function (fns) {
	return new parallel.ParallelProcessor(fns);
};

parallel.ParallelProcessor = function (fns) {
	this._fns = fns || {};
};

parallel.ParallelProcessor.prototype.add = function(name, fn) {
	if (!fn && typeof(name) === 'function') {
		fn = name;
		name = 'unknown';
	}

	if (Array.isArray(this._fns)) {
		this._fns.push(fn);
	} else this._fns[name] = fn;

	return this;
};

parallel.ParallelProcessor.prototype.exec = function (cb) {
	var method = 'exec' + (Array.isArray(this._fns) ? 'Anon' : 'Named');
	return this[method](cb);
};

parallel.ParallelProcessor.prototype.execAnon = function (cb) {
	if (!this._fns.length) return cb(null, []);
	var dc = this._dc = new DataCollector(this._fns.length);
	dc.on('complete', cb);

	var pp = this;
	this._fns.forEach(function (fn) { fn(pp.createAnonCollector()); });

	return this;
};

parallel.ParallelProcessor.prototype.execNamed = function (cb) {
	var keys = Object.keys(this._fns);
	if (!keys.length) return cb(null, {});

	var dc = this._dc = new DataCollector(keys);
	dc.on('complete', cb);

	var pp = this;
	keys.forEach(function (k) { pp._fns[k](pp.createNamedCollector(k)); });

	return this;
};

parallel.ParallelProcessor.prototype.createNamedCollector = function (key) {
	var pp = this;
	return function (e,d) { pp._dc.collect(key, e || d); };
};

parallel.ParallelProcessor.prototype.createAnonCollector = function () {
	var pp = this;
	return function (e,d) { pp._dc.collect(e || d); };
};

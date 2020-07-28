DataCollector
=============

[![Build Status](https://secure.travis-ci.org/patricklodder/node-datacollector.png)](http://travis-ci.org/patricklodder/node-datacollector)

(C) Patrick Lodder 2012, Licensed under the MIT-LICENSE

Collects data from one to many async calls and pushes out events based on the data collected.

### Installing

`npm install datacollector`

### Example Usage

#### Anonymous collector

```javascript
var DataCollector = require('datacollector');

var dc = new DataCollector(2);
dc.on('complete', function(err, data) {
	console.log(JSON.stringify(data));
});

dc.collect('1st');
dc.collect('2nd');

// ['1st', '2nd']
```

#### Named collector

```javascript
var DataCollector = require('datacollector');

var dc = new DataCollector(['1st', '2nd']);
dc.on('complete', function(err, data) {
	console.log(JSON.stringify(data));
});

dc.collect('1st', 'first');
dc.collect('2nd', 'second');

// {'1st': 'first', '2nd': 'second'}
```

#### Timing out

```javascript
var DataCollector = require('datacollector');

var dc = new DataCollector(['1st', '2nd']).timeout(50);
dc.on('complete', function(err, data) {
	console.log(err.message, JSON.stringify(data));
});

dc.collect('1st', 'first');

// "timed out", {'1st': 'first'}
```

#### Anonymous Parallel Processor

```javascript
var parallel = require('datacollector').parallel;
var data = ['1st', '2nd'];

parallel(data.map(function (elem) {
   return function (cb) { cb(elem); };
})).exec(console.log);
// ['1st', '2nd']
```

#### Named Parallel Processor
```javascript
var parallel = require('datacollector').parallel;
var pp = parallel({
    '1st': function (cb) { cb(null, 'first'); },
    '2nd': function (cb) { cb(null, 'second'); }
});
pp.exec(console.log);
// {'1st': 'first', '2nd': 'second'}
```

API
---

### new DataCollector(keys, recordEmpty, recordAll)
instantiates a new data collector

* keys
   * ```Array``` - keys that are to be collected, or
   * ```number``` - number of expected collects
* recordEmpty: ```bool``` - record null and undefined values. Optional, default: ```false```.
* recordAll: ```bool``` - record keys that were not expected. Optional, default: ```false```.

Passing an array as the first argument will collect named values in an object, passing a number will record values anonymously in an array.

### Methods
#### dc.timeout(milliseconds)
Error out after ```milliseconds``` amount of time. Overrides previous timeouts.

* key: ```milliseconds``` - amount of milliseconds that collection must complete within.

Chainable command, returns self.

#### dc.collect(key, value)
Collect a value

* key: ```string``` - key to collect, optional
* value: ```any``` - the value to collect

#### dc.error(key, value)
Collect an error for a key

* key: ```string``` - key to collect, optional
* value: ```Error``` - the error to collect

#### dc.get(key, callback)
Retrieve a value from the collection. Executes ```callback``` immediately when the value is already collected, otherwise it calls the callback on collection of the value. Returns an error if the collected value is an instance of Error or when calling this on an anonymous collector.

* key: ```string``` - key to get the value for
* callback: ```function (error, value) ``` - callback to pass the error/value to.

### Events
* complete: (error, collection) - Error-intolerant event that will fire when the collection is completed or the first collected Error
* ready: (collection) - Error-tolerant event that will fire when the collection is completed, regardless of collected Errors
* err: (key, error) - Fires whenever an instance of Error has been collected
* collected: (key, value) - Fires every time an item is collected. Key can be either the key name or the candidate index where the value will be stored anonymously.
* [key]: (value) - During named collection, fires after ```key``` has been collected

### DataCollector.parallel(instructions)
Initiates a ```ParallelProcessor``` that will execute given instructions.

instructions:

* ```Array``` - array of functions to execute.
* ```Object``` - hash of named functions to execute.

Running the tests
-----------------
```npm test``` - runs all tests

DataCollector
=============

[![Build Status](https://secure.travis-ci.org/patricklodder/node-datacollector.png)](http://travis-ci.org/patricklodder/node-datacollector)

(C) Patrick Lodder 2012, Licensed under the MIT-LICENSE

Collects data from one to many async calls and pushes out events based on the data collected.

INSTALL
-------
`npm install datacollector`

## Example Usage (anonymous):

	var DataCollector = require('datacollector');
	
	var dc = new DataCollector(2);
	dc.on('complete', function(err, data) {
		console.log(JSON.stringify(data));
	});
	
	dc.collect('1st');
	dc.collect('2nd');
	
	// ['1st', '2nd']

## Example Usage (named):

	var DataCollector = require('datacollector');
	
	var dc = new DataCollector(['1st', '2nd']);
	dc.on('complete', function(err, data) {
		console.log(JSON.stringify(data));
	});	

	dc.collect('1st', 'first');
	dc.collect('2nd', 'second');
	
	// {'1st': 'first', '2nd': 'second'}

API
---

### DataCollector

* `var dc = new DataCollector(/* Array */ keys || /* number */ numkeys [, /* bool */ recordEmpty] [, /* bool */ recordAll]);` - instantiate a new collector

Passing an array as the first argument will collect named values, passing a number will record values anonymously in an array.

#### Methods

* `dc.collect([/* string */ key ,] value);` - collect a value, optionally preceeded by a key name for named collections
* `dc.on(/* string */ key, /* function */ callback /* ( error, value ) */);` - retrieve a value from the collection. Executes immediately when the value is already collected, otherwise it calls the callback on collection of the value. Returns an error if the collected value is an instance of Error or when calling this on an anonymous collector.

#### Events

* `complete: (error, collection)` - Error-intolerant event that will fire when the collection is completed or the first collected Error
* `ready: (collection)` - Error-tolerant event that will fire when the collection is completed, regardless of collected Errors
* `err: (key, error)` - Fires whenever an instance of Error has been collected
* `[key]: (value)` - During named collection, fires after `key` has been collected

Running the tests
-----------------
`npm test` - runs all tests

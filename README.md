Collects data from several async calls and pushes them out through a 'ready' event.

Example Usage (unnamed):
	var DataCollector = require('datacollector');
	
	var dc = new DataCollector(2);
	dc.on('ready', function(data) {
		console.log(JSON.stringify(data));
	});
	
	dc.collect('1st');
	dc.collect('2nd');
	
	// ['1st', '2nd']

Example Usage (named):
	var DataCollector = require('datacollector');
	
        var dc = new DataCollector(['1st', '2nd']);
        dc.on('ready', function(data) {
                console.log(JSON.stringify(data));
        });
	
	dc.collect('1st', 'first');
	dc.collect('2nd', 'second');
	
	// {1st: 'first', 2nd: 'second'}



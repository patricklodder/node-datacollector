var test = require('tape');
var DC = require('../lib/datacollector');

var FUNCS = {
  first: function (cb) { cb(null, '1st'); },
  second: function (cb) { cb(null, '2nd'); }
};

function collectNamed (dc, name) {
  return function (e,d) {
    dc.collect(name, e || d);
  }
}

function collectAnon (dc, name) {
  return function (e,d) {
    dc.collect(e || d);
  }
}

test('A named collector', function (t) {
  t.plan(4)
  var keys = Object.keys(FUNCS);
  var dc = new DC(keys);

  t.ok(dc.named, 'must register as being named');
  t.equal(typeof dc.items, 'object', 'must collect items in an object');
  t.ok(Array.isArray(dc.expected), 'must keep an array of items to expect');
  t.equal(dc.state, DC.STATE_COLLECTING, 'must be in "collecting" state');

  test('... when collecting all items', function (t) {
    t.plan(4);

    var dc = new DC(keys);

    dc.once('complete', function (e, d) {
      t.equal(e, null, 'no error must be returned');
      t.equal(typeof d, 'object', 'result data must be an object');
      t.equal(d.first, '1st', 'first result must be recorded');
      t.equal(d.second, '2nd', 'second result must be recorded');

      test('    ... when an extra collection is made', function (t) {
        t.plan(4);

        var fired = {ready: false, complete: false, collected: false, err: false}
        Object.keys(fired).forEach(function (ev) {
          dc.once(ev, function () { fired[ev] = true; });
        });

        dc.collect('third', '3rd');

        t.notOk(fired.ready, 'the ready event must not have been fired');
        t.notOk(fired.err, 'the error event must not have been fired');
        t.notOk(fired.complete, 'the complete event must not have been fired');
        t.ok(fired.collected, 'the collected event must have been fired');

      });

    });
    keys.forEach(function (k) { FUNCS[k](collectNamed(dc, k)); });

  });

  test('... when not collecting all items', function (t) {
    t.plan(9);

    var dc = new DC(keys).timeout(50);
    var fired = {ready: 0, collected: 0, err: 0, complete: 0, timeout: 0}
    Object.keys(fired).forEach(function (ev) {
      dc.on(ev, function () { fired[ev] += 1; });
    });

    dc.once('complete', function (e, d) {
      t.ok(e instanceof Error, 'an error must be returned');
      t.equal(e.message, 'timed out', 'the error text must indicate a timeout');
      t.equal(dc.state, 'errored', 'the dc state must be errored');
      t.equal(fired.ready, 0, 'no ready event must be emitted');
      t.equal(fired.timeout, 1, 'one timeout event must be emitted');
      t.equal(fired.collected, 1, 'one collected event must be emitted');
      t.equal(fired.complete, 1, 'one complete event must be emitted');
      t.equal(fired.err, 1, 'one error event must be emitted');
      t.equal(d.first, '1st', 'the collected data must be returned');
    });

    dc.collect('first', '1st');
  });

  test('... when retrieving a value after collection', function (t) {
    t.plan(2);

    var dc = new DC(keys).timeout();
    keys.forEach(function (k) { FUNCS[k](collectNamed(dc, k)); });

    dc.get('first', function (e,  d) {
      t.equal(e, null, 'no error must be returned');
      t.equal(d, '1st', 'result must be returned');
    });

  });

  test('... when retrieving a value before collection', function (t) {
    t.plan(2);

    var dc = new DC(keys).timeout();
    dc.get('first', function (e,  d) {
      t.equal(e, null, 'no error must be returned');
      t.equal(d, '1st', 'result must be returned');
    });
    keys.forEach(function (k) { FUNCS[k](collectNamed(dc, k)); });

  });

  test('... when collecting errors implicitly', function (t) {
    t.plan(5);

    var dc = new DC(keys);

    var fired = {ready: 0, collected: 0, err: 0, complete: 0};
    Object.keys(fired).forEach(function (ev) {
      dc.on(ev, function () { fired[ev] += 1; });
    });

    dc.on('complete', function (e, d) {
      t.ok(e instanceof Error, 'an error must be raised on the complete event');
      t.equal(fired.err, 1, 'the complete event must be raised at the first error');
    });

    dc.on('ready', function (d) {
      t.equal(fired.err, 2, 'the ready event must be raised at the second error');
      t.ok(d.first instanceof Error, 'the first result must be an error');
      t.ok(d.second instanceof Error, 'the second result must be an error');
    })

    dc.collect('first', new Error('1st error'));
    dc.collect('second', new Error('2nd error'));
  });

  test('... when collecting errors and awaiting a value', function (t) {
    t.plan(4);

    var dc = new DC(keys);

    dc.get('first', function (e, d) {
      t.ok(e instanceof Error, 'an error must be returned on an explicit error value');
      t.equal(e.message, '1st error', 'the error message must reflect the explicit error raised');
    });

    dc.get('second', function (e, d) {
      t.ok(e instanceof Error, 'an error must be returned on an implicit error value');
      t.equal(e.message, '2nd error', 'the error message must reflect the implicit error raised');
    });

    dc.error('first', new Error('1st error'));
    dc.collect('second', new Error('2nd error'));
  });

  test('... when collecting errors explicitly', function (t) {
    t.plan(5);

    var dc = new DC(keys);

    var fired = {ready: 0, collected: 0, err: 0, complete: 0};
    Object.keys(fired).forEach(function (ev) {
      dc.on(ev, function () { fired[ev] += 1; });
    });

    dc.on('complete', function (e, d) {
      t.ok(e instanceof Error, 'an error must be raised on the complete event');
      t.equal(fired.err, 1, 'the complete event must be raised at the first error');
    });

    dc.on('ready', function (d) {
      t.equal(fired.err, 2, 'the ready event must be raised at the second error');
      t.ok(d.first instanceof Error, 'the first result must be an error');
      t.ok(d.second instanceof Error, 'the second result must be an error');
    })

    dc.error('first', new Error('1st error'));
    dc.error('second', new Error('2nd error'));
  });
});

test('An anonymous collector', function (t) {
  t.plan(4)
  var keys = Object.keys(FUNCS);
  var dc = new DC(keys.length);

  t.notOk(dc.named, 'must register as not being named');
  t.ok(Array.isArray(dc.items), 'must collect items in an array');
  t.equal(typeof dc.expected, 'number', 'must keep a counter for items to expect');
  t.equal(dc.state, DC.STATE_COLLECTING, 'must be in "collecting" state');

  test('... when collecting all items', function (t) {
    t.plan(3);

    var dc = new DC(keys.length);

    dc.once('complete', function (e, d) {
      t.equal(e, null, 'no error must be returned');
      t.ok(Array.isArray(d), 'result data must be an array');
      t.deepEqual(d, ['1st', '2nd'], 'results must be recorded');

      test('    ... when an extra collection is made', function (t) {
        t.plan(4);

        var fired = {ready: false, complete: false, collected: false, err: false}
        Object.keys(fired).forEach(function (ev) {
          dc.once(ev, function () { fired[ev] = true; });
        });

        dc.collect('3rd');

        t.notOk(fired.ready, 'the ready event must not have been fired');
        t.notOk(fired.err, 'the error event must not have been fired');
        t.notOk(fired.complete, 'the complete event must not have been fired');
        t.ok(fired.collected, 'the collected event must have been fired');

      });

    });
    keys.forEach(function (k) { FUNCS[k](collectAnon(dc)); });

  });

  test('... when retrieving a value', function (t) {
    t.plan(2);

    var dc = new DC(keys.length).timeout();
    keys.forEach(function (k) { FUNCS[k](collectAnon(dc, k)); });

    dc.get('first', function (e,  d) {
      t.ok(e instanceof Error, 'no error must be returned');
      t.equal(d, undefined, 'no result must be returned');
    });

  });
});

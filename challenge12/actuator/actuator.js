'use strict';

// Load modules

const Mqtt = require('mqtt');
const Seneca = require('seneca');
const Consul = require('./consul');


Consul.getService('broker', (err, broker) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  const mqtt = Mqtt.connect(`mqtt://${broker.address}:${broker.port}`);
  const seneca = Seneca();

  seneca.add({ role: 'actuate', cmd: 'set' }, (args, cb) => {
    const payload = JSON.stringify({ 'offset': parseInt(args.offset, 10) });
    mqtt.publish('temperature/1/set', new Buffer(payload), { qos: 0, retain: true }, cb);
  });

  seneca.listen({ port: 8000 });
});

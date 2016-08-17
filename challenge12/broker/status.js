'use strict';

// Load modules

const Mqtt = require('mqtt');


const mqtt = Mqtt.connect('mqtt://127.0.0.1:8000');

mqtt.once('connect', () => {
  process.exit(0);
});

mqtt.once('error', (err) => {
  console.error(error);
  process.exit(1);
});

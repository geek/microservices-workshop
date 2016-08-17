'use strict';

// Load modules

const Mqtt = require('mqtt');


const mqtt = Mqtt.connect('mqtt://localhost:8000', { connectTimeout: 1000, reconnectPeriod: 100 });

mqtt.once('connect', () => {
  mqtt.removeAllListeners();
  process.exit(0);
});

mqtt.once('error', (err) => {
  mqtt.removeAllListeners();
  console.error(error);
  process.exit(1);
});

setTimeout(() => {
  process.exit(1);
}, 3000);

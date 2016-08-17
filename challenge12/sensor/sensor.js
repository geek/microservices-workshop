'use strict';

// Load modules

const Mqtt = require('mqtt');
const Consul = require('./consul');


Consul.getService('broker', (err, broker) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  const mqtt = Mqtt.connect(`mqtt://${broker.address}:${broker.port}`);
  let offset = 100;

  mqtt.on('connect', () => {
    mqtt.subscribe('temperature/1/set', (err, granted) => {
      console.log('subscribed', granted);
    });
  });

  mqtt.on('message', (topic, payload) => {
    console.log('message received');
    try {
      offset = JSON.parse(payload).offset;
      console.log('new offset', offset);
    }
    catch (err) {
      console.error(err);
    }
  });

  let i = 0;
  setInterval(() => {
    const randInt = Math.floor(Math.random() * 100);
    const temperature = Math.round((Math.sin(i++ / 40) + 4) * randInt + offset);

    mqtt.publish('temperature/1/read', JSON.stringify({ sensorId: '1', temperature }), (err) => {
      if (err) {
        console.error(err);
      }
    });
  }, 2000);
});

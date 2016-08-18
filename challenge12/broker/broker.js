'use strict';

// Load modules

const Seneca = require('seneca');
const Consul = require('./consul');


let serializer = {
  act: function (cmd, cb) {
    cb(null, {});
  }
};

let sensor = {
  act: function (cmd, cb) {
    cb(null, {});
  }
};

const loadSerializer = function () {
  if (serializer.use) {
    return;
  }

  Consul.getService('serializer', (err, serializerService) => {
    if (err || !serializerService) {
      return retry(loadSerializer);
    }

    serializer = Seneca();
    serializer.client({
      host: serializerService.address,
      port: serializerService.port
    });
  });
};


const loadSensor = function () {
  if (sensor.use) {
    return;
  }

  Consul.getService('sensor', (err, sensorService) => {
    if (err || !sensorService) {
      return retry(loadSensor);
    }

    sensor = Seneca();
    sensor.client({
      host: sensorService.address,
      port: sensorService.port
    });
  });
};

const retry = function (fn) {
  setTimeout(() => {
    fn();
  }, 5000);
};

const main = function () {
  loadSerializer();
  loadSensor();

  const server = Seneca();

  let offset = 100;
  server.add({ role: 'temperature', cmd: 'offset' }, (args, cb) => {
    offset = parseInt(args.offset, 10);
    cb();
  });

  setInterval(() => {
    sensor.act({ role: 'temperature', cmd: 'read', offset: offset }, (err, args) => {
      if (err) {
        console.error(err);
        return;
      }

      serializer.act({ role: 'serialize', cmd: 'write', temperature: args.temperature, sensorId: args.sensorId }, () => {});
    });
  }, 2000);

  server.listen({ port: 8000 });
};
main();


process.on('SIGHUP', function () {
  loadSerializer();
  loadSensor();
});

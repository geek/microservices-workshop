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

let loadingSerializer = false;
const loadSerializer = function () {
  if (serializer.use || loadingSerializer) {
    return;
  }

  loadingSerializer = true;
  Consul.getService('serializer', (err, serializerService) => {
    if (err || !serializerService || !serializerService.address) {
      return retry(loadSerializer);
    }

    serializer = Seneca();
    serializer.client({
      host: serializerService.address,
      port: serializerService.port
    });
    loadingSerializer = false;
  });
};


let loadingSensor = false;
const loadSensor = function () {
  if (sensor.use || loadingSensor) {
    return;
  }

  loadingSensor = true;
  Consul.getService('sensor', (err, sensorService) => {
    if (err || !sensorService || !sensorService.address) {
      return retry(loadSensor);
    }

    sensor = Seneca();
    sensor.client({
      host: sensorService.address,
      port: sensorService.port
    });
    loadingSensor = false;
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
  serializer = {
    act: function (cmd, cb) {
      cb(null, {});
    }
  };

  sensor = {
    act: function (cmd, cb) {
      cb(null, {});
    }
  };

  loadSerializer();
  loadSensor();
});

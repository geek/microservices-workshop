'use strict';

// Load modules

const Path = require('path');
const Hapi = require('hapi');
const Inert = require('inert');
const Moment = require('moment');
const Seneca = require('seneca');
const Consul = require('./consul');
const WebStream = require('./webStream');


let serializer = {
  act: function (cmd, cb) {
    cb(null, {});
  }
};

let actuator = {
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

let loadingActuator = false;
const loadActuator = function () {
  if (actuator.use || loadingActuator) {
    return;
  }

  loadingActuator = true;
  Consul.getService('actuator', (err, actuatorService) => {
    if (err || !actuatorService || !actuatorService.address) {
      return retry(loadActuator);
    }

    actuator = Seneca();
    actuator.client({
      host: actuatorService.address,
      port: actuatorService.port
    });
    loadingActuator = false;
  });
};

const retry = function (fn) {
  setTimeout(() => {
    fn();
  }, 5000);
};


const main = function () {
  loadSerializer();
  loadActuator();

  const serverConfig = {
    connections: {
      routes: {
        files: {
          relativeTo: Path.join(__dirname, 'public')
        }
      }
    }
  };

  const server = new Hapi.Server(serverConfig);
  server.connection({ port: 8000 });
  server.register(Inert, () => {
    server.route({
      method: 'GET',
      path: '/set',
      handler: (request, reply) => {
        actuator.act({
          role: 'actuate',
          cmd: 'set',
          offset: request.query.offset
        }, (err) => {
          if (err) {
            return reply({ result: err });
          }

          reply({ result: 'ok' });
        });
      }
    });

    server.route({
      method: 'GET',
      path: '/{param*}',
      handler: {
        directory: {
          path: '.',
          redirectToSlash: true,
          index: true
        }
      }
    });

    const webStream = WebStream(server.listener);

    let lastEmitted = 0;
    let i = 0;
    setInterval(() => {
      if (!serializer || !serializer.act) {
        return;
      }

      serializer.act({
        role: 'serialize',
        cmd: 'read',
        sensorId: '1',
        start: Moment().subtract(10, 'minutes').utc().format(),
        end: Moment().utc().format()
      }, (err, data) => {
        let toEmit = [];

        if (err || !data || !data.length) {
          return;
        }

        data[0].forEach((point) => {
          if (Moment(point.time).unix() > lastEmitted) {
            lastEmitted = Moment(point.time).unix();
            point.time = (new Date(point.time)).getTime();
            toEmit.push(point);
          }
        });

        if (toEmit.length) {
          console.log('will emit');
          console.log(toEmit);
          webStream.emit(toEmit);
        }
      });
    }, 1000);

    server.start(() => {
      console.log(`listening at http://localhost:${server.info.port}`);
    });
  });
};
main();


process.on('SIGHUP', function () {
  console.log('------ SIGHUP ------');
  serializer = {
    act: function (cmd, cb) {
      cb(null, {});
    }
  };

  actuator = {
    act: function (cmd, cb) {
      cb(null, {});
    }
  };

  loadSerializer();
  loadActuator();
});

'use strict';

// Load modules

const Path = require('path');
const Hapi = require('hapi');
const Inert = require('inert');
const Moment = require('moment');
const Seneca = require('seneca');
const Consul = require('./consul');
const WebStream = require('./webStream');


// Declare internals

const internals = {};


Consul.getService('serializer', (err, serializer) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  Consul.getService('actuator', (err, actuator) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    internals.main(serializer, actuator);
  });
});


internals.main = function (serializer, actuator) {
  const seneca = Seneca();
  seneca.client({ host: serializer.address, port: serializer.port, pin: { role: 'serialize', cmd: 'read' } });
  seneca.client({ host: actuator.address, port: actuator.port, pin: { role: 'actuate', cmd: 'set' } });

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
        seneca.act({
          role: 'actuate',
          cmd: 'set', offset:
          request.query.offset
        }, (err) => {
          if (err) {
            return reply({ result: err });
          }

          reply({result: 'ok'});
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
      seneca.act({
        role: 'serialize',
        cmd: 'read',
        sensorId: '1',
        start: Moment().subtract(10, 'minutes').utc().format(),
        end: Moment().utc().format()
      }, (err, data) => {
        let toEmit = [];

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

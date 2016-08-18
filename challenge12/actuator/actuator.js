'use strict';

// Load modules

const Seneca = require('seneca');
const Consul = require('./consul');

let broker = {
  act: function (cmd, cb) {
    cb(null, {});
  }
};

const server = Seneca();

server.add({ role: 'actuate', cmd: 'set' }, (args, cb) => {
  broker.act({ role: 'temperature', cmd: 'offset', offset: parseInt(args.offset, 10) }, cb);
});

server.listen({ port: 8000 });


const loadBroker = function () {
  if (broker.use) {
    return;
  }

  Consul.getService('broker', (err, brokerService) => {
    if (err || !brokerService) {
      return retry(loadBroker);
    }

    const broker = Seneca().client({ host: brokerService.address, port: brokerService.port });
  });
};
loadBroker();

process.on('SIGHUP', function () {
  loadBroker();
});

const retry = function (fn) {
  setTimeout(() => {
    fn();
  }, 5000);
};

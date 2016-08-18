'use strict';

// Load modules

const Seneca = require('seneca');
const Consul = require('./consul');

let broker = {
  act: function (cmd, cb) {
    cb(null, {});
  }
};

let loading = false;
const loadBroker = function () {
  if (broker.use || loading) {
    return;
  }

  loading = true;
  Consul.getService('broker', (err, brokerService) => {
    if (err || !brokerService || !brokerService.address) {
      return retry(loadBroker);
    }

    broker = Seneca().client({ host: brokerService.address, port: brokerService.port });
    loading = false;
  });
};
loadBroker();


const server = Seneca();

server.add({ role: 'actuate', cmd: 'set' }, (args, cb) => {
  broker.act({ role: 'temperature', cmd: 'offset', offset: parseInt(args.offset, 10) }, cb);
});

server.listen({ port: 8000 });


process.on('SIGHUP', function () {
  broker = {
    act: function (cmd, cb) {
      cb(null, {});
    }
  };

  loadBroker();
});

const retry = function (fn) {
  setTimeout(() => {
    fn();
  }, 5000);
};

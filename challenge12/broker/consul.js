'use strict';

// Load modules

const Http = require('http');


// Declare internals

const internals = { hosts: {} };


exports.getService = function (name, callback) {
  if (internals.hosts[name] && internals.hosts[name].length) {
    return callback(null, internals.selectNext(internals.hosts[name]));
  }

  internals.getServices(name, (err, hosts) => {
    if (err) {
      return callback(err);
    }

    internals.hosts[name] = hosts;
    callback(null, internals.selectNext(internals.hosts[name]));
  });
};


exports.getServices = internals.getServices = function (name, callback) {
  Http.get({
    host: process.env.CONSUL_HOST || 'consul',
    port: process.env.CONSUL_PORT || 8500,
    path: `/v1/health/service/${name}?passing&near=agent`
  }, (res) => {
    let result = '';
    response.on('data', (data) => { result += data.toString(); });
    response.on('end', () => {
      const hosts = [];
      const parsed = JSON.parse(result);
      for (let i = 0; i < parsed.length; ++i) {
        hosts.push({
          address: parsed[i].Service.Address,
          port: parsed[i].Service.Port
        });
      }

      callback(null, hosts);
    });
  });
};


internals.selectNext = function (services) {
  if (!services || !services.length) {
    return;
  }

  const now = Date.now();
  let oldest = { executed: now };
  for (let i = 0; i < services.length; ++i) {
    const service = services[i];
    if (!service.executed) {
      oldest = service;
      break;
    }

    if (service.executed < oldest.executed) {
      oldest = service;
    }
  }

  oldest.executed = now;
  return oldest;
};

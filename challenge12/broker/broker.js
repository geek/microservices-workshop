'use strict';

const Mosca = require('mosca');
const Seneca = require('seneca');
const Consul = require('./consul');


Consul.getService('serializer', (err, serializer) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  const server = new Mosca.Server({ port: 8000 });
  const seneca = Seneca();
  seneca.client({
    host: serializer.address,
    port: serializer.port
  });

  server.on('error', (err) => {
    console.error(err);
  });

  server.published = (packet, client, cb) => {
    if (!packet.topic.match(/temperature\/[0-9]+\/read/)) {
      return cb();
    }

    const body = parse(packet.payload);

    body.role = 'serialize';
    body.cmd = 'write';
    seneca.act(body, cb);
  };
});


function parse (body) {
  try {
    return JSON.parse(body);
  }
  catch (err) {
    return null;
  }
}

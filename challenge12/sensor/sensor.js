'use strict';

// Load modules

const Seneca = require('seneca');

const server = Seneca();

let i = 0;
server.add({ role: 'temperature', cmd: 'read' }, (args, cb) => {
  const offset = parseInt(args.offset, 10);
  const randInt = Math.floor(Math.random() * 100);
  const temperature = Math.round((Math.sin(i++ / 40) + 4) * randInt + offset);
  cb(null, { sensorId: '1', temperature });
});

server.listen({ port: 8000 });

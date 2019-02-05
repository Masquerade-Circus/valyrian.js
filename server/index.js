let router = require('./router');
let micro = require('micro');
micro(router).listen(3001, () => {
  process.stdout.write('Micro listening on port 3001\n');
});

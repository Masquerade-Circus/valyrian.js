import '../../dist/valyrian.min.js';
import Router from '../../plugins/router.js';
import Request from '../../plugins/request';
import Sw from '../../plugins/sw';

v
    .use(Router)
    .use(Request)
    .use(Sw);

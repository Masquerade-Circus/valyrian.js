import test from 'ava';
import expect from 'expect';
import '../lib';
import nodePlugin from '../plugins/node';
import router from '../plugins/router';
v.use(nodePlugin).use(router);

test.serial('Mount and update with POJO component', async (t) => {
  let Component = {
    world: 'World',
    id: 'example',
    view() {
      return <div id={Component.id}>Hello {Component.world}</div>;
    }
  };

  let result = {};
  let router = v.Router();
  router.get('/', () => Component);
  v.routes('body', router);

  result.before = await v.routes.go('/');
  Component.world = 'John Doe';
  result.after = await v.routes.go('/');
  Component.world = 'World';
  result.final = v.update();

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>',
    final: '<div id="example">Hello World</div>'
  });
});

test.serial('Mount and update with functional stateful component', async (t) => {
  let Component = function () {
    return <div id={this.id}>Hello {this.world}</div>;
  };
  let state = {
    world: 'World',
    id: 'example'
  };

  // Should identify the function as a component
  v.addState(Component, state);

  let result = {};
  let router = v.Router();
  router.get('/', () => Component);
  v.routes('body', router);

  result.before = await v.routes.go('/');
  Component.world = 'John Doe';
  result.after = await v.routes.go('/');
  Component.world = 'World';
  result.final = v.update();

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>',
    final: '<div id="example">Hello World</div>'
  });
});

test.serial('Mount and update with functional stateless subcomponent', async (t) => {
  let SubComponent = (props) => <div id={props.id}>Hello {props.world}</div>;
  let state = {
    world: 'World',
    id: 'example'
  };
  let Component = function () {
    return <SubComponent {...state} />;
  };

  let result = {};
  let router = v.Router();
  router.get('/', () => Component);
  v.routes('body', router);

  result.before = await v.routes.go('/');
  state.world = 'John Doe';
  result.after = await v.routes.go('/');
  state.world = 'World';
  result.final = v.update();

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>',
    final: '<div id="example">Hello World</div>'
  });
});

test.serial('Antipattern: Mount and update with functional stateless component', async (t) => {
  let Component = (props) => <div id={props.id}>Hello {props.world}</div>;
  let props = {
    world: 'World',
    id: 'example'
  };

  let result = {};
  let router = v.Router();
  router.get('/', () => Component);
  v.routes('body', router);

  result.before = await v.routes.go('/', props);
  props.world = 'John Doe';
  result.after = await v.routes.go('/', props);
  props.world = 'World';
  result.final = v.update(Component, props);

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>',
    final: '<div id="example">Hello World</div>'
  });
});

test.serial('Antipattern: Mount and update with functional stateless component using only state', async (t) => {
  let Component = (props) => <div id={props.id}>Hello {props.world}</div>;
  let props = {
    world: 'World',
    id: 'example'
  };

  let result = {};
  let router = v.Router();
  router.get('/', () => Component);
  v.routes('body', router);

  result.before = await v.routes.go('/', props);
  props.world = 'John Doe';
  result.after = await v.routes.go('/', props);
  props.world = 'World';
  result.final = v.update(props);

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>',
    final: '<div id="example">Hello World</div>'
  });
});

test.serial('Test not found url', async (t) => {
  let Hello = () => 'Hello world';
  let NotFound = () => <div>Ups, no route was found.</div>;

  let router = v.Router();
  router.get('/', () => Hello);
  router.use(() => NotFound);

  v.routes('body', router);

  let result = {};
  result.found = await v.routes.go('/');
  result.notFound = await v.routes.go('/not_found');

  expect(result).toEqual({
    found: 'Hello world',
    notFound: '<div>Ups, no route was found.</div>'
  });
});

test.serial('Test params', async (t) => {
  let Store = {
    world: 'world',
    up: 'up'
  };
  let Hello = function () {
    return (
      <div>
        Hello {this.world}, what's {this.up}
      </div>
    );
  };

  let router = v.Router();
  router.get('/hello', () => v.addState(Hello, Store), () => Hello);
  router.get('/hello/:world/whats/:up', [
    (params) => {
      Store.world = params.world;
      Store.up = params.up;
      v.addState(Hello, Store);
    },
    () => Hello
  ]);

  v.routes('body', router);

  let result = {};
  result.before = await v.routes.go('/hello');
  result.after = await v.routes.go('/hello/Mike/whats/new');

  expect(result).toEqual({
    before: "<div>Hello world, what's up</div>",
    after: "<div>Hello Mike, what's new</div>"
  });
});

test.serial('Test mix single and array of middlewares', async (t) => {
  let Hello = () => <div>Hello World</div>;
  let middlewares = [];

  let router = v.Router();
  router.get(
    '/',
    () => middlewares.push('Middleware 1'),
    [
      () => middlewares.push('Middleware 1.1'),
      () => middlewares.push('Middleware 1.2'),
      [
        () => middlewares.push('Middleware 1.2.1'),
        () => middlewares.push('Middleware 1.2.2'),
        () => middlewares.push('Middleware 1.2.3'),
        () => middlewares.push('Middleware 1.2.4')
      ]
    ],
    () => middlewares.push('Middleware 2'),
    // This is the final response
    () => Hello
  );
  v.routes('body', router);

  let result = await v.routes.go('/');

  expect(result).toEqual('<div>Hello World</div>');
  expect(middlewares).toEqual([
    'Middleware 1',
    'Middleware 1.1',
    'Middleware 1.2',
    'Middleware 1.2.1',
    'Middleware 1.2.2',
    'Middleware 1.2.3',
    'Middleware 1.2.4',
    'Middleware 2'
  ]);
});

test.serial('Test subrouter', async (t) => {
  let Component = function () {
    return (
      <div>
        Hello {this.world}, from {this.country}
      </div>
    );
  };

  let subrouter = v.Router();
  subrouter
    .get('/from/:country', (params) => {
      Component.world = params.world;
      Component.country = params.country;
      return Component;
    })
    .get('/', (params) => {
      Component.world = params.world;
      Component.country = 'USA';
      return Component;
    });

  let router = v.Router();
  router.use('/hello/:world', subrouter);
  v.routes('body', router);

  let result = {};
  result.before = await v.routes.go('/hello/Mike');
  result.after = await v.routes.go('/hello/John/from/Mexico');

  expect(result).toEqual({
    before: "<div>Hello Mike, from USA</div>",
    after: "<div>Hello John, from Mexico</div>"
  });
});

test.serial('Test with parent component', async (t) => {
  let Component = () => <div>Hello World</div>;
  let ParentComponent = (...children) => <html><body>{children}</body></html>;

  let router = v.Router();
  router.get('/', () => Component);
  v.routes('body', router);

  let result = await v.routes.go(ParentComponent, '/');

  expect(result).toEqual('<html><body><div>Hello World</div></body></html>');
});

test.serial('Test show error when calling with a non url', async (t) => {
  let Component = () => <div>Hello World</div>;

  let router = v.Router();
  router.get('/', () => Component);
  v.routes('body', router);

  let err;
  try {
    await v.routes.go(null);
  } catch (error) {
    err = error.message;
  }

  expect(err).toEqual('v.router.url.required');
});

test.serial('Test show error when no component is returned', async (t) => {
  let router = v.Router();
  router.get('/', () => {});
  v.routes('body', router);

  let err;
  try {
    await v.routes.go('/');
  } catch (error) {
    err = error.message;
  }

  expect(err).toEqual("The url / requested wasn't found");
});

test.serial('Test get routes', (t) => {
  let Component = () => 'Hello world';
  let subrouter = v.Router();
  subrouter
    .get('/from/:country', () => Component)
    .get('/', () => Component);

  let router = v.Router();
  router
    .use('/hello/:world', subrouter)
    .get('/', () => Component);

  v.routes('body', router);

  expect(v.routes.get()).toEqual([
    '/hello/:world/from/:country',
    '/hello/:world*',
    '/'
  ]);
});
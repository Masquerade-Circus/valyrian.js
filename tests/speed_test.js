import test from 'ava';
import '../lib';
import nodePlugin from '../plugins/node';
v.use(nodePlugin);

import suite from 'chuhai';

test.skip('Mount and update times', (t) => {
  let getComponent = () => {
    let Component = {
      world: 'World',
      id: 'example',
      view() {
        return <div id={Component.id}>Hello {Component.world}</div>;
      }
    };
    return Component;
  };

  let before;
  let after;

  return suite('timeouts', (s) => {
    s.set('minSamples', 10);

    s.cycle(() => {
      t.is(before, '<div id="example">Hello World</div>');
      t.is(after, '<div id="example">Hello John Doe</div>');
    });

    s.burn('max', () => {
      let Component = getComponent();
      before = v.mount('body', Component);
      Component.world = 'John Doe';
      after = v.update();
    });

    s.bench('max 1', () => {
      let Component = getComponent();
      before = v.mount('body', Component);
      Component.world = 'John Doe';
      after = v.update();
    });

    s.bench('max 2', () => {
      let Component = getComponent();
      before = v.mount('body', Component);
      Component.world = 'John Doe';
      after = v.update();
    });
  });
});

// Use if method
test.skip('equals timeouts', (t) => {
  return suite('timeouts', (s) => {
    s.set('minSamples', 10);

    let valid = true;
    let method = () => {};
    let und;
    let response;
    s.cycle(() => {
      t.is(response, true);
    });

    s.burn('if valid burn', () => {
      response = valid ? true : false;
    });

    s.bench('if valid', () => {
      response = valid ? true : false;
    });

    s.bench('if !valid', () => {
      response = !valid ? false : true;
    });

    s.bench('if valid equals true', () => {
      response = valid === true ? true : false;
    });

    s.bench('if valid equals false', () => {
      response = valid === false ? false : true;
    });

    s.bench('if method', () => {
      response = method ? true : false;
    });

    s.bench('if !method', () => {
      response = !method ? false : true;
    });

    s.bench('if method different from undefined', () => {
      response = method !== undefined ? true : false;
    });

    s.bench('if method equals undefined', () => {
      response = method === undefined ? false : true;
    });

    s.bench('if typeof method different than undefined', () => {
      response = typeof method !== 'undefined' ? true : false;
    });

    s.bench('if typeof method equals undefined', () => {
      response = typeof method === 'undefined' ? false : true;
    });

    s.bench('if typeof method equals function', () => {
      response = typeof method === 'function' ? true : false;
    });

    s.bench('if typeof method different than function', () => {
      response = typeof method !== 'function' ? false : true;
    });

    s.bench('if und', () => {
      response = und ? false : true;
    });

    s.bench('if !und', () => {
      response = !und ? true : false;
    });

    s.bench('if und equals true', () => {
      response = und === true ? false : true;
    });

    s.bench('if und different than true', () => {
      response = und !== true ? true : false;
    });

    s.bench('if und different from undefined', () => {
      response = und !== undefined ? false : true;
    });

    s.bench('if und equals undefined', () => {
      response = und === undefined ? true : false;
    });

    s.bench('if typeof und different than undefined', () => {
      response = typeof und !== 'undefined' ? false : true;
    });

    s.bench('if typeof und equals undefined', () => {
      response = typeof und === 'undefined' ? true : false;
    });

    s.bench('if typeof und equals function', () => {
      response = typeof und === 'function' ? false : true;
    });

    s.bench('if typeof und different than function', () => {
      response = typeof und !== 'function' ? true : false;
    });

    s.bench('if !!method', () => {
      response = !!method ? true : false;
    });
  });
});

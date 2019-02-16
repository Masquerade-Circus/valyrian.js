import test from 'ava';
import expect from 'expect';
import '../lib';
import nodePlugin from '../plugins/node';
v.use(nodePlugin);

let Lifecycle = {
  s: 1,
  calls: [],
  view() {
    return (
      <div
        {...{
          oncreate(vnode) {
            // After dom element is created and attached to the document
            Lifecycle.calls.push('component oncreate');
          },
          onupdate(vnode) {
            // after dom element is updated
            Lifecycle.calls.push('component onupdate');
          },
          onremove(vnode) {
            // after dom element is removed
            Lifecycle.calls.push('component onremove');
          }
        }}
      >
        {Lifecycle.s > 0 ? (
          <h1
            {...{
              oncreate(vnode) {
                // After dom element is created and attached to the document
                Lifecycle.calls.push('oncreate');
              },
              onupdate(vnode) {
                // after dom element is updated
                Lifecycle.calls.push('onupdate');
              },
              onremove(vnode) {
                // after dom element is removed
                Lifecycle.calls.push('onremove');
              }
            }}
          >
            {Lifecycle.s}
          </h1>
        ) : (
          <small />
        )}
        <ul>
          {(function () {
            let elem = [];
            if (Lifecycle.s >= 0) {
              for (let l = Lifecycle.s; l--;) {
                if (l !== 4) {
                  elem.push(
                    <li>
                      <span
                        onremove={(vnode) => {
                          Lifecycle.calls.push('onspanremove');
                        }}
                      >
                        {l + 1}
                      </span>
                    </li>
                  );
                }
              }
            }

            return elem;
          }())}
        </ul>
      </div>
    );
  }
};

test.serial('Mount and update with POJO component', (t) => {
  let result = [];
  let expectedDom = [
    '<div><h1>1</h1><ul><li><span>1</span></li></ul></div>',
    '<div><small></small><ul></ul></div>',
    '<div><h1>1</h1><ul><li><span>1</span></li></ul></div>',
    '<div><h1>2</h1><ul><li><span>2</span></li><li><span>1</span></li></ul></div>',
    '<div><h1>1</h1><ul><li><span>1</span></li></ul></div>',
    '<div><h1>3</h1><ul><li><span>3</span></li><li><span>2</span></li><li><span>1</span></li></ul></div>',
    '<div><small></small><ul></ul></div>'
  ];
  let expectedLifeCycleCalls = [
    'component oncreate',
    'oncreate',
    'component onupdate',
    'onremove',
    'onspanremove',
    'component onupdate',
    'oncreate',
    'component onupdate',
    'onupdate',
    'component onupdate',
    'onupdate',
    'onspanremove',
    'component onupdate',
    'onupdate',
    'component onupdate',
    'onremove',
    'onspanremove',
    'onspanremove',
    'onspanremove'
  ];

  result.push(v.mount('body', Lifecycle));
  Lifecycle.s = 0;
  result.push(v.update());
  Lifecycle.s = 1;
  result.push(v.update());
  Lifecycle.s = 2;
  result.push(v.update());
  Lifecycle.s = 1;
  result.push(v.update());
  Lifecycle.s = 3;
  result.push(v.update());
  Lifecycle.s = 0;
  result.push(v.update());

  expect(result).toEqual(expectedDom);
  expect(Lifecycle.calls).toEqual(expectedLifeCycleCalls);
});

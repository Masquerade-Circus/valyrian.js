import test from 'ava';
import '../dist/valyrian.min.js';
import nodePlugin from '../plugins/node';
v.use(nodePlugin);

import suite from 'chuhai';

test('timeouts', async t => {
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

    return suite('timeouts', s => {
        s.set('minSamples', 10);
        s.set('defer', true);

        s.cycle(() => {
            t.is(before, '<div id="example">Hello World</div>');
            t.is(after, '<div id="example">Hello John Doe</div>');
        });

        s.burn('max', deferred => {
            let Component = getComponent();
            v.mount('body', Component).then((b) => {
                before = b;
                Component.world = 'John Doe';
                v.update().then((a) => {
                    after = a;
                    deferred.resolve();
                });
            });
        });
    });
});

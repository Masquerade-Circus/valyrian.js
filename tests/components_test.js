import test from 'ava';
import '../dist/valyrian.min.js';

let expected = [
    {
        name: 'div',
        props: { id: 'example' },
        children: ['Hello ', 'World'],
        dom: null,
        isVnode: true,
        nt: 1,
        isSVG: false
    }
];

test('POJO component', ({deepEqual}) => {
    let Component = {
        world: 'World',
        id: 'example',
        view() {
            return <div id={Component.id}>Hello {Component.world}</div>;
        }
    };

    deepEqual(v(Component), expected);
    deepEqual(<Component/>, expected);
});

test('Functional statefull component', ({deepEqual}) => {
    let view = function () {
        return <div id={this.id}>Hello {this.world}</div>;
    };
    let state = {
        world: 'World',
        id: 'example'
    };
    let Component = v(view, state);

    deepEqual(v(Component), expected);
    deepEqual(<Component/>, expected);
});

test('Functional stateless component', ({deepEqual}) => {
    let view = (props, world) => <div id={props.id}>Hello {world}</div>;
    let Component = v(view);

    deepEqual(v(Component, {id: 'example'}, 'World'), expected);
    deepEqual(<Component id="example">World</Component>, expected);
});

test('Functional stateless component antipattern', ({deepEqual}) => {
    let state = {
        world: 'World',
        id: 'example'
    };
    let view = () => <div id={state.id}>Hello {state.world}</div>;
    let Component = v(view);

    deepEqual(v(Component), expected);
    deepEqual(<Component>World</Component>, expected);
});

test('Functional statefull error context', ({throws, log}) => {
    let view = () => {
        log(this);
        return <div id={this.id}>Hello {this.world}</div>;
    };
    let state = {
        world: 'World',
        id: 'example'
    };
    let Component = v(view, state);

    throws(() => v(Component), 'Cannot read property \'id\' of undefined');
    throws(() => <Component/>, 'Cannot read property \'id\' of undefined');
});

let Counter = {
    count: 0,
    down: value => {
        Counter.count -= value;
    },
    up: value => {
        Counter.count += value;
    },
    view: () => {
        return v("div", null, [
            v("h1", null, Counter.count),
            v("button", { onclick: () => Counter.down(1) }, "-"),
            v("button", { onclick: () => Counter.up(1) }, "+"),
            v("a", { href: '/hello', onclick(e) {
                v.routes.go('/hello');
                e.preventDefault();
            } }, "Go to hello"),
            v('div', null, [
                Counter.count === 2 ? v(2) : '',
                v('br'),
                v('div', null, 'boolean true'),
                v('div', null, true),
                v('br'),
                v('div', null, 'boolean false'),
                v('div', null, false),
                v('br'),
                v('div', null, 'empty object'),
                v('div', null, {}),
                v('br'),
                v('div', null, 'null'),
                v('div', null, null),
                v('br'),
                v('div', null, 'undefined'),
                v('div', null, undefined),
                v('br'),
                v('ul', null, (function () {
                    let elem = [];
                    if (Counter.count >= 0) {
                        for (let l = Counter.count; l--;) {
                            elem.push(v('li', null, l));
                        }
                    }

                    return elem;
                }())),
                v('img', {
                    className: 'div',
                    id: 'ok',
                    src: 'http://placeimg.com/640/480/any'
                })
            ])
        ]);
    }
};

export default Counter;

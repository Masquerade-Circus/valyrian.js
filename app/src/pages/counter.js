let Counter = {
    count: 0,
    down: value => {
        Counter.count -= value;
    },
    up: value => {
        Counter.count += value;
    },
    view: () => {
        return v("div", [
            v("h1", Counter.count),
            v("button", { onclick: () => Counter.down(1) }, "-"),
            v("button", { onclick: () => Counter.up(1) }, "+"),
            v("a[href=/hello]", { onclick(e) {
                v.routes.go('/hello');
                e.preventDefault();
            } }, "Go to hello"),
            v([
                Counter.count === 2 ? v(2) : '',
                v('br'),
                v('', 'boolean true'),
                v(true),
                v('br'),
                v('', 'boolean false'),
                v(false),
                v('br'),
                v('', 'empty object'),
                v({}, {}),
                v('br'),
                v('', 'null'),
                v(null),
                v('br'),
                v('', 'undefined'),
                v(undefined),
                v('br'),
                v('ul', (function () {
                    let elem = [];
                    if (Counter.count >= 0) {
                        for (let l = Counter.count; l--;) {
                            elem.push(v('li', l));
                        }
                    }

                    return elem;
                }())),
                v('img.div[src=http://placeimg.com/640/480/any]#ok')
            ])
        ]);
    }
};

export default Counter;

var Counter = {
    down: value => {
        Store.count(Store.count - value);
    },
    up: value => {
        Store.count(Store.count + value);
    },
    view: () => {
          return v("div", [
            v("h1", Store.count),
            v("button", { onclick: () => Counter.down(1) }, "-"),
            v("button", { onclick: () => Counter.up(1) }, "+"),
            v("button", { onclick: () => Store.hello('aloha') }, "Aloha"),
            v("button", { onclick: () => v.router.go('/hello') }, "<"),
            v("button", { onclick: () => v.router.go(-1) }, "-1"),
            v("button", { onclick: () => v.router.back() }, "back"),
            v("button", { onclick: () => v.router.forward() }, "forward"),
            v([
                Store.count() === 2 ? v(2) : '',
                v('br'),
                v(true),
                v('br'),
                v('Ok'),
                v('br'),
                v({},{}),
                v('br'),
                v(null),
                v('br'),
                v(undefined),
                v('br'),
                v(function(){
                    return v('h1','ok2');
                }),
                v('img.div[src=http://placeimg.com/640/480/any]#ok')
            ])
        ]);
    }
};

module.exports = Counter;

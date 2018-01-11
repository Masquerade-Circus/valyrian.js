var Counter = {
    down: value => {
        Store.count(Store.count - value);
    },
    up: value => {
        Store.count(Store.count + value);
    },
    view: () => {
          return m("div", [
            m("h1", Store.count),
            m("button", { onclick: () => Counter.down(1) }, "-"),
            m("button", { onclick: () => Counter.up(1) }, "+"),
            m("button", { onclick: () => Store.hello('aloha') }, "Aloha"),
            m("button", { onclick: () => m.router.go('/hello') }, "<"),
            m("button", { onclick: () => m.router.go(-1) }, "-1"),
            m("button", { onclick: () => m.router.back() }, "back"),
            m("button", { onclick: () => m.router.forward() }, "forward"),
            m([
                Store.count() === 2 ? m(2) : '',
                m('br'),
                m(true),
                m('br'),
                m('Ok'),
                m('br'),
                m({},{}),
                m('br'),
                m(null),
                m('br'),
                m(undefined),
                m('br'),
                m(function(){
                    return m('h1','ok2');
                })
            ])
        ]);
    }
};

module.exports = Counter;

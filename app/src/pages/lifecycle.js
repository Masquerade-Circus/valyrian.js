let Lifecycle = {
    s: 1,
    up: () => Lifecycle.s += 1,
    down: () => Lifecycle.s += -1,
    view() {
        return v('div', {
            oninit(vnode) { // Before dom element is created
                console.log('component oninit', vnode);
            },
            oncreate(vnode) { // After dom element is created and attached to the document
                console.log('component oncreate', vnode);
            },
            onupdate(vnode) { // after dom element is updated
                console.log('component onupdate', vnode);
            },
            onremove(vnode) { // after dom element is removed
                console.log('component onremove', vnode);
            }
        }, [
            Lifecycle.s > 0 ? v('h1', {
                oninit(vnode) { // Before dom element is created
                    console.log('oninit', vnode);
                },
                oncreate(vnode) { // After dom element is created and attached to the document
                    console.log('oncreate', vnode);
                },
                onupdate(vnode) { // after dom element is updated
                    console.log('onupdate', vnode);
                },
                onremove(vnode) { // after dom element is removed
                    console.log('onremove', vnode);
                }
            }, Lifecycle.s) : v('small'),
            v('button', {onclick: Lifecycle.up}, '+'),
            v('button', {onclick: Lifecycle.down}, '-'),
            v('ul', null, (function () {
                let elem = [];
                if (Lifecycle.s >= 0) {
                    for (let l = Lifecycle.s; l--;) {
                        if (l !== 4) {
                            elem.push(v('li', null, v('span', {
                                onremove(vnode) {
                                    console.log('onspanremove', vnode);
                                }
                            }, l + 1)));
                        }
                    }
                }

                return elem;
            }()))
        ]);
    }
};

export default Lifecycle;

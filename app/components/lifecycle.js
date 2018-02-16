let Lifecycle = {
    s: v.data(1),
    up: () => Lifecycle.s(Lifecycle.s+1),
    down: () => Lifecycle.s(Lifecycle.s-1),
    view() {
        return v('div', [
            Lifecycle.s() > 0 ? v('h1', {
                oninit(vnode){ // Before dom element is created
                    console.log('oninit', vnode);
                },
                oncreate(vnode){ // After dom element is created and attached to the document
                    console.log('oncreate', vnode);
                },
                onupdate(vnode){ // after dom element is updated
                    console.log('onupdate', vnode);
                },
                onbeforeremove(vnode){ // before dom element is detached from the document
                    console.log('onbeforeremove', vnode);
                },
                onremove(vnode){ // after dom element is removed
                    console.log('onremove', vnode);
                }
            }, Lifecycle.s()) : v('small', ''),
            v('button', {onclick: Lifecycle.up}, '+'),
            v('button', {onclick: Lifecycle.down}, '-'),
            v('ul', (function(){
                let elem = [];
                if (Lifecycle.s() >= 0){
                    for (let l = Lifecycle.s(); l--;){
                        if (l !== 4){
                            elem.push(v('li', {
                                onbeforeremove(vnode){
                                    console.log('onbeforeremovelistart');
                                    var p = new Promise((resolve) => {
                                        setTimeout(function(){
                                            console.log('onbeforeremoveliend');
                                            resolve();
                                        }, 2000);
                                    });
                                    return p;
                                }
                            }, v('span',{
                                onbeforeremove(vnode){
                                    console.log('onbeforeremovespanstart');
                                    var p = new Promise((resolve) => {
                                        setTimeout(function(){
                                            console.log('onbeforeremovespanend');
                                            resolve();
                                        }, 1000);
                                    });
                                    return p;
                                },
                                onremove(vnode){
                                    console.log('onspanremove', vnode);
                                }
                            }, l)));
                        }
                    }
                }

                return elem;
            })())
        ]);
    }
};

module.exports = Lifecycle;

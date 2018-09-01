let SubcomponentFactory = function () {
    let Subcomponent = {
        hidden: true,
        view(vnode) {
            return [
                v('button', {
                    onclick: () => {
                        this.hidden = !this.hidden;
                        v.update();
                    }
                }, this.hidden ? 'Unhide' : 'Hide'),
                v('div', null, this.hidden ? 'Hidden' : 'Unhidden')
            ];
        }
    };
    return Subcomponent;
};

let Component = {
    oninit(vnode) {
        Component.sub1 = SubcomponentFactory();
        Component.sub2 = SubcomponentFactory();
        Component.sub3 = SubcomponentFactory();
    },
    view() {
        return [
            v(Component.sub1, { hidden: false }),
            v(Component.sub2, { hidden: true }),
            v(Component.sub3)
        ];
    }
};

export default Component;

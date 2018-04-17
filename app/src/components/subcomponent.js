let Subcomponent = {
    hidden: true,
    view() {
        console.log(this);
        return [
            v('button', {
                onclick: () => {
                    this.hidden = !this.hidden;
                    console.log(this);
                    v.update();
                }
            }, this.hidden ? 'Unhide' : 'Hide'),
            v('div', this.hidden ? 'Hidden' : 'Unhidden')
        ]
    }
};

let Component = {
    view() {
        return [
            v(Subcomponent, { hidden: false }),
            v(Subcomponent, { hidden: true })
        ];
    }
};

export default Component;

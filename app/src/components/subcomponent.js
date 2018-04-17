let Subcomponent = {
    view() {
        return v('div', 'Hello');
    }
};

let Component = {
    getSubcomponent() {
        let view = v(Subcomponent);
        console.log(view);
        return view;
    },
    view() {
        return [
            Component.getSubcomponent()
        ];
    }
};

export default Component;

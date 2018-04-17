let Hello = {
    getServer: () => {
        return v.get('/api/hola').then(data => {
            Store.hello(data.hello);
            Store.name(data.name);
        });
    },
    view() {
        return v('div#mundo.hola', Store.message());
    }
};

export default Hello;

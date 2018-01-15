let Hello = {
    getServer: () => {
        return v.get('/hola').then(data => {
            Store.hello(data.hello);
            Store.name(data.name);
        });
    },
    view() {
        return v('div#mundo.hola', Store.message());
    }
};

module.exports = Hello;

let state = {
    data: {
        hello: 'Hello',
        name: 'world'
    },
    oninit() {
        return this.getServer();
    },
    getServer() {
        return v.request.get('/api/hola').then(data => {
            this.data = data;
        });
    }
};

function view() {
    return v('div#mundo.hola', `${this.data.hello} ${this.data.name}`);
}

export default v(view, state);

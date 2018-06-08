let Hello = {
    data: {
        hello: '',
        name: ''
    },
    oninit() {
        return Hello.getServer();
    },
    getServer: () => {
        return v.request.get('/api/hola').then(data => {
            Hello.data = data;
        });
    },
    view() {
        return v('div#mundo.hola', `${Hello.data.hello} ${Hello.data.name}`);
    }
};

export default Hello;

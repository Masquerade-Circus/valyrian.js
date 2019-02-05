let state = {
  data: {
    hello: 'Hello',
    name: 'world'
  },
  getServer() {
    return v.request.get('/api/hola').then((data) => {
      this.data = data;
    });
  }
};

function view() {
  return v('div', { id: 'mundo', class: 'hola' }, `${this.data.hello} ${this.data.name}`);
}

export default v(view, state);

let Store = {
    hello: v.data('hello'),
    name: v.data('name'),
    count: v.data(1)
};

Store.message = v.data(() => Store.hello + ' ' + Store.name);

export default Store;

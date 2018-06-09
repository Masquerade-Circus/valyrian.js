let Page = {
    view() {
        return [
            v('div'),
            v('div#hola'),
            v('div#hola-mundo'),
            v('div#hola_mundo'),
            v('div.hola'),
            v('div.hola-mundo'),
            v('div.hola_mundo'),
            v('div[hola]'),
            v('div[hola=mundo]'),
            v('div[hola-mundo]'),
            v('div[hola_mundo]'),
            v('div[hola="mundo"]'),
            v('#hola'),
            v('#hola-mundo'),
            v('#hola_mundo'),
            v('.hola'),
            v('.hola-mundo'),
            v('.hola_mundo'),
            v('[hola]'),
            v('[hola=mundo]'),
            v('[hola-mundo]'),
            v('[hola_mundo]'),
            v('[hola="mundo"]'),
            v('div#hola-mundo.hola-mundo.mundo[hola="mundo"][hola-mundo=ok]')
        ];
    }
};

export default Page;

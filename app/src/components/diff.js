let Diff = {
    s: v.data(1),
    up: () => Diff.s(Diff.s + 1),
    down: () => Diff.s(Diff.s - 1),
    view() {
        return v('div', [
            Diff.s() > 0 ? v('h1', Diff.s()) : v('small', ''),
            v('button', { onclick: Diff.up }, '+'),
            v('button', { onclick: Diff.down }, '-'),
        ]);
    }
};

export default Diff;

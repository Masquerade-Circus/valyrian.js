import expect from 'expect';
import '../lib';
import nodePlugin from '../plugins/node';
v.usePlugin(nodePlugin);

describe('Keyed lists', () => {
  let set = [1, 2, 3, 4, 5];
  let tests = [
    {name: 'Removed at the end', set: [1, 2, 3, 4]}, // Removed at the end
    {name: 'Removed at the start', set: [2, 3, 4, 5]}, // Remmoved at the start
    {name: 'Removed at the center', set: [1, 3, 5]}, // Removed at the center
    {name: 'Added at the end', set: [1, 2, 3, 4, 5, 6]}, // Added at the end
    {name: 'Added at the start', set: [6, 1, 2, 3, 4, 5]}, // Added at the start
    {name: 'Added at the center', set: [1, 2, 6, 3, 4, 5]}, // Added at the center
    {name: 'Reversed', set: [5, 4, 3, 2, 1]}, // Reversed
    {name: 'Switch positions', set: [1, 4, 3, 2, 5]}, // Switch positions,
    {name: 'Mixed positions', set: [1,3,2,6,5,4]}
  ];
  let beforeString = '<ul>';
      for (let key of set) {
        beforeString += '<li>' + key + '</li>';
      }
      beforeString += '</ul>';

  tests.forEach(test => {
    it('Keyed list: ' + test.name, () => {
      let keys = [...set];
      let component = () => <ul>{keys.map(key => <li key={key}>{key}</li>)}</ul>;

      let before = v.mount('body', component);
      keys = [...test.set];
      let after = v.update();

      let afterString = '<ul>';
      for (let key of test.set) {
        afterString += '<li>' + key + '</li>';
      }
      afterString += '</ul>';

      expect(before).toEqual(beforeString);
      expect(after).toEqual(afterString);
    });
  });
});

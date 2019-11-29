import expect from 'expect';
import './lib';
import nodePlugin from './plugins/node';
v.usePlugin(nodePlugin);

describe.only('Hooks like pattern', () => {

  it.only('should create a simple counter', async () => {
    let Counter = () => {
      let [count, setState] = v.useState(0);
      setState(count + 1);
      console.log(count);
      return <div v-remove={() => {}}>{count}</div>;
    };

    console.log('**************mount**************');
    let result = v.mount('div', Counter);
    console.log('**************mounted**************', result);
    console.log('**************update**************');
    result = v.update();
    console.log('**************updated**************', result);


    // let component;
    // let hookIndex = 0;

    // function useState(initial) {
    //   let hook;

    //   if (component) {
    //     component.hooks = component.hooks || [];
    //     if (component.hooks && component.hooks[hookIndex]) {
    //       hook = component.hooks[hookIndex];
    //     } else {
    //       hook = {
    //         state: initial,
    //         setState(value) {
    //           hook.state = typeof value === 'function' ? value(hook.state) : value;
    //         }
    //       };
    //       component.hooks.push(hook);
    //     }
    //   }

    //   return [hook.state, hook.setState];
    // }

    // function Component() {
    //   let [state, setState] = useState(0);
    //   setState(state + 1);
    //   console.log(state);
    // }
    // component = {component: Component};

    // Component();
    // Component();

  });
});

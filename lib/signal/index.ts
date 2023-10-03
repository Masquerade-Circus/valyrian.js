import { VnodeWithDom, current, onUnmount, updateVnode, v } from "valyrian.js";

interface GetterInterface {
  (): any;
}

interface SetterInterface {
  (value: any): void;
}

interface SubscribeInterface {
  (callback: Function): void;
}

interface SubscriptionsInterface extends Array<Function> {}

export interface SignalInterface extends Array<any> {
  0: GetterInterface;
  1: SetterInterface;
  2: SubscribeInterface;
  3: SubscriptionsInterface;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function Signal(initialValue: any): SignalInterface {
  // Create a copy of the current context object
  const { vnode, component } = { ...current };

  // Check if the context object has a vnode property
  if (vnode && component) {
    // Is first call
    if (!vnode.components) {
      // Set the components property to an empty array
      vnode.components = [];
    }

    // Check if the components array of the vnode object does not contain the component object
    if (vnode.components.indexOf(component) === -1) {
      // Set the calls property to -1
      vnode.signal_calls = -1;
      // Add the component to the components array
      vnode.components.push(component);

      // Check if the component object has a signals property
      if (!component.signals) {
        // Set the signals property of the component object to an empty array
        component.signals = [];
        // Add a function to the cleanup stack that removes the signals property from the component object
        onUnmount(() => Reflect.deleteProperty(component, "signals"));
      }
    }

    // Assign the signal variable to the signal stored at the index of the vnode object's calls property in the vnode's signals array
    const signal: SignalInterface = component.signals[++vnode.signal_calls];

    // If a signal has already been assigned to the signal variable, return it
    if (signal) {
      // Remove all subscriptions because we come from a new render
      signal[3].length = 0;

      // Return the signal
      return signal;
    }
  }

  // Declare a variable to store the current value of the Signal
  let value = initialValue;

  // Create an array to store functions that have subscribed to changes to the Signal's value
  const subscriptions: SubscriptionsInterface = [];

  // Define a function that allows other parts of the code to subscribe to changes to the Signal's value
  const subscribe = (callback: Function) => {
    // Add the callback function to the subscriptions array if it is not already in the array
    if (subscriptions.indexOf(callback) === -1) {
      subscriptions.push(callback);
    }
  };

  // Set the vnodes to update when the Signal's value changes
  const vnodesToUpdate: Array<VnodeWithDom> = [];

  // This is the function that will be called when the Signal's value changes
  const updateVnodes = () => {
    // Create a copy of the vnodesToUpdate array and filter out any duplicate vnodes
    const vnodesToUpdateCopy = vnodesToUpdate.filter((vnode, index, self) => {
      return self.findIndex((v) => v.dom === vnode.dom) === index;
    });

    // Loop through the vnodesToUpdate array
    for (let i = 0, l = vnodesToUpdateCopy.length; i < l; i++) {
      const vnode2 = vnodesToUpdateCopy[i];
      // If it does, create a new vnode object based on the original vnode, its children, and its DOM and SVG properties
      const newVnode = v(vnode2.tag, vnode2.props, ...vnode2.initialChildren) as VnodeWithDom;
      newVnode.dom = vnode2.dom; // Set the new vnode object's DOM property to the old vnode object's DOM property
      newVnode.isSVG = vnode2.isSVG; // Set the new vnode object's isSVG property to the old vnode object's isSVG property

      // Update the vnode object
      updateVnode(newVnode, vnode2);
    }
  };

  // Define a function that returns the current value of the Signal
  function get() {
    // Get the current vnode from the context object
    const { vnode: vnode2 } = current;

    // If we have a current vnode, it means that a get function is being called from within a component
    // so we subscribe the vnode to be updated when the Signal's value changes
    if (vnode2 && vnodesToUpdate.indexOf(vnode2) === -1) {
      // We set the initialChildren to a copy of the vnode's children array
      // This is the case when the vnode is a component that has not been rendered yet and we need the initial children
      // because they could have the components that are using the Signal
      if (!vnode2.initialChildren) {
        vnode2.initialChildren = [...vnode2.children];
      }

      // Add the vnode to the vnodesToUpdate array
      vnodesToUpdate.push(vnode2);

      // Subscribe the updateVnodes function to the Signal
      subscribe(updateVnodes);
    }

    // Return the current value of the Signal
    return value;
  }

  // Define a function that allows the value of the Signal to be updated and notifies any subscribed functions of the change
  const set = (newValue: any) => {
    // If we have a current event on going, prevent the default action
    if (current.event) {
      current.event.preventDefault();
    }

    // Just return if the new value is the same as the current value
    if (newValue === value) {
      return;
    }

    // Update the value of the Signal
    value = newValue;

    // Call each subscribed function with the new value of the Signal as an argument
    for (let i = 0, l = subscriptions.length; i < l; i++) {
      subscriptions[i](value);
    }
  };

  // Assign the signal variable an array containing the get, set, and subscribe functions
  const signal: SignalInterface = [get, set, subscribe, subscriptions];

  // If the context object has a vnode property, add the signal to the vnode's signals array
  // and add the subscriptions array to the vnode's subscriptions array
  if (vnode && component) {
    component.signals.push(signal);
  }

  // Return the signal
  return signal;
}

// lib/suspense/index.ts
import { isVnodeComponent, isPOJOComponent, isComponent, v } from "valyrian.js";
import { useState } from "valyrian.js/hooks";
function Suspense({
  fallback,
  error
}, children) {
  const [loadedChildren, setLoadedChildren] = useState(null);
  const [err, setErr] = useState(null);
  return v(() => {
    if (err()) {
      if (error) {
        return error(err());
      }
      return err().message;
    }
    if (loadedChildren()) {
      return loadedChildren();
    }
    Promise.all(
      children.map((child) => {
        if (isVnodeComponent(child)) {
          if (isPOJOComponent(child.tag)) {
            return child.tag.view.bind(child.tag)(child.props || {}, child.children);
          }
          return child.tag(child.props || {}, child.children);
        }
        if (isPOJOComponent(child)) {
          return child.view.bind(child)({}, []);
        }
        if (isComponent(child)) {
          return child({}, []);
        }
        return child;
      })
    ).then((newChildren) => {
      setLoadedChildren(newChildren);
    }).catch((e) => {
      setErr(e);
    });
    return fallback;
  }, {});
}
export {
  Suspense
};

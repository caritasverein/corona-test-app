import React from 'react';

function camelToDash(str) {
  return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase()
}
function stripOn(str) {
  return str.replace(/^on-?/, '');
}
function strip$(str) {
  return str.replace(/^\$/, '');
}

const useCustomElement = (props, customMapping = {}) => {
  const ref = React.createRef();

  React.useLayoutEffect(() => {
    const { current } = ref;

    let fns;
    let vls;

    if (current) {
      fns = Object.keys(props)
        .filter(key => key.startsWith('on'))
        .map(key => ({
          key: customMapping[key] || stripOn(camelToDash(key)),
          fn: props[key],
        }));

      fns.forEach(({ key, fn }) => current.addEventListener(key, fn));

      vls = Object.keys(props)
        .filter(key => key.startsWith('$'))
        .map(key => ({
          key: customMapping[key] || strip$(key),
          val: props[key],
        }));

      vls.forEach(({ key, val }) => { if(current[key] !== val) current[key] = val; } );
    }

    return () => {
      if (current) {
        fns.forEach(({ key, fn }) =>
          current.removeEventListener(key, fn),
        );
      }
    };
  }, [customMapping, props, ref]);

  const customElementProps = Object.keys(props)
    .filter(key => !key.startsWith('on'))
    .filter(key => !key.startsWith('$'))
    .reduce((acc, key) => {
      const prop = props[key];

      const computedKey = customMapping[key] || key;

      if (prop instanceof Object || prop instanceof Array) {
        return { ...acc, [computedKey]: JSON.stringify(prop) };
      }

      return { ...acc, [computedKey]: prop };
    }, {});

  return [customElementProps, ref];
};

export default useCustomElement;

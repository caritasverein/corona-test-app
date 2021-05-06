import React from 'react';
import {useCustomElement} from './hooks/useCustomElement.js';
import {component} from 'haunted';

export const registerComponent = (name, classOrHook) => {
  if (!HTMLElement.isPrototypeOf(classOrHook)) classOrHook = component(classOrHook)
  customElements.define(name, classOrHook);

  return (props)=>{
    const [customElementProps, ref] = useCustomElement(props);
    return React.createElement(name, {...customElementProps, ref}, null);
  }
}
export default registerComponent;

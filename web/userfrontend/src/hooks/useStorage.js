import { useState, useCallback } from 'react';


export const useStorage = (key, init='{}')=>{
  const [_value, set_Value] = useState(()=>
    JSON.parse(window.localStorage.getItem(key) ?? init)
  );

  const setValue = useCallback((v)=>{
    set_Value((old)=>{
      if (typeof v === 'function') v = v(old);
      window.localStorage.setItem(key, JSON.stringify(v));
      return v;
    });
  }, [key, set_Value])
  return [_value, setValue];
}

export default useStorage;

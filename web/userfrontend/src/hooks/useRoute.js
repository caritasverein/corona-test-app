import { useEffect, useState, useCallback } from 'react';

const getPath = () => {
  const [, ...path] = window.location.pathname.replace(process.env.PUBLIC_URL, '').split('/');
  return path;
};

export const useRoute = () => {
  const [_value, set_Value] = useState(getPath);

  const setValue = useCallback((v = '') => {
    const path = typeof v === 'string' ? v : v.map(
      (p) => encodeURIComponent(p)
    ).join('/');

    set_Value((old) => {
      window.history.pushState(
        null,
        document.title,
        process.env.PUBLIC_URL + '/' + path
      );
      window.dispatchEvent(new Event('pushstate'));
      window.scrollTo(0, 0);
      return v;
    });
  }, [set_Value]);

  const setValueCb = useCallback((v) => {
    set_Value(getPath());
  }, [set_Value]);

  useEffect(()=>{
    window.addEventListener('popstate', setValueCb);
    window.addEventListener('pushstate', setValueCb);
    return ()=>{
      window.removeEventListener('popstate', setValueCb);
      window.removeEventListener('pushstate', setValueCb);
    }
  }, [setValueCb]);

  return [_value, setValue];
}

export default useRoute;

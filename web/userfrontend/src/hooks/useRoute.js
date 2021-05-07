import { useEffect, useState, useCallback } from 'react';

const getPath = () => {
  const [, ...path] = window.location.pathname.replace(process.env.PUBLIC_URL, '').split('/');
  return path;
};

window.addEventListener('popstate', (e)=>{
  if (window.onbeforeunload) {
    if (window.confirm(window.onbeforeunload())) {
      return;
    } else {
      window.history.forward();
      e.preventDefault();
      e.stopPropagation();
    }
  }
});

export const useRoute = () => {
  const [_value, set_Value] = useState(getPath);

  const setValue = useCallback((v = '') => {
    const path =
      process.env.PUBLIC_URL + '/' +
      (typeof v === 'string' ? v : v.map(
        (p) => encodeURIComponent(p)
      ).join('/'));

    if (window.location.pathname === path) return;
    console.log(window.location.pathname, path)

    if (window.onbeforeunload && !window.confirm(window.onbeforeunload())) {
      window.history.forward();
      return;
    }

    window.history.pushState(
      null,
      document.title,
      path
    );
    window.dispatchEvent(new Event('pushstate'));
    window.scrollTo(0, 0);
    set_Value(v);
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

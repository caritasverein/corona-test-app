import { useEffect, useState, useCallback } from 'react';

const apiBaseURL = new URL(window.location);
apiBaseURL.pathname = '/api'+process.env.PUBLIC_URL+'/';

export function usePromise(promise, init = "", error = false) {
  if (!(promise instanceof Promise)) init = promise;
  const [value, setValue] = useState(init);

  useEffect(() => {
    if (!(promise instanceof Promise)) return;
    promise.then(setValue);
    if (error) promise.catch(setValue);
  }, [promise, error]);

  return value;
}

export function useApi(path, init = undefined, error = false) {
  const [value, setValue] = useState(init);
  const [errorValue, setErrorValue] = useState();

  const update = useCallback(()=>{
    const promise = apiFetch('GET', path);
    promise.then((v)=>{
      setErrorValue(null);
      setValue(old=>JSON.stringify(old)===JSON.stringify(v)?old:v);
    }, setErrorValue);
    if (error === true) promise.catch(setValue);
    if (typeof error === 'function') promise.catch(error).then(setValue, setErrorValue);
    return promise;
  }, [path, error]);

  useEffect(() => {
    update()
  }, [update]);

  return [value, update, errorValue];
}

export function useInterval(update, interval) {
  useEffect(() => {
      const id = setInterval(() => {
          update();
      }, interval);
      return () => clearInterval(id);
  }, [update, interval]);
}

export const apiFetch = (method, path, body)=>{
  const url = new URL(path instanceof URL ? path : ('./' + path), apiBaseURL);
  return fetch(url, {
    method,
    headers: {
      'content-type': 'application/json',
    },
    body: (body!==undefined && JSON.stringify(body)) || undefined
  }).then(async res=>{
    if (res.status === 204) return res;
    const contentType = res.headers.get('content-type');
    if (!contentType) return res;
    const isJSON = contentType.startsWith('application/json');
    if (!res.ok && isJSON) throw await res.json();
    // eslint-disable-next-line
    if (!res.ok) throw {status: res.status, message: await res.text()};
    if (isJSON) return res.json();
    return res.text();
  });
}

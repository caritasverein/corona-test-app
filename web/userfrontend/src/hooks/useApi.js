import { useEffect, useState, useCallback } from 'react';

const apiBaseURL = new URL(window.location);
apiBaseURL.pathname = '/api/';

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

export function useApi(method, path, body, init = undefined, error = false) {
  const [value, setValue] = useState(init);
  const [errorValue, setErrorValue] = useState();

  const update = useCallback(()=>{
    const promise = apiFetch(method, path, body);
    promise.then((v)=>{
      setValue(old=>JSON.stringify(old)===JSON.stringify(v)?old:v);
    });
    promise.catch(setErrorValue);
    if (error === true) promise.catch(setValue);
    if (typeof error === 'function') promise.catch(error).then(setValue, setErrorValue);
    return promise;
  }, [method, path, body, error]);

  useEffect(() => {
    update()
  }, [update]);

  return [value, update, errorValue];
}

export const apiFetch = (method, path, body)=>{
  const url = new URL('./'+path, apiBaseURL);
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
    if (!res.ok) throw {status: res.status, message: await res.text()};
    if (isJSON) return res.json();
    res.text();
  });
}

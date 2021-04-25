import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const url = new URL('./'+path, apiBaseURL);
    const promise = fetch(url, {
      method,
      headers: {
        'content-type': 'application/json',
      },
      body: (body && JSON.stringify(body)) || undefined
    })
      .then(res=>res.ok?res.json():res.text())
      .then(setValue);
    if (error) promise.catch(setValue);
  }, [method, path, body, error]);

  return value;
}

export const apiFetch = (method, path, body)=>{
  const url = new URL('./'+path, apiBaseURL);
  return fetch(url, {
    method,
    headers: {
      'content-type': 'application/json',
    },
    body: (body && JSON.stringify(body)) || undefined
  }).then(res=>res.ok?res.json():res.text())
}

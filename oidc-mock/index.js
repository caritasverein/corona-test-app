import express from 'express';
import crypto from 'crypto';
import jose from 'node-jose';


const keyStore = jose.JWK.createKeyStore();
keyStore.generate('RSA', 2048, {alg: 'RS256', use: 'sig' });

const app = express();

const {publicKey, privateKey} = crypto.generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'pkcs1',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs1',
    format: 'pem'
  }
});

app.get('/.well-known/openid-configuration', (req, res)=>{
  const url = req.protocol + '://' + req.get('host');
  res.send({
    "issuer": url,
    "authorization_endpoint": url+"/auth",
    "token_endpoint": url+"/token",
    "jwks_uri": url+"/jwks",
    "response_types_supported": [
      "id_token",
    ],
    "subject_types_supported": [
      "public"
    ],
    "id_token_signing_alg_values_supported": [
      "RS256"
    ],
    "grant_types_supported": [
      "implicit",
    ],
  });
});


app.get('/auth', async (req, res)=>{
  const url = req.protocol + '://' + req.get('host');
  //console.log(req.query);
  const params = new URLSearchParams();
  const [key] = keyStore.all({ use: 'sig' });
  //console.log(key);

  const opt = { compact: true, jwk: key, fields: { typ: 'jwt' } }
  const payload = JSON.stringify({
    iss: url,
    sub: "000000000000",
    aud: [req.query.client_id],
    exp: new Date().getTime() / 1000 + 365 * 24 * 60 * 60,
    iat: new Date().getTime() / 1000,
    nonce: req.query.nonce,
  });
  const token = await jose.JWS.createSign(opt, key)
    .update(payload)
    .final()

  params.append('token_type', 'bearer');
  params.append('id_token', token);
  //params.append('nonce', req.query.nonce);
  params.append('state', req.query.state);

  let redirect = req.query.redirect_uri;
  switch (req.query.response_mode) {
    case 'form_post':
    case 'query':
      redirect += '?' + params.toString();
    break;
    case 'fragment':
    default:
      redirect += '#' + params.toString();
  }
  //console.log(redirect);
  res.redirect(redirect);
});

app.get('/token', (req, res)=>{
  console.error('aaaaaaaaa');
  res.sendStatus(501);
});

app.get('/jwks', (req, res)=>{
  res.send(keyStore.toJSON())
});


app.listen(9090);

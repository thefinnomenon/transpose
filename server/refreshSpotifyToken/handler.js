const https = require('https');
const AWS = require('aws-sdk');

exports.handler = event => {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  const buff = new Buffer.from(`${client_id}:${client_secret}`);
  const base64ClientData = buff.toString('base64');

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'accounts.spotify.com',
      port: 443,
      path: '/api/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${base64ClientData}`,
      },
    };

    const req = https.request(options, res => {
      console.log(res);

      res.on('data', function(d) {
        const data = JSON.parse(d);
        const token = data.access_token;

        const secretsManager = new AWS.SecretsManager();
        secretsManager
          .putSecretValue({
            SecretId: 'Transpose/Spotify_Bearer_Token',
            SecretString: token,
          })
          .promise()
          .then(() => {
            resolve('Success');
          })
          .catch(e => {
            reject(e.message);
          });
      });
    });

    req.on('error', e => {
      reject(e.message);
    });

    req.write('grant_type=client_credentials');
    req.end();
  });
};

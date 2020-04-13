const AWS = require('aws-sdk');
const fs = require('fs');
const jwt = require('jsonwebtoken');

//////  REFRESH TOKEN
//  Generates & sets an Apple Music API access token good for 1 hour (3600s).
//  https://developer.apple.com/documentation/applemusicapi/getting_keys_and_creating_tokens
//////
exports.handler = async event => {
  const teamID = process.env.TEAM_ID;
  const keyID = process.env.KEY_ID;

  const privateKey = fs.readFileSync('MusicKitKey.p8');

  const token = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '1h',
    issuer: teamID,
    keyid: keyID,
  });

  const secretsManager = new AWS.SecretsManager();
  const res = await secretsManager
    .putSecretValue({
      SecretId: 'Transpose/Apple_Music_Token',
      SecretString: token,
    })
    .promise()
    .then(() => {
      return 'Success';
    })
    .catch(e => {
      throw e;
    });

  return res;
};

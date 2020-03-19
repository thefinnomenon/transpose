require('dotenv').config();
const debug = require('debug')('transpose-app');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
const port = 3000;

const DEBUG = process.env.NODE_ENV === 'development';

import Spotify from './providers/spotify';
import Apple from './providers/apple';

const providers = {
  spotify: new Spotify(),
  apple: new Apple(),
};

//////  REFRESH PROVIDER TOKEN
//  Generates & sets a new access token good for the given provider.
//////
app.get(
  '/:provider/refresh',
  asyncWrapper(async (req, res) => {
    await providers[req.params.provider].refreshToken();
    res.sendStatus(200);
  }),
);

//////  CONVERT LINK
//  Processes link and converts to other provider(s)
//  Example Links
//    https://open.spotify.com/track/2TpZlmChocrfeL5J6ed70t?si=1JWq_So9TM6XR2TmEsr_KA
//    https://music.apple.com/us/album/kingdom-come/1440881327?i=1440881974
//////
app.post(
  '/convert',
  asyncWrapper(async (req, res) => {
    if (!req.body.link || !req.body.destProviderID) {
      res.sendStatus(400);
    }

    const { link, destProviderID } = req.body;
    debug(`Convert link to ${destProviderID}: %o`, link);
    const srcProvider = providers[determineProviderFromLink(link)];
    const destProvider = providers[destProviderID];

    // Ensure fresh tokens
    if (DEBUG) {
      await srcProvider.refreshToken();
      await destProvider.refreshToken();
    }

    const elementInfo = srcProvider.extractElementInfo(link);
    const elementData = await srcProvider.getElementData(elementInfo);
    const transposedLink = await destProvider.search(elementInfo, elementData);

    res.send(transposedLink);
  }),
);

////// DETERMINE PROVIDER FROM LINK
//  Extracts the domain and compares to domains of supported providers.
//////
const determineProviderFromLink = link => {
  let providerId = '';
  const provider = link.match(/\.(\w+)\./)[1];

  switch (provider) {
    case 'spotify':
      providerId = 'spotify';
      break;
    case 'apple':
      providerId = 'apple';
      break;
    default:
      debug('Unsupported Provider');
      throw new Error('Unsupported Provider');
  }

  debug('Provider: %o', providerId);
  return providerId;
};

//////  RUN ASYNC WRAPPER
//  Async wrapper to catch errors without try/catch
//  https://zellwk.com/blog/async-await-express/
//////
function asyncWrapper(callback) {
  return function(req, res, next) {
    callback(req, res, next).catch(next);
  };
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

require('dotenv').config();
const debug = require('debug')('transpose-app');
const Sentry = require('@sentry/node');
Sentry.init({
  dsn: 'https://6b73ef7e94ec4946a1aa2fb75a880487@sentry.io/5183036',
  // release: `${process.env.APP_NAME}@${process.env.APP_VERSION}`,
});
const DynamoDB = require('aws-sdk/clients/dynamodb');
const SecretsManager = require('aws-sdk/clients/secretsmanager');
const nanoid = require('nanoid');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
const https = require('https');
const agent = new https.Agent({
  keepAlive: true,
});

const DEBUG = process.env.NODE_ENV === 'development';
console.log(
  `${process.env.npm_package_name}@${process.env.npm_package_version} (${
    process.env.NODE_ENV
  })`,
);
// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

const TRANSPOSE_LINK_BASE = process.env.URL_BASE;

// ID GENERATION
const NANOID_LENGTH = 10;

// DynamoDB
var dynamoDB = new DynamoDB.DocumentClient({
  httpOptions: {
    agent,
  },
  convertEmptyValues: true,
  apiVersion: '2012-08-10',
});

const TABLENAME = process.env.TRANSPOSE_TABLE;

// Secrets Manager
var secretMgr = new SecretsManager({
  region: 'us-east-1',
});

import Spotify from './providers/spotify';
import Apple from './providers/apple';

const providers = {
  spotify: new Spotify(),
  apple: new Apple(),
};

const types = {
  track: 'track',
  artist: 'artist',
  album: 'album',
};

//////  REFRESH PROVIDER TOKEN
//  Generates & sets a new access token good for the given provider.
//  POST https://transpose.com/refresh/:provider
//////
app.post(
  '/refresh/:provider',
  asyncWrapper(async (req, res) => {
    await providers[req.params.provider].refreshToken();
    res.sendStatus(200);
  }),
);

//////  GENERATE TRANSPOSE LINK
//  Processes @link and generates a Transpose link for it.
//  GET https://tranpose.com/transpose/:provider/:type/:id
//////
app.get(
  '/transpose/:provider/:type/:id',
  asyncWrapper(async (req, res) => {
    // Validate query parameters exist
    if (!req.params.provider || !req.params.type || !req.params.id) {
      res.sendStatus(400);
    }

    const { provider, type, id } = req.params;
    if (!(provider in providers)) {
      res.sendStatus(400);
    }
    if (!(type in types)) {
      res.sendStatus(400);
    }

    const linkID = `${provider}:${type}:${id}`;
    let transposeResults = {};
    let query = '';

    debug('Transpose: %o', linkID);

    // Check DB for linkID
    const linkRecord = await getLinkRecord(linkID);

    if (linkRecord) {
      debug('Found DB record. Skipping link processing.');
      transposeResults = linkRecord.content;
      query = linkRecord.terms;
    } else {
      debug('No DB record found. Processing link...');
      const processResults = await processLink(provider, type, id);
      transposeResults = processResults.transposeResults;
      query = processResults.query;
      // Format results
      transposeResults = formatResults(transposeResults);
      debug('Formatted Results: %O', transposeResults);
    }

    debug('Processing complete. Creating record.');

    // Generate ID
    const transposeID = nanoid(NANOID_LENGTH);
    debug('Generated ID: %o', transposeID);

    // Add record to DB
    await putTransposeRecord(transposeID, linkID, query, transposeResults);
    debug('Put Transpose record in DB');

    // Construct Transpose link and add to result
    const transposeLink = `${TRANSPOSE_LINK_BASE}/t/${transposeID}`;
    transposeResults.links.transpose = transposeLink;

    debug('Transpose Complete: %o', transposeLink);

    res.send(transposeResults);
  }),
);

//////  RESOLVE TRANSPOSE LINK
//  Retrieves info for Tranpose link with @id.
//  GET https://transpose.com/t/:id
//////
app.get(
  '/t/:id',
  asyncWrapper(async (req, res) => {
    if (!req.params.id) {
      res.sendStatus(400);
    }

    const { id } = req.params;
    debug('Resolving Transpose link with ID: %o', id);

    const record = await getTransposeRecord(id);

    if (!record.Item) {
      debug('[404] Failed to find Transpose link with ID: %o', id);
      res.sendStatus(404);
      return;
    }

    debug('Resolved Transpose link: %O', record.Item.content);

    res.send(record.Item.content);
  }),
);

app.get('/t/:id', (req, res) => {
  const id = req.params.id;
  return res.redirect(`../index.html?id=${id}`);
});

//////  QUERY DB FOR LINK RECORD
//  Queries for @linkId record
//////
const getLinkRecord = linkID => {
  return dynamoDB
    .query({
      TableName: TABLENAME,
      IndexName: 'link-index',
      KeyConditionExpression: 'linkID = :id',
      ExpressionAttributeValues: { ':id': linkID },
      ProjectionExpression: 'terms, content',
    })
    .promise()
    .then(response => {
      return response.Items[0];
    })
    .catch(error => {
      debug('Query Error: %O', error);
      throw new Error(error);
    });
};

//////  PUT TRANSPOSE RECORD IN DB
//  Put @transposeID record in DB.
//////
const putTransposeRecord = (transposeID, linkID, query, transposeResults) => {
  return dynamoDB
    .put({
      TableName: TABLENAME,
      Item: {
        id: transposeID,
        linkID,
        terms: query,
        content: transposeResults,
      },
    })
    .promise()
    .catch(error => {
      debug('Put Error: %O', error);
      throw new Error(error);
    });
};

//////  GET TRANSPOSE RECORD FROM DB
//  Get @transposeID record from DB.
//////
const getTransposeRecord = transposeID => {
  return dynamoDB
    .get({
      TableName: TABLENAME,
      Key: {
        id: transposeID,
      },
    })
    .promise()
    .catch(error => {
      debug('Get Error: %O', error);
      throw new Error(error);
    });
};

//////  PROCESS LINK
//  Get info for element and then search other providers
//////
const processLink = async (provider, type, id) => {
  if (DEBUG) {
    await Promise.all(Object.values(providers).map(p => p.refreshToken()));
  } else {
    await Promise.all(Object.values(providers).map(p => p.getToken(secretMgr)));
  }

  const element = await providers[provider].getElement(type, id);
  const convertedLinks = await Promise.all(
    Object.values(providers).map(p => p.search(type, element)),
  );

  if (Object.keys(convertedLinks).length < 2) {
    throw new Error('Item not found in any other provider.');
  }

  // Need to generate the query for storing in the DB
  const query = Object.values(element)
    .map(val => val)
    .join(' ');

  const transposeResults = {};
  convertedLinks.map(convertedLink => {
    transposeResults[convertedLink.provider] = convertedLink;
  });

  debug('Transpose Results: %O', transposeResults);
  return { query, transposeResults };
};

//////  FORMAT RESULTS
//  Returns an object with
//    - metadata: data from the first available provider (order of providers object)
//    - links: provider:links mappings for the element
//
//  Result
//  {
//    metadata: {
//      type: '',
//      images: ['','',''],  // large, medium, small
//      title: '',
//      artist: '',
//      album: '',
//    },
//    links: {
//      spotify: '',
//      apple: '',
//    }
//  }
//
//////
const formatResults = results => {
  let metadata;
  let links = {};
  for (const provider of Object.keys(providers)) {
    console.log(provider);
    if (!metadata && results[provider]) {
      const type = results[provider].type || '';
      const images = results[provider].images || '';
      const track = results[provider].track || '';
      const artist = results[provider].artist || '';
      const album = results[provider].album || '';
      metadata = { type, images, track, artist, album };
    }

    links[provider] = results[provider].link;
  }
  return { metadata, links };
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

app.use('/', express.static('public'));

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + '\n');
});

export default app;

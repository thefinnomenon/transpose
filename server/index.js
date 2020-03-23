require('dotenv').config();
const debug = require('debug')('transpose-app');
const DynamoDB = require('aws-sdk/clients/dynamodb');
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

const TRANSPOSE_LINK_BASE = 'https://transpose.com';
const port = 3000;

// ID GENERATION
const NANOID_LENGTH = 10;

// DynamoDB
var dynamoDB = new DynamoDB.DocumentClient({
  httpOptions: {
    agent,
  },
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
  apiVersion: '2012-08-10',
  //logger: DEBUG ? console : null,
});
const TABLENAME = 'transpose';

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
    }

    debug('Processing complete. Creating record.');

    // Generate ID
    const transposeID = nanoid(NANOID_LENGTH);
    debug('Generated ID: %o', transposeID);

    // Add record to DB
    await putTransposeRecord(transposeID, linkID, query, transposeResults);
    debug('Put Transpose record in DB');

    // Construct Transpose link and add to result object
    const transposeLink = `${TRANSPOSE_LINK_BASE}/${transposeID}`;
    transposeResults.transpose = {
      link: transposeLink,
    };

    debug('Transpose Complete: %o', transposeLink);

    res.send(transposeResults);
  }),
);

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
    .promise();
};

//////  PROCESS LINK
//  Get info for element and then search other providers
//////
const processLink = (provider, type, id) => {
  return new Promise(async (resolve, reject) => {
    if (DEBUG) {
      await Promise.all(Object.values(providers).map(p => p.refreshToken()));
    }

    const element = await providers[provider].getElement(type, id);
    const convertedLinks = await Promise.all(
      Object.values(providers).map(p => p.search(type, element)),
    );

    // Need to generate the query for storing in the DB
    const query = Object.values(element)
      .map(val => val)
      .join(' ');

    const transposeResults = {};
    convertedLinks.map(convertedLink => {
      transposeResults[convertedLink.provider] = convertedLink;
    });

    debug('Transpose Results: %O', transposeResults);
    resolve({ query, transposeResults });
  });
};

//////  RESOLVE TRANSPOSE LINK
//  Retrieves info for Tranpose link with @id.
//  GET https://transpose.com/:id
//////
app.get(
  '/:id',
  asyncWrapper(async (req, res) => {
    if (!req.params.id) {
      res.sendStatus(400);
    }
  }),
);

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

import Debug from 'debug';
import { Linking } from 'react-native';
import Share from 'react-native-share';
import Axios from 'axios';
//import ShareExtension from '../../ShareExtension';
Debug.enable('*');
const debug = Debug('transpose-utilities');

const baseURL = 'https://api.transposeapp.com';

export const SPOTIFY_URL =
  'https://open.spotify.com/track/2TpZlmChocrfeL5J6ed70t';
export const APPLE_URL =
  'https://music.apple.com/us/artist/jon-bellion/659289673';

export const axios = Axios.create({
  baseURL,
});

export type ElementType = 'track' | 'artist' | 'album';

export type MetadataType = {
  type: ElementType;
  images: string[];
  track: string;
  artist: string;
  album: string;
};

export type Element = {
  metadata: MetadataType;
  links: { [key: string]: string };
};

// const providers: {
//   [key: string]: { name: string; icon: string };
// } = {
//   spotify: {
//     name: 'Spotify',
//     icon: '',
//   },
//   apple: {
//     name: 'Apple Music',
//     icon: '',
//   },
// };

////// CHECK LINK AND EXTRACT INFO
//  Checks if input @link is actually a link and if so,
//  determines the provider, id, and type (if applicable)
//
//  Possible Link Formats
//  https://music.apple.com/{loc}/{type}/{title}/{id}?i={trackID}
//                      only exists for track links -^-----------^
//  https://api.spotify.com/v1/{type}/{id}
//  https://transposeapp.com/l/{id}
//  transpose://{id}
//////
export const checkLinkAndExtractInfo = (link: string) => {
  if (!link) {
    return;
  }

  const matches = link.match(/(.*):\/\/([0-9a-zA-Z\.\-]*)/);
  if (!matches) {
    return;
  }

  debug('Matches: %O', matches);

  // transpose://{id}
  if (matches[1] === 'transpose') {
    return { provider: 'transpose', type: 'transpose', id: matches[2] };
  }

  debug('Link: %o', link);

  let provider;
  if (link.includes('transposeapp.com')) {
    provider = 'transpose';
  }

  if (link.includes('spotify')) {
    provider = 'spotify';
  }

  if (link.includes('apple')) {
    provider = 'apple';
  }

  if (!provider) {
    return;
  }

  switch (provider) {
    case 'transpose':
      return parseTransposeLink(link);
    case 'spotify':
      return parseSpotifyLink(link);
    case 'apple':
      return parseAppleLink(link);
    default:
      debug('Unsupported Provider');
      throw new Error('Unsupported Provider');
  }
};

////// PARSE TRANSPOSE LINK
//  Parses @link to extract id.
//  https://transposeapp.com/l/{id}
//////
export const parseTransposeLink = (link: string) => {
  const id = link.replace('https://transposeapp.com/t/', '');

  const linkInfo = {
    provider: 'transpose',
    type: 'transpose',
    id,
  };

  debug('Link Info: %O', linkInfo);
  return linkInfo;
};

////// PARSE APPLE LINK
//  Parses @link to extract element type and id.
//  https://music.apple.com/{loc}/{type}/{title}/{id}?i={trackID}
//                      only exists for track links -^-----------^
//////
export const parseAppleLink = (link: string) => {
  // 1-storefont, 2-type, 3-name, 4-id, 5-ignore, 6-songID
  const match = link.match(
    /https:\/\/music\.apple\.com\/(\w+)\/(\w+)\/([a-zA-Z0-9\-]+)\/([a-zA-Z0-9\-\.]+)(\?i\=)?(\d+)?/,
  );

  if (!match) {
    return;
  }

  // If trackID exists then it is a track. We have to use this check instead of
  // the type because, for some reason, Apple links the track under the album type
  // and adds a track identifier as a parameter.
  const type = match[6] ? 'track' : match[2];
  const id = type === 'track' ? match[6] : match[4];

  const linkInfo = {
    provider: 'apple',
    storefront: match[1],
    type,
    id,
  };

  debug('Link Info: %O', linkInfo);
  return linkInfo;
};

////// PARSE SPOTIFY LINK
//  Parses @link to extract element type and id.
//  https://api.spotify.com/v1/{type}/{id}
//////
export const parseSpotifyLink = (link: string) => {
  // 1-type, 2-id
  const match = link.match(
    /https:\/\/open.spotify.com\/(?<type>\w+)\/(?<id>\w+)/,
  );

  if (!match) {
    return;
  }

  const linkInfo = {
    provider: 'spotify',
    type: match[1],
    id: match[2],
  };

  debug('Link Info: %O', linkInfo);
  return linkInfo;
};

////// RESOLVE TRANSPOSE
//  Takes Transpose link @id and returns the element metadata and links
//////
export const resolveTranspose = (id: string) => {
  debug('Resolving Transpose With ID: %o', id);
  return axios
    .get(`/t/${id}`)
    .then(async (response: { data: Element }) => {
      const element: Element = response.data;
      debug('Resolve Success: %o', element);
      return element;
    })
    .catch(error => {
      debug('Resolve Error: %o', error);
    });
};

////// TRANSPOSE
//  Takes the @provider, @type, @id, that was extracted from a shared
//  link and returns the element metadata as well as links for all providers
//////
type TransposeProps = {
  provider: string;
  type: string;
  id: string;
};
export const transpose = ({ provider, type, id }: TransposeProps) => {
  debug('Transposing %o, %o, %o', provider, type, id);
  return axios
    .get(`/transpose/${provider}/${type}/${id}`)
    .then(async response => {
      const element: Element = response.data;
      debug('Transpose Success: %o', element);
      return element;
    })
    .catch(error => {
      debug('Transpose Error: %o', error);
      return null;
    });
};

////// OPEN LINK
//  Tries to open another app using a deep link
//////
export const openLink = (link: string) => {
  Linking.canOpenURL(link)
    .then(supported => {
      if (!supported) {
        console.log("Can't handle url: " + link);
      } else {
        Linking.openURL(link);
      }
    })
    .catch(err => console.error('An error occurred', err));
};

////// OPEN SHARE
//  Opens the native share sheet to share @link and display @metadata
//////
export const openShare = (metadata: MetadataType, link: string) => {
  const message = formatShareMessage(metadata);
  Share.open({
    url: link,
    message,
    title: message,
    subject: `Checkout this ${metadata.type}!`,
  })
    .then(res => {
      debug(res);
      //ShareExtension.close();
    })
    .catch(err => {
      debug(err);
    });
};

////// FORMAT SHARE MESSAGE
//  Formats the share message according to @type
//////
const formatShareMessage = ({ type, album, artist, track }: MetadataType) => {
  switch (type) {
    case 'track':
      return `${artist} - ${track}`;
    case 'artist':
      return artist;
    case 'album':
      return `${artist} - ${album}`;
  }
};

import Debug from 'debug';
Debug.enable('*');
const debug = Debug('transpose-utilities');

////// DETERMINE PROVIDER FROM LINK
//  Extracts the domain and compares to domains of supported providers.
//////
export const determineProviderFromLink = (link: string) => {
  let providerId = '';
  const provider = link.match(/\.(\w+)\./);

  if (!provider) {
    debug('Unsupported Provider');
    throw new Error('Unsupported Provider');
  }

  switch (provider[1]) {
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

////// EXTRACT APPLE LINK INFO
//  Parses @link to extract element type and id.
//  https://music.apple.com/{loc}/{type}/{title}/{id}?i={song-id}
//                       only exists for song links -^-----------^
//////
export const extractAppleLinkInfo = (link: string) => {
  const { groups } = link.match(
    /https:\/\/music\.apple\.com\/(?<storefront>\w+)\/(?<type>\w+)\/(?<title>[a-zA-Z0-9\-]+)\/(?<id>[a-zA-Z0-9\-\.]+)(\?i\=)?(?<songID>\d+)?/,
  );

  // If songID exists then it is a song. We have to use this check instead of
  // the type because, for some reason, Apple links the song under the album type
  // and adds a song identifier as a parameter.
  const type = groups.songID ? 'song' : groups.type;
  const id = type === 'song' ? groups.songID : groups.id;

  const elementInfo = {
    storefront: groups.storefront,
    type,
    id,
  };

  debug('Link Info: type: %o, id: %o', elementInfo.type, elementInfo.id);
  return elementInfo;
};

////// EXTRACT SPOTIFY LINK INFO
//  Parses @link to extract element type and id.
//  https://api.spotify.com/v1/{type}/{id}
//////
export const extractSpotifyLinkInfo = (link: string) => {
  const {
    groups: { type, id },
  } = link.match(/https:\/\/open.spotify.com\/(?<type>\w+)\/(?<id>\w+)/);

  debug('Link Info: type: %o, id: %o', type, id);
  return { type, id };
};

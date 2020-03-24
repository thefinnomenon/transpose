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
    return;
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
//  https://music.apple.com/{loc}/{type}/{title}/{id}?i={trackID}
//                      only exists for track links -^-----------^
//////
export const extractAppleLinkInfo = (link: string) => {
  const { groups } = link.match(
    /https:\/\/music\.apple\.com\/(?<storefront>\w+)\/(?<type>\w+)\/(?<title>[a-zA-Z0-9\-]+)\/(?<id>[a-zA-Z0-9\-\.]+)(\?i\=)?(?<trackID>\d+)?/,
  );

  // If trackID exists then it is a track. We have to use this check instead of
  // the type because, for some reason, Apple links the track under the album type
  // and adds a track identifier as a parameter.
  const type = groups.trackID ? 'track' : groups.type;
  const id = type === 'track' ? groups.trackID : groups.id;

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

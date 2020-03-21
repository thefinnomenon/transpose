import Debug from 'debug';
Debug.enable('*');
const debug = Debug('transpose-utilities');

export const determineProviderFromLink = (link: string) => {
  let providerId = '';
  const provider = link.match(/\.(\w+)\./);

  if (!provider) {
    return null;
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
      return null;
  }

  debug('Provider: %o', providerId);
  return providerId;
};

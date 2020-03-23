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

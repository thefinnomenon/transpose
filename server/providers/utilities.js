const debug = require('debug')('transpose-utilities');

//////  STRIP EXTRA TITLE INFO
//  Removes extra information from title
//  When the Lions Come  (feat. Castro, Logic, & Blaque Keyz) -> When the Lions Come
//
//  Returns either null (if there wasn't extra info) or the new cleaned title.
//////
export const stripExtraTitleInfo = title => {
  const cleanTitle = title.replace(/\(.*\)/, '').replace(/\[.*\]/, '');

  if (cleanTitle === title) {
    return null;
  }

  debug('Cleaned title: %o -> %o', title, cleanTitle);

  return cleanTitle;
};

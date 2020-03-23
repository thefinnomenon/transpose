require('dotenv').config();
const debug = require('debug')('transpose-spotify');
import axios from 'axios';
import { stripExtraTitleInfo } from './utilities';

export default class Spotify {
  token = process.env.SPOTIFY_TOKEN;
  client_id = process.env.SPOTIFY_CLIENT_ID;
  client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  provider = 'spotify';
  searchUrl = 'https://api.spotify.com/v1/search';
  tokenUrl = 'https://accounts.spotify.com/api/token';

  //////  REFRESH TOKEN
  //  Generates & sets a Spotify Web API access token good for 1 hour (3600s).
  //  https://developer.spotify.com/documentation/general/guides/authorization-guide/#client-credentials-flow
  //////
  refreshToken() {
    // eslint-disable-next-line no-undef
    const buff = new Buffer.from(`${this.client_id}:${this.client_secret}`);
    const base64ClientData = buff.toString('base64');

    return axios({
      method: 'post',
      url: this.tokenUrl,
      headers: {
        Authorization: `Basic ${base64ClientData}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: 'grant_type=client_credentials',
    })
      .then(response => {
        this.token = response.data.access_token;
        debug('Token Refresh Successful: %o', this.token);
        return true;
      })
      .catch(error => {
        debug('Token Refresh Failed: \n%O', error);
        throw new Error('Token Refresh Failed');
      });
  }

  ////// EXTRACT ELEMENT INFO
  //  Parses @link to extract element type and id.
  //  https://api.spotify.com/v1/{type}/{id}
  //////
  extractElementInfo(link) {
    const {
      groups: { type, id },
    } = link.match(/https:\/\/open.spotify.com\/(?<type>\w+)\/(?<id>\w+)/);

    debug('Element Info: type: %o, id: %o', type, id);
    return { type, id };
  }

  //////  GET ELEMENT
  //  Get element of @type with @id and parse the response
  //  https://api.spotify.com/v1/{type}/{id}
  //////
  getElement(type, id) {
    return axios
      .get(`https://api.spotify.com/v1/${type}s/${id}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      .then(response => {
        switch (type) {
          case 'track':
            const trackData = {
              artist: response.data.artists[0].name,
              title: response.data.name,
            };
            debug('Element Data: %O', trackData);
            return trackData;
          case 'artist':
            const artistData = { artist: response.data.name };
            debug('Element Data: %O', artistData);
            return artistData;
          case 'album':
            const albumData = { album: response.data.name };
            debug('Element Data: %O', albumData);
            return albumData;
          case 'playlist':
            const playlistTracksData = response.data.tracks.items;
            const playlistTracks = playlistTracksData.map(data => ({
              artist: data.track.artists[0].name,
              title: data.track.name,
            }));
            const playlistData = {
              name: response.data.name,
              tracks: playlistTracks,
            };
            debug('Element Data: %O', playlistData);
            return playlistData;
          default:
            throw new Error('Type not implemented yet');
        }
      })
      .catch(error => {
        debug('Get Element Failed: \n%O', error);
        throw new Error('Get Element Failed');
      });
  }

  //////  SEARCH
  //  Query for results of @type with @query & @limit
  //  https://developer.spotify.com/documentation/web-api/reference/search/search/
  //////
  search(type, query, limit = 1) {
    type = type === 'song' ? 'track' : type;
    const q = this._formatQueryString(query);

    return axios
      .get(this.searchUrl, {
        headers: { Authorization: `Bearer ${this.token}` },
        params: {
          q,
          type,
          limit,
        },
        paramsSerializer: params => {
          console.log(params);
          return Object.entries(params)
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
        },
      })
      .then(async response => {
        switch (type) {
          case 'track':
            const tracks = response.data.tracks.items;
            // If search didn't resolve to a track check if title includes
            // additional info (e.g. ft., live, remix, etc.) and re-query
            // without this info
            if (!tracks[0]) {
              debug('Search resulted in 0 tracks with query: %s', query);
              const cleanTitle = stripExtraTitleInfo(query.title);
              if (cleanTitle) {
                debug('Requerying...');
                query.title = cleanTitle;
                return await this.search(type, query, limit);
              }
            }
            const trackInfo = this._getTrackInfo(tracks[0]);
            trackInfo.type = type;
            debug('Search Successful');
            return trackInfo;
          case 'artist':
            const artists = response.data.artists.items;
            const artistInfo = this._getArtistInfo(artists[0]);
            artistInfo.type = type;
            debug('Search Successful');
            return artistInfo;
          case 'album':
            const albums = response.data.albums.items;
            const albumInfo = this._getAlbumInfo(albums[0]);
            albumInfo.type = type;
            debug('Search Successful');
            return albumInfo;
          default:
            throw new Error('Type not implemented yet');
        }
      })
      .catch(function(error) {
        debug('Search Failed: \n%O', error);
        debug('> Query: %s, %s', q, type);
        return error.data;
      });
  }

  //////
  //  UTILITIES
  //////

  //////  FORMAT QUERY STRING
  //  Formats query string into appropriate format.
  //  q=album:gold%20artist:abba&track:cool%20song&type=track
  //////
  _formatQueryString(query) {
    // TODO: Figure out how to fix the url encoding of the colons so I can
    //       use this more specific search
    // const q = Object.entries(query)
    //   .map(([key, val]) => {
    //     if (key === 'title') {
    //       key = 'track';
    //     }
    //     return encodeURIComponent(`${key}:${val}`);
    //   })
    //   .join('&');

    const q = Object.values(query)
      .map(val => encodeURIComponent(val))
      .join('%20');

    debug('Query String: %s', q);
    return q;
  }

  //////  GET TRACK Info
  //  Extracts track info from get @track response
  //  https://developer.spotify.com/documentation/web-api/reference/tracks/get-track/
  //////
  _getTrackInfo(t) {
    const id = t.id;
    const images = this._simplifyImageArray(t.album.images);
    const track = t.name;
    const artist = t.artists[0].name;
    const link = t.external_urls.spotify;
    return { provider: this.provider, id, images, track, artist, link };
  }

  //////  GET ARTIST DETAILS
  //  Extracts artist details from get @artist response
  //  https://developer.spotify.com/documentation/web-api/reference/artists/get-artist/
  //////
  _getArtistInfo(a) {
    const id = a.id;
    const images = this._simplifyImageArray(a.images);
    const artist = a.name;
    const link = a.external_urls.spotify;
    return { provider: this.provider, id, images, artist, link };
  }

  //////  GET ALBUM DETAILS
  //  Extracts album details from get @album response
  //  https://developer.spotify.com/documentation/web-api/reference/albums/get-album/
  //////
  _getAlbumInfo(a) {
    const id = a.id;
    const images = this._simplifyImageArray(a.images);
    const album = a.name;
    const artist = a.artists[0].name;
    const link = a.external_urls.spotify;
    return { provider: this.provider, id, images, album, artist, link };
  }

  //////  SIMPLIFY IMAGE ARRAY
  //  Creates an array from @images with only the urls.
  //  [large, medium, small]
  //////
  _simplifyImageArray(images) {
    return images.map(image => image.url);
  }
}

require('dotenv').config();
const debug = require('debug')('transpose-apple');
import fs from 'fs';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { stripExtraTitleInfo } from './utilities';

export default class Apple {
  token = process.env.APPLEMUSIC_TOKEN;
  teamID = process.env.APPLEMUSIC_TEAMID;
  keyID = process.env.APPLEMUSIC_KEYID;
  provider = 'apple';
  searchUrl = 'https://api.music.apple.com/v1/catalog/us/search';
  tokenUrl = 'https://accounts.spotify.com/api/token';

  //////  REFRESH TOKEN
  //  Generates & sets an Apple Music API access token good for 1 hour (3600s).
  //  https://developer.apple.com/documentation/applemusicapi/getting_keys_and_creating_tokens
  //////
  refreshToken() {
    const privateKey = fs.readFileSync('MusicKitKey.p8');

    const token = jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '1h',
      issuer: this.teamID,
      keyid: this.keyID,
    });

    // TODO: Test that the token is valid?
    debug('Token Refresh Success: %o', token);
    this.token = token;
  }

  ////// EXTRACT ELEMENT INFO
  //  Parses @link to extract element type and id.
  //  https://music.apple.com/{loc}/{type}/{title}/{id}?i={song-id}
  //                       only exists for song links -^-----------^
  //////
  extractElementInfo(link) {
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

    debug('Element Info: %o', elementInfo);
    return elementInfo;
  }

  //////  GET ELEMENT
  //  Get element of @type with @id and parse the response
  //  https://api.music.apple.com/v1/catalog/us/{type}/{id}
  //////
  getElement(type, id) {
    return axios
      .get(
        `https://api.music.apple.com/v1/catalog/us/${
          type === 'track' ? 'song' : type
        }s/${id}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      )
      .then(response => {
        switch (type) {
          case 'track':
            const song = response.data.data[0].attributes;
            const songData = { artist: song.artistName, title: song.name };
            debug('Element Data: %O', songData);
            return songData;
          case 'artist':
            const artist = response.data.data[0].attributes;
            const artistData = { artist: artist.name };
            debug('Element Data: %O', artistData);
            return artistData;
          case 'album':
            const album = response.data.data[0].attributes;
            const albumData = { album: album.name };
            debug('Element Data: %O', albumData);
            return albumData;
          case 'playlist':
            const playlist = response.data.data[0];
            debug('Response: \n%O', playlist);
            const playlistTracksData = playlist.relationships.tracks.data;
            const playlistTracks = playlistTracksData.map(data => ({
              artist: data.attributes.artistName,
              title: data.attributes.name,
            }));
            const playlistData = {
              name: playlist.attributes.name,
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
  //  https://developer.apple.com/documentation/applemusicapi/search_for_catalog_resources
  //////
  search(type, query, limit = 1) {
    const term = this._formatQueryString(query);
    return axios
      .get('https://api.music.apple.com/v1/catalog/us/search', {
        headers: { Authorization: `Bearer ${this.token}` },
        params: {
          term,
          types: `${type === 'track' ? 'song' : type}s`,
          limit: limit,
        },
      })
      .then(async response => {
        switch (type) {
          case 'track':
            const tracks = response.data.results.songs.data;
            // If search didn't resolve to a song, check if title includes
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
            const artists = response.data.results.artists.data;
            const artistInfo = await this._getArtistInfo(artists[0]);
            artistInfo.type = type;
            debug('Search Successful');
            return artistInfo;
          case 'album':
            const albums = response.data.results.albums.data;
            const albumInfo = this._getAlbumInfo(albums[0]);
            albumInfo.type = type;
            debug('Search Successful');
            return albumInfo;
          default:
            throw new Error('Type not implemented yet');
        }
      })
      .catch(error => {
        debug('Search Failed: %O', error);
        debug('> Query: %s, %s', term, type);
        throw new Error('Search Failed');
      });
  }

  //////
  //  UTILITIES
  //////

  //////  FORMAT QUERY STRING
  //  Formats query string into appropriate format.
  //
  //////
  _formatQueryString(query) {
    const q = Object.values(query)
      .map(val => val)
      .join(' ');

    debug('Query String: %s', q);
    return q;
  }

  //////  GET TRACK DETAILS
  //  Extracts track details from get @track response
  //  https://developer.apple.com/documentation/applemusicapi/get_a_catalog_song
  //////
  _getTrackInfo(t) {
    const id = t.id;
    const images = this._generateImagesArray(t.attributes.artwork.url);
    const track = t.attributes.name;
    const artist = t.attributes.artistName;
    const link = t.attributes.url;
    return { provider: this.provider, id, images, track, artist, link };
  }

  //////  GET ARTIST DETAILS
  //  Extracts artist details from get @artist response
  //  https://developer.apple.com/documentation/applemusicapi/get_a_catalog_artist
  //////
  async _getArtistInfo(a) {
    const id = a.id;
    const artist = a.attributes.name;
    const link = a.attributes.url;
    const imageUrl = await this._getArtistImage(link);
    const images = this._generateImagesArray(imageUrl);
    return { provider: this.provider, id, images, artist, link };
  }

  //////  GET ALBUM DETAILS
  //  Extracts album details from get @album response
  //  https://developer.apple.com/documentation/applemusicapi/get_a_catalog_album
  //////
  _getAlbumInfo(a) {
    const id = a.id;
    const images = this._generateImagesArray(a.attributes.artwork.url);
    const album = a.attributes.name;
    const artist = a.attributes.artistName;
    const link = a.attributes.url;
    return { provider: this.provider, id, images, album, artist, link };
  }

  //////  GET ARTIST IMAGE
  //  Apple doesn't include the artist image in the API response for some reason so instead,
  //  we can load the artist's page and grab the image from there. Not pretty but it works ;)
  //  https://gist.github.com/karlding/954388cb6cd2665d4f3a
  //////
  _getArtistImage(artistUrl) {
    return axios
      .get(artistUrl)
      .then(response => {
        const html = response.data;
        const ogImage = html.match(
          /<meta property=\"og:image\" content=\"(.*png)\"/,
        )[1];
        return ogImage.replace(/[\d]+x[\d]+/, '{w}x{h}');
      })
      .catch(error => {
        debug('Get Artist Image Failed: %O', error);
      });
  }

  //////  GENERATE IMAGES ARRAY
  //  Uses the Apple Music image generation link to make an array of images with the
  //  same sizes provided by Spotify (640x640, 300x300, 64x64).
  //////
  _generateImagesArray(imageUrl) {
    return [
      imageUrl.replace(/{(.*?)}x{(.*?)}/, '640x640'),
      imageUrl.replace(/{(.*?)}x{(.*?)}/, '300x300'),
      imageUrl.replace(/{(.*?)}x{(.*?)}/, '64x64'),
    ];
  }
}

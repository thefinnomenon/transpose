import React, { useState } from 'react';
import Debug from 'debug';
Debug.enable('*');
const debug = Debug('Test');
import Axios from 'axios';
import {
  StatusBar,
  SafeAreaView,
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import ElementDisplay from './src/components/ElementDisplay';
import ProviderButton from './src/components/ProviderButton';

const baseURL = 'http://f1cf0b07.ngrok.io';

enum State {
  WAITING,
  LOADING,
  DONE,
}

const axios = Axios.create({
  baseURL,
});

const App = () => {
  const [link, setLink] = useState('');
  const [state, setState] = useState(State.DONE);
  const [transposedLinks, setTransposedLinks] = useState<{
    [key: string]: string;
  }>({});

  const transpose = (link: string) => {
    const provider = determineProviderFromLink(link);

    if (!provider) {
      return;
    }

    let destProvider = '';

    if (provider === 'spotify') {
      destProvider = 'apple';
    } else {
      destProvider = 'spotify';
    }

    debug('Transposing link from %o to %o: \n%o', provider, destProvider, link);
    setState(State.LOADING);

    axios
      .post('/convert', {
        link,
        destProviderID: destProvider,
      })
      .then(function(response) {
        debug('Transpose Success: %o', response.data);
        const transposedLink = response.data;
        setTransposedLinks({
          ...transposedLinks,
          [destProvider]: transposedLink,
        });
        setLink('');
        setState(State.DONE);
        openLink(response.data);
      })
      .catch(function(error) {
        debug('Transpose Error: %o', error);
        setState(State.WAITING);
      });
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.topContent}>
            {state === State.DONE && (
              <ElementDisplay title="Kingdom Come" subtitle="Jon Bellion" />
            )}
            {state === State.WAITING && (
              <TextInput
                style={styles.linkInput}
                placeholder="Paste link here to be Transposed!"
                placeholderTextColor="#808080"
                onChangeText={text => {
                  setLink(text);
                  transpose(text);
                }}
                value={link}
              />
            )}
            {state === State.LOADING && (
              <ActivityIndicator size="large" color="#101010" />
            )}
          </View>
          <View style={styles.buttons}>
            <ProviderButton
              title="Spotify"
              onPress={() => console.log('Spotify Link')}
            />
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const openLink = (link: string) => {
  Linking.canOpenURL(link)
    .then(supported => {
      if (!supported) {
        console.log("Can't handle url: " + link);
      } else {
        return Linking.openURL(link);
      }
    })
    .catch(err => console.error('An error occurred', err));
};

const determineProviderFromLink = (link: string) => {
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

const Button = ({ title, onPress }) => (
  <TouchableOpacity style={styles.button} onPress={() => onPress()}>
    <Text style={styles.buttonTitle}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topContent: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '15%',
  },
  linkInput: {
    height: 40,
    width: '80%',
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    color: '#101010',
  },
  buttons: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '80%',
  },
  button: {
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    borderRadius: 10,
    width: '80%',
    height: 40,
    margin: 20,
  },
  buttonTitle: {
    textAlign: 'center',
    fontSize: 20,
    color: 'white',
  },
});

export default App;

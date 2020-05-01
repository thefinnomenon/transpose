import React from 'react';
const { name: APP_NAME, version: APP_VERSION } = require('../../package.json');
import {
  StyleSheet,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  Text,
} from 'react-native';
import normalize from '../utlities/responsive';
import Icon from 'react-native-vector-icons/EvilIcons';

type Props = {
  inputText: string;
  handleOnChangeText(text: string): void;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const LinkInput = ({ inputText, handleOnChangeText }: Props) => {
  const handleQuestionPress = () => {
    Alert.alert(
      'How To Use Tranpose',
      `Transpose takes your music share link and creates a universal Transpose link for you to share. When someone clicks this Transpose link, it will open Transpose on their phone and display the share information and buttons to access the item in the available providers.

Current supported providers:
Spotify
Apple Music
        
Current supported share items:
Track
Artist
Album

Tip: Instead of entering the share link here, you can save time by finding the Transpose app in the Share Sheet in your music provider and sharing from there.`,
      [{ text: 'OK', onPress: () => {} }],
    );
  };

  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        source={require('../../resources/logo_large.png')}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Paste link here to be Transposed"
          placeholderTextColor="#808080"
          onChangeText={text => handleOnChangeText(text)}
          value={inputText}
        />
      </View>
      <TouchableOpacity
        style={styles.questionMark}
        onPress={() => handleQuestionPress()}>
        <Icon name="question" size={normalize(45)} color="#080808" />
      </TouchableOpacity>
      <Text style={styles.version}>{`v${APP_VERSION}`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    height: normalize(50, 50),
    width: normalize(300),
    borderBottomColor: 'black',
    borderBottomWidth: normalize(1, 1),
    fontSize: normalize(18),
    textAlign: 'center',
    color: '#101010',
  },
  //664 × 273
  logo: {
    flex: 1,
    width: normalize(200),
    resizeMode: 'contain',
  },
  spacer: {
    flex: 1,
  },
  questionMark: {
    position: 'absolute',
    right: 0,
    bottom: 20,
  },
  version: {
    position: 'absolute',
    fontSize: normalize(14),
    color: '#808080',
    bottom: 20,
  },
});

LinkInput.defaultProps = defaultProps;

export default LinkInput;

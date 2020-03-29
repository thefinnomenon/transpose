import React from 'react';
import { StyleSheet, View, Image, TextInput } from 'react-native';
import normalize from '../utlities/responsive';

type Props = {
  inputText: string;
  handleOnChangeText(text: string): void;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const LinkInput = ({ inputText, handleOnChangeText }: Props) => (
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
  </View>
);

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
});

LinkInput.defaultProps = defaultProps;

export default LinkInput;

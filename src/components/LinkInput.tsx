import React from 'react';
import { StyleSheet, View, Image, TextInput } from 'react-native';

type Props = {
  inputText: string;
  handleOnChangeText(text: string): void;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const LinkInput = ({ inputText, handleOnChangeText }: Props) => (
  <View style={styles.container}>
    <View style={styles.spacer} />
    <View style={styles.logoContainer}>
      <Image
        style={styles.logo}
        source={require('../../resources/logo_small.png')}
      />
    </View>
    <View style={styles.spacer} />
    <View style={styles.linkInputContainer}>
      <TextInput
        style={styles.linkInput}
        placeholder="Paste link here to be Transposed!"
        placeholderTextColor="#808080"
        onChangeText={text => handleOnChangeText(text)}
        value={inputText}
      />
    </View>
    <View style={styles.spacer} />
    <View style={styles.spacer} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkInputContainer: {
    flex: 2,
  },
  linkInput: {
    height: 40,
    width: 300, //'80%',
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    textAlign: 'center',
    color: '#101010',
  },
  logoContainer: {
    flex: 2,
  },
  logo: {
    height: 160,
    width: 150,
    resizeMode: 'stretch',
  },
  spacer: {
    flex: 1,
  },
});

LinkInput.defaultProps = defaultProps;

export default LinkInput;

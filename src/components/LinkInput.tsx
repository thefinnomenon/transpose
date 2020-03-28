import React from 'react';
import { StyleSheet, TextInput } from 'react-native';

type Props = {
  inputText: string;
  handleOnChangeText(text: string): void;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const LinkInput = ({ inputText, handleOnChangeText }: Props) => (
  <TextInput
    style={styles.linkInput}
    placeholder="Paste link here to be Transposed!"
    placeholderTextColor="#808080"
    onChangeText={text => handleOnChangeText(text)}
    value={inputText}
  />
);

const styles = StyleSheet.create({
  linkInput: {
    height: 40,
    width: 300, //'80%',
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    textAlign: 'center',
    color: '#101010',
  },
});

LinkInput.defaultProps = defaultProps;

export default LinkInput;

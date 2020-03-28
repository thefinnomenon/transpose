import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/EvilIcons';

type Props = {
  title: string;
  handlePress(): void;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const Button = ({ title, handlePress }: Props) => (
  <TouchableOpacity style={styles.button} onPress={() => handlePress()}>
    <Icon
      name={Platform.OS === 'ios' ? 'share-apple' : 'share-google'}
      size={40}
      color="#fff"
    />
    <Text>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRightWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#808080',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 2,
    borderRadius: 10,
  },
  title: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 24,
  },
});

Button.defaultProps = defaultProps;

export default Button;

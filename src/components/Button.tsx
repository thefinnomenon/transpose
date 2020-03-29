import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import normalize from '../utlities/responsive';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  icon: JSX.Element;
  handlePress(): void;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const Button = ({ icon, handlePress }: Props) => (
  <TouchableOpacity style={styles.button} onPress={() => handlePress()}>
    <LinearGradient style={styles.gradient} colors={['#D550FF', '#7402FF']}>
      {icon}
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    flex: 1,
    margin: normalize(4),

    backgroundColor: '#808080',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
    borderRadius: 10,
  },
  gradient: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
});

Button.defaultProps = defaultProps;

export default Button;

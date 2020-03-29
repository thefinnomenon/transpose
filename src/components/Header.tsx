import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import normalize from '../utlities/responsive';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = {
  showBackButton: boolean;
  showCloseButton: boolean;
  onBackPress(): void;
  onClosePress(): void;
} & typeof defaultProps;

const defaultProps = Object.freeze({
  showBackButton: false,
  showCloseButton: false,
  onBackPress: () => {},
  onClosePress: () => {},
});

export const Header = ({
  onBackPress,
  showBackButton,
  onClosePress,
  showCloseButton,
}: Props) => (
  <View style={styles.container}>
    {showBackButton && (
      <TouchableOpacity style={styles.backButton} onPress={() => onBackPress()}>
        <Icon name="ios-arrow-back" size={normalize(40)} color="#080808" />
      </TouchableOpacity>
    )}
    {showCloseButton && (
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => onClosePress()}>
        <Icon name="md-close" size={normalize(40)} color="#080808" />
      </TouchableOpacity>
    )}
    <Image
      style={styles.logo}
      source={require('../../resources/logo_small.png')}
    />
    <View style={styles.backButton} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: normalize(8),
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: normalize(20),
  },
  logo: {
    height: normalize(40),
    width: normalize(89),
    resizeMode: 'contain',
  },
});

Header.defaultProps = defaultProps;

export default Header;

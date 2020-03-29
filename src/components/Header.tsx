import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
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
        <Icon name="ios-arrow-back" size={40} color="#080808" />
      </TouchableOpacity>
    )}
    {showCloseButton && (
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => onClosePress()}>
        <Icon name="md-close" size={40} color="#080808" />
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
    marginBottom: 30,
    height: 60,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 4,
    width: 60,
    height: 40,
  },
  logo: {
    height: 60,
    width: 50,
    resizeMode: 'stretch',
  },
});

Header.defaultProps = defaultProps;

export default Header;

import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = {
  showBackButton: boolean;
  showCloseButton: boolean;
  onBackPress(): void;
  onClosePress(): void;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

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
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 10,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
  },
});

Header.defaultProps = defaultProps;

export default Header;

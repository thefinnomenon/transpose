import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon2 from 'react-native-vector-icons/Octicons';

type Props = {
  showBackButton: boolean;
  onBackPress(): void;
  onSettingsPress(): void;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const Header = ({
  onBackPress,
  onSettingsPress,
  showBackButton,
}: Props) => (
  <View style={styles.container}>
    {showBackButton && (
      <TouchableOpacity style={styles.backButton} onPress={() => onBackPress()}>
        <Icon name="ios-arrow-back" size={40} color="#080808" />
      </TouchableOpacity>
    )}
    <TouchableOpacity
      style={styles.settingsButton}
      onPress={() => onSettingsPress()}>
      <Icon2 name="settings" size={40} color="#080808" />
    </TouchableOpacity>
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
  settingsButton: {
    width: 40,
    height: 40,
    marginLeft: 'auto',
  },
});

Header.defaultProps = defaultProps;

export default Header;

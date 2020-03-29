import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

export const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        source={require('../../resources/logo_sq.png')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '80%',
    resizeMode: 'contain',
  },
});

export default SplashScreen;

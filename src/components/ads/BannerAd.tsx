import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

let BannerAdComponent: any = null;
let BannerAdSize: any = {};
let TestIds: any = {};

try {
  // Tentar importar o módulo nativo
  const AdMob = require('react-native-google-mobile-ads');
  BannerAdComponent = AdMob.BannerAd;
  BannerAdSize = AdMob.BannerAdSize;
  TestIds = AdMob.TestIds;
} catch (e) {
  // Módulo não disponível (Expo Go)
}

// IDs Reais (Produção)
const adUnitId = __DEV__
  ? (TestIds?.ADAPTIVE_BANNER || 'test')
  : Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716', // Substituir por ID real do AdMob
    android: 'ca-app-pub-4979675212971833/4003277070',
    default: TestIds?.ADAPTIVE_BANNER || 'test',
  });

interface Props {
  containerStyle?: any;
}

export const BannerAd: React.FC<Props> = ({ containerStyle }) => {
  // Se o componente nativo não existir (Expo Go), mostra um placeholder discreto
  if (!BannerAdComponent) {
    if (!__DEV__) return null; // Em produção, se falhar por algum motivo, não mostra nada
    
    return (
      <View style={[styles.container, styles.placeholder, containerStyle]}>
        <Text style={styles.placeholderText}>Anúncio (Disponível apenas no Build Real)</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <BannerAdComponent
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error: any) => {
          console.log('❌ Ad failed to load: ', error.message);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  placeholder: {
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    marginVertical: 10,
  },
  placeholderText: {
    fontSize: 10,
    color: '#999',
  }
});

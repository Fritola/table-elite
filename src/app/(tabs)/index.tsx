import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

import { useFavorites } from '@/hooks/useFavorites';
import { Star, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BannerAd } from '@/components/ads/BannerAd';

interface Player {
  id: string;
  name: string;
  rank: number;
  country_code: string;
  points: number;
  image_url: string | null;
}

export default function RankingsScreen() {
  const [gender, setGender] = React.useState<'male' | 'female'>('male');
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();

  const { data: players, isLoading } = useQuery({
    queryKey: ['rankings', gender],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('gender', gender)
        .order('rank', { ascending: true })
        .limit(50);
      
      if (error) throw error;
      return data as Player[];
    },
  });

  const TabButton = ({ type, label }: { type: 'male' | 'female', label: string }) => (
    <TouchableOpacity 
      style={[
        styles.tab, 
        gender === type && { backgroundColor: colors.primary, borderColor: colors.primary }
      ]}
      onPress={() => setGender(type)}
    >
      <Text style={[
        styles.tabText, 
        { color: gender === type ? '#fff' : colors.textMuted }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: Player }) => {
    const isFav = isFavorite(item.id);

    return (
      <TouchableOpacity 
        style={[styles.item, { borderBottomColor: colors.border }]}
        onPress={() => router.push(`/player/${item.id}`)}
      >
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: colors.primary }]}>{item.rank}</Text>
        </View>

        <View style={[styles.imageContainer, { backgroundColor: colors.surface }]}>
          {item.image_url ? (
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.playerImage} 
              contentFit="cover"
              contentPosition="top center"
              transition={300}
              cachePolicy="disk"
            />
          ) : (
            <User size={24} color={colors.textMuted} />
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.nameText, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.countryText, { color: colors.textMuted }]}>{item.country_code}</Text>
        </View>
        <View style={styles.pointsContainer}>
          <Text style={[styles.pointsText, { color: colors.text }]}>{item.points}</Text>
          <Text style={[styles.pointsLabel, { color: colors.textMuted }]}>{t('rankings.points')}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => toggleFavorite(item.id)} 
          style={styles.favButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Star 
            size={22} 
            color={isFav ? '#FFD700' : colors.border} 
            fill={isFav ? '#FFD700' : 'transparent'} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('rankings.title')}</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TabButton type="male" label={t('rankings.men')} />
        <TabButton type="female" label={t('rankings.women')} />
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlashList<Player>
          data={players}
          renderItem={renderItem}
          // @ts-ignore: estimatedItemSize error due to React 19 peer deps conflict
          estimatedItemSize={80}
          contentContainerStyle={styles.listContent}
        />
      )}
      <BannerAd />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankContainer: {
    width: 40,
  },
  rankText: {
    fontSize: 20,
    fontWeight: '700',
  },
  imageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerImage: {
    width: 44,
    height: 44,
    resizeMode: 'cover',
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600',
  },
  countryText: {
    fontSize: 14,
    marginTop: 2,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '700',
  },
  pointsLabel: {
    fontSize: 12,
  },
  favButton: {
    marginLeft: 15,
    padding: 5,
  },
});

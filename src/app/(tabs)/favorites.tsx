import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { Star, User } from 'lucide-react-native';
import { useFavorites } from '@/hooks/useFavorites';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { FlashList } from '@shopify/flash-list';

interface Player {
  id: string;
  name: string;
  rank: number;
  country_code: string;
  points: number;
  image_url: string | null;
}

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { favorites, toggleFavorite } = useFavorites();

  const { data: favoritePlayers, isLoading } = useQuery({
    queryKey: ['favorite-players', favorites],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .in('id', favorites)
        .order('rank', { ascending: true });
      
      if (error) throw error;
      return data as Player[];
    },
    enabled: favorites.length > 0,
  });

  const renderItem = ({ item }: { item: Player }) => (
    <View style={[styles.item, { borderBottomColor: colors.border }]}>
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
      <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.favButton}>
        <Star 
          size={22} 
          color={'#FFD700'} 
          fill={'#FFD700'} 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('tabs.favorites')}
        </Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Star size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyText, { color: colors.text }]}>{t('favorites.empty_title')}</Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
            {t('favorites.empty_subtitle')}
          </Text>
        </View>
      ) : isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlashList<Player>
          data={favoritePlayers}
          renderItem={renderItem}
          // @ts-ignore: estimatedItemSize error due to React 19 peer deps conflict
          estimatedItemSize={80}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
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

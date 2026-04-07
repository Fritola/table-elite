import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '@/hooks/useFavorites';
import { ChevronLeft, Star, Info, Award, Crosshair } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PlayerDetails extends Player {
  bio_pt: string;
  bio_en: string;
  hand: string;
  grip: string;
  playing_style: string;
  equipment: string;
}

interface Player {
  id: string;
  name: string;
  rank: number;
  country_code: string;
  points: number;
  image_url: string;
}

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();

  const { data: player, isLoading } = useQuery({
    queryKey: ['player', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as PlayerDetails;
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!player) return null;

  const isFav = isFavorite(player.id);
  const bio = i18n.language === 'pt' ? player.bio_pt : player.bio_en;

  const localizeValue = (key: string, value: string) => {
    if (!value) return t('player_detail.none');
    // Map DB strings into translation keys (e.g., "right_handed")
    const translation = t(`player_detail.${value}`);
    // If translation key doesn't exist, return original value
    return translation.includes('player_detail.') ? value : translation;
  };

  const StatCard = ({ icon: Icon, label, value }: any) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <Icon size={20} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView bounces={false}>
        <View style={[styles.headerImageContainer, { backgroundColor: colors.surface }]}>
          <Image 
            source={{ uri: player.image_url || 'https://images.unsplash.com/photo-1534158914592-062992fbe900?q=80&w=2099&auto=format&fit=crop' }} 
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            contentPosition="center"
            transition={400}
            cachePolicy="disk"
          />
          <View style={styles.overlay}>
            <SafeAreaView style={styles.headerButtons}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                <ChevronLeft color="#fff" size={28} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => toggleFavorite(player.id)}>
                <Star 
                  color={isFav ? '#FFD700' : '#fff'} 
                  fill={isFav ? '#FFD700' : 'transparent'} 
                  size={28} 
                />
              </TouchableOpacity>
            </SafeAreaView>
            <View style={styles.bottomOverlay} />
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <View style={styles.titleSection}>
            <Text style={[styles.name, { color: colors.text }]}>{player.name}</Text>
            <View style={styles.countryBadge}>
              <Text style={styles.countryText}>{player.country_code}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatCard icon={Award} label={t('player_detail.rank')} value={`#${player.rank}`} />
            <StatCard icon={Info} label={t('player_detail.points')} value={player.points} />
            <StatCard icon={Crosshair} label={t('player_detail.hand')} value={localizeValue('hand', player.hand)} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('player_detail.bio')}</Text>
            <Text style={[styles.bioText, { color: colors.text }]}>
              {bio || t('player_detail.none')}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('player_detail.technical')}</Text>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('player_detail.hand')}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{localizeValue('hand', player.hand)}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('player_detail.grip')}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{player.grip || t('player_detail.none')}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('player_detail.style')}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{localizeValue('style', player.playing_style)}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('player_detail.equipment')}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{player.equipment || t('player_detail.none')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImageContainer: {
    width: '100%',
    height: 350,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'space-between',
  },
  bottomOverlay: {
    height: 100,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)', // Subtle tint, could use Gradient if available
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    marginTop: -30,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 30,
    minHeight: 500,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    flex: 1,
  },
  countryBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  countryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});

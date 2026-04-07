import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { ExternalLink, Video, User } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

interface Match {
  id: string;
  tournament: string;
  scheduled_at: string;
  status: string;
  round_name: string;
  player1_name: string;
  player2_name: string;
  channel_url: string;
  player1?: { name: string, image_url: string | null };
  player2?: { name: string, image_url: string | null };
}

export default function ScheduleScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          player1:player1_id (name, image_url),
          player2:player2_id (name, image_url)
        `)
        .order('scheduled_at', { ascending: true });
      
      if (error) throw error;
      return data as unknown as Match[];
    },
  });

  const handleOpenLink = (link: string) => {
    if (!link) return;
    Linking.openURL(link).catch(err => console.error("Couldn't load page", err));
  };

  const PlayerSlot = ({ name, image_url }: { name: string, image_url?: string | null }) => (
    <View style={styles.playerSlot}>
      <View style={[styles.miniAvatar, { backgroundColor: colors.surface }]}>
        {image_url ? (
          <Image 
            source={{ uri: image_url }} 
            style={styles.avatarImage} 
            contentFit="cover"
            contentPosition="top center"
            transition={300}
            cachePolicy="disk"
          />
        ) : (
          <User size={16} color={colors.textMuted} />
        )}
      </View>
      <Text style={[styles.playerSlotText, { color: colors.text }]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: Match }) => {
    const date = new Date(item.scheduled_at);
    const dateString = date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const p1_name = item.player1?.name || item.player1_name;
    const p1_img = item.player1?.image_url;
    const p2_name = item.player2?.name || item.player2_name;
    const p2_img = item.player2?.image_url;

    return (
      <View style={[styles.matchCard, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
        <View style={styles.matchHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tournamentText, { color: colors.primary }]} numberOfLines={1}>
              {item.tournament}
            </Text>
            <Text style={[styles.roundText, { color: colors.textMuted }]}>{item.round_name}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={[styles.dateText, { color: colors.text }]}>{dateString}</Text>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>{timeString}</Text>
          </View>
        </View>

        <View style={styles.matchPlayersContainer}>
          <PlayerSlot name={p1_name} image_url={p1_img} />
          <Text style={[styles.vsText, { color: colors.textMuted }]}>vs</Text>
          <PlayerSlot name={p2_name} image_url={p2_img} />
        </View>

      <View style={styles.watchContainer}>
          <View style={styles.statusBadge}>
            <View style={[styles.dot, { backgroundColor: item.status === 'live' ? '#ff3b30' : '#4cd964' }]} />
            <Text style={[styles.statusText, { color: colors.textMuted }]}>
              {item.status === 'live' ? t('schedule.live') : t('schedule.scheduled')}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.watchButton, { backgroundColor: colors.primary + '15' }]} 
            onPress={() => handleOpenLink(item.channel_url || 'https://worldtabletennis.com/live-scores')}
          >
            <Text style={[styles.watchButtonText, { color: colors.primary }]}>{t('schedule.details')}</Text>
            <ExternalLink size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('schedule.title')}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={matches}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {t('schedule.empty')}
            </Text>
          }
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
  listContent: {
    padding: 20,
  },
  matchCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tournamentText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  roundText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchPlayersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    gap: 10,
  },
  playerSlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  avatarImage: {
    width: 32,
    height: 32,
    resizeMode: 'cover',
  },
  playerSlotText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    width: 24,
    textAlign: 'center',
  },
  watchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  watchButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    opacity: 0.6,
  },
});

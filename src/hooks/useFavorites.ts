import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const LOCAL_FAVORITES_KEY = '@TTGuide/local_favorites';

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localFavorites, setLocalFavorites] = useState<string[]>([]);

  // Load local favorites on mount
  useEffect(() => {
    loadLocalFavorites();
  }, []);

  const loadLocalFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(LOCAL_FAVORITES_KEY);
      if (stored) setLocalFavorites(JSON.parse(stored));
    } catch (e) {
      console.error('Error loading local favorites', e);
    }
  };

  const saveLocalFavorites = async (ids: string[]) => {
    try {
      await AsyncStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(ids));
      setLocalFavorites(ids);
    } catch (e) {
      console.error('Error saving local favorites', e);
    }
  };

  // Remote Favorites Query
  const { data: remoteFavorites = [] } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_favorites')
        .select('player_id');
      
      if (error) throw error;
      return data.map(f => f.player_id);
    },
    enabled: !!user,
  });

  // Current Favorites (Híbrido)
  const favorites = user ? remoteFavorites : localFavorites;

  const toggleFavorite = async (playerId: string) => {
    const isFav = favorites.includes(playerId);

    if (user) {
      // Remote Toggle
      if (isFav) {
        await supabase
          .from('user_favorites')
          .delete()
          .match({ user_id: user.id, player_id: playerId });
      } else {
        await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, player_id: playerId });
      }
      queryClient.invalidateQueries({ queryKey: ['favorites', user.id] });
    } else {
      // Local Toggle
      const newFavs = isFav 
        ? localFavorites.filter(id => id !== playerId)
        : [...localFavorites, playerId];
      await saveLocalFavorites(newFavs);
    }
  };

  return {
    favorites,
    isFavorite: (id: string) => favorites.includes(id),
    toggleFavorite,
  };
}

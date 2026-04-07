import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { Globe, Moon, ChevronRight, LogIn, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const changeLanguage = () => {
    const nextLng = i18n.language === 'en' ? 'pt' : 'en';
    i18n.changeLanguage(nextLng);
  };

  const handleAccountAction = () => {
    if (user) {
      signOut();
    } else {
      router.push('/auth/login');
    }
  };

  const SettingRow = ({ icon: Icon, label, value, onPress, hasToggle }: any) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={hasToggle}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Icon size={20} color={colors.primary} />
        </View>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={[styles.rowValue, { color: colors.textMuted }]}>{value}</Text>}
        {hasToggle ? (
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: colors.primary }}
          />
        ) : (
          <ChevronRight size={20} color={colors.border} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t('settings.theme').toUpperCase()}</Text>
          <SettingRow
            icon={Moon}
            label={t('settings.dark_mode')}
            hasToggle
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t('settings.language').toUpperCase()}</Text>
          <SettingRow
            icon={Globe}
            label={t('settings.language')}
            value={i18n.language === 'en' ? 'English' : 'Português'}
            onPress={changeLanguage}
          />
        </View>

        {/* <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t('settings.account').toUpperCase()}</Text>
          <SettingRow 
            icon={user ? User : LogIn} 
            label={user ? user.email : t('settings.login')} 
            value={user ? t('settings.logout') : ''}
            onPress={handleAccountAction}
          />
        </View> */}
      </ScrollView>
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
  section: {
    marginTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    paddingLeft: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingRight: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 16,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    fontSize: 16,
  },
});

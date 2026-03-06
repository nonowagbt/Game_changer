import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  Platform,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LANGUAGES } from '../i18n/translations';
import { signOut, getCurrentUser, changePassword, getNextPasswordChangeDate } from '../utils/auth';
import { getUserInfo, getWorkouts, getDailyGoals, getDailyProgress, getBlockedUsers, unblockUser } from '../utils/db';
import {
  scheduleGoalReminderNotification,
  cancelGoalNotifications,
  requestNotificationPermission,
  checkAndNotifyGoals,
} from '../utils/notifications';

const SETTINGS_STORAGE_KEY = 'app_settings';

export default function SettingsScreen({ refreshAuth }) {
  const navigation = useNavigation();
  const { isDark, toggleTheme } = useTheme();
  const { language, t, setLanguage } = useLanguage();
  const tr = t.settings;

  // Paramètres
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationsWorkouts, setNotificationsWorkouts] = useState(true);
  const [notificationsGoals, setNotificationsGoals] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  // Mot de passe
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [nextPasswordChangeDate, setNextPasswordChangeDate] = useState(null);

  // Utilisateurs bloqués
  const [blockedModalVisible, setBlockedModalVisible] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);

  // Thème : un state local pour synchroniser le Switch visuellement
  // (isDark vient du ThemeContext mais le Switch a besoin d'une valeur React)

  useEffect(() => { loadSettings(); loadNextPasswordChangeDate(); }, []);

  useEffect(() => { saveSettings(); }, [notificationsEnabled, notificationsWorkouts, notificationsGoals, publicProfile]);

  const loadSettings = async () => {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (data) {
        const s = JSON.parse(data);
        setNotificationsEnabled(s.notificationsEnabled !== false);
        setNotificationsWorkouts(s.notificationsWorkouts !== false);
        setNotificationsGoals(s.notificationsGoals !== false);
        setPublicProfile(s.publicProfile !== false);
      }
    } catch (_) { }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
        notificationsEnabled,
        notificationsWorkouts,
        notificationsGoals,
        publicProfile,
      }));
    } catch (_) { }
  };

  const loadNextPasswordChangeDate = async () => {
    try {
      const date = await getNextPasswordChangeDate();
      setNextPasswordChangeDate(date);
    } catch (_) { }
  };

  // ─── Notifications objectifs ─────────────────────────────────
  const handleToggleGoalNotifications = async (value) => {
    setNotificationsGoals(value);
    if (value) {
      await scheduleGoalReminderNotification();
    } else {
      await cancelGoalNotifications();
    }
  };

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert('Permission refusée', 'Activez les notifications dans les réglages de votre téléphone.');
      return;
    }
    await checkAndNotifyGoals();
    Alert.alert('Notification envoyée', 'Une vérification de vos objectifs a été lancée.');
  };

  // ─── Utilisateurs bloqués ─────────────────────────────────────
  const handleOpenBlocked = async () => {
    const list = await getBlockedUsers();
    setBlockedUsers(list);
    setBlockedModalVisible(true);
  };

  const handleUnblock = async (userId) => {
    const updated = await unblockUser(userId);
    setBlockedUsers(updated);
  };

  // ─── Mot de passe ─────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs'); return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères'); return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas'); return;
    }
    if (oldPassword === newPassword) {
      Alert.alert('Erreur', "Le nouveau mot de passe doit être différent de l'ancien"); return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert('Succès', 'Mot de passe modifié avec succès', [{
        text: 'OK', onPress: () => {
          setPasswordModalVisible(false);
          setOldPassword(''); setNewPassword(''); setConfirmPassword('');
          loadNextPasswordChangeDate();
        }
      }]);
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Impossible de changer le mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ─── Export ─────────────────────────────────────────────────
  const handleExportData = async () => {
    Alert.alert('Export de données', 'Voulez-vous exporter toutes vos données ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Exporter', onPress: async () => {
          try {
            const [user, userInfo, workouts, dailyGoals, dailyProgress] = await Promise.all([
              getCurrentUser(), getUserInfo(), getWorkouts(), getDailyGoals(), getDailyProgress()
            ]);
            const json = JSON.stringify({ user, userInfo, workouts, dailyGoals, dailyProgress }, null, 2);
            await Share.share({ message: json, title: 'Game Changer Export' });
          } catch (e) {
            Alert.alert('Erreur', "Impossible d'exporter les données");
          }
        }
      }
    ]);
  };

  // ─── Composants helpers ─────────────────────────────────────
  const renderItem = (icon, title, subtitle, onPress, rightEl = null) => (
    <TouchableOpacity style={s.item} onPress={onPress} activeOpacity={0.7}>
      <View style={s.itemLeft}>
        <Ionicons name={icon} size={22} color={colors.textSecondary} style={s.itemIcon} />
        <View style={{ flex: 1 }}>
          <Text style={s.itemTitle}>{title}</Text>
          {subtitle ? <Text style={s.itemSub}>{subtitle}</Text> : null}
        </View>
      </View>
      {rightEl || <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />}
    </TouchableOpacity>
  );

  const renderSwitch = (icon, title, subtitle, value, onChange) => (
    <View style={s.item}>
      <View style={s.itemLeft}>
        <Ionicons name={icon} size={22} color={colors.textSecondary} style={s.itemIcon} />
        <View style={{ flex: 1 }}>
          <Text style={s.itemTitle}>{title}</Text>
          {subtitle ? <Text style={s.itemSub}>{subtitle}</Text> : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : colors.textSecondary}
      />
    </View>
  );

  // ─── STYLES (inline car dépend du thème dynamique) ───────────
  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 15, paddingTop: 50, paddingBottom: 15,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, flex: 1, textAlign: 'center' },
    sectionTitle: {
      fontSize: 12, fontWeight: '700', color: colors.textTertiary,
      textTransform: 'uppercase', paddingHorizontal: 20, paddingVertical: 10, letterSpacing: 0.8,
    },
    item: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 15, backgroundColor: colors.cardBackground,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    itemIcon: { marginRight: 15, width: 24 },
    itemTitle: { fontSize: 16, color: colors.text },
    itemSub: { fontSize: 13, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
    divider: { height: 1, backgroundColor: colors.border },
    sectionGap: { height: 8, backgroundColor: colors.background },

    // Thème toggle card
    themeCard: {
      margin: 15, borderRadius: 16, backgroundColor: colors.cardBackground,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    themeRow: {
      flexDirection: 'row', padding: 4, margin: 12,
      backgroundColor: colors.background, borderRadius: 12,
    },
    themeBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingVertical: 10, borderRadius: 10,
    },
    themeBtnActive: { backgroundColor: colors.cardBackground },
    themeBtnText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
    themeBtnTextActive: { color: colors.text },

    // Logout
    logoutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: 15, marginHorizontal: 20, marginVertical: 8,
      borderRadius: 12, borderWidth: 1,
      borderColor: colors.error + '40', backgroundColor: colors.error + '10',
    },
    logoutText: { fontSize: 16, fontWeight: '600', color: colors.error, marginLeft: 8 },

    // Modal partagé
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalBox: {
      backgroundColor: colors.cardBackground, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    modalScroll: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      backgroundColor: colors.background, paddingRight: 10, marginBottom: 16,
    },
    input: { flex: 1, padding: 14, fontSize: 15, color: colors.text },
    modalBtns: { flexDirection: 'row', gap: 10, marginTop: 10 },
    modalBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    modalBtnCancel: { backgroundColor: colors.buttonSecondary, borderWidth: 1, borderColor: colors.border },
    modalBtnCancelText: { color: colors.buttonSecondaryText, fontWeight: '600' },
    modalBtnSave: { backgroundColor: colors.primary },
    modalBtnSaveText: { color: colors.cardBackground, fontWeight: 'bold' },

    // Blocked users
    blockedItem: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12,
    },
    blockedAvatar: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: colors.error + '20', alignItems: 'center', justifyContent: 'center',
    },
    blockedName: { fontSize: 16, fontWeight: '600', color: colors.text },
    blockedEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    unblockBtn: {
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
      borderWidth: 1, borderColor: colors.primary,
    },
    unblockText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    emptyBlocked: { alignItems: 'center', paddingVertical: 40 },
    emptyBlockedText: { fontSize: 15, color: colors.textSecondary, marginTop: 12 },
  });

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{tr.title}</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Thème ─────────────────────────────── */}
        <Text style={s.sectionTitle}>{tr.appearance}</Text>
        <View style={s.themeCard}>
          <View style={[s.item, { paddingBottom: 8 }]}>
            <View style={s.itemLeft}>
              <Ionicons name="color-palette-outline" size={22} color={colors.textSecondary} style={s.itemIcon} />
              <Text style={s.itemTitle}>{tr.theme}</Text>
            </View>
          </View>
          <View style={s.themeRow}>
            <TouchableOpacity
              style={[s.themeBtn, isDark && s.themeBtnActive]}
              onPress={() => !isDark && toggleTheme()}
            >
              <Ionicons name="moon" size={18} color={isDark ? colors.primary : colors.textSecondary} />
              <Text style={[s.themeBtnText, isDark && s.themeBtnTextActive]}>{tr.dark}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.themeBtn, !isDark && s.themeBtnActive]}
              onPress={() => isDark && toggleTheme()}
            >
              <Ionicons name="sunny" size={18} color={!isDark ? colors.primary : colors.textSecondary} />
              <Text style={[s.themeBtnText, !isDark && s.themeBtnTextActive]}>{tr.light}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Langue ── */}
          <View style={[s.item, { paddingTop: 12, paddingBottom: 4, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8 }]}>
            <View style={s.itemLeft}>
              <Ionicons name="language-outline" size={22} color={colors.textSecondary} style={s.itemIcon} />
              <Text style={s.itemTitle}>{tr.language}</Text>
            </View>
          </View>
          <View style={[s.themeRow, { marginBottom: 10 }]}>
            {LANGUAGES.map(({ code, label, flag }) => (
              <TouchableOpacity
                key={code}
                style={[s.themeBtn, { flex: 1 }, language === code && s.themeBtnActive]}
                onPress={() => setLanguage(code)}
              >
                <Text style={{ fontSize: 18 }}>{flag}</Text>
                <Text style={[s.themeBtnText, language === code && s.themeBtnTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.sectionGap} />
        <View style={s.divider} />

        {/* ── Notifications ─────────────────────── */}
        <Text style={s.sectionTitle}>{tr.notifications}</Text>
        {renderSwitch('notifications-outline', tr.notifications, null, notificationsEnabled, setNotificationsEnabled)}
        <View style={s.divider} />
        {renderSwitch('barbell-outline', t.workout.programmes, null, notificationsWorkouts, setNotificationsWorkouts)}
        <View style={s.divider} />
        {renderSwitch(
          'flag-outline',
          tr.goalReminder,
          tr.goalReminderSub,
          notificationsGoals,
          handleToggleGoalNotifications
        )}
        <View style={s.divider} />
        {renderItem(
          'paper-plane-outline',
          tr.testNotif,
          null,
          handleTestNotification
        )}

        <View style={s.sectionGap} />
        <View style={s.divider} />

        {/* ── Sécurité ──────────────────────────── */}
        <Text style={s.sectionTitle}>{tr.security}</Text>
        {renderItem(
          'lock-closed-outline',
          tr.changePasswordTitle,
          nextPasswordChangeDate
            ? `Prochain changement le ${nextPasswordChangeDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-US' : 'es-ES')}`
            : tr.changePassword,
          () => { setPasswordModalVisible(true); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }
        )}

        <View style={s.sectionGap} />
        <View style={s.divider} />

        {/* ── Profil & Confidentialité ──────────── */}
        <Text style={s.sectionTitle}>{tr.privacy}</Text>
        {renderSwitch(
          'person-circle-outline',
          language === 'fr' ? 'Profil public' : language === 'en' ? 'Public profile' : 'Perfil público',
          null,
          publicProfile,
          setPublicProfile
        )}
        <View style={s.divider} />
        {renderItem('ban-outline', tr.blockedUsersTitle, null, handleOpenBlocked)}

        <View style={s.sectionGap} />
        <View style={s.divider} />

        {/* ── Application ───────────────────────── */}
        <Text style={s.sectionTitle}>{tr.data}</Text>
        {renderItem('download-outline', tr.exportData, null, handleExportData)}
        <View style={s.divider} />
        {renderItem('shield-checkmark-outline', language === 'fr' ? 'Confidentialité' : language === 'en' ? 'Privacy' : 'Privacidad', null, () => Alert.alert(language === 'fr' ? 'Confidentialité' : 'Privacy', language === 'fr' ? "Vos données sont stockées localement sur votre appareil." : "Your data is stored locally on your device."))}
        <View style={s.divider} />
        {renderItem('help-circle-outline', language === 'fr' ? "Centre d'aide" : language === 'en' ? 'Help Center' : 'Centro de ayuda', null, () => Alert.alert(language === 'fr' ? "Centre d'aide" : 'Help Center', 'Contactez-nous à support@gamechangerapp.com'))}
        <View style={s.divider} />
        {renderItem(
          'trash-outline',
          tr.deleteAccount,
          null,
          () => Alert.alert(tr.deleteAccount, language === 'fr' ? 'Êtes-vous sûr ? Cette action est irréversible.' : 'Are you sure? This action is irreversible.', [
            { text: t.common.cancel, style: 'cancel' },
            { text: t.common.delete, style: 'destructive' },
          ])
        )}

        {/* ── Déconnexion ───────────────────────── */}
        <View style={{ paddingVertical: 20 }}>
          <TouchableOpacity
            style={s.logoutBtn}
            onPress={() => Alert.alert(tr.logout, tr.logoutConfirm, [
              { text: t.common.cancel, style: 'cancel' },
              {
                text: tr.logout, style: 'destructive', onPress: async () => {
                  try { await signOut(); if (refreshAuth) refreshAuth(); }
                  catch (_) { Alert.alert(t.common.error, ''); }
                }
              }
            ])}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={s.logoutText}>{tr.logout}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── Modal : Mot de passe ─────────────────── */}
      <Modal animationType="slide" transparent visible={passwordModalVisible} onRequestClose={() => setPasswordModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{tr.changePasswordTitle}</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.modalScroll}>
              {nextPasswordChangeDate && new Date() < nextPasswordChangeDate && (
                <View style={{ backgroundColor: colors.warning + '20', padding: 14, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.warning, marginBottom: 16 }}>
                  <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>
                    {language === 'fr' ? 'Prochain changement possible le ' : language === 'en' ? 'Next change possible on ' : 'Próximo cambio posible el '}{nextPasswordChangeDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-US' : 'es-ES')}
                  </Text>
                </View>
              )}
              {[
                { label: tr.oldPassword, value: oldPassword, setter: setOldPassword, show: showOldPassword, toggle: () => setShowOldPassword(v => !v) },
                { label: tr.newPassword, value: newPassword, setter: setNewPassword, show: showNewPassword, toggle: () => setShowNewPassword(v => !v) },
                { label: tr.confirmPassword, value: confirmPassword, setter: setConfirmPassword, show: showConfirmPassword, toggle: () => setShowConfirmPassword(v => !v) },
              ].map(({ label, value, setter, show, toggle }) => (
                <View key={label} style={{ marginBottom: 16 }}>
                  <Text style={s.label}>{label}</Text>
                  <View style={s.inputWrap}>
                    <TextInput
                      style={s.input}
                      value={value}
                      onChangeText={setter}
                      secureTextEntry={!show}
                      placeholder={label}
                      placeholderTextColor={colors.textTertiary}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={toggle}>
                      <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={s.modalBtns}>
                <TouchableOpacity style={[s.modalBtn, s.modalBtnCancel]} onPress={() => setPasswordModalVisible(false)}>
                  <Text style={s.modalBtnCancelText}>{tr.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modalBtn, s.modalBtnSave, isChangingPassword && { opacity: 0.6 }]}
                  onPress={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  <Text style={s.modalBtnSaveText}>{isChangingPassword ? tr.saving : tr.save}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Modal : Utilisateurs bloqués ─────────── */}
      <Modal animationType="slide" transparent visible={blockedModalVisible} onRequestClose={() => setBlockedModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{tr.blockedUsersTitle}</Text>
              <TouchableOpacity onPress={() => setBlockedModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {blockedUsers.length === 0 ? (
              <View style={[s.modalScroll, s.emptyBlocked]}>
                <Ionicons name="ban-outline" size={56} color={colors.textTertiary} />
                <Text style={s.emptyBlockedText}>{tr.noBlocked}</Text>
              </View>
            ) : (
              <FlatList
                data={blockedUsers}
                keyExtractor={item => item.id}
                contentContainerStyle={s.modalScroll}
                renderItem={({ item }) => (
                  <View style={s.blockedItem}>
                    <View style={s.blockedAvatar}>
                      <Ionicons name="person" size={22} color={colors.error} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.blockedName}>{item.name || item.username || item.email}</Text>
                      {item.email && <Text style={s.blockedEmail}>{item.email}</Text>}
                      {item.blockedAt && (
                        <Text style={[s.blockedEmail, { fontSize: 11, marginTop: 2 }]}>
                          {language === 'fr' ? 'Bloqué le ' : language === 'en' ? 'Blocked on ' : 'Bloqueado el '}{new Date(item.blockedAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-US' : 'es-ES')}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity style={s.unblockBtn} onPress={() => {
                      Alert.alert(tr.unblock, `${tr.unblock} ${item.name || item.email}?`, [
                        { text: t.common.cancel, style: 'cancel' },
                        { text: tr.unblock, onPress: () => handleUnblock(item.id) }
                      ]);
                    }}>
                      <Text style={s.unblockText}>{tr.unblock}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

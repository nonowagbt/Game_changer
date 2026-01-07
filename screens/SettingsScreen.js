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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { signOut, getCurrentUser, changePassword, getNextPasswordChangeDate } from '../utils/auth';
import { getUserInfo, getWorkouts, getDailyGoals, getDailyProgress } from '../utils/db';

const SETTINGS_STORAGE_KEY = 'app_settings';

export default function SettingsScreen({ refreshAuth }) {
  const navigation = useNavigation();
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 15,
      paddingTop: 50,
      paddingBottom: 15,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 5,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    searchButton: {
      width: 34,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      paddingVertical: 10,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textTertiary,
      textTransform: 'uppercase',
      paddingHorizontal: 20,
      paddingVertical: 10,
      letterSpacing: 0.5,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: colors.cardBackground,
    },
    settingItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: 15,
      width: 24,
    },
    settingTextContainer: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '400',
    },
    settingSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 18,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 0,
    },
    logoutSection: {
      paddingTop: 20,
      paddingBottom: 10,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      marginHorizontal: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.error + '40',
      backgroundColor: colors.error + '10',
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.error,
      marginLeft: 8,
    },
    bottomSpacing: {
      height: 30,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      width: '90%',
      maxWidth: 500,
      maxHeight: '80%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    modalCloseButton: {
      padding: 5,
    },
    modalScrollView: {
      padding: 20,
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.warning + '20',
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
      gap: 10,
    },
    warningText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      flex: 1,
      padding: 15,
      fontSize: 16,
      color: colors.inputText,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      backgroundColor: colors.inputBackground,
      paddingRight: 10,
    },
    eyeIcon: {
      padding: 5,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
    },
    modalButton: {
      flex: 1,
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
    },
    cancelModalButton: {
      backgroundColor: colors.buttonSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelModalButtonText: {
      color: colors.buttonSecondaryText,
      fontSize: 16,
      fontWeight: '600',
    },
    saveModalButton: {
      backgroundColor: colors.primary,
    },
    saveModalButtonDisabled: {
      opacity: 0.5,
    },
    saveModalButtonText: {
      color: colors.cardBackground,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationsWorkouts, setNotificationsWorkouts] = useState(true);
  const [notificationsGoals, setNotificationsGoals] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [nextPasswordChangeDate, setNextPasswordChangeDate] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsData = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        setNotificationsEnabled(settings.notificationsEnabled !== false);
        setNotificationsWorkouts(settings.notificationsWorkouts !== false);
        setNotificationsGoals(settings.notificationsGoals !== false);
        setPublicProfile(settings.publicProfile !== false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        notificationsEnabled,
        notificationsWorkouts,
        notificationsGoals,
        publicProfile,
      };
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    saveSettings();
  }, [notificationsEnabled, notificationsWorkouts, notificationsGoals, publicProfile]);

  // Export de données
  const handleExportData = async () => {
    try {
      Alert.alert(
        'Export de données',
        'Voulez-vous exporter toutes vos données ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Exporter',
            onPress: async () => {
              try {
                const user = await getCurrentUser();
                const userInfo = await getUserInfo();
                const workouts = await getWorkouts();
                const dailyGoals = await getDailyGoals();
                const dailyProgress = await getDailyProgress();

                const exportData = {
                  exportDate: new Date().toISOString(),
                  user: {
                    email: user?.email,
                    username: user?.username,
                    firstName: user?.firstName,
                    lastName: user?.lastName,
                    phone: user?.phone,
                  },
                  userInfo: {
                    age: userInfo?.age,
                    gender: userInfo?.gender,
                    weight: userInfo?.weight,
                    height: userInfo?.height,
                    profileImage: userInfo?.profileImage ? 'Image sauvegardée' : null,
                  },
                  dailyGoals,
                  workouts,
                  dailyProgress,
                };

                const jsonData = JSON.stringify(exportData, null, 2);

                if (Platform.OS === 'web') {
                  // Pour le web, télécharger le fichier
                  const blob = new Blob([jsonData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `game-changer-export-${Date.now()}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                  Alert.alert('Succès', 'Vos données ont été exportées !');
                } else {
                  // Pour mobile, partager
                  try {
                    await Share.share({
                      message: jsonData,
                      title: 'Export de données Game Changer',
                    });
                  } catch (shareError) {
                    // Si le partage échoue, afficher les données
                    Alert.alert(
                      'Vos données',
                      jsonData.substring(0, 500) + '...\n\n(Données complètes dans la console)',
                      [{ text: 'OK' }]
                    );
                    console.log('Export data:', jsonData);
                  }
                }
              } catch (error) {
                console.error('Error exporting data:', error);
                Alert.alert('Erreur', 'Impossible d\'exporter les données');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in handleExportData:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleAccountSettings = () => {
    Alert.alert('Mon compte', 'Redirection vers les paramètres du compte...');
  };

  const handlePassword = () => {
    console.log('Opening password change modal');
    setPasswordModalVisible(true);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (oldPassword === newPassword) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert(
        'Succès',
        'Votre mot de passe a été modifié avec succès',
        [
          {
            text: 'OK',
            onPress: () => {
              setPasswordModalVisible(false);
              setOldPassword('');
              setNewPassword('');
              setConfirmPassword('');
              loadNextPasswordChangeDate();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de changer le mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAppearance = () => {
    Alert.alert('Apparence', 'L\'application utilise le thème sombre par défaut.');
  };

  const handleBlockedUsers = () => {
    Alert.alert('Utilisateurs bloqués', 'Fonctionnalité à venir...');
  };

  const handleMyReports = () => {
    Alert.alert(
      'Mes signalements',
      'Consultez l\'état des signalements que vous avez effectués dans l\'application'
    );
  };

  const handleAccountStatus = () => {
    Alert.alert('Statut du compte', 'Votre compte est actif.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Fonctionnalité à venir', 'La suppression de compte sera disponible prochainement.');
          },
        },
      ]
    );
  };

  const handlePublicProfileSettings = () => {
    Alert.alert(
      'Réglages du profil public',
      `Votre profil est ${publicProfile ? 'public' : 'privé'}`,
      [
        { text: 'OK' }
      ]
    );
  };

  const handleMyApp = async () => {
    try {
      const user = await getCurrentUser();
      Alert.alert(
        'Mon application',
        `Game Changer v1.0.0\n\nConnecté en tant que : ${user?.email || user?.username || 'Utilisateur'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Mon application', 'Game Changer v1.0.0', [{ text: 'OK' }]);
    }
  };

  const handlePrivacyData = () => {
    Alert.alert(
      'Confidentialité et données',
      'Vous pouvez exporter toutes vos données via "Ma confidentialité et mes données" dans la section "Application et confidentialité".',
      [{ text: 'OK' }]
    );
  };

  const handleHelpSecurity = () => {
    Alert.alert('Assistance et sécurité', 'Centre d\'aide et de sécurité...');
  };

  const renderSettingItem = (icon, title, subtitle, onPress, showArrow = true, rightComponent = null) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon} size={22} color={colors.textSecondary} style={styles.settingIcon} />
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (showArrow && (
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      ))}
    </TouchableOpacity>
  );

  const renderSwitchItem = (icon, title, subtitle, value, onValueChange) => (
    <View style={styles.settingItem}>
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon} size={22} color={colors.textSecondary} style={styles.settingIcon} />
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : colors.textSecondary}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réglages</Text>
        <View style={styles.searchButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Section Raccourcis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Raccourcis</Text>
          {renderSettingItem(
            'lock-closed-outline',
            'Mot de passe',
            nextPasswordChangeDate
              ? `Prochain changement possible le ${nextPasswordChangeDate.toLocaleDateString('fr-FR')}`
              : null,
            handlePassword
          )}
          {renderSwitchItem(
            'notifications-outline',
            'Notifications',
            'Activer les notifications push',
            notificationsEnabled,
            setNotificationsEnabled
          )}
          {renderSwitchItem(
            'barbell-outline',
            'Notifications entraînements',
            'Recevoir des notifications pour vos entraînements',
            notificationsWorkouts,
            setNotificationsWorkouts
          )}
          {renderSwitchItem(
            'flag-outline',
            'Notifications objectifs',
            'Recevoir des notifications pour vos objectifs',
            notificationsGoals,
            setNotificationsGoals
          )}
          {renderSettingItem('color-palette-outline', 'Apparence de l\'application', 'Thème sombre', handleAppearance)}
          {renderSettingItem('ban-outline', 'Utilisateurs·rices bloqués·es', null, handleBlockedUsers)}
        </View>

        <View style={styles.divider} />

        {/* Statut du compte */}
        {renderSettingItem('checkmark-circle-outline', 'Statut du compte', null, handleAccountStatus)}
        {renderSettingItem(
          'trash-outline',
          'Supprimer le compte',
          null,
          handleDeleteAccount,
          true,
          null
        )}

        <View style={styles.divider} />

        {/* Réglages du profil public */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réglages du profil public</Text>
          {renderSwitchItem(
            'person-circle-outline',
            'Profil public',
            'Rendre votre profil visible par les autres utilisateurs',
            publicProfile,
            setPublicProfile
          )}
        </View>

        <View style={styles.divider} />

        {/* Application et confidentialité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application et confidentialité</Text>
          {renderSettingItem('phone-portrait-outline', 'Mon application', null, handleMyApp)}
          {renderSettingItem(
            'download-outline',
            'Exporter mes données',
            'Télécharger toutes vos données personnelles',
            handleExportData
          )}
          {renderSettingItem('shield-checkmark-outline', 'Ma confidentialité et mes données', null, handlePrivacyData)}
        </View>

        <View style={styles.divider} />

        {/* Assistance et sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assistance et sécurité</Text>
          {renderSettingItem('help-circle-outline', 'Centre d\'aide', null, handleHelpSecurity)}
          {renderSettingItem('shield-outline', 'Sécurité', null, handleHelpSecurity)}
          {renderSettingItem('document-text-outline', 'Conditions d\'utilisation', null, handleHelpSecurity)}
          {renderSettingItem('lock-closed-outline', 'Politique de confidentialité', null, handlePrivacyData)}
        </View>

        {/* Bouton de déconnexion */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                'Déconnexion',
                'Êtes-vous sûr de vouloir vous déconnecter ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  {
                    text: 'Déconnexion',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await signOut();
                        if (refreshAuth) {
                          refreshAuth();
                        }
                      } catch (error) {
                        Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion');
                      }
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal de changement de mot de passe */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Changer le mot de passe</Text>
              <TouchableOpacity
                onPress={() => {
                  setPasswordModalVisible(false);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {nextPasswordChangeDate && new Date() < nextPasswordChangeDate && (
                <View style={styles.warningBox}>
                  <Ionicons name="information-circle" size={20} color={colors.warning} />
                  <Text style={styles.warningText}>
                    Vous ne pouvez changer votre mot de passe que tous les 3 mois.{'\n'}
                    Prochain changement possible le {nextPasswordChangeDate.toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ancien mot de passe</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.input}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    secureTextEntry={!showOldPassword}
                    placeholder="Entrez votre ancien mot de passe"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowOldPassword(!showOldPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showOldPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nouveau mot de passe</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    placeholder="Minimum 6 caractères"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholder="Répétez le nouveau mot de passe"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => {
                    setPasswordModalVisible(false);
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  disabled={isChangingPassword}
                >
                  <Text style={styles.cancelModalButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.saveModalButton,
                    isChangingPassword && styles.saveModalButtonDisabled,
                  ]}
                  onPress={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <Text style={styles.saveModalButtonText}>Changement...</Text>
                  ) : (
                    <Text style={styles.saveModalButtonText}>Changer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

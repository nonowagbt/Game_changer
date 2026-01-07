import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signIn, getLastEmail } from '../utils/auth';
import { colors } from '../theme/colors';

export default function LoginScreen({ onLogin, onSignUp }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  // Charger le dernier email utilisé au montage du composant
  useEffect(() => {
    loadLastEmail();
  }, []);

  const loadLastEmail = async () => {
    const lastEmail = await getLastEmail();
    if (lastEmail) {
      setIdentifier(lastEmail);
      setRememberMe(true); // Si un email est trouvé, activer "Se rappeler de moi"
    }
  };

  const handleLogin = async () => {
    // Réinitialiser l'erreur
    setError('');
    
    if (!identifier || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await signIn(identifier, password, rememberMe);
      if (onLogin) {
        onLogin();
      }
    } catch (error) {
      // Afficher l'erreur en rouge dans le formulaire
      setError(error.message || 'Identifiant ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  // Déterminer si l'identifiant ressemble à un numéro de téléphone
  const isPhoneNumber = (text) => {
    if (!text) return false;
    // Un numéro de téléphone contient principalement des chiffres
    // et peut avoir des espaces, tirets, parenthèses, et un + au début
    const cleaned = text.replace(/[\s\-\+\(\)]/g, '');
    // Doit contenir au moins 8 chiffres pour être considéré comme un téléphone
    return /^[\d\s\-\+\(\)]+$/.test(text) && cleaned.length >= 8 && /^\d+$/.test(cleaned);
  };

  // Déterminer l'icône et le placeholder selon le type d'identifiant
  const getIdentifierIcon = () => {
    if (identifier.includes('@')) {
      return 'mail-outline';
    } else if (isPhoneNumber(identifier)) {
      return 'call-outline';
    } else {
      return 'at';
    }
  };

  const getIdentifierPlaceholder = () => {
    if (identifier.includes('@')) {
      return 'votre@email.com';
    } else if (isPhoneNumber(identifier)) {
      return '+33 6 12 34 56 78';
    } else {
      return 'votre_username';
    }
  };

  const getIdentifierLabel = () => {
    if (identifier.includes('@')) {
      return 'Email';
    } else if (isPhoneNumber(identifier)) {
      return 'Numéro de téléphone';
    } else {
      return 'Username';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="fitness" size={80} color={colors.primary} />
          <Text style={styles.title}>Game Changer</Text>
          <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {identifier ? getIdentifierLabel() : 'Email, Username ou Téléphone'}
            </Text>
            <View style={[styles.inputContainer, error && styles.inputContainerError]}>
              <Ionicons 
                name={getIdentifierIcon()} 
                size={20} 
                color={error ? colors.error : colors.textSecondary} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  setError(''); // Réinitialiser l'erreur quand l'utilisateur tape
                }}
                keyboardType={
                  identifier.includes('@') 
                    ? 'email-address' 
                    : /^[\d\s\-\+\(\)]+$/.test(identifier) 
                      ? 'phone-pad' 
                      : 'default'
                }
                autoCapitalize="none"
                placeholder="Email, username ou numéro de téléphone"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <Text style={styles.hintText}>
              Vous pouvez vous connecter avec votre email, votre username ou votre numéro de téléphone
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={[styles.inputContainer, error && styles.inputContainerError]}>
              <Ionicons name="lock-closed-outline" size={20} color={error ? colors.error : colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(''); // Réinitialiser l'erreur quand l'utilisateur tape
                }}
                secureTextEntry={!showPassword}
                placeholder="Votre mot de passe"
                placeholderTextColor={colors.textTertiary}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.rememberMeContainer}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && (
                <Ionicons name="checkmark" size={16} color={colors.cardBackground} />
              )}
            </View>
            <Text style={styles.rememberMeText}>Se rappeler de moi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.loginButtonText}>Connexion...</Text>
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color={colors.cardBackground} />
                <Text style={styles.loginButtonText}>Se connecter</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupLink}
            onPress={onSignUp}
          >
            <Text style={styles.signupLinkText}>
              Pas encore de compte ? <Text style={styles.signupLinkBold}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 10,
  },
  form: {
    width: '100%',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    marginLeft: 15,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: colors.text,
  },
  eyeIcon: {
    padding: 15,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rememberMeText: {
    fontSize: 14,
    color: colors.text,
  },
  loginButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: colors.cardBackground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  signupLinkText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signupLinkBold: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  inputContainerError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${colors.error}20`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 5,
    fontStyle: 'italic',
  },
});


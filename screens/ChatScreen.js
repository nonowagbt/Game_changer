import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { getCurrentUser } from '../utils/auth';
import { getMessages, sendMessage, sendWorkoutMessage, getWorkouts } from '../utils/db';

// -------------------------------------------------------
// Réponses automatiques du bot Alex Martin
// -------------------------------------------------------
const BOT_REPLIES = {
  default: [
    'Trop bien ! 💪 Continue comme ça, tu es sur la bonne voie !',
    "C'est exactement ce qu'il faut faire pour progresser ! 🔥",
    "Beau travail ! N'oublie pas de bien te reposer aussi 😊",
    'Super ! La régularité c\'est la clé du succès 🏆',
    'Impressionnant ! Tu vas cartonner ! 💥',
    'Je suis là si tu as des questions sur l\'entraînement 🤝',
  ],
  workout: [
    '🏋️ Top programme ! Bon courage pour la séance !',
    '💥 Wow, ce programme est intense ! Tu vas bien t\'entraîner !',
    '🔥 Excellent choix ! Ce type d\'entraînement est très efficace.',
    '💪 Merci pour le partage ! Ce programme a l\'air parfait. Je vais m\'en inspirer !',
    '⚡ Sympa ce programme ! Combien de fois par semaine tu le fais ?',
  ],
  salut: [
    'Salut ! 👋 Comment ça va ? Tu t\'es entraîné aujourd\'hui ?',
    'Hey ! 😄 Je suis en pleine récup\' après ma séance, et toi ?',
    'Coucou ! Prêt pour une bonne séance aujourd\'hui ? 💪',
  ],
  merci: [
    'De rien ! C\'est ça les amis 😄',
    'Avec plaisir ! On est là pour s\'entraider 🤝',
    'Pas de soucis ! Bonne chance pour la suite 🔥',
  ],
  calories: [
    'Les calories c\'est important ! Tu manges assez de protéines ? 🥩',
    'Bon équilibre ! L\'alimentation c\'est 70% des résultats 🍎',
    'Si tu veux perdre du poids, pense à maintenir un léger déficit calorique 📊',
  ],
  sport: [
    'J\'adore le sport ! Tu fais quoi comme activité en ce moment ? 🏃',
    'La constance est plus importante que l\'intensité ! Petits pas, grands résultats 🎯',
    '3 fois par semaine c\'est déjà excellent pour commencer 👍',
  ],
};

const getBotReply = (userMessage, type = 'text') => {
  if (type === 'workout') {
    const replies = BOT_REPLIES.workout;
    return replies[Math.floor(Math.random() * replies.length)];
  }
  const msg = userMessage.toLowerCase();
  if (msg.includes('salut') || msg.includes('bonjour') || msg.includes('coucou') || msg.includes('hey')) {
    const replies = BOT_REPLIES.salut;
    return replies[Math.floor(Math.random() * replies.length)];
  }
  if (msg.includes('merci') || msg.includes('thanks')) {
    const replies = BOT_REPLIES.merci;
    return replies[Math.floor(Math.random() * replies.length)];
  }
  if (msg.includes('calorie') || msg.includes('manger') || msg.includes('repas') || msg.includes('nourriture')) {
    const replies = BOT_REPLIES.calories;
    return replies[Math.floor(Math.random() * replies.length)];
  }
  if (msg.includes('sport') || msg.includes('gym') || msg.includes('séance') || msg.includes('entraîne') || msg.includes('muscl')) {
    const replies = BOT_REPLIES.sport;
    return replies[Math.floor(Math.random() * replies.length)];
  }
  const replies = BOT_REPLIES.default;
  return replies[Math.floor(Math.random() * replies.length)];
};

// -------------------------------------------------------
// Formater un workout en texte lisible
// -------------------------------------------------------
const formatWorkoutText = (workout) => {
  if (!workout) return '';
  let text = `🏋️ ${workout.name}\n\n`;
  if (workout.exercises?.length > 0) {
    text += `${workout.exercises.length} exercice${workout.exercises.length > 1 ? 's' : ''} :\n\n`;
    workout.exercises.forEach((exercise, i) => {
      text += `${i + 1}. ${exercise.name}\n`;
      if (exercise.series?.length > 0) {
        exercise.series.forEach((serie, si) => {
          text += `   Série ${si + 1}: ${serie.reps || 0} reps × ${serie.weight || 0} kg`;
          if (serie.restTime > 0) text += ` (repos: ${serie.restTime}s)`;
          text += '\n';
        });
      }
      text += '\n';
    });
  }
  return text;
};

// -------------------------------------------------------
// Composant principal
// -------------------------------------------------------
export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { friend } = route.params || {};
  const listRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();
      if (user?.id) {
        setCurrentUserId(user.id);
      } else {
        // Fallback : utiliser un ID local
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        let id = await AsyncStorage.getItem('user_id');
        if (!id) {
          id = `user_${Date.now()}`;
          await AsyncStorage.setItem('user_id', id);
        }
        setCurrentUserId(id);
      }
    };
    init();
    loadWorkouts();
  }, []);

  useEffect(() => {
    if (friend && currentUserId) {
      loadMessages();
    }
  }, [friend, currentUserId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const loadMessages = async () => {
    if (!friend || !currentUserId) return;
    try {
      setIsLoading(true);
      const chatMessages = await getMessages(currentUserId, friend.id);
      setMessages(chatMessages);
    } catch (e) {
      console.error('Error loading messages:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkouts = async () => {
    try {
      const list = await getWorkouts();
      setWorkouts(list);
    } catch (e) { }
  };

  // Envoyer un message texte
  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text || !friend || !currentUserId) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      receiverId: friend.id,
      text,
      type: 'text',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessageText('');

    try {
      await sendMessage(newMsg);
    } catch (e) { }

    // Réponse automatique du bot
    if (friend.isBot) {
      triggerBotReply(text, 'text');
    }
  };

  // Envoyer un programme de sport
  const handleSendWorkout = async (workout) => {
    if (!friend || !workout || !currentUserId) return;

    const workoutMsg = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      receiverId: friend.id,
      type: 'workout',
      workout,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, workoutMsg]);
    setShowWorkoutPicker(false);

    try {
      await sendWorkoutMessage(workoutMsg);
    } catch (e) { }

    // Le bot réagit au programme
    if (friend.isBot) {
      triggerBotReply('', 'workout');
    }
  };

  // Simuler la frappe et réponse du bot
  const triggerBotReply = (userText, type) => {
    setIsBotTyping(true);
    const delay = 1000 + Math.random() * 1500; // entre 1 et 2.5 secondes
    setTimeout(async () => {
      const replyText = getBotReply(userText, type);
      const botMsg = {
        id: `bot_${Date.now()}`,
        senderId: friend.id,
        receiverId: currentUserId,
        text: replyText,
        type: 'text',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsBotTyping(false);
      try {
        await sendMessage(botMsg);
      } catch (e) { }
    }, delay);
  };

  // -------------------------------------------------------
  // Rendu des messages
  // -------------------------------------------------------
  const renderMessage = ({ item }) => {
    const isSent = item.senderId === currentUserId;

    if (item.type === 'workout') {
      return (
        <View style={[styles.msgRow, isSent ? styles.msgRowRight : styles.msgRowLeft]}>
          <View style={[styles.bubble, isSent ? styles.bubbleSent : styles.bubbleReceived, styles.workoutBubble]}>
            <View style={styles.workoutHeader}>
              <Ionicons name="barbell" size={18} color={isSent ? colors.cardBackground : colors.primary} />
              <Text style={[styles.workoutTitle, isSent ? styles.textSent : styles.textReceived]}>
                {item.workout?.name || 'Programme'}
              </Text>
            </View>
            <Text style={[styles.workoutBody, isSent ? styles.textSent : styles.textReceived]}>
              {formatWorkoutText(item.workout)}
            </Text>
            <Text style={[styles.msgTime, isSent ? styles.timeSent : styles.timeReceived]}>
              {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.msgRow, isSent ? styles.msgRowRight : styles.msgRowLeft]}>
        <View style={[styles.bubble, isSent ? styles.bubbleSent : styles.bubbleReceived]}>
          <Text style={isSent ? styles.textSent : styles.textReceived}>{item.text}</Text>
          <Text style={[styles.msgTime, isSent ? styles.timeSent : styles.timeReceived]}>
            {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (!friend) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerName}>Conversation</Text>
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="chatbubbles-outline" size={60} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Aucun ami sélectionné</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.headerAvatar, friend.isBot && styles.headerAvatarBot]}>
          {friend.isBot
            ? <Text style={{ fontSize: 22 }}>{friend.avatar}</Text>
            : <Ionicons name="person" size={22} color={colors.primary} />
          }
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{friend.name}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, friend.status === 'En ligne' ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.statusText}>{friend.status || 'Hors ligne'}</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbubbles-outline" size={60} color={colors.textTertiary} />
            <Text style={styles.emptyText}>Aucun message pour le moment</Text>
            <Text style={styles.emptyText}>Envoyez le premier message ! 👋</Text>
          </View>
        }
      />

      {/* Indicateur de frappe du bot */}
      {isBotTyping && (
        <View style={styles.typingRow}>
          <Text style={styles.typingText}>{friend.name} est en train d'écrire...</Text>
        </View>
      )}

      {/* Zone de saisie */}
      <View style={styles.inputContainer}>
        {/* Bouton envoyer un workout */}
        <TouchableOpacity style={styles.workoutBtn} onPress={() => setShowWorkoutPicker(true)}>
          <Ionicons name="barbell" size={20} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Tapez un message..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={500}
          />
        </View>

        <TouchableOpacity
          style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <Ionicons name="send" size={18} color={messageText.trim() ? colors.cardBackground : colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Modal choix de programme */}
      <Modal
        visible={showWorkoutPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWorkoutPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Envoyer un programme</Text>
              <TouchableOpacity onPress={() => setShowWorkoutPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {workouts.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="barbell-outline" size={40} color={colors.textTertiary} />
                  <Text style={styles.emptyText}>Aucun programme disponible</Text>
                  <Text style={[styles.emptyText, { fontSize: 13 }]}>
                    Créez un programme dans l'onglet Entraînements
                  </Text>
                </View>
              ) : (
                workouts.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={styles.workoutItem}
                    onPress={() => handleSendWorkout(w)}
                  >
                    <View style={styles.workoutItemLeft}>
                      <Ionicons name="barbell-outline" size={22} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.workoutItemName}>{w.name}</Text>
                        <Text style={styles.workoutItemDetail}>
                          {w.exercises?.length || 0} exercice{(w.exercises?.length || 0) > 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="send" size={16} color={colors.primary} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingTop: 50,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarBot: { backgroundColor: colors.primary + '30' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 17, fontWeight: 'bold', color: colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotOnline: { backgroundColor: '#4CAF50' },
  dotOffline: { backgroundColor: colors.textTertiary },
  statusText: { fontSize: 12, color: colors.textSecondary },

  messagesList: { padding: 15, paddingBottom: 10 },

  msgRow: { marginBottom: 8 },
  msgRowRight: { alignItems: 'flex-end' },
  msgRowLeft: { alignItems: 'flex-start' },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleSent: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: colors.cardBackground,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  workoutBubble: { maxWidth: '85%' },
  textSent: { color: colors.cardBackground, fontSize: 15, lineHeight: 21 },
  textReceived: { color: colors.text, fontSize: 15, lineHeight: 21 },
  msgTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  timeSent: { color: colors.cardBackground + 'BB' },
  timeReceived: { color: colors.textTertiary },

  workoutHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  workoutTitle: { fontSize: 15, fontWeight: 'bold' },
  workoutBody: { fontSize: 13, lineHeight: 18 },

  typingRow: { paddingHorizontal: 20, paddingBottom: 4 },
  typingText: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  workoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  textInput: {
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.border },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 40 },
  emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  workoutItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  workoutItemName: { fontSize: 15, fontWeight: '600', color: colors.text },
  workoutItemDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});

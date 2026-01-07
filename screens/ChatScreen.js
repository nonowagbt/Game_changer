import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { getCurrentUser } from '../utils/auth';
import { getMessages, sendMessage, sendWorkoutMessage } from '../utils/db';
import { getWorkouts } from '../utils/db';

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { friend } = route.params || {};
  const scrollViewRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const user = await getCurrentUser();
      setCurrentUserId(user?.id);
    };
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (friend && currentUserId) {
      loadMessages();
      loadWorkouts();
    }
  }, [friend, currentUserId]);

  useEffect(() => {
    // Auto-scroll vers le bas quand de nouveaux messages arrivent
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadMessages = async () => {
    if (!friend || !currentUserId) return;
    
    try {
      setIsLoading(true);
      const chatMessages = await getMessages(currentUserId, friend.id);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Erreur', 'Impossible de charger les messages');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkouts = async () => {
    try {
      const userWorkouts = await getWorkouts();
      setWorkouts(userWorkouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !friend || !currentUserId) return;

    try {
      const newMessage = {
        id: Date.now().toString(),
        senderId: currentUserId,
        receiverId: friend.id,
        text: messageText.trim(),
        type: 'text',
        timestamp: new Date().toISOString(),
      };

      await sendMessage(newMessage);
      setMessages([...messages, newMessage]);
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    }
  };

  const handleSendWorkout = async (workout) => {
    if (!friend || !workout || !currentUserId) return;

    try {
      const workoutMessage = {
        id: Date.now().toString(),
        senderId: currentUserId,
        receiverId: friend.id,
        type: 'workout',
        workout: workout,
        timestamp: new Date().toISOString(),
      };

      await sendWorkoutMessage(workoutMessage);
      setMessages([...messages, workoutMessage]);
      setShowWorkoutPicker(false);
    } catch (error) {
      console.error('Error sending workout:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'entraînement');
    }
  };

  const formatWorkoutForDisplay = (workout) => {
    if (!workout) return '';
    
    let text = `🏋️ ${workout.name}\n\n`;
    
    if (workout.exercises && workout.exercises.length > 0) {
      text += `${workout.exercises.length} exercice${workout.exercises.length > 1 ? 's' : ''}:\n\n`;
      
      workout.exercises.forEach((exercise, index) => {
        text += `${index + 1}. ${exercise.name}\n`;
        
        if (exercise.series && exercise.series.length > 0) {
          exercise.series.forEach((serie, serieIndex) => {
            const reps = serie.reps || '0';
            const weight = serie.weight || '0';
            const restTime = serie.restTime || '0';
            
            text += `   Série ${serieIndex + 1}: ${reps} reps × ${weight} kg`;
            if (restTime > 0) {
              text += ` (repos: ${restTime}s)`;
            }
            text += '\n';
          });
        }
        text += '\n';
      });
    }
    
    return text;
  };

  const renderMessage = ({ item }) => {
    const isSent = item.senderId === currentUserId;
    
    if (item.type === 'workout') {
      return (
        <View style={[styles.messageContainer, isSent ? styles.sentMessage : styles.receivedMessage]}>
          <View style={[styles.messageBubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
            <View style={styles.workoutHeader}>
              <Ionicons name="barbell" size={20} color={isSent ? colors.cardBackground : colors.primary} />
              <Text style={[styles.workoutTitle, { color: isSent ? colors.cardBackground : colors.text }]}>
                {item.workout?.name || 'Entraînement'}
              </Text>
            </View>
            <Text style={[styles.workoutText, { color: isSent ? colors.cardBackground : colors.textSecondary }]}>
              {formatWorkoutForDisplay(item.workout)}
            </Text>
            <Text style={[styles.messageTime, { color: isSent ? colors.cardBackground + 'CC' : colors.textTertiary }]}>
              {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isSent ? styles.sentMessage : styles.receivedMessage]}>
        <View style={[styles.messageBubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
          <Text style={[styles.messageText, { color: isSent ? colors.cardBackground : colors.text }]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTime, { color: isSent ? colors.cardBackground + 'CC' : colors.textTertiary }]}>
            {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      paddingTop: 50,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 5,
      marginRight: 10,
    },
    headerInfo: {
      flex: 1,
    },
    headerName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    messagesList: {
      flex: 1,
      padding: 15,
    },
    messageContainer: {
      marginBottom: 10,
    },
    sentMessage: {
      alignItems: 'flex-end',
    },
    receivedMessage: {
      alignItems: 'flex-start',
    },
    messageBubble: {
      maxWidth: '75%',
      padding: 12,
      borderRadius: 18,
    },
    sentBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    receivedBubble: {
      backgroundColor: colors.cardBackground,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 20,
    },
    messageTime: {
      fontSize: 11,
      marginTop: 4,
      alignSelf: 'flex-end',
    },
    workoutHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    workoutTitle: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    workoutText: {
      fontSize: 14,
      lineHeight: 18,
      marginBottom: 4,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      paddingBottom: Platform.OS === 'ios' ? 20 : 10,
      backgroundColor: colors.cardBackground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    inputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 15,
      marginRight: 10,
    },
    textInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
      maxHeight: 100,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    workoutButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    workoutPickerModal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    workoutPickerContent: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '70%',
      padding: 20,
    },
    workoutPickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    workoutPickerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    workoutItem: {
      padding: 15,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    workoutItemName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 5,
    },
    workoutItemDetails: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    emptyMessages: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 10,
    },
  });

  if (!friend) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerName}>Conversation</Text>
        </View>
        <View style={styles.emptyMessages}>
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{friend.name || friend.username || friend.email}</Text>
          {friend.username && (
            <Text style={styles.headerSubtitle}>@{friend.username}</Text>
          )}
        </View>
      </View>

      <FlatList
        ref={scrollViewRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Ionicons name="chatbubbles-outline" size={60} color={colors.textTertiary} />
            <Text style={styles.emptyText}>Aucun message pour le moment</Text>
            <Text style={styles.emptyText}>Envoyez votre premier message !</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.workoutButton}
          onPress={() => setShowWorkoutPicker(true)}
        >
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
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={messageText.trim() ? colors.cardBackground : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      {/* Modal de sélection d'entraînement */}
      {showWorkoutPicker && (
        <Modal
          visible={showWorkoutPicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowWorkoutPicker(false)}
        >
          <View style={styles.workoutPickerModal}>
            <View style={styles.workoutPickerContent}>
              <View style={styles.workoutPickerHeader}>
                <Text style={styles.workoutPickerTitle}>Envoyer un entraînement</Text>
                <TouchableOpacity onPress={() => setShowWorkoutPicker(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {workouts.length === 0 ? (
                  <View style={styles.emptyMessages}>
                    <Ionicons name="barbell-outline" size={40} color={colors.textTertiary} />
                    <Text style={styles.emptyText}>Aucun entraînement disponible</Text>
                  </View>
                ) : (
                  workouts.map((workout) => (
                    <TouchableOpacity
                      key={workout.id}
                      style={styles.workoutItem}
                      onPress={() => handleSendWorkout(workout)}
                    >
                      <Text style={styles.workoutItemName}>{workout.name}</Text>
                      <Text style={styles.workoutItemDetails}>
                        {workout.exercises?.length || 0} exercice{(workout.exercises?.length || 0) > 1 ? 's' : ''}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}


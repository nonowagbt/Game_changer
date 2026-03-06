import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { getFriends, addFriend, removeFriend, BOT_FRIEND } from '../utils/db';
import { useLanguage } from '../contexts/LanguageContext';

export default function FriendsScreen() {
  const { t, language } = useLanguage();
  const navigation = useNavigation();
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendInput, setFriendInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  // Charger la liste d'amis à chaque fois que l'écran prend le focus
  useFocusEffect(
    useCallback(() => {
      loadFriends();
    }, [])
  );

  const loadFriends = async () => {
    const list = await getFriends();
    setFriends(list);
  };

  // Ajouter un ami par nom, pseudo ou email (simulation locale)
  const handleAddFriend = async () => {
    const input = friendInput.trim();
    if (!input) {
      Alert.alert(
        language === 'fr' ? 'Champ vide' : language === 'en' ? 'Empty field' : 'Campo vacío',
        language === 'fr' ? 'Veuillez entrer un nom, pseudo ou email.' : language === 'en' ? 'Please enter a name, username or email.' : 'Por favor ingresa un nombre, usuario o email.'
      );
      return;
    }
    setIsAdding(true);
    try {
      // Simuler une "recherche" : on crée un ami avec les infos saisies
      const isEmail = input.includes('@');
      const newFriend = {
        id: `friend_${Date.now()}`,
        name: isEmail ? input.split('@')[0] : input,
        username: isEmail ? null : input.toLowerCase().replace(/\s+/g, '_'),
        email: isEmail ? input : null,
        isBot: false,
        avatar: null,
        status: 'Hors ligne',
      };

      const updated = await addFriend(newFriend);
      setFriends(updated);
      setFriendInput('');
      setShowAddFriend(false);
      Alert.alert(
        language === 'fr' ? '✅ Ami ajouté' : language === 'en' ? '✅ Friend added' : '✅ Amigo añadido',
        language === 'fr' ? `${newFriend.name} a été ajouté à votre liste d'amis !` : language === 'en' ? `${newFriend.name} has been added to your friend list!` : `¡${newFriend.name} ha sido añadido a tu lista de amigos!`
      );
    } catch (e) {
      Alert.alert(
        language === 'fr' ? 'Erreur' : language === 'en' ? 'Error' : 'Error',
        language === 'fr' ? "Impossible d'ajouter cet ami." : language === 'en' ? 'Failed to add this friend.' : 'No se pudo añadir a este amigo.'
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveFriend = (friend) => {
    if (friend.isBot) {
      Alert.alert(
        language === 'fr' ? 'Impossible' : language === 'en' ? 'Impossible' : 'Imposible',
        language === 'fr' ? 'Vous ne pouvez pas supprimer Alex Martin de vos amis.' : language === 'en' ? 'You cannot remove Alex Martin from your friends.' : 'No puedes eliminar a Alex Martin de tus amigos.'
      );
      return;
    }
    Alert.alert(
      language === 'fr' ? "Supprimer l'ami" : language === 'en' ? 'Remove friend' : 'Eliminar amigo',
      language === 'fr' ? `Voulez-vous retirer ${friend.name} de vos amis ?` : language === 'en' ? `Do you want to remove ${friend.name} from your friends?` : `¿Quieres eliminar a ${friend.name} de tus amigos?`,
      [
        { text: language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'Cancelar', style: 'cancel' },
        {
          text: language === 'fr' ? 'Supprimer' : language === 'en' ? 'Remove' : 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const updated = await removeFriend(friend.id);
            if (updated) setFriends(updated);
          },
        },
      ]
    );
  };

  const filteredFriends = friends.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      f.name?.toLowerCase().includes(q) ||
      f.email?.toLowerCase().includes(q) ||
      f.username?.toLowerCase().includes(q)
    );
  });

  const renderFriendCard = ({ item }) => (
    <View style={styles.friendCard}>
      {/* Avatar */}
      <View style={[styles.friendAvatar, item.isBot && styles.botAvatar]}>
        {item.isBot ? (
          <Text style={styles.avatarEmoji}>{item.avatar}</Text>
        ) : (
          <Ionicons name="person" size={26} color={colors.primary} />
        )}
      </View>

      {/* Infos */}
      <View style={styles.friendInfo}>
        <View style={styles.friendNameRow}>
          <Text style={styles.friendName}>{item.name}</Text>
          {item.isBot && (
            <View style={styles.botBadge}>
              <Text style={styles.botBadgeText}>{language === 'fr' ? 'IA' : language === 'en' ? 'AI' : 'IA'}</Text>
            </View>
          )}
        </View>
        {item.username && (
          <Text style={styles.friendUsername}>@{item.username}</Text>
        )}
        {item.email && !item.isBot && (
          <Text style={styles.friendEmail}>{item.email}</Text>
        )}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, item.status === 'En ligne' ? styles.statusOnline : styles.statusOffline]} />
          <Text style={styles.statusText}>
            {item.status === 'En ligne'
              ? (language === 'fr' ? 'En ligne' : language === 'en' ? 'Online' : 'En línea')
              : (language === 'fr' ? 'Hors ligne' : language === 'en' ? 'Offline' : 'Desconectado')}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Chat', { friend: item })}
        >
          <Ionicons name="chatbubble" size={20} color={colors.primary} />
        </TouchableOpacity>
        {!item.isBot && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleRemoveFriend(item)}
          >
            <Ionicons name="person-remove-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t.friends.title}</Text>
          <Text style={styles.headerSub}>{friends.length} ami{friends.length > 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addIconBtn} onPress={() => setShowAddFriend(true)}>
          <Ionicons name="person-add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={language === 'fr' ? 'Rechercher un ami...' : language === 'en' ? 'Search for a friend...' : 'Buscar un amigo...'}
          placeholderTextColor={colors.textTertiary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Liste d'amis */}
      {filteredFriends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={70} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>
            {searchQuery
              ? (language === 'fr' ? 'Aucun ami trouvé' : language === 'en' ? 'No friends found' : 'No se encontraron amigos')
              : t.friends.noFriends}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? (language === 'fr' ? 'Essayez avec un autre critère' : language === 'en' ? 'Try another search term' : 'Inténtalo con otro término de búsqueda')
              : (language === 'fr' ? 'Ajoutez vos amis pour partager vos programmes !' : language === 'en' ? 'Add your friends to share your programs!' : '¡Añade a tus amigos para compartir tus programas!')}
          </Text>
          {!searchQuery && (
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddFriend(true)}>
              <Ionicons name="person-add" size={18} color={colors.cardBackground} />
              <Text style={styles.emptyBtnText}>{t.friends.addFriend}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriendCard}
          contentContainerStyle={styles.list}
        />
      )}

      {/* FAB message */}
      {friends.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (friends.length === 1) {
              navigation.navigate('Chat', { friend: friends[0] });
            } else {
              setShowNewMessageModal(true);
            }
          }}
        >
          <Ionicons name="chatbubble" size={26} color={colors.cardBackground} />
        </TouchableOpacity>
      )}

      {/* Modal : ajouter un ami */}
      <Modal
        visible={showAddFriend}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddFriend(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.friends.addFriend}</Text>
              <TouchableOpacity onPress={() => { setShowAddFriend(false); setFriendInput(''); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              {language === 'fr' ? 'Par nom, pseudo ou adresse email' : language === 'en' ? 'By name, username or email address' : 'Por nombre, usuario o correo electrónico'}
            </Text>

            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.modalInput}
                value={friendInput}
                onChangeText={setFriendInput}
                placeholder={language === 'fr' ? 'Ex : thomas, @tom_fit, tom@mail.com' : language === 'en' ? 'E.g. thomas, @tom_fit, tom@mail.com' : 'Ej: thomas, @tom_fit, tom@mail.com'}
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoFocus
                onSubmitEditing={handleAddFriend}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => { setShowAddFriend(false); setFriendInput(''); }}
              >
                <Text style={styles.modalBtnSecondaryText}>{language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'Cancelar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, isAdding && { opacity: 0.6 }]}
                onPress={handleAddFriend}
                disabled={isAdding}
              >
                <Ionicons name="person-add" size={16} color={colors.cardBackground} />
                <Text style={styles.modalBtnPrimaryText}>{isAdding
                  ? (language === 'fr' ? 'Ajout...' : language === 'en' ? 'Adding...' : 'Añadiendo...')
                  : (language === 'fr' ? 'Ajouter' : language === 'en' ? 'Add' : 'Añadir')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal : choisir avec qui démarrer une conversation */}
      <Modal
        visible={showNewMessageModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{language === 'fr' ? 'Nouveau message' : language === 'en' ? 'New message' : 'Nuevo mensaje'}</Text>
              <TouchableOpacity onPress={() => setShowNewMessageModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>{language === 'fr' ? 'Sélectionnez un ami' : language === 'en' ? 'Select a friend' : 'Selecciona un amigo'}</Text>
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalFriendRow}
                  onPress={() => {
                    setShowNewMessageModal(false);
                    navigation.navigate('Chat', { friend: item });
                  }}
                >
                  <View style={[styles.friendAvatarSm, item.isBot && styles.botAvatarSm]}>
                    {item.isBot
                      ? <Text style={{ fontSize: 20 }}>{item.avatar}</Text>
                      : <Ionicons name="person" size={20} color={colors.primary} />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>{item.name}</Text>
                    {item.username && <Text style={styles.friendUsername}>@{item.username}</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  headerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  addIconBtn: { padding: 8 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.text },

  list: { padding: 15 },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botAvatar: { backgroundColor: colors.primary + '30' },
  avatarEmoji: { fontSize: 26 },
  friendAvatarSm: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  botAvatarSm: { backgroundColor: colors.primary + '30' },

  friendInfo: { flex: 1 },
  friendNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  friendName: { fontSize: 15, fontWeight: '700', color: colors.text },
  botBadge: { backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  botBadgeText: { fontSize: 10, fontWeight: 'bold', color: colors.cardBackground },
  friendUsername: { fontSize: 13, color: colors.primary, fontWeight: '500', marginBottom: 2 },
  friendEmail: { fontSize: 12, color: colors.textSecondary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusOnline: { backgroundColor: '#4CAF50' },
  statusOffline: { backgroundColor: colors.textTertiary },
  statusText: { fontSize: 11, color: colors.textSecondary },

  friendActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 8, borderRadius: 20 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 20, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 12,
    marginTop: 25,
  },
  emptyBtnText: { color: colors.cardBackground, fontSize: 15, fontWeight: 'bold' },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 25,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  modalSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 20,
  },
  modalInput: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 15,
    borderRadius: 12,
  },
  modalBtnSecondary: { backgroundColor: colors.buttonSecondary, borderWidth: 1, borderColor: colors.border },
  modalBtnSecondaryText: { color: colors.buttonSecondaryText, fontWeight: '600', fontSize: 15 },
  modalBtnPrimary: { backgroundColor: colors.primary },
  modalBtnPrimaryText: { color: colors.cardBackground, fontWeight: 'bold', fontSize: 15 },
  modalFriendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});

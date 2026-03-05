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

export default function FriendsScreen() {
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
      Alert.alert('Champ vide', 'Veuillez entrer un nom, pseudo ou email.');
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
      Alert.alert('✅ Ami ajouté', `${newFriend.name} a été ajouté à votre liste d'amis !`);
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'ajouter cet ami.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveFriend = (friend) => {
    if (friend.isBot) {
      Alert.alert('Impossible', 'Vous ne pouvez pas supprimer Alex Martin de vos amis.');
      return;
    }
    Alert.alert(
      'Supprimer l\'ami',
      `Voulez-vous retirer ${friend.name} de vos amis ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
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
              <Text style={styles.botBadgeText}>IA</Text>
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
          <Text style={styles.statusText}>{item.status || 'Hors ligne'}</Text>
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
          <Text style={styles.headerTitle}>Mes Amis</Text>
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
          placeholder="Rechercher un ami..."
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
            {searchQuery ? 'Aucun ami trouvé' : 'Aucun ami pour le moment'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Essayez avec un autre critère'
              : 'Ajoutez vos amis pour partager vos programmes !'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddFriend(true)}>
              <Ionicons name="person-add" size={18} color={colors.cardBackground} />
              <Text style={styles.emptyBtnText}>Ajouter un ami</Text>
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
              <Text style={styles.modalTitle}>Ajouter un ami</Text>
              <TouchableOpacity onPress={() => { setShowAddFriend(false); setFriendInput(''); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Par nom, pseudo ou adresse email</Text>

            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.modalInput}
                value={friendInput}
                onChangeText={setFriendInput}
                placeholder="Ex : thomas, @tom_fit, tom@mail.com"
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
                <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, isAdding && { opacity: 0.6 }]}
                onPress={handleAddFriend}
                disabled={isAdding}
              >
                <Ionicons name="person-add" size={16} color={colors.cardBackground} />
                <Text style={styles.modalBtnPrimaryText}>{isAdding ? 'Ajout...' : 'Ajouter'}</Text>
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
              <Text style={styles.modalTitle}>Nouveau message</Text>
              <TouchableOpacity onPress={() => setShowNewMessageModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Sélectionnez un ami</Text>
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

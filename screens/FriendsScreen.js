import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getCurrentUser } from '../utils/auth';

export default function FriendsScreen() {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    // TODO: Charger les amis depuis la base de données
    // Pour l'instant, on utilise des données de test
    setFriends([]);
  };

  const handleAddFriend = async () => {
    if (!friendEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un email');
      return;
    }

    // Vérifier que ce n'est pas son propre email
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.email === friendEmail.trim()) {
      Alert.alert('Erreur', 'Vous ne pouvez pas vous ajouter vous-même');
      return;
    }

    // TODO: Implémenter l'ajout d'ami (vérifier si l'utilisateur existe, envoyer une demande, etc.)
    Alert.alert(
      'Fonctionnalité à venir',
      'L\'ajout d\'amis sera bientôt disponible. Vous pourrez rechercher et ajouter vos amis par email.',
      [{ text: 'OK' }]
    );

    setFriendEmail('');
    setShowAddFriend(false);
  };

  const filteredFriends = friends.filter((friend) =>
    friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Amis</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddFriend(true)}
        >
          <Ionicons name="person-add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showAddFriend && (
        <View style={styles.addFriendCard}>
          <Text style={styles.addFriendTitle}>Ajouter un ami</Text>
          <TextInput
            style={styles.input}
            value={friendEmail}
            onChangeText={setFriendEmail}
            placeholder="Email de votre ami"
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.addFriendActions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setShowAddFriend(false);
                setFriendEmail('');
              }}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.addButton]}
              onPress={handleAddFriend}
            >
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher un ami..."
          placeholderTextColor={colors.textTertiary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {filteredFriends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'Aucun ami trouvé' : 'Aucun ami pour le moment'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Essayez avec un autre nom ou email'
              : 'Ajoutez vos amis pour suivre leurs progrès et partager vos entraînements'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddFriend(true)}
            >
              <Ionicons name="person-add" size={20} color={colors.cardBackground} />
              <Text style={styles.emptyButtonText}>Ajouter un ami</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.friendCard}>
              <View style={styles.friendAvatar}>
                <Ionicons name="person" size={30} color={colors.primary} />
              </View>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.name || item.email}</Text>
                {item.name && (
                  <Text style={styles.friendEmail}>{item.email}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.friendAction}>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.friendsList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    padding: 8,
  },
  addFriendCard: {
    backgroundColor: colors.cardBackground,
    margin: 15,
    padding: 20,
    borderRadius: 15,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addFriendTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: colors.text,
    marginBottom: 15,
  },
  addFriendActions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.buttonSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.buttonSecondaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  addButtonText: {
    color: colors.cardBackground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    margin: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: colors.text,
  },
  clearButton: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
  },
  emptyButtonText: {
    color: colors.cardBackground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendsList: {
    padding: 15,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  friendEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  friendAction: {
    padding: 5,
  },
});


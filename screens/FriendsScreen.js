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
import { getCurrentUser, getUserByUsername, getUserByEmail, searchUsers } from '../utils/auth';

export default function FriendsScreen() {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    // TODO: Charger les amis depuis la base de données
    // Pour l'instant, on utilise des données de test
    setFriends([]);
  };

  const handleSearchFriend = async () => {
    if (!friendSearch.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un username, un email ou un nom');
      return;
    }

    setIsSearching(true);
    try {
      const currentUser = await getCurrentUser();
      const searchTerm = friendSearch.trim();
      
      // Utiliser la nouvelle fonction de recherche qui permet la recherche partielle
      const foundUsers = await searchUsers(searchTerm);

      if (!foundUsers || foundUsers.length === 0) {
        Alert.alert('Utilisateur non trouvé', 'Aucun utilisateur trouvé avec ce critère de recherche');
        setSearchResults([]);
        return;
      }

      // Filtrer les résultats pour exclure l'utilisateur actuel et les amis existants
      const filteredUsers = foundUsers
        .filter(user => {
          // Exclure l'utilisateur actuel
          if (currentUser && (currentUser.id === user.id || currentUser.email === user.email)) {
            return false;
          }
          // Exclure les amis déjà ajoutés
          return !friends.some(f => f.id === user.id);
        })
        .map(user => ({
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          email: user.email,
          username: user.username,
        }));

      if (filteredUsers.length === 0) {
        if (foundUsers.some(u => currentUser && (currentUser.id === u.id || currentUser.email === u.email))) {
          Alert.alert('Erreur', 'Vous ne pouvez pas vous ajouter vous-même');
        } else {
          Alert.alert('Information', 'Tous les utilisateurs trouvés sont déjà dans votre liste d\'amis');
        }
        setSearchResults([]);
        return;
      }

      // Afficher les résultats de recherche
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching for friend:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la recherche');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (user) => {
    // TODO: Implémenter l'ajout d'ami (envoyer une demande, etc.)
    // Pour l'instant, on ajoute directement à la liste locale
    const newFriend = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
    };
    
    setFriends([...friends, newFriend]);
    setSearchResults([]);
    setFriendSearch('');
    setShowAddFriend(false);
    Alert.alert('Succès', `${user.name || user.username || user.email} a été ajouté à vos amis`);
  };

  const filteredFriends = friends.filter((friend) =>
    friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <Text style={styles.addFriendTitle}>Rechercher un ami</Text>
          <Text style={styles.addFriendSubtitle}>Recherchez par username, email, prénom ou nom</Text>
          <View style={styles.searchInputContainer}>
            <Ionicons name="at" size={20} color={colors.textSecondary} style={styles.searchInputIcon} />
            <TextInput
              style={styles.input}
              value={friendSearch}
              onChangeText={setFriendSearch}
              placeholder="Username, email, prénom ou nom"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              onSubmitEditing={handleSearchFriend}
            />
          </View>
          <View style={styles.addFriendActions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setShowAddFriend(false);
                setFriendSearch('');
                setSearchResults([]);
              }}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.searchButton, isSearching && styles.buttonDisabled]}
              onPress={handleSearchFriend}
              disabled={isSearching}
            >
              {isSearching ? (
                <Text style={styles.searchButtonText}>Recherche...</Text>
              ) : (
                <>
                  <Ionicons name="search" size={18} color={colors.cardBackground} />
                  <Text style={styles.searchButtonText}>Rechercher</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <Text style={styles.searchResultsTitle}>
                {searchResults.length === 1 ? 'Résultat trouvé :' : `${searchResults.length} résultats trouvés :`}
              </Text>
              {searchResults.map((user) => (
                <View key={user.id} style={styles.searchResultCard}>
                  <View style={styles.friendAvatar}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{user.name || user.email}</Text>
                    {user.username && (
                      <Text style={styles.friendUsername}>@{user.username}</Text>
                    )}
                    {user.email && user.name && (
                      <Text style={styles.friendEmail}>{user.email}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.button, styles.addButtonSmall]}
                    onPress={() => handleAddFriend(user)}
                  >
                    <Ionicons name="person-add" size={18} color={colors.cardBackground} />
                    <Text style={styles.addButtonSmallText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
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
              ? 'Essayez avec un autre nom, username ou email'
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
                {item.username && (
                  <Text style={styles.friendUsername}>@{item.username}</Text>
                )}
                {item.name && item.email && (
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
  addFriendSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchInputIcon: {
    marginRight: 10,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
  },
  searchButtonText: {
    color: colors.cardBackground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  searchResultsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: colors.primary,
  },
  addButtonSmallText: {
    color: colors.cardBackground,
    fontSize: 14,
    fontWeight: '600',
  },
  friendUsername: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
});


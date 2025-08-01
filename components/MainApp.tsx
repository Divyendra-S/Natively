import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/hooks/useAuth";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export function MainApp() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Welcome to Natively!</ThemedText>
      <ThemedText style={styles.email}>Signed in as: {user?.email}</ThemedText>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
    lineHeight: 40, // Increased from default to prevent text cutoff
  },
  email: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 40,
  },
  signOutButton: {
    backgroundColor: "#A855F7",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  signOutText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
});

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';

const MobileAppShell = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SaaS Mobile</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardText}>Your dashboard is ready.</Text>
        </View>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>View Reports</Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={styles.tabBar}>
        <Text>Home</Text>
        <Text>Profile</Text>
        <Text>Settings</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { height: 60, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  card: { padding: 20, backgroundColor: '#f9f9f9', borderRadius: 10, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  tabBar: { height: 60, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderColor: '#eee' }
});

export default MobileAppShell;

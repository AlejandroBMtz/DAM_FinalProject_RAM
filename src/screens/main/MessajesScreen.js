import { Text, View, StyleSheet } from 'react-native';

export default function mensajes() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Messages screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1275ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
});
import { Text, View, StyleSheet } from 'react-native';

export default function tickets() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tickets screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9cc3f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
});
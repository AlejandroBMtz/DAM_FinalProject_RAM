import { Text, View, StyleSheet } from 'react-native';

export default function crear() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Create screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4e98f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
});
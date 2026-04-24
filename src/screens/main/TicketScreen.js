import { Text, View, StyleSheet } from 'react-native';

export default function TicketScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ticket screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#b51ac9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
});
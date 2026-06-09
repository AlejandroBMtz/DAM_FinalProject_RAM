import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import RegisterInfoScreen from '../screens/auth/RegisterInfoScreen';
import TermsConditionsScreen from '../screens/settings/TermsConditionsScreen';
import PrivacyPolicyScreen from '../screens/settings/PrivacyPolicyScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="RegisterInfo" component={RegisterInfoScreen} />
      <Stack.Screen name="TermsScreen" component={TermsConditionsScreen} />
      <Stack.Screen name="PrivacyScreen" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
}

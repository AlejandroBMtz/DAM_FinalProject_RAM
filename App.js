import { useEffect, React } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import * as NavigationBar from 'expo-navigation-bar';


export default function App() {
  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
  }, []);

  return <AppNavigator />;
}
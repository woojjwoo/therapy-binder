import { Tabs } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Fonts } from '../../src/theme/typography';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.earthBrown,
        tabBarInactiveTintColor: Colors.barkBrown + '80',
        tabBarStyle: {
          backgroundColor: Colors.cream,
          borderTopColor: Colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.sans,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Sessions', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="patterns"
        options={{ title: 'Patterns', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="new-session"
        options={{ href: null }}  // hidden from tab bar, pushed modally
      />
    </Tabs>
  );
}

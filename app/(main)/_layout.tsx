import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { Colors } from '../../src/theme/colors';
import { Fonts } from '../../src/theme/typography';

export default function MainLayout() {
  usePreventScreenCapture();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
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
        options={{
          title: 'Sessions',
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="patterns"
        options={{
          title: 'Patterns',
          tabBarIcon: ({ color, size }) => <Ionicons name="analytics-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="new-session"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="session/[id]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="paywall"
        options={{ href: null }}
      />
    </Tabs>
  );
}

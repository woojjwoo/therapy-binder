import { Text } from 'react-native';
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
        options={{
          title: 'Sessions',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📓</Text>,
        }}
      />
      <Tabs.Screen
        name="patterns"
        options={{
          title: 'Patterns',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📈</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
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

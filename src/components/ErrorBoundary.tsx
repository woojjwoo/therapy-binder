import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
    router.replace('/');
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.icon}>!</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>This section ran into a problem.</Text>

        <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
          <Text style={styles.buttonText}>Restart App</Text>
        </TouchableOpacity>

        {__DEV__ && this.state.error && (
          <Text style={styles.details}>
            {this.state.error.toString()}
          </Text>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 48,
    fontFamily: Fonts.serifBold,
    color: Colors.earthBrown,
    marginBottom: 16,
    width: 64,
    height: 64,
    lineHeight: 64,
    textAlign: 'center',
    borderRadius: 32,
    borderWidth: 3,
    borderColor: Colors.earthBrown,
    overflow: 'hidden',
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.xl,
    color: Colors.earthBrown,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.barkBrown,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: Colors.earthBrown,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buttonText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
  details: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
    marginTop: 24,
    padding: 12,
    backgroundColor: Colors.creamDark,
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: '100%',
  },
});

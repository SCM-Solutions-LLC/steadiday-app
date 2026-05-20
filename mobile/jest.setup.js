/* eslint-disable no-undef */
// Jest setup file
import '@testing-library/jest-native/extend-expect';

// Mock React Native modules
global.jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
global.jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock Expo SecureStore
global.jest.mock('expo-secure-store', () => ({
  getItemAsync: global.jest.fn(),
  setItemAsync: global.jest.fn(),
  deleteItemAsync: global.jest.fn(),
}));

// Mock Expo FileSystem
global.jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://document/',
  writeAsStringAsync: global.jest.fn(),
}));

// Mock Expo Sharing
global.jest.mock('expo-sharing', () => ({
  shareAsync: global.jest.fn(),
}));

// Mock Expo Notifications
global.jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: global.jest.fn(),
  setNotificationCategoryAsync: global.jest.fn(),
  setNotificationHandler: global.jest.fn(),
  AndroidNotificationPriority: {
    HIGH: 'high',
  },
  SchedulableTriggerInputTypes: {
    CALENDAR: 'calendar',
    DATE: 'date',
  },
}));

// Mock navigation
global.jest.mock('@react-navigation/native', () => {
  const actual = global.jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: global.jest.fn(),
      goBack: global.jest.fn(),
      reset: global.jest.fn(),
    }),
  };
});

// Silence console errors in tests
global.console = {
  ...console,
  error: global.jest.fn(),
  warn: global.jest.fn(),
};

// Mock timers
global.jest.useFakeTimers();

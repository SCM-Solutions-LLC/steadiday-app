import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";

/**
 * Custom hook to monitor network connectivity status
 * Returns true if connected, false if offline
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      // state.isConnected can be null initially, so default to true
      setIsConnected(state.isConnected ?? true);
    });

    // Check initial state
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? true);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return isConnected;
}

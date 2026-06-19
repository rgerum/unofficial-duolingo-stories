import * as Network from "expo-network";

export function useNetworkStatus() {
  const networkState = Network.useNetworkState();

  return {
    networkState,
    isOffline:
      networkState.isConnected === false ||
      networkState.isInternetReachable === false,
  };
}

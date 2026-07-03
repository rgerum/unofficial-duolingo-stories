import React from "react";
import { AppState as NativeAppState } from "react-native";
import * as Network from "expo-network";

type NetworkStatus = {
  networkState: Network.NetworkState;
  isOffline: boolean;
};

const NetworkStatusContext = React.createContext<NetworkStatus>({
  networkState: {},
  isOffline: false,
});

function getIsOffline(networkState: Network.NetworkState): boolean {
  return (
    networkState.isConnected === false ||
    networkState.isInternetReachable === false
  );
}

export function NetworkStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [networkState, setNetworkState] = React.useState<Network.NetworkState>(
    {},
  );

  const refreshNetworkState = React.useCallback(() => {
    void Network.getNetworkStateAsync()
      .then(setNetworkState)
      .catch(() => {
        // Keep the last known state if the platform probe fails.
      });
  }, []);

  React.useEffect(() => {
    refreshNetworkState();
    const networkSubscription = Network.addNetworkStateListener(setNetworkState);
    const appStateSubscription = NativeAppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") refreshNetworkState();
      },
    );

    return () => {
      networkSubscription.remove();
      appStateSubscription.remove();
    };
  }, [refreshNetworkState]);

  const value = React.useMemo(
    () => ({
      networkState,
      isOffline: getIsOffline(networkState),
    }),
    [networkState],
  );

  return React.createElement(
    NetworkStatusContext.Provider,
    { value },
    children,
  );
}

export function useNetworkStatus() {
  return React.useContext(NetworkStatusContext);
}

import "./src/global.css";
import { type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { queryClient } from "@common/lib/queryClient";
import { AuthProvider } from "@common/auth";
import { useAuth } from "@features/auth";
import { AppNavigator } from "@navigation/index";

function AuthProviderWrapper({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthProvider value={auth}>{children}</AuthProvider>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProviderWrapper>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProviderWrapper>
    </QueryClientProvider>
  );
}

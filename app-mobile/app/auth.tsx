import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { authClient, notifyAuthChanged } from "../src/auth-client";
import { useAppState } from "../src/app-state";
import { Button } from "../src/components/Button";
import { colors } from "../src/theme";

type AuthMode = "signin" | "register";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,20}$/;
const EMAIL_PATTERN = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w+)+$/;

export default function AuthScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const authMode: AuthMode = mode === "register" ? "register" : "signin";
  const isRegister = authMode === "register";
  const { hasAcceptedDisclaimer, setHasSeenWelcome, courseShort } =
    useAppState();

  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const finishSignedIn = React.useCallback(async () => {
    await setHasSeenWelcome(true);
    router.dismissAll();
    if (!hasAcceptedDisclaimer) {
      router.replace(`/disclaimer?next=${courseShort ? "tabs" : "onboarding"}`);
      return;
    }
    router.replace(courseShort ? "/(tabs)" : "/onboarding");
  }, [courseShort, hasAcceptedDisclaimer, router, setHasSeenWelcome]);

  async function submit() {
    setError(null);
    setMessage(null);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!USERNAME_PATTERN.test(cleanUsername)) {
      setError(
        "Username must be 3-20 characters and can only contain letters, numbers, underscores, and dashes.",
      );
      return;
    }
    if (isRegister && !EMAIL_PATTERN.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsPending(true);
    try {
      if (isRegister) {
        const { error: signUpError } = await authClient.signUp.email({
          name: cleanUsername,
          email: cleanEmail,
          password,
          username: cleanUsername,
          displayUsername: cleanUsername,
        });
        if (signUpError) {
          setError(signUpError.message ?? "Registration failed.");
          return;
        }
        setMessage(
          "Your account has been registered. Check your email for the verification link before signing in.",
        );
        setPassword("");
        return;
      }

      const { error: signInError } = await authClient.signIn.username({
        username: cleanUsername,
        password,
      });
      if (signInError) {
        setError(signInError.message ?? "Sign in failed.");
        return;
      }
      notifyAuthChanged();
      await finishSignedIn();
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setIsPending(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setError(null);
    setMessage(null);
    router.setParams({ mode: nextMode });
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{isRegister ? "Create account" : "Sign in"}</Text>
          <Text style={styles.body}>
            This is for your Duostories account, not your Duolingo account.
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}
          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={colors.disabled}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              returnKeyType="next"
              editable={!isPending}
            />
            {isRegister && (
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={colors.disabled}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                editable={!isPending}
              />
            )}
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.disabled}
              secureTextEntry
              textContentType={isRegister ? "newPassword" : "password"}
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
              editable={!isPending}
            />
          </View>

          <Button
            title={isRegister ? "Create account" : "Sign in"}
            onPress={() => void submit()}
            disabled={isPending}
          />
          {isPending && <ActivityIndicator color={colors.blue} style={styles.spinner} />}

          <Pressable
            accessibilityRole="button"
            onPress={() => switchMode(isRegister ? "signin" : "register")}
            style={styles.switchMode}
          >
            <Text style={styles.switchText}>
              {isRegister
                ? "Already have an account? Sign in"
                : "Don't have an account? Register"}
            </Text>
          </Pressable>

          <Button
            title="Continue without an account"
            variant="secondary"
            onPress={() => {
              void setHasSeenWelcome(true).then(() => {
                router.dismissAll();
                if (!hasAcceptedDisclaimer) {
                  router.replace(
                    `/disclaimer?action=anonymous&next=${
                      courseShort ? "tabs" : "onboarding"
                    }`,
                  );
                  return;
                }
                router.replace(courseShort ? "/(tabs)" : "/onboarding");
              });
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textDim,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  form: {
    gap: 12,
    marginBottom: 16,
  },
  input: {
    minHeight: 52,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 17,
    color: colors.text,
    backgroundColor: "#ffffff",
  },
  error: {
    color: colors.red,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 14,
    textAlign: "center",
  },
  message: {
    color: colors.greenDark,
    backgroundColor: colors.greenLight,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 14,
    textAlign: "center",
  },
  spinner: {
    marginTop: 12,
  },
  switchMode: {
    alignItems: "center",
    paddingVertical: 18,
  },
  switchText: {
    color: colors.blue,
    fontSize: 16,
    fontWeight: "700",
  },
});

import React from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../src/api";
import { captureMobileEventLater } from "../src/analytics";
import {
  authClient,
  notifyAuthChanged,
  prepareAuthBrowser,
} from "../src/auth-client";
import { useAppState } from "../src/app-state";
import { Button } from "../src/components/Button";
import { Text, TextInput } from "../src/components/Text";
import { clearAllProgress, getAllDoneStories } from "../src/storage";
import { colors } from "../src/theme";

type AuthMode = "signin" | "register";
type SocialProviderId = "apple" | "google" | "github" | "discord";

const SOCIAL_PROVIDERS: {
  id: SocialProviderId;
  label: string;
}[] = [
  { id: "apple", label: "Apple" },
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
  { id: "discord", label: "Discord" },
];

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,20}$/;
const EMAIL_PATTERN = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w+)+$/;

export default function AuthScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const authMode: AuthMode = mode === "register" ? "register" : "signin";
  const isRegister = authMode === "register";
  const { hasAcceptedDisclaimer, setHasSeenWelcome, courseShort } =
    useAppState();
  const recordStoryDone = useMutation(api.storyDone.recordStoryDone);
  const enabledSocialProviders = useQuery(
    api.authProviders.getEnabledSocialProviders,
  );
  const socialProviders = React.useMemo(() => {
    const enabled = new Set(enabledSocialProviders ?? []);
    return SOCIAL_PROVIDERS.filter((provider) => enabled.has(provider.id));
  }, [enabledSocialProviders]);
  const primarySocialProvider = React.useMemo(() => {
    const preferredId: SocialProviderId =
      Platform.OS === "ios" ? "apple" : "google";
    return (
      socialProviders.find((provider) => provider.id === preferredId) ??
      socialProviders[0] ??
      null
    );
  }, [socialProviders]);
  const secondarySocialProviders = React.useMemo(
    () =>
      socialProviders.filter(
        (provider) => provider.id !== primarySocialProvider?.id,
      ),
    [primarySocialProvider?.id, socialProviders],
  );

  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const askToImportLocalProgress = React.useCallback((count: number) => {
    captureMobileEventLater("mobile_local_progress_import_prompted", {
      story_count: count,
    });
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        "Copy local progress?",
        `This device has ${count} completed ${
          count === 1 ? "story" : "stories"
        }. Copy this progress into your account?`,
        [
          {
            text: "Not now",
            style: "cancel",
            onPress: () => {
              captureMobileEventLater("mobile_local_progress_import_declined", {
                story_count: count,
              });
              resolve(false);
            },
          },
          {
            text: "Copy progress",
            onPress: () => resolve(true),
          },
        ],
      );
    });
  }, []);

  const importLocalProgress = React.useCallback(async () => {
    const localDoneStories = await getAllDoneStories();
    if (localDoneStories.length === 0) return;

    const shouldImport = await askToImportLocalProgress(
      localDoneStories.length,
    );
    if (!shouldImport) return;

    for (const story of localDoneStories) {
      await recordStoryDone({
        legacyStoryId: story.storyId,
        time: story.time,
      });
    }
    await clearAllProgress();
    captureMobileEventLater("mobile_local_progress_imported", {
      story_count: localDoneStories.length,
    });
  }, [askToImportLocalProgress, recordStoryDone]);

  const finishSignedIn = React.useCallback(async () => {
    await setHasSeenWelcome(true);
    router.dismissAll();
    if (!hasAcceptedDisclaimer) {
      router.replace(`/disclaimer?next=${courseShort ? "tabs" : "onboarding"}`);
      return;
    }
    router.replace(courseShort ? "/(tabs)" : "/onboarding");
  }, [courseShort, hasAcceptedDisclaimer, router, setHasSeenWelcome]);

  const completeSignedIn = React.useCallback(
    async ({
      method,
      provider,
    }: {
      method: "credentials" | "oauth";
      provider?: SocialProviderId;
    }) => {
      captureMobileEventLater("user_signed_in", {
        method,
        provider: provider ?? null,
      });
      notifyAuthChanged();
      try {
        await importLocalProgress();
      } catch {
        captureMobileEventLater("mobile_local_progress_import_failed", {
          provider: provider ?? null,
        });
        Alert.alert(
          "Could not copy progress",
          "Your account is signed in, but local progress could not be copied. Check your connection and try again later.",
        );
      }
      await finishSignedIn();
    },
    [finishSignedIn, importLocalProgress],
  );

  async function signInWithProvider(provider: SocialProviderId) {
    setError(null);
    setMessage(null);
    setIsPending(true);
    captureMobileEventLater("oauth_provider_clicked", {
      provider,
      provider_name: SOCIAL_PROVIDERS.find((item) => item.id === provider)
        ?.label ?? provider,
    });

    try {
      await prepareAuthBrowser();
      const { error: signInError } = await authClient.signIn.social({
        provider,
        callbackURL: "/auth",
        errorCallbackURL: "/auth",
      });
      if (signInError) {
        setError(signInError.message ?? "Social sign in failed.");
        return;
      }

      const sessionResult = await authClient.getSession();
      const session =
        "data" in sessionResult ? (sessionResult.data as unknown) : null;
      if (
        !session ||
        typeof session !== "object" ||
        !("session" in session) ||
        !(session as { session?: { id?: string | null } | null }).session?.id
      ) {
        setError("Social sign in did not complete.");
        return;
      }

      await completeSignedIn({ method: "oauth", provider });
    } catch {
      setError("Social sign in failed. Check your connection and try again.");
    } finally {
      setIsPending(false);
    }
  }

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
        captureMobileEventLater("user_signed_up", {
          method: "credentials",
        });
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
      await completeSignedIn({ method: "credentials" });
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
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
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

          {socialProviders.length > 0 && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {primarySocialProvider && (
                <SocialProviderButton
                  provider={primarySocialProvider.id}
                  label={`Continue with ${primarySocialProvider.label}`}
                  disabled={isPending}
                  onPress={() =>
                    void signInWithProvider(primarySocialProvider.id)
                  }
                  style={styles.primarySocialButton}
                />
              )}

              {secondarySocialProviders.length > 0 && (
                <View style={styles.socialGrid}>
                  {secondarySocialProviders.map((provider) => (
                    <SocialProviderButton
                      key={provider.id}
                      accessibilityLabel={`Continue with ${provider.label}`}
                      provider={provider.id}
                      disabled={isPending}
                      onPress={() => void signInWithProvider(provider.id)}
                      style={styles.secondarySocialButton}
                    />
                  ))}
                </View>
              )}
            </>
          )}

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
            title={"Continue without\nan account"}
            variant="neutral"
            labelStyle={styles.anonymousButtonLabel}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const SOCIAL_BUTTON_EDGE = 4;

function SocialProviderButton({
  provider,
  label,
  accessibilityLabel,
  disabled,
  onPress,
  style,
}: {
  provider: SocialProviderId;
  label?: string;
  accessibilityLabel?: string;
  disabled: boolean;
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.socialButtonWrap, style]}
    >
      {({ pressed }) => (
        <>
          <View
            style={[
              styles.socialButtonEdge,
              disabled && styles.socialButtonEdgeDisabled,
            ]}
          />
          <View
            style={[
              styles.socialButtonFace,
              disabled && styles.socialButtonDisabled,
              {
                transform: [
                  {
                    translateY: pressed && !disabled ? SOCIAL_BUTTON_EDGE : 0,
                  },
                ],
              },
            ]}
          >
            <SocialProviderIcon provider={provider} disabled={disabled} />
            {label ? (
              <Text
                style={[
                  styles.primarySocialButtonText,
                  disabled && styles.socialButtonTextDisabled,
                ]}
              >
                {label}
              </Text>
            ) : null}
          </View>
        </>
      )}
    </Pressable>
  );
}

function SocialProviderIcon({
  provider,
  disabled,
}: {
  provider: SocialProviderId;
  disabled: boolean;
}) {
  if (provider === "google") {
    return (
      <Svg
        width={20}
        height={20}
        viewBox="0 0 18 18"
        style={disabled && styles.socialIconDisabled}
      >
        <Path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
        />
        <Path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.35 0-4.34-1.58-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z"
        />
        <Path
          fill="#FBBC05"
          d="M3.95 10.7A5.41 5.41 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.34 2.82.94 4.03l3.01-2.33z"
        />
        <Path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.59-2.59A8.69 8.69 0 0 0 9 0 9 9 0 0 0 .94 4.97L3.95 7.3C4.66 5.16 6.65 3.58 9 3.58z"
        />
      </Svg>
    );
  }

  const iconName = {
    apple: "apple",
    github: "github",
    discord: "discord",
  }[provider];

  return (
    <FontAwesome5
      name={iconName}
      size={20}
      color={
        disabled
          ? colors.disabled
          : provider === "discord"
            ? "#5865F2"
            : colors.text
      }
      brand
    />
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
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 28,
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
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  primarySocialButton: {
    marginTop: 14,
  },
  socialGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  secondarySocialButton: {
    flex: 1,
  },
  socialButtonWrap: {
    minHeight: 54,
    paddingBottom: SOCIAL_BUTTON_EDGE,
  },
  socialButtonEdge: {
    position: "absolute",
    top: SOCIAL_BUTTON_EDGE,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    backgroundColor: colors.border,
  },
  socialButtonEdgeDisabled: {
    backgroundColor: colors.disabledBackground,
  },
  socialButtonFace: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
  },
  socialButtonDisabled: {
    backgroundColor: colors.disabledBackground,
    borderColor: colors.disabledBackground,
  },
  primarySocialButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  socialButtonTextDisabled: {
    color: colors.disabled,
  },
  socialIconDisabled: {
    opacity: 0.45,
  },
  switchMode: {
    alignItems: "center",
    paddingVertical: 18,
  },
  anonymousButtonLabel: {
    textTransform: "none",
  },
  switchText: {
    color: colors.blue,
    fontSize: 16,
    fontWeight: "700",
  },
});

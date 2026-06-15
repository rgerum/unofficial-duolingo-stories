import React from "react";
import {
  STORAGE_KEYS,
  getBool,
  getString,
  setBool,
  setString,
} from "./storage";

type AppState = {
  ready: boolean;
  hasSeenWelcome: boolean;
  setHasSeenWelcome: (value: boolean) => Promise<void>;
  courseShort: string | null;
  setCourseShort: (short: string) => Promise<void>;
  hideStoryQuestions: boolean;
  setHideStoryQuestions: (value: boolean) => Promise<void>;
};

const AppStateContext = React.createContext<AppState>({
  ready: false,
  hasSeenWelcome: false,
  setHasSeenWelcome: () => Promise.resolve(),
  courseShort: null,
  setCourseShort: () => Promise.resolve(),
  hideStoryQuestions: false,
  setHideStoryQuestions: () => Promise.resolve(),
});

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [hasSeenWelcome, setHasSeenWelcomeState] = React.useState(false);
  const [courseShort, setCourseShortState] = React.useState<string | null>(
    null,
  );
  const [hideStoryQuestions, setHideStoryQuestionsState] =
    React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [welcome, course, hideQuestions] = await Promise.all([
        getBool(STORAGE_KEYS.hasSeenWelcome),
        getString(STORAGE_KEYS.currentCourse),
        getBool(STORAGE_KEYS.hideStoryQuestions),
      ]);
      if (cancelled) return;
      setHasSeenWelcomeState(welcome);
      setCourseShortState(course);
      setHideStoryQuestionsState(hideQuestions);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setHasSeenWelcome = React.useCallback((value: boolean) => {
    setHasSeenWelcomeState(value);
    return setBool(STORAGE_KEYS.hasSeenWelcome, value);
  }, []);

  const setCourseShort = React.useCallback((short: string) => {
    setCourseShortState(short);
    return setString(STORAGE_KEYS.currentCourse, short);
  }, []);

  const setHideStoryQuestions = React.useCallback((value: boolean) => {
    setHideStoryQuestionsState(value);
    return setBool(STORAGE_KEYS.hideStoryQuestions, value);
  }, []);

  const value = React.useMemo(
    () => ({
      ready,
      hasSeenWelcome,
      setHasSeenWelcome,
      courseShort,
      setCourseShort,
      hideStoryQuestions,
      setHideStoryQuestions,
    }),
    [
      ready,
      hasSeenWelcome,
      setHasSeenWelcome,
      courseShort,
      setCourseShort,
      hideStoryQuestions,
      setHideStoryQuestions,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  return React.useContext(AppStateContext);
}

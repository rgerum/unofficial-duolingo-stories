import React from "react";
import {
  STORAGE_KEYS,
  getBool,
  getString,
  getStringArray,
  removeKeys,
  setBool,
  setString,
  setStringArray,
} from "./storage";
import {
  DEFAULT_PLAYBACK_RATE,
  normalizePlaybackRate,
  setAudioPlaybackRate,
} from "./story/audio";

type AppState = {
  ready: boolean;
  hasSeenWelcome: boolean;
  setHasSeenWelcome: (value: boolean) => Promise<void>;
  hasAcceptedDisclaimer: boolean;
  setHasAcceptedDisclaimer: (value: boolean) => Promise<void>;
  courseShort: string | null;
  activeCourseShorts: string[];
  setCourseShort: (short: string) => Promise<void>;
  removeCourseShort: (short: string) => Promise<void>;
  hideStoryQuestions: boolean;
  setHideStoryQuestions: (value: boolean) => Promise<void>;
  playbackRate: number;
  setPlaybackRate: (value: number) => Promise<void>;
  resetToFirstRun: () => Promise<void>;
};

const AppStateContext = React.createContext<AppState>({
  ready: false,
  hasSeenWelcome: false,
  setHasSeenWelcome: () => Promise.resolve(),
  hasAcceptedDisclaimer: false,
  setHasAcceptedDisclaimer: () => Promise.resolve(),
  courseShort: null,
  activeCourseShorts: [],
  setCourseShort: () => Promise.resolve(),
  removeCourseShort: () => Promise.resolve(),
  hideStoryQuestions: false,
  setHideStoryQuestions: () => Promise.resolve(),
  playbackRate: DEFAULT_PLAYBACK_RATE,
  setPlaybackRate: () => Promise.resolve(),
  resetToFirstRun: () => Promise.resolve(),
});

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [hasSeenWelcome, setHasSeenWelcomeState] = React.useState(false);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimerState] =
    React.useState(false);
  const [courseShort, setCourseShortState] = React.useState<string | null>(
    null,
  );
  const [activeCourseShorts, setActiveCourseShortsState] = React.useState<
    string[]
  >([]);
  const [hideStoryQuestions, setHideStoryQuestionsState] =
    React.useState(false);
  const [playbackRate, setPlaybackRateState] = React.useState(
    DEFAULT_PLAYBACK_RATE,
  );

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [
        welcome,
        acceptedDisclaimer,
        course,
        activeCourses,
        hideQuestions,
        storedPlaybackRate,
      ] = await Promise.all([
        getBool(STORAGE_KEYS.hasSeenWelcome),
        getBool(STORAGE_KEYS.hasAcceptedDisclaimer),
        getString(STORAGE_KEYS.currentCourse),
        getStringArray(STORAGE_KEYS.activeCourses),
        getBool(STORAGE_KEYS.hideStoryQuestions),
        getString(STORAGE_KEYS.playbackRate),
      ]);
      if (cancelled) return;
      setHasSeenWelcomeState(welcome);
      setHasAcceptedDisclaimerState(acceptedDisclaimer);
      setCourseShortState(course);
      setActiveCourseShortsState(
        course && !activeCourses.includes(course)
          ? [course, ...activeCourses]
          : activeCourses,
      );
      setHideStoryQuestionsState(hideQuestions);
      const rate = normalizePlaybackRate(
        storedPlaybackRate ?? DEFAULT_PLAYBACK_RATE,
      );
      setAudioPlaybackRate(rate);
      setPlaybackRateState(rate);
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

  const setHasAcceptedDisclaimer = React.useCallback((value: boolean) => {
    setHasAcceptedDisclaimerState(value);
    return setBool(STORAGE_KEYS.hasAcceptedDisclaimer, value);
  }, []);

  const setCourseShort = React.useCallback((short: string) => {
    setCourseShortState(short);
    setActiveCourseShortsState((current) => {
      if (current.includes(short)) return current;
      const next = [short, ...current];
      void setStringArray(STORAGE_KEYS.activeCourses, next);
      return next;
    });
    return setString(STORAGE_KEYS.currentCourse, short);
  }, []);

  const removeCourseShort = React.useCallback(
    async (short: string) => {
      const nextActiveCourses = activeCourseShorts.filter(
        (current) => current !== short,
      );
      const nextCourse =
        courseShort === short ? (nextActiveCourses[0] ?? null) : courseShort;

      setActiveCourseShortsState(nextActiveCourses);
      setCourseShortState(nextCourse);

      await Promise.all([
        setStringArray(STORAGE_KEYS.activeCourses, nextActiveCourses),
        nextCourse
          ? setString(STORAGE_KEYS.currentCourse, nextCourse)
          : removeKeys([STORAGE_KEYS.currentCourse]),
      ]);
    },
    [activeCourseShorts, courseShort],
  );

  const setHideStoryQuestions = React.useCallback((value: boolean) => {
    setHideStoryQuestionsState(value);
    return setBool(STORAGE_KEYS.hideStoryQuestions, value);
  }, []);

  const setPlaybackRate = React.useCallback((value: number) => {
    const rate = normalizePlaybackRate(value);
    setAudioPlaybackRate(rate);
    setPlaybackRateState(rate);
    return setString(STORAGE_KEYS.playbackRate, String(rate));
  }, []);

  const resetToFirstRun = React.useCallback(async () => {
    setHasSeenWelcomeState(false);
    setHasAcceptedDisclaimerState(false);
    setCourseShortState(null);
    setActiveCourseShortsState([]);
    setHideStoryQuestionsState(false);
    setAudioPlaybackRate(DEFAULT_PLAYBACK_RATE);
    setPlaybackRateState(DEFAULT_PLAYBACK_RATE);

    await removeKeys([
      STORAGE_KEYS.hasSeenWelcome,
      STORAGE_KEYS.hasAcceptedDisclaimer,
      STORAGE_KEYS.currentCourse,
      STORAGE_KEYS.activeCourses,
      STORAGE_KEYS.hideStoryQuestions,
      STORAGE_KEYS.playbackRate,
    ]);
  }, []);

  const value = React.useMemo(
    () => ({
      ready,
      hasSeenWelcome,
      setHasSeenWelcome,
      hasAcceptedDisclaimer,
      setHasAcceptedDisclaimer,
      courseShort,
      activeCourseShorts,
      setCourseShort,
      removeCourseShort,
      hideStoryQuestions,
      setHideStoryQuestions,
      playbackRate,
      setPlaybackRate,
      resetToFirstRun,
    }),
    [
      ready,
      hasSeenWelcome,
      setHasSeenWelcome,
      hasAcceptedDisclaimer,
      setHasAcceptedDisclaimer,
      courseShort,
      activeCourseShorts,
      setCourseShort,
      removeCourseShort,
      hideStoryQuestions,
      setHideStoryQuestions,
      playbackRate,
      setPlaybackRate,
      resetToFirstRun,
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

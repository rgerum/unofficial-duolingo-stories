"use client";

import React from "react";

const EDITOR_STORY_PREFERENCES_STORAGE_KEY = "editor_story_preferences";

type StoryEditorPreferencesValue = {
  showHints: boolean;
  setShowHints: React.Dispatch<React.SetStateAction<boolean>>;
  showAudio: boolean;
  setShowAudio: React.Dispatch<React.SetStateAction<boolean>>;
};

const StoryEditorPreferencesContext =
  React.createContext<StoryEditorPreferencesValue | null>(null);

function readInitialPreferences() {
  if (typeof window === "undefined") {
    return {
      showHints: false,
      showAudio: false,
    };
  }

  const raw = window.localStorage.getItem(EDITOR_STORY_PREFERENCES_STORAGE_KEY);
  if (!raw) {
    return {
      showHints: false,
      showAudio: false,
    };
  }

  try {
    const parsed = JSON.parse(raw) as {
      showHints?: boolean;
      showAudio?: boolean;
    };

    return {
      showHints: parsed.showHints === true,
      showAudio: parsed.showAudio === true,
    };
  } catch {
    window.localStorage.removeItem(EDITOR_STORY_PREFERENCES_STORAGE_KEY);
    return {
      showHints: false,
      showAudio: false,
    };
  }
}

export function StoryEditorPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialPreferences = React.useRef(readInitialPreferences());
  const [showHints, setShowHints] = React.useState(
    initialPreferences.current.showHints,
  );
  const [showAudio, setShowAudio] = React.useState(
    initialPreferences.current.showAudio,
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      EDITOR_STORY_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ showHints, showAudio }),
    );
    window.editorShowTranslations = showHints;
    window.editorShowSsml = showAudio;
  }, [showAudio, showHints]);

  const value = React.useMemo(
    () => ({
      showHints,
      setShowHints,
      showAudio,
      setShowAudio,
    }),
    [showAudio, showHints],
  );

  return (
    <StoryEditorPreferencesContext.Provider value={value}>
      {children}
    </StoryEditorPreferencesContext.Provider>
  );
}

export function useStoryEditorPreferences() {
  const context = React.useContext(StoryEditorPreferencesContext);
  if (!context) {
    throw new Error("Story editor preferences context is missing.");
  }
  return context;
}

"use client";

import React, { startTransition } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQuery } from "convex/react";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  BookTextIcon,
  ChevronRightIcon,
  CornerDownLeftIcon,
  DownloadIcon,
  FileTextIcon,
  FolderOpenIcon,
  HouseIcon,
  LanguagesIcon,
  MicIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import Flag from "@/components/ui/flag";
import Input from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import LanguageFlag from "@/components/ui/language-flag";
import { authClient } from "@/lib/auth-client";
import { formatStorySetLabel, matchesStorySearch } from "@/lib/story-search";
import { cn } from "@/lib/utils";
import type {
  CourseProps,
  StoryListDataProps,
} from "@/app/editor/(course)/types";

type PaletteSection = "root" | "editor" | "admin" | "public";
type AdminListSection = "courses" | "languages";
type EditorStoryState = "draft" | "feedback" | "finished" | "published";
type PaletteIcon =
  | "add"
  | "admin"
  | "courses"
  | "docs"
  | "editor"
  | "home"
  | "import"
  | "languages"
  | "profile"
  | "public"
  | "stories"
  | "users"
  | "voices";

type PublicCourseListItem = {
  id: number;
  short: string;
  name: string;
  count: number;
  fromLanguageId: string;
  from_language_name: string;
  learningLanguageId: string;
  learning_language_name: string;
};

type PublicCourseStory = {
  id: number;
  name: string;
  image: string;
  set_id: number;
  set_index: number;
};

type PublicCoursePageData = {
  short: string;
  count: number;
  from_language_name: string;
  learning_language_name: string;
  learningLanguageId: string;
  stories: PublicCourseStory[];
} | null;

type AdminLanguageItem = {
  id: number;
  name: string;
  short: string;
  flag: number;
  flag_file: string;
  speaker: string;
  rtl: boolean;
};

type AdminCourseItem = {
  id: number;
  learning_language: number;
  from_language: number;
  public: boolean;
  official: boolean;
  name: string | null;
  about: string | null;
  conlang: boolean;
  short: string | null;
  tags: string[];
};

type PaletteFlag = {
  flag: number;
  flag_file: string;
  short: string;
};

type AdminCourseData = {
  courses: AdminCourseItem[];
  languages: AdminLanguageItem[];
};

type PaletteItem = {
  id: string;
  kind:
    | "admin-add"
    | "admin-overview"
    | "admin-course"
    | "admin-list"
    | "admin-language"
    | "admin-route"
    | "course"
    | "course-action"
    | "course-overview"
    | "editor-overview"
    | "public-course"
    | "public-course-overview"
    | "public-overview"
    | "public-story"
    | "section"
    | "story";
  label: string;
  subtitle: string;
  meta?: string;
  searchable?: boolean;
  presentation?: "overview";
  course?: CourseProps;
  flagData?: PaletteFlag;
  href?: string;
  icon?: PaletteIcon;
  adminCourse?: AdminCourseItem;
  adminLanguage?: AdminLanguageItem;
  publicCourse?: PublicCourseListItem;
  publicStory?: PublicCourseStory;
  section?: Exclude<PaletteSection, "root">;
  story?: StoryListDataProps;
};

export default function EditorCommandPalette({
  canAdmin: canAdminProp,
}: {
  canAdmin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const sessionUser = session?.user as { role?: string } | undefined;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const scrollViewportRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [shortcutLabel, setShortcutLabel] = React.useState("Ctrl");
  const [selectedSection, setSelectedSection] =
    React.useState<PaletteSection>("root");
  const [selectedAdminList, setSelectedAdminList] =
    React.useState<AdminListSection | null>(null);
  const [selectedCourseKey, setSelectedCourseKey] = React.useState<
    string | null
  >(null);
  const [selectedPublicCourseKey, setSelectedPublicCourseKey] = React.useState<
    string | null
  >(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const previousPathnameRef = React.useRef(pathname);
  const pathSegments = React.useMemo(
    () => pathname.split("/").filter(Boolean),
    [pathname],
  );
  const isEditorRoute = pathSegments[0] === "editor";
  const isAdminRoute = pathSegments[0] === "admin";
  const currentCourseSegment =
    isEditorRoute && pathSegments[1] === "course"
      ? (pathSegments[2] ?? null)
      : null;
  const isEditorStoryRoute =
    isEditorRoute &&
    (pathSegments[1] === "story" ||
      (pathSegments[1] === "course" && pathSegments[3] === "story"));
  const currentAdminList =
    isAdminRoute &&
    (pathSegments[1] === "languages" || pathSegments[1] === "courses")
      ? (pathSegments[1] as AdminListSection)
      : null;
  const rootSegment = pathSegments[0] ?? null;
  const currentPublicCourseSegment =
    !isEditorRoute &&
    !isAdminRoute &&
    rootSegment !== null &&
    rootSegment.includes("-") &&
    rootSegment !== "story" &&
    rootSegment !== "docs" &&
    rootSegment !== "profile" &&
    rootSegment !== "faq" &&
    rootSegment !== "privacy_policy" &&
    rootSegment !== "learn" &&
    rootSegment !== "auth"
      ? rootSegment
      : null;
  const showTrigger = !isEditorStoryRoute;
  const canAdmin =
    canAdminProp === true || isAdminRoute || sessionUser?.role === "admin";
  const sidebarData = useQuery(api.editorRead.getEditorSidebarData, {});
  const courses = (sidebarData?.courses ?? []) as CourseProps[];
  const publicCourseList = useQuery(api.landing.getPublicCourseList, {}) as
    | PublicCourseListItem[]
    | undefined;
  const publicCourses = publicCourseList ?? [];
  const adminLanguageList = useQuery(
    api.adminData.getAdminLanguages,
    canAdmin &&
      open &&
      (selectedAdminList === "languages" || currentAdminList === "languages")
      ? {}
      : "skip",
  ) as AdminLanguageItem[] | undefined;
  const adminCourseData = useQuery(
    api.adminData.getAdminCourses,
    canAdmin &&
      open &&
      (selectedAdminList === "courses" || currentAdminList === "courses")
      ? {}
      : "skip",
  ) as AdminCourseData | undefined;
  const adminLanguages = adminLanguageList ?? [];
  const adminCourses = adminCourseData?.courses ?? [];

  let currentCourse: CourseProps | null = null;
  for (const course of courses) {
    if (
      (currentCourseSegment !== null &&
        course.short === currentCourseSegment) ||
      String(course.id) === currentCourseSegment
    ) {
      currentCourse = course;
      break;
    }
  }

  let currentPublicCourse: PublicCourseListItem | null = null;
  for (const course of publicCourses) {
    if (course.short === currentPublicCourseSegment) {
      currentPublicCourse = course;
      break;
    }
  }

  let selectedCourse: CourseProps | null = null;
  for (const course of courses) {
    if (getCourseKey(course) === selectedCourseKey) {
      selectedCourse = course;
      break;
    }
  }

  let selectedPublicCourse: PublicCourseListItem | null = null;
  for (const course of publicCourses) {
    if (getPublicCourseKey(course) === selectedPublicCourseKey) {
      selectedPublicCourse = course;
      break;
    }
  }

  const storyCourse =
    open && selectedSection === "editor" && selectedCourse
      ? selectedCourse
      : open &&
          selectedSection === "editor" &&
          currentCourse &&
          selectedCourseKey !== null
        ? currentCourse
        : null;
  const storyCourseIdentifier = storyCourse
    ? getCourseIdentifier(storyCourse)
    : null;
  const storyResults = useQuery(
    api.editorRead.getEditorStoriesByCourseLegacyId,
    storyCourseIdentifier ? { identifier: storyCourseIdentifier } : "skip",
  ) as StoryListDataProps[] | undefined;
  const publicStoryCourse =
    open && selectedSection === "public" && selectedPublicCourse
      ? selectedPublicCourse
      : open &&
          selectedSection === "public" &&
          currentPublicCourse &&
          selectedPublicCourseKey !== null
        ? currentPublicCourse
        : null;
  const publicCoursePageData = useQuery(
    api.landing.getPublicCoursePageData,
    publicStoryCourse?.short ? { short: publicStoryCourse.short } : "skip",
  ) as PublicCoursePageData | undefined;

  React.useEffect(() => {
    setShortcutLabel(
      /Mac|iPhone|iPad/.test(window.navigator.platform) ? "Cmd" : "Ctrl",
    );
  }, []);

  React.useEffect(() => {
    function handleGlobalKeydown(event: KeyboardEvent) {
      if (
        !event.key ||
        event.key.toLocaleLowerCase() !== "k" ||
        (!event.metaKey && !event.ctrlKey) ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }

      event.preventDefault();
      openPaletteInstant(
        canAdmin,
        currentCourse,
        currentPublicCourse,
        currentAdminList,
        isAdminRoute,
        isEditorRoute,
        setOpen,
        setQuery,
        setSelectedSection,
        setSelectedAdminList,
        setSelectedCourseKey,
        setSelectedPublicCourseKey,
        setActiveIndex,
      );
    }

    window.addEventListener("keydown", handleGlobalKeydown);
    return () => window.removeEventListener("keydown", handleGlobalKeydown);
  }, [
    canAdmin,
    currentAdminList,
    currentCourse,
    currentPublicCourse,
    isAdminRoute,
    isEditorRoute,
  ]);

  React.useEffect(() => {
    if (!open) return;

    const shouldSelectText =
      selectedCourseKey === null &&
      selectedPublicCourseKey === null &&
      selectedAdminList === null;
    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
      if (shouldSelectText) {
        inputRef.current?.select();
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [open, selectedAdminList, selectedCourseKey, selectedPublicCourseKey]);

  React.useEffect(() => {
    if (pathname === previousPathnameRef.current) return;

    previousPathnameRef.current = pathname;
    setOpen(false);
    resetPaletteState(
      setQuery,
      setSelectedSection,
      setSelectedAdminList,
      setSelectedCourseKey,
      setSelectedPublicCourseKey,
      setActiveIndex,
    );
  }, [pathname]);

  const trimmedQuery = query.trim();
  const normalizedCourseQuery = trimmedQuery.toLocaleLowerCase();

  const items: Array<PaletteItem> = [];
  const adminLanguageMap = new Map(
    (adminCourseData?.languages ?? []).map((language) => [
      language.id,
      language,
    ]),
  );

  if (selectedSection === "root") {
    const rootItems: PaletteItem[] = [
      {
        id: "section:public",
        kind: "section",
        label: "Stories",
        subtitle: "Browse public courses and published stories",
        meta: `${publicCourses.length} courses`,
        icon: "public",
        section: "public",
      },
      {
        id: "route:docs",
        kind: "admin-route",
        label: "Docs",
        subtitle: "Open contributor documentation",
        icon: "docs",
        href: "/docs",
      },
      {
        id: "route:profile",
        kind: "admin-route",
        label: "Profile",
        subtitle: "Open your contributor profile",
        icon: "profile",
        href: "/profile",
      },
      {
        id: "section:editor",
        kind: "section",
        label: "Editor",
        subtitle: "Open editor overview, courses, and stories",
        meta: `${courses.length} courses`,
        icon: "editor",
        section: "editor",
      },
    ];

    if (canAdmin) {
      rootItems.push({
        id: "section:admin",
        kind: "section",
        label: "Admin",
        subtitle: "Open admin overview and moderation tools",
        icon: "admin",
        section: "admin",
      });
    }

    appendRankedPaletteItems(items, rootItems, normalizedCourseQuery);
  } else if (selectedSection === "public" && selectedPublicCourse) {
    if (trimmedQuery === "") {
      items.push({
        id: `public-course-overview:${getPublicCourseKey(selectedPublicCourse)}`,
        kind: "public-course-overview",
        label: `${selectedPublicCourse.learning_language_name} [${selectedPublicCourse.from_language_name}]`,
        subtitle: "Open public course page",
        meta: `${selectedPublicCourse.count} stories`,
        searchable: false,
        presentation: "overview",
        publicCourse: selectedPublicCourse,
      });
    }

    for (const story of publicCoursePageData?.stories ?? []) {
      if (!matchesStorySearch(story, trimmedQuery)) continue;
      items.push({
        id: `public-story:${story.id}`,
        kind: "public-story",
        label: story.name,
        subtitle: `Set ${formatStorySetLabel(story)}`,
        publicCourse: selectedPublicCourse,
        publicStory: story,
      });
    }
  } else if (selectedSection === "admin" && selectedAdminList === "languages") {
    if (trimmedQuery === "") {
      items.push({
        id: "admin:overview:languages",
        kind: "admin-route",
        label: "Languages",
        subtitle: "Open the admin languages page",
        icon: "languages",
        href: "/admin/languages",
        searchable: false,
        presentation: "overview",
      });
    }

    const languageActions: PaletteItem[] = [
      {
        id: "admin:add-language",
        kind: "admin-add",
        label: "Add language",
        subtitle: "Create a new language",
        icon: "add",
        href: "/admin/languages?addLanguage=1",
      },
    ];

    appendRankedPaletteItems(items, languageActions, normalizedCourseQuery);

    for (const language of adminLanguages) {
      if (
        trimmedQuery &&
        !language.name.toLocaleLowerCase().includes(normalizedCourseQuery) &&
        !language.short.toLocaleLowerCase().includes(normalizedCourseQuery) &&
        !String(language.id).includes(normalizedCourseQuery)
      ) {
        continue;
      }

      items.push({
        id: `admin-language:${language.id}`,
        kind: "admin-language",
        label: language.name,
        subtitle: `${language.short.toUpperCase()} • ${language.speaker || "No default voice"}`,
        meta: language.rtl ? "RTL" : undefined,
        adminLanguage: language,
        flagData: {
          short: language.short,
          flag: language.flag,
          flag_file: language.flag_file,
        },
      });
    }
  } else if (selectedSection === "admin" && selectedAdminList === "courses") {
    if (trimmedQuery === "") {
      items.push({
        id: "admin:overview:courses",
        kind: "admin-route",
        label: "Courses",
        subtitle: "Open the admin courses page",
        icon: "courses",
        href: "/admin/courses",
        searchable: false,
        presentation: "overview",
      });
    }

    const courseAdminActions: PaletteItem[] = [
      {
        id: "admin:add-course",
        kind: "admin-add",
        label: "Add course",
        subtitle: "Create a new course",
        icon: "add",
        href: "/admin/courses?addCourse=1",
      },
    ];

    appendRankedPaletteItems(items, courseAdminActions, normalizedCourseQuery);

    for (const course of adminCourses) {
      const learningLanguage = adminLanguageMap.get(course.learning_language);
      const fromLanguage = adminLanguageMap.get(course.from_language);
      const normalizedFields = [
        learningLanguage?.name ?? "",
        fromLanguage?.name ?? "",
        course.short ?? "",
        course.name ?? "",
        String(course.id),
      ];
      if (
        trimmedQuery &&
        !normalizedFields.some((field) =>
          field.toLocaleLowerCase().includes(normalizedCourseQuery),
        )
      ) {
        continue;
      }

      items.push({
        id: `admin-course:${course.id}`,
        kind: "admin-course",
        label:
          course.name?.trim() ||
          `${learningLanguage?.name ?? "Unknown"} [${fromLanguage?.name ?? "Unknown"}]`,
        subtitle: `${learningLanguage?.name ?? "Unknown"} from ${fromLanguage?.name ?? "Unknown"}`,
        meta: course.public ? "Public" : undefined,
        adminCourse: course,
        flagData: learningLanguage
          ? {
              short: learningLanguage.short,
              flag: learningLanguage.flag,
              flag_file: learningLanguage.flag_file,
            }
          : undefined,
      });
    }
  } else if (selectedSection === "admin") {
    if (trimmedQuery === "") {
      items.push({
        id: "admin:overview",
        kind: "admin-overview",
        label: "Admin",
        subtitle: "Open admin overview",
        icon: "admin",
        href: "/admin",
        searchable: false,
        presentation: "overview",
      });
    }

    const adminItems: PaletteItem[] = [
      {
        id: "admin:users",
        kind: "admin-route",
        label: "Users",
        subtitle: "Manage contributor access",
        icon: "users",
        href: "/admin/users",
      },
      {
        id: "admin:languages",
        kind: "admin-list",
        label: "Languages",
        subtitle: "Browse and edit languages",
        icon: "languages",
      },
      {
        id: "admin:courses",
        kind: "admin-list",
        label: "Courses",
        subtitle: "Browse and edit courses",
        icon: "courses",
      },
      {
        id: "admin:story",
        kind: "admin-route",
        label: "Story",
        subtitle: "Open story admin tools",
        icon: "stories",
        href: "/admin/story",
      },
    ];

    appendRankedPaletteItems(items, adminItems, normalizedCourseQuery);
  } else if (selectedCourse) {
    if (trimmedQuery === "") {
      items.push({
        id: `course-overview:${getCourseKey(selectedCourse)}`,
        kind: "course-overview",
        label: `${selectedCourse.learning_language_name} [${selectedCourse.from_language_short}]`,
        subtitle: "Open course overview",
        meta: `${selectedCourse.count} stories`,
        searchable: false,
        presentation: "overview",
        course: selectedCourse,
      });
    }

    const courseActions: PaletteItem[] = [
      {
        id: `course-action:voices:${getCourseKey(selectedCourse)}`,
        kind: "course-action",
        label: "Character voices",
        subtitle: "Open the character editor for this course",
        icon: "voices",
        href: `/editor/course/${getCourseIdentifier(selectedCourse)}/voices`,
        course: selectedCourse,
      },
    ];

    if (!selectedCourse.official) {
      courseActions.push({
        id: `course-action:import:${getCourseKey(selectedCourse)}`,
        kind: "course-action",
        label: "Import stories",
        subtitle: "Open the story import flow",
        icon: "import",
        href: `/editor/course/${getCourseIdentifier(selectedCourse)}/import/es-en`,
        course: selectedCourse,
      });
    }

    appendRankedPaletteItems(items, courseActions, normalizedCourseQuery);

    for (const story of storyResults ?? []) {
      if (
        !matchesStorySearch(story, trimmedQuery, { enableStatusFilters: true })
      )
        continue;
      items.push({
        id: `story:${story.id}`,
        kind: "story",
        label: story.name,
        subtitle: `Set ${formatStorySetLabel(story)}`,
        meta: story.todo_count ? `TODO ${story.todo_count}` : undefined,
        course: selectedCourse,
        story,
      });
    }
  } else {
    const currentCourseKey = currentCourse ? getCourseKey(currentCourse) : null;

    if (selectedSection === "public") {
      const currentPublicCourseKey = currentPublicCourse
        ? getPublicCourseKey(currentPublicCourse)
        : null;

      if (trimmedQuery === "") {
        items.push({
          id: "public:overview",
          kind: "public-overview",
          label: "Stories",
          subtitle: "Open the public stories home page",
          icon: "home",
          href: "/",
          searchable: false,
          presentation: "overview",
        });
      }

      if (
        currentPublicCourse &&
        matchesPublicCourseSearch(currentPublicCourse, normalizedCourseQuery)
      ) {
        items.push({
          id: `public-course:${currentPublicCourseKey}`,
          kind: "public-course",
          label: `${currentPublicCourse.learning_language_name} [${currentPublicCourse.from_language_name}]`,
          subtitle: `Current public course • ${currentPublicCourse.from_language_name}`,
          meta: `${currentPublicCourse.count} stories`,
          publicCourse: currentPublicCourse,
        });
      }

      for (const course of publicCourses) {
        const courseKey = getPublicCourseKey(course);
        if (courseKey === currentPublicCourseKey) continue;
        if (!matchesPublicCourseSearch(course, normalizedCourseQuery)) continue;

        items.push({
          id: `public-course:${courseKey}`,
          kind: "public-course",
          label: `${course.learning_language_name} [${course.from_language_name}]`,
          subtitle: course.from_language_name,
          meta: `${course.count} stories`,
          publicCourse: course,
        });
      }
    } else {
      if (trimmedQuery === "") {
        items.push({
          id: "editor:overview",
          kind: "editor-overview",
          label: "Editor",
          subtitle: "Open editor overview",
          icon: "home",
          href: "/editor",
          searchable: false,
          presentation: "overview",
        });
      }

      if (
        currentCourse &&
        matchesCourseSearch(currentCourse, normalizedCourseQuery)
      ) {
        items.push({
          id: `course:${currentCourseKey}`,
          kind: "course",
          label: `${currentCourse.learning_language_name} [${currentCourse.from_language_short}]`,
          subtitle: `Current course • ${currentCourse.from_language_name}`,
          meta: `${currentCourse.count} stories`,
          course: currentCourse,
        });
      }

      for (const course of courses) {
        const courseKey = getCourseKey(course);
        if (courseKey === currentCourseKey) continue;
        if (!matchesCourseSearch(course, normalizedCourseQuery)) continue;

        items.push({
          id: `course:${courseKey}`,
          kind: "course",
          label: `${course.learning_language_name} [${course.from_language_short}]`,
          subtitle: course.from_language_name,
          meta: `${course.count} stories`,
          course,
        });
      }
    }
  }

  React.useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
    setActiveIndex((currentIndex) => {
      if (items.length === 0) return 0;
      if (currentIndex >= items.length) return items.length - 1;
      return currentIndex;
    });
  }, [items.length]);

  const overviewItem = items[0]?.presentation === "overview" ? items[0] : null;
  const searchableItems = overviewItem ? items.slice(1) : items;
  const searchableOffset = overviewItem ? 1 : 0;
  const listVirtualizer = useVirtualizer({
    count: searchableItems.length,
    getScrollElement: () => scrollViewportRef.current,
    estimateSize: () => 76,
    overscan: 6,
  });
  const shouldVirtualize =
    (selectedSection === "editor" ||
      selectedSection === "public" ||
      selectedAdminList !== null) &&
    searchableItems.length > 12;

  React.useEffect(() => {
    if (items.length === 0) return;
    if (overviewItem && activeIndex === 0) return;

    listVirtualizer.scrollToIndex(Math.max(activeIndex - searchableOffset, 0), {
      align: "auto",
    });
  }, [
    activeIndex,
    items.length,
    listVirtualizer,
    overviewItem,
    searchableOffset,
  ]);

  function onOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      openPaletteInstant(
        canAdmin,
        currentCourse,
        currentPublicCourse,
        currentAdminList,
        isAdminRoute,
        isEditorRoute,
        setOpen,
        setQuery,
        setSelectedSection,
        setSelectedAdminList,
        setSelectedCourseKey,
        setSelectedPublicCourseKey,
        setActiveIndex,
      );
      return;
    }

    setOpen(false);
    resetPaletteState(
      setQuery,
      setSelectedSection,
      setSelectedAdminList,
      setSelectedCourseKey,
      setSelectedPublicCourseKey,
      setActiveIndex,
    );
  }

  function onSelectItem(item: PaletteItem) {
    if (item.kind === "section" && item.section) {
      setSelectedSection(item.section);
      setSelectedAdminList(null);
      setQuery("");
      setSelectedCourseKey(null);
      setSelectedPublicCourseKey(null);
      setActiveIndex(0);
      return;
    }

    if (item.kind === "admin-list") {
      if (item.id === "admin:languages" || item.id === "admin:list:languages") {
        setSelectedSection("admin");
        setSelectedAdminList("languages");
        setQuery("");
        setActiveIndex(0);
        return;
      }

      if (item.id === "admin:courses" || item.id === "admin:list:courses") {
        setSelectedSection("admin");
        setSelectedAdminList("courses");
        setQuery("");
        setActiveIndex(0);
        return;
      }
    }

    if (
      (item.kind === "admin-add" ||
        item.kind === "editor-overview" ||
        item.kind === "course-action" ||
        item.kind === "public-overview" ||
        item.kind === "admin-overview" ||
        item.kind === "admin-route") &&
      item.href
    ) {
      setOpen(false);
      router.push(item.href);
      return;
    }

    if (item.kind === "course" && item.course) {
      setSelectedSection("editor");
      setSelectedAdminList(null);
      setSelectedCourseKey(getCourseKey(item.course));
      setSelectedPublicCourseKey(null);
      setQuery("");
      setActiveIndex(0);
      return;
    }

    if (item.kind === "admin-language" && item.adminLanguage) {
      setOpen(false);
      router.push(`/admin/languages?editLanguage=${item.adminLanguage.id}`);
      return;
    }

    if (item.kind === "admin-course" && item.adminCourse) {
      setOpen(false);
      router.push(`/admin/courses?editCourse=${item.adminCourse.id}`);
      return;
    }

    if (item.kind === "public-course" && item.publicCourse) {
      setSelectedSection("public");
      setSelectedAdminList(null);
      setSelectedPublicCourseKey(getPublicCourseKey(item.publicCourse));
      setSelectedCourseKey(null);
      setQuery("");
      setActiveIndex(0);
      return;
    }

    if (item.kind === "course-overview" && item.course) {
      const courseIdentifier = getCourseIdentifier(item.course);
      setOpen(false);
      router.push(`/editor/course/${courseIdentifier}`);
      return;
    }

    if (item.kind === "public-course-overview" && item.publicCourse) {
      setOpen(false);
      router.push(`/${item.publicCourse.short}`);
      return;
    }

    if (item.kind === "story" && item.course && item.story) {
      const courseIdentifier = getCourseIdentifier(item.course);
      setOpen(false);
      router.push(`/editor/course/${courseIdentifier}/story/${item.story.id}`);
      return;
    }

    if (item.kind === "public-story" && item.publicStory) {
      setOpen(false);
      router.push(`/story/${item.publicStory.id}`);
    }
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        items.length === 0 ? 0 : Math.min(currentIndex + 1, items.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const activeItem = items[activeIndex];
      if (activeItem) onSelectItem(activeItem);
      return;
    }

    if (query.trim() === "") {
      if (event.key === "Backspace") {
        if (selectedCourse || selectedPublicCourse) {
          event.preventDefault();
          setSelectedCourseKey(null);
          setSelectedPublicCourseKey(null);
          setActiveIndex(0);
          return;
        }

        if (selectedAdminList !== null) {
          event.preventDefault();
          setSelectedAdminList(null);
          setActiveIndex(0);
          return;
        }

        if (selectedSection !== "root") {
          event.preventDefault();
          setSelectedSection("root");
          setActiveIndex(0);
          return;
        }
      }

      if (event.key === "ArrowLeft") {
        if (selectedCourse || selectedPublicCourse) {
          event.preventDefault();
          setSelectedCourseKey(null);
          setSelectedPublicCourseKey(null);
          setActiveIndex(0);
          return;
        }

        if (selectedAdminList !== null) {
          event.preventDefault();
          setSelectedAdminList(null);
          setActiveIndex(0);
          return;
        }

        if (selectedSection !== "root") {
          event.preventDefault();
          setSelectedSection("root");
          setActiveIndex(0);
        }
      }
    }
  }

  const isLoadingResults =
    (selectedSection === "editor" &&
      Boolean(selectedCourse) &&
      storyResults === undefined) ||
    (selectedSection === "public" &&
      Boolean(selectedPublicCourse) &&
      publicCoursePageData === undefined) ||
    (selectedSection === "admin" &&
      ((selectedAdminList === "languages" && adminLanguageList === undefined) ||
        (selectedAdminList === "courses" && adminCourseData === undefined)));
  const emptyState = getEmptyState(
    selectedSection,
    Boolean(selectedCourse) || Boolean(selectedPublicCourse),
    selectedAdminList,
    trimmedQuery,
  );
  const placeholder =
    selectedSection === "root"
      ? "Search stories, editor, admin, docs, or profile"
      : selectedCourse
        ? "Search stories by set, title, or status"
        : selectedPublicCourse
          ? "Search stories by set or title"
          : selectedAdminList === "languages"
            ? "Search admin languages"
            : selectedAdminList === "courses"
              ? "Search admin courses"
              : selectedSection === "admin"
                ? "Search admin destinations"
                : selectedSection === "public"
                  ? "Search public courses by language"
                  : "Search courses by language";
  const ariaLabel =
    selectedSection === "root"
      ? "Search navigation destinations"
      : selectedCourse || selectedPublicCourse
        ? "Search stories"
        : selectedAdminList === "languages"
          ? "Search admin languages"
          : selectedAdminList === "courses"
            ? "Search admin courses"
            : selectedSection === "admin"
              ? "Search admin destinations"
              : selectedSection === "public"
                ? "Search public courses"
                : "Search courses";
  const canGoBack =
    Boolean(selectedCourse) ||
    Boolean(selectedPublicCourse) ||
    selectedAdminList !== null ||
    selectedSection !== "root";
  const breadcrumbs: Array<{
    key: string;
    label: string;
    onClick?: () => void;
  }> = [{ key: "root", label: "Navigate" }];

  if (selectedSection === "editor") {
    breadcrumbs.push({
      key: "editor",
      label: "Editor",
      onClick: selectedCourse
        ? () => {
            setSelectedCourseKey(null);
            setActiveIndex(0);
          }
        : undefined,
    });

    if (selectedCourse) {
      breadcrumbs.push({
        key: `editor-course:${getCourseKey(selectedCourse)}`,
        label: `${selectedCourse.learning_language_name} [${selectedCourse.from_language_short}]`,
      });
    }
  } else if (selectedSection === "public") {
    breadcrumbs.push({
      key: "public",
      label: "Stories",
      onClick: selectedPublicCourse
        ? () => {
            setSelectedPublicCourseKey(null);
            setActiveIndex(0);
          }
        : undefined,
    });

    if (selectedPublicCourse) {
      breadcrumbs.push({
        key: `public-course:${getPublicCourseKey(selectedPublicCourse)}`,
        label: `${selectedPublicCourse.learning_language_name} [${selectedPublicCourse.from_language_name}]`,
      });
    }
  } else if (selectedSection === "admin") {
    breadcrumbs.push({
      key: "admin",
      label: "Admin",
      onClick: selectedAdminList
        ? () => {
            setSelectedAdminList(null);
            setActiveIndex(0);
          }
        : undefined,
    });

    if (selectedAdminList === "languages") {
      breadcrumbs.push({
        key: "admin-languages",
        label: "Languages",
      });
    } else if (selectedAdminList === "courses") {
      breadcrumbs.push({
        key: "admin-courses",
        label: "Courses",
      });
    }
  }

  return (
    <>
      {showTrigger ? (
        <button
          type="button"
          className="inline-flex h-11 min-w-0 items-center gap-3 rounded-[16px] border border-[var(--header-border)] bg-[color:color-mix(in_srgb,var(--body-background)_80%,white_20%)] px-3 text-[var(--text-color-dim)] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--body-background)_55%,white_45%)] hover:text-[var(--text-color)]"
          onClick={() =>
            openPaletteInstant(
              canAdmin,
              currentCourse,
              currentPublicCourse,
              currentAdminList,
              isAdminRoute,
              isEditorRoute,
              setOpen,
              setQuery,
              setSelectedSection,
              setSelectedAdminList,
              setSelectedCourseKey,
              setSelectedPublicCourseKey,
              setActiveIndex,
            )
          }
          aria-label="Open navigation palette"
        >
          <SearchIcon className="size-4 shrink-0" />
          <span className="hidden min-[780px]:inline">Go to…</span>
          <KbdGroup>
            <Kbd className="min-w-7 px-2">{shortcutLabel}</Kbd>
            <Kbd className="px-2">K</Kbd>
          </KbdGroup>
        </button>
      ) : null}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          disableAnimation
          className="overflow-hidden border-[var(--header-border)] bg-[color:color-mix(in_srgb,var(--body-background)_92%,white_8%)] p-0 sm:max-w-[760px]"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Navigation palette</DialogTitle>
          <DialogDescription className="sr-only">
            Quickly jump between contributor tools, editor courses, and stories.
          </DialogDescription>
          <div className="border-b border-[var(--header-border)] bg-[color:color-mix(in_srgb,var(--body-background)_88%,white_12%)] px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 text-[13px] text-[var(--text-color-dim)]">
                {canGoBack ? (
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--header-border)] bg-[var(--body-background)] text-[var(--text-color-dim)] transition-colors hover:text-[var(--text-color)]"
                    onClick={() => {
                      if (selectedCourse) {
                        setSelectedCourseKey(null);
                      } else if (selectedPublicCourse) {
                        setSelectedPublicCourseKey(null);
                      } else if (selectedAdminList !== null) {
                        setSelectedAdminList(null);
                      } else {
                        setSelectedSection("root");
                      }
                      setActiveIndex(0);
                    }}
                    aria-label="Go back"
                  >
                    <ArrowLeftIcon className="size-4" />
                  </button>
                ) : (
                  <span className="sr-only">Navigate</span>
                )}
                <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                  {breadcrumbs.map((breadcrumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return (
                      <React.Fragment key={breadcrumb.key}>
                        {index > 0 ? (
                          <ChevronRightIcon className="size-3.5 shrink-0 text-[var(--text-color-dim)]/70" />
                        ) : null}
                        {breadcrumb.onClick && !isLast ? (
                          <button
                            type="button"
                            className="truncate rounded-full px-2 py-1 font-medium transition-colors hover:bg-[var(--body-background)] hover:text-[var(--text-color)]"
                            onClick={breadcrumb.onClick}
                          >
                            {breadcrumb.label}
                          </button>
                        ) : (
                          <span
                            className={cn(
                              "truncate px-2 py-1",
                              isLast
                                ? "font-medium text-[var(--text-color)]"
                                : "",
                            )}
                          >
                            {breadcrumb.label}
                          </span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                className="transition-colors hover:text-[var(--text-color)]"
                onClick={() => onOpenChange(false)}
              >
                <Kbd className="min-w-8 px-2">Esc</Kbd>
              </button>
            </div>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--text-color-dim)]" />
              <Input
                ref={inputRef}
                type="search"
                value={query}
                placeholder={placeholder}
                aria-label={ariaLabel}
                autoComplete="off"
                className="pr-20 pl-10"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onInputKeyDown}
              />
              <div className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-[var(--text-color-dim)]">
                <Kbd className="h-7 gap-1 px-2 normal-case">
                  <CornerDownLeftIcon className="size-3.5" />
                  <span className="uppercase tracking-[0.08em]">Open</span>
                </Kbd>
              </div>
            </div>
          </div>
          <div className="h-[min(62vh,560px)] overflow-hidden px-2 py-2">
            {isLoadingResults ? (
              <div className="flex h-full min-h-40 items-center justify-center">
                <Spinner />
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-12 text-center text-[var(--text-color-dim)]">
                {emptyState}
              </div>
            ) : (
              <div className="flex h-full min-h-0 flex-col space-y-3">
                {overviewItem ? (
                  <PaletteSectionHeading
                    label="Press"
                    action={
                      <Kbd className="h-6 min-w-0 px-2 text-[11px] normal-case">
                        <CornerDownLeftIcon className="size-3.5" />
                      </Kbd>
                    }
                    trailing="to open"
                  />
                ) : null}
                {overviewItem ? (
                  <PaletteListItem
                    item={overviewItem}
                    index={0}
                    isActive={activeIndex === 0}
                    setActiveIndex={setActiveIndex}
                    onSelectItem={onSelectItem}
                    itemRefs={itemRefs}
                  />
                ) : null}
                {overviewItem ? (
                  <PaletteSectionHeading label="or type to search" />
                ) : null}
                <div
                  ref={scrollViewportRef}
                  className="min-h-0 flex-1 overflow-y-auto"
                >
                  {shouldVirtualize ? (
                    <div
                      className="relative w-full"
                      style={{ height: `${listVirtualizer.getTotalSize()}px` }}
                    >
                      {listVirtualizer.getVirtualItems().map((virtualItem) => {
                        const index = virtualItem.index + searchableOffset;
                        const item = items[index];
                        const isActive = index === activeIndex;

                        return (
                          <div
                            key={item.id}
                            ref={listVirtualizer.measureElement}
                            data-index={virtualItem.index}
                            className="absolute top-0 left-0 w-full pb-1"
                            style={{
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          >
                            <PaletteListItem
                              item={item}
                              index={index}
                              isActive={isActive}
                              setActiveIndex={setActiveIndex}
                              onSelectItem={onSelectItem}
                              itemRefs={itemRefs}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {searchableItems.map((item, searchIndex) => {
                        const index = searchIndex + searchableOffset;
                        const isActive = index === activeIndex;

                        return (
                          <PaletteListItem
                            key={item.id}
                            item={item}
                            index={index}
                            isActive={isActive}
                            setActiveIndex={setActiveIndex}
                            onSelectItem={onSelectItem}
                            itemRefs={itemRefs}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function openPaletteInstant(
  canAdmin: boolean,
  currentCourse: CourseProps | null,
  currentPublicCourse: PublicCourseListItem | null,
  currentAdminList: AdminListSection | null,
  isAdminRoute: boolean,
  isEditorRoute: boolean,
  setOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setQuery: React.Dispatch<React.SetStateAction<string>>,
  setSelectedSection: React.Dispatch<React.SetStateAction<PaletteSection>>,
  setSelectedAdminList: React.Dispatch<
    React.SetStateAction<AdminListSection | null>
  >,
  setSelectedCourseKey: React.Dispatch<React.SetStateAction<string | null>>,
  setSelectedPublicCourseKey: React.Dispatch<
    React.SetStateAction<string | null>
  >,
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>,
) {
  const initialSection = getInitialSection({
    canAdmin,
    currentCourse,
    currentPublicCourse,
    currentAdminList,
    isAdminRoute,
    isEditorRoute,
  });

  setOpen(true);
  startTransition(() => {
    setQuery("");
    setSelectedSection(initialSection);
    setSelectedAdminList(null);
    setSelectedCourseKey(
      initialSection === "editor" && currentCourse
        ? getCourseKey(currentCourse)
        : null,
    );
    setSelectedPublicCourseKey(
      initialSection === "public" && currentPublicCourse
        ? getPublicCourseKey(currentPublicCourse)
        : null,
    );
    setActiveIndex(0);
  });
}

function resetPaletteState(
  setQuery: React.Dispatch<React.SetStateAction<string>>,
  setSelectedSection: React.Dispatch<React.SetStateAction<PaletteSection>>,
  setSelectedAdminList: React.Dispatch<
    React.SetStateAction<AdminListSection | null>
  >,
  setSelectedCourseKey: React.Dispatch<React.SetStateAction<string | null>>,
  setSelectedPublicCourseKey: React.Dispatch<
    React.SetStateAction<string | null>
  >,
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>,
) {
  startTransition(() => {
    setQuery("");
    setSelectedSection("root");
    setSelectedAdminList(null);
    setSelectedCourseKey(null);
    setSelectedPublicCourseKey(null);
    setActiveIndex(0);
  });
}

function getInitialSection({
  canAdmin,
  currentCourse,
  currentPublicCourse,
  currentAdminList: _currentAdminList,
  isAdminRoute: _isAdminRoute,
  isEditorRoute,
}: {
  canAdmin: boolean;
  currentCourse: CourseProps | null;
  currentPublicCourse: PublicCourseListItem | null;
  currentAdminList: AdminListSection | null;
  isAdminRoute: boolean;
  isEditorRoute: boolean;
}) {
  if (currentCourse || isEditorRoute) return "editor";
  if (currentPublicCourse) return "public";
  if (!canAdmin) return "root";
  return "root";
}

function getCourseIdentifier(course: CourseProps) {
  return course.short ?? String(course.id);
}

function getCourseKey(course: CourseProps) {
  return `${course.short ?? course.id}`;
}

function getPublicCourseKey(course: PublicCourseListItem) {
  return course.short;
}

function matchesCourseSearch(course: CourseProps, normalizedQuery: string) {
  if (!normalizedQuery) return true;

  const fields = [
    course.learning_language_name,
    course.from_language_name,
    course.from_language_short,
    course.learning_language_short,
    course.short ?? "",
    String(course.id),
  ];

  for (const field of fields) {
    if (field.toLocaleLowerCase().includes(normalizedQuery)) {
      return true;
    }
  }

  return false;
}

function matchesPublicCourseSearch(
  course: PublicCourseListItem,
  normalizedQuery: string,
) {
  if (!normalizedQuery) return true;

  const fields = [
    course.learning_language_name,
    course.from_language_name,
    course.short,
    String(course.id),
  ];

  for (const field of fields) {
    if (field.toLocaleLowerCase().includes(normalizedQuery)) {
      return true;
    }
  }

  return false;
}

function matchesPaletteSearch(item: PaletteItem, normalizedQuery: string) {
  if (!normalizedQuery) return true;

  const fields = [item.label, item.subtitle, item.meta ?? ""];
  for (const field of fields) {
    if (field.toLocaleLowerCase().includes(normalizedQuery)) {
      return true;
    }
  }

  return false;
}

function appendRankedPaletteItems(
  target: PaletteItem[],
  source: PaletteItem[],
  normalizedQuery: string,
) {
  const rankedItems = source
    .map((item, index) => ({
      item,
      index,
      score: getPaletteSearchScore(item, normalizedQuery),
    }))
    .filter((entry) => entry.score !== Number.POSITIVE_INFINITY)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.index - b.index;
    });

  for (const entry of rankedItems) {
    target.push(entry.item);
  }
}

function getPaletteSearchScore(item: PaletteItem, normalizedQuery: string) {
  if (normalizedQuery && item.searchable === false) {
    return Number.POSITIVE_INFINITY;
  }

  if (!normalizedQuery) return 0;

  const label = item.label.toLocaleLowerCase();
  const subtitle = item.subtitle.toLocaleLowerCase();
  const meta = (item.meta ?? "").toLocaleLowerCase();
  const labelWords = label.split(/\s+/);
  const subtitleWords = subtitle.split(/\s+/);

  if (label === normalizedQuery) return 0;
  if (label.startsWith(normalizedQuery)) return 1;
  if (labelWords.some((word) => word.startsWith(normalizedQuery))) return 2;
  if (subtitle.startsWith(normalizedQuery)) return 3;
  if (subtitleWords.some((word) => word.startsWith(normalizedQuery))) return 4;
  if (label.includes(normalizedQuery)) return 5;
  if (subtitle.includes(normalizedQuery)) return 6;
  if (meta.includes(normalizedQuery)) return 7;
  return Number.POSITIVE_INFINITY;
}

function getEmptyState(
  selectedSection: PaletteSection,
  hasSelectedCourse: boolean,
  selectedAdminList: AdminListSection | null,
  trimmedQuery: string,
) {
  if (hasSelectedCourse) {
    return trimmedQuery
      ? "No stories match this search."
      : "No stories in this course yet.";
  }

  if (selectedSection === "editor") {
    return trimmedQuery
      ? "No courses match this search."
      : "No courses available.";
  }

  if (selectedSection === "admin") {
    if (selectedAdminList === "languages") {
      return trimmedQuery
        ? "No admin languages match this search."
        : "No admin languages available.";
    }

    if (selectedAdminList === "courses") {
      return trimmedQuery
        ? "No admin courses match this search."
        : "No admin courses available.";
    }

    return trimmedQuery
      ? "No admin destinations match this search."
      : "No admin destinations available.";
  }

  if (selectedSection === "public") {
    return trimmedQuery
      ? "No public courses match this search."
      : "No public courses available.";
  }

  return trimmedQuery
    ? "No sections match this search."
    : "No navigation sections available.";
}

function getEditorStoryState(
  story: Pick<StoryListDataProps, "status" | "public">,
): EditorStoryState {
  if (story.public || story.status === "published") return "published";
  if (story.status === "feedback") return "feedback";
  if (story.status === "finished") return "finished";
  return "draft";
}

function getEditorStoryStateLabel(state: EditorStoryState) {
  if (state === "draft") return "✍️ Draft";
  if (state === "feedback") return "🗨️ Feedback";
  if (state === "finished") return "✅ Finished";
  return "📢 Published";
}

function PaletteSectionHeading({
  label,
  action,
  trailing,
}: {
  label: string;
  action?: React.ReactNode;
  trailing?: string;
}) {
  return (
    <div className="px-2 pt-1">
      <div className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.01em] text-[var(--text-color-dim)]/90">
        <span>{label}</span>
        {action}
        {trailing ? <span>{trailing}</span> : null}
      </div>
    </div>
  );
}

function PaletteListItem({
  item,
  index,
  isActive,
  setActiveIndex,
  onSelectItem,
  itemRefs,
}: {
  item: PaletteItem;
  index: number;
  isActive: boolean;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  onSelectItem: (item: PaletteItem) => void;
  itemRefs: React.RefObject<Array<HTMLButtonElement | null>>;
}) {
  const Icon = getPaletteItemIcon(item.icon);
  const isOverviewItem = item.presentation === "overview";
  const storyState = item.story ? getEditorStoryState(item.story) : null;

  return (
    <button
      ref={(element) => {
        itemRefs.current[index] = element;
      }}
      type="button"
      className={cn(
        "flex w-full items-center gap-3 text-left transition-colors",
        isOverviewItem
          ? "min-h-[58px] rounded-[14px] border px-3 py-2.5"
          : "min-h-[72px] rounded-[18px] px-3 py-3",
        isOverviewItem
          ? isActive
            ? "border-[color:color-mix(in_srgb,var(--button-background)_35%,white_65%)] bg-[color:color-mix(in_srgb,var(--button-background)_10%,white_90%)] text-[var(--text-color)]"
            : "border-[var(--header-border)] bg-[color:color-mix(in_srgb,var(--body-background)_80%,white_20%)] text-[var(--text-color)] hover:bg-[color:color-mix(in_srgb,var(--body-background)_68%,white_32%)]"
          : isActive
            ? "bg-[var(--button-background)] text-[var(--button-color)]"
            : "text-[var(--text-color)] hover:bg-[var(--body-background-faint)]",
      )}
      onMouseEnter={() => setActiveIndex(index)}
      onClick={() => onSelectItem(item)}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center",
          isOverviewItem ? "h-[34px] w-[34px]" : "h-[42px] w-[42px]",
        )}
      >
        {item.story ? (
          <img
            alt={`${item.label} story icon`}
            src={`https://stories-cdn.duolingo.com/image/${item.story.image}.svg`}
            width="42"
            height="38"
            className="block h-[38px] w-[42px]"
          />
        ) : item.publicStory ? (
          <img
            alt={`${item.label} story icon`}
            src={`https://stories-cdn.duolingo.com/image/${item.publicStory.image}.svg`}
            width="42"
            height="38"
            className="block h-[38px] w-[42px]"
          />
        ) : item.kind === "course-action" && Icon ? (
          <div
            className={cn(
              "flex items-center justify-center border",
              isOverviewItem
                ? "h-[34px] w-[34px] rounded-[10px]"
                : "h-[42px] w-[42px] rounded-[12px]",
              isActive
                ? isOverviewItem
                  ? "border-[color:color-mix(in_srgb,var(--button-background)_30%,white_70%)] bg-white/70 text-[var(--text-color)]"
                  : "border-white/30 bg-white/15 text-[var(--button-color)]"
                : "border-[var(--header-border)] bg-[var(--body-background)] text-[var(--text-color-dim)]",
            )}
          >
            <Icon className={cn(isOverviewItem ? "size-[18px]" : "size-5")} />
          </div>
        ) : item.course ? (
          <LanguageFlag
            languageId={item.course.learningLanguageId}
            width={isOverviewItem ? 34 : 42}
          />
        ) : item.publicCourse ? (
          <LanguageFlag
            languageId={item.publicCourse.learningLanguageId}
            width={isOverviewItem ? 34 : 42}
          />
        ) : item.flagData ? (
          <Flag
            iso={item.flagData.short}
            width={isOverviewItem ? 34 : 42}
            flag={item.flagData.flag}
            flag_file={item.flagData.flag_file}
          />
        ) : Icon ? (
          <div
            className={cn(
              "flex items-center justify-center border",
              isOverviewItem
                ? "h-[34px] w-[34px] rounded-[10px]"
                : "h-[42px] w-[42px] rounded-[12px]",
              isActive
                ? isOverviewItem
                  ? "border-[color:color-mix(in_srgb,var(--button-background)_30%,white_70%)] bg-white/70 text-[var(--text-color)]"
                  : "border-white/30 bg-white/15 text-[var(--button-color)]"
                : "border-[var(--header-border)] bg-[var(--body-background)] text-[var(--text-color-dim)]",
            )}
          >
            <Icon className={cn(isOverviewItem ? "size-[18px]" : "size-5")} />
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center justify-center border text-[12px] font-semibold",
              isOverviewItem
                ? "h-[34px] w-[34px] rounded-[10px]"
                : "h-[42px] w-[42px] rounded-[12px]",
              isActive
                ? isOverviewItem
                  ? "border-[color:color-mix(in_srgb,var(--button-background)_30%,white_70%)] bg-white/70 text-[var(--text-color)]"
                  : "border-white/30 bg-white/15 text-[var(--button-color)]"
                : "border-[var(--header-border)] bg-[var(--body-background)] text-[var(--text-color-dim)]",
            )}
          >
            {item.story
              ? formatStorySetLabel(item.story)
              : item.publicStory
                ? formatStorySetLabel(item.publicStory)
                : "Go"}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate font-semibold",
            isOverviewItem ? "text-[14px]" : "text-[15px]",
          )}
        >
          {item.label}
        </div>
        {isOverviewItem ? null : (
          <div
            className={cn(
              "truncate text-[13px]",
              isActive
                ? "text-[color:rgba(255,255,255,0.82)]"
                : "text-[var(--text-color-dim)]",
            )}
          >
            {item.subtitle}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {storyState ? (
          <span
            className={cn(
              "rounded-full px-2 py-1 text-[11px] font-semibold whitespace-nowrap",
              isActive
                ? "bg-white/15 text-[var(--button-color)]"
                : storyState === "draft"
                  ? "bg-stone-100 text-stone-700"
                  : storyState === "feedback"
                    ? "bg-sky-100 text-sky-700"
                    : storyState === "finished"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-lime-100 text-lime-800",
            )}
          >
            {getEditorStoryStateLabel(storyState)}
          </span>
        ) : null}
        {item.meta ? (
          <span
            className={cn(
              "rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.08em]",
              isActive
                ? isOverviewItem
                  ? "bg-white/70 text-[var(--text-color-dim)]"
                  : "bg-white/15 text-[var(--button-color)]"
                : "bg-[var(--body-background)] text-[var(--text-color-dim)]",
            )}
          >
            {item.meta}
          </span>
        ) : null}
        <ChevronRightIcon
          className={cn(
            "size-4",
            isActive
              ? isOverviewItem
                ? "text-[var(--text-color-dim)]"
                : "text-[var(--button-color)]"
              : "text-[var(--text-color-dim)]",
          )}
        />
      </div>
    </button>
  );
}

function getPaletteItemIcon(icon: PaletteIcon | undefined) {
  switch (icon) {
    case "add":
      return PlusIcon;
    case "admin":
      return ShieldIcon;
    case "courses":
      return FolderOpenIcon;
    case "docs":
      return BookTextIcon;
    case "editor":
      return BookOpenIcon;
    case "home":
      return HouseIcon;
    case "import":
      return DownloadIcon;
    case "languages":
      return LanguagesIcon;
    case "profile":
      return UserIcon;
    case "public":
      return HouseIcon;
    case "stories":
      return FileTextIcon;
    case "users":
      return UsersIcon;
    case "voices":
      return MicIcon;
    default:
      return null;
  }
}

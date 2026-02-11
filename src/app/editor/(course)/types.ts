export type LanguageProps = {
  id: number;
  short: string;
  flag: number | null;
  flag_file: string | null;
};

export type CourseProps = {
  id: number;
  short: string | null;
  about: string | null;
  official: boolean;
  count: number;
  public: boolean;
  from_language: number;
  from_language_name: string;
  learning_language: number;
  learning_language_name: string;
  contributors: string[];
  contributors_past: string[];
  todo_count: number;
};

export type StoryListDataProps = {
  id: number;
  name: string;
  course_id: number;
  image: string;
  set_id: number;
  set_index: number;
  date: number | string | Date;
  change_date: number | string | Date;
  status: string;
  public: boolean;
  todo_count: number;
  approvals: number[];
  author: string;
  author_change: string | null;
};

export type CourseImportProps = {
  id: number;
  set_id: number;
  set_index: number;
  name: string;
  image_done: string;
  image: string;
  copies: string;
};

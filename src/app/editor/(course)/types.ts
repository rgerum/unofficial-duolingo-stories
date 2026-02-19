export type CourseProps = {
  id: number;
  short: string | null;
  about: string | null;
  official: boolean;
  count: number;
  public: boolean;
  fromLanguageId: string;
  from_language: number;
  from_language_short: string;
  from_language_name: string;
  learningLanguageId: string;
  learning_language: number;
  learning_language_short: string;
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
  approvalCount: number;
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

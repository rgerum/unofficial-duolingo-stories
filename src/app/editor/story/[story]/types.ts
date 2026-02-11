export type StoryData = {
  id: number;
  official: boolean;
  course_id: number;
  duo_id: number;
  image: string;
  name: string;
  set_id: number;
  set_index: number;
  text: string;
  short: string;
  learning_language: number;
  from_language: number;
};

export type Avatar = {
  id: number | null;
  avatar_id: number;
  language_id: number;
  name: string;
  link: string;
  speaker: string;
};

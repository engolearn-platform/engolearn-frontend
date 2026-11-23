const root = "/admin/grammar";
const topic = (id: string) => `${root}/${encodeURIComponent(id)}`;
const lessons = (id: string) => `${topic(id)}/lessons`;
const lesson = (id: string, lessonId: string) => `${lessons(id)}/${encodeURIComponent(lessonId)}`;
const questions = (id: string, lessonId: string) => `${lesson(id, lessonId)}/questions`;

export const grammarPaths = {
  root,
  topicNew: `${root}/new`,
  topic,
  lessons,
  lessonNew: (id: string) => `${lessons(id)}/new`,
  lesson,
  blocks: (id: string, lessonId: string) => `${lesson(id, lessonId)}/blocks`,
  questions,
  question: (id: string, lessonId: string, questionId: string) =>
    `${questions(id, lessonId)}/${encodeURIComponent(questionId)}`,
  lessonReview: (id: string, lessonId: string) => `${lesson(id, lessonId)}/review`,
  lessonPreview: (id: string, lessonId: string) => `${lesson(id, lessonId)}/review?preview=1`,
  topicPublish: (id: string) => `${topic(id)}/publish`,
};

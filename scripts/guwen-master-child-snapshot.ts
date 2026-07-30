import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseDraftQuestions, parseDraftSourcesFromProjectStatus } from '../src/lib/guwenDraftPreview';

export type ChildSnapshot = {
  questionCount: number;
  hash: string;
};

export function childSnapshotPayload(markdown: string) {
  return parseDraftQuestions(markdown).map((question) => ({
    number: question.number,
    target: question.target?.text,
    intro: question.intro?.text,
    clues: question.clues.map((clue) => ({
      text: clue.text,
      meaning: clue.meaning?.text,
    })),
    question: question.question?.text,
    options: question.options.map((option) => option.text),
    correctAnswer: question.correctAnswer?.text,
    correctFeedback: question.correctFeedback?.text,
    retryHint: question.retryHint?.text,
    explanation: question.explanation?.text,
    key: question.key?.text,
  }));
}

export function childSnapshot(markdown: string): ChildSnapshot {
  const questions = childSnapshotPayload(markdown);
  return {
    questionCount: questions.length,
    hash: crypto.createHash('sha256').update(JSON.stringify(questions)).digest('hex'),
  };
}

export function currentChildSnapshots(): Record<string, ChildSnapshot> {
  const draftSources = parseDraftSourcesFromProjectStatus(
    fs.readFileSync('GUWEN-PROJECT-STATUS.md', 'utf8'),
  );
  return Object.fromEntries(
    draftSources.map((source) => [
      source.path,
      childSnapshot(fs.readFileSync(path.resolve(source.path), 'utf8')),
    ]),
  );
}

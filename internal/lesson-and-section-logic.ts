import path from 'path';

const splitFilePath = (filePath: string) =>
  filePath.split(path.sep);

/**
 * Checks if the segment (before the first `-`) is a number.
 *
 * 003-example.ts
 * 01-foo.ts
 */
const startsWithNumber = (segment: string): boolean => {
  const numberSegment = segment.split('-')[0];

  if (numberSegment === undefined) {
    return false;
  }

  return !Number.isNaN(Number(numberSegment));
};

export const notFound = Symbol('notFound');

const getNumberFromPathSegment = (path: string) => {
  const numberSegment = path.split('-')[0];

  return Number.isNaN(Number(numberSegment))
    ? notFound
    : Number(numberSegment);
};

type SectionAndLessonNumber = {
  sectionNumber: number;
  lessonNumber: number;
  lessonPathWithNumber: string;
  sectionPathWithNumber: string;
};

const serializeSectionAndLessonNumber = (
  sectionAndLessonNumber: SectionAndLessonNumber,
) =>
  `${sectionAndLessonNumber.sectionNumber}-${sectionAndLessonNumber.lessonNumber}`;

export const getSectionAndLessonNumberFromPath = (
  filePath: string,
): SectionAndLessonNumber | typeof notFound => {
  const segments = splitFilePath(filePath);

  const lastSegmentWithNumber =
    segments.findLastIndex(startsWithNumber);

  if (lastSegmentWithNumber === -1) {
    return notFound;
  }

  const exerciseSegment = segments[lastSegmentWithNumber]!!!;

  const sectionSegment = segments[lastSegmentWithNumber - 1];

  if (sectionSegment === undefined) {
    return notFound;
  }

  const sectionNumber = getNumberFromPathSegment(sectionSegment);

  if (sectionNumber === notFound) {
    return notFound;
  }

  const lessonNumber = getNumberFromPathSegment(exerciseSegment);

  if (lessonNumber === notFound) {
    return notFound;
  }

  return {
    sectionNumber,
    lessonNumber,
    lessonPathWithNumber: exerciseSegment,
    sectionPathWithNumber: sectionSegment,
  };
};

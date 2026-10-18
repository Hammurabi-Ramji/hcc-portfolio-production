PRAGMA foreign_keys = ON;

CREATE TABLE learner (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE TABLE course (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE TABLE lesson (
    id TEXT PRIMARY KEY NOT NULL,
    course_id TEXT NOT NULL REFERENCES course(id),
    title TEXT NOT NULL,
    seq INTEGER NOT NULL
);

CREATE TABLE enrollment (
    id TEXT PRIMARY KEY NOT NULL,
    learner_id TEXT NOT NULL REFERENCES learner(id),
    course_id TEXT NOT NULL REFERENCES course(id),
    enrolled_at INTEGER NOT NULL
);

CREATE TABLE submission (
    id TEXT PRIMARY KEY NOT NULL,
    lesson_id TEXT NOT NULL REFERENCES lesson(id),
    learner_id TEXT NOT NULL REFERENCES learner(id),
    content TEXT NOT NULL,
    submitted_at INTEGER NOT NULL
);

CREATE INDEX learner_created_at ON learner (created_at);
CREATE INDEX course_created_at ON course (created_at);
CREATE INDEX lesson_course_seq ON lesson (course_id, seq);
CREATE INDEX enrollment_enrolled_at ON enrollment (enrolled_at);
CREATE INDEX submission_lesson_submitted ON submission (lesson_id, submitted_at);

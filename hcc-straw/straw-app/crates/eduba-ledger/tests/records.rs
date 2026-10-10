use std::time::{Duration, Instant};

use eduba_ledger::{
    EdubaStore, NewCourse, NewEnrollment, NewLearner, NewLesson, NewSubmission,
};

fn sqlite_url(path: &std::path::Path) -> String {
    let forward = path.to_string_lossy().replace('\\', "/");
    format!("sqlite://{forward}?mode=rwc")
}

async fn open_temp() -> (tempfile::TempDir, EdubaStore) {
    let dir = tempfile::tempdir().unwrap();
    let store = EdubaStore::open(&sqlite_url(&dir.path().join("eduba.db")))
        .await
        .unwrap();
    (dir, store)
}

async fn learner_after(store: &EdubaStore, after: i64) -> String {
    let deadline = Instant::now() + Duration::from_secs(3);
    loop {
        let id = store
            .create_learner(&NewLearner {
                name: "record-a2".into(),
            })
            .await
            .unwrap();
        let stamped = store
            .list_learners()
            .await
            .unwrap()
            .into_iter()
            .find(|row| row.id == id)
            .unwrap()
            .created_at;
        if stamped > after {
            return id;
        }
        if Instant::now() >= deadline {
            panic!("timestamp did not advance past {after}");
        }
        std::thread::sleep(Duration::from_millis(50));
    }
}

async fn course_after(store: &EdubaStore, after: i64) -> String {
    let deadline = Instant::now() + Duration::from_secs(3);
    loop {
        let id = store
            .create_course(&NewCourse {
                title: "record-b2".into(),
            })
            .await
            .unwrap();
        let stamped = store
            .list_courses()
            .await
            .unwrap()
            .into_iter()
            .find(|row| row.id == id)
            .unwrap()
            .created_at;
        if stamped > after {
            return id;
        }
        if Instant::now() >= deadline {
            panic!("timestamp did not advance past {after}");
        }
        std::thread::sleep(Duration::from_millis(50));
    }
}

async fn enrollment_after(
    store: &EdubaStore,
    learner_id: &str,
    course_id: &str,
    after: i64,
) -> String {
    let deadline = Instant::now() + Duration::from_secs(3);
    loop {
        let id = store
            .create_enrollment(&NewEnrollment {
                learner_id: learner_id.to_string(),
                course_id: course_id.to_string(),
            })
            .await
            .unwrap();
        let stamped = store
            .list_enrollments()
            .await
            .unwrap()
            .into_iter()
            .find(|row| row.id == id)
            .unwrap()
            .enrolled_at;
        if stamped > after {
            return id;
        }
        if Instant::now() >= deadline {
            panic!("timestamp did not advance past {after}");
        }
        std::thread::sleep(Duration::from_millis(50));
    }
}

async fn submission_after(
    store: &EdubaStore,
    lesson_id: &str,
    learner_id: &str,
    after: i64,
) -> String {
    let deadline = Instant::now() + Duration::from_secs(3);
    loop {
        let id = store
            .create_submission(&NewSubmission {
                lesson_id: lesson_id.to_string(),
                learner_id: learner_id.to_string(),
                content: "kept-later".into(),
            })
            .await
            .unwrap();
        let stamped = store
            .list_submissions_by_lesson(lesson_id)
            .await
            .unwrap()
            .into_iter()
            .find(|row| row.id == id)
            .unwrap()
            .submitted_at;
        if stamped > after {
            return id;
        }
        if Instant::now() >= deadline {
            panic!("timestamp did not advance past {after}");
        }
        std::thread::sleep(Duration::from_millis(50));
    }
}

#[tokio::test]
async fn round_trips_each_record_in_list_order() {
    let (_dir, store) = open_temp().await;

    let learner_id = store
        .create_learner(&NewLearner {
            name: "record-a".into(),
        })
        .await
        .unwrap();
    let course_id = store
        .create_course(&NewCourse {
            title: "record-b".into(),
        })
        .await
        .unwrap();
    let later_lesson = store
        .create_lesson(&NewLesson {
            course_id: course_id.clone(),
            title: "seq-2".into(),
            seq: 2,
        })
        .await
        .unwrap();
    let earlier_lesson = store
        .create_lesson(&NewLesson {
            course_id: course_id.clone(),
            title: "seq-1".into(),
            seq: 1,
        })
        .await
        .unwrap();
    let enrollment_id = store
        .create_enrollment(&NewEnrollment {
            learner_id: learner_id.clone(),
            course_id: course_id.clone(),
        })
        .await
        .unwrap();
    let submission_id = store
        .create_submission(&NewSubmission {
            lesson_id: earlier_lesson.clone(),
            learner_id: learner_id.clone(),
            content: "kept".into(),
        })
        .await
        .unwrap();

    let learners = store.list_learners().await.unwrap();
    let learner = learners.iter().find(|row| row.id == learner_id).unwrap();
    assert_eq!(learner.name, "record-a");

    let courses = store.list_courses().await.unwrap();
    let course = courses.iter().find(|row| row.id == course_id).unwrap();
    assert_eq!(course.title, "record-b");

    let lessons = store.list_lessons_by_course(&course_id).await.unwrap();
    assert_eq!(
        lessons.iter().map(|row| row.id.as_str()).collect::<Vec<_>>(),
        vec![earlier_lesson.as_str(), later_lesson.as_str()]
    );
    assert_eq!(lessons[0].seq, 1);
    assert_eq!(lessons[1].seq, 2);
    assert_eq!(lessons[0].title, "seq-1");

    let enrollments = store.list_enrollments().await.unwrap();
    let enrollment = enrollments
        .iter()
        .find(|row| row.id == enrollment_id)
        .unwrap();
    assert_eq!(enrollment.learner_id, learner_id);
    assert_eq!(enrollment.course_id, course_id);

    let submissions = store
        .list_submissions_by_lesson(&earlier_lesson)
        .await
        .unwrap();
    let submission = submissions
        .iter()
        .find(|row| row.id == submission_id)
        .unwrap();
    assert_eq!(submission.content, "kept");
    assert_eq!(submission.learner_id, learner_id);
    assert_eq!(submission.lesson_id, earlier_lesson);

    let learner_at = learner.created_at;
    let course_at = course.created_at;
    let enrolled_at = enrollment.enrolled_at;
    let submitted_at = submission.submitted_at;

    let later_learner = learner_after(&store, learner_at).await;
    let later_course = course_after(&store, course_at).await;
    let later_enrollment =
        enrollment_after(&store, &learner_id, &course_id, enrolled_at).await;
    let later_submission =
        submission_after(&store, &earlier_lesson, &learner_id, submitted_at).await;

    let learners = store.list_learners().await.unwrap();
    let pos = |id: &str| learners.iter().position(|row| row.id == id).unwrap();
    assert!(pos(&learner_id) < pos(&later_learner));

    let courses = store.list_courses().await.unwrap();
    let pos = |id: &str| courses.iter().position(|row| row.id == id).unwrap();
    assert!(pos(&course_id) < pos(&later_course));

    let enrollments = store.list_enrollments().await.unwrap();
    let pos = |id: &str| enrollments.iter().position(|row| row.id == id).unwrap();
    assert!(pos(&later_enrollment) < pos(&enrollment_id));

    let submissions = store
        .list_submissions_by_lesson(&earlier_lesson)
        .await
        .unwrap();
    let pos = |id: &str| submissions.iter().position(|row| row.id == id).unwrap();
    assert!(pos(&later_submission) < pos(&submission_id));
}

#[tokio::test]
async fn foreign_key_miss_returns_error() {
    let (_dir, store) = open_temp().await;
    let error = store
        .create_lesson(&NewLesson {
            course_id: "missing-course".into(),
            title: "orphan".into(),
            seq: 1,
        })
        .await
        .unwrap_err();
    let message = error.to_string();
    assert!(
        message.to_ascii_lowercase().contains("foreign key"),
        "{message}"
    );
}

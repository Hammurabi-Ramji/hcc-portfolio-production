use straw_storage::{eduba, Store};

fn fixture() -> (tempfile::TempDir, Store) {
    let root =
        std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../target/archive-query-tests");
    std::fs::create_dir_all(&root).unwrap();
    let dir = tempfile::tempdir_in(root).unwrap();
    let source = Store::open(
        dir.path().join("source.db"),
        include_str!("../../eduba-ledger/migrations/0001_baseline.sql"),
    )
    .unwrap();
    source.call(|connection| Box::pin(async move {
        sqlx::raw_sql("INSERT INTO learner VALUES ('learner-1','Test reader',1);
            INSERT INTO course VALUES ('course-1','SQL safety',2);
            INSERT INTO lesson VALUES ('lesson-1','course-1','Bindings',1);
            INSERT INTO enrollment VALUES ('enrollment-1','learner-1','course-1',3);
            INSERT INTO submission VALUES ('submission-1','lesson-1','learner-1','literal text',4);").execute(&mut *connection).await?;
        sqlx::query("UPDATE submission SET content=?").bind("'); DROP TABLE course; --").execute(connection).await?;
        Ok(())
    })).unwrap();
    (dir, source)
}

#[test]
fn fixed_archive_queries_preserve_all_five_tables_and_sql_shaped_text() {
    let (dir, source) = fixture();
    // The writer remains open: preview must include committed WAL records.
    let prepared = eduba::prepare(&dir.path().join("source.db")).unwrap();
    let preview = prepared.preview();
    assert_eq!(
        preview.counts,
        eduba::Counts {
            learners: 1,
            courses: 1,
            lessons: 1,
            enrollments: 1,
            submissions: 1
        }
    );
    let destination = Store::open(dir.path().join("archive.db"), "").unwrap();
    let archive = destination.import_eduba(prepared).unwrap();
    let json = destination.eduba_json(archive.digest).unwrap();
    let snapshot: eduba::Snapshot = serde_json::from_str(&json).unwrap();
    assert_eq!(snapshot.submissions[0].content, "'); DROP TABLE course; --");
    assert_eq!(snapshot.lessons[0].course_id, snapshot.courses[0].id);
    let courses: i64 = source
        .call(|c| {
            Box::pin(async move {
                sqlx::query_scalar("SELECT count(*) FROM course")
                    .fetch_one(c)
                    .await
            })
        })
        .unwrap();
    assert_eq!(courses, 1);
}

#[test]
fn fixed_archive_queries_still_reject_bad_types_and_extra_columns() {
    let (dir, source) = fixture();
    source
        .call(|c| {
            Box::pin(async move {
                sqlx::query("UPDATE submission SET submitted_at='invalid integer'")
                    .execute(c)
                    .await?;
                Ok(())
            })
        })
        .unwrap();
    let error = eduba::prepare(&dir.path().join("source.db"))
        .err()
        .expect("bad integer accepted");
    assert!(error.contains("record types"), "{error}");
    source.call(|c| Box::pin(async move {
        sqlx::raw_sql("UPDATE submission SET submitted_at=4; ALTER TABLE learner ADD COLUMN discarded TEXT;").execute(c).await?;
        Ok(())
    })).unwrap();
    let error = eduba::prepare(&dir.path().join("source.db"))
        .err()
        .expect("extra column discarded");
    assert!(error.contains("unsupported record columns"), "{error}");
}

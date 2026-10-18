use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Job {
    pub id: String,
    pub task_type: String,
    pub payload: String,
    pub status: String,
}

pub struct JobProcessor {
    queue: VecDeque<Job>,
}

impl JobProcessor {
    pub fn new() -> Self {
        Self { queue: VecDeque::new() }
    }

    pub fn enqueue(&mut self, task_type: &str, payload: &str) -> String {
        let id = uuid::Uuid::new_v4().to_string();
        self.queue.push_back(Job {
            id: id.clone(),
            task_type: task_type.to_string(),
            payload: payload.to_string(),
            status: "pending".to_string(),
        });
        id
    }

    pub fn process_next(&mut self) -> Option<Job> {
        if let Some(mut job) = self.queue.pop_front() {
            job.status = "completed".to_string();
            return Some(job);
        }
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_job_processing() {
        let mut processor = JobProcessor::new();
        let id = processor.enqueue("email_send", "welcome@example.com");
        let job = processor.process_next().unwrap();
        assert_eq!(job.id, id);
        assert_eq!(job.status, "completed");
    }
}

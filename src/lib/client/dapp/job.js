import logger from "../../logger/index.js";

let jobs = new Map();
let job_queue = [];
let is_processing = false;

export class Job {
  constructor(name, callback, interval = 1000, priority = 1) {
    this.name = name;
    this.callback = callback;    
    this.interval = interval;
    this.priority = priority;
    this.running = false;
    this.last_run_time = 0;
    this.has_run_once = false;
  }

  async once() {
  }

  async run() {
    if (!this.running) return;

    try {
      if (!this.has_run_once) {
        await this.once();
        this.has_run_once = true;
      }

      await this.callback(this);

    } catch (error) {
      logger.error(`Error in job "${this.name}": ${error.message}`);
      this.stop();
      return;
    }

    this.last_run_time = Date.now();

    if (this.running) {
      job_queue.push(this);
    }

    //schedule the next cycle
    schedule_next_run();
  }

  start() {
    if (this.running) {
      logger.warn(`Job "${this.name}" is already running.`);
      return;
    }

    this.running = true;
    this.has_run_once = false;
    job_queue.push(this);

    schedule_next_run();
  }

  // stop job and pop the queue
  stop() {
    if (!this.running) {
      logger.warn(`Job "${this.name}" is not running.`);
      return;
    }

    this.running = false;
    job_queue = job_queue.filter((job) => job !== this);
    logger.info(`Stopped Job "${this.name}"`);
  }

  // destroy job, clean up
  destroy() {
    this.stop();
    jobs.delete(this.name);
    logger.info(`Destroyed Job "${this.name}"`);
  }
}

export class JobContainer {
  add_job(JobClass, interval = 0, priority = 1) {
    const job_name = JobClass.name;

    if (jobs.has(job_name)) {
      logger.warn(`Job "${job_name}" already exists.`);
      return null;
    }

    const job_instance = new JobClass();

    jobs.set(job_name, job_instance);
    job_instance.start();

    return job_instance;
  }

  get(name) {    
    return jobs.get(name) || null;
  }

  get_all() {
    return Array.from(jobs.values());
  }

  stop_all() {
    jobs.forEach((job) => job.stop());
    logger.info("All jobs have been stopped.");
  }

  delete_all() {
    this.stop_all();
    jobs.clear();
    job_queue = [];
    logger.info("All jobs have been destroyed.");
  }

  remove_job(name) {
    const job = this.get(name);
    if (job) {
      job.destroy();
      logger.info(`Job "${name}" removed.`);
      return true;
    }
    return false;
  }
}

// scheduler with frame-based job processing
async function schedule_next_run() {
  if (is_processing || job_queue.length === 0) return;
  is_processing = true;

  let frame_budget = 16; // simulating a 16ms frame

  job_queue.sort((a, b) => b.priority - a.priority);

  while (job_queue.length > 0) {
    let start_time = Date.now();

    let job = job_queue.shift();

    if (job.running) {
      await job.run();
    }

    let elapsed_time = Date.now() - start_time;
    frame_budget -= elapsed_time;

    if (frame_budget > 0 && job_queue.length > 0) {
      let next_job = job_queue.shift();
      if (next_job.running) {
        await next_job.run();
      }
    }

    // yield execution to prevent blocking the event loop
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  is_processing = false;
}

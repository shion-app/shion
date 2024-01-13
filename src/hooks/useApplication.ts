import { exit } from '@tauri-apps/plugin-process'
import { listen } from '@tauri-apps/api/event'

export const enum Priority {
  High,
  Medium,
  Low,
}

const enum Executor {
  Close,
  Suspend,
  Resume,
}

type Hook = () => unknown | Promise<unknown>

interface Task {
  hook: Hook
  priority: Priority
}

class TaskExecutor {
  #taskList: Task[] = []

  addTask(task: Task) {
    this.#taskList.push(task)
  }

  #sort() {
    const low: Task[] = []
    const mdeidum: Task[] = []
    const high: Task[] = []
    for (const task of this.#taskList) {
      if (task.priority == Priority.Low)
        low.push(task)
      else if (task.priority == Priority.Medium)
        mdeidum.push(task)
      if (task.priority == Priority.High)
        high.push(task)
    }
    return [high, mdeidum, low]
  }

  async run() {
    const [high, mdeidum, low] = this.#sort()
    await Promise.allSettled(high.map(i => i.hook()))
    await Promise.allSettled(mdeidum.map(i => i.hook()))
    await Promise.allSettled(low.map(i => i.hook()))
  }
}

class Application {
  #closeTaskExecutor = new TaskExecutor()
  #suspendTaskExecutor = new TaskExecutor()
  #resumeTaskExecutor = new TaskExecutor()

  addTask(executor: Executor, task: Task) {
    if (executor == Executor.Close)
      this.#closeTaskExecutor.addTask(task)
    else if (executor == Executor.Suspend)
      this.#suspendTaskExecutor.addTask(task)
    if (executor == Executor.Resume)
      this.#resumeTaskExecutor.addTask(task)
  }

  async close() {
    await this.#closeTaskExecutor.run()
    await exit()
  }

  async suspend() {
    await this.#suspendTaskExecutor.run()
  }

  async resume() {
    await this.#resumeTaskExecutor.run()
  }
}

const application = new Application()

function build(hook: Hook, executor: Executor, priority: Priority) {
  application.addTask(executor, {
    hook,
    priority,
  })
}

export function onAppClose(hook: Hook, priority = Priority.Medium) {
  build(hook, Executor.Close, priority)
}

export function onAppSuspend(hook: Hook, priority = Priority.Medium) {
  build(hook, Executor.Suspend, priority)
}

export function onAppResume(hook: Hook, priority = Priority.Medium) {
  build(hook, Executor.Resume, priority)
}

export function suspendApp() {
  return application.suspend()
}

export function resumeApp() {
  return application.resume()
}

listen('quit', () => application.close())

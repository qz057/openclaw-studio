const probeQueues = new Map<string, Promise<void>>();

export async function runSerializedProbe<T>(queueKey: string, task: () => Promise<T>): Promise<T> {
  const previousTask = probeQueues.get(queueKey) ?? Promise.resolve();
  let releaseQueue: () => void = () => {};
  const currentTask = new Promise<void>((resolve) => {
    releaseQueue = resolve;
  });

  probeQueues.set(queueKey, currentTask);

  await previousTask.catch(() => undefined);

  try {
    return await task();
  } finally {
    if (probeQueues.get(queueKey) === currentTask) {
      probeQueues.delete(queueKey);
    }

    releaseQueue();
  }
}

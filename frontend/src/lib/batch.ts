// Dependency-injected async batch capture controller.
//
// Sequences captures one URL at a time, awaiting REAL completion (signalled
// externally via markComplete) before starting the next URL. Never starts a
// new capture while a worker is alive. Handles immediate rejected/throw
// starts, cancellations, failures, and stalls (timeout). No real delays are
// required in tests: call markComplete synchronously to drive completion.
//
// The driver's start() is the only side-effecting dependency, so the
// controller is straightforward to unit-test with mocked start/completion.

export type CaptureCompletion = {
  success: boolean
  cancelled?: boolean
  error?: string
}

export type BatchDriver = {
  start(url: string): Promise<{ success: boolean; error?: string }>
  cancel(): Promise<void>
}

export type BatchEvent = {
  kind: 'started' | 'completed' | 'failed' | 'cancelled' | 'stalled'
  url: string
  index: number
  result?: CaptureCompletion
}

export type BatchOptions = {
  timeoutMs?: number
  isCancelled?: () => boolean
  onEvent?: (event: BatchEvent) => void
}

export type BatchResultKind = CaptureCompletion | 'rejected-start' | 'stalled'

export type BatchOutcome = {
  total: number
  completed: number
  failed: number
  cancelled: boolean
  stoppedEarly: boolean
  busy: boolean // a worker was still alive when the batch stopped
  results: Array<{ url: string; index: number; result: BatchResultKind }>
}

export class BatchController {
  private resolveCompletion:
    | ((result: CaptureCompletion) => void)
    | null = null

  /** Call externally (e.g. from window.onCaptureDone) when the current capture completes. */
  markComplete(result: CaptureCompletion): void {
    const resolve = this.resolveCompletion
    if (resolve) {
      this.resolveCompletion = null
      resolve(result)
    }
  }

  async run(
    urls: string[],
    driver: BatchDriver,
    opts: BatchOptions = {}
  ): Promise<BatchOutcome> {
    const timeoutMs = opts.timeoutMs ?? 10 * 60 * 1000
    const isCancelled = opts.isCancelled ?? (() => false)
    const onEvent = opts.onEvent

    const outcome: BatchOutcome = {
      total: urls.length,
      completed: 0,
      failed: 0,
      cancelled: false,
      stoppedEarly: false,
      busy: false,
      results: [],
    }

    const emit = (kind: BatchEvent['kind'], url: string, index: number, result?: CaptureCompletion) => {
      onEvent?.({ kind, url, index, result })
    }

    for (let i = 0; i < urls.length; i++) {
      if (isCancelled()) {
        outcome.cancelled = true
        outcome.stoppedEarly = true
        break
      }

      const url = urls[i].trim()
      if (!url) continue

      emit('started', url, i)

      // --- Wire the completion resolver BEFORE starting the capture. A very
      // fast worker can signal completion (via markComplete) while the ACK
      // promise is still in flight; registering only after the ACK would
      // discard that completion and hang the batch. ---
      const completion = new Promise<CaptureCompletion>((resolve) => {
        this.resolveCompletion = resolve
      })

      // --- Start the capture. A rejection/throw means no worker was alive. ---
      let ack: { success: boolean; error?: string }
      try {
        ack = await driver.start(url)
      } catch (err) {
        this.resolveCompletion = null
        outcome.failed++
        outcome.results.push({ url, index: i, result: 'rejected-start' })
        emit('failed', url, i)
        continue
      }

      if (!ack.success) {
        this.resolveCompletion = null
        outcome.failed++
        outcome.results.push({ url, index: i, result: 'rejected-start' })
        emit('failed', url, i, { success: false, error: ack.error })
        continue
      }

      // --- Worker acknowledged started: await REAL completion. ---
      let stallTimer: ReturnType<typeof setTimeout> | null = null
      if (timeoutMs > 0) {
        stallTimer = setTimeout(() => {
          // Stall: signal completion so the loop can stop the batch while
          // retaining the busy flag (worker still alive).
          this.markComplete({ success: false, error: 'batch-stall' })
        }, timeoutMs)
      }

      let completionResult: CaptureCompletion
      try {
        completionResult = await completion
      } finally {
        if (stallTimer) clearTimeout(stallTimer)
      }

      // Timeout stall: STOP the batch, retain busy state, never start next.
      if (completionResult.error === 'batch-stall') {
        outcome.stoppedEarly = true
        outcome.busy = true
        outcome.results.push({ url, index: i, result: 'stalled' })
        emit('stalled', url, i)
        break
      }

      if (completionResult.cancelled) {
        outcome.cancelled = true
        outcome.stoppedEarly = true
        outcome.results.push({ url, index: i, result: completionResult })
        emit('cancelled', url, i, completionResult)
        break
      }

      if (completionResult.success) {
        outcome.completed++
        outcome.results.push({ url, index: i, result: completionResult })
        emit('completed', url, i, completionResult)
      } else {
        outcome.failed++
        outcome.results.push({ url, index: i, result: completionResult })
        emit('failed', url, i, completionResult)
      }
    }

    return outcome
  }
}

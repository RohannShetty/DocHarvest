import { strict as assert } from "node:assert/strict"
import { describe, it } from "node:test"
import { BatchController } from "../batch.ts"

function makeControllerAndDriver(ack = { success: true }) {
  const controller = new BatchController()
  let currentAck = ack
  const startCalls = []
  const driver = {
    startCalls,
    start: async (url) => {
      startCalls.push(url)
      if (currentAck instanceof Error) throw currentAck
      return currentAck
    },
    cancel: async () => undefined,
  }
  return { controller, driver, setAck: (a) => { currentAck = a } }
}

// Let the controller progress past `await driver.start()` so its completion
// resolve is wired, then return the run promise.
const tick = () => new Promise((r) => setTimeout(r, 0))

describe("BatchController", () => {
  it("empty queue returns zeroes and never starts", async () => {
    const { controller, driver } = makeControllerAndDriver()
    const outcome = await controller.run([], driver)
    assert.deepStrictEqual(outcome, {
      total: 0, completed: 0, failed: 0, cancelled: false, stoppedEarly: false, busy: false,
      results: [],
    })
    assert.deepStrictEqual(driver.startCalls, [])
  })

  it("runs all URLs successfully, awaiting real completion between each", async () => {
    const { controller, driver } = makeControllerAndDriver({ success: true })
    const runPromise = controller.run(["a.com", "b.com", "c.com"], driver)
    await tick() // wire resolveCompletion for a.com
    assert.deepStrictEqual(driver.startCalls, ["a.com"])

    controller.markComplete({ success: true })
    await tick()
    assert.deepStrictEqual(driver.startCalls, ["a.com", "b.com"])

    controller.markComplete({ success: true })
    await tick()
    assert.deepStrictEqual(driver.startCalls, ["a.com", "b.com", "c.com"])

    controller.markComplete({ success: true })
    const outcome = await runPromise
    assert.strictEqual(outcome.completed, 3)
    assert.strictEqual(outcome.failed, 0)
    assert.strictEqual(outcome.cancelled, false)
    assert.strictEqual(outcome.stoppedEarly, false)
    assert.strictEqual(outcome.busy, false)
    assert.strictEqual(outcome.results.length, 3)
    assert.ok(outcome.results.every((r) => r.result.success === true))
  })

  it("immediate rejected start counts failure and continues (no worker alive)", async () => {
    const { controller, driver, setAck } = makeControllerAndDriver()
    setAck(new Error("engine down"))
    const outcome = await controller.run(["a.com", "b.com"], driver)

    assert.strictEqual(outcome.failed, 2)
    assert.strictEqual(outcome.completed, 0)
    assert.strictEqual(outcome.stoppedEarly, false)
    assert.strictEqual(outcome.busy, false)
    assert.strictEqual(outcome.results[0].result, "rejected-start")
    assert.strictEqual(outcome.results[1].result, "rejected-start")
  })

  it("start returning success:false counts failure and continues", async () => {
    const { controller, driver } = makeControllerAndDriver({ success: false, error: "rejected" })
    const outcome = await controller.run(["a.com", "b.com"], driver)

    assert.strictEqual(outcome.failed, 2)
    assert.strictEqual(outcome.completed, 0)
    assert.strictEqual(outcome.stoppedEarly, false)
    assert.strictEqual(outcome.results[0].result, "rejected-start")
    assert.strictEqual(outcome.results[1].result, "rejected-start")
  })

  it("failure completion is counted and batch continues", async () => {
    const { controller, driver } = makeControllerAndDriver({ success: true })
    const runPromise = controller.run(["a.com", "b.com"], driver)
    await tick()

    controller.markComplete({ success: false, error: "partial" })
    await tick()

    assert.deepStrictEqual(driver.startCalls, ["a.com", "b.com"])

    controller.markComplete({ success: true })
    const outcome = await runPromise
    assert.strictEqual(outcome.completed, 1)
    assert.strictEqual(outcome.failed, 1)
    assert.strictEqual(outcome.stoppedEarly, false)
  })

  it("cancelled completion stops the batch and does not mark busy", async () => {
    const { controller, driver } = makeControllerAndDriver({ success: true })
    const runPromise = controller.run(["a.com", "b.com"], driver)
    await tick()

    controller.markComplete({ cancelled: true })
    const outcome = await runPromise

    assert.strictEqual(outcome.cancelled, true)
    assert.strictEqual(outcome.stoppedEarly, true)
    assert.strictEqual(outcome.busy, false)
    assert.deepStrictEqual(driver.startCalls, ["a.com"])
  })

  it("stall (timeout) stops the batch and retains busy state", async () => {
    const { controller, driver } = makeControllerAndDriver({ success: true })
    const runPromise = controller.run(["a.com", "b.com"], driver, { timeoutMs: 1 })
    await tick()

    assert.deepStrictEqual(driver.startCalls, ["a.com"])

    const outcome = await runPromise

    assert.strictEqual(outcome.stoppedEarly, true)
    assert.strictEqual(outcome.busy, true) // worker still alive
    assert.strictEqual(outcome.completed, 0)
    assert.strictEqual(outcome.cancelled, false)
    assert.deepStrictEqual(driver.startCalls, ["a.com"])
  })

  it("external cancellation stops the batch before starting more URLs", async () => {
    const { controller, driver } = makeControllerAndDriver({ success: true })
    let cancelled = false
    const runPromise = controller.run(
      ["a.com", "b.com", "c.com"],
      driver,
      { isCancelled: () => cancelled }
    )
    await tick()

    controller.markComplete({ success: true })
    await tick()
    assert.deepStrictEqual(driver.startCalls, ["a.com", "b.com"])

    cancelled = true
    controller.markComplete({ success: true })
    const outcome = await runPromise

    assert.strictEqual(outcome.cancelled, true)
    assert.strictEqual(outcome.stoppedEarly, true)
    assert.strictEqual(outcome.completed, 2)
    assert.deepStrictEqual(driver.startCalls, ["a.com", "b.com"])
  })

  it("never starts next URL while worker alive (awaits real completion)", async () => {
    const { controller, driver } = makeControllerAndDriver({ success: true })
    const runPromise = controller.run(["a.com", "b.com"], driver)
    await tick()

    assert.deepStrictEqual(driver.startCalls, ["a.com"])

    controller.markComplete({ success: true })
    await tick()
    assert.deepStrictEqual(driver.startCalls, ["a.com", "b.com"])

    controller.markComplete({ success: true })
    await runPromise
  })

  it("completion signalled inside start (before ACK resolves) is not discarded", async () => {
    const controller = new BatchController()
    const startCalls = []
    // Fast worker: completion is signalled synchronously inside start(), while
    // the ACK promise is still pending. The controller must have its completion
    // resolver wired BEFORE awaiting the ACK or this completion is lost and
    // the batch hangs.
    const driver = {
      startCalls,
      start: async (url) => {
        startCalls.push(url)
        controller.markComplete({ success: true })
        return { success: true }
      },
      cancel: async () => undefined,
    }
    // Sentinel race: on the buggy ordering the run never settles (completion
    // was discarded), so "hang" would win the race and fail the assertion.
    // Short timeoutMs lets the controller's stall timer settle the otherwise
    // hung run promptly so the test process can exit.
    const outcome = await Promise.race([
      controller.run(["a.com", "b.com"], driver, { timeoutMs: 50 }),
      tick().then(() => "hang" as const),
    ])
    assert.notStrictEqual(outcome, "hang", "run() never settled: completion inside start was discarded")
    const settled = outcome as Awaited<ReturnType<typeof controller.run>>
    assert.strictEqual(settled.completed, 2)
    assert.strictEqual(settled.failed, 0)
    assert.strictEqual(settled.busy, false)
    assert.deepStrictEqual(startCalls, ["a.com", "b.com"])
  })

  it("driver closure forwards config options to each start call", async () => {
    const controller = new BatchController()
    // Mirrors CaptureStudio: capture options are baked into the driver
    // closure (start(url) → pyApi.startCapture(url, options)), not passed
    // through the controller.
    const captureOptions = {
      max_pages: 50,
      workers: 3,
      path_scope: "/docs",
      exclude_paths: "blog",
      output_mode: "library",
      site_versions: null,
      render: true,
    }
    const startCalls = []
    const driver = {
      startCalls,
      start: async (url) => {
        startCalls.push({ url, options: captureOptions })
        return { success: true }
      },
      cancel: async () => undefined,
    }
    const runPromise = controller.run(["a.com", "b.com"], driver)
    await tick()
    controller.markComplete({ success: true })
    await tick()
    controller.markComplete({ success: true })
    const outcome = await runPromise

    assert.strictEqual(outcome.completed, 2)
    assert.strictEqual(startCalls.length, 2)
    assert.deepStrictEqual(startCalls[0], { url: "a.com", options: captureOptions })
    assert.deepStrictEqual(startCalls[1], { url: "b.com", options: captureOptions })
  })

  it("mixed outcomes counted accurately", async () => {
    const { controller, driver } = makeControllerAndDriver({ success: true })
    const runPromise = controller.run(["a.com", "b.com", "c.com"], driver)
    await tick()

    // a.com success completion
    controller.markComplete({ success: true })
    await tick()

    // b.com failure completion
    controller.markComplete({ success: false, error: "fail" })
    await tick()

    // c.com success completion
    controller.markComplete({ success: true })
    const outcome = await runPromise

    assert.strictEqual(outcome.completed, 2)
    assert.strictEqual(outcome.failed, 1) // b.com failed
    assert.strictEqual(outcome.stoppedEarly, false)
  })
})

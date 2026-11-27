import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { RingBuffer } from "../hooks/ringBuffer.ts"
import { BatchController, type BatchDriver } from "../../../lib/batch.ts"

describe("RingBuffer", () => {
  it("initializes with specified capacity", () => {
    const buffer = new RingBuffer<string>(10)
    assert.equal(buffer.capacity, 10)
    assert.equal(buffer.length, 0)
    assert.deepEqual(buffer.toArray(), [])
  })

  it("throws on non-positive capacity", () => {
    assert.throws(() => new RingBuffer(0), /RingBuffer capacity must be > 0/)
    assert.throws(() => new RingBuffer(-5), /RingBuffer capacity must be > 0/)
  })

  it("pushes items within capacity without dropping", () => {
    const buffer = new RingBuffer<number>(5)
    for (let i = 1; i <= 3; i++) {
      buffer.push(i)
    }
    assert.equal(buffer.length, 3)
    assert.deepEqual(buffer.toArray(), [1, 2, 3])
  })

  it("caps at maximum capacity and drops oldest items FIFO", () => {
    const buffer = new RingBuffer<number>(3)
    buffer.push(1)
    buffer.push(2)
    buffer.push(3)
    assert.equal(buffer.length, 3)
    assert.deepEqual(buffer.toArray(), [1, 2, 3])

    buffer.push(4)
    assert.equal(buffer.length, 3)
    assert.deepEqual(buffer.toArray(), [2, 3, 4])

    buffer.push(5)
    assert.equal(buffer.length, 3)
    assert.deepEqual(buffer.toArray(), [3, 4, 5])
  })

  it("handles 5000 items capacity cap correctly", () => {
    const buffer = new RingBuffer<number>(5000)
    for (let i = 0; i < 7000; i++) {
      buffer.push(i)
    }
    assert.equal(buffer.length, 5000)
    const array = buffer.toArray()
    assert.equal(array.length, 5000)
    assert.equal(array[0], 2000)
    assert.equal(array[4999], 6999)
  })

  it("clears correctly", () => {
    const buffer = new RingBuffer<string>(5)
    buffer.push("a")
    buffer.push("b")
    buffer.clear()
    assert.equal(buffer.length, 0)
    assert.deepEqual(buffer.toArray(), [])
  })

  it("indexes via at() correctly", () => {
    const buffer = new RingBuffer<string>(3)
    buffer.push("x")
    buffer.push("y")
    buffer.push("z")
    buffer.push("w") // drops 'x'

    assert.equal(buffer.at(0), "y")
    assert.equal(buffer.at(1), "z")
    assert.equal(buffer.at(2), "w")
    assert.equal(buffer.at(3), undefined)
    assert.equal(buffer.at(-1), undefined)
  })
})

describe("BatchController Transitions", () => {
  it("transitions through completed batch sequence", async () => {
    const controller = new BatchController()
    const urls = ["https://example.com/docs", "https://example.com/api"]
    const events: string[] = []

    const driver: BatchDriver = {
      start: async () => {
        queueMicrotask(() => {
          controller.markComplete({ success: true })
        })
        return { success: true }
      },
      cancel: async () => {},
    }

    const outcome = await controller.run(urls, driver, {
      onEvent: (e) => events.push(`${e.kind}:${e.url}`),
    })

    assert.equal(outcome.total, 2)
    assert.equal(outcome.completed, 2)
    assert.equal(outcome.failed, 0)
    assert.equal(outcome.cancelled, false)
    assert.deepEqual(events, [
      "started:https://example.com/docs",
      "completed:https://example.com/docs",
      "started:https://example.com/api",
      "completed:https://example.com/api",
    ])
  })

  it("handles cancellation transition immediately", async () => {
    const controller = new BatchController()
    const urls = ["https://a.com", "https://b.com"]
    let cancelFlag = false

    const driver: BatchDriver = {
      start: async () => {
        cancelFlag = true
        queueMicrotask(() => {
          controller.markComplete({ success: true })
        })
        return { success: true }
      },
      cancel: async () => {},
    }

    const outcome = await controller.run(urls, driver, {
      isCancelled: () => cancelFlag,
    })

    assert.equal(outcome.completed, 1)
    assert.equal(outcome.cancelled, true)
    assert.equal(outcome.stoppedEarly, true)
  })
})

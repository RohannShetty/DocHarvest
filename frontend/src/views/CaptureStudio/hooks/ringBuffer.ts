export class RingBuffer<T> {
  private buffer: (T | undefined)[]
  private head = 0
  private size = 0
  readonly capacity: number

  constructor(capacity = 5000) {
    if (capacity <= 0) throw new Error("RingBuffer capacity must be > 0")
    this.capacity = capacity
    this.buffer = new Array(capacity)
  }

  push(item: T): void {
    if (this.size < this.capacity) {
      const idx = (this.head + this.size) % this.capacity
      this.buffer[idx] = item
      this.size++
    } else {
      this.buffer[this.head] = item
      this.head = (this.head + 1) % this.capacity
    }
  }

  toArray(): T[] {
    const res: T[] = new Array(this.size)
    for (let i = 0; i < this.size; i++) {
      res[i] = this.buffer[(this.head + i) % this.capacity] as T
    }
    return res
  }

  clear(): void {
    this.head = 0
    this.size = 0
    this.buffer.fill(undefined)
  }

  get length(): number {
    return this.size
  }

  at(index: number): T | undefined {
    if (index < 0 || index >= this.size) return undefined
    return this.buffer[(this.head + index) % this.capacity]
  }
}

export type HistoryEntry<T> = { state: T; label?: string };

export class History<T> {
  private past: HistoryEntry<T>[] = [];
  private future: HistoryEntry<T>[] = [];

  constructor(private readonly limit = 100) {}

  push(entry: HistoryEntry<T>) {
    this.past.push(entry);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  undo(current: HistoryEntry<T>) {
    const previous = this.past.pop();
    if (!previous) return null;
    this.future.push(current);
    return previous;
  }

  redo(current: HistoryEntry<T>) {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(current);
    return next;
  }

  clear() {
    this.past = [];
    this.future = [];
  }
}

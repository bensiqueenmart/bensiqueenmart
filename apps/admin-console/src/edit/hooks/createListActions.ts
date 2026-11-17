/** List CRUD helpers for edit-console section hooks. */
export interface ListActions<T> {
  add: (item: T) => void;
  insert: (index: number, item: T) => void;
  update: (index: number, patch: Partial<T>) => void;
  remove: (index: number) => void;
  move: (from: number, to: number) => void;
}

export function createListActions<T>(
  getList: () => T[],
  setList: (next: T[]) => void,
): ListActions<T> {
  return {
    add: (item) => setList([...getList(), item]),
    insert: (index, item) => {
      const list = [...getList()];
      list.splice(Math.max(0, Math.min(index, list.length)), 0, item);
      setList(list);
    },
    update: (index, patch) => {
      setList(getList().map((item, i) => (i === index ? { ...item, ...patch } : item)));
    },
    remove: (index) => setList(getList().filter((_, i) => i !== index)),
    move: (from, to) => {
      const list = [...getList()];
      if (from < 0 || from >= list.length || to < 0 || to >= list.length) return;
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item as T);
      setList(list);
    },
  };
}

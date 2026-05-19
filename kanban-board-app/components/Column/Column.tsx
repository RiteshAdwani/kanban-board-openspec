'use client';

import type { ColumnWithTaskCount, Task } from '@/lib/types';

interface ColumnProps {
  column: ColumnWithTaskCount;
  tasks: Task[];
  onRename: (name: string) => void;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onMoveTask: (
    taskId: number,
    fromColumnId: number,
    toColumnId: number,
  ) => void;
  columns: ColumnWithTaskCount[];
}

export function Column(_props: ColumnProps) {
  // Stub — full implementation in batch 5 (task 8.1)
  return null;
}

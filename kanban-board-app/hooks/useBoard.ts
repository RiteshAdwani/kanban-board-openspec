'use client';

import { useState } from 'react';
import { message } from 'antd';
import type { ColumnWithTaskCount, Task, TasksByColumn } from '@/lib/types';

export type ModalState =
  | { mode: 'closed' }
  | { mode: 'create'; columnId: number }
  | { mode: 'edit'; task: Task };

interface UseBoardOptions {
  initialColumns: ColumnWithTaskCount[];
  initialTasksByColumn: TasksByColumn;
}

export interface UseBoardReturn {
  columns: ColumnWithTaskCount[];
  tasksByColumn: TasksByColumn;
  createTask: (
    columnId: number,
    title: string,
    description?: string,
  ) => Promise<void>;
  updateTask: (
    taskId: number,
    patch: { title?: string; description?: string; columnId?: number },
  ) => Promise<void>;
  moveTask: (
    taskId: number,
    fromColumnId: number,
    toColumnId: number,
  ) => Promise<void>;
  deleteTask: (taskId: number, columnId: number) => Promise<void>;
  renameColumn: (columnId: number, name: string) => Promise<void>;
  reorderTasks: (columnId: number, orderedIds: number[]) => Promise<void>;
  modalState: ModalState;
  openCreateModal: (columnId: number) => void;
  openEditModal: (task: Task) => void;
  closeModal: () => void;
}

export function useBoard({
  initialColumns,
  initialTasksByColumn,
}: UseBoardOptions): UseBoardReturn {
  const [columns, setColumns] = useState<ColumnWithTaskCount[]>(initialColumns);
  const [tasksByColumn, setTasksByColumn] =
    useState<TasksByColumn>(initialTasksByColumn);
  const [modalState, setModalState] = useState<ModalState>({ mode: 'closed' });

  function notifyError(action: string) {
    message.error(`Failed to ${action}. Please try again.`);
  }

  async function createTask(
    columnId: number,
    title: string,
    description?: string,
  ): Promise<void> {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnId, title, description }),
    });
    if (!res.ok) throw new Error('create failed');
    const newTask: Task = await res.json();
    setTasksByColumn((prev) => ({
      ...prev,
      [columnId]: [...(prev[columnId] ?? []), newTask],
    }));
  }

  async function updateTask(
    taskId: number,
    patch: { title?: string; description?: string; columnId?: number },
  ): Promise<void> {
    const snapshot = { columns, tasksByColumn };

    setTasksByColumn((prev) => {
      const updated: TasksByColumn = {};
      for (const colId in prev) {
        updated[colId] = prev[colId].map((t) =>
          t.id === taskId ? { ...t, ...patch } : t,
        );
      }
      return updated;
    });

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
    } catch {
      setColumns(snapshot.columns);
      setTasksByColumn(snapshot.tasksByColumn);
      notifyError('update task');
    }
  }

  async function moveTask(
    taskId: number,
    fromColumnId: number,
    toColumnId: number,
  ): Promise<void> {
    const snapshot = { columns, tasksByColumn };

    setTasksByColumn((prev) => {
      const task = prev[fromColumnId]?.find((t) => t.id === taskId);
      if (!task) return prev;
      return {
        ...prev,
        [fromColumnId]: prev[fromColumnId].filter((t) => t.id !== taskId),
        [toColumnId]: [
          ...(prev[toColumnId] ?? []),
          { ...task, columnId: toColumnId },
        ],
      };
    });

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: toColumnId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setColumns(snapshot.columns);
      setTasksByColumn(snapshot.tasksByColumn);
      notifyError('move task');
    }
  }

  async function deleteTask(taskId: number, columnId: number): Promise<void> {
    const snapshot = { columns, tasksByColumn };

    setTasksByColumn((prev) => ({
      ...prev,
      [columnId]: prev[columnId].filter((t) => t.id !== taskId),
    }));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setColumns(snapshot.columns);
      setTasksByColumn(snapshot.tasksByColumn);
      notifyError('delete task');
    }
  }

  async function renameColumn(columnId: number, name: string): Promise<void> {
    const snapshot = { columns, tasksByColumn };

    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? { ...c, name } : c)),
    );

    try {
      const res = await fetch(`/api/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setColumns(snapshot.columns);
      setTasksByColumn(snapshot.tasksByColumn);
      notifyError('rename column');
    }
  }

  async function reorderTasks(
    columnId: number,
    orderedIds: number[],
  ): Promise<void> {
    const snapshot = { columns, tasksByColumn };

    const currentTasks = tasksByColumn[columnId] ?? [];
    const reordered = orderedIds
      .map((id) => currentTasks.find((t) => t.id === id))
      .filter((t): t is Task => t !== undefined);

    setTasksByColumn((prev) => ({ ...prev, [columnId]: reordered }));

    try {
      const res = await fetch('/api/tasks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId, orderedIds }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setColumns(snapshot.columns);
      setTasksByColumn(snapshot.tasksByColumn);
      notifyError('reorder tasks');
    }
  }

  function openCreateModal(columnId: number) {
    setModalState({ mode: 'create', columnId });
  }

  function openEditModal(task: Task) {
    setModalState({ mode: 'edit', task });
  }

  function closeModal() {
    setModalState({ mode: 'closed' });
  }

  return {
    columns,
    tasksByColumn,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    renameColumn,
    reorderTasks,
    modalState,
    openCreateModal,
    openEditModal,
    closeModal,
  };
}

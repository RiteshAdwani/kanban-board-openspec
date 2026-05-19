'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useBoard } from '@/hooks/useBoard';
import type { ColumnWithTaskCount, Task, TasksByColumn } from '@/lib/types';
import { Column } from '@/components/Column/Column';
import { TaskCard } from '@/components/TaskCard/TaskCard';
import { TaskModal } from '@/components/TaskModal/TaskModal';
import styles from './Board.module.css';

interface BoardProps {
  initialColumns: ColumnWithTaskCount[];
  initialTasksByColumn: TasksByColumn;
}

export function Board({ initialColumns, initialTasksByColumn }: BoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const {
    columns,
    tasksByColumn,
    moveTask,
    reorderTasks,
    renameColumn,
    createTask,
    updateTask,
    deleteTask,
    openCreateModal,
    openEditModal,
    modalState,
    closeModal,
  } = useBoard({ initialColumns, initialTasksByColumn });

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as number;
    for (const col of columns) {
      const task = tasksByColumn[col.id]?.find((t) => t.id === id);
      if (task) {
        setActiveTask(task);
        return;
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTaskId = active.id as number;
    const overTaskId = over.id as number;

    const fromColumn = columns.find((col) =>
      tasksByColumn[col.id]?.some((t) => t.id === activeTaskId),
    );
    const toColumn = columns.find((col) =>
      tasksByColumn[col.id]?.some((t) => t.id === overTaskId),
    );

    if (!fromColumn || !toColumn) return;

    if (fromColumn.id !== toColumn.id) {
      moveTask(activeTaskId, fromColumn.id, toColumn.id);
    } else {
      const tasks = tasksByColumn[fromColumn.id] ?? [];
      const oldIndex = tasks.findIndex((t) => t.id === activeTaskId);
      const newIndex = tasks.findIndex((t) => t.id === overTaskId);
      if (oldIndex === -1 || newIndex === -1) return;
      const orderedIds = arrayMove(tasks, oldIndex, newIndex).map((t) => t.id);
      reorderTasks(fromColumn.id, orderedIds);
    }
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={styles.board}>
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={tasksByColumn[column.id] ?? []}
            onRename={(name) => renameColumn(column.id, name)}
            onAddTask={() => openCreateModal(column.id)}
            onEditTask={openEditModal}
            onDeleteTask={(taskId) => deleteTask(taskId, column.id)}
            onMoveTask={moveTask}
            columns={columns}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            otherColumns={columns.filter((c) => c.id !== activeTask.columnId)}
            onEdit={() => {}}
            onDelete={() => {}}
            onMove={() => {}}
            isOverlay
          />
        ) : null}
      </DragOverlay>
      <TaskModal
        modalState={modalState}
        onClose={closeModal}
        onSubmitCreate={createTask}
        onSubmitEdit={updateTask}
      />
    </DndContext>
  );
}

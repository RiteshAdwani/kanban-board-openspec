'use client';

import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useBoard } from '@/hooks/useBoard';
import type { ColumnWithTaskCount, TasksByColumn } from '@/lib/types';
import { Column } from '@/components/Column/Column';
import { TaskModal } from '@/components/TaskModal/TaskModal';
import styles from './Board.module.css';

interface BoardProps {
  initialColumns: ColumnWithTaskCount[];
  initialTasksByColumn: TasksByColumn;
}

export function Board({ initialColumns, initialTasksByColumn }: BoardProps) {
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

  function handleDragEnd(event: DragEndEvent) {
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
    <DndContext onDragEnd={handleDragEnd}>
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
      <TaskModal
        modalState={modalState}
        onClose={closeModal}
        onSubmitCreate={createTask}
        onSubmitEdit={updateTask}
      />
    </DndContext>
  );
}

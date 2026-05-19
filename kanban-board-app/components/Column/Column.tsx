'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Input } from 'antd';
import type { InputRef } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ColumnWithTaskCount, Task } from '@/lib/types';
import { TaskCard } from '@/components/TaskCard/TaskCard';
import styles from './Column.module.css';

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

export function Column({
  column,
  tasks,
  onRename,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  columns,
}: ColumnProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(column.name);
  const inputRef = useRef<InputRef | null>(null);

  useEffect(() => {
    if (editing) {
      setDraft(column.name);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, column.name]);

  function confirmRename() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== column.name) {
      onRename(trimmed);
    }
    setEditing(false);
  }

  function cancelRename() {
    setDraft(column.name);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') confirmRename();
    if (e.key === 'Escape') cancelRename();
  }

  const otherColumns = columns.filter((c) => c.id !== column.id);

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        {editing ? (
          <Input
            ref={inputRef}
            className={styles.titleInput}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={confirmRename}
            onKeyDown={handleKeyDown}
            variant="borderless"
          />
        ) : (
          <>
            <h2 className={styles.title} onClick={() => setEditing(true)}>
              {column.name}
            </h2>
            <EditOutlined
              className={styles.editIcon}
              onClick={() => setEditing(true)}
            />
          </>
        )}
        <span className={styles.taskCount}>{tasks.length}</span>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={styles.taskList}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              otherColumns={otherColumns}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
              onMove={(toColumnId) =>
                onMoveTask(task.id, column.id, toColumnId)
              }
            />
          ))}
        </div>
      </SortableContext>

      <div className={styles.footer}>
        <Button
          className={styles.addButton}
          type="dashed"
          icon={<PlusOutlined />}
          onClick={onAddTask}
        >
          Add Task
        </Button>
      </div>
    </div>
  );
}

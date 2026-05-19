'use client';

import { Card, Select, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, ColumnWithTaskCount } from '@/lib/types';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  otherColumns: ColumnWithTaskCount[];
  onEdit: () => void;
  onDelete: () => void;
  onMove: (toColumnId: number) => void;
}

export function TaskCard({
  task,
  otherColumns,
  onEdit,
  onDelete,
  onMove,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
        size="small"
        styles={{ body: { padding: '10px 12px' } }}
      >
        <div style={{ fontWeight: 500, fontSize: 14, color: '#1a1a1a' }}>
          {task.title}
        </div>

        {task.description && (
          <div className={styles.description}>{task.description}</div>
        )}

        <div className={styles.actions}>
          <Select
            className={styles.moveSelect}
            size="small"
            placeholder="Move to…"
            value={null}
            options={otherColumns.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(toColumnId: number) => onMove(toColumnId)}
            onClick={(e) => e.stopPropagation()}
          />

          <Tooltip title="Edit">
            <EditOutlined
              className={styles.actionIcon}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onEdit();
              }}
            />
          </Tooltip>

          <Tooltip title="Delete">
            <DeleteOutlined
              className={`${styles.actionIcon} ${styles.deleteIcon}`}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onDelete();
              }}
            />
          </Tooltip>
        </div>
      </Card>
    </div>
  );
}

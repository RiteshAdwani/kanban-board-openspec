'use client';

import { Card, Select, Tooltip, Popconfirm } from 'antd';
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
  isOverlay?: boolean;
}

export function TaskCard({
  task,
  otherColumns,
  onEdit,
  onDelete,
  onMove,
  isOverlay = false,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isOverlay });

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
            <Popconfirm
              title="Delete this task?"
              onConfirm={(e) => {
                e?.stopPropagation();
                onDelete();
              }}
              onCancel={(e) => e?.stopPropagation()}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <DeleteOutlined
                className={`${styles.actionIcon} ${styles.deleteIcon}`}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              />
            </Popconfirm>
          </Tooltip>
        </div>
      </Card>
    </div>
  );
}

'use client';

import type { Task } from '@/lib/types';
import type { ModalState } from '@/hooks/useBoard';

interface TaskModalProps {
  modalState: ModalState;
  onClose: () => void;
  onSubmitCreate: (
    columnId: number,
    title: string,
    description?: string,
  ) => Promise<void>;
  onSubmitEdit: (
    taskId: number,
    patch: { title?: string; description?: string },
  ) => Promise<void>;
}

export function TaskModal(_props: TaskModalProps) {
  // Stub — full implementation in batch 5 (task 10.1)
  return null;
}

'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';
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

interface FormValues {
  title: string;
  description?: string;
}

export function TaskModal({
  modalState,
  onClose,
  onSubmitCreate,
  onSubmitEdit,
}: TaskModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const isOpen = modalState.mode !== 'closed';
  const isEdit = modalState.mode === 'edit';

  useEffect(() => {
    if (modalState.mode === 'edit') {
      form.setFieldsValue({
        title: modalState.task.title,
        description: modalState.task.description ?? '',
      });
    } else if (modalState.mode === 'create') {
      form.resetFields();
    }
    setCreateError(null);
  }, [modalState, form]);

  async function handleSubmit(values: FormValues) {
    const description = values.description?.trim() || undefined;

    if (modalState.mode === 'create') {
      setLoading(true);
      setCreateError(null);
      try {
        await onSubmitCreate(
          modalState.columnId,
          values.title.trim(),
          description,
        );
        onClose();
      } catch {
        setCreateError('Failed to create task. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (modalState.mode === 'edit') {
      await onSubmitEdit(modalState.task.id, {
        title: values.title.trim(),
        description,
      });
      onClose();
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Task' : 'Create Task'}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      maskClosable={!loading}
      destroyOnHidden={false}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input placeholder="Task title" autoFocus />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea placeholder="Optional description" rows={3} />
        </Form.Item>

        {createError && (
          <Form.Item style={{ marginBottom: 8 }}>
            <span style={{ color: '#ff4d4f', fontSize: 13 }}>
              {createError}
            </span>
          </Form.Item>
        )}

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button
            onClick={onClose}
            style={{ marginRight: 8 }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

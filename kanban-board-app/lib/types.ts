export type { Column, Task } from '../generated/prisma';

export type ColumnWithTaskCount = {
  id: number;
  name: string;
  position: number;
  createdAt: Date;
  _count: { tasks: number };
};

export type TasksByColumn = Record<
  number,
  import('../generated/prisma').Task[]
>;

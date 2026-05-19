import { prisma } from './prisma';
import type { Task, TasksByColumn } from './types';

export async function getByColumnId(columnId: number): Promise<Task[]> {
  return prisma.task.findMany({
    where: { columnId },
    orderBy: { position: 'asc' },
  });
}

export async function getByColumns(
  columnIds: number[],
): Promise<TasksByColumn> {
  const tasks = await prisma.task.findMany({
    where: { columnId: { in: columnIds } },
    orderBy: { position: 'asc' },
  });

  const result: TasksByColumn = {};
  for (const id of columnIds) {
    result[id] = [];
  }
  for (const task of tasks) {
    result[task.columnId].push(task);
  }
  return result;
}

export async function getById(id: number): Promise<Task | null> {
  return prisma.task.findUnique({ where: { id } });
}

export async function create(
  columnId: number,
  title: string,
  description?: string,
): Promise<Task> {
  const agg = await prisma.task.aggregate({
    where: { columnId },
    _max: { position: true },
  });
  const nextPosition = (agg._max.position ?? -1) + 1;

  return prisma.task.create({
    data: { columnId, title, description, position: nextPosition },
  });
}

export async function update(
  id: number,
  patch: { title?: string; description?: string; columnId?: number },
): Promise<Task | null> {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return null;

  let position = existing.position;

  if (patch.columnId !== undefined && patch.columnId !== existing.columnId) {
    const agg = await prisma.task.aggregate({
      where: { columnId: patch.columnId },
      _max: { position: true },
    });
    position = (agg._max.position ?? -1) + 1;
  }

  return prisma.task.update({
    where: { id },
    data: { ...patch, position },
  });
}

export async function deleteTask(id: number): Promise<void> {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;

  await prisma.$transaction(async (tx) => {
    await tx.task.delete({ where: { id } });

    const remaining = await tx.task.findMany({
      where: { columnId: task.columnId },
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < remaining.length; i++) {
      await tx.task.update({
        where: { id: remaining[i].id },
        data: { position: i },
      });
    }
  });
}

export async function reorder(
  columnId: number,
  orderedIds: number[],
): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((taskId, index) =>
      prisma.task.update({
        where: { id: taskId },
        data: { position: index },
      }),
    ),
  );
}

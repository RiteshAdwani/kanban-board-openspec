import { prisma } from './prisma';
import type { Column, ColumnWithTaskCount } from './types';

export async function getAll(): Promise<ColumnWithTaskCount[]> {
  return prisma.column.findMany({
    orderBy: { position: 'asc' },
    include: { _count: { select: { tasks: true } } },
  });
}

export async function rename(id: number, name: string): Promise<Column | null> {
  const existing = await prisma.column.findUnique({ where: { id } });
  if (!existing) return null;
  return prisma.column.update({ where: { id }, data: { name } });
}

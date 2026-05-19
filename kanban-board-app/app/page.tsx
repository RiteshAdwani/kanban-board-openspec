import * as columnService from '@/lib/column-service';
import * as taskService from '@/lib/task-service';
import { Board } from '@/components/Board/Board';

export const dynamic = 'force-dynamic';

export default async function BoardPage() {
  const columns = await columnService.getAll();
  const columnIds = columns.map((c) => c.id);
  const tasksByColumn = await taskService.getByColumns(columnIds);

  return (
    <Board initialColumns={columns} initialTasksByColumn={tasksByColumn} />
  );
}

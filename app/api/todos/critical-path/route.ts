import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Todo = {
  id: number;
  title: string;
  createdAt: string;
  dueDate: string | null;
  imageURL?: string | null;
};

type TaskDependency = {
  fromId: number;
  toId: number;
};

type GraphNode = {
  todo: Todo;
  deps: number[];
  dependents: number[];
};

type Graph = Map<number, GraphNode>;

type AnalysisResult = {
  length: number;
  path: number[];
  earliestStart: Date | null;
  finish: Date | null;
};

// Helper to build the dependency graph
function buildGraph(todos: Todo[], dependencies: TaskDependency[]): Graph {
  const graph: Graph = new Map();
  for (const todo of todos) {
    graph.set(todo.id, { todo, deps: [], dependents: [] });
  }
  for (const dep of dependencies) {
    // dep.fromId depends on dep.toId
    if (graph.has(dep.fromId) && graph.has(dep.toId)) {
      graph.get(dep.fromId)!.deps.push(dep.toId); // fromId depends on toId
      graph.get(dep.toId)!.dependents.push(dep.fromId); // toId is a prerequisite for fromId
    }
  }
  return graph;
}

// Robust Kahn's algorithm for topological sort (roots before leaves)
function topoSort(graph: Graph): number[] {
  const inDegree: Map<number, number> = new Map();
  for (const [id, node] of graph.entries()) {
    inDegree.set(id, node.deps.length); // in-degree = number of dependencies
  }
  const queue: number[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id); // roots (no dependencies)
  }
  const order: number[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const dependent of graph.get(id)!.dependents) {
      inDegree.set(dependent, inDegree.get(dependent)! - 1);
      if (inDegree.get(dependent) === 0) queue.push(dependent);
    }
  }
  return order;
}

// Calculate critical path and earliest start dates
function analyzeGraph(graph: Graph, order: number[]) {
  const results: Map<number, AnalysisResult> = new Map();
  for (const id of order) {
    const node = graph.get(id)!;
    if (node.deps.length === 0) {
      results.set(id, {
        length: 1,
        path: [id],
        earliestStart: null,
        finish: node.todo.dueDate ? new Date(node.todo.dueDate) : new Date(node.todo.createdAt),
      });
    } else {
      let maxLen = 0;
      let maxPath: number[] = [];
      let maxFinish: Date | null = null;
      for (const depId of node.deps) {
        const depRes = results.get(depId);
        if (!depRes) {
          console.warn(`Dependency result for ${depId} not found when analyzing node ${id}`);
          continue;
        }
        if (depRes.length > maxLen) {
          maxLen = depRes.length;
          maxPath = depRes.path;
        }
        if (!maxFinish || (depRes.finish && depRes.finish > maxFinish)) {
          maxFinish = depRes.finish;
        }
      }
      results.set(id, {
        length: maxLen + 1,
        path: [...maxPath, id],
        earliestStart: maxFinish,
        finish: node.todo.dueDate ? new Date(node.todo.dueDate) : new Date(node.todo.createdAt),
      });
    }
  }
  // Find the task(s) with the maximum path length (critical path)
  let maxLen = 0;
  let criticalPath: number[] = [];
  for (const [id, res] of results.entries()) {
    if (res.length > maxLen) {
      maxLen = res.length;
      criticalPath = res.path;
    }
  }
  // Build earliest start date map
  const earliestStartDates: Record<string, string | null> = {};
  for (const [id, res] of results.entries()) {
    earliestStartDates[id.toString()] = res.earliestStart ? res.earliestStart.toISOString() : null;
  }
  return { criticalPath, earliestStartDates };
}

export async function GET() {
  try {
    const todosRaw = await prisma.todo.findMany();
    const dependencies = await prisma.taskDependency.findMany();

    if (todosRaw.length === 0) {
      return NextResponse.json({ criticalPath: [], earliestStartDates: {} });
    }

    const todos: Todo[] = todosRaw.map(todo => ({
      ...todo,
      createdAt: todo.createdAt instanceof Date ? todo.createdAt.toISOString() : todo.createdAt,
      dueDate: todo.dueDate instanceof Date ? todo.dueDate.toISOString() : todo.dueDate,
    }));

    const graph = buildGraph(todos, dependencies);
    console.log('Graph:', Array.from(graph.entries()));
    const order = topoSort(graph);
    console.log('Topological order:', order);

    if (order.length !== todos.length) {
      return NextResponse.json({ error: 'Dependency graph contains a cycle or is invalid.' }, { status: 500 });
    }

    const { criticalPath, earliestStartDates } = analyzeGraph(graph, order);
    console.log('Earliest start dates:', earliestStartDates);
    const criticalPathTodos = criticalPath.map((id: number) => graph.get(id)!.todo);

    return NextResponse.json({
      criticalPath: criticalPathTodos,
      earliestStartDates,
    });
  } catch (error) {
    console.error('Critical path error:', error);
    return NextResponse.json({ error: 'Error computing critical path' }, { status: 500 });
  }
}

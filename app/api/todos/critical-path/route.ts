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
  const graph: Graph = new Map(); // id -> { todo, deps: [ids], dependents: [ids] }
  for (const todo of todos) {
    graph.set(todo.id, { todo, deps: [], dependents: [] });
  }
  for (const dep of dependencies) {
    if (graph.has(dep.fromId) && graph.has(dep.toId)) {
      graph.get(dep.fromId)!.deps.push(dep.toId);
      graph.get(dep.toId)!.dependents.push(dep.fromId);
    }
  }
  return graph;
}

// Topological sort (Kahn's algorithm)
function topoSort(graph: Graph): number[] {
  const inDegree: Map<number, number> = new Map();
  for (const [id, node] of graph.entries()) {
    inDegree.set(id, 0);
  }
  for (const [id, node] of graph.entries()) {
    for (const dep of node.deps) {
      inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
    }
  }
  const queue: number[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }
  const order: number[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const dep of graph.get(id)!.deps) {
      inDegree.set(dep, inDegree.get(dep)! - 1);
      if (inDegree.get(dep) === 0) queue.push(dep);
    }
  }
  return order;
}

// Calculate critical path and earliest start dates
function analyzeGraph(graph: Graph, order: number[]) {
  // For each task, store: { length, path, earliestStart }
  const results: Map<number, AnalysisResult> = new Map();
  for (const id of order) {
    const node = graph.get(id)!;
    if (node.deps.length === 0) {
      // No dependencies: path length 1, path is itself, earliest start is null
      results.set(id, {
        length: 1,
        path: [id],
        earliestStart: null,
        finish: node.todo.dueDate ? new Date(node.todo.dueDate) : null,
      });
    } else {
      // Find the dependency with the longest path
      let maxLen = 0;
      let maxPath: number[] = [];
      let maxFinish: Date | null = null;
      for (const depId of node.deps) {
        const depRes = results.get(depId)!;
        if (depRes.length > maxLen) {
          maxLen = depRes.length;
          maxPath = depRes.path;
        }
        // For earliest start: take the latest finish among dependencies
        if (!maxFinish || (depRes.finish && depRes.finish > maxFinish)) {
          maxFinish = depRes.finish;
        }
      }
      results.set(id, {
        length: maxLen + 1,
        path: [...maxPath, id],
        earliestStart: maxFinish,
        finish: node.todo.dueDate ? new Date(node.todo.dueDate) : null,
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
    const todos = await prisma.todo.findMany();
    const dependencies = await prisma.taskDependency.findMany();
    const graph = buildGraph(todos, dependencies);
    const order = topoSort(graph);
    const { criticalPath, earliestStartDates } = analyzeGraph(graph, order);
    // Return critical path as full todo objects
    const criticalPathTodos = criticalPath.map((id: number) => graph.get(id)!.todo);
    return NextResponse.json({
      criticalPath: criticalPathTodos,
      earliestStartDates,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error computing critical path' }, { status: 500 });
  }
} 
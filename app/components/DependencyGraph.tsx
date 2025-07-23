import { useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import type { Todo, Dependency } from "../types";
import "reactflow/dist/style.css";

export default function DependencyGraph({
  todos,
  dependencies,
}: {
  todos: Todo[];
  dependencies: Dependency[];
}) {
  const markerEnd = useMemo(
    () => ({
      type: MarkerType.ArrowClosed,
      color: "#f59e42",
    }),
    []
  );

  const gridCols = Math.ceil(Math.sqrt(todos.length));
  const gridSpacingX = 200;
  const gridSpacingY = 150;

  const nodes = todos.map((todo, idx) => ({
    id: todo.id.toString(),
    data: { label: todo.title },
    position: {
      x: (idx % gridCols) * gridSpacingX,
      y: Math.floor(idx / gridCols) * gridSpacingY,
    },
  }));

  const edges = dependencies.map((dep) => ({
    id: `${dep.fromId}->${dep.toId}`,
    source: dep.fromId.toString(),
    target: dep.toId.toString(),
    animated: true,
    type: "bezier",
    style: { stroke: "#f59e42" },
    markerEnd,
  }));

  return (
    <div style={{ width: "100%", height: 400, background: "#fff", borderRadius: 8, marginBottom: 24 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
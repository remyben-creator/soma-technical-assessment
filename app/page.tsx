"use client";
import { useState, useEffect, useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';

type Todo = {
  id: number;
  title: string;
  createdAt: Date | string;
  dueDate?: Date | string | null;
  imageURL?: string | null;
};

type Dependency = {
  fromId: number;
  toId: number;
};

function TodoItem({
  todo,
  onDelete,
  onEditDependencies,
  earliestStartDate,
}: {
  todo: Todo;
  onDelete: (id: number) => void;
  onEditDependencies: (todo: Todo) => void;
  earliestStartDate: string | null;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!todo.imageURL) {
      setImgError(true);
      return;
    }
    setImgLoaded(false);
    setImgError(false);

    const img = new window.Image();
    img.src = todo.imageURL;

    img.onload = () => {
      setImgLoaded(true);
    };

    img.onerror = () => {
      setImgError(true);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [todo.imageURL]);

  return (
    <li className="flex justify-between items-center bg-white bg-opacity-90 p-4 mb-4 rounded-lg shadow-lg">
      <div className="flex items-center">
        <div className="relative w-20 h-20 mr-4 flex items-center justify-center bg-gray-100 rounded overflow-hidden">
          {todo.imageURL && !imgError ? (
            <>
              {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              )}
              <img
                src={todo.imageURL}
                alt={todo.title}
                className={`w-full h-full object-cover ${imgLoaded ? 'block' : 'hidden'}`}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              No Image
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-gray-800 font-medium">{todo.title}</span>
          {todo.dueDate && (() => {
            const due = new Date(todo.dueDate as string);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            due.setHours(0, 0, 0, 0);
            const isPast = due < today;
            return (
              <span className={`text-sm ${isPast ? "text-red-500" : "text-gray-500"}`}>
                Due: {due.toISOString().slice(0, 10)}
              </span>
            );
          })()}
          <span className="text-xs text-blue-600">
            Earliest Start: {earliestStartDate ? earliestStartDate.slice(0, 10) : <span className="italic text-gray-400">None</span>}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEditDependencies(todo)}
          className="text-indigo-500 border border-indigo-500 rounded px-2 py-1 text-xs hover:bg-indigo-50 transition"
        >
          Edit Dependencies
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="text-red-500 hover:text-red-700 transition duration-300"
        >
          {/* Delete Icon */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </li>
  );
}

function DependencyGraph({ todos, dependencies }: { todos: Todo[]; dependencies: Dependency[] }) {
  const markerEnd = useMemo(() => ({
    type: MarkerType.ArrowClosed,
    color: '#f59e42',
  }), []);

  // Arrange nodes in a grid
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

  const edges = dependencies.map(dep => ({
    id: `${dep.fromId}->${dep.toId}`,
    source: dep.fromId.toString(),
    target: dep.toId.toString(),
    animated: true,
    type: "default",
    style: { stroke: '#f59e42' },
    markerEnd,
  }));

  return (
    <div style={{ width: '100%', height: 400, background: '#fff', borderRadius: 8, marginBottom: 24 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default function Home() {
  const [newTodo, setNewTodo] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [depEditTodo, setDepEditTodo] = useState<Todo | null>(null);
  const [depEditMode, setDepEditMode] = useState<"choose" | "add" | "delete">("choose");
  const [depInput, setDepInput] = useState<string>("");
  const [depStatus, setDepStatus] = useState<string>("");
  const [criticalPath, setCriticalPath] = useState<Todo[]>([]);
  const [earliestStartDates, setEarliestStartDates] = useState<Record<string, string | null>>({});
  const [currentDependencies, setCurrentDependencies] = useState<Todo[]>([]);

  useEffect(() => {
    fetchTodos();
    fetchDependencies();
    fetchCriticalPath();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch("/api/todos");
      const data = await res.json();
      setTodos(data);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    }
  };

  const fetchDependencies = async () => {
    try {
      const res = await fetch("/api/todos/dependencies");
      const data = await res.json();
      setDependencies(data);
    } catch (error) {
      console.error("Failed to fetch dependencies:", error);
    }
  };

  const fetchCriticalPath = async () => {
    try {
      const res = await fetch("/api/todos/critical-path");
      const data = await res.json();
      setCriticalPath(data.criticalPath || []);
      setEarliestStartDates(data.earliestStartDates || {});
    } catch (error) {
      console.error("Failed to fetch critical path:", error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTodo,
          dueDate: dueDate || null,
        }),
      });
      setNewTodo("");
      setDueDate("");
      fetchTodos();
      fetchCriticalPath();
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
      fetchTodos();
      fetchCriticalPath();
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  // Dependency modal logic
  const handleEditDependencies = async (todo: Todo) => {
    setDepEditTodo(todo);
    setDepInput("");
    setDepStatus("");
    setDepEditMode("choose");

    // Fetch dependencies for this todo
    try {
      const res = await fetch(`/api/todos/${todo.id}/dependencies`);
      const data = await res.json();
      setCurrentDependencies(data.dependencies || []);
    } catch (error) {
      setCurrentDependencies([]);
    }
  };

  const handleAddDependency = async () => {
    if (!depEditTodo || !depInput.trim()) return;
    // Find the todo with the matching title (case-insensitive)
    const match = todos.find(
      t => t.title.trim().toLowerCase() === depInput.trim().toLowerCase()
    );
    if (!match) {
      setDepStatus("No todo found with that title.");
      return;
    }
    if (match.id === depEditTodo.id) {
      setDepStatus("A todo cannot depend on itself.");
      return;
    }
    try {
      const res = await fetch(`/api/todos/${depEditTodo.id}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dependencyId: match.id }),
      });
      if (res.ok) {
        setDepStatus("Dependency added!");
        fetchDependencies();
        fetchCriticalPath();
      } else {
        setDepStatus("Failed to add dependency.");
      }
    } catch (error) {
      setDepStatus("Error adding dependency.");
    }
  };

  const handleDeleteDependency = async (fromId: number, toId: number) => {
    try {
      await fetch(`/api/todos/${fromId}/dependencies/${toId}`, { method: "DELETE" });
      setDepStatus("Dependency deleted!");
      fetchDependencies();
      fetchCriticalPath();
    } catch (error) {
      setDepStatus("Failed to delete dependency.");
    }
  };

  const dependenciesForTodo = (todo: Todo) =>
    dependencies
      .filter(dep => dep.fromId === todo.id)
      .map(dep => todos.find(t => t.id === dep.toId))
      .filter(Boolean) as Todo[];

  const handleCloseModal = () => {
    setDepEditTodo(null);
    setDepInput("");
    setDepStatus("");
    setDepEditMode("choose");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white mb-8">Things To Do App</h1>
        <div className="flex mb-6">
          <input
            type="text"
            className="flex-grow p-3 rounded-l-full focus:outline-none text-gray-700"
            placeholder="Add a new todo"
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
          />
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
          <button
            onClick={handleAddTodo}
            className="bg-white text-indigo-600 p-3 rounded-r-full hover:bg-gray-100 transition duration-300"
          >
            Add
          </button>
        </div>
        {criticalPath.length > 0 && (
          <div className="mb-8 bg-white bg-opacity-80 rounded-lg shadow p-4">
            <h2 className="text-xl font-bold mb-2 text-indigo-700">Critical Path</h2>
            <ol className="list-decimal list-inside">
              {criticalPath.map(todo => (
                <li key={todo.id} className="mb-1">
                  <span className="font-medium">{todo.title}</span>
                  {todo.dueDate && (
                    <span className="ml-2 text-sm text-gray-500">
                      (Due: {new Date(todo.dueDate).toISOString().slice(0, 10)})
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
        {/* Dependency Graph Visualization - moved here */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-indigo-700">Dependency Graph</h2>
          <DependencyGraph todos={todos} dependencies={dependencies} />
        </div>
        {/* Todo List - now below the graph */}
        <ul>
          {todos.map((todo: Todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onDelete={handleDeleteTodo}
              onEditDependencies={handleEditDependencies}
              earliestStartDate={earliestStartDates[todo.id.toString()] || null}
            />
          ))}
        </ul>
      </div>
      {/* Dependency Modal */}
      {depEditTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg w-80">
            <h2 className="text-lg font-bold mb-2">Edit Dependencies for "{depEditTodo.title}"</h2>
            {depEditMode === "choose" && (
              <div className="flex flex-col gap-4">
                <button
                  className="bg-indigo-500 text-white px-4 py-2 rounded"
                  onClick={() => setDepEditMode("add")}
                >
                  Add Dependency
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded"
                  onClick={() => setDepEditMode("delete")}
                >
                  Delete Dependency
                </button>
                <button
                  className="mt-2 text-gray-500 underline"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
              </div>
            )}
            {depEditMode === "add" && (
              <div>
                <input
                  type="text"
                  className="w-full border p-2 mb-2"
                  placeholder="Enter dependent Todo Title"
                  value={depInput}
                  onChange={e => setDepInput(e.target.value)}
                />
                <button
                  onClick={handleAddDependency}
                  className="bg-indigo-500 text-white px-4 py-2 rounded mr-2"
                >
                  Add
                </button>
                <button
                  className="text-gray-500 underline"
                  onClick={() => setDepEditMode("choose")}
                >
                  Back
                </button>
                {depStatus && <div className="mt-2 text-sm">{depStatus}</div>}
              </div>
            )}
            {depEditMode === "delete" && (
              <div>
                <div className="mb-2 font-medium">Current Dependencies:</div>
                <ul className="mb-2">
                  {currentDependencies.length === 0 && (
                    <li className="text-gray-400 italic">No dependencies</li>
                  )}
                  {currentDependencies.map(dep => (
                    <li key={dep.id} className="flex items-center justify-between mb-1">
                      <span>{dep.title}</span>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                        onClick={() => handleDeleteDependency(depEditTodo.id, dep.id)}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  className="text-gray-500 underline"
                  onClick={() => setDepEditMode("choose")}
                >
                  Back
                </button>
                {depStatus && <div className="mt-2 text-sm">{depStatus}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
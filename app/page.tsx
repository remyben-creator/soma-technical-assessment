"use client";
import { useState, useEffect } from "react";
import TodoItem from "./components/TodoItem";
import DependencyGraph from "./components/DependencyGraph";
import DependencyModal from "./components/DependencyModal";
import type { Todo, Dependency } from "./types";

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
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-indigo-700">Dependency Graph</h2>
          <DependencyGraph todos={todos} dependencies={dependencies} />
        </div>
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
      {depEditTodo && (
        <DependencyModal
          depEditTodo={depEditTodo}
          depEditMode={depEditMode}
          depInput={depInput}
          depStatus={depStatus}
          currentDependencies={currentDependencies}
          setDepEditMode={setDepEditMode}
          setDepInput={setDepInput}
          handleAddDependency={handleAddDependency}
          handleDeleteDependency={handleDeleteDependency}
          handleCloseModal={handleCloseModal}
        />
      )}
    </div>
  );
}
"use client"
import { useState, useEffect } from 'react';

type Todo = {
  id: number;
  title: string;
  createdAt: Date | string;
  dueDate?: Date | string | null;
  imageURL?: string | null;
  // Add other fields as needed
};

function TodoItem({ todo, onDelete }: { todo: Todo; onDelete: (id: number) => void }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Log imageUrl and state for debugging
  useEffect(() => {
    console.log('Rendering TodoItem:', { title: todo.title, imageUrl: todo.imageURL });
  }, [todo.title, todo.imageURL]);

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [todo.imageURL]);

  useEffect(() => {
    if (imgError) {
      console.error('Image failed to load for todo:', todo.title, todo.imageURL);
    }
    if (imgLoaded) {
      console.log('Image loaded for todo:', todo.title, todo.imageURL);
    }
  }, [imgLoaded, imgError, todo.title, todo.imageURL]);

  return (
    <li
      className="flex justify-between items-center bg-white bg-opacity-90 p-4 mb-4 rounded-lg shadow-lg"
    >
      <div className="flex items-center">
        {/* Image Section */}
        <div className="relative w-20 h-20 mr-4 flex items-center justify-center bg-gray-100 rounded overflow-hidden">
          {todo.imageURL && !imgError ? (
            <>
              <img
                src={todo.imageURL}
                alt={todo.title}
                className={`w-full h-full object-cover ${imgLoaded ? '' : 'invisible'}`}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
              {!imgLoaded && (
                <div className="absolute w-8 h-8 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              No Image
            </div>
          )}
        </div>
        <span className="text-gray-800">
          {todo.title}
          {todo.dueDate && (() => {
            const due = new Date(todo.dueDate as string);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            due.setHours(0, 0, 0, 0);
            const isPast = due < today;
            return (
              <span className={`ml-4 text-sm ${isPast ? 'text-red-500' : 'text-gray-500'}`}>
                Due: {due.toISOString().slice(0, 10)}
              </span>
            );
          })()}
        </span>
      </div>
      <button
        onClick={() => onDelete(todo.id)}
        className="text-red-500 hover:text-red-700 transition duration-300"
      >
        {/* Delete Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </li>
  );
}

export default function Home() {
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      setTodos(data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newTodo,
          dueDate: dueDate || null, }),
      });
      setNewTodo('');
      setDueDate('');
      fetchTodos();
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const handleDeleteTodo = async (id:any) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      fetchTodos();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
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
            onChange={(e) => setNewTodo(e.target.value)}
          
          />
          <input 
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
             />
          <button
            onClick={handleAddTodo}
            className="bg-white text-indigo-600 p-3 rounded-r-full hover:bg-gray-100 transition duration-300"
          >
            Add
          </button>
        </div>
        <ul>
          {todos.map((todo: Todo) => (
            <TodoItem key={todo.id} todo={todo} onDelete={handleDeleteTodo} />
          ))}
        </ul>
      </div>
    </div>
  );
}

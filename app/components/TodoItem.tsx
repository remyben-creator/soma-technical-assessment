import { useState, useEffect } from "react";
import type { Todo } from "../types";

export default function TodoItem({
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

    img.onload = () => setImgLoaded(true);
    img.onerror = () => setImgError(true);

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
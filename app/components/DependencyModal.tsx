import type { Todo } from "../types";

export default function DependencyModal({
  depEditTodo,
  depEditMode,
  depInput,
  depStatus,
  currentDependencies,
  setDepEditMode,
  setDepInput,
  handleAddDependency,
  handleDeleteDependency,
  handleCloseModal,
}: {
  depEditTodo: Todo;
  depEditMode: "choose" | "add" | "delete";
  depInput: string;
  depStatus: string;
  currentDependencies: Todo[];
  setDepEditMode: (mode: "choose" | "add" | "delete") => void;
  setDepInput: (input: string) => void;
  handleAddDependency: () => void;
  handleDeleteDependency: (fromId: number, toId: number) => void;
  handleCloseModal: () => void;
}) {
  return (
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
  );
}
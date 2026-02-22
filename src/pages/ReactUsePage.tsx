import { Suspense, use } from "react";

async function fetchTodo(id: number) {
  const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`);

  if (!res.ok) {
    throw new Error("Failed to fetch todo");
  }

  return res.json() as Promise<{
    userId: number;
    id: number;
    title: string;
    completed: boolean;
  }>;
}

// ✅ Stable promise (important!)
const todoPromise = fetchTodo(1);

function TodoContent() {
  const todo = use(todoPromise);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">React 19 use()</h2>

      <div className="p-4 border rounded bg-muted/40">
        <p>
          <strong>ID:</strong> {todo.id}
        </p>
        <p>
          <strong>Title:</strong> {todo.title}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          {todo.completed ? "✅ Completed" : "❌ Not completed"}
        </p>
      </div>
    </div>
  );
}

export function ReactUsePage() {
  return (
    <Suspense fallback={<div>Loading todo from API...</div>}>
      <TodoContent />
    </Suspense>
  );
}

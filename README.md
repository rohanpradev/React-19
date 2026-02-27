# 🚀 Bun + React 19 Playground

An **experimental React 19 project** built with **Bun**, exploring the latest React features including **new hooks**, **shadcn hooks**, **debounced search**, and **optimistic updates**.

---

## Purpose

This project is a **sandbox for testing and exploring React 19 features**. Key goals:

- Experiment with **new React hooks** and patterns
- Use **shadcn hooks** for reusable and composable state logic
- Implement **debounced search** for performant input handling
- Explore **optimistic updates** and **async actions**
- Evaluate **Bun** as a fast runtime and bundler for React

> ⚡ Note: This is not a production-ready app. Features and APIs may change with future React releases.

---

## Features

- **Debounced Search** – Reduce unnecessary renders and API calls.
- **Shadcn Hooks** – Modular hooks for clean state management.
- **React 19 Experimental Hooks** – Try `use`, `useOptimistic`, `useActionState`, and more.
- **Optimistic UI Updates** – Update UI instantly while async requests complete.
- **Bun-Powered Development** – Lightning-fast builds and hot reload for experimentation.

---

## Tech Stack

- **Bun** – Ultra-fast JavaScript runtime and bundler
- **React 19** – Cutting-edge React version with experimental hooks
- **shadcn/hooks** – Reusable state hooks
- **Tailwind CSS** – Rapid styling for UI components

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- Optional: Node.js for comparison

### Installation

```bash
# Clone the repository
git clone https://github.com/rohanpradev/React-19.git
cd React-19

# Install dependencies with Bun
bun install

# Start development server
bun dev
```

The app runs at `http://localhost:3000` (or the port Bun provides).

---

## Usage

- Explore the **React 19 feature pages** via the sidebar.
- Try **debounced search** inputs and watch performance improvements.
- Experiment with **shadcn hooks** and **optimistic state updates**.
- Great for learning **new React patterns, state management techniques, and experimental APIs**.

---

## Folder Structure

```txt
src/
├─ components/       # Reusable React components (ShadCN UI)
├─hooks/             # Custom hooks (shadcn + experimental)
├─ pages/             # Feature demo pages (React 19 hooks, Actions, etc.)
├─utils/             # Utility functions (debounce, helpers)
└─App.tsx            # Main app component with routing
```

---

## Contributing

This is an **experimental playground**, but contributions are welcome!

1. Fork the repository
2. Create a branch: `git checkout -b feature/experiment`
3. Commit your changes: `git commit -m "Add experimental hook"`
4. Push the branch: `git push origin feature/experiment`
5. Open a pull request

---

## License

MIT License – Feel free to experiment!

---

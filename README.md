# 🚀 Bun + React 19 Playground

An experimental **React 19** project built with **Bun**, exploring the latest React features including **new hooks**, **shadcn hooks**, and **debounced search** functionality.

---

## Purpose

This project is a **sandbox for testing and exploring React 19 features**. It's focused on:

- Experimenting with **new React hooks** and patterns
- Using **shadcn hooks** for reusable state logic
- Implementing **debounced search** for performant input handling
- Evaluating **Bun** as a fast runtime and bundler

> ⚡ Note: This is not a production-ready app. Features and APIs may change with future React releases.

---

## Features

- **Debounced Search** – Reduce unnecessary renders and API calls.
- **Shadcn Hooks** – Modular, reusable hooks for clean state management.
- **Exploring New React 19 Hooks** – Testing features like `use*` experimental hooks.
- **Bun-Powered Development** – Fast builds and hot reload for experimentation.

---

## Tech Stack

- **Bun** – Fast JavaScript runtime and bundler
- **React 19** – Cutting-edge React version
- **shadcn/hooks** – Experimental custom hooks
- **Tailwind CSS** (optional) – Rapid styling for UI experimentation

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- Optional: Node.js for comparison

### Installation

```bash id="lqxz9p"
# Clone the repository
git clone <your-repo-url>
cd <your-repo-directory>

# Install dependencies with Bun
bun install

# Start development server
bun dev
```

App runs at `http://localhost:3000` (or the port Bun provides).

---

## Usage

- Type in the search box to see **debounced results** in action.
- Explore **shadcn hooks** and experiment with **new React 19 hooks**.
- Great for testing **new React patterns, state management ideas, and experimental APIs**.

---

## Folder Structure

```id="wqg7bs"
src/
├─ components/       # Reusable React components
├─ hooks/            # Custom hooks (shadcn and experimental)
├─ pages/            # Example pages for testing features
├─ utils/            # Utility functions (debounce, helpers)
└─ App.jsx           # Main app component
```

---

## Contributing

This is an **experimental playground**, but contributions are welcome!

1. Fork the repo
2. Create a branch: `git checkout -b feature/experiment`
3. Commit: `git commit -m "Add experimental hook"`
4. Push: `git push origin feature/experiment`
5. Open a pull request

---

## License

MIT License – Feel free to experiment!

---

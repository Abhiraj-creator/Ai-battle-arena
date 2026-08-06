# ⚔️ AI Battle Arena

AI Battle Arena is a full-stack web application that lets users submit technical or coding prompts and compare responses from multiple AI providers in a side-by-side battle format. It is designed for developers who want to evaluate model quality, reasoning, and clarity in a fast and interactive way.

The app combines a React-based frontend with a Node.js/Express backend, streaming AI responses in real time and storing chat history for later review.

---

## ✨ What This Project Does

Users can:

- enter a coding or technical question
- choose a judge provider for evaluation
- compare two AI-generated solutions side by side
- view structured reasoning and scoring from the judge model
- log in securely and review previous battles
- interact with a responsive, modern UI

This project is useful for:

- comparing AI model behavior
- evaluating coding solutions
- testing prompt performance
- exploring different reasoning styles across providers

---

## 🧠 Key Features

- 🔍 Prompt-based AI battle sessions
- 🤖 Multi-provider AI generation using LangChain
- ⚖️ Side-by-side solution comparison
- 🧾 Markdown and code rendering for readability
- 🏆 Judge-based evaluation with scoring and reasoning
- ⚡ Real-time streaming responses from the backend
- 🔐 User authentication and protected routes
- 🗂️ Stored chat history for previous sessions

---

## 🛠️ Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- Axios
- React Markdown
- Highlight.js
- Lucide icons

### Backend
- Node.js + Express
- TypeScript
- LangChain
- MongoDB + Mongoose
- JWT-based authentication
- Server-Sent Events (streaming responses)

---

## 📂 Project Structure

```text
Ai-Battle-Arena/
├── Backend/
│   ├── public/
│   ├── src/
│   │   ├── ai/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── types/
│   ├── package.json
│   └── server.ts
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── app/
│   │   ├── components/
│   │   └── features/
│   └── package.json
└── README.md
```

---

## ⚙️ Prerequisites

Before running the app locally, make sure you have:

- Node.js installed
- npm or pnpm
- access to a MongoDB instance
- API keys for at least one supported AI provider

Supported providers in the current backend configuration include:

- Google
- Mistral
- Cohere

---

## 🔐 Environment Variables

Create a `.env` file inside the Backend folder with values similar to the following:

```env
GOOGLE_API_KEY=your_google_api_key
MISTRAL_API_KEY=your_mistral_api_key
COHERE_API_KEY=your_cohere_api_key
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

The backend reads these values from the configuration module in the server environment.

---

## ▶️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ai-battle-arena.git
cd ai-battle-arena
```

### 2. Install backend dependencies

```bash
cd Backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../Frontend
npm install
```

### 4. Start the backend

```bash
cd Backend
npm run dev
```

The backend runs on port 3000 by default.

### 5. Start the frontend

```bash
cd Frontend
npm run dev
```

The frontend runs on Vite and is typically available at:

```text
http://localhost:5173
```

---

## 🚀 How the App Works

1. A user signs in or registers.
2. They enter a prompt in the chat interface.
3. The backend streams a response from the AI model pipeline.
4. A judge model evaluates the generated solutions.
5. The results are displayed in a comparison view.
6. The session is stored in MongoDB for later review through the history API.

---

## 🧩 Main Backend Modules

- auth controller: user registration, login, and session identity
- stream controller: processes prompt submissions and streams AI output
- chat history model: stores battle sessions and evaluations
- AI graph: orchestrates the flow between generation and judging
- routes: exposes endpoints for auth, history, and streaming

---

## 🌐 API Overview

The backend exposes routes under:

- /api/auth for authentication
- /api/history for retrieving stored chat sessions
- /stream for streaming battle results

These are consumed by the frontend through dedicated API modules.

---

## 🧪 Development Notes

- The frontend uses Vite for a fast development experience.
- The backend uses TypeScript and runs through tsx during development.
- The app is currently configured for local development with CORS enabled for the frontend origin.
- Make sure your MongoDB instance is reachable before starting the server.

---

## 🛣️ Future Improvements

Possible next steps for the project include:

- support for more AI providers
- richer battle analytics and scoring history
- improved UI/UX for comparison views
- admin or moderation tools
- deployment to cloud hosting platforms

---

## 📜 License

This project is currently licensed under ISC.

---

## 🙌 Contribution

Feel free to fork the repository, improve the UI, extend the backend logic, or add support for additional model providers.





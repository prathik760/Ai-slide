 # 🧠 AI Slides App — Chat-Based PowerPoint Generator

An AI-powered chat application that generates and edits PowerPoint presentations using **Google Gemini** and **pptxgenjs**.  
Inspired by **MagicSlides AI**, this project allows users to chat with an AI assistant that can instantly create, edit, and download professional presentation slides — all within an elegant chat interface.

---

## 🚀 Features

✅ Chat interface inspired by **MagicSlides AI**  
✅ Powered by **Gemini 2.5 Pro Reasoning Model** for structured content  
✅ Dynamic **PowerPoint generation with pptxgenjs**  
✅ AI-generated slide editing & updates  
✅ Clean UI, icons, and animations  
✅ Support for theme colors and easy Chrome extension integration  

---

## 🏗️ Tech Stack

**Frontend:** React (Vite)  
**Backend:** Node.js + Express  
**AI Model:** Google Gemini 2.5 Pro (via `@google/generative-ai`)  
**Presentation Builder:** pptxgenjs  
**Styling:** CSS + React Icons  

---

## 📁 Project Structure
ai-slides-app/
│
├── frontend/
│ ├── src/
│ ├── public/
│ ├── package.json
│ └── ...
│
├── backend/
│ ├── server.js
│ ├── .env
│ ├── package.json
│ └── ...
│
└── README.md

## ⚙️ Setup Instructions

cd ai-slides-app

## terminal 1 
cd frontend
npm i
npm run dev 

## terminal 2 
cd ../backend
npm i
npm run dev

 ## How It Works

Users type any topic or prompt in the chat, e.g.
“Create a presentation on Artificial Intelligence in Education”.

The backend sends the prompt to the Gemini 2.5 Pro model.

The AI responds with a JSON structure containing slides and content:

{
  "message": "Here’s your presentation on AI in Education.",
  "slides": [
    {"title": "Introduction", "content": "Overview of AI in Education"},
    {"title": "Benefits", "content": "Personalized learning and automation"},
    {"title": "Challenges", "content": "Ethical and technical barriers"}
  ]

}

This data is parsed and used by pptxgenjs to generate slides.

A slide preview is displayed on the right side of the UI.

The user can:

Download the PPT

Modify slides by prompting again (e.g. “Add a conclusion slide”)

Re-generate or edit existing slides dynamically


## Assumptions Made

The application can be integrated into Chrome or other extensions for easy accessibility.

Preferred color customization and animated slide templates can be applied for better UX.

The UI supports dark/light themes in future updates.

The Gemini response is assumed to always return valid JSON format.

One chat session per user — multi-session storage can be added later.

The backend securely handles the Gemini API key and request limits.

## UI/UX

Progress loader (AI thinking animation)

Streaming response visualization

Download as PDF

Chat history with timestamps

User authentication

Saved slides and templates
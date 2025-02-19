# AI-Powered Context-Aware Web Assistant
This is a Chrome extension that provides real-time, context-aware AI assistance for any website. The AI summarizes articles, explains educational content, fact-checks news, analyzes e-commerce reviews and more—directly within the user's browsing experience. It works by using a website-category classifier that classifies whether a website is related to education, food, technology, e-commerce, gaming, fitness, news, sports, travel, and social messaging; then, a self-hosted LLM is given a specific prompt (depending on the website category) to guide its response. For example, if the user is in an educational website, the AI can assist them by explaining complex components in the webpage in a simpler manner to make their lives easier. Furthermore, the AI uses chain-of-thought reasoning to enhance and reason about its responses and think carefully step-by-step.

**Theme**: Generative AI with Impact

## Check-In
**Title of our submission:** AI-Powered Context-Aware Web Assistant

**Team members:**
- Maher Mahmoud ([@Mahmh](https://github.com/Mahmh)): Backend & AI Developer
- Ashish Dhakal ([@found-sec](https://github.com/found-sec)): Frontend developer

**Agreements**:
- [x] All team members agree to abide by the Hackathon Rules.
- [x] This AAAI 2025 hackathon entry was created by the team during the period of the hackathon, February 17 – February 24, 2025.
- [x] The entry includes a 2-minute maximum length demo video here: [Video](./submission_video.mp4)
- [x] The entry clearly identifies the selected theme in the README and the video.

## Tasks
### Frontend Developer
- Develops Chrome Extension UI (Next.js, TailwindCSS).
- Implements DOM extraction for analyzing webpage content.
- Integrates real-time AI responses into the extension.

    | **Component**         | **Technology**          |
    |-----------------------|------------------------|
    | **Chrome Extension**  | Manifest V3, JavaScript |
    | **Frontend Framework** | Next.js (React-based)  |
    | **Styling & UI**      | TailwindCSS             |
    | **Web Scraping (DOM Extraction)** | Playwright, JavaScript |

### Backend & AI Developer
- Develops FastAPI backend for AI processing.
- Implements NLP models for summarization & content adaptation.
- Builds fact-checking & bias detection system.
- Ensures XAI integration for transparency.

    | **Component**        | **Technology**          |
    |----------------------|------------------------|
    | **Backend API**      | FastAPI (Python)        |
    | **AI Models**        | DeepSeek (1.5B), DeepSeek (8B), Llama 3.1 (8B) |
    | **Evidence Search (Retrieval)** | Wikipedia |
    | **Explainability (XAI)** | Chain-of-Thought (CoT) Reasoning |
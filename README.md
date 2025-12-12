# 📱 Post Agent

**Automated Instagram Content Pipeline with AI-Powered Generation, Voting System, and Video Creation**

## 🔗 Quick Links

- **Web App**: https://build-the-feed-app.vercel.app/
- **Telegram Group**: https://t.me/+wpyTw6ofnhMzMWI0
- **Instagram Page**: https://www.instagram.com/buildthefeed/

---

## 📚 Project Overview

**Post Agent** is a comprehensive automation system for Instagram that manages the entire content lifecycle through Artificial Intelligence and cloud service integration. The project combines AI image generation, automatic publishing, a community voting system, and avatar video creation.

### Core Pipelines

1.  **📸 Daily Post Pipeline**
    *   **Prompt Refinement**: Enhances inputs using Google Gemini AI.
    *   **Image Generation**: Creates high-quality images via Gradio (FLUX.1-dev).
    *   **Cloud Storage**: Uploads assets to Cloudinary.
    *   **Auto-Publishing**: Posts directly to Instagram Feed with AI-generated captions.
    *   **Notifications**: Sends real-time updates to Telegram.

2.  **🗳️ Weekly Voting System**
    *   **Collection**: Gathers the week's images.
    *   **Voting**: Engages the community via Telegram inline keyboards.
    *   **Scoring**: Calculates winners based on likes, comments, and votes.
    *   **announcement**: Publishes the winner to Instagram Stories and Carousel.

3.  **🎬 Video Generation Pipeline**
    *   **Avatar Video**: Generates videos using HeyGen (avatar + voiceover).
    *   **Asset Processing**: Auto-converts images (WebP → PNG) for compatibility.
    *   **Reels Publishing**: Posts the final video as an Instagram Reel.
    *   **Lifecycle Management**: Handles callbacks and asset cleanup.

---

## 🏗️ Architecture

The project follows a modular architecture, recently refactored to specific distinct services.

```
app/
├── api/                          # Next.js API Routes (Entry points)
│   ├── cron/                     # Vercel Cron endpoint (Daily Post)
│   ├── health/                   # Health check endpoint
│   ├── managevoting/             # Voting orchestration (Start/Publish)
│   ├── video/                    # Video generation endpoints
│   │   ├── callback/             # HeyGen webhook handler
│   │   └── test/                 # Video generation testing
│   └── vote/                     # Telegram voting callback handler
│
├── handlers/                     # Business Logic Orchestrators
│   ├── postHandler.js            # Daily post pipeline coordinator
│   ├── videoCallbackHandler.js   # Video publishing logic
│   └── voteHandler.js            # Voting system logic
│
├── services/                     # Core Business Services (Refactored)
│   ├── ai/                       # AI Integration
│   │   ├── gemini.js             # Google Gemini Client
│   │   ├── imageGenerator.js     # Gradio Image Generation
│   │   ├── promptRefiner.js      # Prompt & Caption logic
│   │   └── videoGenerator.js     # HeyGen Video Integration
│   │
│   ├── cloudinary/               # Asset Management
│   │   └── uploader.js           # Cloudinary Upload/Delete
│   │
│   ├── common/                   # Shared Utilities
│   │   ├── crypto.js             # Token Encryption (AES-256-GCM)
│   │   ├── env.js                # Environment Helpers
│   │   └── imageProcessor.js     # Image Manipulation (Sharp)
│   │
│   ├── cron/                     # Scheduled Jobs Logic
│   │   └── votingJob.js          # Weekly Voting Logic
│   │
│   ├── instagram/                # Instagram Graph API
│   │   ├── client.js             # API Client & Media Creation
│   │   ├── publisher.js          # High-level Publishing Logic
│   │   └── tokenManager.js       # Long-lived Token Refresh
│   │
│   ├── middleware/               # Application Middleware
│   │   └── error.js              # Global Error Handling & Telegram Reporting
│   │
│   ├── telegram/                 # Messaging
│   │   └── notifier.js           # Bot Notifications & Keyboards
│   │
│   └── voting/                   # Logic
│       └── scoring.js            # Weighted Scoring System
│
├── db/                           # Data Access Layer
│   └── dbClient.js               # PostgreSQL Client (Neon)
│
└── examples/
    └── testFullPipeline.js       # E2E Pipeline Test Script
```

---

## ✨ Features

### Core Capabilities
*   ✅ **Modular Architecture**: Clean separation of concerns with a service-oriented structure.
*   ✅ **Comprehensive Documentation**: JSDoc annotated methods.
*   ✅ **Centralized Error Handling**: Automated Telegram reporting for all exceptions.
*   ✅ **Security**: AES-256-GCM encryption for stored tokens.
*   ✅ **Multi-page Support**: scalable architecture for managing multiple Instagram accounts.

### AI & Content Generation
*   ✅ **Generative AI**: Integration with Gradio (FLUX.1-dev, Stable Diffusion).
*   ✅ **Smart Prompts**: Prompt refinement and enhancement via Google Gemini.
*   ✅ **Dynamic Captions**: Context-aware captions with automatic hashtag generation.
*   ✅ **Asset Optimization**: Automatic format conversion and optimization.

### Instagram Integration
*   ✅ **Full Media Support**: Feed Posts, Stories, Carousels, and Reels.
*   ✅ **Robust Token Management**: Automatic long-lived token refreshing.
*   ✅ **Async Publishing**: Polling mechanism for media container status.
*   ✅ **Analytics**: Retrieval of permalinks and engagement metrics.

### Voting Ecosystem
*   ✅ **Interactive Voting**: Telegram-based inline keyboards.
*   ✅ **Integrity**: Duplicate vote prevention and user tracking.
*   ✅ **Weighted Scoring**: Configurable algorithm (Likes vs Comments vs Votes).
*   ✅ **Automated Recognition**: Auto-publishing of weekly winners.

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/Post-Agent.git
cd Post-Agent

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### 2. Configuration

Configure your `.env` file with the necessary credentials:

```env
# === Database (Neon PostgreSQL) ===
DATABASE_URL=postgres://user:pass@host/db
INSTAGRAM_TOKEN_TYPE=instagram_long_lived

# === Security ===
TOKENS_CRYPTO_KEY=your_32_byte_key_in_base64_or_hex

# === Instagram ===
IG_USER_ID=your_instagram_business_account_id
INSTAGRAM_GRAPH_VERSION=v21.0
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret

# === AI Services ===
GOOGLE_API_KEY=your_google_api_key
GEMINI_MODEL=gemini-2.0-flash
GRADIO_SPACE_ID=black-forest-labs/FLUX.1-dev
HUGGING_FACE_TOKEN=your_hf_token

# === Storage ===
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=dailypost

# === Telegram ===
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
DAILY_PICS_THREAD_ID=thread_id_for_daily_posts
VOTE_HUB_THREAD_ID=thread_id_for_voting
WEEKLY_WINNER_THREAD_ID=thread_id_for_winners

# === Video (HeyGen) ===
VIDEO_GENERATION_API_KEY=your_heygen_api_key
VIDEO_GENERATION_AVATAR_ID=your_avatar_id
VIDEO_GENERATION_VOICE_ID=your_voice_id
VIDEO_GENERATION_CALLBACK_URL=https://your-app.vercel.app/api/video/callback
```

### 3. Database Setup

Execute the SQL commands found in the architecture section or documentation to create the necessary tables (`tokens`, `prompt_queue`, `voting_images`, `voting_users`, `telegram_messages`, `video_asset`).

### 4. Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## 🎯 Usage

### Automatic Daily Post
The daily posting schedule is managed via Vercel Cron Jobs:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### Manual Testing
Run the pipeline locally:
```bash
node app/examples/testFullPipeline.js
```

### Voting Management
Trigger voting actions via API (e.g., using cURL or Postman):
```bash
# Start Weekly Voting
curl -X POST https://your-app.vercel.app/api/managevoting?action=start

# Publish Winner
curl -X POST https://your-app.vercel.app/api/managevoting?action=publish
```

---

## 🔧 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cron` | GET | Triggers the daily post pipeline. |
| `/api/health` | GET | Service health check. |
| `/api/managevoting` | POST | Manages voting lifecycle (`action=start/publish`). |
| `/api/vote` | POST | Webhook for Telegram voting callbacks. |
| `/api/video/callback` | POST | Webhook for HeyGen video completion. |
| `/api/video/test` | GET | Triggers a test video generation. |

---

## 🐛 Troubleshooting

*   **Cron Job Failures**: Check Vercel logs and ensure `DATABASE_URL` is accessible.
*   **Instagram Publishing Errors**: Verify the `TOKENS_CRYPTO_KEY` matches the one used to encrypt the token. Ensure the Instagram account is a professional/business account.
*   **Gemini/AI Errors**: Verify API quotas and key validity.

---

## 🔐 Security

The application prioritizes security:
*   **Token Encryption**: Instagram tokens are stored encrypted in the database.
*   **Environment Variables**: All sensitive keys are managed via `.env`.
*   **Error Masking**: Internal error details are logged to Telegram but masked in API responses.

---

## 👨‍💻 Author

**Alessandro Arbasino**

-   Instagram: [@buildthefeed](https://www.instagram.com/buildthefeed/)
-   Telegram: [Build The Feed Community](https://t.me/+wpyTw6ofnhMzMWI0)

---

## 🙏 Acknowledgments

-   **Google Gemini** for advanced reasoning and prompt refinement.
-   **Gradio & Hugging Face** for democratizing AI image generation.
-   **HeyGen** for cutting-edge avatar video technology.
-   **Neon & Vercel** for the robust serverless infrastructure.

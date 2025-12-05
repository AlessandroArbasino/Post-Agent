# 📱 Post Agent

**Automated Instagram Content Pipeline with AI-Powered Generation, Voting System, and Video Creation**

## 🔗 Quick Links

- **Web App**: https://build-the-feed-app.vercel.app/
- **Telegram Group**: https://t.me/+wpyTw6ofnhMzMWI0
- **Instagram Page**: https://www.instagram.com/buildthefeed/

---

## 📚 Project Overview

**Post Agent** è un sistema completo di automazione per Instagram che gestisce l'intero ciclo di vita dei contenuti attraverso intelligenza artificiale e integrazione con servizi cloud. Il progetto combina generazione di immagini AI, pubblicazione automatica, sistema di votazione comunitario e creazione di video con avatar.

### Flussi Principali

1. **📸 Daily Post Pipeline**
   - Raffinamento prompt con Gemini AI
   - Generazione immagini con Gradio (FLUX.1-dev)
   - Upload su Cloudinary
   - Pubblicazione automatica su Instagram
   - Notifiche Telegram

2. **🗳️ Weekly Voting System**
   - Raccolta immagini della settimana
   - Votazione via Telegram (inline keyboard)
   - Pubblicazione del vincitore (Stories + Carousel)
   - Gestione utenti e tracking voti

3. **🎬 Video Generation Pipeline**
   - Generazione video con HeyGen (avatar + voiceover)
   - Conversione automatica immagini (WebP → PNG)
   - Pubblicazione come Instagram Reel
   - Callback automatico e cleanup assets

---

## 🏗️ Architettura

```
app/
├── api/                          # Next.js API Routes
│   ├── cron/                     # Endpoint per Vercel Cron (daily post)
│   ├── health/                   # Health check endpoint
│   ├── managevoting/             # Gestione votazioni (start/publish)
│   ├── video/
│   │   ├── avatars/              # Lista avatar HeyGen disponibili
│   │   ├── callback/             # Callback da HeyGen (video pronto)
│   │   └── test/                 # Test generazione video
│   └── vote/                     # Endpoint per gestione voti Telegram
│
├── handlers/                     # Business Logic Handlers
│   ├── postHandler.js            # Pipeline completa pubblicazione post
│   ├── videoCallbackHandler.js  # Gestione callback video HeyGen
│   └── voteHandler.js            # Orchestrazione flusso votazioni
│
├── db/
│   └── dbClient.js               # Client PostgreSQL (Neon) - gestione token, prompt, voti
│
├── utils/                        # Utility Functions
│   ├── crypto.js                 # Crittografia AES-256-GCM per token
│   ├── envUtils.js               # Gestione multi-pagina Instagram
│   ├── errorMiddleware.js        # Error handling e reporting Telegram
│   ├── geminiClient.js           # Client Google Gemini AI
│   ├── generateImageGradio.js    # Generazione immagini via Gradio
│   ├── generateVideo.js          # Integrazione HeyGen API
│   ├── imageConvert.js           # Conversione formati immagine (Sharp)
│   ├── instagramToken.js         # Refresh token Instagram
│   ├── instagramUtility.js       # Helper Instagram Graph API
│   ├── publishToInstagram.js     # Pubblicazione Instagram (post/stories/carousel)
│   ├── refinePrompt.js           # Raffinamento prompt e caption con Gemini
│   ├── scoring.js                # Sistema di scoring per votazioni
│   ├── telegramNotifier.js       # Notifiche e inline keyboard Telegram
│   ├── uploadToCloudinary.js     # Upload e gestione asset Cloudinary
│   └── votingCron.js             # Logica votazioni settimanali
│
└── examples/
    └── testFullPipeline.js       # Test completo della pipeline
```

---

## ✨ Features

### Core Features
- ✅ **Architettura modulare** con separazione chiara delle responsabilità
- ✅ **Documentazione JSDoc completa** su tutti i metodi
- ✅ **Error handling centralizzato** con notifiche Telegram
- ✅ **Crittografia sicura** dei token (AES-256-GCM)
- ✅ **Multi-page support** per gestire più account Instagram

### AI & Image Generation
- ✅ **Generazione immagini AI** via Gradio Client (FLUX.1-dev, Stable Diffusion)
- ✅ **Raffinamento prompt** con Google Gemini AI
- ✅ **Caption intelligenti** con hashtag automatici
- ✅ **Conversione formati** (WebP → PNG) con Sharp

### Instagram Integration
- ✅ **Pubblicazione automatica** (Post, Stories, Carousel, Reels)
- ✅ **Token management** con auto-refresh
- ✅ **Polling status** per media container
- ✅ **Gestione permalink** e metriche

### Voting System
- ✅ **Inline keyboard Telegram** per votazioni
- ✅ **Tracking utenti** e prevenzione voti duplicati
- ✅ **Sistema di scoring** (likes + comments + votes)
- ✅ **Pubblicazione automatica vincitore** (Stories + Carousel)
- ✅ **Annotazione immagini** con numeri di voto (Cloudinary)

### Video Generation
- ✅ **Integrazione HeyGen** per video con avatar
- ✅ **Text-to-speech** con voci personalizzabili
- ✅ **Callback automatico** per pubblicazione Reel
- ✅ **Cleanup assets** post-pubblicazione

### Storage & Hosting
- ✅ **Cloudinary** per hosting immagini pubbliche
- ✅ **PostgreSQL (Neon)** per persistenza dati
- ✅ **Vercel** per hosting e Cron jobs

---

## 🚀 Quick Start

### 1. Installazione

```bash
# Clone repository
git clone https://github.com/yourusername/Post-Agent.git
cd Post-Agent

# Installa dipendenze
npm install

# Copia file .env di esempio
cp .env.example .env
```

### 2. Configurazione Variabili d'Ambiente

Configura il file `.env` con le tue credenziali:

```env
# === Database (Neon PostgreSQL) ===
DATABASE_URL=postgres://user:pass@host/db
INSTAGRAM_TOKEN_TYPE=instagram_long_lived

# === Crittografia Token ===
TOKENS_CRYPTO_KEY=your_32_byte_key_in_base64_or_hex

# === Instagram ===
IG_USER_ID=your_instagram_business_account_id
INSTAGRAM_GRAPH_VERSION=v21.0
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret

# === Google Gemini AI ===
GOOGLE_API_KEY=your_google_api_key
GEMINI_MODEL=gemini-2.0-flash

# === Gradio (Image Generation) ===
GRADIO_SPACE_ID=black-forest-labs/FLUX.1-dev
HUGGING_FACE_TOKEN=your_hf_token

# === Cloudinary ===
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

# === HeyGen (Video Generation) ===
VIDEO_GENERATION_API_KEY=your_heygen_api_key
VIDEO_GENERATION_AVATAR_ID=your_avatar_id
VIDEO_GENERATION_VOICE_ID=your_voice_id
VIDEO_GENERATION_CALLBACK_URL=https://your-app.vercel.app/api/video/callback
HEYGEN_VIDEO_CREATION_URL=https://api.heygen.com/v1/asset/image/upload
HEYGEN_UPLOAD_ASSET_URL=https://api.heygen.com/v1/video.create

# === Prompt Templates ===
PROMPT_REFINE_INSTRUCTION=Rendi più descrittivo il seguente prompt per generazione di immagini:
PROMPT_DEFAULT_INSTRUCTION=Genera un prompt creativo per una scena visiva accattivante
PROMPT_CAPTION_INSTRUCTION=Scrivi una caption breve e coinvolgente per Instagram basata su: {prompt}. Includi fino a {N} hashtag pertinenti.
VIDEO_SPEECH_PROMPT=Genera un breve testo parlato (max 30 secondi) basato su:

# === Voting Configuration ===
VOTING_ENABLED=true
INSTAGRAM_DEFAULT_START_VOTING_STORY_URL=https://your-cloudinary-url/start-voting.mp4
INSTAGRAM_DEFAULT_END_VOTING_STORY_URL=https://your-cloudinary-url/end-voting.mp4
WINNING_CAROUSEL_CAPTION_TEMPLATE=🏆 Vincitore della settimana! 🎉
CLOUDINARY_ENABLE_DELETE=false
CAPTION_MAX_HASHTAGS=5

# === Scoring Multipliers ===
SCORE_LIKE_MULTIPLIER=1
SCORE_COMMENT_MULTIPLIER=2
SCORE_VOTE_MULTIPLIER=3
```

### 3. Setup Database

Crea le seguenti tabelle nel tuo database PostgreSQL:

```sql
-- Tabella token Instagram
CREATE TABLE tokens (
  id SERIAL PRIMARY KEY,
  token_type VARCHAR(50) UNIQUE NOT NULL,
  token TEXT NOT NULL,
  create_date TIMESTAMP DEFAULT NOW()
);

-- Tabella coda prompt
CREATE TABLE prompt_queue (
  id SERIAL PRIMARY KEY,
  prompt TEXT NOT NULL,
  create_date TIMESTAMP DEFAULT NOW()
);

-- Tabella immagini per votazione
CREATE TABLE voting_images (
  image_id SERIAL PRIMARY KEY,
  instagram_post_id VARCHAR(100),
  image_url TEXT UNIQUE NOT NULL,
  cloudinary_folder TEXT,
  votes INTEGER DEFAULT 0,
  voting_number INTEGER,
  instagram_caption TEXT,
  sent_date TIMESTAMP,
  create_date TIMESTAMP DEFAULT NOW()
);

-- Tabella utenti votanti
CREATE TABLE voting_users (
  id SERIAL PRIMARY KEY,
  telegram_user_id VARCHAR(100) UNIQUE NOT NULL,
  voted_image_number INTEGER,
  create_date TIMESTAMP DEFAULT NOW()
);

-- Tabella messaggi Telegram
CREATE TABLE telegram_messages (
  id SERIAL PRIMARY KEY,
  telegram_message_id VARCHAR(100) NOT NULL,
  message_type VARCHAR(50) UNIQUE NOT NULL,
  create_date TIMESTAMP DEFAULT NOW()
);

-- Tabella asset video
CREATE TABLE video_asset (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) UNIQUE NOT NULL,
  video_asset_id TEXT NOT NULL,
  create_date TIMESTAMP DEFAULT NOW()
);
```

### 4. Deploy su Vercel

```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configura le variabili d'ambiente su Vercel Dashboard
# Configura i Cron jobs in vercel.json
```

---

## 🎯 Usage

### Daily Post Automatico

Il Cron job giornaliero viene eseguito automaticamente da Vercel:

```javascript
// Configurazione in vercel.json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 8 * * *"  // Ogni giorno alle 8:00
    }
  ]
}
```

### Test Manuale Pipeline

```bash
# Test completo della pipeline
node app/examples/testFullPipeline.js
```

### Gestione Votazioni

```bash
# Avvia votazione settimanale
curl -X POST https://your-app.vercel.app/api/managevoting?action=start

# Pubblica vincitore
curl -X POST https://your-app.vercel.app/api/managevoting?action=publish
```

### Test Generazione Video

```bash
# Test video con HeyGen
curl https://your-app.vercel.app/api/video/test
```

---

## 📊 API Endpoints

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/cron` | GET | Esegue il post giornaliero |
| `/api/health` | GET | Health check |
| `/api/managevoting?action=start` | POST | Avvia votazione settimanale |
| `/api/managevoting?action=publish` | POST | Pubblica vincitore |
| `/api/vote` | POST | Gestisce voti da Telegram |
| `/api/video/callback` | POST | Callback da HeyGen |
| `/api/video/test` | GET | Test generazione video |
| `/api/video/avatars` | GET | Lista avatar disponibili |

---

## 🔧 Funzioni Principali

### Handlers

#### `postHandler.executeDailyPost(imageOptions, instagramPageName)`
Esegue la pipeline completa di pubblicazione:
1. Recupera prompt dal database (o genera default)
2. Raffina il prompt con Gemini AI
3. Genera immagine con Gradio
4. Upload su Cloudinary
5. Genera caption Instagram
6. Pubblica su Instagram
7. Salva in database per votazione
8. Invia notifica Telegram

#### `voteHandler.voteHandler()`
Gestisce il flusso di votazione:
- Se nessuna immagine inviata: avvia votazione
- Se immagini già inviate: pubblica vincitore

#### `videoCallbackHandler.manageVideoCallback({ videoUrl })`
Gestisce callback da HeyGen:
- Pubblica video come Reel
- Elimina asset temporanei
- Aggiorna database

### Utils Principali

#### Generazione Immagini
```javascript
const { generateImageGradio } = require('./utils/generateImageGradio');

const result = await generateImageGradio(prompt, {
  width: 768,
  height: 768,
  guidance_scale: 4,
  num_inference_steps: 28
});
// Returns: { success, sourceUrl, sourceUri, executionTime, settings }
```

#### Pubblicazione Instagram
```javascript
const { publishToInstagram } = require('./utils/publishToInstagram');

const result = await publishToInstagram({
  url: imageUrl,
  caption: 'Your caption',
  mediaType: 'STORIES', // or null for feed post
  isVideo: false
});
// Returns: { success, creationId, mediaId, permalink }
```

#### Generazione Video
```javascript
const { generateVideo } = require('./utils/generateVideo');

const result = await generateVideo({
  backgroundUrl: imageUrl,
  caption: 'Caption for speech generation'
});
// Returns: { videoId, backgroundAssetId }
```

#### Sistema di Scoring
```javascript
const { getBestPhoto } = require('./utils/scoring');

const winner = await getBestPhoto();
// Returns: { image_url, like_count, comments_count, score, instagram_caption }
```

---

## 🐛 Troubleshooting

### Errori Comuni

**Cron job non si esegue**
- Verifica configurazione `vercel.json`
- Controlla i log su Vercel Dashboard
- Verifica tutte le variabili d'ambiente

**Errore upload Cloudinary**
- Verifica credenziali Cloudinary
- Controlla che l'URL immagine sia accessibile pubblicamente

**Errore pubblicazione Instagram**
- Verifica token nel database
- Controlla `TOKENS_CRYPTO_KEY` corretta
- Verifica che l'account sia Business Account
- Controlla che l'immagine sia accessibile da Instagram

**Errore generazione video HeyGen**
- Verifica API key HeyGen
- Controlla che il callback URL sia pubblico
- Verifica avatar_id e voice_id validi

**Errori Gemini AI**
- Verifica `GOOGLE_API_KEY`
- Controlla limiti API quota

---

## 📈 Monitoring & Logs

- **Vercel Logs**: Dashboard → Logs
- **Telegram Notifications**: Errori automatici via bot
- **Database**: Query dirette per verificare stato

---

## 🔐 Security

- ✅ Token Instagram crittografati con AES-256-GCM
- ✅ Variabili d'ambiente per credenziali sensibili
- ✅ Validazione input su tutti gli endpoint
- ✅ Error handling senza esposizione dettagli interni

---

## 🤝 Contributing

Contributi benvenuti! Per favore:
1. Fork del repository
2. Crea un branch per la tua feature
3. Commit delle modifiche
4. Push al branch
5. Apri una Pull Request

---

## 📝 License

MIT License - vedi file [LICENSE](LICENSE)

---

## 👨‍💻 Author

**Alessandro Arbasino**

- Instagram: [@buildthefeed](https://www.instagram.com/buildthefeed/)
- Telegram: [Build The Feed Community](https://t.me/+wpyTw6ofnhMzMWI0)

---

## 🙏 Acknowledgments

- **Google Gemini AI** per il raffinamento prompt
- **Gradio/Hugging Face** per la generazione immagini
- **HeyGen** per la generazione video con avatar
- **Cloudinary** per l'hosting immagini
- **Neon** per il database PostgreSQL serverless
- **Vercel** per l'hosting e i Cron jobs

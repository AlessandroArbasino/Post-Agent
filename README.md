# 📱 Post Agent

## 🔗 Quick Links

- Web App: https://build-the-feed-app.vercel.app/
- Telegram Group: https://t.me/+wpyTw6ofnhMzMWI0
- Instagram Page: https://www.instagram.com/buildthefeed/

## 📚 Project overview

The Post Agent automates content publishing for Instagram starting from a user prompt via a Web App. A daily Cron Job refines this prompt using an LLM to generate a high-quality visual idea. The system generates the image and caption, then saves the visual asset to Cloud Storage. It automatically publishes the final content to the linked Instagram account. Finally, a notification message containing the published post and useful details is dispatched via Telegram.

## 📁 Project Structure

```
app/
├── handlers/
│   └── postHandler.js            # Handler principale del flusso di pubblicazione
├── db/
│   └── dbClient.js               # Accesso a Neon/Postgres (token IG, coda prompt)
├── utils/
│   ├── crypto.js                 # Cifratura/decifratura token (AES-256-GCM)
│   ├── geminiClient.js           # Inizializzazione client Gemini
│   ├── generateImageGradio.js    # Generazione immagini con @gradio/client (URL/URI)
│   ├── instagramToken.js         # Gestione refresh long-lived token IG
│   ├── publishToInstagram.js     # Pubblicazione su Instagram Graph API
│   ├── refinePrompt.js           # Raffinamento prompt e caption con Gemini AI
│   ├── telegramNotifier.js       # Notifiche Telegram (successo/errore)
│   └── uploadToCloudinary.js     # Upload immagini su Cloudinary (da URL o buffer)
├── examples/
│   └── testFullPipeline.js       # Esegue l'intera pipeline
└── README.md                     # Questa documentazione
```

## 🚀 Features

- ✅ **Modular architecture**: each function in a dedicated file
- ✅ **Image generation (Gradio)**: uses `@gradio/client` (e.g., `black-forest-labs/FLUX.1-dev`)
- ✅ **Cloudinary upload**: supports URL or Buffer/data URL
- ✅ **Instagram publishing**: via Graph API
- ✅ **AI refinement**: improves prompts with Gemini
- ✅ **Telegram notifications**: pipeline success/error with `.env` templates
- ✅ **Detailed logging** and best-effort error handling

## ⚙️ Setup

### 1. Environment Variables

Add these variables to the `.env` file (project root):

```env
# Cloudinary (per hosting immagini pubbliche)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=instagram-lambda

# Instagram Graph API (token da DB o fallback via .env)
IG_USER_ID=your_instagram_business_account_id
INSTAGRAM_GRAPH_VERSION=v21.0
# Fallback opzionale se non usi il DB
INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token

# Database (Neon/Postgres) per token IG e coda prompt
DATABASE_URL=postgres://user:pass@host/db
INSTAGRAM_TOKEN_TYPE=instagram_long_lived

# Cifratura token IG nel DB
TOKENS_CRYPTO_KEY=base64_or_hex_32_bytes_key

# Google AI (Gemini)
GOOGLE_API_KEY=your_google_api_key
DEFAULT_MODEL=gemini-2.0-flash

# Istruzioni prompt (Gemini)
PROMPT_REFINE_INSTRUCTION=Rendi più descrittivo il seguente prompt per generazione di immagini:
PROMPT_DEFAULT_INSTRUCTION=Genera un prompt creativo per una scena visiva accattivante
PROMPT_CAPTION_INSTRUCTION=Scrivi una caption breve e coinvolgente per Instagram basata su: {prompt}. Includi fino a {N} hashtag pertinenti e non ripetitivi.

# Gradio (generazione immagini)
GRADIO_SPACE_ID=black-forest-labs/FLUX.1-dev
HUGGING_FACE_TOKEN=

# Parametri default immagine
GENERATED_IMAGE_WIDTH=768
GENERATED_IMAGE_HEIGHT=768
GENERATED_IMAGE_STEPS=28
GENERATED_IMAGE_CFG=4

# Telegram (notifiche)
TELEGRAM_BOT_TOKEN=123456789:ABC...
TELEGRAM_CHAT_ID=123456789
TELEGRAM_PARSE_MODE=
TELEGRAM_SUCCESS_TEMPLATE=Pipeline OK\nOriginal: {0}\nRefined: {1}\nCaption: {2}
TELEGRAM_FAILURE_TEMPLATE=Pipeline KO\nOriginal: {0}\nRefined: {1}\nError: {2}

# Configurazione Post Giornaliero (facoltativo)
DAILY_POST_PROMPT=a beautiful futuristic cityscape at sunset with flying cars and neon lights
DAILY_POST_CAPTION=✨ Daily AI Art ✨\n\n#AI #Art #GenerativeAI #DailyPost
```

> Nota: se `DATABASE_URL` non è impostata, l'app funziona comunque. In tal caso il token Instagram viene letto da `INSTAGRAM_ACCESS_TOKEN` e le operazioni su DB vengono saltate.

### 2. How to obtain credentials

#### **Cloudinary**
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy `Cloud Name`, `API Key`, and `API Secret`

#### **Instagram Access Token (managed via DB o via `.env`)**
1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Link an Instagram Business account
3. Generate a long-lived Access Token
4. Save the token in DB table `tokens` with `token_type = INSTAGRAM_TOKEN_TYPE`
5. Get `IG_USER_ID` from Graph API Explorer
6. In alternativa, puoi impostare direttamente `INSTAGRAM_ACCESS_TOKEN` nel file `.env` e non usare il DB (funziona anche senza `DATABASE_URL`).

## 📦 Installation

```bash
# Installa le dipendenze
npm install
```

## 🎯 Usage

### Run pipeline (example)

```bash
node app/examples/testFullPipeline.js
```

The pipeline:
1. 🤖 Refine prompt (Gemini, optional)
2. 🎨 Generate image with Gradio
3. 📤 Upload to Cloudinary (public URL)
4. ✍️ Generate Instagram caption (Gemini, with hashtags)
5. 📱 Publish to Instagram
6. 📣 Send Telegram notification

### Output Esempio

```
██████████████████████████████████████████████████████████████████████
█                                                                    █
█  📅 INSTAGRAM DAILY POST SCHEDULER - AVVIATO                       █
█                                                                    █
██████████████████████████████████████████████████████████████████████

✅ Configurazione validata con successo

⚙️  CONFIGURAZIONE:
   📊 Intervallo: 24 ore
   📝 Prompt: a beautiful futuristic cityscape at sunset with flying...
   💬 Didascalia: ✨ Daily AI Art ✨...

🔄 ESECUZIONE #1

======================================================================
🚀 AVVIO POST GIORNALIERO - PIPELINE COMPLETA
⏰ Timestamp: 2025-09-30T15:36:31.000Z
======================================================================

🤖 FASE 1: Raffinamento prompt con Gemini AI
   Prompt originale: "a beautiful futuristic cityscape at sunset"
   ✅ Prompt raffinato: "A breathtaking futuristic metropolis at golden hour, towering..."

🎨 FASE 2: Generazione immagine con Gradio
   ✅ Buffer generato: 1,234,567 bytes
   ⏱️  Tempo generazione: 12.34s

📤 FASE 3: Upload su Cloudinary
   ✅ Immagine caricata: https://res.cloudinary.com/...

📱 FASE 4: Pubblicazione su Instagram
📋 Step 1: Creazione media container...
✅ Media container creato: 12345678901234567
📤 Step 2: Pubblicazione media...
🎉 Post pubblicato con successo! Media ID: 98765432109876543

======================================================================
✅ POST GIORNALIERO COMPLETATO CON SUCCESSO
⏱️  Tempo totale di esecuzione: 67.85s
📸 Instagram Media ID: 98765432109876543
🎨 Prompt raffinato: "A breathtaking futuristic metropolis at golden..."
======================================================================

------------------------------------------------------------
🔔 Next run handled by Vercel Cron
   (configured on a daily interval)
------------------------------------------------------------
```

## 🔧 Available Functions

### `handlers/postHandler.js`
Coordinates the full AI-driven publishing flow, using the IG token from DB.

**Metodi:**
- `executeDailyPost(imageOptions)` - Full pipeline:
  1. Fetch prompt from DB queue (fallback to default via Gemini)
  2. Refine prompt with Gemini
  3. Generate image with Gradio (returns `sourceUrl` and `sourceUri`)
  4. Upload to Cloudinary from `sourceUri` (data URL) or `sourceUrl`
  5. Publish on Instagram (token from DB, auto-refresh if needed)

### `utils/uploadToCloudinary.js`
Handles image uploads to Cloudinary.

**Metodi:**
- `uploadToCloudinary(imageUrl, options)` - Upload from URL or data URL (data:image/...;base64,...)
- `uploadBufferToCloudinary(buffer, options)` - Upload from Buffer

### `utils/publishToInstagram.js`
Publishes to Instagram via Graph API, using token from DB with managed refresh.

**Metodi:**
- `publishToInstagram(imageUrl, caption)` - Creates media, publishes, and also returns `permalink`

### `utils/refinePrompt.js`
Refines prompts and generates captions using Google Gemini AI.

**Metodi:**
- `refinePrompt(prompt, model)` → `{ success, original, refined, model }`
- `generateInstagramCaption(refinedPrompt, { maxHashtags, model })` → `{ success, caption, model }`
- `getPromptFromDefault({ model })` → `{ success, prompt, model }`
- `initializeGeminiClient()` - Initializes the Gemini client

### Instagram Caption (Gemini)
Generate a caption from a refined prompt with up to N hashtags and `{prompt}` placeholder:

- Funzione: `generateInstagramCaption(refinedPrompt, { maxHashtags = 5, model = 'gemini-2.0-flash' })`
- Restituisce: `{ success, caption, model }`
- Uses ENV `PROMPT_CAPTION_INSTRUCTION` with `{N}` and `{prompt}` placeholders
- Used in `handlers/postHandler.js` to create the caption before publishing.

Esempio d'uso:

```js
const { refinePrompt, generateInstagramCaption, getPromptFromDefault } = require('../utils/refinePrompt');

// 1) Get prompt (fallback to Gemini default)
const dbPrompt = null; // e.g., fetch from DB
const originalPrompt = dbPrompt?.prompt || (await getPromptFromDefault({ model: process.env.DEFAULT_MODEL })).prompt;

// 2) Refine
const r = await refinePrompt(originalPrompt, process.env.DEFAULT_MODEL);
if (!r.success) throw new Error(r.error);

// 3) Caption
const cap = await generateInstagramCaption(r.refined, {
  maxHashtags: parseInt(process.env.CAPTION_MAX_HASHTAGS || '5', 10),
  model: process.env.DEFAULT_MODEL || 'gemini-2.0-flash',
});

const caption = cap.success ? cap.caption : r.refined; // fallback
```

Related `.env` variables:

```env
# Modello di default per refine/caption
DEFAULT_MODEL=gemini-2.0-flash

# Numero massimo di hashtag nella caption
CAPTION_MAX_HASHTAGS=5

# Istruzione opzionale per guidare lo stile della caption
# Usa {N} e {prompt} come placeholder
PROMPT_CAPTION_INSTRUCTION=Scrivi una caption breve e coinvolgente per Instagram basata su: {prompt}. Includi fino a {N} hashtag pertinenti e non ripetitivi.
```

### `utils/generateImageGradio.js`
Generates images via `@gradio/client` and returns the source URL and a data URI usable for direct upload.

**Metodi:**
- `generateImageGradio(prompt, options)` → `{ success, sourceUrl, sourceUri, executionTime, settings }`

Notes:
- `sourceUrl` is the URL returned by the Gradio Space (if available)
- `sourceUri` is a data URL (data:image/...;base64,...) ready for `uploadToCloudinary`

## 🐛 Troubleshooting

### Vercel Cron job does not run
- Ensure all env variables are configured
- Check Cron configuration on Vercel (Dashboard → Settings → Cron Jobs)
- Check logs of the API endpoint invoked by the Cron (Vercel Logs)
### Cloudinary upload error
- Verify Cloudinary credentials
- Ensure the image URL is reachable

### Instagram publishing error
- Verify the token exists in DB and is decryptable (correct `TOKENS_CRYPTO_KEY`)
- Ensure the URL or data URL is acceptable by Cloudinary and publicly accessible to Instagram
- Ensure you have an Instagram Business Account and `IG_USER_ID` set

### Prompt refinement error (Gemini)
- Verify `GOOGLE_API_KEY` is properly configured
- Check Gemini API usage limits

### Image generation error (Gradio)
- Verify `GRADIO_SPACE_ID` is reachable
- Check parameters like `width`, `height`, `num_inference_steps`, `guidance_scale`

## 📝 Notes

- Image generation depends on the selected Gradio Space
- Instagram may take a few seconds to process the image

<!-- Se reintrodurrai uno scheduler, documentalo qui. -->

## ▶️ Running on Vercel (Cron)

- **Hosting**: periodic execution is handled by **Vercel Cron**.
- **Endpoint**: configure an API endpoint (e.g., `/api/cron`) that calls `executeDailyPost()`.
- **Scheduling**: set frequency in the Vercel Dashboard.

Example `vercel.json` configuration (indicative):

```json
{
  "crons": [
    { "path": "/api/cron", "schedule": "0 8 * * *" }
  ]
}
```

Manual test:
- Local: call `http://localhost:3000/api/cron`
- Hosted: perform a GET request to `https://<your-project>.vercel.app/api/cron`

## 📄 License

MIT

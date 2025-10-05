# 📱 Instagram Daily Post Lambda

Sistema modulare per la pubblicazione automatica giornaliera su Instagram, strutturato come una Lambda function con funzioni separate in file diversi.

## 📁 Struttura del Progetto

```
lambda/
├── config.js                      # Configurazione centralizzata
├── scheduler.js                   # Loop principale con esecuzione giornaliera
├── package.json                   # Dipendenze Node.js
├── handlers/
│   └── postHandler.js            # Handler principale del flusso di pubblicazione
├── utils/
│   ├── uploadToCloudinary.js     # Gestione upload immagini su Cloudinary
│   ├── publishToInstagram.js     # Pubblicazione su Instagram Graph API
│   ├── refinePrompt.js           # Raffinamento prompt con Gemini AI
│   └── generateImage.js          # Generazione immagini con ComfyUI
├── examples/
│   ├── testRefinePrompt.js       # Test raffinamento prompt
│   └── testGenerateImage.js      # Test generazione immagini
└── README.md                      # Questa documentazione
```

## 🚀 Caratteristiche

- ✅ **Architettura modulare**: ogni funzione in un file separato
- ✅ **Loop continuo**: esecuzione automatica ogni 24 ore
- ✅ **Upload automatico**: carica immagini su Cloudinary
- ✅ **Pubblicazione Instagram**: usa l'API Graph di Meta
- ✅ **Raffinamento AI**: migliora i prompt con Gemini
- ✅ **Generazione immagini**: integrazione completa con ComfyUI
- ✅ **Logging dettagliato**: traccia completa di ogni operazione
- ✅ **Gestione errori**: retry automatico in caso di problemi
- ✅ **Configurazione centralizzata**: tutte le impostazioni in un unico posto

## ⚙️ Configurazione

### 1. Variabili d'Ambiente

Aggiungi queste variabili al file `backend/.env`:

```env
# Cloudinary (per hosting immagini pubbliche)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=instagram-lambda

# Instagram Graph API
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
IG_USER_ID=your_instagram_business_account_id
IG_GRAPH_VERSION=v21.0

# Google AI (Gemini)
GOOGLE_API_KEY=your_google_api_key

# ComfyUI (opzionale, per generazione immagini)
COMFYUI_BASE_URL=http://127.0.0.1:8188
COMFYUI_CKPT_NAME=sd_xl_base_1.0.safetensors

# Configurazione Post Giornaliero
DAILY_POST_PROMPT=a beautiful futuristic cityscape at sunset with flying cars and neon lights
DAILY_POST_CAPTION=✨ Daily AI Art ✨\n\n#AI #Art #GenerativeAI #DailyPost
```

### 2. Come ottenere le credenziali

#### **Cloudinary**
1. Registrati su [cloudinary.com](https://cloudinary.com)
2. Vai su Dashboard
3. Copia `Cloud Name`, `API Key` e `API Secret`

#### **Instagram Access Token**
1. Crea una Facebook App su [developers.facebook.com](https://developers.facebook.com)
2. Collega un account Instagram Business
3. Genera un Access Token a lunga durata
4. Ottieni l'`IG_USER_ID` dal Graph API Explorer

## 📦 Installazione

```bash
# Entra nella cartella lambda
cd backend/lambda

# Installa le dipendenze
npm install
```

## 🎯 Utilizzo

### Avvio dello Scheduler

```bash
# Avvia il loop continuo (pubblica ogni 24 ore)
npm start
```

Lo scheduler esegue la **pipeline completa**:
1. ✅ Valida la configurazione all'avvio
2. 🤖 **Raffina il prompt** con Gemini AI
3. 🎨 **Genera l'immagine** con ComfyUI usando il prompt raffinato
4. 📤 **Carica su Cloudinary** per ottenere un URL pubblico stabile
5. 📱 **Pubblica su Instagram** con la didascalia configurata
6. ⏰ Attende 24 ore
7. 🔄 Ripete il processo in loop infinito

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

🎨 FASE 2: Generazione immagine con ComfyUI
   ✅ Immagine generata: http://127.0.0.1:8188/view?filename=...
   ⏱️  Tempo generazione: 45.32s

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
⏰ Prossimo post programmato per: martedì 1 ottobre 2025, 15:36:31
   (tra 24 ore)
------------------------------------------------------------

😴 Scheduler in pausa...
```

## 🔧 Funzioni Disponibili

### `config.js`
Configurazione centralizzata con validazione automatica.

### `scheduler.js`
Loop principale che gestisce l'esecuzione temporizzata.

**Metodi:**
- `startScheduler()` - Avvia il loop infinito

### `handlers/postHandler.js`
Coordina il flusso completo di pubblicazione con pipeline AI-driven.

**Metodi:**
- `executeDailyPost(prompt, caption, imageOptions)` - Pipeline completa:
  1. Raffina prompt con Gemini
  2. Genera immagine con ComfyUI
  3. Upload su Cloudinary
  4. Pubblicazione su Instagram

### `utils/uploadToCloudinary.js`
Gestisce l'upload delle immagini su Cloudinary.

**Metodi:**
- `uploadToCloudinary(imageUrl, options)` - Carica da URL
- `uploadBufferToCloudinary(buffer, options)` - Carica da Buffer

### `utils/publishToInstagram.js`
Pubblica su Instagram tramite Graph API.

**Metodi:**
- `publishToInstagram(imageUrl, caption)` - Crea container e pubblica

### `utils/refinePrompt.js`
Raffina i prompt utilizzando Google Gemini AI.

**Metodi:**
- `refinePrompt(prompt, model)` - Migliora un prompt con Gemini
- `initializeGeminiClient()` - Inizializza il client Gemini

### `utils/generateImage.js`
Genera immagini con ComfyUI tramite raffinamento AI.

**Metodi:**
- `generateImage(prompt, options)` - Pipeline completa: refine + genera
- `createComfyUIGraph(prompt, options)` - Crea grafo ComfyUI
- `validateCheckpoint(baseUrl, ckptName)` - Valida checkpoint disponibili
- `pollComfyUIHistory(baseUrl, promptId, timeout)` - Attende generazione

## 🐛 Troubleshooting

### Lo scheduler non si avvia
- Verifica che tutte le variabili d'ambiente siano configurate
- Controlla il file `.env` nel parent directory `backend/`

### Errore upload Cloudinary
- Verifica le credenziali Cloudinary
- Assicurati che l'URL dell'immagine sia accessibile

### Errore pubblicazione Instagram
- Verifica che l'Access Token sia valido e non scaduto
- Controlla che l'URL dell'immagine sia pubblicamente accessibile
- Assicurati di avere un Instagram Business Account

### Errore raffinamento prompt (Gemini)
- Verifica che GOOGLE_API_KEY sia configurata correttamente
- Controlla i limiti di utilizzo dell'API Gemini

### Errore generazione immagine (ComfyUI)
- Assicurati che ComfyUI sia in esecuzione su http://127.0.0.1:8188
- Verifica che almeno un checkpoint sia presente in ComfyUI/models/checkpoints
- Controlla i log di ComfyUI per errori specifici

## 📝 Note

- Il primo post viene pubblicato **immediatamente** all'avvio
- **ComfyUI deve essere in esecuzione** su http://127.0.0.1:8188 prima di avviare lo scheduler
- Almeno un checkpoint deve essere presente in `ComfyUI/models/checkpoints`
- La generazione dell'immagine richiede circa 30-60 secondi (dipende dalla GPU)
- Instagram richiede circa 5 secondi per processare l'immagine
- Il loop continua finché il processo non viene terminato manualmente (Ctrl+C)
- Ogni esecuzione completa richiede circa 60-90 secondi totali

## 🔄 Modifica dell'Intervallo

Per cambiare l'intervallo di pubblicazione, modifica in `config.js`:

```javascript
scheduler: {
    // Esempio: ogni 12 ore
    interval: 12 * 60 * 60 * 1000,
    // ...
}
```

## 🛑 Terminazione

Per fermare lo scheduler:
- Premi `Ctrl+C` nel terminale
- Lo scheduler gestisce gracefully i segnali SIGINT e SIGTERM

## 📄 Licenza

MIT

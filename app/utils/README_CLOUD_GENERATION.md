# 🌐 Generazione Immagini Cloud - Alternativa ComfyUI

Questo documento spiega come utilizzare `generateImageOllama.js` per sostituire ComfyUI con provider cloud, rendendo l'intera pipeline deployable su AWS Lambda.

## 🎯 Obiettivo

Eliminare la dipendenza da ComfyUI (richiede GPU locale) e utilizzare API cloud per la generazione immagini, permettendo deployment serverless su AWS Lambda.

## 📁 File Creati

### 1. `utils/generateImageOllama.js`
Implementazione completa con 3 provider cloud:
- **Replicate** (consigliato - free tier disponibile)
- **HuggingFace** (completamente gratuito)
- **Stability AI** (qualità premium, a pagamento)

### 2. `examples/testCloudGeneration.js`
Script di test per tutti i provider

### 3. `lambda-handler.js`
Handler AWS Lambda pronto all'uso

### 4. `deploy-aws.sh`
Script automatico per deployment completo su AWS

### 5. `AWS_DEPLOYMENT.md`
Guida completa per migrazione su AWS Lambda

## 🚀 Quick Start

### Setup Locale (Test)

```bash
# 1. Installa dipendenze (se non già fatto)
cd backend/lambda
npm install

# 2. Configura API key per un provider (scegli uno)

# Opzione A: Replicate (consigliato)
# Vai su https://replicate.com e ottieni token
echo "REPLICATE_API_TOKEN=r8_your_token" >> ../.env

# Opzione B: HuggingFace (gratuito)
# Vai su https://huggingface.co/settings/tokens
echo "HUGGINGFACE_API_KEY=hf_your_token" >> ../.env

# Opzione C: Stability AI (premium)
# Vai su https://platform.stability.ai
echo "STABILITY_AI_KEY=sk_your_key" >> ../.env

# 3. Test
node examples/testCloudGeneration.js
```

## 💡 Integrazione nella Pipeline

### Opzione 1: Modifica manuale del postHandler.js

```javascript
// handlers/postHandler.js

// PRIMA (ComfyUI locale)
const { generateImage } = require('../utils/generateImage');

// DOPO (Cloud provider)
const { generateImageCloud } = require('../utils/generateImageOllama');

// Nel executeDailyPost, cambia:
const generateResult = await generateImageCloud(prompt, {
    provider: 'replicate',  // o 'huggingface', 'stability'
    width: 1024,
    height: 1024,
    steps: 25,
    cfg: 7
});
```

### Opzione 2: Variabile d'ambiente per switch

```javascript
// handlers/postHandler.js
const useCloud = process.env.USE_CLOUD_GENERATION === 'true';

const generateImage = useCloud 
    ? require('../utils/generateImageOllama').generateImageCloud
    : require('../utils/generateImage').generateImage;
```

## 📊 Confronto Provider

| Provider | Costo/Immagine | Free Tier | Qualità | Velocità | AWS Lambda |
|----------|---------------|-----------|---------|----------|------------|
| **Replicate** | ~$0.0055 | ✅ $5 iniziale | ⭐⭐⭐⭐ | 20-40s | ✅ Ottimo |
| **HuggingFace** | Gratis | ✅ Sempre | ⭐⭐⭐ | 30-60s | ✅ Buono |
| **Stability AI** | ~$0.02 | ❌ | ⭐⭐⭐⭐⭐ | 15-30s | ✅ Ottimo |

## 🔧 Esempi d'Uso

### Esempio 1: Generazione Base

```javascript
const { generateImageCloud } = require('./utils/generateImageOllama');

const result = await generateImageCloud(
    'a mystical forest with glowing mushrooms',
    {
        provider: 'replicate',
        width: 1024,
        height: 1024
    }
);

if (result.success) {
    console.log('URL:', result.imageUrl);
    console.log('Base64:', result.imageBase64);
}
```

### Esempio 2: Con Opzioni Avanzate

```javascript
const result = await generateImageCloud(
    'cyberpunk city at night',
    {
        provider: 'replicate',
        width: 1024,
        height: 768,
        steps: 30,
        cfg: 8,
        negativePrompt: 'blurry, low quality, distorted',
        useGemini: true,  // Usa Gemini per raffinare prompt
        timeout: 120000   // 2 minuti timeout
    }
);
```

### Esempio 3: Nella Pipeline Completa

```javascript
const { generateImageCloud } = require('./utils/generateImageOllama');
const { uploadToCloudinary } = require('./utils/uploadToCloudinary');
const { publishToInstagram } = require('./utils/publishToInstagram');

// 1. Genera immagine
const genResult = await generateImageCloud('sunset over mountains', {
    provider: 'replicate'
});

// 2. Upload su Cloudinary
let uploadResult;
if (genResult.imageUrl) {
    // Se abbiamo URL, usa quello
    uploadResult = await uploadToCloudinary(genResult.imageUrl);
} else if (genResult.imageBase64) {
    // Se abbiamo base64, converti in buffer e upload
    const buffer = Buffer.from(genResult.imageBase64, 'base64');
    uploadResult = await uploadBufferToCloudinary(buffer);
}

// 3. Pubblica su Instagram
await publishToInstagram(uploadResult.publicUrl, 'My caption');
```

## 🌍 Deployment AWS Lambda

### Step 1: Preparazione

```bash
# Rendi eseguibile lo script di deploy
chmod +x deploy-aws.sh

# Configura AWS CLI
aws configure
```

### Step 2: Deploy

```bash
# Esegui deploy automatico
./deploy-aws.sh
```

### Step 3: Configura Environment Variables

Via AWS Console o CLI:

```bash
aws lambda update-function-configuration \
  --function-name instagram-daily-post \
  --environment Variables="{
    GOOGLE_API_KEY=your_key,
    REPLICATE_API_TOKEN=your_token,
    CLOUDINARY_CLOUD_NAME=your_cloud,
    CLOUDINARY_API_KEY=your_key,
    CLOUDINARY_API_SECRET=your_secret,
    INSTAGRAM_ACCESS_TOKEN=your_token,
    IG_USER_ID=your_id,
    DAILY_POST_PROMPT='your prompt',
    DAILY_POST_CAPTION='your caption',
    IMAGE_PROVIDER=replicate
  }"
```

## 💰 Stima Costi Mensili (30 post)

### Scenario 1: Replicate + AWS Lambda
- Replicate: $0.17/mese (30 immagini × $0.0055)
- Lambda: $0.00 (free tier)
- **Totale: ~$0.20/mese**

### Scenario 2: HuggingFace + AWS Lambda
- HuggingFace: $0.00 (gratuito)
- Lambda: $0.00 (free tier)
- **Totale: GRATIS**

### Scenario 3: Stability AI + AWS Lambda
- Stability AI: $0.60/mese (30 × $0.02)
- Lambda: $0.00 (free tier)
- **Totale: ~$0.60/mese**

## 🔍 Differenze con ComfyUI

| Aspetto | ComfyUI (Locale) | Cloud Provider |
|---------|------------------|----------------|
| **Setup** | Complesso | Semplice |
| **Hardware** | GPU richiesta | Nessun requisito |
| **Costo iniziale** | Alto (GPU) | Nullo |
| **Costo operativo** | Elettricità | Pay-per-use |
| **Scalabilità** | Limitata | Infinita |
| **Manutenzione** | Alta | Nulla |
| **AWS Lambda** | ❌ Impossibile | ✅ Supportato |

## 🧪 Testing

```bash
# Test singolo provider
node examples/testCloudGeneration.js

# Test pipeline completa con cloud
node examples/testFullPipeline.js
```

## 📈 Monitoring su AWS

```bash
# Visualizza logs in tempo reale
aws logs tail /aws/lambda/instagram-daily-post --follow

# Visualizza metriche
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=instagram-daily-post \
  --start-time 2025-09-29T00:00:00Z \
  --end-time 2025-09-30T00:00:00Z \
  --period 3600 \
  --statistics Average
```

## ⚠️ Note Importanti

1. **Rate Limits**: Ogni provider ha rate limits. Per uso giornaliero (1 post/giorno) non ci sono problemi.

2. **Timeout Lambda**: Imposta timeout Lambda a 300s (5 minuti) per dare tempo alla generazione.

3. **Memory**: Usa almeno 512MB di memoria Lambda, consigliato 1024MB.

4. **Cold Start**: Prima invocazione può essere lenta. Considera warm-up ogni ora.

5. **API Keys**: Non committare mai le API keys nel codice. Usa sempre environment variables.

## 🆘 Troubleshooting

### Errore: "REPLICATE_API_TOKEN non configurata"
**Soluzione**: Aggiungi la variabile d'ambiente nel .env o in AWS Lambda configuration

### Errore: "Timeout generazione"
**Soluzione**: Aumenta il parametro `timeout` nelle opzioni o il timeout Lambda

### Errore: "Rate limit exceeded"
**Soluzione**: Aspetta qualche minuto o passa a un provider diverso

### Errore: "Invalid API key"
**Soluzione**: Verifica che la API key sia corretta e non scaduta

## 📚 Risorse

- [Replicate Documentation](https://replicate.com/docs)
- [HuggingFace Inference API](https://huggingface.co/docs/api-inference)
- [Stability AI API](https://platform.stability.ai/docs/api-reference)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

## ✅ Checklist Pre-Produzione

- [ ] Provider cloud testato localmente
- [ ] API keys configurate e validate
- [ ] Test completo della pipeline con cloud generation
- [ ] Deploy su AWS Lambda effettuato
- [ ] Environment variables configurate su Lambda
- [ ] EventBridge trigger configurato
- [ ] CloudWatch alarms configurati
- [ ] Test di invocazione Lambda manuale effettuato
- [ ] Monitoring attivo

---

**Pronto per la produzione?** Segui la guida completa in `AWS_DEPLOYMENT.md` per il deployment completo! 🚀

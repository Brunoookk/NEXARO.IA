# NEXARO.IA

Chatbot com IA usando Groq, memoria de conversa, upload de PDF e voz.

## Rodar localmente

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Configure as variaveis do backend a partir de `backend/.env.example`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:5173

## Deploy Render

Backend:

```txt
Root Directory: backend
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Frontend:

```txt
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

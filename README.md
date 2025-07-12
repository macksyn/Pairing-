# Lussh AI Pairing Server

Generate WhatsApp Multi-Device pairing codes with a smooth frontend.

## 🔧 Setup

```bash
git clone https://github.com/yourname/lussh-ai-pairing
cd lussh-ai-pairing
cp .env.example .env
npm install
npm start
```

## 🖥 Usage

Visit `http://localhost:3000`, enter your WhatsApp number (e.g. `23480xxxxxxx`), and get your pairing code.

## 📦 Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

## 🔐 Security

This project uses a hidden token sent from frontend to backend to prevent abuse. You can improve this by:
- Whitelisting phone numbers
- Adding IP rate limiting
- Replacing token logic with OTP verification

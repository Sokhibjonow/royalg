// api/lead.js — Vercel Serverless Function
// Этот файл решает проблему CORS: браузер → Vercel → edutizim.uz

export default async function handler(req, res) {
  // Разрешаем запросы с вашего домена
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight запрос браузера
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ключ хранится в Vercel → Project Settings → Environment Variables, не в коде
  const EDUTIZIM_KEY = process.env.EDUTIZIM_KEY;
  const EDUTIZIM_URL = 'https://edutizim.uz/api/leads';

  if (!EDUTIZIM_KEY) {
    console.error('EDUTIZIM_KEY is not set');
    return res.status(500).json({
      success: false,
      error: 'EDUTIZIM_KEY is not configured on the server'
    });
  }

  const { name, phone } = req.body || {};

  if (!name || !phone) {
    return res.status(400).json({ error: 'name и phone обязательны' });
  }

  const now = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' });

  try {
    const edutizimRes = await fetch(EDUTIZIM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': EDUTIZIM_KEY
      },
      body: JSON.stringify({
        name:    name,
        phone:   phone,
        source:  'Royal Music School — сайт',
        comment: 'Заявка на бесплатный пробный урок (Gitara kursi)',
        date:    now
      })
    });

    const data = await edutizimRes.json().catch(() => ({}));

    // success = false, если edutizim отклонил запрос (например, неверный ключ)
    return res.status(200).json({
      success: edutizimRes.ok,
      edutizim_status: edutizimRes.status,
      edutizim_response: data
    });

  } catch (err) {
    console.error('edutizim fetch error:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
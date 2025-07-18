// testProcessVideo.js
const fetch = require('node-fetch');

// Remplace par l'URL de ton API Railway
const API_URL = 'https://grega-play-backend-production-bb92.up.railway.app/api/process-video'; // ✅

// Remplace par un eventId valide
const TEST_EVENT_ID = 'e27aceb0-a5e8-40cf-b81b-5929d8ba263d';

(async () => {
  try {
    const response = await fetch(`${API_URL}?eventId=${TEST_EVENT_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Test réussi :', result.message);
      console.log('🔗 URL de la vidéo finale :', result.final_video_url);
    } else {
      console.error('❌ Erreur API :', result.error || 'Erreur inconnue');
      if (result.details) console.error('🔎 Détail :', result.details);
    }
  } catch (err) {
    console.error('❌ Exception lors de l’appel API :', err.message);
  }
})();

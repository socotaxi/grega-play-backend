// testProcessVideo.js
const fetch = require('node-fetch');

// Remplace par l'URL de ton API Railway
const API_URL = 'https://grega-play-backend-production.up.railway.app/api/process-video';

// Remplace par un eventId valide
const TEST_EVENT_ID = 'aff2382c-b6ae-402b-a6e6-03f2656fab73';

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

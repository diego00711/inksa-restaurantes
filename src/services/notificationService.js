// src/services/notificationService.js
//
// IMPORTANTE: Diego precisa preencher FIREBASE_CONFIG com credenciais do projeto Firebase
// console.firebase.google.com → projeto → Configurações → Adicionar app web
const FIREBASE_CONFIG = {
  // apiKey: "",
  // authDomain: "",
  // projectId: "",
  // storageBucket: "",
  // messagingSenderId: "",
  // appId: "",
};

// Diego: preencha com a chave VAPID do Firebase
// Firebase Console → Projeto → Cloud Messaging → Certificados Web Push → Gerar par de chaves
const FCM_VAPID_KEY = "";

/**
 * Solicita permissão de notificação ao usuário e retorna o FCM token.
 * Retorna null silenciosamente em caso de recusa ou erro.
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  if (!FIREBASE_CONFIG.apiKey) {
    console.warn('FCM: FIREBASE_CONFIG não configurado — preencha notificationService.js');
    return null;
  }

  try {
    const { initializeApp } = await import(
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
    );
    const { getMessaging, getToken } = await import(
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js'
    );
    const app = initializeApp(FIREBASE_CONFIG);
    const messaging = getMessaging(app);
    return await getToken(messaging, { vapidKey: FCM_VAPID_KEY });
  } catch (e) {
    console.warn('FCM error:', e);
    return null;
  }
}

/**
 * Persiste o FCM token no backend do restaurante.
 * Falha silenciosamente — nunca propaga exceção.
 *
 * @param {string} token - FCM token obtido por requestNotificationPermission()
 * @param {string} apiBaseUrl - Base URL da API (ex: RESTAURANT_API_URL)
 * @param {object} authHeaders - Headers de autenticação (ex: createAuthHeaders())
 */
export async function saveFcmToken(token, apiBaseUrl, authHeaders) {
  if (!token) return;
  try {
    await fetch(`${apiBaseUrl}/api/profile/fcm-token`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcm_token: token, user_type: 'restaurant' }),
    });
  } catch (e) {
    console.warn('FCM save token error:', e);
  }
}

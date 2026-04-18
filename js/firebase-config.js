/*
 * ============================================================
 *  SAR BURGER — FIREBASE CONFIGURATION
 * ============================================================
 *  HOW TO SET THIS UP (takes ~5 minutes):
 *
 *  1. Go to https://console.firebase.google.com
 *  2. Click "Add project" → name it "sar-burger" → Create
 *  3. On the project dashboard click the </> (Web) icon
 *  4. Register app with name "SAR Burger Web" → click Continue
 *  5. Copy the firebaseConfig object shown and paste it below
 *  6. In the left sidebar go to Build → Firestore Database
 *  7. Click "Create database" → Start in TEST MODE → Next → Enable
 *  8. Done — the site will now use your live database!
 *
 *  IMPORTANT: After testing, switch Firestore rules to:
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        match /sar_data/{doc} { allow read: if true; allow write: if false; }
 *        match /sar_orders/{doc} { allow read, write: if false; }
 *      }
 *    }
 *  Then only the admin page (which uses a secret token) can write.
 * ============================================================
 */

const firebaseConfig = {
  apiKey:            "PASTE_YOUR_API_KEY_HERE",
  authDomain:        "PASTE_YOUR_AUTH_DOMAIN_HERE",
  projectId:         "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket:     "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId:             "PASTE_YOUR_APP_ID_HERE",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

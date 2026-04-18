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
  apiKey:            "AIzaSyBuV6crCqS4wPsuwZiRC_WOXk9J2RaHogU",
  authDomain:        "sar-burger.firebaseapp.com",
  projectId:         "sar-burger",
  storageBucket:     "sar-burger.firebasestorage.app",
  messagingSenderId: "819394413738",
  appId:             "1:819394413738:web:5c64993c09104186063cd3",
  measurementId:     "G-MW2YW4LFK9",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

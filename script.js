const firebaseConfig = {
  apiKey: "AIzaSyCSU62LqjjRtOXKd01Z_-gaSXXQychnuoI",
  authDomain: "gestione-gruppo-lucano.firebaseapp.com",
  projectId: "gestione-gruppo-lucano",
  storageBucket: "gestione-gruppo-lucano.firebasestorage.app",
  messagingSenderId: "781743614428",
  appId: "1:781743614428:web:8cfd1dad35d4595e9e8719",
  measurementId: "G-8TT0VR61GR" // Potrebbe non essere presente
};

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);

// Ottieni un riferimento al database (usa firebase.database() per Realtime Database o firebase.firestore() per Firestore)
const db = firebase.database(); // Se hai scelto Realtime Database
// const db = firebase.firestore(); // Se hai scelto Firestore

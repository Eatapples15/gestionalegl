// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkVEFv5WIfIJYNqjWSRA5viFjhHr9Ps0c",
  authDomain: "glgest.firebaseapp.com",
  projectId: "glgest",
  storageBucket: "glgest.firebasestorage.app",
  messagingSenderId: "423155306554",
  appId: "1:423155306554:web:c598640f199e296d276503"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export { app };

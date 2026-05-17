const firebaseConfig = {
  apiKey: "AIzaSyCAccJO_ZJiagQJMAxZUbZjI411ctBPzUY",
  authDomain: "todo-gamification.firebaseapp.com",
  projectId: "todo-gamification",
  storageBucket: "todo-gamification.firebasestorage.app",
  messagingSenderId: "1001201376164",
  appId: "1:1001201376164:web:948c4f6af7e7068cebbf31"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

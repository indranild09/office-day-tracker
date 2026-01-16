import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCy4gbRUFc9s44RKLxqZbxRYWdY3VZAaQU",
  authDomain: "wfo-wfh-tracker-5f22c.firebaseapp.com",
  projectId: "wfo-wfh-tracker-5f22c",
  storageBucket: "wfo-wfh-tracker-5f22c.firebasestorage.app",
  messagingSenderId: "776384204372",
  appId: "1:776384204372:web:57dbddabb4d810253fe7c1",
  measurementId: "G-R544Q75GKG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

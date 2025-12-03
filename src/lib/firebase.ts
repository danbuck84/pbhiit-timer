import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCeDUiqykB_0wsxFWFq9YnL_-s1aom1Q78",
    authDomain: "pb-hiit.firebaseapp.com",
    projectId: "pb-hiit",
    storageBucket: "pb-hiit.firebasestorage.app",
    messagingSenderId: "231248116598",
    appId: "1:231248116598:web:c50d9fe9d0a34f6d4d9857",
    measurementId: "G-BTML2MRQ1J"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

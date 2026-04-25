import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCbVL2YNGsKKSWcYmV3S4MQTu0xEy2xvIg",
    authDomain: "debt-manager-96467.firebaseapp.com",
    projectId: "debt-manager-96467",
    storageBucket: "debt-manager-96467.firebasestorage.app",
    messagingSenderId: "326266379002",
    appId: "1:326266379002:web:bb4359972544f2269a8743",
    measurementId: "G-RX2G0CJZY6"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
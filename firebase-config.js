// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBAEfcHlg4RWlq-L5mbpZ1u-ek3hB5Xn9s",
    authDomain: "nepali-herbs.firebaseapp.com",
    databaseURL: "https://nepali-herbs-default-rtdb.asia-southeast1.firebasedatabase.app", // Added based on standard Firebase RTDB URL
    projectId: "nepali-herbs",
    storageBucket: "nepali-herbs.firebasestorage.app",
    messagingSenderId: "448385270053",
    appId: "1:448385270053:web:de9ea28f055acdf7bd5acc",
    measurementId: "G-9H3T3SHK8F"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    console.log("Firebase initialized and connected directly to the nepali-herbs Realtime Database.");
} catch(error) {
    console.error("Firebase init failed: ", error);
}

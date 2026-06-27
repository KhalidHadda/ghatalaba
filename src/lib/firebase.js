// Replace these with your actual Firebase project config
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyBci7mOFmZcOYYAOqYyiU_I1n2DjcYbX0U",
  authDomain: "ghatalaba-test.firebaseapp.com",
  projectId: "ghatalaba-test",
  storageBucket: "ghatalaba-test.firebasestorage.app",
  messagingSenderId: "837080729638",
  appId: "1:837080729638:web:7a55df54adc6a8c725bee7",
  measurementId: "G-ZGCDJ1FP9Q"
};


const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app

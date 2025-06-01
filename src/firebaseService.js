import {initializeApp} from 'firebase/app';
import {doc, getDoc, getFirestore, setDoc} from 'firebase/firestore';

import {firebaseConfig} from './firebaseConfig';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function loadTripFromFirebase(key) {
  const docSnap = await getDoc(doc(db, 'trips', key));
  return docSnap.exists() ? docSnap.data() : {steps: []};
}

export async function saveTripToFirebase(key, data) {
  await setDoc(doc(db, 'trips', key), data);
}
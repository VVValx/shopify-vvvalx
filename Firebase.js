/**
 * Initialize firebase and it configs
 */
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyBwz3RM82prJHP6Fli_12QT8CjYNCHPl80",
  authDomain: "droppx-45ac7.firebaseapp.com",
  databaseURL: "https://droppx-45ac7.firebaseio.com",
  projectId: "droppx-45ac7",
  storageBucket: "droppx-45ac7.appspot.com",
  messagingSenderId: "725291137862",
  appId: "1:725291137862:web:3ae4cac5e9a5ca042b0347",
  measurementId: "G-NZEXG6545Q",
};
// const firebaseApp = firebase.apps && firebase.apps.length > 0 ? firebase.apps[0] : firebase.initializeApp(firebaseConfig);
firebase.initializeApp(firebaseConfig);
firebase.firestore().settings({ experimentalForceLongPolling: false });
export const dataBase = firebase.firestore();
export const databaseRealtime = firebase.database();
export const mediaStore = firebase.storage;
export const authentication = firebase.auth();
// export const dx = firebase;

export const shopifyDeliveryFeeCalculatorURL =
  "https://us-central1-droppx-45ac7.cloudfunctions.net/shopifyprice";

export const apiBaseUrl =
  "https://us-central1-droppx-45ac7.cloudfunctions.net/droppxApi/api/v1/";
/**
 * Generates universal unique identification
 *
 * @returns string
 */
export function _generateUid() {
  let uuid = "",
    i = 0;
  while (i++ < 18) {
    let c = "xxxxxxxxyxxxxy4xxxyyxxxyxxxxxxxxxxxx"[i - 1],
      r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    uuid += c === "-" || c === "4" ? c : v.toString(16);
  }
  return uuid;
}

/**
 * Gets a user from the DB
 *
 * @returns Promise
 */
export const getLoggedInUser = (uid) => {
  return dataBase
    .collection("users")
    .doc(uid)
    .get()
    .then((user) => {
      if (!user.exists) {
        return "no such user in the system";
      } else {
        return user.data();
      }
    })
    .catch((error) => {
      return error.message;
    });
};

export default firebase;

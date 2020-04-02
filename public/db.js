"use strict";

const pendingObjectStoreName = `pending`;

// create a new db request for a "budget" database.
const request = indexedDB.open(`budget`, 2);

request.onupgradeneeded = event => {
    const db = request.result;

    // create object store called "pending" and set autoIncrement to true
    // const db = event.target.result;
    console.log(event);

    if (!db.objectStoreNames.contains(pendingObjectStoreName)) {
        db.createObjectStore(pendingObjectStoreName, { autoIncrement: true });
    }
};

request.onsuccess = event => {
    console.log(`Success! ${event.type}`);
    // check if app is online before reading from db
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = event => console.error(event);

function checkDatabase() {
    const db = request.result;

    // open a transaction on your pending db
    let transaction = db.transaction([pendingObjectStoreName], `readwrite`);

    // access your pending object store
    let store = transaction.objectStore(pendingObjectStoreName);

    // get all records from store and set to a variable
    const getAll = store.getAll();

    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch(`/api/transaction/bulk`, {
                method: `POST`,
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: `application/json, text/plain, */*`,
                    "Content-Type": `application/json`
                }
            })
                .then(response => response.json())
                .then(() => {
                    // if successful, open a transaction on your pending db
                    transaction = db.transaction([pendingObjectStoreName], `readwrite`);

                    // access your pending object store
                    store = transaction.objectStore(pendingObjectStoreName);

                    // clear all items in your store
                    store.clear();
                });
        }
    };
}

// eslint-disable-next-line no-unused-vars
function saveRecord(record) {
    const db = request.result;

    // create a transaction on the pending db with readwrite access
    const transaction = db.transaction([pendingObjectStoreName], `readwrite`);

    // access your pending object store
    const store = transaction.objectStore(pendingObjectStoreName);

    // add record to your store with add method.
    store.add(record);
}

// listen for app coming back online
window.addEventListener(`online`, checkDatabase);
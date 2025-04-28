var apiRoot = 'https://textadventures.co.uk/';

async function getV5SaveData(id) {
  return new Promise(async (resolve, reject) => {
    try {
      // Make a request to the v5 API, including credentials (cookies)
      const response = await fetch(`${apiRoot}games/load/${id}`, {
        method: 'GET',
        credentials: 'include' // This is equivalent to xhrFields: { withCredentials: true }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load save data: ${response.status} ${response.statusText}`);
      }
      
      // Get the response as JSON
      const result = await response.json();
      
      // Check if we have valid data
      if (!result || !result.Data) {
        throw new Error('No save data found. Visit the v5 player page first.');
      }
      
      resolve(result.Data);
    } catch (error) {
      console.error('Error in getV5SaveData:', error);
      reject(new Error("Failed to acquire game save data."));
    }
  });
}

function base64ToBytes(base64) {
  // console.log('base64', base64);
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0));
}

async function copyV5SaveToVivaSave(id, slot, data, name, timeStamp) {
  try {
    if (!data) {
      const b64d = await getV5SaveData(id);
      data = base64ToBytes(b64d); // Convert base64 to bytes
    }

    const saveData = {
      gameId: id, // Simply use the passed-in id, don't reference WebPlayer
      slotIndex: slot || (await getHighestSlot(id)) + 1,
      data: data,
      name: name || `v5 Save Converted ${new Date().toISOString().replace("T", " ").substring(0, 19)}`,
      timestamp: timeStamp || new Date()
    };

    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("quest-viva-saves", 1);

      request.onerror = () => reject(new Error(`IndexedDB Open Error: ${request.error?.message}`));
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("saves")) {
          db.createObjectStore("saves", { keyPath: "slotIndex" });
        }
      };
    });

    const tx = db.transaction("saves", "readwrite");

    return await new Promise((resolve, reject) => {
      const store = tx.objectStore("saves");
      const request = store.put(saveData);

      request.onsuccess = () => {
        console.log("Save data saved successfully:", saveData);
        resolve(saveData);
      };

      request.onerror = () => {
        reject(new Error(`Data Save Error: ${request.error?.message}`));
      };

      tx.oncomplete = () => console.log("Transaction completed successfully.");
      tx.onerror = () => reject(new Error(`Transaction Error: ${tx.error?.message}`));
    });
  } catch (error) {
    console.error("Error in copyV5SaveToVivaSave:", error);
    throw error;
  }
}

async function allVivaSaves() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open("quest-viva-saves");

    request.onerror = () => reject("Failed to open IndexedDB");

    request.onsuccess = function (event) {
      let db = event.target.result;
      let transaction = db.transaction(["saves"], "readonly");
      let store = transaction.objectStore("saves");

      let results = [];
      let cursorRequest = store.openCursor();

      cursorRequest.onsuccess = function (event) {
        let cursor = event.target.result;
        if (cursor) {
          results.push({
            key: cursor.key,
            value: cursor.value,
          });
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      cursorRequest.onerror = () => reject("Cursor error");
    };
  });
}

async function getSaveSlots(id) {
  const allSaves = await allVivaSaves();
  return allSaves
    .filter((save) => save.key[0] === id)
    .map((save) => save.key[1]);
}

async function getHighestSlot(id) {
  const slots = await getSaveSlots(id);
  const realSlots = slots.filter(slot => slot >= 0);
  return realSlots.length > 0 ? Math.max(...realSlots) : -1;
}

/*
example from within the actual game:

(async () => {
  const result = WebPlayer.gameId || $_GET['id'];
  const success = await copyV5SaveToVivaSave(result);
  return success;
})();

*/
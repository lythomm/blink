import { openDB } from "idb";

const DB_NAME = "blink-offline";
const STORE_NAME = "pending-photos";

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    },
  });
};

export const savePendingPhoto = async (blob: Blob, eventId: string, guestId: string) => {
  const db = await initDB();
  return db.add(STORE_NAME, {
    blob,
    eventId,
    guestId,
    createdAt: Date.now(),
  });
};

export const getPendingPhotos = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const removePendingPhoto = async (id: number) => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};

export const getGuestId = () => {
  if (typeof window === "undefined") return "";
  let guestId = localStorage.getItem("blink_guest_id");
  if (!guestId) {
    guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("blink_guest_id", guestId);
  }
  return guestId;
};

export const prettyDisplayDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

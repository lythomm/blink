import { openDB } from "idb";

const DB_NAME = "blink-offline";
const STORE_NAME = "pending-photos";

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    },
  });
};

export const savePendingPhoto = async (
  blob: Blob,
  eventId: string,
  guestId: string,
) => {
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

interface PrettyDateOptions {
  showWeekday?: boolean;
  showDay?: boolean;
  showMonth?: boolean;
  showYear?: boolean;
  showTime?: boolean;
}

export const prettyDisplayDate = (
  dateStr: string,
  options: PrettyDateOptions = {},
) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const {
    showWeekday = true,
    showDay = true,
    showMonth = true,
    showYear = true,
    showTime = true,
  } = options;

  const formatOptions: Intl.DateTimeFormatOptions = {};

  if (showWeekday) formatOptions.weekday = "long";
  if (showDay) formatOptions.day = "numeric";
  if (showMonth) formatOptions.month = "long";
  if (showYear) formatOptions.year = "numeric";
  if (showTime) {
    formatOptions.hour = "2-digit";
    formatOptions.minute = "2-digit";
  }

  const formatted = new Intl.DateTimeFormat("fr-FR", formatOptions).format(
    date,
  );

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const compressCanvasToBlob = async (
  canvas: HTMLCanvasElement,
  maxSizeInBytes: number = 500 * 1024,
  mimeType: string = "image/webp",
  initialQuality: number = 0.90,
  minQuality: number = 0.60
): Promise<Blob> => {
  let quality = initialQuality;
  let scale = 1.0;
  let currentCanvas = canvas;

  while (true) {
    const blob = await new Promise<Blob | null>((resolve) => {
      currentCanvas.toBlob((b) => resolve(b), mimeType, quality);
    });

    if (!blob) {
      throw new Error("Failed to generate blob from canvas");
    }

    if (blob.size <= maxSizeInBytes) {
      return blob;
    }

    if (quality > minQuality) {
      quality -= 0.1;
    } else if (scale > 0.4) {
      scale -= 0.15;
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = Math.round(canvas.width * scale);
      tempCanvas.height = Math.round(canvas.height * scale);
      const ctx = tempCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
        currentCanvas = tempCanvas;
      }
      quality = initialQuality;
    } else {
      return blob;
    }
  }
};


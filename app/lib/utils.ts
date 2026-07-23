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
  maxDimension: number = 1920,
  quality: number = 0.82,
  maxSizeBytes: number = 500 * 1024
): Promise<Blob> => {
  const exportBlob = (c: HTMLCanvasElement, q: number) =>
    new Promise<Blob>((resolve, reject) => {
      c.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to export canvas blob"))),
        "image/jpeg",
        q
      );
    });

  let width = canvas.width;
  let height = canvas.height;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const targetCanvas = document.createElement("canvas");
  targetCanvas.width = width;
  targetCanvas.height = height;
  const ctx = targetCanvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, width, height);
  }

  const blob = await exportBlob(targetCanvas, quality);

  // Garde-fou 100% : Si cas extrême (bruit visuel intense, confettis), passe de sécurité immédiate
  if (blob.size > maxSizeBytes) {
    const fallbackCanvas = document.createElement("canvas");
    const fbMax = 1280;
    let fbW = width;
    let fbH = height;
    if (fbW > fbMax || fbH > fbMax) {
      if (fbW > fbH) {
        fbH = Math.round((fbH * fbMax) / fbW);
        fbW = fbMax;
      } else {
        fbW = Math.round((fbW * fbMax) / fbH);
        fbH = fbMax;
      }
    }
    fallbackCanvas.width = fbW;
    fallbackCanvas.height = fbH;
    const fbCtx = fallbackCanvas.getContext("2d");
    if (fbCtx) {
      fbCtx.imageSmoothingEnabled = true;
      fbCtx.drawImage(targetCanvas, 0, 0, fbW, fbH);
    }
    return await exportBlob(fallbackCanvas, 0.70);
  }

  return blob;
};


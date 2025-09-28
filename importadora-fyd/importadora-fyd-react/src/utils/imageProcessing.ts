import imageCompression from 'browser-image-compression';

const HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

let heicConverterPromise: Promise<typeof import('heic2any')> | null = null;

const loadHeicConverter = async () => {
  if (!heicConverterPromise) {
    heicConverterPromise = import('heic2any');
  }
  return heicConverterPromise;
};

const convertHeicToJpeg = async (file: File): Promise<File> => {
  if (typeof window === 'undefined') {
    return file;
  }

  try {
    const heic2any = (await loadHeicConverter()).default;
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    const newName = /\.hei[c|f]$/i.test(file.name)
      ? file.name.replace(/\.hei[c|f]$/i, '.jpg')
      : `${file.name}.jpg`;
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch (error) {
    let detail = 'Formato HEIC no reconocido. Prueba guardarlo como JPG/PNG desde tu dispositivo.';
    if (error && typeof error === 'object') {
      const maybeMessage = (error as { message?: string }).message;
      if (maybeMessage) {
        detail = maybeMessage;
      } else if ('code' in error || 'subcode' in error) {
        detail = 'No pudimos convertir el archivo HEIC (Live Photo o alta profundidad no soportada).';
      }
    }
    // console.warn(`HEIC conversion failed (${file.name}):`, error);
    throw new Error(detail);
  }
};

const DEFAULT_OPTIONS: any = {
  maxSizeMB: 1.2,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  initialQuality: 0.85,
};

export const optimizeImageFile = async (file: File, options?: any): Promise<File> => {
  let workingFile = file;
  const normalizedType = typeof file.type === 'string' ? file.type.toLowerCase() : '';
  const isHeic = HEIC_MIME_TYPES.has(normalizedType) || /\.hei[c|f]$/i.test(file.name);
  if (isHeic) {
    workingFile = await convertHeicToJpeg(file);
  }

  if (!workingFile.type.startsWith('image/') || workingFile.size < 200 * 1024) {
    return workingFile;
  }

  try {
    const mergedOptions: any = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    const optimizedBlob = await imageCompression(workingFile, mergedOptions);
    const optimizedFile = optimizedBlob instanceof File
      ? optimizedBlob
      : new File([optimizedBlob], workingFile.name, { type: (optimizedBlob as any).type || workingFile.type });

    if (optimizedFile.size >= workingFile.size) {
      return workingFile;
    }

    return optimizedFile;
  } catch (err) {
    // console.warn(`Image optimization skipped (${workingFile.name}):`, err);
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('No se pudo optimizar la imagen. Intenta con un JPG o PNG.');
  }
};

export default optimizeImageFile;

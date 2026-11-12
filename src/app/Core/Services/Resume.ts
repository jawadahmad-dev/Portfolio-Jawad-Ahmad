const PDF_PREFIX = 'data:application/pdf;base64,';

/** Largest PDF accepted. The resume is stored inside the hero record, so keep it small. */
export const MAX_RESUME_BYTES = 1024 * 1024;

/** True only for a base64 PDF data URL, which is the one format the site will download. */
export const isPdfDataUrl = (value: string | null | undefined): value is string =>
  !!value && value.startsWith(PDF_PREFIX);

/** Reads a file as a data URL such as "data:application/pdf;base64,JVBERi0x..." */
export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * Downloads a stored resume. The data URL is turned into a Blob first, because Angular
 * blocks data: links in href bindings. Returns false if the stored value isn't a valid PDF.
 */
export const downloadResume = (dataUrl: string, fileName = 'resume.pdf'): boolean => {
  if (!isPdfDataUrl(dataUrl)) return false;
  try {
    const binary = atob(dataUrl.slice(PDF_PREFIX.length));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
};

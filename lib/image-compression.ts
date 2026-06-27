export async function cropAndCompressImage(file: File, width: number, height: number) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Image must be smaller than 15 MB.");
  const bitmap = await createImageBitmap(file);
  const sourceRatio = bitmap.width / bitmap.height;
  const targetRatio = width / height;
  let sx = 0; let sy = 0; let sw = bitmap.width; let sh = bitmap.height;
  if (sourceRatio > targetRatio) { sw = bitmap.height * targetRatio; sx = (bitmap.width - sw) / 2; }
  else { sh = bitmap.width / targetRatio; sy = (bitmap.height - sh) / 2; }
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not process this image.");
  context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", .82));
  if (!blob) throw new Error("Image compression failed.");
  return blob;
}

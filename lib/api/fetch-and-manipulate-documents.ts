export async function fetchBlobFile(blobURL: string) {
  try {
    const response = await fetch(blobURL);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64String = Buffer.from(buffer).toString('base64');
    return base64String;
  } catch (error) {
    console.error('Error fetching the blob file:', error);
    return null;
  }
}
import { Storage } from 'aws-amplify';

export async function s3Upload(file) {
    const filename = `${Date.now()}-${file.name}`;
    const filePath = `${filename}`;

    try {
        const result = await Storage.put(filePath, file, {
            contentType: file.type,
        });

        console.log('File uploaded successfully:', result);
        return filePath;
    } catch (err) {
        console.error('Error uploading file:', err);
        throw err;
    }
}

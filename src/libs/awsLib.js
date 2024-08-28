import { Storage } from 'aws-amplify';

export async function s3Upload(file) {
    const filename = `${Date.now()}-${file.name}`;
    const filePath = `public/${filename}`;

    try {
        const result = await Storage.put(filePath, file, {
            contentType: file.type,
            level: 'public', // Set to public for unauthenticated access
        });

        console.log('File uploaded successfully:', result);
        return filePath;
    } catch (err) {
        console.error('Error uploading file:', err);
        throw err;
    }
}

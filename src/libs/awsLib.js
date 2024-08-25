import { Storage } from 'aws-amplify';

export async function s3Upload(file) {
    const filename = `${Date.now()}-${file.name}`;
    const filePath = `notes/${filename}`;

    try {
        await Storage.put(filePath, file, {
            contentType: file.type
        });
        return filePath;
    } catch (err) {
        console.error('Error uploading file:', err);
        throw err;
    };
    
}

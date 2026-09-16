
import Groq from 'groq-sdk';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false,
    },
};

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const form = formidable({ keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error al procesar archivo:', err);
            return res.status(500).json({ error: 'Error al leer el archivo subido.' });
        }

        const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

        if (!audioFile) {
            return res.status(400).json({ error: 'No se recibió ningún archivo de audio.' });
        }

        try {
            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(audioFile.filepath),
                model: 'whisper-large-v3-turbo',
                language: 'es',
            });

            if (fs.existsSync(audioFile.filepath)) {
                fs.unlinkSync(audioFile.filepath);
            }

            return res.status(200).json({ text: transcription.text });
        } catch (error) {
            console.error('Error Groq API:', error);
            if (fs.existsSync(audioFile.filepath)) {
                fs.unlinkSync(audioFile.filepath);
            }
            return res.status(500).json({ error: error.message || 'Error en la transcripción.' });
        }
    });
}

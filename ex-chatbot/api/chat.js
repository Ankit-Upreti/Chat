// This is your secure, server-side Vercel Function (api/chat.js)

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Get the API key from Vercel's Environment Variables
    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

    if (!GOOGLE_AI_API_KEY) {
        return res.status(500).json({ error: 'API key is not configured on the server.' });
    }

    const { history, instruction } = req.body;

    if (!history) {
        return res.status(400).json({ error: 'Conversation history is required.' });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_AI_API_KEY}`;

    const requestBody = {
        contents: history,
        systemInstruction: {
            parts: [{ text: instruction }]
        }
    };

    try {
        const googleResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!googleResponse.ok) {
            const errorData = await googleResponse.json();
            console.error('Google API Error:', errorData);
            throw new Error(errorData.error.message || `Google API responded with status: ${googleResponse.status}`);
        }

        const data = await googleResponse.json();
        
        if (data.candidates && data.candidates.length > 0) {
            const reply = data.candidates[0].content.parts[0].text;
            // Send the reply back to the frontend
            res.status(200).json({ reply: reply });
        } else {
             // This can happen if content is blocked due to safety settings
            res.status(200).json({ reply: "I'm a little lost for words... maybe ask me something else? ❤️" });
        }

    } catch (error) {
        console.error('Internal Server Error:', error);
        res.status(500).json({ error: error.message });
    }
}
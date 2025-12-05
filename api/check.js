// Vercel Serverless Function
// File: /api/checkRating.js
// This checks if user already gave a 5-star rating

export default async function handler(req, res) {
    // Allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { playerId, deviceId, userId } = req.query;

        if (!playerId || !deviceId && !userId) {
            return res.status(400).json({ error: 'Player ID and either device ID or user ID required' });
        }

        // TODO: Query ratings database
        // For now, return false (user can rate)
        const alreadyRated5Stars = false;

        return res.status(200).json({
            success: true,
            playerId,
            alreadyRated5Stars
        });

    } catch (error) {
        console.error('Error checking rating:', error);
        return res.status(500).json({ error: 'Failed to check rating' });
    }
}

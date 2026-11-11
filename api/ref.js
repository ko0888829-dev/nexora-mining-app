const { MongoClient } = require('mongodb');

let cachedClient = null;
async function getDb() {
  if (!process.env.MONGODB_URI) return null;
  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGODB_URI);
    await cachedClient.connect();
  }
  return cachedClient.db('nexora_db');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await getDb();
  if (!db) {
    return res.status(200).json({ ok: false, error: 'MONGODB_URI missing', refCount: 0, friends: [] });
  }

  const users = db.collection('users');
  const userId = String(req.query.userId || (req.body && req.body.userId) || '');

  if (!userId) return res.status(400).json({ ok: false, error: 'Missing userId' });

  // GET: Fetch referral count & invited friends list
  if (req.method === 'GET') {
    const user = await users.findOne({ userId });
    const friends = await users.find({ referredBy: userId }).project({ userId: 1, username: 1, joinedAt: 1, _id: 0 }).toArray();
    return res.status(200).json({
      ok: true,
      refCount: friends.length,
      refBonus: friends.length * 100,
      friends
    });
  }

  // POST: Register a referral from Mini App start_param
  if (req.method === 'POST') {
    const { referrerId, username } = req.body;
    const cleanRef = String(referrerId || '').replace('ref_', '').trim();

    await users.updateOne(
      { userId },
      { $setOnInsert: { userId, username: username || 'Miner', joinedAt: new Date() } },
      { upsert: true }
    );

    const currentUser = await users.findOne({ userId });
    if (cleanRef && cleanRef !== userId && !currentUser.referredBy) {
      await users.updateOne({ userId }, { $set: { referredBy: cleanRef } });
      await users.updateOne(
        { userId: cleanRef },
        { $inc: { refCount: 1, bonusNex: 100 }, $setOnInsert: { userId: cleanRef, joinedAt: new Date() } },
        { upsert: true }
      );
      return res.status(200).json({ ok: true, newlyReferred: true });
    }
    return res.status(200).json({ ok: true, newlyReferred: false });
  }
};

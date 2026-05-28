import mongoose from "mongoose";
import "dotenv/config";

const userSchema = new mongoose.Schema({
  playerId: { type: String, required: true, unique: true }, // Mapped to Clerk/Google ID
  displayName: { type: String, default: "Aspirant" },
  decor: { type: Object, default: {} },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  totalSolved: { type: Number, default: 0 },
  totalPagesRead: { type: Number, default: 0 },
  dailyLogs: { type: Object, default: {} }, // { "YYYY-MM-DD": count }
  dailyPageLogs: { type: Object, default: {} },
  streak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  rankLabel: { type: String, default: "Beginner" },
  studyMinutes: { type: Number, default: 0 },
  activityTotal: { type: Number, default: 0 },
  unlockedItems: { type: Array, default: [] },
  pendingCrates: { type: Array, default: [] },
  savedCrates: { type: Array, default: [] },
  totalCratesOpened: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

// Calculate activityTotal before saving to allow easy sorting
userSchema.pre('save', function() {
  const solved = Number(this.totalSolved) || 0;
  const pages = Number(this.totalPagesRead) || 0;
  const minutes = Number(this.studyMinutes) || 0;
  
  this.activityTotal = solved + pages + (minutes * 0.5);
  this.updatedAt = new Date();
});

// Indexes for fast leaderboard queries
userSchema.index({ activityTotal: -1, studyMinutes: -1 });

export const User = mongoose.model("User", userSchema);

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  creatorId: { type: String, required: true },
  creatorName: { type: String, required: true },
  capacity: { type: Number, default: 20 },
  password: { type: String, default: "" }, // Optional password
  isPasswordProtected: { type: Boolean, default: false },
  isMicOpen: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Room = mongoose.model("Room", roomSchema);

// --- Part 4: In-Memory Fallback for Legacy/Local Mode ---
const memoryStore = {
  users: new Map(), // playerId -> user object
  rooms: new Map(), // roomId -> room object
};

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn("⚠️ WARNING: Missing MONGO_URI. Falling back to In-Memory Legacy Mode.");
    return;
  }
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("✅ MongoDB Connected Successfully to Cloud Atlas");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    // Ensure we are truly disconnected so isMongoConnected() returns false
    await mongoose.disconnect();
    console.warn("⚠️ Falling back to In-Memory Legacy Mode.");
  }
};

const isMongoConnected = () => mongoose.connection.readyState === 1;

export async function upsertPlayer({ playerId, displayName, decor }) {
  if (!isMongoConnected()) {
    const existing = memoryStore.users.get(playerId) || {};
    memoryStore.users.set(playerId, {
      ...existing,
      playerId,
      displayName: displayName || existing.displayName || "Aspirant",
      decor: decor || existing.decor || {},
      updatedAt: new Date()
    });
    return;
  }

  try {
    const updatePayload = { displayName, updatedAt: new Date() };
    if (decor) updatePayload.decor = decor;
    await User.findOneAndUpdate(
      { playerId },
      { $set: updatePayload },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
    );
  } catch (e) {
    console.error("Upsert Player Error:", e);
  }
}

export async function updateStats(playerId, stats) {
  const isCorrection = stats.isCorrection === true;

  if (!isMongoConnected()) {
    const user = memoryStore.users.get(playerId);
    if (!user) return false;

    const safeNum = (val, fallback = 0) => {
      const n = Number(val);
      return isNaN(n) ? fallback : n;
    };

    if (isCorrection) {
      user.xp = safeNum(stats.xp);
      user.totalSolved = safeNum(stats.totalSolved);
      user.totalPagesRead = safeNum(stats.totalPagesRead);
      user.studyMinutes = safeNum(stats.studyMinutes);
    } else {
      user.xp = Math.max(safeNum(user.xp), safeNum(stats.xp));
      user.totalSolved = Math.max(safeNum(user.totalSolved), safeNum(stats.totalSolved));
      user.totalPagesRead = Math.max(safeNum(user.totalPagesRead), safeNum(stats.totalPagesRead));
      user.studyMinutes = Math.max(safeNum(user.studyMinutes), safeNum(stats.studyMinutes));
    }
    
    if (stats.level !== undefined) user.level = safeNum(stats.level, 1);
    if (stats.streak !== undefined) user.streak = safeNum(stats.streak);
    if (stats.rankLabel !== undefined) user.rankLabel = stats.rankLabel || "Aspirant";
    
    user.activityTotal = user.totalSolved + user.totalPagesRead + (user.studyMinutes * 0.5);
    user.updatedAt = new Date();
    return true;
  }

  try {
    const user = await User.findOne({ playerId });
    if (!user) return false;
    
    const safeNum = (val, fallback = 0) => {
      const n = Number(val);
      return isNaN(n) ? fallback : n;
    };

    const oldSolved = safeNum(user.totalSolved);
    const newSolved = safeNum(stats.totalSolved);

    if (isCorrection) {
      console.log(`[Stats] Player ${playerId} is performing a manual correction.`);
      user.xp = safeNum(stats.xp);
      user.totalSolved = safeNum(stats.totalSolved);
      user.totalPagesRead = safeNum(stats.totalPagesRead);
      user.studyMinutes = safeNum(stats.studyMinutes);
    } else {
      user.xp = Math.max(safeNum(user.xp), safeNum(stats.xp));
      user.totalSolved = Math.max(oldSolved, newSolved);
      user.totalPagesRead = Math.max(safeNum(user.totalPagesRead), safeNum(stats.totalPagesRead));
      user.studyMinutes = Math.max(safeNum(user.studyMinutes), safeNum(stats.studyMinutes));
    }
    
    if (!isCorrection && newSolved > oldSolved) {
      console.log(`[Stats] Player ${playerId} progressed: ${oldSolved} -> ${newSolved} MCQs`);
    }

    if (stats.level !== undefined) user.level = safeNum(stats.level, 1);
    if (stats.streak !== undefined) user.streak = safeNum(stats.streak);
    if (stats.bestStreak !== undefined) user.bestStreak = safeNum(stats.bestStreak);
    if (stats.rankLabel !== undefined) user.rankLabel = stats.rankLabel || "Aspirant";

    if (stats.unlockedItems && Array.isArray(stats.unlockedItems)) {
      if (stats.unlockedItems.length > (user.unlockedItems || []).length) {
        user.unlockedItems = stats.unlockedItems;
      }
    }
    if (stats.pendingCrates !== undefined) user.pendingCrates = stats.pendingCrates;
    if (stats.savedCrates !== undefined) user.savedCrates = stats.savedCrates;
    if (stats.totalCratesOpened !== undefined) {
      user.totalCratesOpened = Math.max(safeNum(user.totalCratesOpened), safeNum(stats.totalCratesOpened));
    }

    user.activityTotal = user.totalSolved + user.totalPagesRead + (user.studyMinutes * 0.5);

    if (stats.dailyLogs && typeof stats.dailyLogs === "object") {
      const merged = { ...(user.dailyLogs || {}) };
      Object.entries(stats.dailyLogs).forEach(([date, count]) => {
        if (isCorrection) merged[date] = safeNum(count);
        else merged[date] = Math.max(safeNum(merged[date]), safeNum(count));
      });
      user.dailyLogs = merged;
      user.markModified("dailyLogs");
    }
    
    if (stats.dailyPageLogs && typeof stats.dailyPageLogs === "object") {
      const merged = { ...(user.dailyPageLogs || {}) };
      Object.entries(stats.dailyPageLogs).forEach(([date, count]) => {
        if (isCorrection) merged[date] = safeNum(count);
        else merged[date] = Math.max(safeNum(merged[date]), safeNum(count));
      });
      user.dailyPageLogs = merged;
      user.markModified("dailyPageLogs");
    }
    
    await user.save();
    return true;
  } catch (e) {
    console.error("Update Stats Error:", e);
    return false;
  }
}

export async function getPlayer(playerId) {
  if (!isMongoConnected()) {
    const user = memoryStore.users.get(playerId);
    return user || null;
  }

  try {
    const user = await User.findOne({ playerId }).lean();
    if (!user) return null;
    return {
      playerId: user.playerId,
      displayName: user.displayName || "Aspirant",
      decor: user.decor || {},
      xp: user.xp || 0,
      level: user.level || 1,
      totalSolved: user.totalSolved || 0,
      totalPagesRead: user.totalPagesRead || 0,
      dailyLogs: user.dailyLogs || {},
      dailyPageLogs: user.dailyPageLogs || {},
      activityTotal: user.activityTotal || 0,
      streak: user.streak || 0,
      bestStreak: user.bestStreak || 0,
      rankLabel: user.rankLabel || "Beginner",
      studyMinutes: user.studyMinutes || 0,
      unlockedItems: user.unlockedItems || [],
      pendingCrates: user.pendingCrates || [],
      savedCrates: user.savedCrates || [],
      totalCratesOpened: user.totalCratesOpened || 0,
      updatedAt: user.updatedAt
    };
  } catch (e) {
    console.error("Get Player Error:", e);
    return null;
  }
}

export async function getLeaderboard(sort = "activity") {
  if (!isMongoConnected()) {
    const users = Array.from(memoryStore.users.values());
    users.sort((a, b) => (b.activityTotal || 0) - (a.activityTotal || 0));
    return users.slice(0, 100).map((u, i) => ({ ...u, rank: i + 1 }));
  }

  try {
    let sortQuery = { activityTotal: -1, studyMinutes: -1 };
    if (sort === "xp") sortQuery = { xp: -1, activityTotal: -1 };
    if (sort === "streak") sortQuery = { streak: -1, activityTotal: -1 };

    const users = await User.find({}).sort(sortQuery).limit(100).lean();
    return users.map((u, i) => ({
      rank: i + 1,
      playerId: u.playerId,
      displayName: u.displayName || "Aspirant",
      decor: u.decor || {},
      xp: u.xp || 0,
      level: u.level || 1,
      totalSolved: u.totalSolved || 0,
      totalPagesRead: u.totalPagesRead || 0,
      activityTotal: u.activityTotal || 0,
      streak: u.streak || 0,
      bestStreak: u.bestStreak || 0,
      rankLabel: u.rankLabel || "Beginner",
      studyMinutes: u.studyMinutes || 0,
      updatedAt: u.updatedAt
    }));
  } catch (e) {
    console.error("Leaderboard Error:", e);
    return [];
  }
}

export const db = { name: "MongoDB-Cloud" };

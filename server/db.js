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
  updatedAt: { type: Date, default: Date.now }
});

// Calculate activityTotal before saving to allow easy sorting
userSchema.pre('save', function(next) {
  this.activityTotal = this.totalSolved + this.totalPagesRead + ((this.studyMinutes || 0) * 0.5);
  this.updatedAt = new Date();
  next();
});

// Indexes for fast leaderboard queries
userSchema.index({ activityTotal: -1, studyMinutes: -1 });

export const User = mongoose.model("User", userSchema);

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("❌ ERROR: Missing MONGO_URI environment variable.");
    console.log("👉 Action: Add MONGO_URI to your Render Environment Variables.");
    return;
  }
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of hanging
    });
    console.log("✅ MongoDB Connected Successfully to Cloud Atlas");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    if (err.message.includes("IP not whitelisted")) {
      console.log("👉 Action: Add 0.0.0.0/0 to Network Access in MongoDB Atlas.");
    }
  }
};

export async function upsertPlayer({ playerId, displayName, decor }) {
  try {
    const updatePayload = { 
      displayName, 
      updatedAt: new Date() 
    };
    if (decor) updatePayload.decor = decor;

    await User.findOneAndUpdate(
      { playerId },
      { $set: updatePayload },
      { upsert: true, new: true }
    );
  } catch (e) {
    console.error("Upsert Player Error:", e);
  }
}

export async function updateStats(playerId, stats) {
  try {
    const user = await User.findOne({ playerId });
    if (!user) return false;
    
    if (stats.xp !== undefined) user.xp = stats.xp;
    if (stats.level !== undefined) user.level = stats.level;
    if (stats.totalSolved !== undefined) user.totalSolved = stats.totalSolved;
    if (stats.totalPagesRead !== undefined) user.totalPagesRead = stats.totalPagesRead;
    if (stats.streak !== undefined) user.streak = stats.streak;
    if (stats.bestStreak !== undefined) user.bestStreak = stats.bestStreak;
    if (stats.rankLabel !== undefined) user.rankLabel = stats.rankLabel;
    if (stats.studyMinutes !== undefined) user.studyMinutes = stats.studyMinutes;

    // Persist Granular Logs for Heatmap/Today views
    if (stats.dailyLogs) user.dailyLogs = stats.dailyLogs;
    if (stats.dailyPageLogs) user.dailyPageLogs = stats.dailyPageLogs;
    
    await user.save();
    return true;
  } catch (e) {
    console.error("Update Stats Error:", e);
    return false;
  }
}

export async function getPlayer(playerId) {
  try {
    const user = await User.findOne({ playerId }).lean();
    if (!user) return null;
    return {
      playerId: user.playerId,
      displayName: user.displayName,
      decor: user.decor,
      xp: user.xp,
      level: user.level,
      totalSolved: user.totalSolved,
      totalPagesRead: user.totalPagesRead,
      dailyLogs: user.dailyLogs || {},
      dailyPageLogs: user.dailyPageLogs || {},
      activityTotal: user.activityTotal,
      streak: user.streak,
      bestStreak: user.bestStreak,
      rankLabel: user.rankLabel,
      studyMinutes: user.studyMinutes,
      updatedAt: user.updatedAt
    };
  } catch (e) {
    console.error("Get Player Error:", e);
    return null;
  }
}

export async function getLeaderboard(sort = "activity") {
  try {
    let sortQuery = { activityTotal: -1, studyMinutes: -1 };
    if (sort === "xp") sortQuery = { xp: -1, activityTotal: -1 };
    if (sort === "streak") sortQuery = { streak: -1, activityTotal: -1 };

    const users = await User.find({}).sort(sortQuery).limit(100).lean();
    return users.map((u, i) => ({
      rank: i + 1,
      playerId: u.playerId,
      displayName: u.displayName,
      decor: u.decor,
      xp: u.xp,
      level: u.level,
      totalSolved: u.totalSolved,
      totalPagesRead: u.totalPagesRead,
      activityTotal: u.activityTotal,
      streak: u.streak,
      bestStreak: u.bestStreak,
      rankLabel: u.rankLabel,
      studyMinutes: u.studyMinutes,
      updatedAt: u.updatedAt
    }));
  } catch (e) {
    console.error("Leaderboard Error:", e);
    return [];
  }
}

export const db = { name: "MongoDB-Cloud" };

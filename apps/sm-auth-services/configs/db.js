const mongoose = require("mongoose");

// Global connection cache for serverless
let cachedConnection = null;

const connectDB = async () => {
  // Return cached connection if exists (CRITICAL for serverless)
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log("✅ Using cached MongoDB connection");
    return cachedConnection;
  }

  try {
    // Serverless-optimized connection options
    const options = {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 10000,
      retryWrites: true,
      retryReads: true,
    };

    console.log("🔄 Connecting to MongoDB...");
    console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
    console.log("MONGO_URI prefix:", process.env.MONGO_URI?.substring(0, 30) + "...");

    const connection = await mongoose.connect(process.env.MONGO_URI, options);

    cachedConnection = connection;
    console.log("✅ MongoDB Connected Successfully");

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
      cachedConnection = null;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      cachedConnection = null;
    });

    return connection;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    cachedConnection = null;
    throw error;
  }
};

// Cache for school database connections
const schoolDbConnections = {};

/**
 * Get a connection to a specific school's database
 * @param {string} schoolDbName - The school database name (e.g., 'school-db-myschool')
 * @returns {mongoose.Connection} - A mongoose connection to the school's database
 */
const getSchoolDbConnection = (schoolDbName) => {
  if (!schoolDbName) {
    throw new Error("schoolDbName is required");
  }

  // Return cached connection if exists
  if (schoolDbConnections[schoolDbName]) {
    return schoolDbConnections[schoolDbName];
  }

  // Ensure main connection exists
  if (mongoose.connection.readyState !== 1) {
    throw new Error("Main MongoDB connection is not established. Call connectDB() first.");
  }

  // Create a new connection to the school's database using useDb()
  // useDb() shares the same connection pool as the main connection
  const schoolConnection = mongoose.connection.useDb(schoolDbName, { useCache: true });

  // Cache the connection
  schoolDbConnections[schoolDbName] = schoolConnection;

  console.log(`✅ Connected to school database: ${schoolDbName}`);

  return schoolConnection;
};

// Export the connection functions
module.exports = { connectDB, getSchoolDbConnection };
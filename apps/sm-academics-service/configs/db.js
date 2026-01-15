const mongoose = require("mongoose");

// Global connection cache for serverless
let cachedConnection = null;
let reconnecting = false;

const connectDB = async () => {
    // Return cached connection if exists (CRITICAL for serverless)
    if (cachedConnection && mongoose.connection.readyState === 1) {
        console.log("✅ Using cached MongoDB connection");
        return cachedConnection;
    }

    // Prevent multiple simultaneous reconnection attempts
    if (reconnecting) {
        console.log("⏳ Reconnection already in progress...");
        // Wait for ongoing reconnection
        await new Promise(resolve => setTimeout(resolve, 1000));
        return connectDB();
    }

    try {
        reconnecting = true;

        // Serverless-optimized connection options with auto-reconnection
        const options = {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 1,
            maxIdleTimeMS: 10000,
            retryWrites: true,
            retryReads: true,
            autoCreate: true,
            autoIndex: true,
        };

        console.log("🔄 Connecting to MongoDB...");
        console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

        const connection = await mongoose.connect(process.env.MONGO_URI, options);

        cachedConnection = connection;
        reconnecting = false;
        console.log("✅ MongoDB Connected Successfully");

        // Connection event listeners with auto-reconnection
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  MongoDB disconnected - will auto-reconnect on next request');
            cachedConnection = null;
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
            cachedConnection = null;
            reconnecting = false;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected successfully');
            cachedConnection = mongoose.connection;
        });

        return connection;
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        cachedConnection = null;
        reconnecting = false;
        throw error;
    }
};

/**
 * Middleware to ensure MongoDB connection before processing requests
 * Automatically reconnects if disconnected
 */
const ensureDbConnection = async (req, res, next) => {
    try {
        // Check if connection is active
        if (mongoose.connection.readyState !== 1) {
            console.log('🔄 MongoDB disconnected, reconnecting...');
            await connectDB();
        }
        next();
    } catch (error) {
        console.error('❌ Failed to establish MongoDB connection:', error);
        return res.status(503).json({
            success: false,
            message: 'Database connection unavailable. Please try again.',
            error: error.message
        });
    }
};

// Export the connection functions
module.exports = { connectDB, ensureDbConnection };

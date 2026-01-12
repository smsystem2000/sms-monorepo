const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    RoomSchema: roomSchema,
    TimetableEntrySchema: timetableEntrySchema,
} = require("@sms/shared");

// Get models for a specific school database
const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        Room: schoolDb.model("Room", roomSchema),
        TimetableEntry: schoolDb.model("TimetableEntry", timetableEntrySchema),
    };
};

// Helper function to generate roomId
const generateRoomId = async (RoomModel) => {
    const lastRoom = await RoomModel.findOne()
        .sort({ createdAt: -1 })
        .select("roomId");

    let nextNumber = 1;
    if (lastRoom && lastRoom.roomId) {
        const numPart = parseInt(lastRoom.roomId.replace("ROOM", ""), 10);
        if (!isNaN(numPart)) {
            nextNumber = numPart + 1;
        }
    }

    return `ROOM${String(nextNumber).padStart(5, "0")}`;
};

// Create a new room
const createRoom = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { name, code, type, capacity, floor, building, equipment } = req.body;

        if (!name || !code) {
            return res.status(400).json({
                success: false,
                message: "Room name and code are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Room } = getModels(schoolDbName);

        // Check if room code already exists
        const existingRoom = await Room.findOne({ schoolId, code });
        if (existingRoom) {
            return res.status(400).json({
                success: false,
                message: `Room with code "${code}" already exists`,
            });
        }

        const roomId = await generateRoomId(Room);

        const newRoom = new Room({
            roomId,
            schoolId,
            name,
            code,
            type: type || "classroom",
            capacity: capacity || 40,
            floor: floor || "",
            building: building || "",
            equipment: equipment || [],
            isAvailable: true,
            status: "active",
        });

        await newRoom.save();

        res.status(201).json({
            success: true,
            message: "Room created successfully",
            data: newRoom,
        });
    } catch (error) {
        console.error("Error creating room:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create room",
        });
    }
};

// Get all rooms
const getAllRooms = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { type, status } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Room } = getModels(schoolDbName);

        const query = { schoolId };
        if (type) query.type = type;
        if (status) query.status = status;

        const rooms = await Room.find(query).sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: rooms,
        });
    } catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch rooms",
        });
    }
};

// Get room by ID
const getRoomById = async (req, res) => {
    try {
        const { schoolId, roomId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Room } = getModels(schoolDbName);

        const room = await Room.findOne({ schoolId, roomId });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }

        res.status(200).json({
            success: true,
            data: room,
        });
    } catch (error) {
        console.error("Error fetching room:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch room",
        });
    }
};

// Update room
const updateRoom = async (req, res) => {
    try {
        const { schoolId, roomId } = req.params;
        const updates = req.body;

        // Don't allow updating roomId or schoolId
        delete updates.roomId;
        delete updates.schoolId;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Room } = getModels(schoolDbName);

        const room = await Room.findOneAndUpdate(
            { schoolId, roomId },
            updates,
            { new: true, runValidators: true }
        );

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Room updated successfully",
            data: room,
        });
    } catch (error) {
        console.error("Error updating room:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update room",
        });
    }
};

// Delete room (soft delete)
const deleteRoom = async (req, res) => {
    try {
        const { schoolId, roomId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Room } = getModels(schoolDbName);

        const room = await Room.findOneAndUpdate(
            { schoolId, roomId },
            { status: "inactive", isAvailable: false },
            { new: true }
        );

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Room deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting room:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete room",
        });
    }
};

// Get room availability for a day
const getRoomAvailability = async (req, res) => {
    try {
        const { schoolId, roomId } = req.params;
        const { dayOfWeek } = req.query;

        if (!dayOfWeek) {
            return res.status(400).json({
                success: false,
                message: "Day of week is required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Room, TimetableEntry } = getModels(schoolDbName);

        const room = await Room.findOne({ schoolId, roomId });
        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }

        // Get all bookings for this room on the specified day
        const bookings = await TimetableEntry.find({
            schoolId,
            roomId,
            dayOfWeek,
            isActive: true,
        });

        res.status(200).json({
            success: true,
            data: {
                room,
                dayOfWeek,
                bookedPeriods: bookings.map((b) => ({
                    periodNumber: b.periodNumber,
                    classId: b.classId,
                    sectionId: b.sectionId,
                    subjectId: b.subjectId,
                })),
            },
        });
    } catch (error) {
        console.error("Error fetching room availability:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch room availability",
        });
    }
};

// Get all available rooms for a specific period
const getAvailableRooms = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { dayOfWeek, periodNumber, type } = req.query;

        if (!dayOfWeek || periodNumber === undefined) {
            return res.status(400).json({
                success: false,
                message: "Day and period number are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Room, TimetableEntry } = getModels(schoolDbName);

        // Get all rooms
        const roomQuery = { schoolId, status: "active", isAvailable: true };
        if (type) roomQuery.type = type;
        const allRooms = await Room.find(roomQuery);

        // Get booked rooms for this period
        const bookedEntries = await TimetableEntry.find({
            schoolId,
            dayOfWeek,
            periodNumber: parseInt(periodNumber, 10),
            roomId: { $ne: null },
            isActive: true,
        });

        const bookedRoomIds = bookedEntries.map((e) => e.roomId);

        // Filter available rooms
        const availableRooms = allRooms.filter((r) => !bookedRoomIds.includes(r.roomId));

        res.status(200).json({
            success: true,
            data: availableRooms,
        });
    } catch (error) {
        console.error("Error fetching available rooms:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch available rooms",
        });
    }
};

module.exports = {
    createRoom,
    getAllRooms,
    getRoomById,
    updateRoom,
    deleteRoom,
    getRoomAvailability,
    getAvailableRooms,
};

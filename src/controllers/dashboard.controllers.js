import { Channel } from "../models/channel.models.js";  // Assuming Channel model is present
import { Video } from "../models/video.models.js";  // Assuming Video model is present
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get Channel Statistics
const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    // Fetch channel data related to the logged-in user
    const channel = await Channel.findOne({ owner: userId });
    if (!channel) {
        throw new ApiError(404, "Channel not found for the current user");
    }

    // Aggregate stats like total videos, total views, etc.
    const totalVideos = await Video.countDocuments({ owner: userId });
    const totalViews = await Video.aggregate([
        { $match: { owner: userId } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);

    const stats = {
        totalVideos,
        totalViews: totalViews[0]?.totalViews || 0,
        totalSubscribers: channel.subscribers.length,  // Assuming subscribers is an array of user IDs
    };

    return res.status(200).json(new ApiResponse(200, stats, "Channel stats retrieved successfully"));
});

// Get Channel Videos
const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    // Fetch videos for the current user's channel
    const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 });

    if (videos.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No videos found for this channel"));
    }

    return res.status(200).json(new ApiResponse(200, videos, "Videos retrieved successfully"));
});

export { getChannelStats, getChannelVideos };

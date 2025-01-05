import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new tweet
const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user?._id; // The user ID should be retrieved from the JWT token

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content is required");
    }

    if (!userId) {
        throw new ApiError(401, "You must be logged in to create a tweet");
    }

    // Create a new tweet
    const newTweet = new Tweet({
        content,
        owner: userId,
    });

    // Save the tweet to the database
    const savedTweet = await newTweet.save();

    // Populate the tweet with the owner's username and avatar
    const populatedTweet = await savedTweet.populate({
        path: "owner",
        select: "username avatar",
    });

    // Return the saved tweet in the response
    return res.status(201).json(new ApiResponse(201, populatedTweet, "Tweet created successfully"));
});

// Update an existing tweet
const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content cannot be empty");
    }

    tweet.content = content;
    const updatedTweet = await tweet.save();

    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

// Delete a tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }

    await tweet.remove();

    return res.status(200).json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

// Get tweets of a specific user
const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

    if (tweets.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No tweets found for this user"));
    }

    return res.status(200).json(new ApiResponse(200, tweets, "Tweets retrieved successfully"));
});

export { createTweet, updateTweet, deleteTweet, getUserTweets };

import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelName } = req.params;
    const subscriberId = req.user._id; // Extract subscriber's user ID from the JWT token

    // Find the channel's ID based on its name
    const channel = await User.findOne({ username: channelName });
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const channelId = channel._id;

    // Check if the subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId,
    });

    if (existingSubscription) {
        // Unsubscribe the user (remove the subscription)
        await existingSubscription.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Unsubscribed successfully"));
    } else {
        // Subscribe the user (create a new subscription)
        const newSubscription = new Subscription({
            subscriber: subscriberId,
            channel: channelId,
        });
        await newSubscription.save();
        return res
            .status(201)
            .json(new ApiResponse(201, newSubscription, "Subscribed successfully"));
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelName } = req.params;

    // Find the channel's ID based on its name
    const channel = await User.findOne({ username: channelName });
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const channelId = channel._id;

    // Find all subscriptions where the specified channel is the "channel" in the subscription
    const subscribers = await Subscription.find({ channel: channelId }).populate(
        "subscriber",
        "username avatar"
    );

    if (subscribers.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No subscribers found for this channel"));
    }

    return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers retrieved successfully"));
});



// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberName } = req.params;
    console.log("Subscriber Name:", subscriberName);

    if (!subscriberName) {
        throw new ApiError(400, "Subscriber name is required");
    }
    // Find the subscriber's ID based on their username (case-insensitive)
    const subscriber = await User.findOne({
        username: { $regex: new RegExp(`^${subscriberName}$`, "i") },
    });

    if (!subscriber) {
        throw new ApiError(404, `Subscriber with username "${subscriberName}" not found`);
    }

    const subscriberId = subscriber._id;

    // Find all subscriptions where the specified subscriber is the "subscriber" in the subscription
    const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate(
        "channel",
        "username avatar"
    );

    if (subscriptions.length === 0) {
        return res
            .status(404)
            .json(new ApiResponse(404, null, "No subscribed channels found"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, subscriptions, "Subscribed channels retrieved successfully"));
});




export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
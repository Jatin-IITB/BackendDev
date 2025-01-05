import mongoose, { Schema } from "mongoose";

const channelSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true, // For optimized querying
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User", // References the User model
            required: true,
        },
        description: {
            type: String,
            trim: true,
        },
        avatar: {
            type: String, // Cloudinary URL or other storage URL
        },
        coverImage: {
            type: String, // Cloudinary URL or other storage URL
        },
        subscribers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User", // List of subscribers referencing User model
            },
        ],
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

// Pre-save hooks, methods, or static functions can be added here if needed

export const Channel = mongoose.model("Channel", channelSchema);

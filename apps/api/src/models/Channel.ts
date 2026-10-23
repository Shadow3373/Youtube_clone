import { Schema, model } from "mongoose";

const channelSchema = new Schema(
    {
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 60
        },

        handle: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true,
            match: /^[a-z0-9_]+$/
        },

        description: {
            type: String,
            default: "",
            maxlength: 1000
        },

        avatarUrl: {
            type: String,
            default: null
        },

        bannerUrl: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: ["active", "suspended"],
            default: "active"
        }
    },
    { timestamps: true, versionKey: false }
);

// channelSchema.index({ handle: 1 }, { unique: true });

export default model("Channel", channelSchema);
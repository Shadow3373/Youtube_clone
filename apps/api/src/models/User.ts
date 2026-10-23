import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
            unique: true,
            lowercase: true,
            match: /^[a-z0-9_]+$/
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        displayName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 60
        },

        avatarUrl: {
            type: String,
            default: null
        },

        role: {
            type: String,
            enum: ["user", "moderator", "admin"],
            default: "user",
            required: true
        },

        status: {
            type: String,
            enum: ["active", "suspended", "disabled"],
            default: "active",
            required: true
        },

        emailVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);


export type UserDocument = InferSchemaType<typeof userSchema>;

const User = model("User", userSchema);

export default User;
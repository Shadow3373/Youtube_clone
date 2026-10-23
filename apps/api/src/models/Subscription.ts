import { Schema, model } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriberId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        channelId: {
            type: Schema.Types.ObjectId,
            ref: "Channel",
            required: true
        }
    },
    { timestamps: true, versionKey: false }
);

subscriptionSchema.index(
    { subscriberId: 1, channelId: 1 },
    { unique: true }
);

subscriptionSchema.index({ channelId: 1 });

export default model("Subscription", subscriptionSchema);
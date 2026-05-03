import mongoose, { Document, Schema } from 'mongoose';

export interface ILink extends Document {
    name: string;
    url: string;
    description: string;
    order: number;
    createdAt: Date;
}

const linkSchema: Schema<ILink> = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    order: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model<ILink>('Link', linkSchema);

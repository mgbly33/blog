import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    order: number;
    createdAt: Date;
}

const categorySchema: Schema<ICategory> = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
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

export default mongoose.model<ICategory>('Category', categorySchema);

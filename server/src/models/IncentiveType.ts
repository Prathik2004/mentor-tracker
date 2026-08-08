import mongoose, { Schema, Document } from 'mongoose';

export interface IIncentiveType extends Document {
  name: string;
  isDefault: boolean;
}

const IncentiveTypeSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IIncentiveType>('IncentiveType', IncentiveTypeSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IIncentiveType extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  isDefault: boolean;
}

const IncentiveTypeSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

IncentiveTypeSchema.index({ ownerId: 1, name: 1 }, { unique: true });

export default mongoose.model<IIncentiveType>('IncentiveType', IncentiveTypeSchema);

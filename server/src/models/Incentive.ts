import mongoose, { Schema, Document } from 'mongoose';

export interface IIncentive extends Document {
  ownerId: mongoose.Types.ObjectId;
  date: Date;
  type: string;
  description?: string;
  amount: number;
  month: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncentiveSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true },
  type: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  amount: { type: Number, required: true, min: 0 },
  month: { type: String, required: true },
  notes: { type: String },
}, { timestamps: true });

IncentiveSchema.index({ ownerId: 1, month: 1 });

export default mongoose.model<IIncentive>('Incentive', IncentiveSchema);

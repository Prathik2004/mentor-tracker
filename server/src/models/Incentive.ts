import mongoose, { Schema, Document } from 'mongoose';

export interface IIncentive extends Document {
  date: Date;
  type: string;
  description?: string;
  amount: number;
  month: string;
  notes?: string;
  ruleKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncentiveSchema = new Schema({
  date: { type: Date, required: true },
  type: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  amount: { type: Number, required: true, min: 0 },
  month: { type: String, required: true },
  notes: { type: String },
  ruleKey: { type: String, trim: true }
}, { timestamps: true });

IncentiveSchema.index({ month: 1 });
IncentiveSchema.index({ ruleKey: 1 }, { unique: true, sparse: true });

export default mongoose.model<IIncentive>('Incentive', IncentiveSchema);

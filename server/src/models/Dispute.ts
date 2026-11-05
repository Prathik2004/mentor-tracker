import mongoose, { Document, Schema } from 'mongoose';

export interface IDispute extends Document {
  ownerId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  reason: string;
  deductedAmount: number;
  status: 'open' | 'resolved';
  paymentReversed: boolean;
  reversedAmount: number;
  resolvedAt?: Date | null;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DisputeSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, unique: true, index: true },
  reason: { type: String, required: true, trim: true },
  deductedAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  paymentReversed: { type: Boolean, default: false },
  reversedAmount: { type: Number, min: 0, default: 0 },
  resolvedAt: { type: Date, default: null },
  resolutionNotes: { type: String, trim: true },
}, { timestamps: true });

DisputeSchema.index({ ownerId: 1, status: 1 });

export default mongoose.model<IDispute>('Dispute', DisputeSchema);

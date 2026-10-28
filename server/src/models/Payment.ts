import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  ownerId: mongoose.Types.ObjectId;
  earningMonth: string;
  expectedAmount: number;
  receivedAmount: number | null;
  expectedWindowStart: Date;
  expectedWindowEnd: Date;
  receivedDate: Date | null;
  status: 'pending' | 'received' | 'partially_received' | 'disputed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  earningMonth: { type: String, required: true },
  expectedAmount: { type: Number, required: true, default: 0 },
  receivedAmount: { type: Number, default: null },
  expectedWindowStart: { type: Date, required: true },
  expectedWindowEnd: { type: Date, required: true },
  receivedDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ['pending', 'received', 'partially_received', 'disputed'],
    default: 'pending'
  },
  notes: { type: String }
}, { timestamps: true });

PaymentSchema.index({ ownerId: 1, earningMonth: 1 }, { unique: true });

export default mongoose.model<IPayment>('Payment', PaymentSchema);

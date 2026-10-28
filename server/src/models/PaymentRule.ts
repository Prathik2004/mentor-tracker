import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentRule extends Document {
  ownerId: mongoose.Types.ObjectId;
  classType: 'regular' | 'demo' | 'substitute' | 'ptm';
  status: 'completed' | 'student_no_show';
  amount: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentRuleSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  classType: {
    type: String,
    enum: ['regular', 'demo', 'substitute', 'ptm'],
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'student_no_show'],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: { type: Date, default: null }
}, { timestamps: true });

PaymentRuleSchema.index({ ownerId: 1, classType: 1, status: 1, effectiveFrom: 1 });

export default mongoose.model<IPaymentRule>('PaymentRule', PaymentRuleSchema);

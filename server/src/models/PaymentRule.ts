import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentRule extends Document {
  classType: 'regular' | 'demo' | 'substitute' | 'ptm';
  status: 'completed' | 'student_no_show';
  amount: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentRuleSchema = new Schema({
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

PaymentRuleSchema.index({ classType: 1, status: 1, effectiveFrom: 1 });

export default mongoose.model<IPaymentRule>('PaymentRule', PaymentRuleSchema);

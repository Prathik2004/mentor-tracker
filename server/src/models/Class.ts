import mongoose, { Schema, Document } from 'mongoose';

export interface IClass extends Document {
  date: Date;
  studentId?: mongoose.Types.ObjectId | null;
  class_no?: number | null;
  /** Start time of the class as "HH:MM" (24h). Optional. */
  time?: string | null;
  classType: 'regular' | 'demo' | 'substitute' | 'ptm';
  status: 'completed' | 'student_no_show' | 'cancelled' | 'rescheduled';
  schedulingType: 'scheduled' | 'on_spot';
  paymentAmount: number;
  regularPaymentAmount: number;
  ptmPaymentAmount: number;
  paymentRuleSnapshot: {
    classType: string;
    status: string;
    amount: number;
    ruleId: string;
  };
  classMonth: string;
  paymentMonth: string;
  paymentWindowStart: Date;
  paymentWindowEnd: Date;
  notes?: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema({
  date: { type: Date, required: true },
  time: { type: String, trim: true, default: null },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    default: null,
    // No schema-level `required`: a function-based required validator breaks
    // update validation (findByIdAndUpdate's runValidators sees `this` as the
    // Query, not the doc, so this.classType is always undefined). The routes
    // enforce "student required unless demo/substitute" instead.
  },
  class_no: { type: Number, min: 1, default: null },
  classType: {
    type: String,
    enum: ['regular', 'demo', 'substitute', 'ptm'],
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'student_no_show', 'cancelled', 'rescheduled'],
    required: true
  },
  schedulingType: {
    type: String,
    enum: ['scheduled', 'on_spot'],
    required: true
  },
  paymentAmount: { type: Number, required: true, min: 0 },
  regularPaymentAmount: { type: Number, required: true, min: 0, default: 0 },
  ptmPaymentAmount: { type: Number, required: true, min: 0, default: 0 },
  paymentRuleSnapshot: {
    classType: { type: String },
    status: { type: String },
    amount: { type: Number },
    ruleId: { type: String }
  },
  classMonth: { type: String, required: true },
  paymentMonth: { type: String, required: true },
  paymentWindowStart: { type: Date, required: true },
  paymentWindowEnd: { type: Date, required: true },
  notes: { type: String },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

ClassSchema.index({ date: -1 });
ClassSchema.index({ studentId: 1, date: -1 });
ClassSchema.index({ classMonth: 1 });
ClassSchema.index({ classType: 1 });
ClassSchema.index({ deletedAt: 1 });

export default mongoose.model<IClass>('Class', ClassSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  name: string;
  age?: number;
  course?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema({
  name: { type: String, required: true, trim: true },
  age: { type: Number },
  course: { type: String, trim: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  notes: { type: String }
}, { timestamps: true });

StudentSchema.index({ name: 'text' });

export default mongoose.model<IStudent>('Student', StudentSchema);

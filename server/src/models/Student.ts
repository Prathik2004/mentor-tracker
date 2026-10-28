import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  age?: number;
  course?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  age: { type: Number },
  course: { type: String, trim: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  notes: { type: String }
}, { timestamps: true });

StudentSchema.index({ ownerId: 1, name: 'text' });

export default mongoose.model<IStudent>('Student', StudentSchema);

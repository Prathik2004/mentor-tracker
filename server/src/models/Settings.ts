import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  ownerId: mongoose.Types.ObjectId;
  key: string;
  value: any;
  updatedAt: Date;
}

const SettingsSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  key: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true }
}, { timestamps: true });

SettingsSchema.index({ ownerId: 1, key: 1 }, { unique: true });

export default mongoose.model<ISettings>('Settings', SettingsSchema);

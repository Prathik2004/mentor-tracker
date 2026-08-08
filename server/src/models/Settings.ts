import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  value: any;
  updatedAt: Date;
}

const SettingsSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true }
}, { timestamps: true });

export default mongoose.model<ISettings>('Settings', SettingsSchema);

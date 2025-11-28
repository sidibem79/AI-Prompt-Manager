import { Id } from "../convex/_generated/dataModel";

export interface Version {
  _id: Id<"versions">;
  _creationTime: number;
  promptId: Id<"prompts">;
  content: string;
  timestamp: number;
}

export interface Prompt {
  _id: Id<"prompts">;
  _creationTime: number;
  title: string;
  category: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Template {
  _id: Id<"templates">;
  _creationTime: number;
  label: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  isCustom: boolean;
}

export type ToastVariant = 'info' | 'success' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

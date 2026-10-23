import { relations } from 'drizzle-orm';
import { integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('visitante').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const collectionItems = pgTable('collection_items', {
  id: text('id').primaryKey(),
  collectionName: text('collection_name').notNull(),
  itemId: text('item_id').notNull(),
  payload: jsonb('payload').notNull(),
  userId: integer('user_id').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const uploadedFiles = pgTable('uploaded_files', {
  id: text('id').primaryKey(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  dataUrl: text('data_url').notNull(),
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  collectionItems: many(collectionItems),
  uploadedFiles: many(uploadedFiles),
}));

export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  author: one(users, {
    fields: [collectionItems.userId],
    references: [users.id],
  }),
}));

export const uploadedFilesRelations = relations(uploadedFiles, ({ one }) => ({
  uploader: one(users, {
    fields: [uploadedFiles.userId],
    references: [users.id],
  }),
}));


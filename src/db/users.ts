import { db } from './index.ts';
import { users, collectionItems, uploadedFiles } from './schema.ts';
import { eq, inArray, sql } from 'drizzle-orm';
import type { AdminRole, AdminUserProfile, AdminInviteRecord } from '../admin/types.ts';
import { normalizeAdminRole, isRetiredRole } from '../admin/permissions.ts';

export const PRIMARY_ADMIN_EMAIL = 'higor.rock2011@gmail.com';

export async function getOrCreateUser(uid: string, email: string, name?: string, role?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        ...(name ? { name } : {}),
        ...(role ? { role } : {}),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
          ...(role ? { role } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getCollectionItemById(collectionName: string, itemId: string) {
  try {
    const compositeId = `${collectionName}:${itemId}`;
    const rows = await db
      .select()
      .from(collectionItems)
      .where(eq(collectionItems.id, compositeId));
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getCollectionItemById:', error);
    return null;
  }
}

export async function resolveUserProfile(
  uid: string,
  email: string,
  displayName?: string
): Promise<{ profile: AdminUserProfile; dbUserId?: number }> {
  const emailClean = (email || '').trim().toLowerCase();
  const isPrimaryOwner = emailClean === PRIMARY_ADMIN_EMAIL.toLowerCase();

  // 1. Check existing /admins/{uid} in collection_items
  const existingAdminItem = await getCollectionItemById('admins', uid);
  if (existingAdminItem && existingAdminItem.payload && typeof existingAdminItem.payload === 'object') {
    const raw = existingAdminItem.payload as Record<string, any>;
    const isLegacyVisitor = isRetiredRole(raw.role);
    const role: AdminRole = isPrimaryOwner
      ? 'super_admin'
      : normalizeAdminRole(raw.role);
    const profile: AdminUserProfile = {
      uid,
      email: String(raw.email || email),
      nome: String(raw.nome || displayName || email.split('@')[0] || 'Usuário'),
      role,
      projectIds: Array.isArray(raw.projectIds) ? raw.projectIds.map(String) : [],
      ativo: isPrimaryOwner ? true : isLegacyVisitor ? false : raw.ativo !== false,
      criadoEm: String(raw.criadoEm || new Date().toISOString()),
      criadoPor: String(raw.criadoPor || 'sistema'),
    };
    const dbUser = await getOrCreateUser(uid, profile.email, profile.nome, profile.role).catch(
      () => undefined
    );
    if (isPrimaryOwner && raw.role !== 'super_admin') {
      await upsertCollectionRecord('admins', uid, profile, dbUser?.id).catch(() => {});
    }
    return { profile, dbUserId: dbUser?.id };
  }

  // 2. Primary Super Admin first-time provisioning
  if (isPrimaryOwner) {
    const ownerProfile: AdminUserProfile = {
      uid,
      email,
      nome: displayName || 'Coordenação Geral Vitalizar',
      role: 'super_admin',
      projectIds: [],
      ativo: true,
      criadoEm: new Date().toISOString(),
      criadoPor: email,
    };
    const dbUser = await getOrCreateUser(uid, email, ownerProfile.nome, 'super_admin').catch(
      () => undefined
    );
    await upsertCollectionRecord('admins', uid, ownerProfile, dbUser?.id).catch(() => {});
    return { profile: ownerProfile, dbUserId: dbUser?.id };
  }

  // 3. Check /admin_invites/{emailClean} in collection_items
  if (emailClean) {
    const inviteItem = await getCollectionItemById('admin_invites', emailClean);
    if (inviteItem && inviteItem.payload && typeof inviteItem.payload === 'object') {
      const inv = inviteItem.payload as AdminInviteRecord;
      const invitedProfile: AdminUserProfile = {
        uid,
        email,
        nome: inv.nome || displayName || email.split('@')[0],
        role: normalizeAdminRole(inv.role),
        projectIds: Array.isArray(inv.projectIds) ? inv.projectIds : [],
        ativo: true,
        criadoEm: new Date().toISOString(),
        criadoPor: inv.criadoPor || 'convite',
      };
      const dbUser = await getOrCreateUser(
        uid,
        email,
        invitedProfile.nome,
        invitedProfile.role
      ).catch(() => undefined);
      await upsertCollectionRecord('admins', uid, invitedProfile, dbUser?.id).catch(() => {});
      await deleteCollectionRecord('admin_invites', emailClean).catch(() => {});
      return { profile: invitedProfile, dbUserId: dbUser?.id };
    }
  }

  // 4. Uninvited accounts are inactive in the admin panel until invited by an administrator
  const inactiveProfile: AdminUserProfile = {
    uid,
    email,
    nome: displayName || email.split('@')[0] || 'Usuário',
    role: 'parceiro',
    projectIds: [],
    ativo: false,
    criadoEm: new Date().toISOString(),
    criadoPor: 'nao_autorizado',
  };
  return { profile: inactiveProfile };
}

export async function getUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Database query failed in getUsers:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getCollectionRecords(collectionName: string) {
  try {
    return await db
      .select()
      .from(collectionItems)
      .where(eq(collectionItems.collectionName, collectionName));
  } catch (error) {
    console.error('Database query failed in getCollectionRecords:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getCollectionsByNames(collectionNames: string[]) {
  if (collectionNames.length === 0) return {};
  try {
    const rows = await db
      .select()
      .from(collectionItems)
      .where(inArray(collectionItems.collectionName, collectionNames));
    const grouped: Record<string, unknown[]> = {};
    for (const name of collectionNames) {
      grouped[name] = [];
    }
    for (const row of rows) {
      if (!grouped[row.collectionName]) {
        grouped[row.collectionName] = [];
      }
      grouped[row.collectionName].push(row.payload);
    }
    return grouped;
  } catch (error) {
    console.error('Database query failed in getCollectionsByNames:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertCollectionRecord(
  collectionName: string,
  itemId: string,
  payload: unknown,
  userId?: number
) {
  try {
    const compositeId = `${collectionName}:${itemId}`;
    const result = await db
      .insert(collectionItems)
      .values({
        id: compositeId,
        collectionName,
        itemId,
        payload,
        ...(typeof userId === 'number' ? { userId } : {}),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: collectionItems.id,
        set: {
          payload,
          ...(typeof userId === 'number' ? { userId } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in upsertCollectionRecord:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function insertCollectionRecordIfNew(
  collectionName: string,
  itemId: string,
  payload: unknown
) {
  try {
    const result = await db
      .insert(collectionItems)
      .values({
        id: `${collectionName}:${itemId}`,
        collectionName,
        itemId,
        payload,
        updatedAt: new Date(),
      })
      .onConflictDoNothing()
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error('Database query failed in insertCollectionRecordIfNew:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

// One atomic UPDATE, so two visitors booking at the same moment both count
export async function takeEventSpots(eventId: string, spots: number) {
  await db.execute(sql`
    UPDATE collection_items
    SET payload = jsonb_set(
      payload,
      '{availableSpots}',
      to_jsonb(GREATEST(0, (payload->>'availableSpots')::numeric - ${spots}))
    ),
    updated_at = now()
    WHERE id = ${`events:${eventId}`}
      AND jsonb_typeof(payload->'availableSpots') = 'number'
  `);
}

export async function deleteCollectionRecord(collectionName: string, itemId: string) {
  try {
    const compositeId = `${collectionName}:${itemId}`;
    await db.delete(collectionItems).where(eq(collectionItems.id, compositeId));
  } catch (error) {
    console.error('Database query failed in deleteCollectionRecord:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function saveUploadedFile(params: {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  userId?: number;
}) {
  try {
    const result = await db
      .insert(uploadedFiles)
      .values({
        id: params.id,
        fileName: params.fileName,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes,
        dataUrl: params.dataUrl,
        ...(typeof params.userId === 'number' ? { userId: params.userId } : {}),
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: uploadedFiles.id,
        set: {
          fileName: params.fileName,
          mimeType: params.mimeType,
          sizeBytes: params.sizeBytes,
          dataUrl: params.dataUrl,
        },
      })
      .returning({
        id: uploadedFiles.id,
        fileName: uploadedFiles.fileName,
        mimeType: uploadedFiles.mimeType,
        sizeBytes: uploadedFiles.sizeBytes,
      });

    return result[0];
  } catch (error) {
    console.error('Database query failed in saveUploadedFile:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getUploadedFile(id: string) {
  try {
    const rows = await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.id, id));
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getUploadedFile:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function purgeObsoleteCollections() {
  try {
    await db
      .delete(collectionItems)
      .where(
        inArray(collectionItems.collectionName, [
          'attendance_sessions',
          'participant_private',
        ])
      );
  } catch (error) {
    console.error('Failed to purge obsolete collections:', error);
  }
}



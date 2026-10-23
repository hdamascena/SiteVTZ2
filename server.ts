import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  getUsers,
  getCollectionItemById,
  getCollectionRecords,
  getCollectionsByNames,
  upsertCollectionRecord,
  deleteCollectionRecord,
  saveUploadedFile,
  getUploadedFile,
  resolveUserProfile,
  purgeObsoleteCollections,
} from './src/db/users.ts';
import {
  getReadablePrivateCollections,
  canRoleWriteCollection,
  canRoleDeleteFromCollection,
  filterPrivateCollectionsForUser,
} from './src/admin/permissions.ts';

const PUBLIC_COLLECTION_NAMES = [
  'club_info',
  'site_settings',
  'news_articles',
  'sponsors',
  'events',
  'projects',
  'gallery_albums',
  'transparency_docs',
  'facility_polos',
];

const PUBLIC_COLLECTIONS = new Set(PUBLIC_COLLECTION_NAMES);

const VISITOR_SUBMISSION_COLLECTIONS = new Set([
  'rsvps',
  'contact_messages',
  'scout_inquiries',
  'donation_pledges',
  'volunteer_applications',
]);

async function startServer() {
  const app = express();
  const PORT = 3000;

  await purgeObsoleteCollections();

  app.use(express.json({ limit: '25mb' }));

  app.post('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { profile } = await resolveUserProfile(
        req.user.uid,
        req.user.email || '',
        typeof req.body?.name === 'string' ? req.body.name : req.user.name
      );
      res.json(profile);
    } catch (error: any) {
      console.error('Failed to sync user in /api/me:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  app.get('/api/users', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { profile } = await resolveUserProfile(req.user.uid, req.user.email || '');
      if (
        !profile.ativo ||
        (profile.role !== 'super_admin' && profile.role !== 'admin')
      ) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const [usersList, adminCols] = await Promise.all([
        getUsers(),
        getCollectionsByNames(['admins', 'admin_invites']),
      ]);
      res.json({
        users: usersList,
        admins: adminCols.admins || [],
        invites: adminCols.admin_invites || [],
      });
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch users' });
    }
  });

  app.get('/api/bootstrap', async (_req, res) => {
    try {
      const collections = await getCollectionsByNames(PUBLIC_COLLECTION_NAMES);
      res.json({ collections });
    } catch (error: any) {
      console.error('Failed to fetch bootstrap collections:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch bootstrap collections' });
    }
  });

  app.get('/api/admin/bootstrap', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { profile } = await resolveUserProfile(req.user.uid, req.user.email || '');
      if (!profile.ativo) {
        return res.status(403).json({ error: 'Account inactive' });
      }
      const readableNames = getReadablePrivateCollections(profile.role);
      const rawCollections = await getCollectionsByNames(readableNames);
      const collections = filterPrivateCollectionsForUser(rawCollections, profile);
      res.json({ collections, profile });
    } catch (error: any) {
      console.error('Failed to fetch admin bootstrap collections:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch admin collections' });
    }
  });

  app.get('/api/collections/:collectionName', async (req, res) => {
    const { collectionName } = req.params;
    if (!PUBLIC_COLLECTIONS.has(collectionName)) {
      return res.status(403).json({ error: 'Collection requires authentication' });
    }
    try {
      const items = await getCollectionRecords(collectionName);
      res.json(items);
    } catch (error: any) {
      console.error(`Failed to fetch collection ${collectionName}:`, error);
      res.status(500).json({ error: error.message || 'Failed to fetch collection' });
    }
  });

  app.post('/api/submissions/:collectionName', async (req, res) => {
    const { collectionName } = req.params;
    if (!VISITOR_SUBMISSION_COLLECTIONS.has(collectionName)) {
      return res.status(403).json({ error: 'Invalid submission collection' });
    }
    const { itemId, payload } = req.body || {};
    if (!itemId || !payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'itemId and payload are required' });
    }
    try {
      const saved = await upsertCollectionRecord(collectionName, String(itemId), payload);
      res.json(saved);
    } catch (error: any) {
      console.error(`Failed to record submission in ${collectionName}:`, error);
      res.status(500).json({ error: error.message || 'Failed to save submission' });
    }
  });

  app.post('/api/collections/:collectionName', requireAuth, async (req: AuthRequest, res) => {
    const { collectionName } = req.params;
    const { itemId, payload } = req.body || {};
    if (!itemId || payload === undefined) {
      return res.status(400).json({ error: 'itemId and payload are required' });
    }
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { profile, dbUserId } = await resolveUserProfile(
        req.user.uid,
        req.user.email || ''
      );
      if (!profile.ativo || !canRoleWriteCollection(profile.role, collectionName)) {
        return res.status(403).json({ error: 'Permissão insuficiente para gravar nesta coleção.' });
      }

      const dataObj = payload && typeof payload === 'object' ? (payload as Record<string, any>) : {};

      // Enforce fine-grained role constraints
      if (collectionName === 'admins' || collectionName === 'admin_invites') {
        if (profile.role === 'admin' && dataObj.role === 'super_admin') {
          return res.status(403).json({ error: 'Apenas Super Admin pode conceder perfil Super Admin.' });
        }
        if (collectionName === 'admins' && profile.role === 'admin') {
          const existingTarget = await getCollectionItemById('admins', String(itemId));
          const targetPayload = existingTarget?.payload as Record<string, any> | undefined;
          if (targetPayload?.role === 'super_admin') {
            return res.status(403).json({ error: 'Admin não pode alterar conta Super Admin.' });
          }
        }
      }

      const saved = await upsertCollectionRecord(
        collectionName,
        String(itemId),
        payload,
        dbUserId
      );

      if (collectionName === 'admins' && dataObj.email && dataObj.role) {
        await getOrCreateUser(
          String(itemId),
          String(dataObj.email),
          typeof dataObj.nome === 'string' ? dataObj.nome : undefined,
          String(dataObj.role)
        ).catch(() => {});
      }

      res.json(saved);
    } catch (error: any) {
      console.error(`Failed to upsert item in ${collectionName}:`, error);
      res.status(500).json({ error: error.message || 'Failed to save item' });
    }
  });

  app.delete('/api/collections/:collectionName/:itemId', requireAuth, async (req: AuthRequest, res) => {
    const { collectionName, itemId } = req.params;
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { profile } = await resolveUserProfile(req.user.uid, req.user.email || '');
      if (!profile.ativo || !canRoleDeleteFromCollection(profile.role, collectionName)) {
        return res.status(403).json({ error: 'Permissão insuficiente para excluir registros nesta coleção.' });
      }
      await deleteCollectionRecord(collectionName, itemId);
      res.json({ deleted: true });
    } catch (error: any) {
      console.error(`Failed to delete item in ${collectionName}:`, error);
      res.status(500).json({ error: error.message || 'Failed to delete item' });
    }
  });

  app.post('/api/files', requireAuth, async (req: AuthRequest, res) => {
    const { id, fileName, mimeType, sizeBytes, dataUrl } = req.body || {};
    if (!fileName || !dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'fileName and dataUrl are required' });
    }
    try {
      const fileId =
        typeof id === 'string' && id.trim()
          ? id.trim()
          : `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const dbUser = req.user?.uid
        ? await getOrCreateUser(req.user.uid, req.user.email || '')
        : undefined;
      const saved = await saveUploadedFile({
        id: fileId,
        fileName: String(fileName),
        mimeType: String(mimeType || 'application/octet-stream'),
        sizeBytes: Number(sizeBytes) || dataUrl.length,
        dataUrl,
        userId: dbUser?.id,
      });
      res.json({
        ...saved,
        url: `/api/files/${encodeURIComponent(fileId)}`,
      });
    } catch (error: any) {
      console.error('Failed to store uploaded file in Cloud SQL:', error);
      res.status(500).json({ error: error.message || 'Failed to save uploaded file' });
    }
  });

  app.get('/api/files/:fileId', async (req, res) => {
    try {
      const record = await getUploadedFile(req.params.fileId);
      if (!record) {
        return res.status(404).json({ error: 'File not found' });
      }
      const match = /^data:([^;,]+)?(?:;base64)?,(.*)$/s.exec(record.dataUrl);
      if (!match) {
        return res.redirect(record.dataUrl);
      }
      const mimeType = record.mimeType || match[1] || 'application/octet-stream';
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const safeName = record.fileName.replace(/[^\w.-]/g, '_');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
    } catch (error: any) {
      console.error('Failed to serve uploaded file from Cloud SQL:', error);
      res.status(500).json({ error: 'Failed to retrieve file' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();


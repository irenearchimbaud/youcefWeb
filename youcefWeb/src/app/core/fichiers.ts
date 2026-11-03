/**
 * Stockage des fichiers des documents dans IndexedDB (localStorage est trop petit).
 * Comme le reste de la démonstration, tout reste dans le navigateur : à remplacer par un stockage serveur.
 */
const BASE = 'youcef-fichiers';
const STORE = 'fichiers';

const ouvrir = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(BASE, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const executer = async <T>(mode: IDBTransactionMode, action: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await ouvrir();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};

export const enregistrerFichier = (id: string, fichier: Blob): Promise<unknown> => executer('readwrite', (s) => s.put(fichier, id));

export const lireFichier = (id: string): Promise<Blob | undefined> => executer('readonly', (s) => s.get(id));

export const supprimerFichier = (id: string): Promise<unknown> => executer('readwrite', (s) => s.delete(id));

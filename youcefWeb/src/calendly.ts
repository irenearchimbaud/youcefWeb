const API = 'https://api.calendly.com';

export interface Rdv {
  id: string;
  titre: string;
  debut: string;
  fin: string;
  /** Lien de visio ou lieu, s'il est connu. */
  lien?: string;
  invite: string;
  /** Identifiant du client, transmis au widget via utm_content. */
  clientId?: string;
}

let utilisateur: string | undefined;
let cache: { expire: number; rdv: Rdv[] } | undefined;

export const configure = (): boolean => !!process.env['CALENDLY_TOKEN'];

async function appel<T>(chemin: string): Promise<T> {
  const reponse = await fetch(chemin.startsWith('http') ? chemin : `${API}${chemin}`, {
    headers: { Authorization: `Bearer ${process.env['CALENDLY_TOKEN']}` },
  });
  if (!reponse.ok) throw new Error(`Calendly ${reponse.status}: ${await reponse.text()}`);
  return reponse.json();
}

/** Rendez-vous à venir de Youcef (mis en cache 30 s pour ménager l'API). */
export async function prochainsRdv(force = false): Promise<Rdv[]> {
  if (!force && cache && cache.expire > Date.now()) return cache.rdv;

  utilisateur ??= (await appel<{ resource: { uri: string } }>('/users/me')).resource.uri;
  const params = new URLSearchParams({
    user: utilisateur,
    status: 'active',
    min_start_time: new Date().toISOString(),
    sort: 'start_time:asc',
    count: '50',
  });
  const { collection } = await appel<{ collection: any[] }>(`/scheduled_events?${params}`);

  const rdv = await Promise.all(
    collection.map(async (e): Promise<Rdv> => {
      const { collection: invites } = await appel<{ collection: any[] }>(`${e.uri}/invitees?status=active`);
      const invite = invites[0];
      return {
        id: e.uri.split('/').pop(),
        titre: e.name,
        debut: e.start_time,
        fin: e.end_time,
        lien: e.location?.join_url ?? e.location?.location ?? undefined,
        invite: invite?.name ?? 'Invité',
        clientId: invite?.tracking?.utm_content ?? undefined,
      };
    }),
  );
  cache = { expire: Date.now() + 30_000, rdv };
  return rdv;
}

import { createStore, get, set, del } from 'idb-keyval';

// A dedicated IndexedDB store just for audio blobs. Kept separate from
// localStorage (which holds metadata) because localStorage can't hold
// binary data efficiently and has a much smaller quota.
const audioStore = createStore('jammzzzlist-audio', 'blobs');

export async function saveAudioBlob(key: string, blob: Blob): Promise<void> {
  await set(key, blob, audioStore);
}

export async function getAudioBlob(key: string): Promise<Blob | undefined> {
  return get<Blob>(key, audioStore);
}

export async function deleteAudioBlob(key: string): Promise<void> {
  await del(key, audioStore);
}

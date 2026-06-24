'use client';

import { useState } from 'react';
import { CharacterCard } from './CharacterCard';

type Character = {
  id:              string;
  name:            string;
  role:            string;
  age:             number | null;
  lack:            string | null;
  want:            string | null;
  weakness:        string | null;
  arc:             string | null;
  arcStart:        string | null;
  arcEnd:          string | null;
  trait:           string | null;
  speechStyle:     string | null;
  relationshipRole: string | null;
  arcProgress:     number;
};

type Props = {
  projectId: string;
  initialCharacters: Character[];
};

export function CharactersClient({ projectId, initialCharacters }: Props) {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [error, setError]           = useState('');

  async function handleSave(updated: Partial<Character> & { id: string }) {
    setError('');
    const res = await fetch(`/api/characters/${updated.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ projectId, ...updated }),
    });
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      setError(d.error ?? '保存に失敗しました');
      return;
    }
    const { character } = await res.json() as { character: Character };
    setCharacters(prev => prev.map(c => c.id === character.id ? character : c));
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      {characters.length === 0 ? (
        <p className="text-gray-500">キャラクターがまだ登録されていません。ウィザードのSTEP 2から追加してください。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {characters.map(c => (
            <CharacterCard key={c.id} character={c} onSave={handleSave} />
          ))}
        </div>
      )}
    </div>
  );
}

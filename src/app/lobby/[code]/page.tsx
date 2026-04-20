import { LobbyRoom } from '@/components/lobby-room';

export default function LobbyPage({ params }: { params: { code: string } }) {
  return <LobbyRoom code={params.code} />;
}

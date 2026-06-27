import GameRoom from '@/components/game/GameRoom'

interface Props {
  params: Promise<{ roomCode: string }>
}

export default async function GameRoomPage({ params }: Props) {
  const { roomCode } = await params
  return <GameRoom roomCode={roomCode} />
}
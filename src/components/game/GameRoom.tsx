"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  roomCode: string;
}

interface Room {
  room_code: string;
  status: string;
  host_player_id: string | null;
  guest_player_id: string | null;
  player_one_name: string | null;
  player_two_name: string | null;
}

export default function GameRoom({ roomCode }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bothConnected, setBothConnected] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(
          "room_code, status, host_player_id, guest_player_id, player_one_name, player_two_name",
        )
        .eq("room_code", roomCode)
        .single();

      if (error || !data) {
        setError("Room not found.");
        setLoading(false);
        return;
      }

      setRoom(data);
      setLoading(false);

      if (data.host_player_id && data.guest_player_id) {
        setBothConnected(true);
      }
    };

    fetchRoom();

    const channel = supabase
      .channel(`room:${roomCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          const updated = payload.new as Room;
          setRoom(updated);
          if (updated.host_player_id && updated.guest_player_id) {
            setBothConnected(true);
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode]);

  const isHost = user?.id === room?.host_player_id;

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-text-secondary text-sm">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="text-accent text-sm cursor-pointer hover:opacity-75"
        >
          Go home
        </button>
      </main>
    );
  }

  if (bothConnected) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="flex flex-col gap-4 w-full max-w-xs md:max-w-md mx-auto text-center">
          <p className="text-accent text-4xl font-medium tracking-widest">
            {room?.room_code}
          </p>
          <p className="text-text-primary text-lg font-medium mt-4">
            Both players connected
          </p>
          <p className="text-text-secondary text-sm">
            {isHost ? "You are Player 1" : "You are Player 2"}
          </p>
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center justify-between bg-surface rounded-card px-4 py-3">
              <span className="text-text-secondary text-sm">Player 1</span>
              <span className="text-accent text-sm">Connected</span>
            </div>
            <div className="flex items-center justify-between bg-surface rounded-card px-4 py-3">
              <span className="text-text-secondary text-sm">Player 2</span>
              <span className="text-accent text-sm">Connected</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col gap-4 w-full max-w-xs md:max-w-md mx-auto text-center">
        <p className="text-text-secondary text-sm">Room</p>
        <p className="text-accent text-4xl font-medium tracking-widest">
          {room?.room_code}
        </p>
        <div className="flex flex-col items-center gap-3 mt-6">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-text-secondary text-sm">
            Waiting for your opponent...
          </p>
        </div>
      </div>
    </main>
  );
}

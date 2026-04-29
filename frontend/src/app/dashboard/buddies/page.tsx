"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/app/dashboard/theme-context";
import { toast } from "react-toastify";
import { getUserBuddies, sendBuddyRequest, acceptBuddyRequest, BuddyConnection, BuddyStatus } from "@/app/actions/buddies";
import { getUsers } from "@/app/actions/getUsers";
import { User } from "@/types/users";
import { getUserId } from "@/lib/utils";
import { Users, UserPlus, Check, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BuddiesPage() {
  const { primaryAccent } = useTheme();
  const [buddies, setBuddies] = useState<BuddyConnection[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const currentUserId = getUserId();

  const loadData = async () => {
    if (!currentUserId) return;
    try {
      const [bData, uData] = await Promise.all([
        getUserBuddies(currentUserId),
        getUsers()
      ]);
      setBuddies(bData);
      setUsers(uData.filter(u => u.userId !== currentUserId));
    } catch {
      toast.error("Failed to load accountability buddies.");
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const handleSendRequest = async (receiverId: number) => {
    try {
      await sendBuddyRequest(receiverId);
      toast.success("Buddy request sent!");
      loadData();
    } catch {
      toast.error("Failed to send request.");
    }
  };

  const handleAcceptRequest = async (connectionId: number) => {
    try {
      await acceptBuddyRequest(connectionId);
      toast.success("Buddy request accepted!");
      loadData();
    } catch {
      toast.error("Failed to accept request.");
    }
  };

  const pendingRequests = buddies.filter(b => b.status === BuddyStatus.PENDING && b.receiverId === currentUserId);
  const mySentRequests = buddies.filter(b => b.status === BuddyStatus.PENDING && b.requesterId === currentUserId);
  const myBuddies = buddies.filter(b => b.status === BuddyStatus.ACCEPTED);

  // Filter out users who are already buddies or have pending requests
  const connectableUsers = users.filter(u => {
    return !buddies.some(b => 
      (b.requesterId === u.userId && b.receiverId === currentUserId) || 
      (b.receiverId === u.userId && b.requesterId === currentUserId)
    );
  });

  return (
    <div className="mx-auto max-w-5xl gf-fade-up">
      <div className="mb-8">
        <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif", color: primaryAccent }}>
          Accountability Buddies
        </h1>
        <p className="gf-muted mt-1 text-sm">
          Connect with others to stay motivated and track your shared progress.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Buddies */}
          <div className="gf-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: primaryAccent }}>
              <Users size={20} /> My Buddies
            </h2>
            {myBuddies.length === 0 ? (
              <p className="text-sm gf-muted py-6 text-center border border-dashed rounded-lg">
                You don&apos;t have any accountability buddies yet. Add someone to start sharing progress!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myBuddies.map(b => {
                  const buddy = b.requesterId === currentUserId ? b.receiver : b.requester;
                  return (
                    <div key={b.connectionId} className="flex items-center gap-4 p-4 rounded-xl border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                        {buddy?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-bold">{buddy?.name}</div>
                        <div className="text-xs gf-muted">Level {buddy?.level || 1} • {buddy?.xp || 0} XP</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="gf-card p-6 border border-yellow-500/30 bg-yellow-500/5">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <ShieldAlert size={20} /> Pending Requests
              </h2>
              <div className="space-y-3">
                {pendingRequests.map(b => (
                  <div key={b.connectionId} className="flex items-center justify-between p-3 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f241f]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold">
                        {b.requester?.name?.charAt(0)}
                      </div>
                      <span className="font-medium">{b.requester?.name}</span>
                    </div>
                    <Button size="sm" onClick={() => handleAcceptRequest(b.connectionId)} className="bg-green-600 hover:bg-green-700 text-white">
                      <Check size={16} className="mr-1" /> Accept
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Find Buddies Sidebar */}
        <div className="space-y-6">
          <div className="gf-card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: primaryAccent }}>
              <UserPlus size={18} /> Find Buddies
            </h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {connectableUsers.length === 0 ? (
                <p className="text-sm gf-muted text-center py-4">No new users to connect with.</p>
              ) : (
                connectableUsers.map(u => (
                  <div key={u.userId} className="flex flex-col gap-2 p-3 rounded-lg border border-black/5 dark:border-white/5">
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-xs gf-muted">Level {u.level || 1}</div>
                    <Button variant="outline" size="sm" onClick={() => handleSendRequest(u.userId)} className="w-full mt-1">
                      Send Request
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {mySentRequests.length > 0 && (
            <div className="gf-card p-4">
              <h3 className="text-sm font-bold mb-3 gf-muted">Sent Requests ({mySentRequests.length})</h3>
              <div className="space-y-2">
                {mySentRequests.map(b => (
                  <div key={b.connectionId} className="text-xs flex justify-between items-center opacity-70">
                    <span>To: {b.receiver?.name}</span>
                    <span className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

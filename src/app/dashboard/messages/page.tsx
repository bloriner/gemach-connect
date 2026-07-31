"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";
import { formatDistanceToNow } from "date-fns";

export default function MessagesPage() {
  const { data: session } = useSession();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/threads")
      .then((r) => r.json())
      .then((d) => { setThreads(d.threads || []); setLoading(false); });
  }, []);

  // Poll every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/threads")
        .then((r) => r.json())
        .then((d) => setThreads(d.threads || []));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function openThread(threadId: string) {
    setThreadLoading(true);
    const res = await fetch(`/api/threads/${threadId}`);
    const data = await res.json();
    setActiveThread(data.thread);
    setThreadLoading(false);
    // Mark as read locally
    setThreads((t) =>
      t.map((x) => (x.id === threadId ? { ...x, unread: false } : x))
    );
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  async function sendMessage() {
    if (!newMsg.trim() || !activeThread) return;
    const body = newMsg.trim();
    setNewMsg("");
    setSending(true);

    // Optimistic
    const optimisticMsg = {
      id: "temp-" + Date.now(),
      body,
      senderId: session?.user?.id,
      sender: { id: session?.user?.id, name: session?.user?.name },
      createdAt: new Date().toISOString(),
      sending: true,
    };
    setActiveThread((prev: any) => ({
      ...prev,
      messages: [...(prev?.messages || []), optimisticMsg],
    }));

    const res = await fetch(`/api/threads/${activeThread.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);

    if (res.ok) {
      const data = await res.json();
      setActiveThread((prev: any) => ({
        ...prev,
        messages: prev.messages.map((m: any) =>
          m.id === optimisticMsg.id ? data.message : m
        ),
      }));
    } else {
      setActiveThread((prev: any) => ({
        ...prev,
        messages: prev.messages.filter((m: any) => m.id !== optimisticMsg.id),
      }));
      toast.error("Failed to send");
    }
  }

  const unreadCount = threads.filter((t) => t.unread).length;

  return (
    <div className="flex h-full -m-6">
      {/* Thread List */}
      <div className="w-80 border-r bg-white flex flex-col flex-shrink-0">
        <div className="px-4 py-4 border-b">
          <h1 className="text-lg font-bold text-gray-900">Messages</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-primary-600 mt-0.5">{unreadCount} unread</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : threads.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={MessageSquare}
                title="No messages"
                description="Your conversations will appear here."
              />
            </div>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => openThread(t.id)}
                className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition ${
                  activeThread?.id === t.id ? "bg-primary-50 border-l-2 border-l-primary-600" : ""
                } ${t.unread ? "bg-blue-50/30" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-sm truncate ${t.unread ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                      {t.other?.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{t.gemach?.name}</p>
                  </div>
                  {t.last && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatDistanceToNow(new Date(t.last.createdAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
                {t.last && (
                  <p className={`text-xs mt-1 truncate ${t.unread ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                    {t.last.isMine ? "You: " : ""}{t.last.body}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col">
        {!activeThread ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="mt-3 text-gray-500">Select a conversation</p>
            </div>
          </div>
        ) : threadLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-5 py-3 border-b bg-white flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-sm">
                {activeThread.other?.name?.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">{activeThread.other?.name}</p>
                <p className="text-xs text-gray-500">{activeThread.gemach?.name}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeThread.messages?.map((m: any) => {
                const isMine = m.senderId === session?.user?.id;
                return (
                  <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-xl px-4 py-2 text-sm ${
                      isMine
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    } ${m.sending ? "opacity-70" : ""}`}>
                      <p>{m.body}</p>
                      <p className={`text-xs mt-1 ${isMine ? "text-primary-200" : "text-gray-400"}`}>
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                        {m.sending && " · Sending…"}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Type a message..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMsg.trim() || sending}
                  className="btn btn-primary"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

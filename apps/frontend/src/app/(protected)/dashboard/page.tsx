// app/(protected)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/useAuth";
import { getAuth } from "firebase/auth";

export default function DashboardPage() {
  const [topics, setTopics] = useState<string[]>([]);
  const { logout } = useAuth();

  useEffect(() => {
  const fetchTopics = async () => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      const token = await user.getIdToken();

      const res = await fetch("http://localhost:8000/api/v1/topics/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch topics: ${res.statusText}`);
      }

      const data = await res.json();
      setTopics(data.topics);
    } catch (err) {
      console.error(err);
    }
  };

  fetchTopics();
}, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Available Topics</h1>
        <Button onClick={logout} variant="outline">Logout</Button>
      </div>

      <ul className="list-disc ml-6">
        {topics.map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
    </div>
  );
}

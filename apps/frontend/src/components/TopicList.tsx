"use client";

import { useEffect, useState } from "react";
import { getTopics } from "@/lib/client";

export default function TopicList() {
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    getTopics()
      .then(data => setTopics(data.topics))
      .catch(err => console.error("Error fetching topics:", err));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Topics</h2>
      <ul className="list-disc ml-5">
        {topics.map(t => <li key={t}>{t}</li>)}
      </ul>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/useAuth";
import { getAuth } from "firebase/auth";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const DEFAULT_TOPICS = ["CU0", "CU5", "Food"];

export default function DashboardPage() {
  const [topics, setTopics] = useState<string[]>([]);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const { logout } = useAuth();

  useEffect(() => {
    const fetchTopicsAndModels = async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) return;
        const token = await user.getIdToken();

        const [topicsRes, modelsRes] = await Promise.all([
          fetch("http://localhost:8000/api/v1/topics/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8000/api/v1/models/available", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!topicsRes.ok || !modelsRes.ok)
          throw new Error("Failed to fetch initial data");

        const topicsData = await topicsRes.json();
        const modelsData = await modelsRes.json();
        setTopics(topicsData);
        setModels(modelsData);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTopicsAndModels();
  }, []);

  const handleInitialize = async () => {
  try {
    const user = getAuth().currentUser;
    if (!user) return;
    const token = await user.getIdToken();

    const res = await fetch("http://localhost:8000/api/v1/views/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log("Init response:", data);
    alert("User data initialized. Refreshing...");
    window.location.reload();
  } catch (err) {
    console.error(err);
    alert("Failed to initialize user data.");
  }
};


  const handleModelChange = async (modelId: string) => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch("http://localhost:8000/api/v1/models/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: modelId }),
      });

      if (!res.ok) throw new Error("Failed to select model");
      setSelectedModel(modelId);
    } catch (err) {
      console.error(err);
    }
  };

  const builtIn = topics.filter((t) => DEFAULT_TOPICS.includes(t));
  const custom = topics.filter((t) => !DEFAULT_TOPICS.includes(t));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={logout} variant="outline">
          Logout
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Select Model</Label>
        <Select onValueChange={handleModelChange} defaultValue={selectedModel}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Built-in Topics</h2>
        <ul className="list-disc ml-6">
          {builtIn.map((topic) => (
            <li key={topic} className="flex items-center gap-2">
              <span>{topic}</span>
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-md">
                Built-in
              </span>
            </li>
          ))}
        </ul>

        {custom.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mt-6 mb-2">Your Topics</h2>
            <ul className="list-disc ml-6">
              {custom.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </>
        )}

        <div className="pt-4">
  <Button onClick={handleInitialize} variant="secondary">
    Initialize User Data
  </Button>
</div>
      </div>
    </div>
  );
}

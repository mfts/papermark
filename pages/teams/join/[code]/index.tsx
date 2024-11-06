import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import prisma from "@/lib/prisma";

const AcceptJoin = () => {
  const router = useRouter();
  const { code } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinLink, setJoinLink] = useState<string | null>(null); // State for join link
  const [teamName, setTeamName] = useState<string | null>(null); // State for team name

  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchJoinLink = async () => {
      if (code) {
        const response = await fetch(
          `/api/teams/join-link/info?joinCode=${code}`,
          {
            method: "GET",
          },
        );
        // getting teamName
        const data = await response.json();
        if (data.error) {
          setError(data.error); // Set error if data.error exists
          setLoading(false); // Set loading to false after error is fetched
          return; // Exit early if error is found
        }
        console.log("data :", data);
        setJoinLink(data.joinLink);
        setTeamName(data.teamName);
        setLoading(false); // Set loading to false after data is fetched
      }
    };

    fetchJoinLink();
  }, [code]);

  const handleJoin = async () => {
    if (code) {
      try {
        const response = await fetch(
          `/api/teams/join-link/accept?joinCode=${code}`,
          {
            method: "GET",
          },
        );
        if (!response.ok) {
          throw new Error("Failed to join team");
        }
        router.push(`/documents`);
      } catch (error) {
        setError("Failed to join team");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <p className="text-center text-lg text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="mb-4 text-2xl font-bold">
        {teamName ? `Join "${teamName}"` : "Join Team"}
      </h1>
      <button
        onClick={handleJoin}
        className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
      >
        Join Team
      </button>
      {joinLink && (
        <p className="mt-4">
          Your join link: <a href={joinLink}>{joinLink}</a>
        </p>
      )}
    </div>
  );
};

export default AcceptJoin;

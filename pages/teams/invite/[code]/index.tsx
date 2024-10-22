import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getServerSession } from 'next-auth/next'; // Importing getServerSession
import { authOptions } from '@/pages/api/auth/[...nextauth]'; // Ensure you have the correct path to your auth options
import prisma from '@/lib/prisma';
import { Session } from 'next-auth'; // Import Session type

// Extend the session type to include user id
interface ExtendedSession extends Session {
  user: {
    id: string; // Add id property
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const AcceptInvite = () => {
  const router = useRouter();
  const { code } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null); // State for invite link

  useEffect(() => {
    const acceptInvite = async () => {
      if (code) {
        // Fetch the session on the server side
        const session = await getServerSession(authOptions) as ExtendedSession; // Cast to ExtendedSession

        if (!session || !session.user) {
          setError('You must be logged in to accept an invite.'); // Error message for unauthenticated users
          setLoading(false);
          return;
        }

        try {
          // Check if the invite code is valid
          const team = await prisma.team.findUnique({
            where: { inviteCode: code as string },
          });

          if (team) {
            // Logic to accept the invite (e.g., add user to the team)
            await prisma.userTeam.create({
              data: {
                userId: session.user.id, 
                teamId: team.id,
                role: 'MEMBER', // Set the default role or any other role you want
              },
            });

            // Redirect to the team page
            router.push(`/teams/${team.id}`);
          } else {
            setError('Invalid invite code.');
          }
        } catch (err) {
          setError('An error occurred while processing your invite.');
        } finally {
          setLoading(false);
        }
      }
    };

    acceptInvite();
  }, [code, router]);

  useEffect(() => {
    const fetchInviteLink = async () => {
      if (code) {
        const response = await fetch(`/api/teams/${code}/invite-link`, {
          method: 'GET',
        });
        const data = await response.json();
        setInviteLink(data.inviteLink);
      }
    };

    fetchInviteLink();
  }, [code]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Accepting Invite...</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>Please wait while we process your invite.</p>
      {inviteLink && <p>Your invite link: <a href={inviteLink}>{inviteLink}</a></p>} {/* Display invite link */}
    </div>
  );
};

export default AcceptInvite;

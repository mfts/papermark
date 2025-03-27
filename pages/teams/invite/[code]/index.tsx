import { useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null); // State for invite link
  const [teamDetails, setTeamDetails] = useState<{ id: string; name: string } | null>(null); // State for team details

  const handleFetchInviteLink = async () => {
    if (code) {
      const response = await fetch(`/api/teams/${code}/invite-link`, {
        method: 'GET',
      });
      const data = await response.json();
      setInviteLink(data.inviteLink);
    }
  };

  const handleFetchTeamDetails = async () => {
    if (code) {
      const response = await fetch(`/api/teams/${code}`, {
        method: 'GET',
      });
      const data = await response.json();
      setTeamDetails(data.team); // Assuming the API returns team details
    }
  };

  const handleAcceptInvite = async () => {
    if (code) {
      setLoading(true); // Set loading to true when starting the invite acceptance process
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

  const handleRejectInvite = async () => {
    if (code) {
      setLoading(true); // Set loading to true when starting the invite rejection process
      const session = await getServerSession(authOptions) as ExtendedSession; // Cast to ExtendedSession

      if (!session || !session.user) {
        setError('You must be logged in to reject an invite.'); // Error message for unauthenticated users
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/teams/${code}/reject-invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: session.user.id }), // Send user ID to the server
        });

        if (!response.ok) {
          throw new Error('Failed to reject the invite.'); // Handle server error
        }

        setError('Invite rejected.'); // Provide feedback to the user
      } catch (err) {
        setError('An error occurred while rejecting the invite. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Accepting Invite...</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>Please wait while we process your invite.</p>
      {teamDetails && (
        <div>
          <h2>Team: {teamDetails.name}</h2> {/* Display team name */}
          <p>You have been invited to join this team.</p>
          <button onClick={handleAcceptInvite}>Accept Invite</button> {/* Button to accept invite */}
          <button onClick={handleRejectInvite}>Reject Invite</button> {/* Button to reject invite */}
        </div>
      )}
      {inviteLink && <p>Your invite link: <a href={inviteLink}>{inviteLink}</a></p>} {/* Display invite link */}
    </div>
  );
};

export default AcceptInvite;

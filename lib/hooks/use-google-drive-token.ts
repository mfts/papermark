import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useGoogleDriveToken(initialToken: string) {
    const [token, setToken] = useState(initialToken);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshToken = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch('/api/integrations/google-drive/refresh-token', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            setToken(data.accessToken);
            return data.accessToken;
        } catch (error) {
            console.error('Error refreshing token:', error);
            toast.error('Failed to refresh Google Drive token');
            throw error;
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    return {
        token,
        setToken,
        refreshToken,
        isRefreshing,
    };
} 
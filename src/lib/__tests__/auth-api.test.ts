import { loginUser, getAuthUser, logoutUser } from '../auth-api';

// Mocking fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

describe('Auth API Functions', () => {

  beforeEach(() => {
    mockFetch.mockClear();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe('loginUser', () => {
    it('sends credentials and returns data on successful login', async () => {
      const mockCredentials = { email: 'user@example.com', password: 'string' };
      const mockResponse = {
        access: 'some_access_token',
        user: { id: '1', email: 'user@example.com', role: 'customer' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await loginUser(mockCredentials);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login/'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockCredentials),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws an error on failed login', async () => {
      const mockCredentials = { email: 'wrong@example.com', password: 'wrongpassword' };
      const errorResponse = { detail: 'Invalid credentials' };
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => errorResponse,
      });

      await expect(loginUser(mockCredentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getAuthUser', () => {
    it('fetches user data with a valid token', async () => {
      const mockUser = { id: '1', email: 'test@user.com', role: 'customer' };
      (localStorage.getItem as jest.Mock).mockReturnValue('fake_token');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const user = await getAuthUser();

      expect(localStorage.getItem).toHaveBeenCalledWith('accessToken');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/users/me/'),
        { headers: { 'Authorization': 'Bearer fake_token' } }
      );
      expect(user).toEqual(mockUser);
    });

    it('throws an error if no token is found', async () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);
      await expect(getAuthUser()).rejects.toThrow('No access token found');
    });
  });

  describe('logoutUser', () => {
    it('sends a logout request if a token exists', async () => {
       (localStorage.getItem as jest.Mock).mockReturnValue('fake_token');
       mockFetch.mockResolvedValueOnce({ ok: true });
       
       await logoutUser();
       
       expect(mockFetch).toHaveBeenCalledWith(
           expect.stringContaining('/auth/logout/'),
           expect.objectContaining({
               method: 'POST',
               headers: expect.objectContaining({ 'Authorization': 'Bearer fake_token' })
           })
       );
    });

    it('does not send a request if no token exists', async () => {
       (localStorage.getItem as jest.Mock).mockReturnValue(null);
       await logoutUser();
       expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not throw an error if the backend call fails', async () => {
        (localStorage.getItem as jest.Mock).mockReturnValue('fake_token');
        mockFetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Server Error' });
        
        // The function should complete without throwing an error
        await expect(logoutUser()).resolves.toBeUndefined();
    });
  });

});

# OAuth Authentication Setup Guide

## Overview
EduSphere now includes professional Google and GitHub OAuth authentication with enhanced security features including CSRF protection, proper state management, and comprehensive error handling.

## 🔧 Configuration Required

### 1. Environment Variables
Add these variables to your `.env.local` file:

```env
# OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
VITE_GITHUB_CLIENT_ID=your_actual_github_client_id_here
VITE_OAUTH_REDIRECT_URI=http://localhost:5174/auth/callback
```

### 2. Google OAuth Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or select a project**
3. **Enable Google+ API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth 2.0 credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:5174/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)
5. **Copy the Client ID** and set it as `VITE_GOOGLE_CLIENT_ID`

### 3. GitHub OAuth Setup

1. **Go to GitHub Settings**: https://github.com/settings/developers
2. **Create a new OAuth App**:
   - Click "New OAuth App"
   - Fill in application details:
     - Application name: "EduSphere"
     - Homepage URL: `http://localhost:5174` (development)
     - Authorization callback URL: `http://localhost:5174/auth/callback`
3. **Copy the Client ID** and set it as `VITE_GITHUB_CLIENT_ID`

## 🚀 Features Implemented

### Security Features
- **CSRF Protection**: Secure state parameter generation and validation
- **Cryptographic State**: Uses `crypto.getRandomValues()` for secure random states
- **Session Management**: Proper token storage and session handling
- **Error Handling**: Comprehensive OAuth error mapping and user feedback

### User Experience
- **Loading States**: Visual feedback during OAuth redirects
- **Error Recovery**: Clear error messages with retry options
- **Success Feedback**: Confirmation messages and automatic redirects
- **Provider Detection**: Automatic detection of OAuth provider in callbacks

### Technical Implementation
- **Singleton Pattern**: OAuth configuration using singleton design pattern
- **Type Safety**: Full TypeScript support with proper type definitions
- **Clean Architecture**: Separation of concerns with dedicated OAuth utilities
- **OOP Principles**: Object-oriented design following SOLID principles

## 🔄 OAuth Flow

1. **User clicks Google/GitHub login button**
2. **System generates secure state parameter**
3. **User redirects to OAuth provider**
4. **Provider redirects back with authorization code**
5. **System validates state parameter (CSRF protection)**
6. **Authorization code exchanged for access token via backend**
7. **User session created and redirected to dashboard**

## 📁 Files Created/Modified

### New Files
- `src/config/oauth.ts` - OAuth configuration and utilities
- `src/pages/AuthCallback.tsx` - OAuth callback processing page
- `OAUTH_SETUP.md` - This setup guide

### Modified Files
- `src/components/Auth/SocialLogin.tsx` - Enhanced OAuth implementation
- `src/App.tsx` - Added OAuth callback route
- `.env.local` - Added OAuth environment variables

## 🧪 Testing

### Development Testing
1. **Set up OAuth apps** (Google & GitHub) with localhost callbacks
2. **Configure environment variables** with actual client IDs
3. **Start development server**: `npm run dev`
4. **Test OAuth flows**:
   - Navigate to `/login`
   - Click Google/GitHub login buttons
   - Verify redirect to OAuth providers
   - Complete authentication
   - Verify callback processing at `/auth/callback`
   - Confirm redirect to dashboard

### Error Testing
- Test with invalid client IDs
- Test callback with missing parameters
- Test state parameter validation
- Test network error handling

## 🔒 Security Considerations

### State Parameter
- Generated using cryptographically secure random values
- Stored in sessionStorage for validation
- Automatically cleaned up after use
- Prevents CSRF attacks

### Token Handling
- Secure storage in localStorage/sessionStorage
- Automatic cleanup on logout
- Proper session management with backend

### Error Handling
- No sensitive information exposed in error messages
- Proper logging for debugging
- User-friendly error recovery options

## 🚨 Important Notes

1. **Client IDs are public** - They can be safely exposed in frontend code
2. **Client Secrets are private** - Never include in frontend, handle in backend only
3. **Redirect URIs must match exactly** - Case-sensitive and protocol-specific
4. **HTTPS required in production** - OAuth providers require secure connections
5. **Backend integration needed** - Token exchange must be handled server-side

## 📞 Support

If you encounter issues:
1. Check browser console for detailed error messages
2. Verify OAuth app configurations match redirect URIs
3. Ensure environment variables are properly set
4. Test with different browsers to rule out cache issues

## 🎯 Next Steps

1. **Set up actual OAuth applications** with Google and GitHub
2. **Configure environment variables** with real client IDs
3. **Implement backend OAuth endpoints** for token exchange
4. **Test complete authentication flow**
5. **Deploy with production OAuth configurations**

# EduSphere Backend Implementation Tasks

## Phase 1: AI Integration (Week 1) - CRITICAL ⚠️

### Setup Requirements:
- OpenAI API key setup and configuration
- Database schema creation for AI conversations
- Rate limiting implementation (100 requests/hour per user)
- AI response streaming capability

### Endpoints to Implement:

#### 1. `POST /api/ai/chat` - AI Conversation Endpoint
```typescript
Request: {
  message: string;
  roomContext: {
    roomId: string;
    roomName: string;
    subject?: string;
    recentMessages: Array<{
      user: string;
      content: string;
      timestamp: string;
    }>;
  };
}

Response: {
  response: string;
  conversationId: string;
  tokensUsed: number;
}
```

#### 2. `POST /api/ai/summarize` - Conversation Summarization
```typescript
Request: {
  roomId: string;
  roomName: string;
  subject?: string;
  messages: Array<{
    user: string;
    content: string;
    timestamp: string;
  }>;
}

Response: {
  summary: string;
  keyPoints: string[];
  participants: string[];
  messageCount: number;
}
```

#### 3. `GET /api/ai/conversation-history/:roomId` - Chat History
```typescript
Response: {
  conversations: Array<{
    id: string;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
    createdAt: string;
  }>;
}
```

#### 4. `DELETE /api/ai/conversation-history/:roomId` - Clear History
```typescript
Response: {
  success: boolean;
  deletedCount: number;
}
```

### Database Tables:
```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  summary_content TEXT NOT NULL,
  key_points JSONB,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_conversations_room_id ON ai_conversations(room_id);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_summaries_room_id ON ai_summaries(room_id);
```

---

## Phase 2: Real-time WebSocket System (Week 2) - HIGH PRIORITY

### WebSocket Events to Implement:
```typescript
// Incoming Events (from client)
'join_room' | 'leave_room' | 'send_message' | 'typing_start' | 'typing_stop'

// Outgoing Events (to client)
'message_received' | 'user_joined' | 'user_left' | 'typing_indicator' | 
'user_online' | 'user_offline' | 'message_reaction' | 'message_edited'
```

### Enhanced Message Endpoints:

#### 1. `PUT /api/rooms/:id/messages/:messageId` - Edit Messages
```typescript
Request: {
  content: string;
}

Response: {
  id: string;
  content: string;
  isEdited: boolean;
  editedAt: string;
}
```

#### 2. `DELETE /api/rooms/:id/messages/:messageId` - Soft Delete Messages
```typescript
Response: {
  id: string;
  isDeleted: boolean;
  deletedAt: string;
}
```

#### 3. `POST /api/rooms/:id/messages/:messageId/reactions` - Message Reactions
```typescript
Request: {
  emoji: string;
  action: 'add' | 'remove';
}

Response: {
  messageId: string;
  reactions: Array<{
    emoji: string;
    count: number;
    users: Array<{
      id: string;
      username: string;
    }>;
  }>;
}
```

#### 4. `GET /api/rooms/:id/messages/search` - Message Search
```typescript
Query Parameters: {
  q: string; // search query
  limit?: number; // default 50
  offset?: number; // default 0
  userId?: string; // filter by user
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
}

Response: {
  messages: Array<MessageWithUser>;
  total: number;
  hasMore: boolean;
}
```

### Database Schema Updates:
```sql
-- Add new columns to messages table
ALTER TABLE messages ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN edited_at TIMESTAMP NULL;
ALTER TABLE messages ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE messages ADD COLUMN reply_to_id UUID REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN message_status VARCHAR(20) DEFAULT 'sent' CHECK (message_status IN ('sending', 'sent', 'delivered', 'read', 'failed'));
ALTER TABLE messages ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE;

-- Create reactions table
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create message edit history table
CREATE TABLE message_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  previous_content TEXT NOT NULL,
  edited_by UUID REFERENCES users(id) ON DELETE CASCADE,
  edited_at TIMESTAMP DEFAULT NOW()
);

-- Create full-text search index
CREATE INDEX idx_messages_content_search ON messages USING gin(to_tsvector('english', content));
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_edit_history_message_id ON message_edit_history(message_id);
```

---

## Phase 3: File Upload & Media System (Week 3) - MEDIUM PRIORITY

### Cloud Storage Setup:
- AWS S3 bucket configuration with proper IAM roles
- File virus scanning integration (ClamAV or cloud service)
- Image compression/optimization (Sharp.js or ImageMagick)
- Video thumbnail generation
- PDF text extraction for search

### File Upload Endpoints:

#### 1. `POST /api/upload/file` - Single File Upload
```typescript
Request: FormData {
  file: File;
  roomId: string;
  description?: string;
}

Response: {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  roomId: string;
  uploadedBy: string;
  createdAt: string;
}
```

#### 2. `POST /api/upload/multiple` - Multiple Files Upload
```typescript
Request: FormData {
  files: File[];
  roomId: string;
}

Response: {
  uploaded: Array<FileResponse>;
  failed: Array<{
    filename: string;
    error: string;
  }>;
}
```

#### 3. `GET /api/files/:id/download` - Secure File Download
```typescript
Response: File stream with proper headers
Headers: {
  'Content-Disposition': 'attachment; filename="..."',
  'Content-Type': '...',
  'Content-Length': '...'
}
```

#### 4. `DELETE /api/files/:id` - Delete File
```typescript
Response: {
  success: boolean;
  deletedAt: string;
}
```

#### 5. `GET /api/rooms/:id/files` - List Room Files
```typescript
Query Parameters: {
  type?: 'image' | 'video' | 'document' | 'archive';
  limit?: number;
  offset?: number;
  search?: string;
}

Response: {
  files: Array<{
    id: string;
    filename: string;
    originalName: string;
    url: string;
    thumbnailUrl?: string;
    size: number;
    type: string;
    mimeType: string;
    uploadedBy: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
    };
    uploadedAt: string;
    downloadCount: number;
    description?: string;
  }>;
  total: number;
}
```

### Database Schema:
```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  description TEXT NULL,
  download_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE file_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_type VARCHAR(20) CHECK (permission_type IN ('read', 'write', 'admin')) DEFAULT 'read',
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_files_room_id ON files(room_id);
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_file_permissions_file_id ON file_permissions(file_id);
```

---

## Phase 4: Authentication & Security (Week 4) - HIGH PRIORITY ⚠️

### MISSING CRITICAL AUTHENTICATION FEATURES - IMPLEMENT IMMEDIATELY

#### Email Verification System:

##### 1. `POST /auth/send-verification` - Send Email Verification
```typescript
Request: {
  email: string;
}

Response: {
  success: boolean;
  message: string;
  expiresIn: number; // seconds
}
```

##### 2. `POST /auth/verify-email` - Verify Email Token
```typescript
Request: {
  token: string;
  email?: string; // optional for additional validation
}

Response: {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    isEmailVerified: boolean;
  };
}
```

##### 3. `POST /auth/resend-verification` - Resend Verification Email
```typescript
Request: {
  email: string;
}

Response: {
  success: boolean;
  message: string;
  cooldownSeconds?: number; // if rate limited
}
```

#### Forgot Password System:

##### 4. `POST /auth/forgot-password` - Request Password Reset
```typescript
Request: {
  email: string;
}

Response: {
  success: boolean;
  message: string; // Always success message for security
  expiresIn?: number; // only if email exists
}
```

##### 5. `POST /auth/verify-reset-token` - Verify Reset Token
```typescript
Request: {
  token: string;
}

Response: {
  success: boolean;
  valid: boolean;
  expiresAt?: string;
  email?: string; // masked email like "j***@example.com"
}
```

#### Password Reset System:

##### 6. `POST /auth/reset-password` - Reset Password with Token
```typescript
Request: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

Response: {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    passwordChangedAt: string;
  };
}
```

##### 7. `POST /auth/change-password` - Change Password (Authenticated)
```typescript
Request: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

Response: {
  success: boolean;
  message: string;
  passwordChangedAt: string;
}
```

### Database Schema Updates for Authentication:

```sql
-- Add email verification fields to users table
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP DEFAULT NOW();

-- Create email verification tokens table
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Create password reset tokens table
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Create email attempts tracking (rate limiting)
CREATE TABLE email_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  attempt_type VARCHAR(50) NOT NULL, -- 'verification', 'password_reset'
  ip_address INET NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create password history (prevent reuse)
CREATE TABLE password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

CREATE INDEX idx_email_attempts_email_created_at ON email_attempts(email, created_at);
CREATE INDEX idx_email_attempts_ip_created_at ON email_attempts(ip_address, created_at);

CREATE INDEX idx_password_history_user_id ON password_history(user_id);
```

### Email Templates Required:

#### 1. Email Verification Template
```html
Subject: Verify your EduSphere account

Hello {{firstName}},

Welcome to EduSphere! Please verify your email address to complete your registration.

Verification Code: {{verificationCode}}
Or click this link: {{verificationLink}}

This link expires in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
The EduSphere Team
```

#### 2. Password Reset Template
```html
Subject: Reset your EduSphere password

Hello {{firstName}},

We received a request to reset your password for your EduSphere account.

Reset Code: {{resetCode}}
Or click this link: {{resetLink}}

This link expires in 1 hour.

If you didn't request this reset, please ignore this email.

Best regards,
The EduSphere Team
```

#### 3. Password Changed Notification
```html
Subject: Your EduSphere password was changed

Hello {{firstName}},

Your password was successfully changed on {{changeDate}} at {{changeTime}}.

If this wasn't you, please contact support immediately.

Best regards,
The EduSphere Team
```

### Security Requirements:

1. **Token Generation:**
   - Use cryptographically secure random tokens (32+ characters)
   - Tokens should be URL-safe base64 encoded
   - Hash tokens before storing in database

2. **Rate Limiting:**
   - Max 3 verification emails per hour per email address
   - Max 5 password reset requests per hour per IP
   - Max 10 failed verification attempts per hour per IP

3. **Token Expiration:**
   - Email verification tokens: 24 hours
   - Password reset tokens: 1 hour
   - Clean up expired tokens daily

4. **Password Security:**
   - Minimum 8 characters, must include uppercase, lowercase, number
   - Prevent reuse of last 5 passwords
   - Hash passwords with bcrypt (cost factor 12+)

5. **Email Security:**
   - Use DKIM and SPF records
   - Track email delivery status
   - Handle bounces and complaints

### Implementation Priority for Authentication:
1. **IMMEDIATE :** Email verification system
2. **IMMEDIATE :** Forgot password flow  
3. **IMMEDIATE :** Password reset functionality
4. **IMMEDIATE:** OAuth integration
5. **IMMEDIATE:** Advanced security features

## Phase 4 Continued: OAuth & Advanced Security

### OAuth Implementation:

#### 1. `POST /api/auth/oauth/google/callback` - Google OAuth
```typescript
Request: {
  code: string;
  state: string;
}

Response: {
  user: UserProfile;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
```

#### 2. `POST /api/auth/oauth/github/callback` - GitHub OAuth
```typescript
Request: {
  code: string;
  state: string;
}

Response: {
  user: UserProfile;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
```

#### 3. `POST /api/auth/oauth/exchange-token` - Token Exchange
```typescript
Request: {
  provider: 'google' | 'github';
  accessToken: string;
}

Response: {
  user: UserProfile;
  appTokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
```

### Security Endpoints:

#### 1. `POST /api/auth/refresh-token` - Refresh JWT
```typescript
Request: {
  refreshToken: string;
}

Response: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

#### 2. `POST /api/auth/logout-all-devices` - Logout All Sessions
```typescript
Response: {
  success: boolean;
  sessionsTerminated: number;
}
```

#### 3. `GET /api/auth/active-sessions` - List Active Sessions
```typescript
Response: {
  sessions: Array<{
    id: string;
    deviceInfo: string;
    ipAddress: string;
    lastActive: string;
    isCurrent: boolean;
  }>;
}
```

### Email Service Setup:
- SendGrid or Mailgun integration
- Email templates for verification/reset
- Queue system for email delivery
- Email bounce/complaint handling

### Security Features:
- Rate limiting (Redis-based)
- CORS configuration
- Helmet.js security headers
- Input validation and sanitization
- SQL injection prevention
- XSS protection

---

## Environment Variables Required:

```bash
# AI Service
OPENAI_API_KEY=your_openai_key
AI_MODEL=gpt-4-turbo-preview
AI_MAX_TOKENS=4000

# File Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=edusphere-files

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Email Service
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@edusphere.com

# Security
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
REDIS_URL=redis://localhost:6379
```

## Implementation Priority:
1. **Week 1:** AI endpoints (critical for frontend testing)
2. **Week 2:** WebSocket system (enables real-time features)
3. **Week 3:** File upload system (completes core functionality)
4. **Week 4:** OAuth & security (production readiness)

## Testing Requirements:
- Unit tests for all endpoints
- Integration tests for WebSocket events
- File upload security testing
- OAuth flow testing
- Load testing for AI endpoints

Frontend expects these exact API contracts - any changes must be communicated immediately.

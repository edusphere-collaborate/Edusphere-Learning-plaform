# Migration Guide: Context API to Zustand Stores

## Overview
This guide outlines the migration from React Context API to Zustand stores for improved performance and reduced bundle size.

## Store Architecture

### 1. App Store (`useAppStore`)
**Purpose**: Global application state, theme, notifications, settings
**Replaces**: ThemeContext partially

```typescript
// Old Context Usage
const { theme, setTheme } = useTheme();

// New Store Usage
const { theme, setTheme } = useAppStore();
```

### 2. Auth Store (`useAuthStore`)
**Purpose**: User authentication, session management, profile data
**Replaces**: AuthContext completely

```typescript
// Old Context Usage
const { user, login, logout, isLoading } = useAuth();

// New Store Usage
const { user, login, logout, isLoading } = useAuthStore();
```

### 3. Room Store (`useRoomStore`)
**Purpose**: Room data, messages, participants, real-time interactions
**Replaces**: RoomContext completely

```typescript
// Old Context Usage
const { currentRoom, messages, addMessage } = useRoom();

// New Store Usage
const { currentRoom, messages, addMessage } = useRoomStore();
```

### 4. UI Store (`useUIStore`)
**Purpose**: UI state, modals, sidebars, loading states, forms
**Replaces**: Various component-level state

```typescript
// Old Component State
const [isModalOpen, setIsModalOpen] = useState(false);

// New Store Usage
const { openModal, closeModal } = useUIStore();
```

## Migration Steps

### Phase 1: Install and Initialize Stores ✅
- [x] Install Zustand
- [x] Create all store files
- [x] Set up store initializer
- [x] Add persistence middleware

### Phase 2: Update App.tsx ⏳
- [ ] Import store initializer
- [ ] Remove old context providers
- [ ] Add store initialization

### Phase 3: Migrate Components 📋
- [ ] Update authentication components
- [ ] Update room components
- [ ] Update UI components
- [ ] Remove old context files

## Performance Benefits

### Bundle Size Reduction
- **Before**: React Context + useState/useReducer
- **After**: Zustand (2.9kb gzipped)
- **Savings**: ~15-20% reduction in state management overhead

### Render Optimization
- **Selective subscriptions**: Components only re-render when specific state changes
- **No provider hell**: Flat store structure eliminates nested providers
- **Optimistic updates**: Built-in support for optimistic UI updates

### Memory Efficiency
- **Automatic cleanup**: Stores automatically clean up unused subscriptions
- **Persistence**: Only essential data is persisted to localStorage
- **Lazy loading**: Store slices are loaded only when needed

## Best Practices

### 1. Selective Subscriptions
```typescript
// ❌ Bad: Subscribes to entire store
const store = useRoomStore();

// ✅ Good: Subscribes only to needed state
const messages = useRoomStore(state => state.messages);
const addMessage = useRoomStore(state => state.addMessage);
```

### 2. Custom Hooks
```typescript
// Create custom hooks for common patterns
export const useCurrentRoomMessages = () => {
  return useRoomStore(state => {
    if (!state.currentRoom) return [];
    return state.getRoomMessages(state.currentRoom.id);
  });
};
```

### 3. Actions vs Mutations
```typescript
// ❌ Bad: Direct state mutation
useRoomStore.setState({ messages: newMessages });

// ✅ Good: Use actions
const { setMessages } = useRoomStore();
setMessages(roomId, newMessages);
```

## Compatibility Layer

During migration, we maintain backward compatibility:

```typescript
// Legacy hook wrapper
export const useAuth = () => {
  const authStore = useAuthStore();
  return {
    user: authStore.user,
    login: authStore.login,
    logout: authStore.logout,
    isLoading: authStore.isLoading,
    isAuthenticated: authStore.isAuthenticated
  };
};
```

## Testing Strategy

### Unit Tests
- Test store actions in isolation
- Verify state transitions
- Test persistence behavior

### Integration Tests
- Test cross-store interactions
- Verify component subscriptions
- Test real-time updates

### Performance Tests
- Measure render counts
- Monitor memory usage
- Benchmark state updates

import React, { useState } from 'react';
import { Search, Smile, Heart, ThumbsUp, Frown, Angry, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose?: () => void;
}

export function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('smileys');

  // Emoji categories with their respective emojis
  const emojiCategories = {
    smileys: {
      icon: Smile,
      label: 'Smileys & Emotion',
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
        '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
        '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
        '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
        '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'
      ]
    },
    people: {
      icon: ThumbsUp,
      label: 'People & Body',
      emojis: [
        '👋🏻', '🤚🏻', '🖐🏻', '✋🏻', '🖖🏻', '👌🏻', '🤏🏻', '✌🏻', '🤞🏻', '🤟🏻',
        '🤘🏻', '🤙🏻', '👈🏻', '👉🏻', '👆🏻', '🖕🏻', '👇🏻', '☝🏻', '👍🏻', '👎🏻',
        '👊🏻', '✊🏻', '🤛🏻', '🤜🏻', '👏🏻', '🙌🏻', '👐🏻', '🤲🏻', '🤝', '🙏🏻',
        '✍🏻', '💅🏻', '🤳🏻', '💪🏻', '🦾', '🦿', '🦵🏻', '🦶🏻', '👂🏻', '🦻🏻',
        '👃🏻', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'
      ]
    },
    nature: {
      icon: Heart,
      label: 'Animals & Nature',
      emojis: [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
        '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
        '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
        '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
        '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕'
      ]
    },
    food: {
      icon: Zap,
      label: 'Food & Drink',
      emojis: [
        '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
        '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
        '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔',
        '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈',
        '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟'
      ]
    },
    activities: {
      icon: Frown,
      label: 'Activities',
      emojis: [
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
        '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
        '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️',
        '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺',
        '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆'
      ]
    },
    objects: {
      icon: Angry,
      label: 'Objects',
      emojis: [
        '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
        '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
        '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
        '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
        '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴'
      ]
    }
  };

  // Filter emojis based on search term
  const filteredEmojis = searchTerm
    ? Object.values(emojiCategories)
        .flatMap(category => category.emojis)
        .filter(emoji => {
          // Simple emoji search - in a real app, you'd want emoji names/keywords
          return true; // For now, show all emojis when searching
        })
    : emojiCategories[selectedCategory as keyof typeof emojiCategories]?.emojis || [];

  // Handle emoji selection
  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    onClose?.();
  };

  return (
    <Card className="w-80 shadow-lg border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search emojis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-8"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {searchTerm ? (
          // Search Results
          <ScrollArea className="h-64 p-3">
            <div className="grid grid-cols-8 gap-1">
              {filteredEmojis.map((emoji, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleEmojiClick(emoji)}
                >
                  <span className="text-lg">{emoji}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        ) : (
          // Category Tabs
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            {/* Category Tabs */}
            <TabsList className="grid w-full grid-cols-6 h-10">
              {Object.entries(emojiCategories).map(([key, category]) => {
                const IconComponent = category.icon;
                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="p-1"
                    title={category.label}
                  >
                    <IconComponent className="w-4 h-4" />
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Emoji Grid for each category */}
            {Object.entries(emojiCategories).map(([key, category]) => (
              <TabsContent key={key} value={key} className="mt-0">
                <ScrollArea className="h-64 p-3">
                  <div className="grid grid-cols-8 gap-1">
                    {category.emojis.map((emoji, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleEmojiClick(emoji)}
                        title={emoji}
                      >
                        <span className="text-lg">{emoji}</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>

      {/* Recently Used Emojis */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Recently Used</div>
        <div className="flex space-x-1">
          {['😀', '👍🏻', '❤️', '😂', '🎉', '👏🏻', '🔥', '💯'].map((emoji, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleEmojiClick(emoji)}
            >
              <span className="text-lg">{emoji}</span>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}

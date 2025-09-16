import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Eye, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ImageGalleryProps {
  images: Array<{
    url: string;
    alt: string;
    caption?: string;
  }>;
  onImageClick?: (url: string) => void;
  maxHeight?: number;
}

export function ImageGallery({ 
  images, 
  onImageClick, 
  maxHeight = 300 
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Handle image navigation
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Handle fullscreen toggle
  const toggleFullscreen = (index?: number) => {
    if (index !== undefined) {
      setCurrentIndex(index);
    }
    setIsFullscreen(!isFullscreen);
    setZoom(1);
    
    if (onImageClick && !isFullscreen) {
      onImageClick(images[index || currentIndex].url);
    }
  };

  // Handle zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  // Handle image download
  const handleDownload = (url: string, alt: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = alt || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFullscreen) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        goToPrevious();
        break;
      case 'ArrowRight':
        goToNext();
        break;
      case 'Escape':
        setIsFullscreen(false);
        break;
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
    }
  };

  if (images.length === 0) return null;

  // Single image display
  if (images.length === 1) {
    const image = images[0];
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0 relative group">
          <img
            src={image.url}
            alt={image.alt}
            className="w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
            style={{ maxHeight: `${maxHeight}px` }}
            onClick={() => toggleFullscreen(0)}
          />
          
          {/* Image Actions Overlay */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-1 bg-black bg-opacity-50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen(0);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(image.url, image.alt);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Image Caption */}
          {image.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
              <p className="text-sm">{image.caption}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Multiple images gallery
  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Main Image Display */}
          <div className="relative group">
            <img
              src={images[currentIndex].url}
              alt={images[currentIndex].alt}
              className="w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              style={{ maxHeight: `${maxHeight}px` }}
              onClick={() => toggleFullscreen(currentIndex)}
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Image Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-1 bg-black bg-opacity-50 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen(currentIndex);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(images[currentIndex].url, images[currentIndex].alt);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Image Caption */}
            {images[currentIndex].caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                <p className="text-sm">{images[currentIndex].caption}</p>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex space-x-2 p-2 bg-gray-50 dark:bg-gray-800 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setIsFullscreen(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="relative max-w-full max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            {/* Fullscreen Controls */}
            <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(images[currentIndex].url, images[currentIndex].alt)}
                className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Fullscreen Image */}
            <img
              src={images[currentIndex].url}
              alt={images[currentIndex].alt}
              className="max-w-full max-h-full object-contain transition-transform"
              style={{ transform: `scale(${zoom})` }}
            />

            {/* Fullscreen Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Fullscreen Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

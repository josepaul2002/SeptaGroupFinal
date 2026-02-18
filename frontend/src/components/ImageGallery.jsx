import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

export default function ImageGallery({ images, className = "" }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openLightbox = (index) => {
    setActiveIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };

  const goNext = () => setActiveIndex((i) => (i + 1) % images.length);
  const goPrev = () => setActiveIndex((i) => (i - 1 + images.length) % images.length);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`} data-testid="image-gallery">
        {images.map((img, i) => {
          const src = typeof img === 'string' ? img : img.url;
          const caption = typeof img === 'object' ? img.caption?.en : null;
          
          return (
            <button
              key={i}
              onClick={() => openLightbox(i)}
              className="group relative aspect-[4/3] overflow-hidden bg-[#E8E6E0] cursor-zoom-in"
              data-testid={`gallery-image-${i}`}
            >
              <img
                src={src}
                alt={caption || `Gallery image ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn
                  size={24}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  strokeWidth={1.5}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          data-testid="lightbox"
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-10"
            data-testid="lightbox-close"
          >
            <X size={28} strokeWidth={1.5} />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/50 text-sm font-inter">
            {activeIndex + 1} / {images.length}
          </div>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-4 text-white/70 hover:text-white p-2 z-10"
                data-testid="lightbox-prev"
              >
                <ChevronLeft size={40} strokeWidth={1} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-4 text-white/70 hover:text-white p-2 z-10"
                data-testid="lightbox-next"
              >
                <ChevronRight size={40} strokeWidth={1} />
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={typeof images[activeIndex] === 'string' ? images[activeIndex] : images[activeIndex].url}
              alt={`Gallery ${activeIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain"
            />
            {typeof images[activeIndex] === 'object' && images[activeIndex].caption?.en && (
              <p className="text-white/60 text-sm font-inter text-center mt-4">
                {images[activeIndex].caption.en}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

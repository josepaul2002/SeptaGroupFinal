import { Eye, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PreviewBanner({ type, slug, onClose }) {
  return (
    <div className="fixed top-16 left-0 right-0 z-50 bg-[#8A8A8A] text-white" data-testid="preview-banner">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye size={16} strokeWidth={1.5} />
          <span className="text-sm font-inter font-medium">
            Preview Mode — This {type} is not published yet
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={`/admin`}
            className="text-xs font-inter font-medium uppercase tracking-wider hover:text-white/80 transition-colors flex items-center gap-1"
          >
            Back to Admin <ExternalLink size={12} />
          </Link>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { FileText, Lock, Eye, Download, X, Mail } from 'lucide-react';

export default function PlanDrawings({
  plans = [],
  plansPublic = false,
  projectTitle = "",
  className = ""
}) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showAccessRequest, setShowAccessRequest] = useState(false);

  if (!plans || plans.length === 0) return null;

  const handleViewPlan = (plan) => {
    if (plansPublic) {
      setSelectedPlan(plan);
    } else {
      setShowAccessRequest(true);
    }
  };

  return (
    <div className={className} data-testid="plan-drawings">
      {/* Plans Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {plans.map((plan, i) => {
          const url = typeof plan === 'string' ? plan : plan.url;
          const caption = typeof plan === 'object' ? plan.caption?.en : `Plan ${i + 1}`;
          
          return (
            <button
              key={i}
              onClick={() => handleViewPlan({ url, caption })}
              className="group relative aspect-[4/3] bg-[#F3F0E8] border border-[#A7ADB5]/20 overflow-hidden"
              data-testid={`plan-item-${i}`}
            >
              {/* Blurred preview if not public */}
              <div className={`w-full h-full ${!plansPublic ? 'blur-sm' : ''}`}>
                {url.endsWith('.pdf') ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#E8E6E0]">
                    <FileText size={32} className="text-[#A7ADB5]" strokeWidth={1} />
                    <p className="text-xs font-inter text-[#A7ADB5] mt-2">PDF Document</p>
                  </div>
                ) : (
                  <img
                    src={url}
                    alt={caption}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Watermark overlay for public plans */}
              {plansPublic && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <p className="text-[#1F2328]/10 text-xs font-inter rotate-[-30deg] whitespace-nowrap">
                    SEPTA GROUP - REFERENCE ONLY
                  </p>
                </div>
              )}

              {/* Lock overlay for private plans */}
              {!plansPublic && (
                <div className="absolute inset-0 bg-[#1F2328]/50 flex flex-col items-center justify-center gap-2">
                  <Lock size={24} className="text-white/70" strokeWidth={1.5} />
                  <p className="text-xs font-inter text-white/70">Request Access</p>
                </div>
              )}

              {/* View icon for public */}
              {plansPublic && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Eye
                    size={24}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    strokeWidth={1.5}
                  />
                </div>
              )}

              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/90 px-3 py-2">
                <p className="text-xs font-inter text-[#1F2328] truncate">{caption}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Disclaimer */}
      <p className="text-xs font-inter text-[#A7ADB5] mt-4">
        {plansPublic
          ? "Plans are for reference only. Watermarked. Do not reproduce without permission."
          : "Plan drawings are available upon request for qualified enquiries."}
      </p>

      {/* Plan Viewer Modal (Public) */}
      {selectedPlan && plansPublic && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedPlan(null)}
          data-testid="plan-viewer-modal"
        >
          <button
            onClick={() => setSelectedPlan(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
          >
            <X size={28} strokeWidth={1.5} />
          </button>

          <div className="max-w-5xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            {/* Watermark banner */}
            <div className="bg-[#C6A15B] text-white text-xs font-inter font-medium py-2 px-4 text-center">
              SEPTA GROUP - REFERENCE ONLY - DO NOT REPRODUCE
            </div>

            {selectedPlan.url.endsWith('.pdf') ? (
              <div className="bg-white p-8 text-center">
                <FileText size={64} className="text-[#A7ADB5] mx-auto mb-4" strokeWidth={1} />
                <p className="text-lg font-sora text-[#1F2328] mb-2">{selectedPlan.caption}</p>
                <a
                  href={selectedPlan.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#0F5E5B] text-sm font-inter hover:underline"
                >
                  <Download size={14} /> Open PDF
                </a>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={selectedPlan.url}
                  alt={selectedPlan.caption}
                  className="max-w-full"
                />
                {/* Diagonal watermark overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(5)].map((_, i) => (
                    <p
                      key={i}
                      className="absolute text-black/5 text-lg font-inter whitespace-nowrap"
                      style={{
                        transform: 'rotate(-30deg)',
                        top: `${20 + i * 25}%`,
                        left: `${-10 + i * 15}%`
                      }}
                    >
                      SEPTA GROUP - REFERENCE ONLY - SEPTA GROUP - REFERENCE ONLY
                    </p>
                  ))}
                </div>
              </div>
            )}

            <p className="text-white/50 text-sm font-inter text-center mt-4">
              {selectedPlan.caption}
            </p>
          </div>
        </div>
      )}

      {/* Access Request Modal (Private) */}
      {showAccessRequest && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowAccessRequest(false)}
          data-testid="access-request-modal"
        >
          <div
            className="bg-white max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <Lock size={24} className="text-[#C6A15B]" />
              <h3 className="text-lg font-sora font-medium text-[#1F2328]">
                Request Plan Access
              </h3>
            </div>

            <p className="text-sm font-inter text-[#1F2328]/60 mb-6">
              Detailed plans for <strong>{projectTitle}</strong> are available to qualified enquiries.
              Please contact us to request access.
            </p>

            <div className="space-y-3">
              <a
                href={`/contact?request=plans&project=${encodeURIComponent(projectTitle)}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#0F5E5B] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#0D4E4C] transition-colors"
              >
                <Mail size={14} /> Request Access via Enquiry
              </a>
              <button
                onClick={() => setShowAccessRequest(false)}
                className="w-full px-4 py-2 text-[#A7ADB5] text-xs font-inter"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs font-inter text-[#A7ADB5] mt-6 text-center">
              Access is granted at Septa's discretion based on project relevance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

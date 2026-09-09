import { Trash2, Loader2 } from 'lucide-react';
import { useAdminTestimonials, getText } from '../../hooks/useApi';

export default function TestimonialsTab({ token }) {
  const { testimonials, loading, deleteTestimonial } = useAdminTestimonials(token);

  if (loading) {
    return (
      <div className="bg-white border border-[#8A8A8A]/20 p-12 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#606060]" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#8A8A8A]/20 p-6" data-testid="testimonials-tab">
      <h2 className="text-lg font-sora font-medium text-[#050505] mb-6">Testimonials ({testimonials.length})</h2>

      {testimonials.length === 0 ? (
        <p className="text-sm text-[#8A8A8A] py-8 text-center">No testimonials yet</p>
      ) : (
        <div className="space-y-4">
          {testimonials.map(t => (
            <div key={t.id} className="p-4 border border-[#8A8A8A]/20" data-testid={`testimonial-row-${t.id}`}>
              <p className="text-sm font-inter text-[#050505]/80 italic mb-3">"{getText(t.content)}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-inter font-medium text-[#050505]">{t.client_name}</p>
                  <p className="text-xs text-[#8A8A8A]">{t.client_role}</p>
                </div>
                <button
                  onClick={() => { if (window.confirm('Delete this testimonial?')) deleteTestimonial(t.id); }}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

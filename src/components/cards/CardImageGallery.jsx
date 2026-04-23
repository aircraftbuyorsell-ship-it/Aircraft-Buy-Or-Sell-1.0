import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Upload, X, ImagePlus, Loader2 } from "lucide-react";
import { useCardPermissions } from "@/lib/useCardPermissions";

/**
 * Image gallery for an ATI card. Privileged users (owner/operator/broker/issuer/admin)
 * can upload and remove images. Everyone else sees a read-only grid with lightbox.
 */
export default function CardImageGallery({ card }) {
  const qc = useQueryClient();
  const { canEdit } = useCardPermissions(card);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const images = card?.image_attachments || [];

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const urls = [];
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          setError(`"${file.name}" is larger than 10 MB`);
          continue;
        }
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      }
      if (urls.length) {
        await base44.entities.ATICard.update(card.id, {
          image_attachments: [...images, ...urls],
        });
        qc.invalidateQueries({ queryKey: ["ati-card", card.listing] });
        qc.invalidateQueries({ queryKey: ["public-card"] });
      }
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async (url) => {
    if (!confirm("Remove this image from the card?")) return;
    await base44.entities.ATICard.update(card.id, {
      image_attachments: images.filter((u) => u !== url),
    });
    qc.invalidateQueries({ queryKey: ["ati-card", card.listing] });
    qc.invalidateQueries({ queryKey: ["public-card"] });
  };

  if (!canEdit && images.length === 0) return null;

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">
          Card Images & Documents
        </p>
        {canEdit && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-[#0B2D5B] hover:bg-[#143C75] disabled:opacity-50 text-white text-[11px] uppercase tracking-wider font-black px-3 py-1.5 rounded-md transition-colors"
            >
              {uploading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading</>
              ) : (
                <><Upload className="w-3.5 h-3.5" /> Upload</>
              )}
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] text-[#C0392B] text-xs rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-black/10 hover:border-[#E8A83A] rounded-xl py-10 flex flex-col items-center justify-center text-[#AAA49C] hover:text-[#E8A83A] transition-colors"
        >
          <ImagePlus className="w-8 h-8 mb-2" />
          <p className="text-xs font-semibold uppercase tracking-wider">Upload photos or scans</p>
          <p className="text-[10px] mt-0.5">JPG / PNG · up to 10 MB each</p>
        </button>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {images.map((url) => (
            <div key={url} className="relative group aspect-square bg-[#F7F4EF] rounded-lg overflow-hidden border border-black/[0.06]">
              <img
                src={url}
                alt=""
                loading="lazy"
                onClick={() => setLightbox(url)}
                className="w-full h-full object-cover cursor-zoom-in"
              />
              {canEdit && (
                <button
                  onClick={() => handleRemove(url)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setLightbox(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}
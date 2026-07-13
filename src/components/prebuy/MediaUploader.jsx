import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload } from 'lucide-react';
export default function MediaUploader({ onUploaded }) {
  const [busy,setBusy]=useState(false); const upload=async e=>{const file=e.target.files[0];if(!file)return;setBusy(true);const {file_url}=await base44.integrations.Core.UploadFile({file});await onUploaded({url:file_url,name:file.name,type:file.type,category:file.type.startsWith('image/')?'photo':file.type.startsWith('video/')?'video':'document'});setBusy(false);e.target.value='';};
  return <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold text-foreground"><Upload className="h-4 w-4"/>{busy?'Uploading…':'Upload evidence'}<input type="file" accept="image/*,video/*,.pdf,.doc,.docx" onChange={upload} className="hidden" disabled={busy}/></label>;
}
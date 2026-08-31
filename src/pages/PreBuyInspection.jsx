import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import InspectionHub from '@/components/prebuy/InspectionHub';
import InspectionWorkspace from '@/components/prebuy/InspectionWorkspace';

const invoke = payload => base44.functions.invoke('managePreBuyInspection', payload).then(r => r.data);
export default function PreBuyInspection() {
  const qc=useQueryClient(),[selected,setSelected]=useState(null),[creating,setCreating]=useState(false);
  const {data,isLoading}=useQuery({queryKey:['prebuy-inspections'],queryFn:()=>invoke({action:'list'}),refetchInterval:10000});
  const mutation=useMutation({mutationFn:invoke,onSuccess:result=>{if(result.inspection)setSelected(result.inspection);setCreating(false);qc.invalidateQueries({queryKey:['prebuy-inspections']});}});
  useEffect(()=>{const id=new URLSearchParams(location.search).get('id');if(id&&!selected)invoke({action:'get',id}).then(r=>setSelected(r.inspection));},[selected]);
  if(isLoading&&!selected)return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading inspection workspaces…</div>;
  const error=mutation.error?.response?.data?.error||mutation.error?.message;
  return <><div aria-live="polite">{error&&<div className="mx-auto mt-4 max-w-5xl rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}{mutation.data?.warning&&<div className="mx-auto mt-4 max-w-5xl rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{mutation.data.warning}</div>}</div>{selected?<InspectionWorkspace report={selected} busy={mutation.isPending} onBack={()=>setSelected(null)} action={(action,data={})=>mutation.mutate({action,id:selected.id,...data})}/>:<InspectionHub inspections={data?.inspections||[]} creating={creating} setCreating={setCreating} busy={mutation.isPending} onCreate={payload=>mutation.mutate({action:'create',appUrl:window.location.origin,...payload})} onOpen={setSelected}/>}</>;
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { nNumber } = await req.json();
    
    if (!nNumber || typeof nNumber !== 'string') {
      return Response.json({ source: 'service_bulletins', data: null, fetched_at: new Date().toISOString(), status: 'error', error: 'nNumber is required' }, { status: 400 });
    }

    const cleanN = nNumber.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();

    let make = null;
    let model = null;
    
    try {
      const regResult = await base44.functions.invoke('getFAARegistration', { nNumber: cleanN });
      if (regResult?.data?.manufacturer) make = regResult.data.manufacturer;
      if (regResult?.data?.model) model = regResult.data.model;
    } catch (_) {
      // Continue without
    }

    // TODO: Replace with Supabase query when credentials are provided
    // This function will query the Service Bulletins reference database in Supabase
    // const { data, error } = await supabase
    //   .from('service_bulletins')
    //   .select('*')
    //   .or(`manufacturer.ilike.%${make}%,model.ilike.%${model}%`);
    
    const bulletins = [];

    return Response.json({
      source: 'service_bulletins',
      data: {
        n_number: cleanN,
        make,
        model,
        total_bulletins: bulletins.length,
        bulletins
      },
      fetched_at: new Date().toISOString(),
      status: 'data_unavailable',
      note: 'Supabase integration pending — credentials needed'
    });
  } catch (error) {
    return Response.json({
      source: 'service_bulletins',
      data: null,
      fetched_at: new Date().toISOString(),
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
});
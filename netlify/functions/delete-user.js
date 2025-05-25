import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // OJO, aquí debe ser la Service Role Key
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { userId } = req.body;

  // 1. Borra el perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    return res.status(500).json({ error: 'Error borrando profile' });
  }

  // 2. Borra el usuario de Auth
  const { error: userError } = await supabase.auth.admin.deleteUser(userId);

  if (userError) {
    return res.status(500).json({ error: 'Error borrando auth.user' });
  }

  res.status(200).json({ success: true });
}
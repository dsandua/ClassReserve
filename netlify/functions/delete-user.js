const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Aquí tu Service Role Key
);

exports.handler = async function(event, context) {
  console.log("Función llamada. Event:", event.body);

  if (event.httpMethod !== "POST") {
    console.log("Método no permitido");
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' }),
    };
  }

  let userId;
  try {
    userId = JSON.parse(event.body).userId;
    console.log("userId recibido:", userId);
  } catch (err) {
    console.log("No se ha recibido el userId:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No se ha recibido el userId' }),
    };
  }

  // 1. Borra el perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    console.log("Error borrando profile:", profileError);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error borrando profile', detalle: profileError }),
    };
  } else {
    console.log("Perfil borrado correctamente");
  }

  // 2. Borra el usuario de Auth
  const { error: userError } = await supabase.auth.admin.deleteUser(userId);

  if (userError) {
    console.log("Error borrando auth.user:", userError);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error borrando auth.user', detalle: userError }),
    };
  } else {
    console.log("Usuario auth borrado correctamente");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};

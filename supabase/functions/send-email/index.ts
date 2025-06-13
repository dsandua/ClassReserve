import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { to, subject, body } = await req.json()

    // For testing purposes, only send emails to verified addresses
    // In production, you should verify your own domain at resend.com/domains
    const allowedTestEmails = ['dsandua@gmail.com'] // Add your verified email addresses here
    const isTestingMode = true // Set to false when you have a verified domain
    
    if (isTestingMode && !allowedTestEmails.includes(to)) {
      console.log(`Email would be sent to ${to} with subject: ${subject}`)
      console.log(`Email body: ${body}`)
      
      // Return success but don't actually send the email
      return new Response(JSON.stringify({ 
        message: 'Email logged (testing mode)', 
        recipient: to,
        subject: subject 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev', // Change this to your verified domain email when ready
        to: [to],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">📚 Clases Online</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="white-space: pre-line; line-height: 1.6; color: #333;">
                ${body}
              </div>
              <hr style="margin: 30px 0; border: none; height: 1px; background: #e0e0e0;">
              <p style="font-size: 12px; color: #888; margin: 0;">
                Este email fue enviado automáticamente. No respondas a este mensaje.
              </p>
            </div>
          </div>
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
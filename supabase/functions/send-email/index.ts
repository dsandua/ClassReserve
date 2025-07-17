const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { to, subject, body } = await req.json()

    // Validate required fields
    if (!to || !subject || !body) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: to, subject, body' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if RESEND_API_KEY is available
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email service not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // For testing purposes, only send emails to verified addresses
    // In production, you should verify your own domain at resend.com/domains
    const allowedTestEmails = ['dsandua@gmail.com'] // Add your verified email addresses here
    const isTestingMode = true // Set to false when you have a verified domain
    
    if (isTestingMode && !allowedTestEmails.includes(to)) {
      console.log(`Email would be sent to ${to} with subject: ${subject}`)
      console.log(`Email body: ${body}`)
      
      // Return success but don't actually send the email
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Email logged (testing mode)', 
        recipient: to,
        subject: subject 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    try {
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
        const errorText = await response.text()
        console.error('Resend API error:', errorText)
        
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Failed to send email: ${response.status} ${response.statusText}` 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const data = await response.json()
      return new Response(JSON.stringify({ 
        success: true, 
        data: data 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } catch (fetchError) {
      console.error('Network error calling Resend API:', fetchError)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Network error sending email' 
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
import emailjs from '@emailjs/browser'

// EmailJS Configuration (Users can set these in .env or settings)
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_ghatalaba'
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_message_alert'
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''

export async function sendEmailNotification({
  toEmail,
  toName,
  fromName,
  subject,
  messageText,
  cityName,
  type = 'message', // 'message' | 'area_housing' | 'area_roommate'
}) {
  const templateParams = {
    to_email: toEmail || '',
    to_name: toName || 'Student',
    from_name: fromName || 'Gha Talaba Member',
    subject: subject || 'New Notification on Gha Talaba',
    message: messageText || '',
    city: cityName || 'Morocco',
    type: type,
    app_url: window.location.origin,
  }

  // If public key is provided, send via EmailJS
  if (PUBLIC_KEY) {
    try {
      const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
      console.log('📧 EmailJS notification sent successfully:', response.status, response.text)
      return { success: true }
    } catch (err) {
      console.warn('⚠️ EmailJS failed to send email:', err)
      return { success: false, error: err }
    }
  } else {
    // Graceful simulated delivery log when keys are not set yet
    console.log('📧 [EmailJS Simulation Mode] Email notification prepared:', {
      to: toEmail || toName,
      from: fromName,
      type,
      subject,
      messageText,
    })
    return { success: true, simulated: true }
  }
}

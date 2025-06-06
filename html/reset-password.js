module.exports = ({ fullname, resetUrl }) => {
  const subject = 'Reset Password Akun She Salon';
  const text = `Halo ${fullname},\n\nKami menerima permintaan reset password akun Anda. Silakan klik link berikut untuk mengatur password baru:\n${resetUrl}\n\nLink ini hanya berlaku selama 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.`;
  const html = `<p>Halo <b>${fullname}</b>,</p>
    <p>Kami menerima permintaan reset password akun Anda.</p>
    <p><a href="${resetUrl}" style="background:#e91e63;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Reset Password</a></p>
    <p>Atau salin link berikut ke browser Anda:<br><code>${resetUrl}</code></p>
    <p><small>Link ini hanya berlaku selama 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.</small></p>`;
  return { subject, text, html };
};

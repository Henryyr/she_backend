const { sendTestEmailToUser } = require('../../services/user/emailService');

const testEmailController = async (req, res) => {
    try {
        const user = req.user; // Dapatkan user dari middleware auth
        await sendTestEmailToUser(user);
        res.status(200).json({ message: "Test email berhasil dikirim ke " + user.email });
    } catch (error) {
        res.status(500).json({ error: "Gagal mengirim test email", detail: error.message });
    }
};

module.exports = {
    testEmailController
};

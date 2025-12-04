import axios from 'axios';

const sendTelegramAlert = async (botToken, groupIds, message, options = {}) => {
    const {
        parseMode = 'HTML',
        disableNotification = false,
        disableWebPagePreview = true
    } = options;

    try {
        // Kiểm tra tham số đầu vào
        if (!botToken || !groupIds || !message) {
            throw new Error('Thiếu tham số bắt buộc: botToken, groupIds, message');
        }

        if (!Array.isArray(groupIds)) {
            throw new Error('groupIds phải là một mảng');
        }

        const results = [];

        // Gửi tin nhắn đến tất cả các group
        for (const chatId of groupIds) {
            try {
                const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

                const payload = {
                    chat_id: chatId,
                    text: message,
                    parse_mode: parseMode,
                    disable_notification: disableNotification,
                    disable_web_page_preview: disableWebPagePreview
                };

                const response = await axios.post(telegramUrl, payload);

                results.push({
                    chatId,
                    success: true,
                    messageId: response.data.result.message_id,
                    status: 'Gửi thành công'
                });

            } catch (error) {
                results.push({
                    chatId,
                    success: false,
                    error: error.response?.data || error.message,
                    status: 'Gửi thất bại'
                });
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return {
            total: groupIds.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            details: results
        };

    } catch (error) {
        throw error;
    }
};

const formatAlertMessage = (title, content, level = 'INFO') => {
    const levels = {
        INFO: 'ℹ️',
        WARNING: '⚠️',
        ERROR: '🚨',
        SUCCESS: '✅'
    };
    const icon = levels[level.toUpperCase()] || levels.INFO;
    return ` ${icon} <b>${title}</b>

     <b>${content}</b> 
     
    ⏰ <b>${new Date().toLocaleString('vi-VN')}</b>
    `.trim();
};

module.exports = { sendTelegramAlert, formatAlertMessage };

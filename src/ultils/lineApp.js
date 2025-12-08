import axios from 'axios';

const sendLineAlert = async (channelAccessToken, groupIds, message, options = {}) => {
    const {
        notificationDisabled = false,
        retry = 3
    } = options;

    try {
        // Kiểm tra tham số đầu vào
        if (!channelAccessToken || !groupIds || !message) {
            throw new Error('Thiếu tham số bắt buộc: channelAccessToken, groupIds, message');
        }

        if (!Array.isArray(groupIds)) {
            throw new Error('groupIds phải là một mảng');
        }

        const results = [];

        // Gửi tin nhắn đến tất cả các group/user
        for (const userId of groupIds) {
            let attempt = 0;
            let success = false;

            while (attempt < retry && !success) {
                try {
                    const lineUrl = 'https://api.line.me/v2/bot/message/push';

                    const payload = {
                        to: userId,
                        messages: [
                            {
                                type: 'text',
                                text: message
                            }
                        ],
                        notificationDisabled: notificationDisabled
                    };

                    const config = {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${channelAccessToken}`
                        }
                    };

                    const response = await axios.post(lineUrl, payload, config);

                    results.push({
                        userId,
                        success: true,
                        status: response.status,
                        attempt: attempt + 1,
                        message: 'Gửi thành công'
                    });

                    success = true;

                } catch (error) {
                    attempt++;
                    if (attempt >= retry) {
                        results.push({
                            userId,
                            success: false,
                            error: error.response?.data || error.message,
                            status: 'Gửi thất bại sau nhiều lần thử'
                        });
                    } else {
                        // Chờ trước khi thử lại
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    }
                }
            }

            await new Promise(resolve => setTimeout(resolve, 200));
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

// Hàm tiện ích định dạng cảnh báo thông thường
const formatLineAlert = (title, content, level = 'INFO') => {
    const icons = {
        INFO: 'ℹ️',
        WARNING: '⚠️',
        ERROR: '🚨',
        SUCCESS: '✅'
    };

    const icon = icons[level.toUpperCase()] || icons.INFO;

    return `${icon} ${title}\n\n ${content}\n\n⏰ ${new Date().toLocaleString('vi-VN')}`;
};

module.exports = {
    sendLineAlert,
    formatLineAlert
};

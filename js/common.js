const CaptchaUtil = {
    generateCaptcha(canvasId) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const captchaLength = 5;
        const captchaArray = Array.from({ length: captchaLength }, () => chars[Math.floor(Math.random() * chars.length)]);
        const captchaString = captchaArray.join('');

        // 设置画布大小
        canvas.width = 150;
        canvas.height = 60;

        // 绘制背景
        ctx.fillStyle = '#f4f4f4';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制干扰线
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.6)`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        // 绘制验证码字符
        captchaArray.forEach((char, index) => {
            ctx.font = `${Math.random() * 10 + 30}px Arial`;
            ctx.fillStyle = `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.8)`;
            const x = 20 + index * 25;
            const y = 40 + Math.random() * 10;
            const angle = Math.random() * Math.PI / 6 - Math.PI / 12; // 字符倾斜角度
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillText(char, 0, 0);
            ctx.restore();
        });

        // 绘制干扰点
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.6)`;
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        return captchaString; // 返回生成的验证码字符串
    }
};

new Vue({
    el: '#app',
    data() {
        return {
            loginForm: {
                usernameOrEmail: '',
                password: '',
                captchaInput: '' // 用户输入的验证码
            },
            generatedCaptcha: '' // 当前生成的验证码
        };
    },
    mounted() {
        this.refreshCaptcha(); // 页面加载时生成验证码
    },
    methods: {
        // 登录逻辑
        async handleLogin() {
            const { usernameOrEmail, password, captchaInput } = this.loginForm;

            // ① 用户的输入框必填项不能为空
            if (!usernameOrEmail || !password || !captchaInput) {
                this.$message.error('用户的输入框必填项不能为空');
                return;
            }
            // ② 用户的验证码框不可以为空
            if (!captchaInput) {
                this.$message.error('用户的验证码框不能为空');
                return;
            }
            // ③ 输入数据的长度的检查（用户名邮箱,密码不能大于 20 字符，验证码不能大于 6 位）
            if (usernameOrEmail.length > 40 || password.length >= 20 || captchaInput.length > 6) {
                this.$message.error('数据长度过长不符合使用规范');
                return;
            }
            // ④ 用户的密码不能低于6位并且不能包含空格和=等特殊字符
            if (password.length < 6 || /\s|=/.test(password)) {
                this.$message.error('数据长度过长不符合使用规范 或包含了特殊字符');
                return;
            }

            // 验证码校验（忽略大小写）
            if (captchaInput.toLowerCase() !== this.generatedCaptcha.toLowerCase()) {
                this.$message.error('验证码错误，请重新输入！');
                this.refreshCaptcha(); // 验证码错误时重新生成
                return;
            }

            try {
                // 发送登录请求到后端
                const response = await axios.post('http://localhost:8081/yjx/user/login?usernameOrEmail='+usernameOrEmail+'&password='+password);
                const data = response.data;
                if (data.code === 200) {
                    // 登录成功，将用户信息存储到 Cookie 中
                    Cookies.set('userInfo', JSON.stringify(data.data), { expires: 7 }); // 存储7天
                    this.$message.success('登录成功！');
                    console.log('用户信息：', data.data);

                    // 跳转到主页或其他页面
                    window.location.href = '/index.html';
                } else {
                    this.$message.error(data.msg || '登录失败');
                }
            } catch (error) {
                console.error('登录请求失败：', error);
                this.$message.error('登录失败，请稍后重试！');
            }
        },
        // 刷新验证码
        refreshCaptcha() {
            this.generatedCaptcha = CaptchaUtil.generateCaptcha('captcha'); // 调用封装的工具方法
        },
    }
});
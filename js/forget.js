new Vue({
    el: '#app',
    data() {
        return {
            loginForm: {
                username: '',
                email: '',
                phone: '',
                captchaInput: '' // 用户输入的验证码
            },
            generatedCaptcha: '' // 当前生成的验证码
        };
    },
    mounted() {
        this.refreshCaptcha(); // 页面加载时生成验证码
    },
    methods: {
        // 找回密码逻辑
        async handleForgetPassword() {
            const { username, email, phone, captchaInput, password } = this.loginForm;

            // 1. 用户名，邮箱不能为空。  （手机号可以）
            if (!username || !email) {
                this.$message.error('用户名和邮箱不能为空！');
                return;
            }
            // 2. 用户名长度，邮箱长度不能大于40 字符，不能小于 4字符
            if (username.length > 40 || email.length > 40 || username.length < 4 || email.length < 4) {
                this.$message.error('输入框字符长度不合法！');
                return;
            }
            // 3. 邮箱格式必须正确
            if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
                this.$message.error('邮箱格式不正确！');
                return;
            }
            // 4. 手机号如果填写了手机号格式必须正确
            if (phone) {
                if (!/^((\+|00)86)?1[3-9]\d{9}$/.test(phone)) {
                    this.$message.error('手机号格式不正确！');
                    return;
                }
            }
            // 5. 验证码不能为空
            if (!captchaInput) {
                this.$message.error('验证码不能为空！');
                return;
            }
            // 6. 验证码长度不能大于 6
            if (captchaInput.length > 6) {
                this.$message.error('验证码长度不能大于6！');
                return;
            }
            // 7. 验证码应该忽略大小写判断
            if (captchaInput.toLowerCase() !== this.generatedCaptcha.toLowerCase()) {
                this.$message.error('验证码错误！');
                return;
            }
            // 8. 密码不能为空
            if (!password) {
                this.$message.error('新密码不能为空！');
                return;
            }
            // 9. 用户密码的长度不能超过 30 字符并且最低长度不能小于 6 个字符
            if (password.length < 6 || password.length > 30 || /\s|=/.test(password)) {
                this.$message.error('密码长度应该在6-30之间！不能含有特殊字符');
                return;
            }
            // 10. 用户密码必须要包含至少一个英文字符
            if (!/[a-zA-Z]/.test(password)){
                this.$message.error('密码必须包含至少一个英文字符！');
                return;
            }

            // 向后端请求发送找回密码请求
            try {
                const response = await axios.post("http://localhost:8081/yjx/user/updatePassword?userEmail="+email+"&userNewPassword="+password+"&userPhone=");
                const data = response.data.code;
                if (data === 200) {
                    this.$message.success('找回密码成功！');
                    window.location.href = '/login.html';
                    // this.$router.push('/login'); // 找回密码成功后跳转到登录页面
                } else {
                    this.$message.error('找回密码失败！');
                }
            } catch (error) {
                this.$message.error('找回密码失败！');
            }

        },
        // 刷新验证码
        refreshCaptcha() {
            this.generatedCaptcha = CaptchaUtil.generateCaptcha('captcha'); // 调用封装的工具方法
        }
    }
});
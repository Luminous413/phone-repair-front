new Vue({
  el: "#app",
  data() {
    return {
      registerForm: {
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        captchaInput: "", // 用户输入的验证码
      },
      generatedCaptcha: "", // 当前生成的验证码
    };
  },
  mounted() {
    this.refreshCaptcha(); // 页面加载时生成验证码
  },
  methods: {
    // 处理注册逻辑
    async handleRegister() {
      const { username, email, password, confirmPassword, captchaInput } =
        this.registerForm;

      // ① 用户名，邮箱，密码，确认密码，不能为空
      if (!username || !email || !password || !confirmPassword) {
        this.$message.error("用户名、邮箱、密码、确认密码不能为空！");
        return;
      }
      // ② 验证码不能为空
      if (!captchaInput) {
        this.$message.error("验证码不能为空！");
        return;
      }

      // ③ 用户名的长度不能超过30字符并且最低长度不能小于4个字符
      if (username.length < 4 || username.length > 30) {
        this.$message.error("用户名长度必须在4到30个字符之间！");
        return;
      }

      // ④ 用户密码的长度不能超过30字符并且最低长度不能小于6个字符 不能包含特殊字符
      // /\s|=/.test(password)
      if (password.length < 6 || password.length > 30 || /\s|=/.test(password)) {
        this.$message.error("密码长度必须在6到30个字符之间！或者包含特殊字符");
      }

      // ⑤ 用户密码必须要包含至少一个英文字符
      if (!/[a-zA-Z]/.test(password)) {
        this.$message.error("密码必须包含至少一个英文字符！");
        return;
      }

      // ⑥ 用户确认密码必须要和密码一致
      if (password !== confirmPassword) {
        this.$message.error("确认密码和密码不一致！");
        return;
      }

      // ⑦ 邮箱格式验证
      if (!/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email)) {
        this.$message.error("邮箱格式不正确！");
        return;
      }

      // ⑧ 验证码应该忽略大小写
      if (captchaInput.toLowerCase() !== this.generatedCaptcha.toLowerCase()) {
        this.$message.error("验证码错误，请重新输入！");
        this.refreshCaptcha(); // 验证码错误时重新生成
        return;
      }

      try {
        // 向后端发送注册请求
        const response = await axios.post(
          "http://localhost:8081/yjx/user/createUser",
          {
            userName: username,
            userEmail: email,
            userPasswordHash: password,
          }
        );
        const data = response.data;
        if (data.code === 200) {
          this.$message.success("注册成功！");
          window.location.href = '/page/login.html'; // 注册成功后跳转到登录页面
        } else {
          this.$message.error("注册失败：" + data.msg);
        }
      } catch (error) {
        console.error("登录请求失败：", error);
        this.$message.error("注册失败，请稍后再试" + error.msg);
      }
    },
    // 刷新验证码
    refreshCaptcha() {
      this.generatedCaptcha = CaptchaUtil.generateCaptcha("captcha"); // 调用封装的工具方法
    },
  },
});

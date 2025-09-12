new Vue({
  el: '#app',
  data() {
      return {
          activeIndex: '1-1',      // 当前导航选中的菜单项
          searchKeyword: '',     // 模糊查询关键词
          tableData: [],         // 表格数据
          loading: false,        // 加载状态
          userId: 0,             // 用户ID
          userRole: 0,           // 用户角色
          userPasswd: '',        // 用户密码
          pageNum: 1,            // 当前页码
          pageSize: 10,          // 每页显示条数
          sortField: 'created_at', // 排序字段
          sortOrder: 'desc',     // 排序顺序
          count: 0,              // 总记录数
          receptionists: [],     // 所有的接待人员
          showAddOrderDialog: false, // 是否显示添加订单对话框
          newOrder: { // 新订单数据对象数据
              phoneModel: '',
              phoneIssueDescription: '',
              receptionistId: '',
              requestStatus: '',
          },
      };
  },
  created() {
      this.fetchTableData(); // 初始化获取表格数据
      if (!Cookies.get('userInfo') || localStorage.getItem('userInfo') === 'null') {
          this.$alert('你需要在登录状态下才可以访问此网站的内容，点击确定将自动跳转到登录页面', '当前你未登录', {
              confirmButtonText: '确定',
              callback: action => {
                  window.location.href = '/page/login.html';
              }
          });
      } else {
          const userInfo = JSON.parse(decodeURIComponent(Cookies.get('userInfo')));
          this.userId = userInfo.userId;
          this.userPasswd = userInfo.userPasswd;
      }
  },
  mounted() {
      this.fetchReceptionists(); // 获取所有的接待人员
  },
  methods: {
      // 实时更新搜索关键词
      updateSearch(value) {
          this.searchKeyword = value;
          console.log(`查询来自: ${value}`);
      },

      // 搜索后端数据
      filterTable() {
          console.log(`查询来自: ${this.searchKeyword}`);
          this.fetchTableData();
      },

      // 获取表格数据，支持带参数的搜索
      fetchTableData() {
          // 从 Cookie 中获取用户信息
          const userInfoEncoded = Cookies.get('userInfo');
          if (userInfoEncoded) {
              const userInfoDecoded = decodeURIComponent(userInfoEncoded);
              const userInfo = JSON.parse(userInfoDecoded);

              this.userId = userInfo.userId;
              this.userRole = userInfo.userRole;

              console.log(`用户ID: ${this.userId}, 用户角色: ${this.userRole}`);
          }
          this.loading = true;
          console.log('使用参数从后端获取表数据:', {
              userId: this.userId,
              userRole: this.userRole,
              searchKeyword: this.searchKeyword,
              pageNum: this.pageNum,
              pageSize: this.pageSize,
              sortField: this.sortField,
              sortOrder: this.sortOrder,
          });

          // 使用 Axios 发送请求到后端
          axios.get('http://127.0.0.1:8081/yjx/repair/getAllRepair', {
              params: {
                  userId: this.userId,
                  userRole: this.userRole,
                  searchKeyword: this.searchKeyword,
                  pageNum: this.pageNum,
                  pageSize: this.pageSize,
                  sortField: this.sortField,
                  sortOrder: this.sortOrder,
              }
          })
          .then(response => {
              console.log('后端返回的数据:', response.data);
              // 假设后端返回的数据在 response.data.repairRequest
              this.tableData = response.data.data.repairRequest.map(item => ({
                  requestId: item.requestId,
                  phoneModel: item.phoneModel,
                  phoneIssueDescription: item.phoneIssueDescription,
                  userName: item.repairUserName,
                  requestStatus: item.requestStatusName,
                  receptionist: item.receptionistName,
                  createdAt: item.createdAt,
              }));
              this.count = response.data.data.count; // 总记录数
          })         
          .catch(error => {
              console.error('获取表数据时出错:', error);
              this.$message.error('获取数据失败，请稍后再试。');
          })
          .finally(() => {
              this.loading = false;
          });
      },

      handleSortChange({ prop, order }) {
          // 传递排序参数到后端
          this.sortField = prop;
          this.sortOrder = order === 'ascending' ? 'asc' : 'desc';
          this.fetchTableData();
      },

      viewOrderDetails(order) {
          this.$alert(
              `<h3>订单详情：</h3>
              订单单号：${order.requestId} <br>
              顾客姓名：${order.userName} <br>
              手机型号：${order.phoneModel} <br>
              问题描述：${order.phoneIssueDescription} <br>
              维修进度：${order.requestStatus} <br>
              接待人员：${order.receptionist} <br>
              创建时间：${order.createdAt}`,
              '订单详情',
              {
                  dangerouslyUseHTMLString: true,
                  confirmButtonText: '确定'
              }
          );
      },

      deleteOrder(order) {
          this.$prompt('请输入密码以确认删除', '删除确认', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              inputType: 'password'
          }).then(({ value }) => {
              // 密码长度不能超过30位，并且不能包含空格和=等特殊字符
              if (value.length > 30 || /\s|=/.test(value)) {
                  this.$message.error('密码格式不正确！');
                  return;
              }
              // 调用后端删除接口
              axios.post('http://127.0.0.1:8081/yjx/repair/deleteRepair', null, {
                  params: {
                      repairId: order.requestId,
                      userId: this.userId,
                      password: value
                  }
              })
              .then(response => {
                  if (response.data.code === 200) {
                      this.tableData = this.tableData.filter(o => o.requestId !== order.requestId);
                      this.$message.success('订单删除成功！');
                  } else {
                      console.error('repairId:', order.requestId);
                      console.error('密码:', value);
                      console.error('useid：', this.userId);
                      this.$message.error('删除订单失败，请稍后再试。');
                  }
              })
              .catch(() => {
                  this.$message.error('删除订单失败，请稍后再试。');
              });
          }).catch(() => {
              this.$message.info('取消删除操作');
          });
      },

      logout() {
          this.$confirm('你确定要退出登录吗？', '退出确认', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning',
          })
          .then(() => {
              Cookies.remove('userInfo');
              window.location.href = '/page/login.html';
          })
          .catch(() => {
              this.$message.info('已取消退出操作');
          });
      },

      // 分页组件方法
      handleSizeChange(val) {
          this.pageSize = val;
          this.fetchTableData();
      },
      handleCurrentChange(val) {
          this.pageNum = val;
          this.fetchTableData();
      },

      fetchReceptionists() {
          // 发送 GET 请求到后端，获取所有的接待人员
          axios.get('http://127.0.0.1:8081/yjx/repair/getAllReceptionist')
              .then(response => {
                  if (response.data.code === 200) {
                      // 确保正确赋值
                      this.receptionists = response.data.data.map(item => ({
                          userId: item.userId,
                          userName: item.userName
                      }));
                      console.log('接待人员列表:', this.receptionists);
                  } else {
                      console.error('获取接待人员失败:', response.data.msg);
                      this.$message.error('获取接待人员失败，请稍后再试。');
                  }
              })
              .catch(error => {
                  console.error('获取接待人员时出错:', error);
                  this.$message.error('获取接待人员失败，请稍后再试。');
              });
      },

      // 添加订单的方法
      addOrder() {
          this.showAddOrderDialog = true;
      },
      // 提交订单
      submitNewOrder() {
          // 发送请求到后端保存订单
          axios.post('http://127.0.0.1:8081/yjx/repair/createRepair', {
              userId: this.userId,
              receptionistId: this.newOrder.receptionistId,
              phoneModel: this.newOrder.phoneModel,
              phoneIssueDescription: this.newOrder.phoneIssueDescription
          })
          .then(response => {
              if (response.data.code === 200) {
                  this.$message.success('订单创建成功！');
                  this.showAddOrderDialog = false; // 关闭弹出框
                  this.fetchTableData(); // 更新表格数据
              } else {
                  this.$message.error('订单创建失败，请稍后再试。');
              }
          })
          .catch(error => {
              console.error('提交订单时出错:', error);
              this.$message.error('订单创建失败，请稍后再试。');
          });
      },

    // 跳转的方法
    goToIndex() { window.location.href = '/index.html'; },
    goToRepair() { window.location.href = '/page/repair.html'; },
    goToAccess() { window.location.href = '/page/access.html'; },
    goToUser() { window.location.href = '/page/user.html'; },
    goTosupplier() { window.location.href = '/page/supplier.html'; },
},
watch: {
  // 监听关键词是否超过一定数量
  searchKeyword(value) {
      if (value.length > 20) {
          this.$message.warning('搜索关键词过长！不能超过20字');
          this.searchKeyword = value.slice(0, 20);
      }
  },
  // 监听手机型号 问题描述是否超过一定数量
  'newOrder.phoneModel'(value) {
      if (value.length > 50) {
          this.$message.warning('输入字符过长！不能超过50字');
          this.newOrder.phoneModel = value.slice(0, 50);
      }
  },
  'newOrder.phoneIssueDescription'(value) {
      if (value.length > 200) {
          this.$message.warning('输入字符过长！不能超过200字');
          this.newOrder.phoneIssueDescription = value.slice(0, 100);
      }
  },
}
});
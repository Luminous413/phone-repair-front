new Vue({
  el: '#app',
  data() {
    return {
      activeIndex: '2-1',      // 当前导航选中的菜单项
      searchKeyword: '',       // 搜索关键词
      tableData: [],           // 表格数据
      loading: false,          // 加载状态
      userId: 1,               // 用户ID
      userRole: 1,             // 用户角色
      pageNum: 1,              // 当前页码
      pageSize: 10,            // 每页显示条数
      sortField: 'created_at', // 排序字段
      sortOrder: 'desc',       // 排序顺序
      count: 0,                // 总记录数
      addOrderDialog: false, // 是否显示添加订单的弹窗
      updateOrderDialog: false, // 是否显示修改订单的弹窗
      currentOrder: {}, // 当前被选中的订单数据
      newOrder: {
        repairRequestId: '',
        repairNotes: '',
        technicianId: ''
      },
      technicians: [], // 维修人列表
    };
  },
  created() {
    this.fetchTableData(); // 初始化获取表格数据
    this.fetchTechnicians(); // 初始化获取维修人列表
  },
  methods: {
    // 更新搜索关键词
    updateSearch(value) {
      this.searchKeyword = value;
    },

    // 搜索表格数据
    filterTable() {
      this.pageNum = 1; // 重置页码为第一页
      this.fetchTableData();
    },

    // 获取维修人列表
    fetchTechnicians() {
      axios.get('http://127.0.0.1:8081/yjx/management/getAllTechnician')
          .then(response => {
            if (response.data.code === 200) {
              this.technicians = response.data.data.map(item => ({
                userId: item.userId,
                technicianName: item.technicianName
              }));
            } else {
              this.$message.error(`获取维修人列表失败：${response.data.msg}`);
            }
          })
          .catch(error => {
            console.error('获取维修人列表失败:', error);
            this.$message.error('获取维修人列表失败');
          });
    },

    // 获取表格数据
    fetchTableData() {
      this.loading = true; // 显示加载状态
      axios.get('http://127.0.0.1:8081/yjx/management/getAllRepairManagement', {
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
            // 新增：打印完整响应数据，查看结构
            console.log('后端完整响应:', JSON.stringify(response.data, null, 2));

            if (response.data.code === 200) {
              // 先判断 data 是否存在，避免 undefined
              if (!response.data.data) {
                console.error('后端 data 字段不存在');
                this.$message.error('获取数据为空');
                return;
              }
              // 再判断 repairManagementList 是否存在
              if (!response.data.data.repairManagementList) {
                console.error('后端未返回 repairManagementList 字段，实际返回的字段:', Object.keys(response.data.data));
                this.$message.error('数据格式错误');
                return;
              }
              // 确认字段存在后，再执行 map
              this.tableData = response.data.data.repairManagementList.map(item => ({
                repairId: item.repairId,
                repairRequestId: item.repairRequestId,
                phoneModel: item.phoneModel,
                repairNotes: item.repairNotes,
                statusName: item.statusName,
                repairPrice: item.repairPrice,
                paymentStatus: item.paymentStatus,
                userName: item.userName,
                createdAt: item.createdAt
              }));
              this.count = response.data.data.count;
            } else {
              this.$message.error('获取数据失败，请稍后再试。');
            }
          })
      .catch(error => {
        console.error('获取数据失败:', error);
        this.$message.error('获取数据失败，请稍后再试。');
      })
      .finally(() => {
        this.loading = false; // 关闭加载状态
      });
    },

    // 查看订单详情
    viewOrderDetails(order) {
      this.$alert(
        `<h3>订单详情：</h3>
        <p>维修ID：${order.repairId}</p>
        <p>订单ID：${order.repairRequestId}</p>
        <p>手机型号：${order.phoneModel}</p>
        <p>维修描述：${order.repairNotes}</p>
        <p>维修状态：${order.statusName}</p>
        <p>订单价格：${order.repairPrice}</p>
        <p>支付状态：${order.paymentStatus}</p>
        <p>订单用户：${order.userName}</p>
        <p>创建时间：${order.createdAt}</p>`,
        '订单详情',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确定',
        }
      );
    },

    // 修改订单
    updateOrder(order) {
      // 深拷贝订单数据，确保 repair_id 被传递
      this.currentOrder = { 
        repairId: order.repairId,
        repairPrice: order.repairPrice || '', 
        paymentStatus: order.paymentStatus || '', 
        repairNotes: order.repairNotes || '', 
        technicianId: order.technicianId || this.userId, 
      };
      this.updateOrderDialog = true; // 打开弹窗
    },        

    submitUpdatedOrder() {
      // 确保 repair_id 存在
      if (!this.currentOrder.repairId) {
        this.$message.error('订单 ID 缺失，无法提交修改！');
        return;
      }
    
      axios.post('http://127.0.0.1:8081/yjx/management/updateRepairManagement', this.currentOrder, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((response) => {
          if (response.data.code === 200) {
            this.$message.success('订单修改成功！');
            this.fetchTableData(); // 刷新表格数据
            this.updateOrderDialog = false; // 关闭弹窗
          } else {
            this.$message.error(`修改失败：${response.data.message}`);
          }
        })
        .catch((error) => {
          console.error('修改订单失败:', error);
          this.$message.error(`修改订单失败：${error.response?.data?.message || error.message}`);
        });
    },

    deleteOrder(order) {
      if (!order || !order.repairId) {
        this.$message.error('订单信息错误，无法删除！');
        return;
      }
      this.$prompt('请输入密码以确认删除订单', '删除确认', {
        inputType: 'password',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      })
        .then(({ value }) => {
          const userPasswd = value; // 用户输入的密码
          if (!userPasswd) {
            this.$message.error('密码不能为空！');
            return;
          }
          axios.post(
              'http://127.0.0.1:8081/yjx/management/deleteRepairManagement',
              null, // post请求的第二个参数是请求体，这里传null（因为参数在URL）
              {
                params: { // 第三个参数是配置项，params里的参数会拼到URL后
                  repairId: order.repairId,  // 与后端@RequestParam("repairId")一致
                  userId: this.userId,       // 与后端@RequestParam("userId")一致
                  userPasswd: userPasswd     // 与后端@RequestParam("userPasswd")一致
                }
              }
          )
            .then((response) => {
              if (response.data.code === 200) {
                this.$message.success('订单删除成功！');
                this.fetchTableData(); // 刷新数据
              } else {
                this.$message.error(`删除失败：${response.data.message}`);
              }
            })
            .catch((error) => {
              console.log('repairManagementId', order.repairId)
              console.log('userId', this.userId)
              console.log('userPasswd', userPasswd)
              console.error('删除订单失败:', error);
              this.$message.error('删除订单失败，请稍后再试。');
            });
        })
        .catch(() => {
          this.$message.info('已取消删除操作');
        });
    },    

    // 排序变更
    handleSortChange({ prop, order }) {
      this.sortField = prop;
      this.sortOrder = order === 'ascending' ? 'asc' : 'desc';
      this.fetchTableData();
    },

    // 分页大小变更
    handleSizeChange(val) {
      this.pageSize = val;
      this.fetchTableData();
    },

    // 页码变更
    handleCurrentChange(val) {
      this.pageNum = val;
      this.fetchTableData();
    },

    // 添加订单（逻辑占位）
    addOrder() {
      // 打开添加订单的弹窗
      this.newOrder = {
        repairRequestId: '',
        repairNotes: '',
      }; // 重置表单数据
      this.addOrderDialog = true;
    },
    
    submitNewOrder() {
      if (!this.newOrder.repairRequestId || !this.newOrder.repairNotes) {
        this.$message.error('请填写完整信息！');
        return;
      }
      const newOrder = {
        repairRequestId: this.newOrder.repairRequestId,
        repairNotes: this.newOrder.repairNotes,
        technicianId: this.userId, // 当前用户 ID
      };
      axios.post('http://127.0.0.1:8081/yjx/management/createRepairManagement', newOrder)
        .then((response) => {
          if (response.data.code === 200) {
            this.$message.success('订单添加成功！');
            this.fetchTableData(); // 刷新表格数据
            this.addOrderDialog = false; // 关闭弹窗
          } else {
            this.$message.error(`添加失败：${response.data.message}`);
          }
        })
        .catch((error) => {
          console.error('添加订单失败:', error);
          this.$message.error('添加订单失败，请稍后重试。');
        });
    },

    // 跳转的方法
    goToIndex() { window.location.href = '/index.html'; },
    goToRepair() { window.location.href = '/page/repair.html'; },
    goToAccess() { window.location.href = '/page/access.html'; },
    goToUser() { window.location.href = '/page/user.html'; },
    goTosupplier() { window.location.href = '/page/supplier.html'; },

    // 退出登录
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
  },
});
